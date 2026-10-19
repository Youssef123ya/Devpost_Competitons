using Microsoft.EntityFrameworkCore;
using UXFriends.Domain.Entities;
using UXFriends.Infrastructure.Data;

namespace UXFriends.API.Support;

public sealed record StreakRewardDefinition(
    int MilestoneDays,
    int XpReward,
    string TitleAr,
    string TitleEn,
    string DescriptionAr,
    string DescriptionEn,
    string? BadgeCode = null);

public sealed record StreakRewardPreview(
    int MilestoneDays,
    int XpReward,
    string TitleAr,
    string TitleEn,
    string DescriptionAr,
    string DescriptionEn,
    string? BadgeCode,
    string? BadgeNameAr,
    string? BadgeNameEn);

public sealed record StreakSyncResult(
    int CurrentStreak,
    int LongestStreak,
    int NextMilestone,
    int ProgressPercent,
    int DaysUntilNextReward,
    StreakRewardPreview? NextReward,
    bool Changed,
    int AwardedXp);

public static class StreakEngine
{
    private static readonly string[] QualifyingActivityTypes =
    [
        "LessonCompleted",
        "LessonQuizCompleted",
        "UnitQuizCompleted",
        "SectionQuizCompleted",
        "LessonQuizPassed",
        "UnitQuizPassed",
        "SectionQuizPassed",
        "ChallengeCompleted",
        "DailyGoalCompleted"
    ];

    private static readonly IReadOnlyList<StreakRewardDefinition> Rewards =
    [
        new(3, XpEconomy.GetStreakReward(3), "مكافأة 3 أيام", "3-Day Reward", "استمر 3 أيام لتحصل على دفعة XP ووسام البداية.", "Reach 3 days for an XP boost and your first streak badge.", "three-day-streak"),
        new(7, XpEconomy.GetStreakReward(7), "مكافأة 7 أيام", "7-Day Reward", "اكسر حاجز الأسبوع الأول لتحصل على مكافأة أقوى.", "Break through the first week to earn a stronger reward.", "seven-day-streak"),
        new(14, XpEconomy.GetStreakReward(14), "مكافأة 14 يوماً", "14-Day Reward", "حافظ على أسبوعين متتاليين لفتح مكافأة أكبر.", "Hold a 2-week streak to unlock a bigger reward.", "fourteen-day-streak"),
        new(30, XpEconomy.GetStreakReward(30), "مكافأة 30 يوماً", "30-Day Reward", "أكمل شهراً من التعلم المتواصل لتحصل على مكافأة شهرية كبيرة.", "Complete a full learning month to earn a major monthly reward.", "thirty-day-streak"),
        new(60, XpEconomy.GetStreakReward(60), "مكافأة 60 يوماً", "60-Day Reward", "مستوى التزام قوي يستحق مكافأة متقدمة.", "A serious streak milestone with an advanced reward.", "sixty-day-streak"),
        new(100, XpEconomy.GetStreakReward(100), "مكافأة 100 يوم", "100-Day Reward", "مكافأة خاصة لمن يحافظ على عادة تعلم استثنائية.", "A special reward for building an exceptional learning habit.", "hundred-day-streak")
    ];

    public static async Task<StreakSyncResult> SyncAsync(
        UXFriendsDbContext context,
        User user,
        DateTime nowUtc)
    {
        var qualifyingLogs = await context.XPLogs
            .Where(item => item.UserId == user.Id && QualifyingActivityTypes.Contains(item.ActivityType))
            .AsNoTracking()
            .ToListAsync();

        var timeZone = GetApplicationTimeZone();
        var localToday = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(EnsureUtc(nowUtc), timeZone));
        var localYesterday = localToday.AddDays(-1);

        var activeDates = qualifyingLogs
            .Select(item => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(EnsureUtc(item.CreatedAt), timeZone)))
            .Distinct()
            .OrderByDescending(item => item.DayNumber)
            .ToList();

        var activeDateSet = activeDates.ToHashSet();

        var currentStreak = 0;
        var anchorDate = activeDateSet.Contains(localToday)
            ? localToday
            : activeDateSet.Contains(localYesterday)
                ? localYesterday
                : (DateOnly?)null;

        if (anchorDate is not null)
        {
            var cursor = anchorDate.Value;
            while (activeDateSet.Contains(cursor))
            {
                currentStreak += 1;
                cursor = cursor.AddDays(-1);
            }
        }

        var longestStreak = CalculateLongestStreak(activeDates);
        var changed = false;

        if (user.CurrentStreak != currentStreak)
        {
            user.CurrentStreak = currentStreak;
            changed = true;
        }

        if (user.LongestStreak != Math.Max(user.LongestStreak, longestStreak))
        {
            user.LongestStreak = Math.Max(user.LongestStreak, longestStreak);
            changed = true;
        }

        var claimedReferences = await context.XPLogs
            .Where(item => item.UserId == user.Id && item.ActivityType == "StreakReward" && item.ReferenceId != null)
            .Select(item => item.ReferenceId!)
            .ToListAsync();

        var claimedLookup = claimedReferences.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var awardedXp = 0;
        foreach (var reward in Rewards.Where(item => currentStreak >= item.MilestoneDays))
        {
            var reference = BuildRewardReference(reward.MilestoneDays);
            if (claimedLookup.Contains(reference))
            {
                continue;
            }

            GamificationHelper.ApplyXp(user, reward.XpReward);
            awardedXp += reward.XpReward;
            changed = true;

            context.XPLogs.Add(new XPLog
            {
                LogCode = Guid.NewGuid().ToString("N"),
                UserId = user.Id,
                XP = reward.XpReward,
                ActivityType = "StreakReward",
                ReferenceId = reference,
                CreatedAt = nowUtc
            });

            if (!string.IsNullOrWhiteSpace(reward.BadgeCode))
            {
                await AwardBadgeIfMissingAsync(context, user.Id, reward.BadgeCode, nowUtc);
            }
        }

        var nextReward = Rewards.FirstOrDefault(item => item.MilestoneDays > currentStreak);
        var previousMilestone = Rewards
            .Where(item => item.MilestoneDays <= currentStreak)
            .Select(item => item.MilestoneDays)
            .DefaultIfEmpty(0)
            .Max();

        var progressPercent = nextReward is null
            ? 100
            : nextReward.MilestoneDays == previousMilestone
                ? 100
                : Math.Clamp((int)Math.Round((currentStreak - previousMilestone) * 100d / (nextReward.MilestoneDays - previousMilestone)), 0, 100);

        return new StreakSyncResult(
            currentStreak,
            user.LongestStreak,
            nextReward?.MilestoneDays ?? currentStreak,
            progressPercent,
            nextReward is null ? 0 : Math.Max(0, nextReward.MilestoneDays - currentStreak),
            nextReward is null ? null : BuildPreview(nextReward),
            changed,
            awardedXp);
    }

    private static StreakRewardPreview BuildPreview(StreakRewardDefinition reward)
    {
        var badge = string.IsNullOrWhiteSpace(reward.BadgeCode)
            ? null
            : CatalogContent.FindBadge(reward.BadgeCode);

        return new StreakRewardPreview(
            reward.MilestoneDays,
            reward.XpReward,
            reward.TitleAr,
            reward.TitleEn,
            reward.DescriptionAr,
            reward.DescriptionEn,
            reward.BadgeCode,
            badge?.NameAr,
            badge?.NameEn);
    }

    private static int CalculateLongestStreak(IReadOnlyList<DateOnly> activeDates)
    {
        if (activeDates.Count == 0)
        {
            return 0;
        }

        var ordered = activeDates
            .Distinct()
            .OrderBy(item => item.DayNumber)
            .ToList();

        var longest = 1;
        var current = 1;

        for (var index = 1; index < ordered.Count; index += 1)
        {
            if (ordered[index].DayNumber - ordered[index - 1].DayNumber == 1)
            {
                current += 1;
                longest = Math.Max(longest, current);
            }
            else
            {
                current = 1;
            }
        }

        return longest;
    }

    private static DateTime EnsureUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }

    private static string BuildRewardReference(int milestoneDays) => $"streak:{milestoneDays}";

    private static TimeZoneInfo GetApplicationTimeZone()
    {
        try
        {
            return TimeZoneInfo.Local;
        }
        catch
        {
            return TimeZoneInfo.Utc;
        }
    }

    private static async Task AwardBadgeIfMissingAsync(
        UXFriendsDbContext context,
        string userId,
        string badgeCode,
        DateTime earnedAtUtc)
    {
        var exists = await context.UserBadges.AnyAsync(item =>
            item.UserId == userId &&
            item.BadgeCode == badgeCode);

        if (exists)
        {
            return;
        }

        context.UserBadges.Add(new UserBadge
        {
            UserBadgeCode = Guid.NewGuid().ToString("N"),
            UserId = userId,
            BadgeCode = badgeCode,
            IsUnlocked = true,
            EarnedAt = earnedAtUtc
        });
    }
}
