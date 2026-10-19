using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UXFriends.API.Support;
using UXFriends.Infrastructure.Data;

namespace UXFriends.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly UXFriendsDbContext _context;

    public DashboardController(UXFriendsDbContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return NotFound(new { message = "User not found" });
        }

        var nowUtc = DateTime.UtcNow;
        var levelChanged = await LearningAccessPolicy.SyncStoredSkillLevelAsync(_context, user);
        var pendingChallengeSettled = await ChallengeRewardSettlementEngine.SyncForUserAsync(_context, user, nowUtc);
        var leagueEnrollmentChanged = LeagueEngine.EnsureEnrollment(user, nowUtc);
        var accessSnapshot = await LearningAccessPolicy.BuildSnapshotAsync(_context, user);
        var dailyGoals = await DailyGoalEngine.SyncAsync(_context, user, nowUtc);
        var streak = await StreakEngine.SyncAsync(_context, user, nowUtc);
        var badgesAwarded = await BadgeSyncEngine.SyncAsync(_context, user, nowUtc);
        if (levelChanged || pendingChallengeSettled || leagueEnrollmentChanged || dailyGoals.XpAwarded > 0 || streak.Changed || badgesAwarded > 0)
        {
            await _context.SaveChangesAsync();
        }

        var progressRecords = await _context.LessonProgress
            .Where(item => item.UserId == userId)
            .AsNoTracking()
            .ToListAsync();

        var userChallenges = await _context.UserChallenges
            .Where(item => item.UserId == userId)
            .AsNoTracking()
            .ToListAsync();

        var allUserChallenges = await _context.UserChallenges
            .AsNoTracking()
            .ToListAsync();

        var earnedBadges = await _context.UserBadges
            .Where(item => item.UserId == userId && item.IsUnlocked)
            .CountAsync();

        var completedLessonCodes = progressRecords
            .Where(item => item.CompletedAt is not null || item.Status == "Completed")
            .Select(item => item.LessonCode)
            .ToHashSet();

        var progressLookup = progressRecords.ToDictionary(item => item.LessonCode, item => item.ProgressPercent);

        var completedLessonsThisWeek = progressRecords.Count(item =>
            item.CompletedAt is not null && item.CompletedAt.Value >= nowUtc.AddDays(-7));

        var completedChallengesThisMonth = userChallenges.Count(item =>
            item.CompletedAt is not null && item.CompletedAt.Value >= nowUtc.AddDays(-30));

        var preferredDifficulty = MapSkillLevelToDifficulty(user.SkillLevel);
        var remainingLessons = CatalogContent.Lessons
            .Where(lesson =>
                !completedLessonCodes.Contains(lesson.Code) &&
                !IsLessonLocked(lesson, accessSnapshot))
            .ToList();
        var exactMatchLessons = remainingLessons
            .Where(lesson => string.Equals(
                NormalizeDifficulty(lesson.Difficulty),
                preferredDifficulty,
                StringComparison.OrdinalIgnoreCase))
            .ToList();
        var recommendationPool = exactMatchLessons.Count > 0 ? exactMatchLessons : remainingLessons;

        var recommendedLessons = recommendationPool
            .OrderBy(lesson => GetDifficultyDistance(lesson.Difficulty, preferredDifficulty))
            .ThenByDescending(lesson => progressLookup.GetValueOrDefault(lesson.Code))
            .ThenBy(lesson => lesson.OrderNo)
            .Take(3)
            .Select(lesson => new
            {
                code = lesson.Code,
                sectionCode = CatalogContent.FindUnit(lesson.UnitCode)?.SectionCode,
                unitCode = lesson.UnitCode,
                titleAr = lesson.TitleAr,
                titleEn = lesson.TitleEn,
                descriptionAr = lesson.DescriptionAr,
                descriptionEn = lesson.DescriptionEn,
                durationMinutes = lesson.DurationMinutes,
                difficulty = lesson.Difficulty,
                progress = progressLookup.GetValueOrDefault(lesson.Code),
                xpReward = lesson.XpReward
            })
            .ToList();

        var activeChallenges = await BuildActiveChallengesAsync(user, userChallenges, allUserChallenges, nowUtc);

        var sectionCompletion = CatalogContent.Sections
            .Select(section =>
            {
                var unitCodes = CatalogContent.Units
                    .Where(unit => unit.SectionCode == section.Code)
                    .Select(unit => unit.Code)
                    .ToHashSet();
                var totalLessons = CatalogContent.Lessons.Count(lesson => unitCodes.Contains(lesson.UnitCode));
                var completedLessons = CatalogContent.Lessons.Count(lesson =>
                    unitCodes.Contains(lesson.UnitCode) &&
                    completedLessonCodes.Contains(lesson.Code));

                return new
                {
                    section.Code,
                    section.TitleAr,
                    section.TitleEn,
                    totalLessons,
                    completedLessons
                };
            })
            .OrderByDescending(item => item.completedLessons)
            .ToList();

        var strongestSection = sectionCompletion.FirstOrDefault(item => item.completedLessons > 0);
        var weakestSection = sectionCompletion
            .Where(item => item.totalLessons > 0)
            .OrderBy(item => item.completedLessons)
            .FirstOrDefault();

        return Ok(new
        {
            stats = new
            {
                lessonsCompleted = user.LessonsCompleted,
                lessonsCompletedThisWeek = completedLessonsThisWeek,
                challengesWon = user.ChallengesWon,
                challengesWonThisMonth = completedChallengesThisMonth,
                projectsCompleted = user.ProjectsCompleted,
                badgesEarned = earnedBadges
            },
            xp = new
            {
                current = user.CurrentXP,
                total = user.TotalXP,
                required = user.NextLevelXP,
                level = user.Level
            },
            streak = new
            {
                current = streak.CurrentStreak,
                longest = streak.LongestStreak,
                nextMilestone = streak.NextMilestone,
                progressPercent = streak.ProgressPercent,
                daysUntilNextReward = streak.DaysUntilNextReward,
                nextReward = streak.NextReward is null
                    ? null
                    : new
                    {
                        milestoneDays = streak.NextReward.MilestoneDays,
                        xpReward = streak.NextReward.XpReward,
                        titleAr = streak.NextReward.TitleAr,
                        titleEn = streak.NextReward.TitleEn,
                        descriptionAr = streak.NextReward.DescriptionAr,
                        descriptionEn = streak.NextReward.DescriptionEn,
                        badgeCode = streak.NextReward.BadgeCode,
                        badgeNameAr = streak.NextReward.BadgeNameAr,
                        badgeNameEn = streak.NextReward.BadgeNameEn
                    }
            },
            serverNow = nowUtc,
            todayGoals = dailyGoals.Goals.Select(goal => new
            {
                key = goal.Template.Code,
                category = goal.Template.Category,
                titleAr = goal.Template.TitleAr,
                titleEn = goal.Template.TitleEn,
                descriptionAr = goal.Template.DescriptionAr,
                descriptionEn = goal.Template.DescriptionEn,
                current = Math.Min(goal.Current, goal.Template.Target),
                target = goal.Template.Target,
                xpReward = goal.Template.XpReward,
                completed = goal.Completed,
                rewardClaimed = goal.RewardClaimed
            }),
            recommendedLessons,
            activeChallenges,
            aiInsight = new
            {
                strengthAr = strongestSection?.TitleAr ?? "ابدأ أول درس لتظهر نقاط قوتك",
                strengthEn = strongestSection?.TitleEn ?? "Complete your first lesson to unlock your strengths",
                focusAr = weakestSection?.TitleAr ?? "ابدأ بمسار أساسيات UX",
                focusEn = weakestSection?.TitleEn ?? "Start with the UX Fundamentals path"
            }
        });
    }

    private async Task<IReadOnlyList<object>> BuildActiveChallengesAsync(
        UXFriends.Domain.Entities.User user,
        IReadOnlyCollection<UXFriends.Domain.Entities.UserChallenge> userChallenges,
        IReadOnlyCollection<UXFriends.Domain.Entities.UserChallenge> allUserChallenges,
        DateTime nowUtc)
    {
        var activeInstances = ChallengeEngine.GetActiveChallengesForUser(user, nowUtc);
        var userLookup = userChallenges.ToDictionary(
            item => $"{item.ChallengeCode}|{item.CycleKey}",
            item => item,
            StringComparer.OrdinalIgnoreCase);
        var participantLookup = allUserChallenges
            .GroupBy(item => $"{item.ChallengeCode}|{item.CycleKey}", StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.Count(), StringComparer.OrdinalIgnoreCase);

        var payloads = new List<object>(activeInstances.Count);

        foreach (var instance in activeInstances)
        {
            var recordKey = $"{instance.Template.Code}|{instance.CycleKey}";
            userLookup.TryGetValue(recordKey, out var userRecord);
            var progress = userRecord?.CompletedAt is not null
                ? ChallengeProgressEngine.CreateCompletedSnapshot(instance.Template)
                : await ChallengeProgressEngine.EvaluateAsync(
                    _context,
                    user.Id,
                    instance,
                    userRecord?.CreatedAt,
                    nowUtc);

            payloads.Add(new
            {
                code = instance.Template.Code,
                cycleKey = instance.CycleKey,
                titleAr = instance.Template.TitleAr,
                titleEn = instance.Template.TitleEn,
                descriptionAr = instance.Template.DescriptionAr,
                descriptionEn = instance.Template.DescriptionEn,
                challengeType = instance.Template.ChallengeType,
                difficulty = instance.Template.Difficulty,
                xpReward = instance.Template.XpReward,
                participants = participantLookup.GetValueOrDefault(recordKey, 0),
                participating = userRecord is not null,
                completed = userRecord?.CompletedAt is not null,
                expiresAt = instance.ExpiresAt,
                objectiveAr = progress.ObjectiveAr,
                objectiveEn = progress.ObjectiveEn,
                progressCurrent = Math.Min(progress.Current, progress.Target),
                progressTarget = progress.Target,
                progressLabelAr = progress.ProgressLabelAr,
                progressLabelEn = progress.ProgressLabelEn,
                readyToClaim = userRecord?.CompletedAt is null && progress.ReadyToClaim
            });
        }

        return payloads;
    }

    private static string MapSkillLevelToDifficulty(string? skillLevel)
    {
        return skillLevel?.Trim().ToLowerInvariant() switch
        {
            "advanced" => "advanced",
            "intermediate" => "intermediate",
            _ => "beginner"
        };
    }

    private static int GetDifficultyDistance(string lessonDifficulty, string preferredDifficulty)
    {
        var lessonRank = GetDifficultyRank(lessonDifficulty);
        var preferredRank = GetDifficultyRank(preferredDifficulty);
        return Math.Abs(lessonRank - preferredRank);
    }

    private static string NormalizeDifficulty(string difficulty)
    {
        return difficulty.Trim().ToLowerInvariant() switch
        {
            "hard" => "advanced",
            "medium" => "intermediate",
            "easy" => "beginner",
            _ => difficulty.Trim().ToLowerInvariant()
        };
    }

    private static bool IsLessonLocked(LessonCatalogItem lesson, LearningAccessSnapshot accessSnapshot)
    {
        var unit = CatalogContent.FindUnit(lesson.UnitCode);
        if (unit is null)
        {
            return true;
        }

        return !LearningAccessPolicy.IsUnitAccessible(unit, accessSnapshot);
    }

    private static int GetDifficultyRank(string difficulty)
    {
        return NormalizeDifficulty(difficulty) switch
        {
            "advanced" => 2,
            "intermediate" => 1,
            _ => 0
        };
    }
}
