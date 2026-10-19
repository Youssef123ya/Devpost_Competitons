using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UXFriends.API.DTOs;
using UXFriends.API.Support;
using UXFriends.Infrastructure.Data;

namespace UXFriends.API.Controllers;

[ApiController]
[Authorize]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly UXFriendsDbContext _context;

    public UsersController(UXFriendsDbContext context)
    {
        _context = context;
    }

    [HttpGet("me/profile")]
    public async Task<IActionResult> GetProfile()
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
        var streak = await StreakEngine.SyncAsync(_context, user, nowUtc);
        var badgesAwarded = await BadgeSyncEngine.SyncAsync(_context, user, nowUtc);
        if (levelChanged || streak.Changed || badgesAwarded > 0)
        {
            await _context.SaveChangesAsync();
        }

        var badgesCount = await _context.UserBadges.CountAsync(item => item.UserId == userId && item.IsUnlocked);

        return Ok(new
        {
            id = user.Id,
            firstName = user.FirstName,
            lastName = user.LastName,
            email = user.Email,
            avatar = user.Avatar,
            professionalTitle = user.ProfessionalTitle,
            bio = user.Bio,
            location = user.Location,
            website = user.Website,
            joinDate = user.CreatedAt,
            level = user.Level,
            totalXP = user.TotalXP,
            currentXP = user.CurrentXP,
            nextLevelXP = user.NextLevelXP,
            currentStreak = streak.CurrentStreak,
            longestStreak = streak.LongestStreak,
            coins = user.Coins,
            lessonsCompleted = user.LessonsCompleted,
            projectsCompleted = user.ProjectsCompleted,
            challengesWon = user.ChallengesWon,
            badgesEarned = badgesCount,
            learningGoal = user.LearningGoal,
            skillLevel = user.SkillLevel,
            weeklyDays = user.WeeklyDays,
            dailyMinutes = user.DailyMinutes,
            emailConfirmed = user.EmailConfirmed,
            emailVerificationDeadline = EmailVerificationPolicy.GetDeadlineUtc(user),
            preferredLanguage = string.Equals(user.PreferredLanguage, "en", StringComparison.OrdinalIgnoreCase)
                ? "en"
                : "ar"
        });
    }

    [HttpGet("me/profile-overview")]
    public async Task<IActionResult> GetProfileOverview()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(item => item.Id == userId);

        if (user is null)
        {
            return NotFound(new { message = "User not found" });
        }

        var nowUtc = DateTime.UtcNow;
        var levelChanged = await LearningAccessPolicy.SyncStoredSkillLevelAsync(_context, user);
        var streak = await StreakEngine.SyncAsync(_context, user, nowUtc);
        var badgesAwarded = await BadgeSyncEngine.SyncAsync(_context, user, nowUtc);
        if (levelChanged || streak.Changed || badgesAwarded > 0)
        {
            await _context.SaveChangesAsync();
        }

        var unlockedBadges = await _context.UserBadges
            .Where(item => item.UserId == userId && item.IsUnlocked)
            .OrderByDescending(item => item.EarnedAt)
            .AsNoTracking()
            .Select(item => new UnlockedBadgeRecord(item.BadgeCode, item.EarnedAt))
            .ToListAsync();

        var lessonProgress = await _context.LessonProgress
            .Where(item => item.UserId == userId)
            .AsNoTracking()
            .ToListAsync();

        var completedChallenges = await _context.UserChallenges
            .Where(item => item.UserId == userId && item.CompletedAt != null)
            .OrderByDescending(item => item.CompletedAt)
            .AsNoTracking()
            .ToListAsync();

        var projectSubmissions = await _context.ProjectSubmissions
            .Include(item => item.Project)
            .Where(item => item.UserId == userId)
            .OrderByDescending(item => item.SubmittedAt)
            .AsNoTracking()
            .ToListAsync();

        var completedLessons = lessonProgress
            .Where(item => item.CompletedAt != null || item.Status == "Completed")
            .ToList();

        var learningPaths = CatalogContent.Sections
            .Select(section =>
            {
                var unitCodes = CatalogContent.Units
                    .Where(unit => unit.SectionCode == section.Code)
                    .Select(unit => unit.Code)
                    .ToHashSet();
                var lessons = CatalogContent.Lessons
                    .Where(lesson => unitCodes.Contains(lesson.UnitCode))
                    .ToList();
                var completedCount = completedLessons.Count(item => lessons.Any(lesson => lesson.Code == item.LessonCode));
                var totalCount = lessons.Count;

                return new
                {
                    code = section.Code,
                    titleAr = section.TitleAr,
                    titleEn = section.TitleEn,
                    progress = totalCount == 0 ? 0 : (int)Math.Round(completedCount * 100d / totalCount),
                    completedLessons = completedCount,
                    totalLessons = totalCount
                };
            })
            .Where(item => item.totalLessons > 0)
            .OrderByDescending(item => item.progress)
            .ToList();

        var badges = BuildProfileBadges(unlockedBadges);

        var projects = projectSubmissions
            .Select(item =>
            {
                var section = CatalogContent.FindSection(item.Project.SectionCode);
                var localized = ProjectLocalization.GetContent(
                    item.Project.ProjectCode,
                    item.Project.Title,
                    item.Project.Description,
                    item.Project.Requirements);

                return new
                {
                    code = item.ProjectCode,
                    sectionCode = item.Project.SectionCode,
                    sectionTitleAr = section?.TitleAr ?? item.Project.SectionCode,
                    sectionTitleEn = section?.TitleEn ?? item.Project.SectionCode,
                    titleAr = localized.TitleAr,
                    titleEn = localized.TitleEn,
                    descriptionAr = localized.DescriptionAr,
                    descriptionEn = localized.DescriptionEn,
                    submissionStatus = item.Status,
                    submittedAt = item.SubmittedAt,
                    submissionUrl = string.IsNullOrWhiteSpace(item.SubmissionUrl) ? null : item.SubmissionUrl
                };
            })
            .Take(6)
            .ToList();

        var recentActivity = new List<(DateTime OccurredAt, string Id, string Type, string TitleAr, string TitleEn, int XpAwarded)>();

        recentActivity.AddRange(completedLessons
            .Where(item => item.CompletedAt.HasValue)
            .Select(item =>
            {
                var lesson = CatalogContent.FindLesson(item.LessonCode);
                return (
                    item.CompletedAt!.Value,
                    $"lesson-{item.LessonCode}",
                    "lesson",
                    lesson is null ? "أكملت درساً" : $"أكملت درس \"{lesson.TitleAr}\"",
                    lesson is null ? "Completed a lesson" : $"Completed lesson \"{lesson.TitleEn}\"",
                    lesson?.XpReward ?? 0
                );
            }));

        recentActivity.AddRange(completedChallenges
            .Where(item => item.CompletedAt.HasValue)
            .Select(item =>
            {
                var challenge = CatalogContent.FindChallenge(item.ChallengeCode);
                return (
                    item.CompletedAt!.Value,
                    $"challenge-{item.ChallengeCode}",
                    "challenge",
                    challenge is null ? "أنهيت تحدياً" : $"أنهيت تحدي \"{challenge.TitleAr}\"",
                    challenge is null ? "Completed a challenge" : $"Completed challenge \"{challenge.TitleEn}\"",
                    challenge?.XpReward ?? 0
                );
            }));

        recentActivity.AddRange(unlockedBadges.Select(item =>
        {
            var badge = CatalogContent.FindBadge(item.BadgeCode);
            return (
                item.EarnedAt,
                $"badge-{item.BadgeCode}",
                "badge",
                badge is null ? "حصلت على شارة جديدة" : $"حصلت على شارة \"{badge.NameAr}\"",
                badge is null ? "Earned a new badge" : $"Earned badge \"{badge.NameEn}\"",
                0
            );
        }));

        recentActivity.AddRange(projectSubmissions.Select(item =>
        {
            var localized = ProjectLocalization.GetContent(
                item.Project.ProjectCode,
                item.Project.Title,
                item.Project.Description,
                item.Project.Requirements);

            return (
                item.SubmittedAt,
                $"project-{item.SubmissionId}",
                "project",
                $"أرسلت مشروع \"{localized.TitleAr}\"",
                $"Submitted project \"{localized.TitleEn}\"",
                0
            );
        }));

        return Ok(new
        {
            profile = new
            {
                id = user.Id,
                firstName = user.FirstName,
                lastName = user.LastName,
                email = user.Email,
                avatar = user.Avatar,
                professionalTitle = user.ProfessionalTitle,
                bio = user.Bio,
                location = user.Location,
                website = user.Website,
                level = user.Level,
                totalXP = user.TotalXP,
                currentXP = user.CurrentXP,
                nextLevelXP = user.NextLevelXP,
                currentStreak = streak.CurrentStreak,
                longestStreak = streak.LongestStreak,
                lessonsCompleted = user.LessonsCompleted,
                projectsCompleted = user.ProjectsCompleted,
                challengesWon = user.ChallengesWon,
                badgesEarned = unlockedBadges.Count,
                joinDate = user.CreatedAt,
                learningGoal = user.LearningGoal,
                skillLevel = user.SkillLevel,
                weeklyDays = user.WeeklyDays,
                dailyMinutes = user.DailyMinutes,
                emailConfirmed = user.EmailConfirmed,
                emailVerificationDeadline = EmailVerificationPolicy.GetDeadlineUtc(user),
                preferredLanguage = string.Equals(user.PreferredLanguage, "en", StringComparison.OrdinalIgnoreCase)
                    ? "en"
                    : "ar"
            },
            totals = new
            {
                totalBadges = CatalogContent.Badges.Count,
                totalProjects = await _context.Projects.CountAsync()
            },
            learningPaths,
            badges,
            projects,
            recentActivity = recentActivity
                .OrderByDescending(item => item.OccurredAt)
                .Take(8)
                .Select(item => new
                {
                    id = item.Id,
                    type = item.Type,
                    titleAr = item.TitleAr,
                    titleEn = item.TitleEn,
                    occurredAt = item.OccurredAt,
                    xpAwarded = item.XpAwarded
                })
        });
    }

    [HttpPut("me/profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
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

        user.FirstName = dto.FirstName.Trim();
        user.LastName = dto.LastName.Trim();
        user.Avatar = string.IsNullOrWhiteSpace(dto.Avatar) ? null : dto.Avatar.Trim();
        user.ProfessionalTitle = string.IsNullOrWhiteSpace(dto.ProfessionalTitle)
            ? null
            : dto.ProfessionalTitle.Trim();
        user.Bio = string.IsNullOrWhiteSpace(dto.Bio)
            ? null
            : dto.Bio.Trim();
        user.Location = string.IsNullOrWhiteSpace(dto.Location)
            ? null
            : dto.Location.Trim();
        user.Website = string.IsNullOrWhiteSpace(dto.Website)
            ? null
            : dto.Website.Trim();

        await _context.SaveChangesAsync();

        var streak = await StreakEngine.SyncAsync(_context, user, DateTime.UtcNow);
        if (streak.Changed)
        {
            await _context.SaveChangesAsync();
        }

        var badgesCount = await _context.UserBadges.CountAsync(item => item.UserId == userId && item.IsUnlocked);

        return Ok(new
        {
            id = user.Id,
            firstName = user.FirstName,
            lastName = user.LastName,
            email = user.Email,
            avatar = user.Avatar,
            professionalTitle = user.ProfessionalTitle,
            bio = user.Bio,
            location = user.Location,
            website = user.Website,
            joinDate = user.CreatedAt,
            level = user.Level,
            totalXP = user.TotalXP,
            currentXP = user.CurrentXP,
            nextLevelXP = user.NextLevelXP,
            currentStreak = streak.CurrentStreak,
            longestStreak = streak.LongestStreak,
            coins = user.Coins,
            lessonsCompleted = user.LessonsCompleted,
            projectsCompleted = user.ProjectsCompleted,
            challengesWon = user.ChallengesWon,
            badgesEarned = badgesCount,
            learningGoal = user.LearningGoal,
            skillLevel = user.SkillLevel,
            weeklyDays = user.WeeklyDays,
            dailyMinutes = user.DailyMinutes,
            emailConfirmed = user.EmailConfirmed,
            emailVerificationDeadline = EmailVerificationPolicy.GetDeadlineUtc(user),
            preferredLanguage = string.Equals(user.PreferredLanguage, "en", StringComparison.OrdinalIgnoreCase)
                ? "en"
                : "ar"
        });
    }

    [HttpPut("me/preferences")]
    public async Task<IActionResult> UpdatePreferences([FromBody] UpdatePreferencesDto dto)
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

        user.PreferredLanguage = string.Equals(dto.PreferredLanguage, "en", StringComparison.OrdinalIgnoreCase)
            ? "en"
            : "ar";

        await _context.SaveChangesAsync();

        var streak = await StreakEngine.SyncAsync(_context, user, DateTime.UtcNow);
        if (streak.Changed)
        {
            await _context.SaveChangesAsync();
        }

        return Ok(new
        {
            user = new
            {
                id = user.Id,
                firstName = user.FirstName,
                lastName = user.LastName,
                email = user.Email,
                level = user.Level,
                totalXP = user.TotalXP,
                currentXP = user.CurrentXP,
                nextLevelXP = user.NextLevelXP,
                currentStreak = streak.CurrentStreak,
                longestStreak = streak.LongestStreak,
                coins = user.Coins,
                lessonsCompleted = user.LessonsCompleted,
                projectsCompleted = user.ProjectsCompleted,
                challengesWon = user.ChallengesWon,
                avatar = user.Avatar,
                hasCompletedOnboarding = user.HasCompletedOnboarding,
                learningGoal = user.LearningGoal,
                skillLevel = user.SkillLevel,
                weeklyDays = user.WeeklyDays,
                dailyMinutes = user.DailyMinutes,
                emailConfirmed = user.EmailConfirmed,
                emailVerificationDeadline = EmailVerificationPolicy.GetDeadlineUtc(user),
                preferredLanguage = user.PreferredLanguage
            }
        });
    }

    [HttpPut("me/password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
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

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
        {
            return BadRequest(new { message = "Current password is incorrect" });
        }

        var passwordValidationError = PasswordRules.Validate(dto.NewPassword);
        if (passwordValidationError is not null)
        {
            return BadRequest(new { message = passwordValidationError });
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _context.SaveChangesAsync();

        return Ok(new { success = true });
    }

    [HttpGet("me/progress")]
    public async Task<IActionResult> GetProgress()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var progressRecords = await _context.LessonProgress
            .Where(item => item.UserId == userId)
            .AsNoTracking()
            .ToListAsync();

        return Ok(new
        {
            completedLessons = progressRecords.Count(item => item.CompletedAt is not null || item.Status == "Completed"),
            inProgressLessons = progressRecords.Count(item => item.ProgressPercent > 0 && item.ProgressPercent < 100),
            averageProgress = progressRecords.Count == 0 ? 0 : (int)Math.Round(progressRecords.Average(item => item.ProgressPercent))
        });
    }

    [HttpGet("me/xp")]
    public async Task<IActionResult> GetXp()
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

        return Ok(new
        {
            totalXP = user.TotalXP,
            currentXP = user.CurrentXP,
            nextLevelXP = user.NextLevelXP,
            level = user.Level
        });
    }

    [HttpGet("me/badges")]
    public async Task<IActionResult> GetBadges()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return NotFound(new { message = "User not found" });
        }

        var nowUtc = DateTime.UtcNow;
        var streak = await StreakEngine.SyncAsync(_context, user, nowUtc);
        var badgesAwarded = await BadgeSyncEngine.SyncAsync(_context, user, nowUtc);
        if (streak.Changed || badgesAwarded > 0)
        {
            await _context.SaveChangesAsync();
        }

        var badgeCodes = await _context.UserBadges
            .Where(item => item.UserId == userId && item.IsUnlocked)
            .Select(item => new UnlockedBadgeRecord(item.BadgeCode, item.EarnedAt))
            .AsNoTracking()
            .ToListAsync();

        var result = badgeCodes
            .Select(item =>
            {
                var metadata = CatalogContent.FindBadge(item.BadgeCode);
                return new BadgeResponse(
                    item.BadgeCode,
                    metadata?.NameAr ?? item.BadgeCode,
                    metadata?.NameEn ?? item.BadgeCode,
                    metadata?.DescriptionAr ?? string.Empty,
                    metadata?.DescriptionEn ?? string.Empty,
                    metadata?.Icon ?? "🏅",
                    item.EarnedAt,
                    true);
            });

        return Ok(result);
    }

    [HttpGet("me/streak")]
    public async Task<IActionResult> GetStreak()
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

        var streak = await StreakEngine.SyncAsync(_context, user, DateTime.UtcNow);
        if (streak.Changed)
        {
            await _context.SaveChangesAsync();
        }

        return Ok(new
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
        });
    }

    private static IReadOnlyList<BadgeResponse> BuildProfileBadges(
        IReadOnlyCollection<UnlockedBadgeRecord> unlockedBadges)
    {
        var unlockedLookup = unlockedBadges
            .ToDictionary(
                item => item.BadgeCode,
                item => (DateTime?)item.EarnedAt,
                StringComparer.OrdinalIgnoreCase);

        return CatalogContent.Badges
            .Select((badge, index) =>
            {
                var unlocked = unlockedLookup.TryGetValue(badge.Code, out var earnedAt);
                return new
                {
                    index,
                    payload = new BadgeResponse(
                        badge.Code,
                        unlocked ? badge.NameAr : "شارة مخفية",
                        unlocked ? badge.NameEn : "Locked Badge",
                        unlocked
                            ? badge.DescriptionAr
                            : "استمر بالتعلم والإنجاز لاكتشاف هذه الشارة.",
                        unlocked
                            ? badge.DescriptionEn
                            : "Keep learning and completing activities to reveal this badge.",
                        unlocked ? badge.Icon : "🔒",
                        earnedAt,
                        unlocked)
                };
            })
            .OrderByDescending(item => item.payload.Unlocked)
            .ThenByDescending(item => item.payload.EarnedAt)
            .ThenBy(item => item.index)
            .Select(item => item.payload)
            .ToList();
    }

    private sealed record BadgeResponse(
        string Code,
        string NameAr,
        string NameEn,
        string DescriptionAr,
        string DescriptionEn,
        string Icon,
        DateTime? EarnedAt,
        bool Unlocked);

    private sealed record UnlockedBadgeRecord(
        string BadgeCode,
        DateTime EarnedAt);

    public sealed class UpdateProfileDto
    {
        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        public string? Avatar { get; set; }

        [MaxLength(120)]
        public string? ProfessionalTitle { get; set; }

        [MaxLength(800)]
        public string? Bio { get; set; }

        [MaxLength(120)]
        public string? Location { get; set; }

        [MaxLength(200)]
        public string? Website { get; set; }
    }

    public sealed class ChangePasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required]
        [MinLength(8)]
        public string NewPassword { get; set; } = string.Empty;
    }

    public sealed class UpdatePreferencesDto
    {
        [Required]
        [RegularExpression("^(ar|en)$")]
        public string PreferredLanguage { get; set; } = "ar";
    }
}
