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
public class QuizzesController : ControllerBase
{
    private readonly UXFriendsDbContext _context;

    public QuizzesController(UXFriendsDbContext context)
    {
        _context = context;
    }

    [HttpGet("lesson/{lessonCode}")]
    public async Task<IActionResult> GetLessonQuiz(string lessonCode)
    {
        var accessCheck = await EnsureLessonAccessAsync(lessonCode);
        if (accessCheck is not null)
        {
            return accessCheck;
        }

        var quiz = LearningExperienceCatalog.BuildLessonQuiz(lessonCode);
        if (quiz is null)
        {
            return NotFound(new { message = "Quiz not found" });
        }

        return Ok(ToQuizResponse(quiz));
    }

    [HttpGet("unit/{unitCode}")]
    public async Task<IActionResult> GetUnitQuiz(string unitCode)
    {
        var accessCheck = await EnsureUnitAccessAsync(unitCode);
        if (accessCheck is not null)
        {
            return accessCheck;
        }

        var quiz = LearningExperienceCatalog.BuildUnitQuiz(unitCode);
        if (quiz is null)
        {
            return NotFound(new { message = "Quiz not found" });
        }

        return Ok(ToQuizResponse(quiz));
    }

    [HttpPost("lesson/{lessonCode}/submit")]
    public async Task<IActionResult> SubmitLessonQuiz(string lessonCode, [FromBody] QuizSubmissionRequest request)
    {
        var accessCheck = await EnsureLessonAccessAsync(lessonCode);
        if (accessCheck is not null)
        {
            return accessCheck;
        }

        var quiz = LearningExperienceCatalog.BuildLessonQuiz(lessonCode);
        if (quiz is null)
        {
            return NotFound(new { message = "Quiz not found" });
        }

        return await SubmitQuizAsync(quiz, request, lessonCode, "LessonQuizCompleted");
    }

    [HttpPost("unit/{unitCode}/submit")]
    public async Task<IActionResult> SubmitUnitQuiz(string unitCode, [FromBody] QuizSubmissionRequest request)
    {
        var accessCheck = await EnsureUnitAccessAsync(unitCode);
        if (accessCheck is not null)
        {
            return accessCheck;
        }

        var quiz = LearningExperienceCatalog.BuildUnitQuiz(unitCode);
        if (quiz is null)
        {
            return NotFound(new { message = "Quiz not found" });
        }

        return await SubmitQuizAsync(quiz, request, unitCode, "UnitQuizCompleted");
    }

    [HttpGet("section/{sectionCode}")]
    public async Task<IActionResult> GetSectionQuiz(string sectionCode)
    {
        var accessCheck = await EnsureSectionAccessAsync(sectionCode);
        if (accessCheck is not null)
        {
            return accessCheck;
        }

        var quiz = LearningExperienceCatalog.BuildSectionQuiz(sectionCode);
        if (quiz is null)
        {
            return NotFound(new { message = "Quiz not found" });
        }

        return Ok(ToQuizResponse(quiz));
    }

    [HttpPost("section/{sectionCode}/submit")]
    public async Task<IActionResult> SubmitSectionQuiz(string sectionCode, [FromBody] QuizSubmissionRequest request)
    {
        var accessCheck = await EnsureSectionAccessAsync(sectionCode);
        if (accessCheck is not null)
        {
            return accessCheck;
        }

        var quiz = LearningExperienceCatalog.BuildSectionQuiz(sectionCode);
        if (quiz is null)
        {
            return NotFound(new { message = "Quiz not found" });
        }

        return await SubmitQuizAsync(quiz, request, sectionCode, "SectionQuizCompleted");
    }

    private object ToQuizResponse(QuizCatalogDefinition quiz)
    {
        return new
        {
            quizCode = quiz.QuizCode,
            scope = quiz.Scope,
            sectionCode = quiz.SectionCode,
            unitCode = quiz.UnitCode,
            lessonCode = quiz.LessonCode,
            titleAr = quiz.TitleAr,
            titleEn = quiz.TitleEn,
            descriptionAr = quiz.DescriptionAr,
            descriptionEn = quiz.DescriptionEn,
            passThreshold = quiz.PassThreshold,
            xpReward = quiz.XpReward,
            timeLimitMinutes = quiz.TimeLimitMinutes,
            questions = quiz.Questions.Select(question => new
            {
                code = question.Code,
                promptAr = question.PromptAr,
                promptEn = question.PromptEn,
                optionsAr = question.OptionsAr,
                optionsEn = question.OptionsEn,
                hintAr = question.HintAr,
                hintEn = question.HintEn,
                relatedLessonCode = question.RelatedLessonCode,
                questionType = question.QuestionType,
                optionVisualKeys = question.OptionVisualKeys
            })
        };
    }

    private async Task<IActionResult> SubmitQuizAsync(
        QuizCatalogDefinition quiz,
        QuizSubmissionRequest request,
        string referenceCode,
        string activityType)
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

        var prerequisitesReady = await ValidatePrerequisitesAsync(userId, quiz);
        if (prerequisitesReady is not null)
        {
            return prerequisitesReady;
        }

        var submittedAnswers = request.Answers ?? new Dictionary<string, int>();
        var totalQuestions = quiz.Questions.Count;
        var correctAnswers = quiz.Questions.Count(question =>
            submittedAnswers.TryGetValue(question.Code, out var selectedAnswer) &&
            selectedAnswer == question.CorrectOptionIndex);
        var scorePercent = totalQuestions == 0
            ? 0
            : (int)Math.Round(correctAnswers * 100d / totalQuestions);
        var passed = scorePercent >= quiz.PassThreshold;
        var alreadyAwarded = await _context.XPLogs.AnyAsync(item =>
            item.UserId == userId &&
            item.ActivityType == activityType &&
            item.ReferenceId == referenceCode);

        var attempt = new QuizAttempt
        {
            AttemptCode = Guid.NewGuid().ToString("N"),
            UserId = userId,
            QuizCode = quiz.QuizCode,
            Scope = quiz.Scope,
            SectionCode = string.IsNullOrWhiteSpace(quiz.SectionCode) ? null : quiz.SectionCode,
            UnitCode = string.IsNullOrWhiteSpace(quiz.UnitCode) ? null : quiz.UnitCode,
            LessonCode = string.IsNullOrWhiteSpace(quiz.LessonCode) ? null : quiz.LessonCode,
            ScorePercent = scorePercent,
            CorrectAnswers = correctAnswers,
            TotalQuestions = totalQuestions,
            Passed = passed,
            TimeLimitMinutes = quiz.TimeLimitMinutes,
            SubmittedAt = DateTime.UtcNow
        };

        var incorrectAnswers = new List<QuizMistakePayload>();
        foreach (var question in quiz.Questions)
        {
            submittedAnswers.TryGetValue(question.Code, out var selectedIndex);
            var hasSelection = submittedAnswers.ContainsKey(question.Code);
            var isCorrect = hasSelection && selectedIndex == question.CorrectOptionIndex;
            var relatedLesson = question.RelatedLessonCode is null
                ? null
                : CatalogContent.FindLesson(question.RelatedLessonCode);
            var relatedUnit = relatedLesson is null ? null : CatalogContent.FindUnit(relatedLesson.UnitCode);
            var relatedSection = relatedUnit is null ? null : CatalogContent.FindSection(relatedUnit.SectionCode);
            var selectedAnswerAr = hasSelection && selectedIndex >= 0 && selectedIndex < question.OptionsAr.Count
                ? question.OptionsAr[selectedIndex]
                : null;
            var selectedAnswerEn = hasSelection && selectedIndex >= 0 && selectedIndex < question.OptionsEn.Count
                ? question.OptionsEn[selectedIndex]
                : null;

            attempt.Answers.Add(new QuizAttemptAnswer
            {
                QuestionCode = question.Code,
                QuestionType = question.QuestionType,
                PromptAr = question.PromptAr,
                PromptEn = question.PromptEn,
                SelectedOptionIndex = hasSelection ? selectedIndex : null,
                CorrectOptionIndex = question.CorrectOptionIndex,
                IsCorrect = isCorrect,
                SelectedAnswerAr = selectedAnswerAr,
                SelectedAnswerEn = selectedAnswerEn,
                CorrectAnswerAr = question.OptionsAr[question.CorrectOptionIndex],
                CorrectAnswerEn = question.OptionsEn[question.CorrectOptionIndex],
                ExplanationAr = question.ExplanationAr,
                ExplanationEn = question.ExplanationEn,
                RelatedLessonCode = question.RelatedLessonCode
            });

            if (isCorrect)
            {
                continue;
            }

            incorrectAnswers.Add(new QuizMistakePayload(
                question.Code,
                question.PromptAr,
                question.PromptEn,
                selectedAnswerAr,
                selectedAnswerEn,
                question.OptionsAr[question.CorrectOptionIndex],
                question.OptionsEn[question.CorrectOptionIndex],
                question.ExplanationAr,
                question.ExplanationEn,
                relatedLesson?.Code,
                relatedLesson?.TitleAr,
                relatedLesson?.TitleEn,
                relatedUnit?.Code,
                relatedUnit?.TitleAr,
                relatedUnit?.TitleEn,
                relatedSection?.Code,
                relatedSection?.TitleAr,
                relatedSection?.TitleEn));
        }

        _context.QuizAttempts.Add(attempt);

        var xpAwarded = 0;
        if (passed && !alreadyAwarded)
        {
            xpAwarded = quiz.XpReward;
            user.LastLoginAt = DateTime.UtcNow;
            GamificationHelper.ApplyXp(user, quiz.XpReward);

            _context.XPLogs.Add(new Domain.Entities.XPLog
            {
                LogCode = Guid.NewGuid().ToString("N"),
                UserId = userId,
                XP = quiz.XpReward,
                ActivityType = activityType,
                ReferenceId = referenceCode
            });
        }

        var certificateUnlocked = false;
        if (passed && string.Equals(quiz.Scope, "section", StringComparison.OrdinalIgnoreCase))
        {
            certificateUnlocked = await EnsureSectionCertificateAsync(userId, quiz.SectionCode, attempt.SubmittedAt);
            await LearningAccessPolicy.SyncStoredSkillLevelAsync(_context, user);
        }

        await _context.SaveChangesAsync();

        var weakTopics = incorrectAnswers
            .GroupBy(item => item.LessonCode ?? item.Code)
            .Select(group => group.First())
            .Select(item => new
            {
                code = item.Code,
                titleAr = item.LessonTitleAr ?? item.PromptAr,
                titleEn = item.LessonTitleEn ?? item.PromptEn,
                lessonCode = item.LessonCode
            })
            .ToList();

        return Ok(new
        {
            attemptCode = attempt.AttemptCode,
            scorePercent,
            correctAnswers,
            totalQuestions,
            passed,
            passThreshold = quiz.PassThreshold,
            xpAwarded,
            alreadyAwarded,
            timeLimitMinutes = quiz.TimeLimitMinutes,
            certificateUnlocked,
            level = user.Level,
            totalXP = user.TotalXP,
            currentXP = user.CurrentXP,
            nextLevelXP = user.NextLevelXP,
            weakTopics,
            mistakes = incorrectAnswers
        });
    }

    private async Task<IActionResult?> EnsureLessonAccessAsync(string lessonCode)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var lesson = CatalogContent.FindLesson(lessonCode);
        if (lesson is null)
        {
            return NotFound(new { message = "Lesson not found" });
        }

        var user = await _context.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return NotFound(new { message = "User not found" });
        }

        var accessSnapshot = await LearningAccessPolicy.BuildSnapshotAsync(_context, user);
        return LearningAccessPolicy.IsLessonAccessible(lesson, accessSnapshot)
            ? null
            : Forbid();
    }

    private async Task<IActionResult?> EnsureUnitAccessAsync(string unitCode)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var unit = CatalogContent.FindUnit(unitCode);
        if (unit is null)
        {
            return NotFound(new { message = "Unit not found" });
        }

        var user = await _context.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return NotFound(new { message = "User not found" });
        }

        var accessSnapshot = await LearningAccessPolicy.BuildSnapshotAsync(_context, user);
        return LearningAccessPolicy.IsUnitAccessible(unit, accessSnapshot)
            ? null
            : Forbid();
    }

    private async Task<IActionResult?> EnsureSectionAccessAsync(string sectionCode)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var section = CatalogContent.FindSection(sectionCode);
        if (section is null)
        {
            return NotFound(new { message = "Section not found" });
        }

        var user = await _context.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return NotFound(new { message = "User not found" });
        }

        var accessSnapshot = await LearningAccessPolicy.BuildSnapshotAsync(_context, user);
        return LearningAccessPolicy.IsSectionAccessible(section, accessSnapshot)
            ? null
            : Forbid();
    }

    private async Task<IActionResult?> ValidatePrerequisitesAsync(string userId, QuizCatalogDefinition quiz)
    {
        if (string.Equals(quiz.Scope, "lesson", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        if (string.Equals(quiz.Scope, "unit", StringComparison.OrdinalIgnoreCase))
        {
            var lessonCodes = CatalogContent.Lessons
                .Where(item => item.UnitCode == quiz.UnitCode)
                .Select(item => item.Code)
                .ToList();
            var completedCount = await _context.LessonProgress
                .Where(item =>
                    item.UserId == userId &&
                    lessonCodes.Contains(item.LessonCode) &&
                    (item.CompletedAt != null || item.Status == "Completed"))
                .CountAsync();

            return completedCount == lessonCodes.Count
                ? null
                : BadRequest(new { message = "Complete the unit lessons first." });
        }

        if (!string.Equals(quiz.Scope, "section", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var sectionMilestones = await LearningAccessPolicy.BuildSectionMilestoneSnapshotAsync(
            _context,
            userId,
            quiz.SectionCode!);

        if (!sectionMilestones.LessonsCompleted)
        {
            return BadRequest(new { message = "Complete all section lessons before starting the section exam." });
        }

        if (!sectionMilestones.UnitQuizzesPassed)
        {
            return BadRequest(new { message = "Pass all unit quizzes before starting the section exam." });
        }

        if (sectionMilestones.ProjectRequired && !sectionMilestones.ProjectSubmitted)
        {
            return BadRequest(new { message = "Submit the section project before starting the section exam." });
        }

        return null;
    }

    private async Task<bool> EnsureSectionCertificateAsync(string userId, string sectionCode, DateTime issuedAt)
    {
        var exists = await _context.Certificates.AnyAsync(item =>
            item.UserId == userId &&
            item.SectionCode == sectionCode);
        if (exists)
        {
            return false;
        }

        _context.Certificates.Add(new Certificate
        {
            CertificateCode = Guid.NewGuid().ToString("N"),
            UserId = userId,
            SectionCode = sectionCode,
            CertificateNo = BuildCertificateNo(sectionCode),
            IssuedAt = issuedAt
        });

        return true;
    }

    private static string BuildCertificateNo(string sectionCode)
    {
        var shortCode = sectionCode
            .Replace("-", string.Empty, StringComparison.Ordinal)
            .ToUpperInvariant();

        if (shortCode.Length > 8)
        {
            shortCode = shortCode[..8];
        }

        return $"UXF-{shortCode}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
    }
}

public sealed record QuizSubmissionRequest(Dictionary<string, int>? Answers);

public sealed record QuizMistakePayload(
    string Code,
    string PromptAr,
    string PromptEn,
    string? SelectedAnswerAr,
    string? SelectedAnswerEn,
    string CorrectAnswerAr,
    string CorrectAnswerEn,
    string ExplanationAr,
    string ExplanationEn,
    string? LessonCode,
    string? LessonTitleAr,
    string? LessonTitleEn,
    string? UnitCode,
    string? UnitTitleAr,
    string? UnitTitleEn,
    string? SectionCode,
    string? SectionTitleAr,
    string? SectionTitleEn);
