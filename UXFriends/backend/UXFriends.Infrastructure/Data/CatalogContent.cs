namespace UXFriends.Infrastructure.Data;

public record SectionCatalogItem(
    string Code,
    string TitleAr,
    string TitleEn,
    string DescriptionAr,
    string DescriptionEn,
    string Icon,
    string Difficulty,
    int OrderNo,
    bool IsLocked
);

public record UnitCatalogItem(
    string Code,
    string SectionCode,
    string TitleAr,
    string TitleEn,
    string DescriptionAr,
    string DescriptionEn,
    int DurationMinutes,
    int XpReward,
    string Difficulty,
    int OrderNo,
    bool IsLocked
);

public record LessonCatalogItem(
    string Code,
    string UnitCode,
    string TitleAr,
    string TitleEn,
    string DescriptionAr,
    string DescriptionEn,
    string ContentAr,
    string ContentEn,
    int DurationMinutes,
    int XpReward,
    string Difficulty,
    int OrderNo
);

public record ChallengeCatalogItem(
    string Code,
    string LevelBand,
    string TitleAr,
    string TitleEn,
    string DescriptionAr,
    string DescriptionEn,
    string ChallengeType,
    string Difficulty,
    int XpReward,
    int DurationHours,
    string Metric,
    int Target
);

public record BadgeCatalogItem(
    string Code,
    string NameAr,
    string NameEn,
    string DescriptionAr,
    string DescriptionEn,
    string Icon
);

public static class CatalogContent
{
    public static readonly IReadOnlyList<SectionCatalogItem> Sections = CourseBlueprintCatalog.Sections
        .Select((section, index) => new SectionCatalogItem(
            section.Code,
            section.TitleAr,
            section.TitleEn,
            section.DescriptionAr,
            section.DescriptionEn,
            section.Icon,
            section.Level,
            index + 1,
            false))
        .ToList();

    public static readonly IReadOnlyList<UnitCatalogItem> Units = CourseBlueprintCatalog.Sections
        .SelectMany(section => section.Units.Select((unit, index) => new UnitCatalogItem(
            unit.Code,
            section.Code,
            unit.TitleAr,
            unit.TitleEn,
            unit.DescriptionAr,
            unit.DescriptionEn,
            unit.DurationMinutes,
            XpEconomy.GetUnitDisplayReward(unit, section.Level),
            section.Level,
            index + 1,
            false)))
        .ToList();

    public static readonly IReadOnlyList<LessonCatalogItem> Lessons = CourseBlueprintCatalog.Sections
        .SelectMany(section => section.Units.SelectMany(unit => unit.Lessons.Select((lesson, index) => new LessonCatalogItem(
            lesson.Code,
            unit.Code,
            lesson.TitleAr,
            lesson.TitleEn,
            lesson.DescriptionAr,
            lesson.DescriptionEn,
            lesson.OverviewAr,
            lesson.OverviewEn,
            lesson.DurationMinutes,
            XpEconomy.GetLessonReward(lesson, section.Level),
            section.Level,
            index + 1))))
        .ToList();

    public static readonly IReadOnlyList<ChallengeCatalogItem> Challenges = BuildChallenges();

    public static readonly IReadOnlyList<BadgeCatalogItem> Badges = BuildBadges();

    public static SectionCatalogItem? FindSection(string code) =>
        Sections.FirstOrDefault(section => section.Code == code);

    public static UnitCatalogItem? FindUnit(string code) =>
        Units.FirstOrDefault(unit => unit.Code == code);

    public static LessonCatalogItem? FindLesson(string code) =>
        Lessons.FirstOrDefault(lesson => lesson.Code == code);

    public static ChallengeCatalogItem? FindChallenge(string code) =>
        Challenges.FirstOrDefault(challenge => challenge.Code == code);

    public static BadgeCatalogItem? FindBadge(string code) =>
        Badges.FirstOrDefault(badge => badge.Code == code);

    private static IReadOnlyList<BadgeCatalogItem> BuildBadges()
    {
        return
        [
            CreateBadge("first-lesson", "أول خطوة", "First Step", "أكمل أول درس لك.", "Complete your first lesson.", "✨"),
            CreateBadge("lesson-five", "خمس دروس", "Five Lessons", "أكمل 5 دروس في رحلتك التعليمية.", "Complete 5 lessons in your learning journey.", "📘"),
            CreateBadge("lesson-fifteen", "دفعة التعلم", "Learning Momentum", "أكمل 15 درساً.", "Complete 15 lessons.", "📗"),
            CreateBadge("lesson-thirty", "نصف الطريق", "Halfway There", "أكمل 30 درساً.", "Complete 30 lessons.", "📙"),
            CreateBadge("lesson-sixty", "مسافة طويلة", "Long Run Learner", "أكمل 60 درساً.", "Complete 60 lessons.", "📚"),
            CreateBadge("lesson-ninety", "مكتبة UXFriends", "UXFriends Library", "أكمل 90 درساً من المنهج.", "Complete 90 lessons from the curriculum.", "🏛️"),

            CreateBadge("first-lesson-quiz", "أول اختبار درس", "First Lesson Quiz", "اجتز أول اختبار درس.", "Pass your first lesson quiz.", "🧠"),
            CreateBadge("lesson-quiz-five", "5 اختبارات دروس", "5 Lesson Quizzes", "اجتز 5 اختبارات دروس.", "Pass 5 lesson quizzes.", "📝"),
            CreateBadge("lesson-quiz-fifteen", "15 اختبار درس", "15 Lesson Quizzes", "اجتز 15 اختبار درس.", "Pass 15 lesson quizzes.", "🎯"),
            CreateBadge("lesson-quiz-thirty", "30 اختبار درس", "30 Lesson Quizzes", "اجتز 30 اختبار درس.", "Pass 30 lesson quizzes.", "🚀"),

            CreateBadge("first-unit-quiz", "أول اختبار وحدة", "First Unit Quiz", "اجتز أول اختبار وحدة.", "Pass your first unit quiz.", "🧩"),
            CreateBadge("unit-quiz-three", "3 اختبارات وحدات", "3 Unit Quizzes", "اجتز 3 اختبارات وحدات.", "Pass 3 unit quizzes.", "🛠️"),
            CreateBadge("unit-quiz-eight", "8 اختبارات وحدات", "8 Unit Quizzes", "اجتز 8 اختبارات وحدات.", "Pass 8 unit quizzes.", "🧪"),
            CreateBadge("unit-quiz-fifteen", "15 اختبار وحدة", "15 Unit Quizzes", "اجتز 15 اختبار وحدة.", "Pass 15 unit quizzes.", "🏅"),

            CreateBadge("first-certificate", "أول شهادة", "First Certificate", "احصل على أول شهادة قسم.", "Earn your first section certificate.", "🎓"),
            CreateBadge("certificates-three", "3 شهادات", "3 Certificates", "احصل على 3 شهادات أقسام.", "Earn 3 section certificates.", "🏵️"),
            CreateBadge("certificates-six", "6 شهادات", "6 Certificates", "احصل على 6 شهادات أقسام.", "Earn 6 section certificates.", "🥇"),
            CreateBadge("certificates-ten", "10 شهادات", "10 Certificates", "احصل على 10 شهادات أقسام.", "Earn 10 section certificates.", "🎖️"),
            CreateBadge("certificates-fifteen", "مسار كامل", "Full Curriculum", "احصل على 15 شهادة أقسام في المنهج.", "Earn 15 section certificates across the curriculum.", "👑"),

            CreateBadge("first-project", "أول مشروع", "First Project", "أرسل أول مشروع لك.", "Submit your first project.", "🛫"),
            CreateBadge("projects-three", "3 مشاريع", "3 Projects", "أرسل 3 مشاريع.", "Submit 3 projects.", "🧱"),
            CreateBadge("projects-six", "6 مشاريع", "6 Projects", "أرسل 6 مشاريع.", "Submit 6 projects.", "🏗️"),
            CreateBadge("projects-ten", "10 مشاريع", "10 Projects", "أرسل 10 مشاريع.", "Submit 10 projects.", "🏢"),

            CreateBadge("challenge-winner", "فائز التحدي", "Challenge Winner", "أكمل أول تحدٍ بنجاح.", "Complete your first challenge.", "🏆"),
            CreateBadge("challenges-three", "3 تحديات", "3 Challenges", "أكمل 3 تحديات.", "Complete 3 challenges.", "⚔️"),
            CreateBadge("challenges-six", "6 تحديات", "6 Challenges", "أكمل 6 تحديات.", "Complete 6 challenges.", "🛡️"),
            CreateBadge("challenges-twelve", "12 تحدياً", "12 Challenges", "أكمل 12 تحدياً.", "Complete 12 challenges.", "🏹"),

            CreateBadge("three-day-streak", "سلسلة 3 أيام", "3-Day Streak", "حافظ على التعلم 3 أيام متتالية.", "Keep learning for 3 straight days.", "🔥"),
            CreateBadge("seven-day-streak", "سلسلة 7 أيام", "7-Day Streak", "واصل التعلم 7 أيام متتالية.", "Keep learning for 7 straight days.", "⚡"),
            CreateBadge("fourteen-day-streak", "سلسلة 14 يوماً", "14-Day Streak", "حافظ على إيقاع تعلم قوي لمدة 14 يوماً.", "Maintain a strong learning rhythm for 14 days.", "🌟"),
            CreateBadge("thirty-day-streak", "سلسلة 30 يوماً", "30-Day Streak", "أكمل شهراً كاملاً من التعلم المتواصل.", "Complete a full month of continuous learning.", "🌙"),
            CreateBadge("sixty-day-streak", "سلسلة 60 يوماً", "60-Day Streak", "استمر 60 يوماً في عادة التعلم.", "Keep your learning habit alive for 60 days.", "☄️"),
            CreateBadge("hundred-day-streak", "سلسلة 100 يوم", "100-Day Streak", "ابنِ عادة تعلم استثنائية لمدة 100 يوم.", "Build an exceptional 100-day learning habit.", "🌠"),

            CreateBadge("revision-first", "أول مراجعة", "First Revision", "أكمل أول جلسة مراجعة.", "Complete your first revision session.", "🌀"),
            CreateBadge("revision-five", "5 جلسات مراجعة", "5 Revision Sessions", "أكمل 5 جلسات مراجعة.", "Complete 5 revision sessions.", "🔁"),
            CreateBadge("revision-fifteen", "15 جلسة مراجعة", "15 Revision Sessions", "أكمل 15 جلسة مراجعة.", "Complete 15 revision sessions.", "🧭"),
            CreateBadge("revision-thirty", "30 جلسة مراجعة", "30 Revision Sessions", "أكمل 30 جلسة مراجعة.", "Complete 30 revision sessions.", "🛰️"),

            CreateBadge("notes-first", "أول ملاحظة", "First Note", "احفظ أول ملاحظة على درس.", "Save your first lesson note.", "🗒️"),
            CreateBadge("notes-five", "5 ملاحظات", "5 Notes", "احفظ 5 ملاحظات على دروس مختلفة.", "Save notes across 5 different lessons.", "📌"),
            CreateBadge("notes-twenty", "20 ملاحظة", "20 Notes", "ابنِ مكتبة مراجعة من 20 ملاحظة.", "Build a revision library of 20 notes.", "📒"),
            CreateBadge("notes-fifty", "50 ملاحظة", "50 Notes", "احفظ 50 ملاحظة في رحلتك.", "Save 50 notes in your journey.", "🗄️"),

            CreateBadge("xp-500", "500 XP", "500 XP", "اجمع 500 XP.", "Earn 500 XP.", "💠"),
            CreateBadge("xp-1500", "1500 XP", "1,500 XP", "اجمع 1500 XP.", "Earn 1,500 XP.", "💎"),
            CreateBadge("xp-5000", "5000 XP", "5,000 XP", "اجمع 5000 XP.", "Earn 5,000 XP.", "🔷"),
            CreateBadge("xp-12000", "12000 XP", "12,000 XP", "اجمع 12000 XP.", "Earn 12,000 XP.", "🔶"),
            CreateBadge("xp-25000", "25000 XP", "25,000 XP", "اجمع 25000 XP.", "Earn 25,000 XP.", "🌌"),

            CreateBadge("level-five", "المستوى 5", "Level 5", "صل إلى المستوى 5.", "Reach level 5.", "🪜"),
            CreateBadge("level-ten", "المستوى 10", "Level 10", "صل إلى المستوى 10.", "Reach level 10.", "🗼"),
            CreateBadge("level-twenty", "المستوى 20", "Level 20", "صل إلى المستوى 20.", "Reach level 20.", "🏔️")
        ];
    }

    private static IReadOnlyList<ChallengeCatalogItem> BuildChallenges()
    {
        return
        [
            ..BuildBeginnerChallenges(),
            ..BuildIntermediateChallenges(),
            ..BuildAdvancedChallenges(),
        ];
    }

    private static IEnumerable<ChallengeCatalogItem> BuildBeginnerChallenges()
    {
        yield return CreateChallenge("beginner-daily-lesson-step", "beginner", "التحدي اليومي: خطوة بداية", "Daily Challenge: Starter Step", "أكمل درساً واحداً من مساراتك الحالية اليوم.", "Complete 1 lesson from your current paths today.", "daily", "easy", 80, 24, "lessons_completed", 1);
        yield return CreateChallenge("beginner-daily-focus", "beginner", "التحدي اليومي: 20 دقيقة تركيز", "Daily Challenge: 20 Minutes of Focus", "أنه 20 دقيقة تعلم حقيقية اليوم.", "Complete 20 real learning minutes today.", "daily", "easy", 85, 24, "learning_minutes", 20);
        yield return CreateChallenge("beginner-daily-note", "beginner", "التحدي اليومي: ملاحظة مفيدة", "Daily Challenge: Helpful Note", "احفظ ملاحظة على درس واحد اليوم.", "Save a note on one lesson today.", "daily", "medium", 90, 24, "notes_saved", 1);
        yield return CreateChallenge("beginner-daily-lesson-quiz", "beginner", "التحدي اليومي: اختبار درس", "Daily Challenge: Lesson Quiz", "اجتز اختبار درس واحد اليوم.", "Pass one lesson quiz today.", "daily", "medium", 95, 24, "lesson_quizzes_passed", 1);

        yield return CreateChallenge("beginner-weekly-lessons", "beginner", "تحدي الأسبوع: 4 دروس", "Weekly Challenge: 4 Lessons", "أكمل 4 دروس خلال هذا الأسبوع.", "Complete 4 lessons during this week.", "weekly", "medium", 180, 24 * 7, "lessons_completed", 4);
        yield return CreateChallenge("beginner-weekly-quizzes", "beginner", "تحدي الأسبوع: 3 اختبارات دروس", "Weekly Challenge: 3 Lesson Quizzes", "اجتز 3 اختبارات دروس هذا الأسبوع.", "Pass 3 lesson quizzes this week.", "weekly", "medium", 190, 24 * 7, "lesson_quizzes_passed", 3);
        yield return CreateChallenge("beginner-weekly-notes", "beginner", "تحدي الأسبوع: 4 ملاحظات", "Weekly Challenge: 4 Notes", "ابنِ بنك مراجعة من 4 ملاحظات هذا الأسبوع.", "Build a revision bank of 4 notes this week.", "weekly", "medium", 175, 24 * 7, "notes_saved", 4);
        yield return CreateChallenge("beginner-weekly-xp", "beginner", "تحدي الأسبوع: 300 XP", "Weekly Challenge: 300 XP", "اكسب 300 XP من التعلم والاختبارات خلال الأسبوع.", "Earn 300 XP from learning and quizzes this week.", "weekly", "medium", 205, 24 * 7, "xp_earned", 300);

        yield return CreateChallenge("beginner-personal-lessons", "beginner", "تحديك الشخصي: درسان", "Personal Challenge: 2 Lessons", "أكمل درسين خلال مهلة التحدي الشخصي.", "Complete 2 lessons during the personal challenge window.", "personal", "easy", 95, 72, "lessons_completed", 2);
        yield return CreateChallenge("beginner-personal-activities", "beginner", "تحديك الشخصي: نشاطان", "Personal Challenge: 2 Activities", "أنهِ نشاطين تعلم مختلفين خلال هذه المهلة.", "Finish 2 different learning activities during this window.", "personal", "medium", 100, 72, "activities_completed", 2);
        yield return CreateChallenge("beginner-personal-note-bank", "beginner", "تحديك الشخصي: ملاحظتان", "Personal Challenge: 2 Notes", "احفظ ملاحظتين على درسين مختلفين.", "Save notes on 2 different lessons.", "personal", "medium", 105, 72, "notes_saved", 2);
        yield return CreateChallenge("beginner-personal-quiz", "beginner", "تحديك الشخصي: اختبار واحد", "Personal Challenge: One Quiz", "اجتز اختبار درس واحد داخل المهلة.", "Pass one lesson quiz before the deadline.", "personal", "medium", 110, 72, "lesson_quizzes_passed", 1);
    }

    private static IEnumerable<ChallengeCatalogItem> BuildIntermediateChallenges()
    {
        yield return CreateChallenge("intermediate-daily-lessons", "intermediate", "التحدي اليومي: دفعة دروس", "Daily Challenge: Lesson Push", "أكمل درسين اليوم.", "Complete 2 lessons today.", "daily", "medium", 105, 24, "lessons_completed", 2);
        yield return CreateChallenge("intermediate-daily-unit-quiz", "intermediate", "التحدي اليومي: اختبار وحدة", "Daily Challenge: Unit Quiz", "اجتز اختبار وحدة واحد اليوم.", "Pass one unit quiz today.", "daily", "hard", 135, 24, "unit_quizzes_passed", 1);
        yield return CreateChallenge("intermediate-daily-revision", "intermediate", "التحدي اليومي: جلسة مراجعة", "Daily Challenge: Revision Session", "أكمل جلسة مراجعة واحدة اليوم.", "Complete one revision session today.", "daily", "medium", 100, 24, "revision_sessions_completed", 1);
        yield return CreateChallenge("intermediate-daily-xp", "intermediate", "التحدي اليومي: 180 XP", "Daily Challenge: 180 XP", "اكسب 180 XP من أنشطة اليوم.", "Earn 180 XP from today's activities.", "daily", "hard", 125, 24, "xp_earned", 180);

        yield return CreateChallenge("intermediate-weekly-lessons", "intermediate", "تحدي الأسبوع: 5 دروس", "Weekly Challenge: 5 Lessons", "أكمل 5 دروس هذا الأسبوع.", "Complete 5 lessons this week.", "weekly", "medium", 200, 24 * 7, "lessons_completed", 5);
        yield return CreateChallenge("intermediate-weekly-unit-quizzes", "intermediate", "تحدي الأسبوع: اختبارا وحدات", "Weekly Challenge: 2 Unit Quizzes", "اجتز اختباري وحدات خلال الأسبوع.", "Pass 2 unit quizzes this week.", "weekly", "hard", 240, 24 * 7, "unit_quizzes_passed", 2);
        yield return CreateChallenge("intermediate-weekly-revision", "intermediate", "تحدي الأسبوع: جلستا مراجعة", "Weekly Challenge: 2 Revision Sessions", "أكمل جلستي مراجعة خلال الأسبوع.", "Complete 2 revision sessions this week.", "weekly", "medium", 195, 24 * 7, "revision_sessions_completed", 2);
        yield return CreateChallenge("intermediate-weekly-xp", "intermediate", "تحدي الأسبوع: 420 XP", "Weekly Challenge: 420 XP", "اكسب 420 XP خلال هذا الأسبوع.", "Earn 420 XP during this week.", "weekly", "hard", 230, 24 * 7, "xp_earned", 420);

        yield return CreateChallenge("intermediate-personal-lessons", "intermediate", "تحديك الشخصي: 3 دروس", "Personal Challenge: 3 Lessons", "أكمل 3 دروس داخل هذه المهلة.", "Complete 3 lessons inside this window.", "personal", "medium", 120, 72, "lessons_completed", 3);
        yield return CreateChallenge("intermediate-personal-quizzes", "intermediate", "تحديك الشخصي: اختباران", "Personal Challenge: 2 Quizzes", "اجتز اختبارين خلال التحدي الشخصي.", "Pass 2 quizzes during the personal challenge.", "personal", "medium", 125, 72, "quizzes_passed", 2);
        yield return CreateChallenge("intermediate-personal-revision", "intermediate", "تحديك الشخصي: مراجعة مركزة", "Personal Challenge: Focused Revision", "أكمل جلسة مراجعة واحدة ودوّن ملاحظاتك.", "Complete one revision session and capture your takeaways.", "personal", "medium", 130, 72, "revision_sessions_completed", 1);
        yield return CreateChallenge("intermediate-personal-xp", "intermediate", "تحديك الشخصي: 240 XP", "Personal Challenge: 240 XP", "اكسب 240 XP داخل هذه المهلة.", "Earn 240 XP in this window.", "personal", "hard", 140, 72, "xp_earned", 240);
    }

    private static IEnumerable<ChallengeCatalogItem> BuildAdvancedChallenges()
    {
        yield return CreateChallenge("advanced-daily-lessons", "advanced", "التحدي اليومي: دفعة متقدمة", "Daily Challenge: Advanced Push", "أكمل درسين متقدمين اليوم.", "Complete 2 advanced lessons today.", "daily", "medium", 120, 24, "lessons_completed", 2);
        yield return CreateChallenge("advanced-daily-revision", "advanced", "التحدي اليومي: مراجعتان", "Daily Challenge: Two Revision Sessions", "أكمل جلستي مراجعة اليوم.", "Complete 2 revision sessions today.", "daily", "hard", 135, 24, "revision_sessions_completed", 2);
        yield return CreateChallenge("advanced-daily-unit-quiz", "advanced", "التحدي اليومي: اختبار وحدة متقدم", "Daily Challenge: Advanced Unit Quiz", "اجتز اختبار وحدة واحد اليوم.", "Pass one unit quiz today.", "daily", "hard", 140, 24, "unit_quizzes_passed", 1);
        yield return CreateChallenge("advanced-daily-xp", "advanced", "التحدي اليومي: 260 XP", "Daily Challenge: 260 XP", "اكسب 260 XP من الأنشطة المتقدمة اليوم.", "Earn 260 XP from advanced activities today.", "daily", "hard", 150, 24, "xp_earned", 260);

        yield return CreateChallenge("advanced-weekly-lessons", "advanced", "تحدي الأسبوع: 6 دروس", "Weekly Challenge: 6 Lessons", "أكمل 6 دروس هذا الأسبوع.", "Complete 6 lessons this week.", "weekly", "hard", 230, 24 * 7, "lessons_completed", 6);
        yield return CreateChallenge("advanced-weekly-project", "advanced", "تحدي الأسبوع: مشروع واحد", "Weekly Challenge: One Project", "أرسل مشروعاً واحداً خلال الأسبوع.", "Submit one project this week.", "weekly", "hard", 280, 24 * 7, "projects_submitted", 1);
        yield return CreateChallenge("advanced-weekly-revision", "advanced", "تحدي الأسبوع: 3 جلسات مراجعة", "Weekly Challenge: 3 Revision Sessions", "أكمل 3 جلسات مراجعة خلال الأسبوع.", "Complete 3 revision sessions this week.", "weekly", "medium", 210, 24 * 7, "revision_sessions_completed", 3);
        yield return CreateChallenge("advanced-weekly-section-quiz", "advanced", "تحدي الأسبوع: اختبار قسم", "Weekly Challenge: Section Exam", "اجتز اختبار قسم واحد هذا الأسبوع.", "Pass one section exam this week.", "weekly", "hard", 300, 24 * 7, "section_quizzes_passed", 1);

        yield return CreateChallenge("advanced-personal-project", "advanced", "تحديك الشخصي: مشروع واحد", "Personal Challenge: One Project", "أرسل مشروعاً واحداً داخل المهلة الشخصية.", "Submit one project within the personal window.", "personal", "hard", 190, 72, "projects_submitted", 1);
        yield return CreateChallenge("advanced-personal-revision", "advanced", "تحديك الشخصي: مراجعتان", "Personal Challenge: 2 Revision Sessions", "أكمل جلستي مراجعة خلال هذه المهلة.", "Complete 2 revision sessions in this window.", "personal", "hard", 150, 72, "revision_sessions_completed", 2);
        yield return CreateChallenge("advanced-personal-notes", "advanced", "تحديك الشخصي: 3 ملاحظات", "Personal Challenge: 3 Notes", "وثّق 3 ملاحظات مراجعة على دروس مختلفة.", "Capture 3 revision notes on different lessons.", "personal", "medium", 135, 72, "notes_saved", 3);
        yield return CreateChallenge("advanced-personal-xp", "advanced", "تحديك الشخصي: 320 XP", "Personal Challenge: 320 XP", "اكسب 320 XP في هذه المهلة.", "Earn 320 XP within this window.", "personal", "hard", 165, 72, "xp_earned", 320);
    }

    private static ChallengeCatalogItem CreateChallenge(
        string code,
        string levelBand,
        string titleAr,
        string titleEn,
        string descriptionAr,
        string descriptionEn,
        string challengeType,
        string difficulty,
        int legacyXpReward,
        int durationHours,
        string metric,
        int target)
    {
        return new ChallengeCatalogItem(
            code,
            levelBand,
            titleAr,
            titleEn,
            descriptionAr,
            descriptionEn,
            challengeType,
            difficulty,
            XpEconomy.GetChallengeReward(challengeType, difficulty, metric, target),
            durationHours,
            metric,
            target);
    }

    private static BadgeCatalogItem CreateBadge(
        string code,
        string nameAr,
        string nameEn,
        string descriptionAr,
        string descriptionEn,
        string icon)
    {
        return new BadgeCatalogItem(
            code,
            nameAr,
            nameEn,
            descriptionAr,
            descriptionEn,
            icon);
    }
}
