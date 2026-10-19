using Microsoft.EntityFrameworkCore;
using UXFriends.Domain.Entities;
using UXFriends.Infrastructure.Data;

namespace UXFriends.API.Support;

public sealed record LearningAccessSnapshot(
    int BaselineLevelRank,
    int AccessibleLevelRank,
    IReadOnlySet<string> CertifiedSectionCodes);

public sealed record SectionMilestoneSnapshot(
    string SectionCode,
    string? ProjectCode,
    int CompletedLessons,
    int TotalLessons,
    int PassedUnitQuizzes,
    int TotalUnitQuizzes,
    bool LessonsCompleted,
    bool UnitQuizzesPassed,
    bool ProjectRequired,
    bool ProjectSubmitted,
    bool ProjectEligible,
    bool FinalExamEligible,
    bool CertificateIssued);

public static class LearningAccessPolicy
{
    public static string NormalizeLevel(string? level) =>
        level?.Trim().ToLowerInvariant() switch
        {
            "advanced" or "hard" => "advanced",
            "intermediate" or "medium" => "intermediate",
            _ => "beginner"
        };

    public static int GetLevelRank(string? level) =>
        NormalizeLevel(level) switch
        {
            "advanced" => 3,
            "intermediate" => 2,
            _ => 1
        };

    public static string GetLevelFromRank(int rank) =>
        rank switch
        {
            3 => "advanced",
            2 => "intermediate",
            _ => "beginner"
        };

    public static async Task<LearningAccessSnapshot> BuildSnapshotAsync(
        UXFriendsDbContext context,
        User user)
    {
        var certifiedSectionCodes = await context.Certificates
            .Where(item => item.UserId == user.Id)
            .Select(item => item.SectionCode)
            .ToListAsync();

        var certifiedLookup = certifiedSectionCodes
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var baselineRank = GetLevelRank(user.SkillLevel);
        var accessibleRank = DetermineAccessibleLevelRank(baselineRank, certifiedLookup);

        return new LearningAccessSnapshot(baselineRank, accessibleRank, certifiedLookup);
    }

    public static bool IsSectionAccessible(SectionCatalogItem section, LearningAccessSnapshot snapshot) =>
        GetLevelRank(section.Difficulty) <= snapshot.AccessibleLevelRank;

    public static bool IsSectionAccessible(string sectionCode, LearningAccessSnapshot snapshot)
    {
        var section = CatalogContent.FindSection(sectionCode);
        return section is not null && IsSectionAccessible(section, snapshot);
    }

    public static bool IsUnitAccessible(UnitCatalogItem unit, LearningAccessSnapshot snapshot) =>
        IsSectionAccessible(unit.SectionCode, snapshot);

    public static bool IsLessonAccessible(LessonCatalogItem lesson, LearningAccessSnapshot snapshot)
    {
        var unit = CatalogContent.FindUnit(lesson.UnitCode);
        return unit is not null && IsUnitAccessible(unit, snapshot);
    }

    public static async Task<bool> SyncStoredSkillLevelAsync(
        UXFriendsDbContext context,
        User user)
    {
        var certifiedSectionCodes = await context.Certificates
            .Where(item => item.UserId == user.Id)
            .Select(item => item.SectionCode)
            .ToListAsync();

        var certifiedLookup = certifiedSectionCodes
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var baselineRank = GetLevelRank(user.SkillLevel);
        var accessibleRank = DetermineAccessibleLevelRank(baselineRank, certifiedLookup);
        var nextLevel = GetLevelFromRank(accessibleRank);

        if (string.Equals(NormalizeLevel(user.SkillLevel), nextLevel, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        user.SkillLevel = nextLevel;
        return true;
    }

    public static async Task<SectionMilestoneSnapshot> BuildSectionMilestoneSnapshotAsync(
        UXFriendsDbContext context,
        string userId,
        string sectionCode)
    {
        var unitCodes = CatalogContent.Units
            .Where(item => string.Equals(item.SectionCode, sectionCode, StringComparison.OrdinalIgnoreCase))
            .OrderBy(item => item.OrderNo)
            .Select(item => item.Code)
            .ToList();
        var lessonCodes = CatalogContent.Lessons
            .Where(item => unitCodes.Contains(item.UnitCode))
            .Select(item => item.Code)
            .ToList();

        var totalLessons = lessonCodes.Count;
        var completedLessons = totalLessons == 0
            ? 0
            : await context.LessonProgress
                .Where(item =>
                    item.UserId == userId &&
                    lessonCodes.Contains(item.LessonCode) &&
                    (item.CompletedAt != null || item.Status == "Completed"))
                .Select(item => item.LessonCode)
                .Distinct()
                .CountAsync();

        var totalUnitQuizzes = unitCodes.Count;
        var passedUnitQuizzes = totalUnitQuizzes == 0
            ? 0
            : await context.QuizAttempts
                .Where(item =>
                    item.UserId == userId &&
                    item.Scope == "unit" &&
                    item.Passed &&
                    item.SectionCode == sectionCode)
                .Select(item => item.UnitCode)
                .Distinct()
                .CountAsync();

        var projectCode = await context.Projects
            .Where(item => item.SectionCode == sectionCode)
            .OrderBy(item => item.CreatedAt)
            .Select(item => item.ProjectCode)
            .FirstOrDefaultAsync();
        var projectRequired = !string.IsNullOrWhiteSpace(projectCode);
        var projectSubmitted = projectRequired && await context.ProjectSubmissions
            .AnyAsync(item => item.UserId == userId && item.ProjectCode == projectCode);
        var certificateIssued = await context.Certificates
            .AnyAsync(item => item.UserId == userId && item.SectionCode == sectionCode);

        var lessonsCompleted = totalLessons == 0 || completedLessons == totalLessons;
        var unitQuizzesPassed = totalUnitQuizzes == 0 || passedUnitQuizzes == totalUnitQuizzes;
        var projectEligible = lessonsCompleted && unitQuizzesPassed;
        var finalExamEligible = projectEligible && (!projectRequired || projectSubmitted);

        return new SectionMilestoneSnapshot(
            sectionCode,
            projectCode,
            completedLessons,
            totalLessons,
            passedUnitQuizzes,
            totalUnitQuizzes,
            lessonsCompleted,
            unitQuizzesPassed,
            projectRequired,
            projectSubmitted,
            projectEligible,
            finalExamEligible,
            certificateIssued);
    }

    private static int DetermineAccessibleLevelRank(
        int baselineRank,
        IReadOnlySet<string> certifiedSectionCodes)
    {
        if (baselineRank >= 3)
        {
            return 3;
        }

        var accessibleRank = baselineRank;

        for (var rank = baselineRank; rank < 3; rank += 1)
        {
            if (!HasCompletedLevel(rank, certifiedSectionCodes))
            {
                break;
            }

            accessibleRank = rank + 1;
        }

        return accessibleRank;
    }

    private static bool HasCompletedLevel(
        int rank,
        IReadOnlySet<string> certifiedSectionCodes)
    {
        var level = GetLevelFromRank(rank);

        var levelSectionCodes = CatalogContent.Sections
            .Where(section => NormalizeLevel(section.Difficulty) == level)
            .Select(section => section.Code)
            .ToList();

        return levelSectionCodes.Count > 0 &&
            levelSectionCodes.All(code => certifiedSectionCodes.Contains(code));
    }
}
