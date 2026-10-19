using Microsoft.EntityFrameworkCore;
using UXFriends.Domain.Entities;
using UXFriends.Infrastructure.Data;

namespace UXFriends.API.Support;

public sealed record LeagueOverview(
    string TierCode,
    string TierNameAr,
    string TierNameEn,
    string SkillLevel,
    string WeekKey,
    DateTime WeekStartsAt,
    DateTime WeekEndsAt,
    int PromotionSlots,
    int DemotionSlots,
    int FirstPlaceXp,
    int SecondPlaceXp,
    int ThirdPlaceXp);

public static class LeagueEngine
{
    private static readonly string[] TierOrder =
    [
        "bronze",
        "silver",
        "gold",
        "sapphire",
        "ruby",
        "emerald",
        "amethyst",
        "pearl",
        "obsidian",
        "diamond"
    ];

    public static string NormalizeTier(string? tier) =>
        tier?.Trim().ToLowerInvariant() is { Length: > 0 } value &&
        TierOrder.Contains(value, StringComparer.OrdinalIgnoreCase)
            ? value
            : "bronze";

    public static DateTime GetWeekStartUtc(DateTime? nowUtc = null)
    {
        var reference = nowUtc?.ToUniversalTime() ?? DateTime.UtcNow;
        return reference.Date.AddDays(-((7 + (int)reference.DayOfWeek - (int)DayOfWeek.Monday) % 7));
    }

    public static DateTime GetWeekEndUtc(DateTime? nowUtc = null) =>
        GetWeekStartUtc(nowUtc).AddDays(7);

    public static string GetWeekKey(DateTime? nowUtc = null) =>
        GetWeekStartUtc(nowUtc).ToString("yyyyMMdd");

    public static LeagueOverview GetOverview(User user, DateTime? nowUtc = null)
    {
        var reference = nowUtc?.ToUniversalTime() ?? DateTime.UtcNow;
        var weekStart = GetWeekStartUtc(reference);
        var tier = NormalizeTier(user.LeagueTier);
        var currentWeekKey = GetWeekKey(reference);
        var skillLevel =
            !string.IsNullOrWhiteSpace(user.LeagueWeekKey) &&
            string.Equals(user.LeagueWeekKey, currentWeekKey, StringComparison.OrdinalIgnoreCase)
                ? LearningAccessPolicy.NormalizeLevel(user.LeagueSkillLevel)
                : LearningAccessPolicy.NormalizeLevel(user.SkillLevel);
        var (tierNameAr, tierNameEn) = GetTierNames(tier);
        var tierIndex = Array.IndexOf(TierOrder, tier);
        var promotionSlots = tierIndex >= TierOrder.Length - 1 ? 0 : 3;
        var demotionSlots = tierIndex <= 0 ? 0 : 3;

        return new LeagueOverview(
            tier,
            tierNameAr,
            tierNameEn,
            skillLevel,
            GetWeekKey(reference),
            weekStart,
            weekStart.AddDays(7),
            promotionSlots,
            demotionSlots,
            XpEconomy.GetLeagueReward(1),
            XpEconomy.GetLeagueReward(2),
            XpEconomy.GetLeagueReward(3));
    }

    public static bool EnsureEnrollment(User user, DateTime? nowUtc = null)
    {
        var reference = nowUtc?.ToUniversalTime() ?? DateTime.UtcNow;
        var currentWeekKey = GetWeekKey(reference);
        var changed = false;

        var normalizedTier = NormalizeTier(user.LeagueTier);
        if (!string.Equals(user.LeagueTier, normalizedTier, StringComparison.OrdinalIgnoreCase))
        {
            user.LeagueTier = normalizedTier;
            changed = true;
        }

        var normalizedLeagueSkillLevel = LearningAccessPolicy.NormalizeLevel(
            string.IsNullOrWhiteSpace(user.LeagueSkillLevel)
                ? user.SkillLevel
                : user.LeagueSkillLevel);
        if (!string.Equals(user.LeagueSkillLevel, normalizedLeagueSkillLevel, StringComparison.OrdinalIgnoreCase))
        {
            user.LeagueSkillLevel = normalizedLeagueSkillLevel;
            changed = true;
        }

        if (string.IsNullOrWhiteSpace(user.LeagueWeekKey))
        {
            user.LeagueWeekKey = currentWeekKey;
            user.LeagueSkillLevel = LearningAccessPolicy.NormalizeLevel(user.SkillLevel);
            changed = true;
        }

        return changed;
    }

    public static async Task<bool> SyncAsync(UXFriendsDbContext context, DateTime? nowUtc = null)
    {
        var reference = nowUtc?.ToUniversalTime() ?? DateTime.UtcNow;
        var currentWeekStart = GetWeekStartUtc(reference);
        var currentWeekKey = GetWeekKey(reference);
        var previousWeekStart = currentWeekStart.AddDays(-7);

        var users = await context.Users.ToListAsync();
        var changed = false;

        foreach (var user in users)
        {
            changed = EnsureEnrollment(user, reference) || changed;
        }

        var usersNeedingSettlement = users
            .Where(user =>
                !string.IsNullOrWhiteSpace(user.LeagueWeekKey) &&
                !string.Equals(user.LeagueWeekKey, currentWeekKey, StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (usersNeedingSettlement.Count == 0)
        {
            if (changed)
            {
                await context.SaveChangesAsync();
            }

            return changed;
        }

        var userIds = usersNeedingSettlement.Select(user => user.Id).ToList();
        var weekXpLookup = (await context.XPLogs
            .Where(item =>
                userIds.Contains(item.UserId) &&
                item.XP > 0 &&
                item.CreatedAt >= previousWeekStart &&
                item.CreatedAt < currentWeekStart)
            .GroupBy(item => item.UserId)
            .Select(group => new
            {
                group.Key,
                TotalXp = group.Sum(entry => entry.XP)
            })
            .ToListAsync())
            .ToDictionary(item => item.Key, item => item.TotalXp, StringComparer.OrdinalIgnoreCase);

        var rewardLookup = (await context.XPLogs
                .Where(item =>
                    item.ActivityType == "LeagueWeeklyReward" &&
                    item.ReferenceId != null &&
                    userIds.Contains(item.UserId))
                .Select(item => new { item.UserId, item.ReferenceId })
                .ToListAsync())
            .Select(item => $"{item.UserId}|{item.ReferenceId}")
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var cohort in usersNeedingSettlement.GroupBy(user =>
                     $"{LearningAccessPolicy.NormalizeLevel(user.LeagueSkillLevel)}|{NormalizeTier(user.LeagueTier)}",
                 StringComparer.OrdinalIgnoreCase))
        {
            var ranked = cohort
                .Select(user => new
                {
                    User = user,
                    WeekXp = weekXpLookup.GetValueOrDefault(user.Id, 0)
                })
                .OrderByDescending(item => item.WeekXp)
                .ThenByDescending(item => item.User.CurrentStreak)
                .ThenByDescending(item => item.User.TotalXP)
                .ThenBy(item => item.User.FirstName, StringComparer.OrdinalIgnoreCase)
                .ThenBy(item => item.User.LastName, StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (ranked.Count == 0)
            {
                continue;
            }

            var cohortParts = cohort.Key.Split('|', StringSplitOptions.RemoveEmptyEntries);
            var cohortSkillLevel = cohortParts.ElementAtOrDefault(0) ?? "beginner";
            var cohortTier = NormalizeTier(cohortParts.ElementAtOrDefault(1));
            var tierIndex = Array.IndexOf(TierOrder, cohortTier);

            for (var index = 0; index < ranked.Count; index += 1)
            {
                var entry = ranked[index];
                var user = entry.User;
                var rank = index + 1;
                var isPromotion = rank <= 3 && tierIndex < TierOrder.Length - 1;
                var isDemotion = ranked.Count > 6 && rank > ranked.Count - 3 && tierIndex > 0;
                var movement = "stayed";
                var nextTier = cohortTier;

                if (isPromotion)
                {
                    nextTier = TierOrder[tierIndex + 1];
                    movement = "promoted";
                }
                else if (isDemotion)
                {
                    nextTier = TierOrder[tierIndex - 1];
                    movement = "demoted";
                }

                user.LastLeagueResultWeekKey = $"{previousWeekStart:yyyyMMdd}";
                user.LastLeagueResultRank = rank;
                user.LastLeagueResultRewardXp = 0;
                user.LastLeagueResultTier = cohortTier;
                user.LastLeagueResultSkillLevel = cohortSkillLevel;
                user.LastLeagueResultMovement = movement;
                user.LastLeagueResultSettledAt = currentWeekStart;
                user.LeagueWeekKey = currentWeekKey;
                changed = true;

                var rewardXp = XpEconomy.GetLeagueReward(rank);

                if (rewardXp <= 0)
                {
                    continue;
                }

                var referenceId = $"{previousWeekStart:yyyyMMdd}:{cohortSkillLevel}:{cohortTier}:{rank}";
                var rewardKey = $"{user.Id}|{referenceId}";
                if (!rewardLookup.Add(rewardKey))
                {
                    rewardXp = 0;
                }

                if (rewardXp > 0)
                {
                    GamificationHelper.ApplyXp(user, rewardXp);
                    context.XPLogs.Add(new XPLog
                    {
                        LogCode = Guid.NewGuid().ToString("N"),
                        UserId = user.Id,
                        XP = rewardXp,
                        ActivityType = "LeagueWeeklyReward",
                        ReferenceId = referenceId,
                        CreatedAt = currentWeekStart.AddMinutes(1)
                    });
                    user.LastLeagueResultRewardXp = rewardXp;
                }

                var nextSkillLevel = LearningAccessPolicy.NormalizeLevel(user.SkillLevel);
                if (!string.Equals(nextSkillLevel, cohortSkillLevel, StringComparison.OrdinalIgnoreCase))
                {
                    user.LeagueSkillLevel = nextSkillLevel;
                    user.LeagueTier = "bronze";
                }
                else
                {
                    user.LeagueSkillLevel = cohortSkillLevel;
                    user.LeagueTier = nextTier;
                }

                changed = true;
            }
        }

        if (changed)
        {
            await context.SaveChangesAsync();
        }

        return changed;
    }

    public static (string Ar, string En) GetTierNames(string tier) =>
        NormalizeTier(tier) switch
        {
            "silver" => ("دوري الفضة", "Silver League"),
            "gold" => ("دوري الذهب", "Gold League"),
            "sapphire" => ("دوري الياقوت الأزرق", "Sapphire League"),
            "ruby" => ("دوري الياقوت", "Ruby League"),
            "emerald" => ("دوري الزمرد", "Emerald League"),
            "amethyst" => ("دوري الجمشت", "Amethyst League"),
            "pearl" => ("دوري اللؤلؤ", "Pearl League"),
            "obsidian" => ("دوري الأوبسيديان", "Obsidian League"),
            "diamond" => ("دوري الألماس", "Diamond League"),
            _ => ("دوري البرونز", "Bronze League")
        };
}
