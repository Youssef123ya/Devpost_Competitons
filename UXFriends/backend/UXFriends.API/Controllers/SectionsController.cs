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
public class SectionsController : ControllerBase
{
    private readonly UXFriendsDbContext _context;

    public SectionsController(UXFriendsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetSections()
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

        if (await LearningAccessPolicy.SyncStoredSkillLevelAsync(_context, user))
        {
            await _context.SaveChangesAsync();
        }

        var accessSnapshot = await LearningAccessPolicy.BuildSnapshotAsync(_context, user);

        var progressRecords = await _context.LessonProgress
            .Where(item => item.UserId == userId)
            .AsNoTracking()
            .ToListAsync();

        var completedLessonCodes = progressRecords
            .Where(item => item.CompletedAt is not null || item.Status == "Completed")
            .Select(item => item.LessonCode)
            .ToHashSet();

        var certificateSectionCodes = (await _context.Certificates
                .Where(item => item.UserId == userId)
                .Select(item => item.SectionCode)
                .ToListAsync())
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var passedUnitQuizUnitCodes = (await _context.QuizAttempts
                .Where(item => item.UserId == userId && item.Scope == "unit" && item.Passed)
                .Select(item => item.UnitCode)
                .ToListAsync())
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var passedSectionQuizSectionCodes = (await _context.QuizAttempts
                .Where(item => item.UserId == userId && item.Scope == "section" && item.Passed)
                .Select(item => item.SectionCode)
                .ToListAsync())
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var submittedProjectCodes = (await _context.ProjectSubmissions
                .Where(item => item.UserId == userId)
                .Select(item => item.ProjectCode)
                .ToListAsync())
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var firstProjectCodeBySection = (await _context.Projects
                .AsNoTracking()
                .GroupBy(item => item.SectionCode)
                .Select(group => new
                {
                    SectionCode = group.Key,
                    ProjectCode = group
                        .OrderBy(item => item.CreatedAt)
                        .Select(item => item.ProjectCode)
                        .FirstOrDefault()
                })
                .ToListAsync())
            .Where(item =>
                !string.IsNullOrWhiteSpace(item.SectionCode) &&
                !string.IsNullOrWhiteSpace(item.ProjectCode))
            .ToDictionary(
                item => item.SectionCode,
                item => item.ProjectCode!,
                StringComparer.OrdinalIgnoreCase);

        var sections = CatalogContent.Sections
            .OrderBy(section => section.OrderNo)
            .Select(section =>
            {
                var sectionUnits = CatalogContent.Units
                    .Where(unit => unit.SectionCode == section.Code)
                    .ToList();
                var unitCodes = sectionUnits
                    .Select(unit => unit.Code)
                    .ToHashSet();
                var sectionLessons = CatalogContent.Lessons
                    .Where(lesson => unitCodes.Contains(lesson.UnitCode))
                    .ToList();
                var completed = sectionLessons.Count(lesson => completedLessonCodes.Contains(lesson.Code));
                var total = sectionLessons.Count;
                var estimatedMinutes = CatalogContent.Units
                    .Where(unit => unitCodes.Contains(unit.Code))
                    .Sum(unit => unit.DurationMinutes);
                var certificateIssued = certificateSectionCodes.Contains(section.Code);
                var sectionExamPassed = passedSectionQuizSectionCodes.Contains(section.Code);
                var projectRequired = firstProjectCodeBySection.TryGetValue(section.Code, out var projectCode);
                var projectSubmitted =
                    !projectRequired ||
                    (!string.IsNullOrWhiteSpace(projectCode) &&
                     submittedProjectCodes.Contains(projectCode));
                var unitQuizzesPassed = sectionUnits.Count == 0 ||
                    sectionUnits.All(unit => passedUnitQuizUnitCodes.Contains(unit.Code));
                var lessonsCompleted = total > 0 && completed == total;
                var readyForFinalExam = lessonsCompleted && unitQuizzesPassed && projectSubmitted;
                var completionState = certificateIssued
                    ? "completed"
                    : readyForFinalExam
                        ? "ready-for-final"
                        : lessonsCompleted
                            ? "requirements-pending"
                            : completed > 0
                                ? "in-progress"
                                : "not-started";
                var completionLabelAr = completionState switch
                {
                    "completed" => "مكتمل ومعتمد",
                    "ready-for-final" => "جاهز للاختبار النهائي",
                    "requirements-pending" => "ينقصه اختبار أو مشروع",
                    "in-progress" => "قيد التقدم",
                    _ => "لم يبدأ بعد"
                };
                var completionLabelEn = completionState switch
                {
                    "completed" => "Completed & certified",
                    "ready-for-final" => "Ready for final exam",
                    "requirements-pending" => "Quiz or project still needed",
                    "in-progress" => "In progress",
                    _ => "Not started yet"
                };

                return new
                {
                    code = section.Code,
                    titleAr = section.TitleAr,
                    titleEn = section.TitleEn,
                    descriptionAr = section.DescriptionAr,
                    descriptionEn = section.DescriptionEn,
                    icon = section.Icon,
                    difficulty = section.Difficulty,
                    locked = !LearningAccessPolicy.IsSectionAccessible(section, accessSnapshot),
                    unitsCount = unitCodes.Count,
                    lessonsCount = total,
                    estimatedMinutes,
                    progress = total == 0 ? 0 : (int)Math.Round((double)completed * 100 / total),
                    certificateIssued,
                    sectionExamPassed,
                    readyForFinalExam,
                    completionState,
                    completionLabelAr,
                    completionLabelEn
                };
            });

        return Ok(sections);
    }

    [HttpGet("{code}")]
    public async Task<IActionResult> GetSection(string code)
    {
        var section = CatalogContent.FindSection(code);
        if (section is null)
        {
            return NotFound(new { message = "Section not found" });
        }

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

        var accessSnapshot = await LearningAccessPolicy.BuildSnapshotAsync(_context, user);

        return Ok(new
        {
            code = section.Code,
            titleAr = section.TitleAr,
            titleEn = section.TitleEn,
            descriptionAr = section.DescriptionAr,
            descriptionEn = section.DescriptionEn,
            icon = section.Icon,
            difficulty = section.Difficulty,
            locked = !LearningAccessPolicy.IsSectionAccessible(section, accessSnapshot)
        });
    }

    [HttpGet("{sectionCode}/units")]
    public async Task<IActionResult> GetUnits(string sectionCode)
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
        if (!LearningAccessPolicy.IsSectionAccessible(section, accessSnapshot))
        {
            return Forbid();
        }

        var progressRecords = await _context.LessonProgress
            .Where(item => item.UserId == userId)
            .AsNoTracking()
            .ToListAsync();

        var completedLessonCodes = progressRecords
            .Where(item => item.CompletedAt is not null || item.Status == "Completed")
            .Select(item => item.LessonCode)
            .ToHashSet();

        var progressLookup = progressRecords.ToDictionary(item => item.LessonCode, item => item.ProgressPercent);

        var units = CatalogContent.Units
            .Where(unit => unit.SectionCode == sectionCode)
            .OrderBy(unit => unit.OrderNo)
            .Select(unit =>
            {
                var lessons = CatalogContent.Lessons
                    .Where(lesson => lesson.UnitCode == unit.Code)
                    .OrderBy(lesson => lesson.OrderNo)
                    .ToList();
                var completed = lessons.Count(lesson => completedLessonCodes.Contains(lesson.Code));
                var total = lessons.Count;
                var progress = total == 0
                    ? 0
                    : (int)Math.Round((double)lessons.Sum(lesson => progressLookup.GetValueOrDefault(lesson.Code)) / total);

                return new
                {
                    code = unit.Code,
                    titleAr = unit.TitleAr,
                    titleEn = unit.TitleEn,
                    descriptionAr = unit.DescriptionAr,
                    descriptionEn = unit.DescriptionEn,
                    durationMinutes = unit.DurationMinutes,
                    xpReward = unit.XpReward,
                    difficulty = unit.Difficulty,
                    locked = !LearningAccessPolicy.IsUnitAccessible(unit, accessSnapshot),
                    lessonsCount = lessons.Count,
                    completed = total > 0 && completed == total,
                    inProgress = progress > 0 && completed < total,
                    progress
                };
            });

        return Ok(units);
    }
}
