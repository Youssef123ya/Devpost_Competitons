using UXFriends.Infrastructure.Data;

namespace UXFriends.API.Support;

public static class ChallengeTiming
{
    private static readonly DateTime AnchorUtc = new(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc);

    public static DateTime GetExpiresAt(ChallengeCatalogItem challenge, DateTime? now = null)
    {
        var reference = now?.ToUniversalTime() ?? DateTime.UtcNow;
        var durationHours = Math.Max(challenge.DurationHours, 1);
        var duration = TimeSpan.FromHours(durationHours);
        var elapsed = reference - AnchorUtc;

        if (elapsed <= TimeSpan.Zero)
        {
            return AnchorUtc.Add(duration);
        }

        var cycle = Math.Floor(elapsed.TotalHours / duration.TotalHours) + 1;
        return AnchorUtc.AddHours(cycle * durationHours);
    }
}
