using Microsoft.EntityFrameworkCore;
using UXFriends.Infrastructure.Data;

namespace UXFriends.API.Support;

public sealed record ChallengeProgressSnapshot(
    string ObjectiveAr,
    string ObjectiveEn,
    string ProgressLabelAr,
    string ProgressLabelEn,
    int Current,
    int Target,
    bool ReadyToClaim);

public static class ChallengeProgressEngine
{
    private static readonly HashSet<string> XpEligibleActivityTypes =
    [
        "LessonCompleted",
        "LessonQuizCompleted",
        "UnitQuizCompleted",
        "SectionQuizCompleted",
        "ProjectCompleted",
        "RevisionSessionCompleted",
        "DailyGoalCompleted"
    ];

    public static async Task<ChallengeProgressSnapshot> EvaluateAsync(
        UXFriendsDbContext context,
        string userId,
        ActiveChallengeInstance instance,
        DateTime? joinedAtUtc,
        DateTime? nowUtc = null)
    {
        var referenceNow = nowUtc?.ToUniversalTime() ?? DateTime.UtcNow;
        var windowEndUtc = instance.ExpiresAt <= referenceNow ? instance.ExpiresAt : referenceNow;
        var effectiveStartUtc = joinedAtUtc is null
            ? (DateTime?)null
            : new[]
            {
                joinedAtUtc.Value.ToUniversalTime(),
                instance.StartsAt
            }.Max();

        var current = 0;
        if (effectiveStartUtc is not null && effectiveStartUtc.Value < windowEndUtc)
        {
            current = instance.Template.Metric switch
            {
                "lessons_completed" => await CountCompletedLessonsAsync(
                    context,
                    userId,
                    effectiveStartUtc.Value,
                    windowEndUtc),
                "lesson_quizzes_passed" => await CountXpLogsAsync(
                    context,
                    userId,
                    "LessonQuizCompleted",
                    effectiveStartUtc.Value,
                    windowEndUtc),
                "unit_quizzes_passed" => await CountXpLogsAsync(
                    context,
                    userId,
                    "UnitQuizCompleted",
                    effectiveStartUtc.Value,
                    windowEndUtc),
                "quizzes_passed" => await CountXpLogsAsync(
                    context,
                    userId,
                    ["LessonQuizCompleted", "UnitQuizCompleted"],
                    effectiveStartUtc.Value,
                    windowEndUtc),
                "learning_minutes" => await CountLearningMinutesAsync(
                    context,
                    userId,
                    effectiveStartUtc.Value,
                    windowEndUtc),
                "xp_earned" => await CountEarnedXpAsync(
                    context,
                    userId,
                    effectiveStartUtc.Value,
                    windowEndUtc),
                "activities_completed" => await CountCompletedActivitiesAsync(
                    context,
                    userId,
                    effectiveStartUtc.Value,
                    windowEndUtc),
                "projects_submitted" => await CountSubmittedProjectsAsync(
                    context,
                    userId,
                    effectiveStartUtc.Value,
                    windowEndUtc),
                "notes_saved" => await CountSavedNotesAsync(
                    context,
                    userId,
                    effectiveStartUtc.Value,
                    windowEndUtc),
                "revision_sessions_completed" => await CountXpLogsAsync(
                    context,
                    userId,
                    "RevisionSessionCompleted",
                    effectiveStartUtc.Value,
                    windowEndUtc),
                "section_quizzes_passed" => await CountXpLogsAsync(
                    context,
                    userId,
                    "SectionQuizCompleted",
                    effectiveStartUtc.Value,
                    windowEndUtc),
                _ => 0
            };
        }

        var readyToClaim = current >= instance.Template.Target;
        var displayCurrent = Math.Min(current, instance.Template.Target);
        var objective = DescribeObjective(instance.Template);
        var progressLabel = BuildProgressLabel(instance.Template, displayCurrent);

        return new ChallengeProgressSnapshot(
            objective.ObjectiveAr,
            objective.ObjectiveEn,
            progressLabel.ProgressLabelAr,
            progressLabel.ProgressLabelEn,
            displayCurrent,
            instance.Template.Target,
            readyToClaim);
    }

    public static (string ObjectiveAr, string ObjectiveEn) DescribeObjective(
        ChallengeCatalogItem template)
    {
        return template.Metric switch
        {
            "lessons_completed" => (
                $"أكمل {template.Target} {(template.Target == 1 ? "درس" : "دروس")} داخل وقت التحدي.",
                $"Complete {template.Target} lesson{(template.Target == 1 ? string.Empty : "s")} during this challenge window."),
            "lesson_quizzes_passed" => (
                $"اجتز {template.Target} {(template.Target == 1 ? "اختبار درس" : "اختبارات دروس")} داخل وقت التحدي.",
                template.Target == 1
                    ? "Pass 1 lesson quiz during this challenge window."
                    : $"Pass {template.Target} lesson quizzes during this challenge window."),
            "unit_quizzes_passed" => (
                $"اجتز {template.Target} {(template.Target == 1 ? "اختبار وحدة" : "اختبارات وحدات")} داخل وقت التحدي.",
                template.Target == 1
                    ? "Pass 1 unit quiz during this challenge window."
                    : $"Pass {template.Target} unit quizzes during this challenge window."),
            "quizzes_passed" => (
                $"اجتز {template.Target} {(template.Target == 1 ? "اختباراً" : "اختبارات")} داخل وقت التحدي.",
                template.Target == 1
                    ? "Pass 1 quiz during this challenge window."
                    : $"Pass {template.Target} quizzes during this challenge window."),
            "learning_minutes" => (
                $"أنهِ {template.Target} دقيقة تعلم حقيقية داخل وقت التحدي.",
                $"Log {template.Target} real learning minutes during this challenge window."),
            "xp_earned" => (
                $"اكسب {template.Target} XP من الدروس أو الاختبارات أو المشاريع داخل وقت التحدي.",
                $"Earn {template.Target} XP from lessons, quizzes, or projects during this challenge window."),
            "activities_completed" => (
                $"أنهِ {template.Target} أنشطة تعلم مختلفة داخل وقت التحدي.",
                $"Finish {template.Target} learning activities during this challenge window."),
            "projects_submitted" => (
                $"أرسل {template.Target} {(template.Target == 1 ? "مشروعاً" : "مشاريع")} داخل وقت التحدي.",
                $"Submit {template.Target} project{(template.Target == 1 ? string.Empty : "s")} during this challenge window."),
            "notes_saved" => (
                $"احفظ {template.Target} {(template.Target == 1 ? "ملاحظة" : "ملاحظات")} على دروس مختلفة داخل وقت التحدي.",
                $"Save notes across {template.Target} lesson{(template.Target == 1 ? string.Empty : "s")} during this challenge window."),
            "revision_sessions_completed" => (
                $"أكمل {template.Target} {(template.Target == 1 ? "جلسة مراجعة" : "جلسات مراجعة")} داخل وقت التحدي.",
                $"Complete {template.Target} revision session{(template.Target == 1 ? string.Empty : "s")} during this challenge window."),
            "section_quizzes_passed" => (
                $"اجتز {template.Target} {(template.Target == 1 ? "اختبار قسم" : "اختبارات أقسام")} داخل وقت التحدي.",
                template.Target == 1
                    ? "Pass 1 section exam during this challenge window."
                    : $"Pass {template.Target} section exams during this challenge window."),
            _ => (
                "أكمل متطلبات التحدي قبل المطالبة بالمكافأة.",
                "Complete the challenge requirements before claiming the reward.")
        };
    }

    public static ChallengeProgressSnapshot CreateCompletedSnapshot(
        ChallengeCatalogItem template)
    {
        var objective = DescribeObjective(template);
        var progressLabel = BuildProgressLabel(template, template.Target);

        return new ChallengeProgressSnapshot(
            objective.ObjectiveAr,
            objective.ObjectiveEn,
            progressLabel.ProgressLabelAr,
            progressLabel.ProgressLabelEn,
            template.Target,
            template.Target,
            true);
    }

    private static (string ProgressLabelAr, string ProgressLabelEn) BuildProgressLabel(
        ChallengeCatalogItem template,
        int current)
    {
        return template.Metric switch
        {
            "lessons_completed" => (
                $"{current} / {template.Target} دروس مكتملة",
                $"{current} / {template.Target} lessons completed"),
            "lesson_quizzes_passed" => (
                $"{current} / {template.Target} اختبارات دروس",
                $"{current} / {template.Target} lesson quizzes"),
            "unit_quizzes_passed" => (
                $"{current} / {template.Target} اختبارات وحدات",
                $"{current} / {template.Target} unit quizzes"),
            "quizzes_passed" => (
                $"{current} / {template.Target} اختبارات",
                $"{current} / {template.Target} quizzes"),
            "learning_minutes" => (
                $"{current} / {template.Target} دقيقة تعلم",
                $"{current} / {template.Target} learning minutes"),
            "xp_earned" => (
                $"{current} / {template.Target} XP مكتسبة",
                $"{current} / {template.Target} XP earned"),
            "activities_completed" => (
                $"{current} / {template.Target} أنشطة مكتملة",
                $"{current} / {template.Target} activities completed"),
            "projects_submitted" => (
                $"{current} / {template.Target} مشاريع مرسلة",
                $"{current} / {template.Target} projects submitted"),
            "notes_saved" => (
                $"{current} / {template.Target} ملاحظات محفوظة",
                $"{current} / {template.Target} notes saved"),
            "revision_sessions_completed" => (
                $"{current} / {template.Target} جلسات مراجعة",
                $"{current} / {template.Target} revision sessions"),
            "section_quizzes_passed" => (
                $"{current} / {template.Target} اختبارات أقسام",
                $"{current} / {template.Target} section exams"),
            _ => (
                $"{current} / {template.Target}",
                $"{current} / {template.Target}")
        };
    }

    private static async Task<int> CountCompletedLessonsAsync(
        UXFriendsDbContext context,
        string userId,
        DateTime fromUtc,
        DateTime toUtc)
    {
        return await context.LessonProgress
            .AsNoTracking()
            .CountAsync(item =>
                item.UserId == userId &&
                item.CompletedAt != null &&
                item.CompletedAt >= fromUtc &&
                item.CompletedAt <= toUtc);
    }

    private static async Task<int> CountLearningMinutesAsync(
        UXFriendsDbContext context,
        string userId,
        DateTime fromUtc,
        DateTime toUtc)
    {
        var lessonCodes = await context.LessonProgress
            .AsNoTracking()
            .Where(item =>
                item.UserId == userId &&
                item.CompletedAt != null &&
                item.CompletedAt >= fromUtc &&
                item.CompletedAt <= toUtc)
            .Select(item => item.LessonCode)
            .ToListAsync();

        if (lessonCodes.Count == 0)
        {
            return 0;
        }

        return CatalogContent.Lessons
            .Where(item => lessonCodes.Contains(item.Code))
            .Sum(item => item.DurationMinutes);
    }

    private static async Task<int> CountEarnedXpAsync(
        UXFriendsDbContext context,
        string userId,
        DateTime fromUtc,
        DateTime toUtc)
    {
        return await context.XPLogs
            .AsNoTracking()
            .Where(item =>
                item.UserId == userId &&
                XpEligibleActivityTypes.Contains(item.ActivityType) &&
                item.CreatedAt >= fromUtc &&
                item.CreatedAt <= toUtc)
            .SumAsync(item => item.XP);
    }

    private static async Task<int> CountCompletedActivitiesAsync(
        UXFriendsDbContext context,
        string userId,
        DateTime fromUtc,
        DateTime toUtc)
    {
        var logs = await context.XPLogs
            .AsNoTracking()
            .Where(item =>
                item.UserId == userId &&
                XpEligibleActivityTypes.Contains(item.ActivityType) &&
                item.CreatedAt >= fromUtc &&
                item.CreatedAt <= toUtc)
            .ToListAsync();

        return logs
            .GroupBy(item => $"{item.ActivityType}:{item.ReferenceId ?? item.LogCode}")
            .Count();
    }

    private static async Task<int> CountSubmittedProjectsAsync(
        UXFriendsDbContext context,
        string userId,
        DateTime fromUtc,
        DateTime toUtc)
    {
        return await context.ProjectSubmissions
            .AsNoTracking()
            .CountAsync(item =>
                item.UserId == userId &&
                item.SubmittedAt >= fromUtc &&
                item.SubmittedAt <= toUtc &&
                item.Status == "Approved");
    }

    private static async Task<int> CountSavedNotesAsync(
        UXFriendsDbContext context,
        string userId,
        DateTime fromUtc,
        DateTime toUtc)
    {
        return await context.UserNotes
            .AsNoTracking()
            .Where(item =>
                item.UserId == userId &&
                item.Content != string.Empty &&
                item.UpdatedAt >= fromUtc &&
                item.UpdatedAt <= toUtc)
            .Select(item => item.LessonCode)
            .Distinct()
            .CountAsync();
    }

    private static async Task<int> CountXpLogsAsync(
        UXFriendsDbContext context,
        string userId,
        string activityType,
        DateTime fromUtc,
        DateTime toUtc)
    {
        return await CountXpLogsAsync(context, userId, [activityType], fromUtc, toUtc);
    }

    private static async Task<int> CountXpLogsAsync(
        UXFriendsDbContext context,
        string userId,
        IReadOnlyCollection<string> activityTypes,
        DateTime fromUtc,
        DateTime toUtc)
    {
        return await context.XPLogs
            .AsNoTracking()
            .Where(item =>
                item.UserId == userId &&
                activityTypes.Contains(item.ActivityType) &&
                item.CreatedAt >= fromUtc &&
                item.CreatedAt <= toUtc)
            .CountAsync();
    }
}
