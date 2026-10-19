using UXFriends.Infrastructure.Data;

namespace UXFriends.API.Support;

public sealed record LearningBlockDefinition(
    string Id,
    string Type,
    string TitleAr,
    string TitleEn,
    string BodyAr,
    string BodyEn,
    IReadOnlyList<string> ItemsAr,
    IReadOnlyList<string> ItemsEn,
    string? AccentAr = null,
    string? AccentEn = null,
    string? VisualKey = null,
    string? CaptionAr = null,
    string? CaptionEn = null
);

public sealed record LessonQuizQuestionSeed(
    string Code,
    string PromptAr,
    string PromptEn,
    IReadOnlyList<string> OptionsAr,
    IReadOnlyList<string> OptionsEn,
    int CorrectOptionIndex,
    string HintAr,
    string HintEn,
    string ExplanationAr,
    string ExplanationEn,
    string? RelatedLessonCode = null,
    string QuestionType = "single",
    IReadOnlyList<string>? OptionVisualKeys = null
);

public sealed record QuizCatalogDefinition(
    string QuizCode,
    string Scope,
    string SectionCode,
    string UnitCode,
    string? LessonCode,
    string TitleAr,
    string TitleEn,
    string DescriptionAr,
    string DescriptionEn,
    int PassThreshold,
    int XpReward,
    int? TimeLimitMinutes,
    IReadOnlyList<LessonQuizQuestionSeed> Questions
);

public sealed record ProjectCriterionDefinition(
    string LabelAr,
    string LabelEn,
    int Weight
);

public sealed record ProjectExperienceDefinition(
    string Code,
    int EstimatedHours,
    int XpReward,
    IReadOnlyList<string> DeliverablesAr,
    IReadOnlyList<string> DeliverablesEn,
    IReadOnlyList<ProjectCriterionDefinition> Criteria
);

public sealed record UnitOutcomeDefinition(
    IReadOnlyList<string> OutcomesAr,
    IReadOnlyList<string> OutcomesEn
);

public static class LearningExperienceCatalog
{
    private static readonly Lazy<IReadOnlyDictionary<string, LessonQuizQuestionSeed>> QuestionSeedIndex =
        new(BuildQuestionSeedIndex);

    public static UnitOutcomeDefinition GetUnitOutcomes(string unitCode)
    {
        var unit = CourseBlueprintCatalog.FindUnit(unitCode);
        return unit is null
            ? new UnitOutcomeDefinition([], [])
            : new UnitOutcomeDefinition(unit.OutcomesAr, unit.OutcomesEn);
    }

    public static IReadOnlyList<LearningBlockDefinition> GetLessonBlocks(LessonCatalogItem lesson)
    {
        var blueprint = CourseBlueprintCatalog.FindLesson(lesson.Code);
        if (blueprint is null)
        {
            return [];
        }

        return
        [
            new LearningBlockDefinition(
                $"{lesson.Code}-overview",
                "overview",
                "الفكرة الأساسية",
                "Core Idea",
                blueprint.OverviewAr,
                blueprint.OverviewEn,
                [],
                [],
                "ابدأ من الهدف أو السلوك الذي تحاول هذه الفكرة تحسينه.",
                "Start from the goal or behavior this concept is trying to improve."),
            new LearningBlockDefinition(
                $"{lesson.Code}-figure",
                "figure",
                "شكل يوضّح الفكرة",
                "Figure to Explain the Idea",
                string.Empty,
                string.Empty,
                [],
                [],
                null,
                null,
                blueprint.VisualKey,
                blueprint.VisualCaptionAr,
                blueprint.VisualCaptionEn),
            new LearningBlockDefinition(
                $"{lesson.Code}-checklist",
                "checklist",
                "نقاط يجب أن تتذكرها",
                "Key Points to Remember",
                string.Empty,
                string.Empty,
                blueprint.KeyPointsAr,
                blueprint.KeyPointsEn),
            new LearningBlockDefinition(
                $"{lesson.Code}-practice",
                "practice",
                "تطبيق عملي",
                "Practice Prompt",
                blueprint.PracticeAr,
                blueprint.PracticeEn,
                [],
                [],
                "حاول تنفيذ التمرين على منتج تعرفه بالفعل حتى ترى أثر الفكرة داخل سياق حقيقي.",
                "Try the exercise on a product you already know so you can see the concept inside a real context."),
            new LearningBlockDefinition(
                $"{lesson.Code}-takeaway",
                "takeaway",
                "الخلاصة",
                "Main Takeaway",
                blueprint.TakeawayAr,
                blueprint.TakeawayEn,
                [],
                [],
                "هذه الجملة هي المعيار السريع الذي يمكنك الرجوع إليه أثناء التصميم أو المراجعة.",
                "Use this sentence as a quick standard to revisit during design or critique."),
            new LearningBlockDefinition(
                $"{lesson.Code}-references",
                "references",
                "مراجع مقترحة",
                "Suggested References",
                "هذه المراجع تساعدك على تعميق الفكرة بعد إنهاء الدرس.",
                "These references help you deepen the idea after you finish the lesson.",
                blueprint.References.Select(item => item.LabelAr).ToList(),
                blueprint.References.Select(item => item.LabelEn).ToList())
        ];
    }

    public static QuizCatalogDefinition? BuildLessonQuiz(string lessonCode)
    {
        var lesson = CatalogContent.FindLesson(lessonCode);
        var unit = lesson is null ? null : CatalogContent.FindUnit(lesson.UnitCode);
        var sectionCode = unit?.SectionCode;
        var blueprint = CourseBlueprintCatalog.FindLesson(lessonCode);

        if (lesson is null || unit is null || sectionCode is null || blueprint is null || blueprint.QuizQuestions.Count == 0)
        {
            return null;
        }

        return new QuizCatalogDefinition(
            $"lesson-quiz-{lesson.Code}",
            "lesson",
            sectionCode,
            lesson.UnitCode,
            lesson.Code,
            $"اختبار درس: {lesson.TitleAr}",
            $"Lesson Quiz: {lesson.TitleEn}",
            "اختبار قصير يجمع بين الفهم النظري واتخاذ القرار داخل الواجهة.",
            "A short quiz that checks both conceptual understanding and practical decision-making.",
            70,
            XpEconomy.GetLessonQuizReward(lesson),
            null,
            BuildLessonQuestionSeeds(lesson, blueprint));
    }

    public static QuizCatalogDefinition? BuildUnitQuiz(string unitCode)
    {
        var unit = CatalogContent.FindUnit(unitCode);
        var section = unit is null ? null : CatalogContent.FindSection(unit.SectionCode);
        var blueprint = CourseBlueprintCatalog.FindUnit(unitCode);

        if (unit is null || section is null || blueprint is null)
        {
            return null;
        }

        var questions = BuildUnitQuestionSeeds(unit, section, blueprint);

        if (questions.Count == 0)
        {
            return null;
        }

        return new QuizCatalogDefinition(
            $"unit-quiz-{unit.Code}",
            "unit",
            section.Code,
            unit.Code,
            null,
            $"اختبار الوحدة: {unit.TitleAr}",
            $"Unit Quiz: {unit.TitleEn}",
            "اختبار وحدة يجمع بين أسئلة مفاهيمية وحالات اختيار بصري مستوحاة من مواقف تصميم حقيقية.",
            "A unit assessment that blends conceptual questions with visual-choice scenarios inspired by real design work.",
            blueprint.QuizPassThreshold,
            XpEconomy.GetUnitQuizReward(blueprint, section.Difficulty),
            null,
            questions);
    }

    public static QuizCatalogDefinition? BuildSectionQuiz(string sectionCode)
    {
        var section = CatalogContent.FindSection(sectionCode);
        var blueprint = CourseBlueprintCatalog.FindSection(sectionCode);

        if (section is null || blueprint is null)
        {
            return null;
        }

        var unitCode = blueprint.Units.FirstOrDefault()?.Code ?? string.Empty;
        var questions = BuildSectionQuestionSeeds(section, blueprint);

        if (questions.Count == 0)
        {
            return null;
        }

        return new QuizCatalogDefinition(
            $"section-quiz-{section.Code}",
            "section",
            section.Code,
            unitCode,
            null,
            $"الاختبار النهائي: {section.TitleAr}",
            $"Section Exam: {section.TitleEn}",
            "اختبار ختامي للSection يقيس فهمك العملي والنظري عبر الوحدات قبل إصدار الشهادة.",
            "A section-level final exam that checks practical and conceptual understanding before the certificate is issued.",
            blueprint.ExamPassThreshold,
            XpEconomy.GetSectionExamReward(blueprint),
            null,
            questions);
    }

    public static QuizCatalogDefinition BuildPlacementAssessment(string stableKey)
    {
        var questions = new List<LessonQuizQuestionSeed>();

        foreach (var level in new[] { "beginner", "intermediate", "advanced" })
        {
            var levelPool = CourseBlueprintCatalog.Sections
                .Where(section => string.Equals(
                    section.Level,
                    level,
                    StringComparison.OrdinalIgnoreCase))
                .SelectMany(section => BuildSectionQuestionSeeds(
                    CatalogContent.FindSection(section.Code)!,
                    section))
                .ToList();

            questions.AddRange(TakeStableQuestionSet(levelPool, 6, $"{stableKey}:{level}"));
        }

        return new QuizCatalogDefinition(
            "placement-assessment",
            "assessment",
            string.Empty,
            string.Empty,
            null,
            "اختبار تحديد المستوى",
            "Placement Assessment",
            "اختبار واحد يساعدنا على تحديد مستواك الفعلي قبل فتح المسارات المناسبة لك.",
            "A one-time assessment that helps us place you at the right starting level.",
            0,
            0,
            20,
            questions);
    }

    public static LessonQuizQuestionSeed? FindQuestionSeed(string questionCode)
    {
        return QuestionSeedIndex.Value.TryGetValue(questionCode, out var question)
            ? question
            : null;
    }

    public static ProjectExperienceDefinition? FindProject(string projectCode)
    {
        var section = CourseBlueprintCatalog.Sections
            .FirstOrDefault(item =>
                string.Equals(item.Project.Code, projectCode, StringComparison.OrdinalIgnoreCase));
        var project = section?.Project ?? CourseBlueprintCatalog.FindProject(projectCode);
        return project is null
            ? null
            : new ProjectExperienceDefinition(
                project.Code,
                project.EstimatedHours,
                XpEconomy.GetProjectReward(project, section?.Level ?? "beginner"),
                project.DeliverablesAr,
                project.DeliverablesEn,
                project.Criteria
                    .Select(item => new ProjectCriterionDefinition(item.LabelAr, item.LabelEn, item.Weight))
                    .ToList());
    }

    public static ProjectExperienceDefinition? FindSectionProject(string sectionCode)
    {
        var section = CourseBlueprintCatalog.FindSection(sectionCode);
        return section is null ? null : FindProject(section.Project.Code);
    }

    private static List<LessonQuizQuestionSeed> BuildLessonQuestionSeeds(
        LessonCatalogItem lesson,
        CourseLessonDefinition blueprint)
    {
        var questions = blueprint.QuizQuestions.Select(ToQuestionSeed).ToList();
        var visualQuestion = BuildVisualComparisonQuestion(lesson, blueprint);

        if (visualQuestion is not null)
        {
            questions.Add(visualQuestion);
        }

        return questions;
    }

    private static List<LessonQuizQuestionSeed> BuildUnitQuestionSeeds(
        UnitCatalogItem unit,
        SectionCatalogItem section,
        CourseUnitDefinition blueprint)
    {
        var questions = new List<LessonQuizQuestionSeed>();
        var lessons = blueprint.Lessons.ToList();

        foreach (var lesson in lessons)
        {
            questions.AddRange(BuildUnitRecapQuestions(unit, lesson, lessons));
        }

        questions.AddRange(BuildUnitOutcomeQuestions(unit, blueprint));
        questions.AddRange(BuildUnitVisualQuestions(unit, lessons));

        return TakeStableQuestionSet(questions, 10, $"{section.Code}:{unit.Code}:unit");
    }

    private static List<LessonQuizQuestionSeed> BuildSectionQuestionSeeds(
        SectionCatalogItem section,
        CourseSectionDefinition blueprint)
    {
        var questions = blueprint.Units
            .SelectMany(unitBlueprint =>
            {
                var unit = CatalogContent.FindUnit(unitBlueprint.Code);
                return unit is null
                    ? []
                    : BuildUnitQuestionSeeds(unit, section, unitBlueprint);
            })
            .ToList();

        questions.AddRange(BuildSectionCapstoneQuestions(section, blueprint));

        return TakeStableQuestionSet(questions, 18, $"{section.Code}:section");
    }

    private static IReadOnlyDictionary<string, LessonQuizQuestionSeed> BuildQuestionSeedIndex()
    {
        var index = new Dictionary<string, LessonQuizQuestionSeed>(StringComparer.OrdinalIgnoreCase);

        foreach (var lesson in CatalogContent.Lessons)
        {
            var quiz = BuildLessonQuiz(lesson.Code);
            if (quiz is null)
            {
                continue;
            }

            foreach (var question in quiz.Questions)
            {
                index.TryAdd(question.Code, question);
            }
        }

        foreach (var unit in CatalogContent.Units)
        {
            var quiz = BuildUnitQuiz(unit.Code);
            if (quiz is null)
            {
                continue;
            }

            foreach (var question in quiz.Questions)
            {
                index.TryAdd(question.Code, question);
            }
        }

        foreach (var section in CatalogContent.Sections)
        {
            var quiz = BuildSectionQuiz(section.Code);
            if (quiz is null)
            {
                continue;
            }

            foreach (var question in quiz.Questions)
            {
                index.TryAdd(question.Code, question);
            }
        }

        return index;
    }

    private static IEnumerable<LessonQuizQuestionSeed> BuildUnitRecapQuestions(
        UnitCatalogItem unit,
        CourseLessonDefinition lesson,
        IReadOnlyList<CourseLessonDefinition> allLessons)
    {
        var sourceQuestions = lesson.QuizQuestions
            .Take(2)
            .ToList();

        for (var index = 0; index < sourceQuestions.Count; index += 1)
        {
            var sourceQuestion = sourceQuestions[index];
            var correctOptionAr = sourceQuestion.OptionsAr[sourceQuestion.CorrectOptionIndex];
            var correctOptionEn = sourceQuestion.OptionsEn[sourceQuestion.CorrectOptionIndex];
            var distractors = allLessons
                .Where(other => other.Code != lesson.Code)
                .SelectMany(other => other.QuizQuestions)
                .Select(other => (
                    Ar: other.OptionsAr[other.CorrectOptionIndex],
                    En: other.OptionsEn[other.CorrectOptionIndex]))
                .Where(option => !string.Equals(option.Ar, correctOptionAr, StringComparison.OrdinalIgnoreCase))
                .DistinctBy(option => $"{option.Ar}|{option.En}")
                .Take(3)
                .ToList();

            foreach (var fallback in GetFallbackDistractors())
            {
                if (distractors.Count >= 3)
                {
                    break;
                }

                if (string.Equals(fallback.Ar, correctOptionAr, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                distractors.Add(fallback);
            }

            var correctIndex = GetStableIndex($"{unit.Code}:{lesson.Code}:{index}", 4);
            var optionsAr = CreateOptionSet(
                correctOptionAr,
                distractors.Select(item => item.Ar).Take(3).ToList(),
                correctIndex,
                false);
            var optionsEn = CreateOptionSet(
                correctOptionEn,
                distractors.Select(item => item.En).Take(3).ToList(),
                correctIndex,
                true);

            yield return new LessonQuizQuestionSeed(
                $"{unit.Code}-{lesson.Code}-recap-{index + 1}",
                index == 0
                    ? $"أنت تراجع قراراً داخل وحدة {unit.TitleAr}. أي ملاحظة تعبّر عن {lesson.TitleAr} بأفضل شكل؟"
                    : $"أي قرار تصميم ينسجم أكثر مع مبادئ {lesson.TitleAr} داخل هذه الوحدة؟",
                index == 0
                    ? $"You are reviewing a decision inside {unit.TitleEn}. Which critique best reflects {lesson.TitleEn}?"
                    : $"Which design decision aligns best with the principles of {lesson.TitleEn} in this unit?",
                optionsAr,
                optionsEn,
                correctIndex,
                sourceQuestion.HintAr,
                sourceQuestion.HintEn,
                sourceQuestion.ExplanationAr,
                sourceQuestion.ExplanationEn,
                lesson.Code);
        }
    }

    private static IEnumerable<LessonQuizQuestionSeed> BuildUnitOutcomeQuestions(
        UnitCatalogItem unit,
        CourseUnitDefinition blueprint)
    {
        var outcomePairs = blueprint.OutcomesAr
            .Zip(blueprint.OutcomesEn, (ar, en) => (Ar: ar, En: en))
            .Take(2)
            .ToList();

        for (var index = 0; index < outcomePairs.Count; index += 1)
        {
            var outcome = outcomePairs[index];
            var distractors = GetFallbackDistractors()
                .Where(option => !string.Equals(option.Ar, outcome.Ar, StringComparison.OrdinalIgnoreCase))
                .Take(3)
                .ToList();
            var correctIndex = GetStableIndex($"{unit.Code}:outcome:{index}", 4);

            yield return new LessonQuizQuestionSeed(
                $"{unit.Code}-outcome-{index + 1}",
                $"بعد إكمال {unit.TitleAr}، ما النتيجة التي يجب أن يثبتها المتعلّم فعلياً؟",
                $"After finishing {unit.TitleEn}, which outcome should the learner actually demonstrate?",
                CreateOptionSet(outcome.Ar, distractors.Select(item => item.Ar).ToList(), correctIndex, false),
                CreateOptionSet(outcome.En, distractors.Select(item => item.En).ToList(), correctIndex, true),
                correctIndex,
                "ركّز على المخرج العملي الذي تغيّر في طريقة التفكير أو التنفيذ، لا على النشاط الشكلي.",
                "Focus on the practical capability the learner gains, not on a decorative or busy task.",
                "الناتج الصحيح يعبّر عن القدرة التي يفترض أن تخرج بها من الوحدة وتستخدمها لاحقاً.",
                "The correct answer expresses the capability this unit is meant to build and reuse later.",
                blueprint.Lessons.FirstOrDefault()?.Code);
        }
    }

    private static IEnumerable<LessonQuizQuestionSeed> BuildUnitVisualQuestions(
        UnitCatalogItem unit,
        IReadOnlyList<CourseLessonDefinition> lessons)
    {
        var selectedLessons = lessons
            .GroupBy(lesson => GetVisualCategoryKey(lesson.VisualKey))
            .Select(group => group.First())
            .Take(2)
            .ToList();

        foreach (var lesson in selectedLessons)
        {
            var preset = ResolveVisualPreset(lesson.VisualKey);
            if (preset is null)
            {
                continue;
            }

            var reverseOrder = GetStableIndex($"{unit.Code}:{lesson.Code}:visual", 2) == 1;
            var correctIndex = reverseOrder ? 1 : 0;
            var optionsAr = reverseOrder
                ? new[] { preset.BadLabelAr, preset.GoodLabelAr }
                : new[] { preset.GoodLabelAr, preset.BadLabelAr };
            var optionsEn = reverseOrder
                ? new[] { preset.BadLabelEn, preset.GoodLabelEn }
                : new[] { preset.GoodLabelEn, preset.BadLabelEn };
            var optionVisualKeys = reverseOrder
                ? new[] { preset.BadVisualKey, preset.GoodVisualKey }
                : new[] { preset.GoodVisualKey, preset.BadVisualKey };

            yield return new LessonQuizQuestionSeed(
                $"{unit.Code}-{lesson.Code}-visual-audit",
                $"أي واجهة تطبّق {lesson.TitleAr} بطريقة أقوى داخل سياق {unit.TitleAr}؟",
                $"Which interface applies {lesson.TitleEn} more strongly inside {unit.TitleEn}?",
                optionsAr,
                optionsEn,
                correctIndex,
                preset.HintAr,
                preset.HintEn,
                preset.ExplanationAr,
                preset.ExplanationEn,
                lesson.Code,
                "visual",
                optionVisualKeys);
        }
    }

    private static IEnumerable<LessonQuizQuestionSeed> BuildSectionCapstoneQuestions(
        SectionCatalogItem section,
        CourseSectionDefinition blueprint)
    {
        var deliverablePairs = blueprint.Project.DeliverablesAr
            .Zip(blueprint.Project.DeliverablesEn, (ar, en) => (Ar: ar, En: en))
            .Take(2)
            .ToList();

        for (var index = 0; index < deliverablePairs.Count; index += 1)
        {
            var deliverable = deliverablePairs[index];
            var distractors = GetFallbackDistractors()
                .Where(option => !string.Equals(option.Ar, deliverable.Ar, StringComparison.OrdinalIgnoreCase))
                .Take(3)
                .ToList();
            var correctIndex = GetStableIndex($"{section.Code}:capstone:{index}", 4);

            yield return new LessonQuizQuestionSeed(
                $"{section.Code}-capstone-{index + 1}",
                $"قبل الحصول على شهادة {section.TitleAr}، ما المخرج الذي يجب أن يظهر بوضوح في المشروع النهائي؟",
                $"Before earning the {section.TitleEn} certificate, which deliverable should clearly appear in the final project?",
                CreateOptionSet(deliverable.Ar, distractors.Select(item => item.Ar).ToList(), correctIndex, false),
                CreateOptionSet(deliverable.En, distractors.Select(item => item.En).ToList(), correctIndex, true),
                correctIndex,
                "اربط السؤال بما يطلبه المشروع النهائي فعلاً، لا بما يبدو لافتاً بصرياً فقط.",
                "Anchor the answer in what the capstone actually asks for, not in what looks more decorative.",
                "الاختيار الصحيح يطابق مخرجاً مطلوباً في مشروع هذا القسم لأنه يثبت الفهم التطبيقي للمحتوى.",
                "The correct choice matches a required capstone deliverable because it proves applied understanding of the section.",
                blueprint.Units.FirstOrDefault()?.Lessons.FirstOrDefault()?.Code);
        }
    }

    private static List<LessonQuizQuestionSeed> TakeStableQuestionSet(
        IEnumerable<LessonQuizQuestionSeed> questions,
        int count,
        string seed)
    {
        return questions
            .GroupBy(question => question.Code, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .OrderBy(question => GetStableSortKey(seed, question.Code))
            .ThenBy(question => question.Code, StringComparer.OrdinalIgnoreCase)
            .Take(count)
            .ToList();
    }

    private static int GetStableIndex(string seed, int upperBound) =>
        Math.Abs(GetStableSortKey(seed, "index")) % upperBound;

    private static int GetStableSortKey(string seed, string value)
    {
        unchecked
        {
            var hash = 2166136261;
            foreach (var character in $"{seed}:{value}")
            {
                hash ^= character;
                hash *= 16777619;
            }

            return (int)hash;
        }
    }

    private static string GetVisualCategoryKey(string visualKey)
    {
        var normalized = visualKey.Trim().ToLowerInvariant();

        if (normalized.Contains("color") || normalized.Contains("contrast"))
        {
            return "color";
        }

        if (normalized.Contains("form") || normalized.Contains("inclusive") || normalized.Contains("field"))
        {
            return "form";
        }

        if (normalized.Contains("journey") || normalized.Contains("task") || normalized.Contains("flow"))
        {
            return "journey";
        }

        if (normalized.Contains("navigation") || normalized.Contains("architecture"))
        {
            return "navigation";
        }

        if (normalized.Contains("feedback") || normalized.Contains("microinteraction") || normalized.Contains("status"))
        {
            return "feedback";
        }

        if (normalized.Contains("checkout"))
        {
            return "checkout";
        }

        return "hierarchy";
    }

    private static IReadOnlyList<string> CreateOptionSet(
        string correctOption,
        IReadOnlyList<string> distractors,
        int correctIndex,
        bool english)
    {
        var options = distractors.Take(3).ToList();
        var fallbackOptions = english
            ? new[]
            {
                "Add more elements without clarifying priority",
                "Delay clear guidance until the end of the task",
                "Give every decision the same visual weight"
            }
            : new[]
            {
                "إضافة عناصر أكثر بدون توضيح الأولوية",
                "تأجيل التوجيه الواضح إلى نهاية المهمة",
                "جعل جميع القرارات بنفس الوزن البصري"
            };

        while (options.Count < 3)
        {
            options.Add(fallbackOptions[options.Count]);
        }

        options.Insert(Math.Clamp(correctIndex, 0, options.Count), correctOption);
        return options;
    }

    private static IReadOnlyList<(string Ar, string En)> GetFallbackDistractors() =>
    [
        ("جعل كل العناصر بنفس درجة الأهمية حتى لا يفوت المستخدم شيئاً", "Make every element equally important so nothing is missed"),
        ("إضافة خيارات أكثر قبل توضيح الخطوة التالية", "Add more options before clarifying the next step"),
        ("تأجيل التغذية الراجعة إلى نهاية التدفق", "Delay feedback until the end of the flow"),
        ("التركيز على الزخرفة قبل وضوح المهمة", "Prioritize decoration before task clarity")
    ];

    private static LessonQuizQuestionSeed ToQuestionSeed(CourseQuizQuestionDefinition question)
    {
        return new LessonQuizQuestionSeed(
            question.Code,
            question.PromptAr,
            question.PromptEn,
            question.OptionsAr,
            question.OptionsEn,
            question.CorrectOptionIndex,
            question.HintAr,
            question.HintEn,
            question.ExplanationAr,
            question.ExplanationEn,
            question.RelatedLessonCode,
            question.QuestionType,
            question.OptionVisualKeys);
    }

    private static LessonQuizQuestionSeed? BuildVisualComparisonQuestion(
        LessonCatalogItem lesson,
        CourseLessonDefinition blueprint)
    {
        var preset = ResolveVisualPreset(blueprint.VisualKey);
        if (preset is null)
        {
            return null;
        }

        var reverseOrder = ShouldReverseOptions(lesson.Code);
        var optionsAr = reverseOrder
            ? new[] { preset.BadLabelAr, preset.GoodLabelAr }
            : new[] { preset.GoodLabelAr, preset.BadLabelAr };
        var optionsEn = reverseOrder
            ? new[] { preset.BadLabelEn, preset.GoodLabelEn }
            : new[] { preset.GoodLabelEn, preset.BadLabelEn };
        var optionVisualKeys = reverseOrder
            ? new[] { preset.BadVisualKey, preset.GoodVisualKey }
            : new[] { preset.GoodVisualKey, preset.BadVisualKey };
        var correctIndex = reverseOrder ? 1 : 0;

        return new LessonQuizQuestionSeed(
            $"{lesson.Code}-visual-check",
            $"أي مثال بصري يطبق {lesson.TitleAr} بطريقة أفضل؟",
            $"Which visual example applies {lesson.TitleEn} better?",
            optionsAr,
            optionsEn,
            correctIndex,
            preset.HintAr,
            preset.HintEn,
            preset.ExplanationAr,
            preset.ExplanationEn,
            lesson.Code,
            "visual",
            optionVisualKeys);
    }

    private static bool ShouldReverseOptions(string code) =>
        code.Sum(character => character) % 2 == 0;

    private static VisualQuestionPreset? ResolveVisualPreset(string visualKey)
    {
        var normalized = visualKey.Trim().ToLowerInvariant();

        if (normalized.Contains("color") || normalized.Contains("contrast"))
        {
            return new VisualQuestionPreset(
                "لوحة ألوان متوازنة وتباين واضح",
                "A balanced palette with clear contrast",
                "لوحة متضاربة وتباين مربك",
                "A conflicting palette with confusing contrast",
                "color-wheel-harmony-good",
                "color-wheel-harmony-bad",
                "ابحث عن التباين الواضح والتسلسل البصري، لا مجرد كثرة الألوان.",
                "Look for clear contrast and hierarchy, not just more colors.",
                "الخيار الأفضل يستخدم اللون لتوضيح الأولوية والقراءة والحالة، لا لإضافة ضوضاء بصرية.",
                "The stronger option uses color to clarify priority, readability, and state instead of adding noise.");
        }

        if (normalized.Contains("form") || normalized.Contains("inclusive") || normalized.Contains("field"))
        {
            return new VisualQuestionPreset(
                "نموذج يوضح الحقول والحالة التالية بوضوح",
                "A form that clearly explains fields and next states",
                "نموذج مشتت يخلط بين الحقول والرسائل",
                "A distracting form that mixes fields and messages",
                "form-accessible-good",
                "form-accessible-bad",
                "راقب وضوح الحقول والرسائل ومكان الإجراء الأساسي.",
                "Check field clarity, feedback, and the placement of the primary action.",
                "النموذج الأقوى يشرح المطلوب، يبرز الإجراء الأساسي، ويجعل معالجة الخطأ أوضح.",
                "The stronger form explains what is needed, highlights the primary action, and makes recovery clearer.");
        }

        if (normalized.Contains("journey") || normalized.Contains("task") || normalized.Contains("flow") || normalized.Contains("service"))
        {
            return new VisualQuestionPreset(
                "تدفق يوضح البداية والخطوة التالية",
                "A flow that clarifies the start and next step",
                "تدفق متشابك يربك التسلسل",
                "A tangled flow that confuses the sequence",
                "journey-flow-good",
                "journey-flow-bad",
                "انظر إلى وضوح التسلسل وسهولة متابعة المسار.",
                "Look at sequence clarity and how easy the path is to follow.",
                "التدفق الأقوى يقلل التفرعات غير الضرورية ويجعل الحركة بين الخطوات متوقعة.",
                "The better flow removes unnecessary branching and makes movement between steps predictable.");
        }

        if (normalized.Contains("navigation") || normalized.Contains("site") || normalized.Contains("architecture"))
        {
            return new VisualQuestionPreset(
                "تنقل منظم يسهل العثور على المحتوى",
                "An organized navigation structure that aids findability",
                "تنقل متداخل يشتت الاختيار",
                "An overlapping navigation structure that dilutes choice",
                "navigation-map-good",
                "navigation-map-bad",
                "اسأل: هل أعرف أين أبدأ؟ وهل يمكنني توقع مكان المحتوى التالي؟",
                "Ask: do I know where to start, and can I predict where the next piece of content lives?",
                "التنقل الأفضل يوزع المعلومات بمنطق واضح ويقلل من تكرار المسميات والمستويات.",
                "The better navigation organizes information with clear logic and reduces repeated labels and levels.");
        }

        if (normalized.Contains("feedback") || normalized.Contains("microinteraction") || normalized.Contains("status"))
        {
            return new VisualQuestionPreset(
                "تغذية راجعة واضحة تطمئن المستخدم",
                "Clear feedback that reassures the user",
                "تغذية راجعة غامضة لا تشرح الحالة",
                "Ambiguous feedback that hides the state",
                "feedback-good",
                "feedback-bad",
                "راجع هل الرسالة تشرح الحالة التالية وما الذي حدث فعلاً.",
                "Check whether the message explains the current state and what actually happened.",
                "التغذية الراجعة الجيدة تشرح النتيجة والخطوة التالية بدلاً من ترك المستخدم في حالة تخمين.",
                "Good feedback explains the result and the next step instead of leaving people guessing.");
        }

        if (normalized.Contains("checkout") || normalized.Contains("case-study"))
        {
            return new VisualQuestionPreset(
                "واجهة Checkout متوازنة تسهّل القرار",
                "A balanced checkout layout that supports the decision",
                "واجهة Checkout تربك التسلسل والملخص",
                "A checkout layout that confuses sequence and summary",
                "checkout-balance-good",
                "checkout-balance-bad",
                "انتبه لترتيب الملخص والسعر والإجراء الأساسي داخل نفس اللحظة.",
                "Pay attention to how summary, price, and the primary action are ordered in the same moment.",
                "الخيار الأفضل يجعل السعر والقرار النهائي والإجراء الأساسي في تسلسل بصري مريح وواضح.",
                "The stronger option places price, final decision, and the main action in a comfortable, clear sequence.");
        }

        return new VisualQuestionPreset(
            "واجهة توضّح الهرمية والإجراء الأساسي",
            "A layout that makes hierarchy and the primary action clear",
            "واجهة تجعل العناصر متساوية ومشتتة",
            "A layout that makes everything feel equally loud",
            "dashboard-hierarchy-good",
            "dashboard-hierarchy-bad",
            "ابحث عن مكان واضح تبدأ منه العين، ثم أين يجب أن تذهب بعدها.",
            "Look for a clear visual entry point and where the eye should go next.",
            "الهرمية القوية توزع الانتباه بتسلسل منطقي وتدعم القرار الأساسي دون فوضى.",
            "Strong hierarchy distributes attention in a logical sequence and supports the primary decision without noise.");
    }

    private sealed record VisualQuestionPreset(
        string GoodLabelAr,
        string GoodLabelEn,
        string BadLabelAr,
        string BadLabelEn,
        string GoodVisualKey,
        string BadVisualKey,
        string HintAr,
        string HintEn,
        string ExplanationAr,
        string ExplanationEn);
}
