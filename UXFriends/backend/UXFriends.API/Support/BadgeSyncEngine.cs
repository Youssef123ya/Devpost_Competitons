using Microsoft.EntityFrameworkCore;
using UXFriends.Domain.Entities;
using UXFriends.Infrastructure.Data;

namespace UXFriends.API.Support;

public sealed record BadgeProgressSnapshot(
    int LessonsCompleted,
    int LessonQuizPasses,
    int UnitQuizPasses,
    int CertificatesEarned,
    int ProjectsSubmitted,
    int ChallengesCompleted,
    int RevisionSessionsCompleted,
    int NotesSaved,
    int TotalXp,
    int Level,
    int LongestStreak);

public static class BadgeSyncEngine
{
    private sealed record BadgeRule(string Code, Func<BadgeProgressSnapshot, bool> IsUnlocked);

    private static readonly IReadOnlyList<BadgeRule> Rules =
    [
        CreateRule("first-lesson", snapshot => snapshot.LessonsCompleted >= 1),
        CreateRule("lesson-five", snapshot => snapshot.LessonsCompleted >= 5),
        CreateRule("lesson-fifteen", snapshot => snapshot.LessonsCompleted >= 15),
        CreateRule("lesson-thirty", snapshot => snapshot.LessonsCompleted >= 30),
        CreateRule("lesson-sixty", snapshot => snapshot.LessonsCompleted >= 60),
        CreateRule("lesson-ninety", snapshot => snapshot.LessonsCompleted >= 90),

        CreateRule("first-lesson-quiz", snapshot => snapshot.LessonQuizPasses >= 1),
        CreateRule("lesson-quiz-five", snapshot => snapshot.LessonQuizPasses >= 5),
        CreateRule("lesson-quiz-fifteen", snapshot => snapshot.LessonQuizPasses >= 15),
        CreateRule("lesson-quiz-thirty", snapshot => snapshot.LessonQuizPasses >= 30),

        CreateRule("first-unit-quiz", snapshot => snapshot.UnitQuizPasses >= 1),
        CreateRule("unit-quiz-three", snapshot => snapshot.UnitQuizPasses >= 3),
        CreateRule("unit-quiz-eight", snapshot => snapshot.UnitQuizPasses >= 8),
        CreateRule("unit-quiz-fifteen", snapshot => snapshot.UnitQuizPasses >= 15),

        CreateRule("first-certificate", snapshot => snapshot.CertificatesEarned >= 1),
        CreateRule("certificates-three", snapshot => snapshot.CertificatesEarned >= 3),
        CreateRule("certificates-six", snapshot => snapshot.CertificatesEarned >= 6),
        CreateRule("certificates-ten", snapshot => snapshot.CertificatesEarned >= 10),
        CreateRule("certificates-fifteen", snapshot => snapshot.CertificatesEarned >= 15),

        CreateRule("first-project", snapshot => snapshot.ProjectsSubmitted >= 1),
        CreateRule("projects-three", snapshot => snapshot.ProjectsSubmitted >= 3),
        CreateRule("projects-six", snapshot => snapshot.ProjectsSubmitted >= 6),
        CreateRule("projects-ten", snapshot => snapshot.ProjectsSubmitted >= 10),

        CreateRule("challenge-winner", snapshot => snapshot.ChallengesCompleted >= 1),
        CreateRule("challenges-three", snapshot => snapshot.ChallengesCompleted >= 3),
        CreateRule("challenges-six", snapshot => snapshot.ChallengesCompleted >= 6),
        CreateRule("challenges-twelve", snapshot => snapshot.ChallengesCompleted >= 12),

        CreateRule("three-day-streak", snapshot => snapshot.LongestStreak >= 3),
        CreateRule("seven-day-streak", snapshot => snapshot.LongestStreak >= 7),
        CreateRule("fourteen-day-streak", snapshot => snapshot.LongestStreak >= 14),
        CreateRule("thirty-day-streak", snapshot => snapshot.LongestStreak >= 30),
        CreateRule("sixty-day-streak", snapshot => snapshot.LongestStreak >= 60),
        CreateRule("hundred-day-streak", snapshot => snapshot.LongestStreak >= 100),

        CreateRule("revision-first", snapshot => snapshot.RevisionSessionsCompleted >= 1),
        CreateRule("revision-five", snapshot => snapshot.RevisionSessionsCompleted >= 5),
        CreateRule("revision-fifteen", snapshot => snapshot.RevisionSessionsCompleted >= 15),
        CreateRule("revision-thirty", snapshot => snapshot.RevisionSessionsCompleted >= 30),

        CreateRule("notes-first", snapshot => snapshot.NotesSaved >= 1),
        CreateRule("notes-five", snapshot => snapshot.NotesSaved >= 5),
        CreateRule("notes-twenty", snapshot => snapshot.NotesSaved >= 20),
        CreateRule("notes-fifty", snapshot => snapshot.NotesSaved >= 50),

        CreateRule("xp-500", snapshot => snapshot.TotalXp >= 500),
        CreateRule("xp-1500", snapshot => snapshot.TotalXp >= 1500),
        CreateRule("xp-5000", snapshot => snapshot.TotalXp >= 5000),
        CreateRule("xp-12000", snapshot => snapshot.TotalXp >= 12000),
        CreateRule("xp-25000", snapshot => snapshot.TotalXp >= 25000),

        CreateRule("level-five", snapshot => snapshot.Level >= 5),
        CreateRule("level-ten", snapshot => snapshot.Level >= 10),
        CreateRule("level-twenty", snapshot => snapshot.Level >= 20)
    ];

    public static async Task<int> SyncAsync(UXFriendsDbContext context, User user, DateTime nowUtc)
    {
        var snapshot = await BuildSnapshotAsync(context, user);
        var unlockedCodes = (await context.UserBadges
                .Where(item => item.UserId == user.Id && item.IsUnlocked)
                .Select(item => item.BadgeCode)
                .ToListAsync())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        unlockedCodes.UnionWith(context.UserBadges.Local
            .Where(item => item.UserId == user.Id && item.IsUnlocked)
            .Select(item => item.BadgeCode));

        var unlockedCount = 0;

        foreach (var rule in Rules)
        {
            if (!rule.IsUnlocked(snapshot) || !unlockedCodes.Add(rule.Code))
            {
                continue;
            }

            context.UserBadges.Add(new UserBadge
            {
                UserBadgeCode = Guid.NewGuid().ToString("N"),
                UserId = user.Id,
                BadgeCode = rule.Code,
                IsUnlocked = true,
                EarnedAt = nowUtc
            });
            unlockedCount += 1;
        }

        return unlockedCount;
    }

    private static BadgeRule CreateRule(
        string code,
        Func<BadgeProgressSnapshot, bool> isUnlocked)
    {
        return new BadgeRule(code, isUnlocked);
    }

    private static async Task<BadgeProgressSnapshot> BuildSnapshotAsync(
        UXFriendsDbContext context,
        User user)
    {
        var lessonsCompleted = await context.LessonProgress
            .Where(item =>
                item.UserId == user.Id &&
                (item.CompletedAt != null || item.Status == "Completed"))
            .Select(item => item.LessonCode)
            .Distinct()
            .CountAsync();

        var lessonQuizPasses = await context.XPLogs
            .Where(item =>
                item.UserId == user.Id &&
                (item.ActivityType == "LessonQuizCompleted" || item.ActivityType == "LessonQuizPassed") &&
                item.ReferenceId != null)
            .Select(item => item.ReferenceId!)
            .Distinct()
            .CountAsync();

        var unitQuizPasses = await context.XPLogs
            .Where(item =>
                item.UserId == user.Id &&
                (item.ActivityType == "UnitQuizCompleted" || item.ActivityType == "UnitQuizPassed") &&
                item.ReferenceId != null)
            .Select(item => item.ReferenceId!)
            .Distinct()
            .CountAsync();

        var certificatesEarned = await context.Certificates
            .Where(item => item.UserId == user.Id)
            .Select(item => item.CertificateCode)
            .Distinct()
            .CountAsync();

        var projectsSubmitted = await context.ProjectSubmissions
            .Where(item => item.UserId == user.Id && item.SubmissionUrl != string.Empty)
            .Select(item => item.ProjectCode)
            .Distinct()
            .CountAsync();

        var challengesCompleted = await context.UserChallenges
            .Where(item => item.UserId == user.Id && item.CompletedAt != null)
            .CountAsync();

        var revisionSessionsCompleted = await context.XPLogs
            .Where(item =>
                item.UserId == user.Id &&
                item.ActivityType == "RevisionSessionCompleted")
            .CountAsync();

        var notesSaved = await context.UserNotes
            .Where(item => item.UserId == user.Id && item.Content != string.Empty)
            .Select(item => item.LessonCode)
            .Distinct()
            .CountAsync();

        return new BadgeProgressSnapshot(
            Math.Max(user.LessonsCompleted, lessonsCompleted),
            lessonQuizPasses,
            unitQuizPasses,
            certificatesEarned,
            Math.Max(user.ProjectsCompleted, projectsSubmitted),
            Math.Max(user.ChallengesWon, challengesCompleted),
            revisionSessionsCompleted,
            notesSaved,
            user.TotalXP,
            user.Level,
            user.LongestStreak);
    }
}
