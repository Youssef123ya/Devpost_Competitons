using Microsoft.EntityFrameworkCore;
using UXFriends.Domain.Entities;
using UXFriends.Infrastructure.Data;

namespace UXFriends.API.Support;

public static class ChallengeRewardSettlementEngine
{
    public static async Task<bool> SyncAsync(UXFriendsDbContext context, DateTime? nowUtc = null)
    {
        var reference = nowUtc?.ToUniversalTime() ?? DateTime.UtcNow;
        var pendingRecords = await context.UserChallenges
            .Where(item => item.CompletedAt == null)
            .ToListAsync();

        if (pendingRecords.Count == 0)
        {
            return false;
        }

        var userIds = pendingRecords
            .Select(item => item.UserId)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var users = (await context.Users
            .Where(item => userIds.Contains(item.Id))
            .ToListAsync())
            .ToDictionary(item => item.Id, StringComparer.OrdinalIgnoreCase);

        var changed = false;

        foreach (var record in pendingRecords)
        {
            if (!users.TryGetValue(record.UserId, out var user))
            {
                continue;
            }

            changed = await TrySettleRecordAsync(context, user, record, reference) || changed;
        }

        if (changed)
        {
            await context.SaveChangesAsync();
        }

        return changed;
    }

    public static async Task<bool> SyncForUserAsync(
        UXFriendsDbContext context,
        User user,
        DateTime? nowUtc = null)
    {
        var reference = nowUtc?.ToUniversalTime() ?? DateTime.UtcNow;
        var pendingRecords = await context.UserChallenges
            .Where(item => item.UserId == user.Id && item.CompletedAt == null)
            .ToListAsync();

        if (pendingRecords.Count == 0)
        {
            return false;
        }

        var changed = false;
        foreach (var record in pendingRecords)
        {
            changed = await TrySettleRecordAsync(context, user, record, reference) || changed;
        }

        return changed;
    }

    private static async Task<bool> TrySettleRecordAsync(
        UXFriendsDbContext context,
        User user,
        UserChallenge record,
        DateTime nowUtc)
    {
        var template = CatalogContent.FindChallenge(record.ChallengeCode);
        if (template is null)
        {
            return false;
        }

        var instance = ChallengeEngine.RehydrateInstance(template, record.CycleKey, record.ExpiresAt);
        if (instance is null)
        {
            return false;
        }

        var currentSkillLevel = LearningAccessPolicy.NormalizeLevel(user.SkillLevel);
        var levelChanged = !string.Equals(template.LevelBand, currentSkillLevel, StringComparison.OrdinalIgnoreCase);
        var expiresAt = record.ExpiresAt ?? instance.ExpiresAt;
        var cycleExpired = expiresAt <= nowUtc;

        if (!levelChanged && !cycleExpired)
        {
            return false;
        }

        var referenceTime = cycleExpired ? expiresAt : nowUtc;
        var progress = await ChallengeProgressEngine.EvaluateAsync(
            context,
            user.Id,
            instance,
            record.CreatedAt,
            referenceTime);

        if (!progress.ReadyToClaim)
        {
            return false;
        }

        var rewardReference = $"{template.Code}:{record.CycleKey}";
        var alreadyRewarded = await context.XPLogs.AnyAsync(item =>
            item.UserId == user.Id &&
            item.ActivityType == "ChallengeCompleted" &&
            item.ReferenceId == rewardReference);

        record.CompletedAt = referenceTime;

        if (alreadyRewarded)
        {
            return true;
        }

        user.ChallengesWon += 1;
        GamificationHelper.ApplyXp(user, template.XpReward);
        context.XPLogs.Add(new XPLog
        {
            LogCode = Guid.NewGuid().ToString("N"),
            UserId = user.Id,
            XP = template.XpReward,
            ActivityType = "ChallengeCompleted",
            ReferenceId = rewardReference,
            CreatedAt = referenceTime
        });

        return true;
    }
}
