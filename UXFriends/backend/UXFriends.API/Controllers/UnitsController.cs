using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UXFriends.API.Support;
using UXFriends.Infrastructure.Data;

namespace UXFriends.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class UnitsController : ControllerBase
{
    private readonly UXFriendsDbContext _context;

    public UnitsController(UXFriendsDbContext context)
    {
        _context = context;
    }

    [HttpGet("{unitCode}")]
    public async Task<IActionResult> GetUnit(string unitCode)
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
        if (!LearningAccessPolicy.IsUnitAccessible(unit, accessSnapshot))
        {
            return Forbid();
        }

        var section = CatalogContent.FindSection(unit.SectionCode);
        var lessons = CatalogContent.Lessons
            .Where(lesson => lesson.UnitCode == unitCode)
            .OrderBy(lesson => lesson.OrderNo)
            .ToList();

        var progressRecords = await _context.LessonProgress
            .Where(item => item.UserId == userId && lessons.Select(lesson => lesson.Code).Contains(item.LessonCode))
            .AsNoTracking()
            .ToListAsync();

        var progressLookup = progressRecords.ToDictionary(item => item.LessonCode, item => item);
        var completedLessons = lessons.Count(lesson =>
            progressLookup.TryGetValue(lesson.Code, out var progress) &&
            (progress.CompletedAt is not null || progress.Status == "Completed"));
        var totalLessons = lessons.Count;
        var progressPercent = totalLessons == 0
            ? 0
            : (int)Math.Round((double)lessons.Sum(lesson =>
                progressLookup.TryGetValue(lesson.Code, out var progress)
                    ? progress.ProgressPercent
                    : 0) / totalLessons);

        var project = await _context.Projects
            .AsNoTracking()
            .Where(item => item.SectionCode == unit.SectionCode)
            .OrderBy(item => item.CreatedAt)
            .FirstOrDefaultAsync();
        var sectionMilestones = await LearningAccessPolicy.BuildSectionMilestoneSnapshotAsync(
            _context,
            userId,
            unit.SectionCode);
        var sectionUnitCodes = CatalogContent.Units
            .Where(item => item.SectionCode == unit.SectionCode)
            .OrderBy(item => item.OrderNo)
            .Select(item => item.Code)
            .ToList();
        var isLastUnitInSection = sectionUnitCodes.LastOrDefault() == unit.Code;
        var unitQuiz = LearningExperienceCatalog.BuildUnitQuiz(unit.Code);
        var sectionQuiz = LearningExperienceCatalog.BuildSectionQuiz(unit.SectionCode);
        var passedUnitQuiz = await _context.QuizAttempts
            .AnyAsync(item =>
                item.UserId == userId &&
                item.Scope == "unit" &&
                item.UnitCode == unit.Code &&
                item.Passed);
        var passedSectionQuiz = await _context.QuizAttempts
            .AnyAsync(item =>
                item.UserId == userId &&
                item.Scope == "section" &&
                item.SectionCode == unit.SectionCode &&
                item.Passed);

        var latestSubmission = project is null
            ? null
            : await _context.ProjectSubmissions
                .AsNoTracking()
                .Where(item => item.UserId == userId && item.ProjectCode == project.ProjectCode)
                .OrderByDescending(item => item.SubmittedAt)
                .FirstOrDefaultAsync();
        var projectRequired = project is not null;
        var projectSubmitted = latestSubmission is not null;
        var projectCanBeEdited = latestSubmission is null ||
            !string.Equals(latestSubmission.Status, "Approved", StringComparison.OrdinalIgnoreCase);

        var localizedProject = project is null
            ? null
            : ProjectLocalization.GetContent(
                project.ProjectCode,
                project.Title,
                project.Description,
                project.Requirements);
        var projectSpec = project is null
            ? null
            : LearningExperienceCatalog.FindProject(project.ProjectCode);
        var outcomes = LearningExperienceCatalog.GetUnitOutcomes(unit.Code);

        return Ok(new
        {
            code = unit.Code,
            sectionCode = unit.SectionCode,
            sectionTitleAr = section?.TitleAr ?? unit.SectionCode,
            sectionTitleEn = section?.TitleEn ?? unit.SectionCode,
            titleAr = unit.TitleAr,
            titleEn = unit.TitleEn,
            descriptionAr = unit.DescriptionAr,
            descriptionEn = unit.DescriptionEn,
            durationMinutes = unit.DurationMinutes,
            xpReward = unit.XpReward,
            difficulty = unit.Difficulty,
            locked = !LearningAccessPolicy.IsUnitAccessible(unit, accessSnapshot),
            lessonsCount = totalLessons,
            completed = totalLessons > 0 && completedLessons == totalLessons,
            inProgress = progressPercent > 0 && completedLessons < totalLessons,
            progress = progressPercent,
            outcomesAr = outcomes.OutcomesAr,
            outcomesEn = outcomes.OutcomesEn,
            quiz = unitQuiz is null
                ? null
                : new
                {
                    questionCount = unitQuiz.Questions.Count,
                    xpReward = unitQuiz.XpReward,
                    passThreshold = unitQuiz.PassThreshold,
                    timeLimitMinutes = unitQuiz.TimeLimitMinutes,
                    passed = passedUnitQuiz
                },
            sectionExam = sectionQuiz is null
                ? null
                : new
                {
                    questionCount = sectionQuiz.Questions.Count,
                    xpReward = sectionQuiz.XpReward,
                    passThreshold = sectionQuiz.PassThreshold,
                    timeLimitMinutes = sectionQuiz.TimeLimitMinutes,
                    eligible = sectionMilestones.FinalExamEligible,
                    passed = passedSectionQuiz,
                    certificateIssued = sectionMilestones.CertificateIssued,
                    requirements = new
                    {
                        lessonsCompleted = sectionMilestones.LessonsCompleted,
                        unitQuizzesPassed = sectionMilestones.UnitQuizzesPassed,
                        projectRequired = sectionMilestones.ProjectRequired,
                        projectSubmitted = sectionMilestones.ProjectSubmitted,
                        completedLessons = sectionMilestones.CompletedLessons,
                        totalLessons = sectionMilestones.TotalLessons,
                        passedUnitQuizzes = sectionMilestones.PassedUnitQuizzes,
                        totalUnitQuizzes = sectionMilestones.TotalUnitQuizzes
                    }
                },
            project = !isLastUnitInSection || project is null
                ? null
                : new
                {
                    code = project.ProjectCode,
                    titleAr = localizedProject?.TitleAr ?? project.Title,
                    titleEn = localizedProject?.TitleEn ?? project.Title,
                    descriptionAr = localizedProject?.DescriptionAr ?? project.Description,
                    descriptionEn = localizedProject?.DescriptionEn ?? project.Description,
                    xpReward = projectSpec?.XpReward ?? XpEconomy.DefaultProjectReward,
                    estimatedHours = projectSpec?.EstimatedHours ?? 3,
                    submissionStatus = latestSubmission?.Status,
                    canEditSubmission = projectCanBeEdited
                }
        });
    }

    [HttpGet("{unitCode}/lessons")]
    public async Task<IActionResult> GetLessons(string unitCode)
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
        if (!LearningAccessPolicy.IsUnitAccessible(unit, accessSnapshot))
        {
            return Forbid();
        }

        var progressRecords = await _context.LessonProgress
            .Where(item => item.UserId == userId)
            .AsNoTracking()
            .ToListAsync();

        var progressLookup = progressRecords.ToDictionary(item => item.LessonCode, item => item);

        var lessons = CatalogContent.Lessons
            .Where(lesson => lesson.UnitCode == unitCode)
            .OrderBy(lesson => lesson.OrderNo)
            .Select(lesson =>
            {
                progressLookup.TryGetValue(lesson.Code, out var progress);

                return new
                {
                    code = lesson.Code,
                    titleAr = lesson.TitleAr,
                    titleEn = lesson.TitleEn,
                    descriptionAr = lesson.DescriptionAr,
                    descriptionEn = lesson.DescriptionEn,
                    contentAr = lesson.ContentAr,
                    contentEn = lesson.ContentEn,
                    durationMinutes = lesson.DurationMinutes,
                    xpReward = lesson.XpReward,
                    difficulty = lesson.Difficulty,
                    progress = progress?.ProgressPercent ?? 0,
                    completed = progress?.CompletedAt is not null || progress?.Status == "Completed"
                };
            });

        return Ok(lessons);
    }
}
