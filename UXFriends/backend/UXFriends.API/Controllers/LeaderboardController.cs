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
public class LeaderboardController : ControllerBase
{
    private readonly UXFriendsDbContext _context;

    public LeaderboardController(UXFriendsDbContext context)
    {
        _context = context;
    }

    [HttpGet("{period}")]
    public async Task<IActionResult> GetLeaderboard(string period)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(currentUserId))
        {
            return Unauthorized();
        }

        var nowUtc = DateTime.UtcNow;
        await LeagueEngine.SyncAsync(_context, nowUtc);

        var currentUser = await _context.Users.FirstOrDefaultAsync(item => item.Id == currentUserId);
        if (currentUser is null)
        {
            return NotFound(new { message = "User not found" });
        }

        LeagueEngine.EnsureEnrollment(currentUser, nowUtc);
        await EnsurePortfolioIdentityAsync(currentUser);
        await _context.SaveChangesAsync();

        var overview = LeagueEngine.GetOverview(currentUser, nowUtc);
        var (lastTierNameAr, lastTierNameEn) = LeagueEngine.GetTierNames(currentUser.LastLeagueResultTier);
        var weekXpByUser = (await _context.XPLogs
            .Where(item =>
                item.CreatedAt >= overview.WeekStartsAt &&
                item.CreatedAt < overview.WeekEndsAt &&
                item.XP > 0)
            .GroupBy(item => item.UserId)
            .Select(group => new
            {
                group.Key,
                TotalXp = group.Sum(entry => entry.XP)
            })
            .ToListAsync())
            .ToDictionary(item => item.Key, item => item.TotalXp, StringComparer.OrdinalIgnoreCase);

        var cohortUsers = await _context.Users
            .Where(item =>
                item.LeagueSkillLevel == overview.SkillLevel &&
                item.LeagueTier == overview.TierCode)
            .ToListAsync();

        var cohortChanged = false;
        foreach (var user in cohortUsers)
        {
            cohortChanged |= await EnsurePortfolioIdentityAsync(user);
        }

        if (cohortChanged)
        {
            await _context.SaveChangesAsync();
        }

        var entries = cohortUsers
            .Select(user => new
            {
                user.Id,
                Name = $"{user.FirstName} {user.LastName}".Trim(),
                user.Avatar,
                user.PortfolioSlug,
                WeeklyXp = weekXpByUser.GetValueOrDefault(user.Id, 0),
                user.Level,
                user.CurrentStreak,
                IsCurrentUser = user.Id == currentUserId
            })
            .OrderByDescending(item => item.WeeklyXp)
            .ThenByDescending(item => item.CurrentStreak)
            .ThenByDescending(item => item.Level)
            .ThenBy(item => item.Name, StringComparer.OrdinalIgnoreCase)
            .Select((item, index) => new
            {
                rank = index + 1,
                userId = item.Id,
                name = item.Name,
                avatar = item.Avatar,
                portfolioSlug = item.PortfolioSlug,
                xp = item.WeeklyXp,
                level = item.Level,
                streak = item.CurrentStreak,
                isCurrentUser = item.IsCurrentUser,
                period = string.Equals(period, "weekly", StringComparison.OrdinalIgnoreCase)
                    ? "weekly"
                    : period,
                tier = overview.TierCode,
                skillLevel = overview.SkillLevel
            })
            .ToList();

        return Ok(new
        {
            serverNow = nowUtc,
            league = new
            {
                tier = overview.TierCode,
                nameAr = overview.TierNameAr,
                nameEn = overview.TierNameEn,
                skillLevel = overview.SkillLevel,
                weekKey = overview.WeekKey,
                weekStartsAt = overview.WeekStartsAt,
                weekEndsAt = overview.WeekEndsAt,
                promotionSlots = overview.PromotionSlots,
                demotionSlots = overview.DemotionSlots,
                rewards = new
                {
                    first = overview.FirstPlaceXp,
                    second = overview.SecondPlaceXp,
                    third = overview.ThirdPlaceXp
                }
            },
            lastWeekResult = string.IsNullOrWhiteSpace(currentUser.LastLeagueResultWeekKey) ||
                             currentUser.LastLeagueResultRank is null
                ? null
                : new
                {
                    weekKey = currentUser.LastLeagueResultWeekKey,
                    rank = currentUser.LastLeagueResultRank,
                    rewardXp = currentUser.LastLeagueResultRewardXp,
                    movement = string.IsNullOrWhiteSpace(currentUser.LastLeagueResultMovement)
                        ? "stayed"
                        : currentUser.LastLeagueResultMovement,
                    tier = currentUser.LastLeagueResultTier,
                    tierNameAr = lastTierNameAr,
                    tierNameEn = lastTierNameEn,
                    skillLevel = string.IsNullOrWhiteSpace(currentUser.LastLeagueResultSkillLevel)
                        ? overview.SkillLevel
                        : currentUser.LastLeagueResultSkillLevel,
                    settledAt = currentUser.LastLeagueResultSettledAt
                },
            entries
        });
    }

    private async Task<bool> EnsurePortfolioIdentityAsync(User user)
    {
        var hasChanges = false;

        if (string.IsNullOrWhiteSpace(user.PortfolioSlug))
        {
            user.PortfolioSlug = await BuildUniqueSlugAsync(user);
            hasChanges = true;
        }

        if (string.IsNullOrWhiteSpace(user.PortfolioVisibility) ||
            string.Equals(user.PortfolioVisibility, "link-only", StringComparison.OrdinalIgnoreCase))
        {
            user.PortfolioVisibility = "private";
            hasChanges = true;
        }

        return hasChanges;
    }

    private async Task<string> BuildUniqueSlugAsync(User user)
    {
        var fullName = $"{user.FirstName}-{user.LastName}";
        var baseSlug = System.Text.RegularExpressions.Regex
            .Replace(fullName.ToLowerInvariant(), "[^a-z0-9]+", "-")
            .Trim('-');

        if (string.IsNullOrWhiteSpace(baseSlug))
        {
            baseSlug = "learner";
        }

        var candidate = baseSlug;
        var counter = 1;

        while (await _context.Users.AnyAsync(item => item.Id != user.Id && item.PortfolioSlug == candidate))
        {
            candidate = $"{baseSlug}-{counter}";
            counter++;
        }

        return candidate;
    }
}
