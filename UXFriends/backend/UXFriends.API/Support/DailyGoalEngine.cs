using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using UXFriends.Domain.Entities;
using UXFriends.Infrastructure.Data;

namespace UXFriends.API.Support;

public sealed record DailyGoalTemplate(
    string Code,
    string Category,
    string Metric,
    int Target,
    int XpReward,
    string TitleAr,
    string TitleEn,
    string DescriptionAr,
    string DescriptionEn);

public sealed record DailyGoalProgress(
    DailyGoalTemplate Template,
    int Current,
    bool Completed,
    bool RewardClaimed);

public sealed record DailyGoalSyncResult(
    IReadOnlyList<DailyGoalProgress> Goals,
    int XpAwarded,
    DateTime DayStartUtc,
    DateTime ServerNowUtc);

public static class DailyGoalEngine
{
    private static readonly string[] LessonThemesAr =
    [
        "خطوة البداية",
        "دفعة مركزة",
        "جلسة تقدم",
        "موجة تعلم",
        "إيقاع ثابت",
        "قفزة صغيرة",
        "دفعة خبرة",
        "مسار نشط",
        "تقدم عملي",
        "إنجاز اليوم"
    ];

    private static readonly string[] LessonThemesEn =
    [
        "Starter push",
        "Focused sprint",
        "Progress session",
        "Learning wave",
        "Steady rhythm",
        "Small leap",
        "Skill push",
        "Active path",
        "Practical progress",
        "Daily win"
    ];

    private static readonly string[] FocusThemesAr =
    [
        "تركيز عميق",
        "جلسة هادئة",
        "طاقة مركزة",
        "زمن نوعي",
        "دقائق فعالة",
        "ساعة التعلم",
        "استثمار الوقت",
        "موجة تركيز",
        "دفعة إنتاج",
        "حصة مركزة"
    ];

    private static readonly string[] FocusThemesEn =
    [
        "Deep focus",
        "Calm session",
        "Focused energy",
        "Quality time",
        "Effective minutes",
        "Learning hour",
        "Time investment",
        "Focus wave",
        "Productive push",
        "Study block"
    ];

    private static readonly string[] ConsistencyThemesAr =
    [
        "حافظ على السلسلة",
        "نبض يومي",
        "إيقاع التعلم",
        "حضور ثابت",
        "حركة يومية",
        "زخم مستمر",
        "استمرار ذكي",
        "تعلّم بلا انقطاع",
        "دفعة الانضباط",
        "التزام اليوم"
    ];

    private static readonly string[] ConsistencyThemesEn =
    [
        "Protect the streak",
        "Daily pulse",
        "Learning rhythm",
        "Steady presence",
        "Daily momentum",
        "Consistent drive",
        "Smart consistency",
        "No-break learning",
        "Discipline push",
        "Today’s commitment"
    ];

    private static readonly IReadOnlyList<DailyGoalTemplate> LessonGoals = BuildLessonGoals();
    private static readonly IReadOnlyList<DailyGoalTemplate> FocusGoals = BuildFocusGoals();
    private static readonly IReadOnlyList<DailyGoalTemplate> ConsistencyGoals = BuildConsistencyGoals();
    private static readonly IReadOnlyDictionary<string, DailyGoalTemplate> TemplateLookup =
        LessonGoals
            .Concat(FocusGoals)
            .Concat(ConsistencyGoals)
            .ToDictionary(item => item.Code, item => item, StringComparer.OrdinalIgnoreCase);

    public static DailyGoalTemplate? FindTemplate(string code) =>
        TemplateLookup.TryGetValue(code, out var template) ? template : null;

    public static async Task<DailyGoalSyncResult> SyncAsync(
        UXFriendsDbContext context,
        User user,
        DateTime? nowUtc = null)
    {
        var referenceNow = nowUtc?.ToUniversalTime() ?? DateTime.UtcNow;
        var dayStartUtc = new DateTime(
            referenceNow.Year,
            referenceNow.Month,
            referenceNow.Day,
            0,
            0,
            0,
            DateTimeKind.Utc);
        var dayEndUtc = dayStartUtc.AddDays(1);
        var dayKey = dayStartUtc.ToString("yyyyMMdd");

        var progressToday = await context.LessonProgress
            .Where(item =>
                item.UserId == user.Id &&
                item.CompletedAt != null &&
                item.CompletedAt >= dayStartUtc &&
                item.CompletedAt < dayEndUtc)
            .AsNoTracking()
            .ToListAsync();

        var lessonCodes = progressToday.Select(item => item.LessonCode).ToHashSet();
        var minutesLearnedToday = CatalogContent.Lessons
            .Where(item => lessonCodes.Contains(item.Code))
            .Sum(item => item.DurationMinutes);

        var xpLogsToday = await context.XPLogs
            .Where(item =>
                item.UserId == user.Id &&
                item.CreatedAt >= dayStartUtc &&
                item.CreatedAt < dayEndUtc)
            .ToListAsync();

        var dailyGoalRewards = xpLogsToday
            .Where(item => string.Equals(item.ActivityType, "DailyGoalCompleted", StringComparison.OrdinalIgnoreCase))
            .Select(item => item.ReferenceId ?? string.Empty)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var consistencyActionsToday = xpLogsToday
            .Where(item =>
                string.Equals(item.ActivityType, "LessonCompleted", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(item.ActivityType, "LessonQuizCompleted", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(item.ActivityType, "UnitQuizCompleted", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(item.ActivityType, "ProjectCompleted", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(item.ActivityType, "ChallengeCompleted", StringComparison.OrdinalIgnoreCase))
            .GroupBy(item => $"{item.ActivityType}:{item.ReferenceId ?? item.LogCode}")
            .Count();

        var assignments = new[]
        {
            PickGoal(LessonGoals, user.Id, dayKey, "lessons"),
            PickGoal(FocusGoals, user.Id, dayKey, "focus"),
            PickGoal(ConsistencyGoals, user.Id, dayKey, "consistency"),
        };

        var awardedXp = 0;
        var results = new List<DailyGoalProgress>(assignments.Length);

        foreach (var assignment in assignments)
        {
            var current = assignment.Metric switch
            {
                "lessons_completed_today" => progressToday.Count,
                "minutes_learned_today" => minutesLearnedToday,
                "consistency_actions_today" => consistencyActionsToday,
                _ => 0
            };

            var completed = current >= assignment.Target;
            var rewardReference = $"{dayKey}:{assignment.Code}";
            var rewardClaimed = dailyGoalRewards.Contains(rewardReference);

            if (completed && !rewardClaimed)
            {
                GamificationHelper.ApplyXp(user, assignment.XpReward);
                context.XPLogs.Add(new XPLog
                {
                    LogCode = Guid.NewGuid().ToString("N"),
                    UserId = user.Id,
                    XP = assignment.XpReward,
                    ActivityType = "DailyGoalCompleted",
                    ReferenceId = rewardReference,
                    CreatedAt = referenceNow
                });
                dailyGoalRewards.Add(rewardReference);
                rewardClaimed = true;
                awardedXp += assignment.XpReward;
            }

            var displayCurrent = Math.Min(current, assignment.Target);

            results.Add(new DailyGoalProgress(
                assignment,
                displayCurrent,
                completed,
                rewardClaimed));
        }

        return new DailyGoalSyncResult(results, awardedXp, dayStartUtc, referenceNow);
    }

    private static DailyGoalTemplate PickGoal(
        IReadOnlyList<DailyGoalTemplate> templates,
        string userId,
        string dayKey,
        string category)
    {
        var index = GetDeterministicIndex($"{userId}:{dayKey}:{category}", templates.Count);
        return templates[index];
    }

    private static int GetDeterministicIndex(string seed, int modulo)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(seed));
        var value = BitConverter.ToUInt32(hash, 0);
        return (int)(value % Math.Max(modulo, 1));
    }

    private static IReadOnlyList<DailyGoalTemplate> BuildLessonGoals()
    {
        var list = new List<DailyGoalTemplate>(30);
        var targets = new[] { 1, 2, 3 };

        for (var themeIndex = 0; themeIndex < LessonThemesAr.Length; themeIndex++)
        {
            for (var variantIndex = 0; variantIndex < targets.Length; variantIndex++)
            {
                var target = targets[variantIndex];
                var code = $"goal-lessons-{themeIndex + 1:D2}-{variantIndex + 1:D2}";
                list.Add(new DailyGoalTemplate(
                    code,
                    "lessons",
                    "lessons_completed_today",
                    target,
                    XpEconomy.GetDailyGoalReward("lessons", target),
                    $"{LessonThemesAr[themeIndex]}: أكمل {target} {(target == 1 ? "درس" : "دروس")} اليوم",
                    $"{LessonThemesEn[themeIndex]}: complete {target} lesson{(target == 1 ? "" : "s")} today",
                    $"أنهِ {target} {(target == 1 ? "درس" : "دروس")} اليوم للحفاظ على تقدمك اليومي.",
                    $"Finish {target} lesson{(target == 1 ? "" : "s")} today to keep your learning streak moving."));
            }
        }

        return list;
    }

    private static IReadOnlyList<DailyGoalTemplate> BuildFocusGoals()
    {
        var list = new List<DailyGoalTemplate>(30);
        var targets = new[] { 15, 30, 45 };

        for (var themeIndex = 0; themeIndex < FocusThemesAr.Length; themeIndex++)
        {
            for (var variantIndex = 0; variantIndex < targets.Length; variantIndex++)
            {
                var target = targets[variantIndex];
                var code = $"goal-focus-{themeIndex + 1:D2}-{variantIndex + 1:D2}";
                list.Add(new DailyGoalTemplate(
                    code,
                    "focus",
                    "minutes_learned_today",
                    target,
                    XpEconomy.GetDailyGoalReward("focus", target),
                    $"{FocusThemesAr[themeIndex]}: تعلّم {target} دقيقة اليوم",
                    $"{FocusThemesEn[themeIndex]}: study for {target} minutes today",
                    $"خصص {target} دقيقة من التعلم الحقيقي اليوم وادفع مستواك خطوة إضافية.",
                    $"Put in {target} minutes of real study time today and push your level forward."));
            }
        }

        return list;
    }

    private static IReadOnlyList<DailyGoalTemplate> BuildConsistencyGoals()
    {
        var list = new List<DailyGoalTemplate>(30);
        var targets = new[] { 1, 2, 3 };

        for (var themeIndex = 0; themeIndex < ConsistencyThemesAr.Length; themeIndex++)
        {
            for (var variantIndex = 0; variantIndex < targets.Length; variantIndex++)
            {
                var target = targets[variantIndex];
                var code = $"goal-consistency-{themeIndex + 1:D2}-{variantIndex + 1:D2}";
                list.Add(new DailyGoalTemplate(
                    code,
                    "consistency",
                    "consistency_actions_today",
                    target,
                    XpEconomy.GetDailyGoalReward("consistency", target),
                    $"{ConsistencyThemesAr[themeIndex]}: أنجز {target} {(target == 1 ? "نشاط" : "أنشطة")} تعلّم اليوم",
                    $"{ConsistencyThemesEn[themeIndex]}: finish {target} learning action{(target == 1 ? "" : "s")} today",
                    $"أكمل {target} {(target == 1 ? "نشاط" : "أنشطة")} من الدروس أو الاختبارات أو المشاريع لدعم استمراريتك.",
                    $"Complete {target} learning action{(target == 1 ? "" : "s")} from lessons, quizzes, projects, or challenges to reinforce consistency."));
            }
        }

        return list;
    }
}
