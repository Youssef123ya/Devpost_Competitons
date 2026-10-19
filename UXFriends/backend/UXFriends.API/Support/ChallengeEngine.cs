using System.Security.Cryptography;
using System.Text;
using System.Globalization;
using UXFriends.Domain.Entities;
using UXFriends.Infrastructure.Data;

namespace UXFriends.API.Support;

public sealed record ActiveChallengeInstance(
    ChallengeCatalogItem Template,
    string CycleKey,
    DateTime StartsAt,
    DateTime ExpiresAt);

public static class ChallengeEngine
{
    private static readonly DateTime AnchorUtc = new(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc);

    public static IReadOnlyList<ActiveChallengeInstance> GetActiveChallengesForUser(
        User user,
        DateTime? nowUtc = null)
    {
        var reference = nowUtc?.ToUniversalTime() ?? DateTime.UtcNow;
        var levelBand = LearningAccessPolicy.NormalizeLevel(user.SkillLevel);

        return
        [
            BuildDailyChallenge(levelBand, reference),
            BuildWeeklyChallenge(levelBand, reference),
            BuildPersonalChallenge(user, levelBand, reference),
        ];
    }

    public static ActiveChallengeInstance? FindActiveChallengeForUser(
        User user,
        string code,
        DateTime? nowUtc = null)
    {
        return GetActiveChallengesForUser(user, nowUtc)
            .FirstOrDefault(item => string.Equals(item.Template.Code, code, StringComparison.OrdinalIgnoreCase));
    }

    public static ActiveChallengeInstance? RehydrateInstance(
        ChallengeCatalogItem template,
        string cycleKey,
        DateTime? expiresAtOverride = null)
    {
        var parts = cycleKey.Split(':', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length < 2)
        {
            return null;
        }

        var keyType = parts[0].Trim().ToLowerInvariant();
        var datePart = parts.Length >= 3 ? parts[2] : parts[1];
        var format = keyType == "personal" ? "yyyyMMddHH" : "yyyyMMdd";

        if (!DateTime.TryParseExact(
                datePart,
                format,
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                out var startsAt))
        {
            return null;
        }

        var startUtc = DateTime.SpecifyKind(startsAt, DateTimeKind.Utc);
        return new ActiveChallengeInstance(
            template,
            cycleKey,
            startUtc,
            expiresAtOverride ?? startUtc.AddHours(template.DurationHours));
    }

    private static ActiveChallengeInstance BuildDailyChallenge(string levelBand, DateTime reference)
    {
        var templates = CatalogContent.Challenges
            .Where(item =>
                string.Equals(item.LevelBand, levelBand, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(item.ChallengeType, "daily", StringComparison.OrdinalIgnoreCase))
            .ToList();

        var start = new DateTime(reference.Year, reference.Month, reference.Day, 0, 0, 0, DateTimeKind.Utc);
        var dayIndex = Math.Max(0, (int)Math.Floor((start - AnchorUtc).TotalDays));
        var template = templates[dayIndex % templates.Count];

        return new ActiveChallengeInstance(
            template,
            $"daily:{levelBand}:{start:yyyyMMdd}",
            start,
            start.AddHours(template.DurationHours));
    }

    private static ActiveChallengeInstance BuildWeeklyChallenge(string levelBand, DateTime reference)
    {
        var templates = CatalogContent.Challenges
            .Where(item =>
                string.Equals(item.LevelBand, levelBand, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(item.ChallengeType, "weekly", StringComparison.OrdinalIgnoreCase))
            .ToList();

        var start = reference.Date.AddDays(-((7 + (int)reference.DayOfWeek - (int)DayOfWeek.Monday) % 7));
        var weekIndex = Math.Max(0, (int)Math.Floor((start - AnchorUtc).TotalDays / 7d));
        var template = templates[weekIndex % templates.Count];

        return new ActiveChallengeInstance(
            template,
            $"weekly:{levelBand}:{start:yyyyMMdd}",
            start,
            start.AddHours(template.DurationHours));
    }

    private static ActiveChallengeInstance BuildPersonalChallenge(User user, string levelBand, DateTime reference)
    {
        var templates = CatalogContent.Challenges
            .Where(item =>
                string.Equals(item.LevelBand, levelBand, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(item.ChallengeType, "personal", StringComparison.OrdinalIgnoreCase))
            .ToList();

        var cycleDurationHours = 72;
        var elapsedHours = Math.Max(0, (reference - AnchorUtc).TotalHours);
        var cycleIndex = (int)Math.Floor(elapsedHours / cycleDurationHours);
        var start = AnchorUtc.AddHours(cycleIndex * cycleDurationHours);
        var cycleKey = $"personal:{levelBand}:{start:yyyyMMddHH}";
        var templateIndex = GetDeterministicIndex($"{user.Id}:{cycleKey}", templates.Count);
        var template = templates[templateIndex];

        return new ActiveChallengeInstance(
            template,
            cycleKey,
            start,
            start.AddHours(template.DurationHours));
    }

    private static int GetDeterministicIndex(string seed, int modulo)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(seed));
        var value = BitConverter.ToUInt32(hash, 0);
        return (int)(value % Math.Max(modulo, 1));
    }
}
