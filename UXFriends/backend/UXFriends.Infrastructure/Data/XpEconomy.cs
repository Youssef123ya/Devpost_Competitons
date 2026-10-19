namespace UXFriends.Infrastructure.Data;

public static class XpEconomy
{
    public static int DefaultProjectReward => 100;

    public static int GetLessonReward(LessonCatalogItem lesson) =>
        GetLessonReward(lesson.DurationMinutes, lesson.Difficulty);

    public static int GetLessonReward(CourseLessonDefinition lesson, string difficulty) =>
        GetLessonReward(lesson.DurationMinutes, difficulty);

    public static int GetLessonReward(int durationMinutes, string? difficulty)
    {
        var difficultyBonus = GetDifficultyRank(difficulty) * 2;
        var value = 8 + (int)Math.Ceiling(Math.Max(durationMinutes, 1) / 4d) + difficultyBonus;
        return RoundToNearestFive(Math.Clamp(value, 10, 25));
    }

    public static int GetLessonQuizReward(LessonCatalogItem lesson) =>
        RoundToNearestFive(Math.Max(10, GetLessonReward(lesson) - 5));

    public static int GetUnitDisplayReward(CourseUnitDefinition unit, string difficulty)
    {
        var lessonRewardTotal = unit.Lessons.Sum(lesson => GetLessonReward(lesson, difficulty));
        var unitQuizReward = GetUnitQuizReward(unit, difficulty);
        return lessonRewardTotal + unitQuizReward;
    }

    public static int GetUnitQuizReward(UnitCatalogItem unit, int lessonCount = 3) =>
        GetUnitQuizReward(lessonCount, unit.Difficulty);

    public static int GetUnitQuizReward(CourseUnitDefinition unit, string difficulty) =>
        GetUnitQuizReward(unit.Lessons.Count, difficulty);

    public static int GetUnitQuizReward(int lessonCount, string? difficulty)
    {
        var value = 15 + (Math.Max(lessonCount, 1) * 5) + (GetDifficultyRank(difficulty) * 5);
        return RoundToNearestFive(Math.Clamp(value, 25, 45));
    }

    public static int GetSectionExamReward(SectionCatalogItem section, int unitCount) =>
        GetSectionExamReward(unitCount, section.Difficulty);

    public static int GetSectionExamReward(CourseSectionDefinition section) =>
        GetSectionExamReward(section.Units.Count, section.Level);

    public static int GetSectionExamReward(int unitCount, string? difficulty)
    {
        var value = 35 + (Math.Max(unitCount, 1) * 10) + (GetDifficultyRank(difficulty) * 10);
        return RoundToNearestFive(Math.Clamp(value, 55, 85));
    }

    public static int GetProjectReward(CourseProjectDefinition project, string difficulty) =>
        GetProjectReward(project.EstimatedHours, difficulty);

    public static int GetProjectReward(int estimatedHours, string? difficulty)
    {
        var value = 55 + (Math.Max(estimatedHours, 1) * 8) + (GetDifficultyRank(difficulty) * 10);
        return RoundToNearestFive(Math.Clamp(value, 85, 130));
    }

    public static int GetChallengeReward(
        string challengeType,
        string? difficulty,
        string metric,
        int target)
    {
        var baseReward = challengeType.Trim().ToLowerInvariant() switch
        {
            "weekly" => 60,
            "personal" => 40,
            _ => 25
        };

        var difficultyBonus = GetDifficultyRank(difficulty) * 5;
        var metricBonus = metric switch
        {
            "lesson_quizzes_passed" or "unit_quizzes_passed" or "quizzes_passed" => 5,
            "learning_minutes" or "activities_completed" or "revision_sessions_completed" => 5,
            "xp_earned" => 10,
            "projects_submitted" or "section_quizzes_passed" => 15,
            _ => 0
        };

        var targetBonus = metric switch
        {
            "lessons_completed" or "lesson_quizzes_passed" or "unit_quizzes_passed" or "quizzes_passed" or "activities_completed" or "notes_saved" or "revision_sessions_completed" =>
                challengeType.Trim().ToLowerInvariant() switch
                {
                    "weekly" => Math.Max(target - 1, 0) * 3,
                    "personal" => Math.Max(target - 1, 0) * 4,
                    _ => Math.Max(target - 1, 0) * 5
                },
            "learning_minutes" => target switch
            {
                >= 45 => 10,
                >= 30 => 5,
                _ => 0
            },
            "xp_earned" => target switch
            {
                >= 350 => 15,
                >= 200 => 10,
                _ => 5
            },
            _ => 0
        };

        var value = baseReward + difficultyBonus + metricBonus + targetBonus;
        return RoundToNearestFive(Math.Clamp(value, 25, 90));
    }

    public static int GetDailyGoalReward(string category, int target)
    {
        var value = category switch
        {
            "lessons" => target switch
            {
                1 => 12,
                2 => 18,
                _ => 24
            },
            "focus" => target switch
            {
                15 => 10,
                30 => 16,
                _ => 22
            },
            "consistency" => target switch
            {
                1 => 14,
                2 => 20,
                _ => 26
            },
            _ => 10
        };

        return RoundToNearestFive(value);
    }

    public static int GetStreakReward(int milestoneDays) =>
        milestoneDays switch
        {
            100 => 220,
            60 => 140,
            30 => 90,
            14 => 55,
            7 => 35,
            3 => 20,
            _ => 0
        };

    public static int GetLeagueReward(int rank) =>
        rank switch
        {
            1 => 150,
            2 => 110,
            3 => 80,
            _ => 0
        };

    public static int GetRevisionSessionReward(int scorePercent, int correctAnswers, int totalQuestions)
    {
        if (totalQuestions <= 0)
        {
            return 0;
        }

        var completionBonus = 8;
        var accuracyBonus = correctAnswers * 2;
        var masteryBonus = scorePercent switch
        {
            >= 90 => 12,
            >= 75 => 8,
            >= 60 => 4,
            _ => 0
        };

        return RoundToNearestFive(Math.Clamp(completionBonus + accuracyBonus + masteryBonus, 10, 30));
    }

    public static int GetRevisionSessionRewardFromScore(int? scorePercent)
    {
        var clampedScore = Math.Clamp(scorePercent ?? 0, 0, 100);
        return clampedScore switch
        {
            >= 90 => 30,
            >= 75 => 25,
            >= 60 => 20,
            >= 40 => 15,
            _ => 10
        };
    }

    public static int GetRevisionRecommendationReward(int estimatedMinutes)
    {
        var value = estimatedMinutes switch
        {
            >= 35 => 25,
            >= 20 => 20,
            _ => 15
        };

        return RoundToNearestFive(value);
    }

    private static int GetDifficultyRank(string? difficulty) =>
        difficulty?.Trim().ToLowerInvariant() switch
        {
            "advanced" or "hard" => 2,
            "intermediate" or "medium" => 1,
            _ => 0
        };

    private static int RoundToNearestFive(int value) =>
        (int)(Math.Round(value / 5d, MidpointRounding.AwayFromZero) * 5);
}
