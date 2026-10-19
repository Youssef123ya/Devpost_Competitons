using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UXFriends.API.Support;
using UXFriends.Domain.Entities;
using UXFriends.Infrastructure.Data;

namespace UXFriends.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ChallengesController : ControllerBase
{
    private readonly UXFriendsDbContext _context;

    public ChallengesController(UXFriendsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetChallenges()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var nowUtc = DateTime.UtcNow;
        var user = await PrepareUserAsync(userId, nowUtc);
        if (user is null)
        {
            return NotFound(new { message = "User not found" });
        }

        var activeInstances = ChallengeEngine.GetActiveChallengesForUser(user, nowUtc);
        var allChallengeRecords = await _context.UserChallenges.AsNoTracking().ToListAsync();
        var userChallengeRecords = allChallengeRecords
            .Where(item => item.UserId == userId)
            .ToList();

        var participantCounts = allChallengeRecords
            .GroupBy(item => $"{item.ChallengeCode}|{item.CycleKey}", StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.Count(), StringComparer.OrdinalIgnoreCase);

        var userLookup = userChallengeRecords
            .ToDictionary(
                item => $"{item.ChallengeCode}|{item.CycleKey}",
                item => item,
                StringComparer.OrdinalIgnoreCase);

        var activeChallenges = new List<ChallengePayload>();
        foreach (var instance in activeInstances)
        {
            var key = $"{instance.Template.Code}|{instance.CycleKey}";
            userLookup.TryGetValue(key, out var record);
            if (record?.CompletedAt is not null)
            {
                continue;
            }

            activeChallenges.Add(await BuildChallengePayloadAsync(
                userId,
                instance,
                participantCounts.GetValueOrDefault(key, 0),
                record,
                nowUtc,
                completed: false,
                isCurrentCycle: true));
        }

        var completedChallenges = new List<ChallengePayload>();
        foreach (var item in userChallengeRecords
            .Where(record => record.CompletedAt is not null)
            .OrderByDescending(record => record.CompletedAt)
            .Take(12))
        {
            var challenge = CatalogContent.FindChallenge(item.ChallengeCode);
            if (challenge is null)
            {
                continue;
            }

            var key = $"{item.ChallengeCode}|{item.CycleKey}";
            var currentCycle = activeInstances.Any(active =>
                string.Equals(active.Template.Code, item.ChallengeCode, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(active.CycleKey, item.CycleKey, StringComparison.OrdinalIgnoreCase));
            var snapshot = ChallengeProgressEngine.CreateCompletedSnapshot(challenge);

            completedChallenges.Add(new ChallengePayload(
                challenge.Code,
                item.CycleKey,
                challenge.TitleAr,
                challenge.TitleEn,
                challenge.DescriptionAr,
                challenge.DescriptionEn,
                challenge.ChallengeType,
                challenge.Difficulty,
                challenge.XpReward,
                participantCounts.GetValueOrDefault(key, 0),
                true,
                true,
                item.ExpiresAt ?? item.CreatedAt.AddHours(challenge.DurationHours),
                currentCycle,
                snapshot.ObjectiveAr,
                snapshot.ObjectiveEn,
                snapshot.Current,
                snapshot.Target,
                snapshot.ProgressLabelAr,
                snapshot.ProgressLabelEn,
                false));
        }

        return Ok(new
        {
            serverNow = nowUtc,
            challenges = activeChallenges.Concat(completedChallenges)
        });
    }

    [HttpGet("{code}")]
    public async Task<IActionResult> GetChallenge(string code, [FromQuery] string? cycleKey = null)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var nowUtc = DateTime.UtcNow;
        var user = await PrepareUserAsync(userId, nowUtc);
        if (user is null)
        {
            return NotFound(new { message = "User not found" });
        }

        var activeInstances = ChallengeEngine.GetActiveChallengesForUser(user, nowUtc);
        var instance = ResolveChallengeInstance(user, activeInstances, code, cycleKey);

        if (instance is null)
        {
            return NotFound(new { message = "Challenge not found" });
        }

        var participants = await _context.UserChallenges
            .AsNoTracking()
            .CountAsync(item =>
                item.ChallengeCode == instance.Template.Code &&
                item.CycleKey == instance.CycleKey);

        var record = await _context.UserChallenges
            .AsNoTracking()
            .FirstOrDefaultAsync(item =>
                item.UserId == userId &&
                item.ChallengeCode == instance.Template.Code &&
                item.CycleKey == instance.CycleKey);

        var payload = await BuildChallengePayloadAsync(
            userId,
            instance,
            participants,
            record,
            nowUtc,
            completed: record?.CompletedAt is not null,
            isCurrentCycle: true);
        var league = LeagueEngine.GetOverview(user, nowUtc);

        return Ok(new
        {
            payload.code,
            payload.cycleKey,
            payload.titleAr,
            payload.titleEn,
            payload.descriptionAr,
            payload.descriptionEn,
            payload.challengeType,
            payload.difficulty,
            payload.xpReward,
            payload.participants,
            payload.participating,
            payload.completed,
            payload.expiresAt,
            payload.isCurrentCycle,
            payload.objectiveAr,
            payload.objectiveEn,
            payload.progressCurrent,
            payload.progressTarget,
            payload.progressLabelAr,
            payload.progressLabelEn,
            payload.readyToClaim,
            skillLevel = instance.Template.LevelBand,
            serverNow = nowUtc,
            league = new
            {
                tier = league.TierCode,
                nameAr = league.TierNameAr,
                nameEn = league.TierNameEn
            }
        });
    }

    [HttpPost("{code}/join")]
    public async Task<IActionResult> JoinChallenge(string code, [FromBody] ChallengeActionRequest? request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var nowUtc = DateTime.UtcNow;
        var user = await PrepareUserAsync(userId, nowUtc);
        if (user is null)
        {
            return NotFound(new { message = "User not found" });
        }

        var instance = ResolveChallengeInstance(
            user,
            ChallengeEngine.GetActiveChallengesForUser(user, nowUtc),
            code,
            request?.CycleKey);

        if (instance is null)
        {
            return BadRequest(new { message = "This challenge is not active for your account right now." });
        }

        var record = await _context.UserChallenges
            .FirstOrDefaultAsync(item =>
                item.UserId == userId &&
                item.ChallengeCode == instance.Template.Code &&
                item.CycleKey == instance.CycleKey);

        if (record is null)
        {
            record = new UserChallenge
            {
                UserChallengeCode = Guid.NewGuid().ToString("N"),
                UserId = userId,
                ChallengeCode = instance.Template.Code,
                CycleKey = instance.CycleKey,
                CreatedAt = nowUtc,
                ExpiresAt = instance.ExpiresAt
            };
            _context.UserChallenges.Add(record);
            await _context.SaveChangesAsync();
        }

        var participants = await _context.UserChallenges.CountAsync(item =>
            item.ChallengeCode == instance.Template.Code &&
            item.CycleKey == instance.CycleKey);

        return Ok(new
        {
            success = true,
            participating = true,
            participants,
            cycleKey = instance.CycleKey
        });
    }

    [HttpPost("{code}/complete")]
    public async Task<IActionResult> CompleteChallenge(string code, [FromBody] ChallengeActionRequest? request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var nowUtc = DateTime.UtcNow;
        var user = await PrepareUserAsync(userId, nowUtc);
        if (user is null)
        {
            return NotFound(new { message = "User not found" });
        }

        var instance = ResolveChallengeInstance(
            user,
            ChallengeEngine.GetActiveChallengesForUser(user, nowUtc),
            code,
            request?.CycleKey);

        if (instance is null)
        {
            return BadRequest(new { message = "This challenge is no longer active." });
        }

        if (instance.ExpiresAt <= nowUtc)
        {
            return BadRequest(new { message = "This challenge has already ended." });
        }

        var record = await _context.UserChallenges
            .FirstOrDefaultAsync(item =>
                item.UserId == userId &&
                item.ChallengeCode == instance.Template.Code &&
                item.CycleKey == instance.CycleKey);

        if (record is null)
        {
            return BadRequest(new { message = "Join the challenge first to participate." });
        }

        if (record.CompletedAt is not null)
        {
            return Ok(new
            {
                success = true,
                xpAwarded = 0,
                dailyGoalXpAwarded = 0,
                challengesWon = user.ChallengesWon,
                level = user.Level,
                totalXP = user.TotalXP,
                currentXP = user.CurrentXP,
                nextLevelXP = user.NextLevelXP
            });
        }

        var progress = await ChallengeProgressEngine.EvaluateAsync(
            _context,
            userId,
            instance,
            record.CreatedAt,
            nowUtc);

        if (!progress.ReadyToClaim)
        {
            return BadRequest(new
            {
                message = "You have not completed the required work for this challenge yet.",
                objectiveAr = progress.ObjectiveAr,
                objectiveEn = progress.ObjectiveEn,
                progressCurrent = progress.Current,
                progressTarget = progress.Target,
                progressLabelAr = progress.ProgressLabelAr,
                progressLabelEn = progress.ProgressLabelEn
            });
        }

        record.CompletedAt = nowUtc;
        user.ChallengesWon += 1;
        GamificationHelper.ApplyXp(user, instance.Template.XpReward);

        _context.XPLogs.Add(new XPLog
        {
            LogCode = Guid.NewGuid().ToString("N"),
            UserId = userId,
            XP = instance.Template.XpReward,
            ActivityType = "ChallengeCompleted",
            ReferenceId = $"{instance.Template.Code}:{instance.CycleKey}",
            CreatedAt = nowUtc
        });

        var dailyGoals = await DailyGoalEngine.SyncAsync(_context, user, nowUtc);
        await BadgeSyncEngine.SyncAsync(_context, user, nowUtc);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            xpAwarded = instance.Template.XpReward,
            dailyGoalXpAwarded = dailyGoals.XpAwarded,
            challengesWon = user.ChallengesWon,
            level = user.Level,
            totalXP = user.TotalXP,
            currentXP = user.CurrentXP,
            nextLevelXP = user.NextLevelXP
        });
    }

    private async Task<User?> PrepareUserAsync(string userId, DateTime nowUtc)
    {
        var user = await _context.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return null;
        }

        var changed = await LearningAccessPolicy.SyncStoredSkillLevelAsync(_context, user);
        changed = await ChallengeRewardSettlementEngine.SyncForUserAsync(_context, user, nowUtc) || changed;
        changed = LeagueEngine.EnsureEnrollment(user, nowUtc) || changed;

        if (changed)
        {
            await BadgeSyncEngine.SyncAsync(_context, user, nowUtc);
            await _context.SaveChangesAsync();
        }

        return user;
    }

    private static ActiveChallengeInstance? ResolveChallengeInstance(
        User user,
        IReadOnlyList<ActiveChallengeInstance> activeInstances,
        string code,
        string? cycleKey)
    {
        if (!string.IsNullOrWhiteSpace(cycleKey))
        {
            return activeInstances.FirstOrDefault(item =>
                string.Equals(item.Template.Code, code, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(item.CycleKey, cycleKey, StringComparison.OrdinalIgnoreCase));
        }

        return activeInstances.FirstOrDefault(item =>
            string.Equals(item.Template.Code, code, StringComparison.OrdinalIgnoreCase));
    }

    private async Task<ChallengePayload> BuildChallengePayloadAsync(
        string userId,
        ActiveChallengeInstance instance,
        int participants,
        UserChallenge? record,
        DateTime nowUtc,
        bool completed,
        bool isCurrentCycle)
    {
        var snapshot = completed
            ? ChallengeProgressEngine.CreateCompletedSnapshot(instance.Template)
            : await ChallengeProgressEngine.EvaluateAsync(
                _context,
                userId,
                instance,
                record?.CreatedAt,
                nowUtc);

        return new ChallengePayload(
            instance.Template.Code,
            instance.CycleKey,
            instance.Template.TitleAr,
            instance.Template.TitleEn,
            instance.Template.DescriptionAr,
            instance.Template.DescriptionEn,
            instance.Template.ChallengeType,
            instance.Template.Difficulty,
            instance.Template.XpReward,
            participants,
            record is not null,
            completed,
            instance.ExpiresAt,
            isCurrentCycle,
            snapshot.ObjectiveAr,
            snapshot.ObjectiveEn,
            snapshot.Current,
            snapshot.Target,
            snapshot.ProgressLabelAr,
            snapshot.ProgressLabelEn,
            !completed && snapshot.ReadyToClaim);
    }

}

public sealed record ChallengeActionRequest(string? CycleKey);
public sealed record ChallengePayload(
    string code,
    string cycleKey,
    string titleAr,
    string titleEn,
    string descriptionAr,
    string descriptionEn,
    string challengeType,
    string difficulty,
    int xpReward,
    int participants,
    bool participating,
    bool completed,
    DateTime expiresAt,
    bool isCurrentCycle,
    string objectiveAr,
    string objectiveEn,
    int progressCurrent,
    int progressTarget,
    string progressLabelAr,
    string progressLabelEn,
    bool readyToClaim);
