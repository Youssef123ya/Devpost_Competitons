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
public class ProjectsController : ControllerBase
{
    private readonly UXFriendsDbContext _context;

    public ProjectsController(UXFriendsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetProjects()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var currentProjectCodes = CourseBlueprintCatalog.Sections
            .Select(item => item.Project.Code)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var user = await _context.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return NotFound(new { message = "User not found" });
        }

        var accessSnapshot = await LearningAccessPolicy.BuildSnapshotAsync(_context, user);

        var projects = (await _context.Projects
            .Where(project => currentProjectCodes.Contains(project.ProjectCode))
            .AsNoTracking()
            .ToListAsync())
            .Where(project => LearningAccessPolicy.IsSectionAccessible(project.SectionCode, accessSnapshot))
            .ToList();

        var submissions = await _context.ProjectSubmissions
            .Where(item => item.UserId == userId)
            .AsNoTracking()
            .ToListAsync();

        var latestSubmissions = submissions
            .GroupBy(item => item.ProjectCode)
            .ToDictionary(
                group => group.Key,
                group => group.OrderByDescending(item => item.SubmittedAt).First());

        var sectionOrder = CatalogContent.Sections
            .ToDictionary(item => item.Code, item => item.OrderNo, StringComparer.OrdinalIgnoreCase);

        var result = projects
            .OrderBy(project => sectionOrder.GetValueOrDefault(project.SectionCode, int.MaxValue))
            .Select(async project =>
            {
                var section = CatalogContent.FindSection(project.SectionCode);
                var localized = ProjectLocalization.GetContent(
                    project.ProjectCode,
                    project.Title,
                    project.Description,
                    project.Requirements);
                var specification = LearningExperienceCatalog.FindProject(project.ProjectCode);
                latestSubmissions.TryGetValue(project.ProjectCode, out var submission);
                var milestones = await LearningAccessPolicy.BuildSectionMilestoneSnapshotAsync(
                    _context,
                    userId,
                    project.SectionCode);

                return new
                {
                    code = project.ProjectCode,
                    sectionCode = project.SectionCode,
                    sectionTitleAr = section?.TitleAr ?? project.SectionCode,
                    sectionTitleEn = section?.TitleEn ?? project.SectionCode,
                    titleAr = localized.TitleAr,
                    titleEn = localized.TitleEn,
                    descriptionAr = localized.DescriptionAr,
                    descriptionEn = localized.DescriptionEn,
                    submissionStatus = submission?.Status,
                    submittedAt = submission?.SubmittedAt,
                    submissionUrl = string.IsNullOrWhiteSpace(submission?.SubmissionUrl)
                        ? null
                        : submission!.SubmissionUrl,
                    canEditSubmission = submission is null ||
                        !string.Equals(submission.Status, "Approved", StringComparison.OrdinalIgnoreCase),
                    estimatedHours = specification?.EstimatedHours ?? 3,
                    xpReward = specification?.XpReward ?? XpEconomy.DefaultProjectReward,
                    eligibleToSubmit = milestones.ProjectEligible,
                    submissionEligibility = BuildSubmissionEligibilityPayload(milestones)
                };
            });

        return Ok(await Task.WhenAll(result));
    }

    [HttpGet("{code}")]
    public async Task<IActionResult> GetProject(string code)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var currentProjectCodes = CourseBlueprintCatalog.Sections
            .Select(item => item.Project.Code)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (!currentProjectCodes.Contains(code))
        {
            return NotFound(new { message = "Project not found" });
        }

        var project = await _context.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.ProjectCode == code);

        if (project is null)
        {
            return NotFound(new { message = "Project not found" });
        }

        var user = await _context.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return NotFound(new { message = "User not found" });
        }

        var accessSnapshot = await LearningAccessPolicy.BuildSnapshotAsync(_context, user);
        if (!LearningAccessPolicy.IsSectionAccessible(project.SectionCode, accessSnapshot))
        {
            return Forbid();
        }

        var submission = await _context.ProjectSubmissions
            .Where(item => item.ProjectCode == code && item.UserId == userId)
            .OrderByDescending(item => item.SubmittedAt)
            .AsNoTracking()
            .FirstOrDefaultAsync();

        var section = CatalogContent.FindSection(project.SectionCode);
        var localized = ProjectLocalization.GetContent(
            project.ProjectCode,
            project.Title,
            project.Description,
            project.Requirements);
        var specification = LearningExperienceCatalog.FindProject(project.ProjectCode);
        var milestones = await LearningAccessPolicy.BuildSectionMilestoneSnapshotAsync(
            _context,
            userId,
            project.SectionCode);

        return Ok(new
        {
            code = project.ProjectCode,
            sectionCode = project.SectionCode,
            sectionTitleAr = section?.TitleAr ?? project.SectionCode,
            sectionTitleEn = section?.TitleEn ?? project.SectionCode,
            titleAr = localized.TitleAr,
            titleEn = localized.TitleEn,
            descriptionAr = localized.DescriptionAr,
            descriptionEn = localized.DescriptionEn,
            requirementsAr = localized.RequirementsAr,
            requirementsEn = localized.RequirementsEn,
            deliverablesAr = specification?.DeliverablesAr ?? [localized.RequirementsAr],
            deliverablesEn = specification?.DeliverablesEn ?? [localized.RequirementsEn],
            evaluationCriteria = (specification?.Criteria ?? [])
                .Select(item => new
                {
                    labelAr = item.LabelAr,
                    labelEn = item.LabelEn,
                    weight = item.Weight
                }),
            estimatedHours = specification?.EstimatedHours ?? 3,
            xpReward = specification?.XpReward ?? XpEconomy.DefaultProjectReward,
            eligibleToSubmit = milestones.ProjectEligible,
            submissionEligibility = BuildSubmissionEligibilityPayload(milestones),
            submissionStatus = submission?.Status,
            submittedAt = submission?.SubmittedAt,
            submissionUrl = string.IsNullOrWhiteSpace(submission?.SubmissionUrl)
                ? null
                : submission!.SubmissionUrl,
            canEditSubmission = submission is null ||
                !string.Equals(submission.Status, "Approved", StringComparison.OrdinalIgnoreCase),
            submissionDescription = string.IsNullOrWhiteSpace(submission?.Description)
                ? null
                : submission!.Description
        });
    }

    [HttpPost("{code}/submit")]
    public async Task<IActionResult> SubmitProject(string code, [FromBody] ProjectSubmissionRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.SubmissionUrl) ||
            !Uri.TryCreate(request.SubmissionUrl.Trim(), UriKind.Absolute, out var submissionUri))
        {
            return BadRequest(new { message = "A valid submission URL is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Description) || request.Description.Trim().Length < 30)
        {
            return BadRequest(new { message = "Please add a short description with at least 30 characters." });
        }

        var currentProjectCodes = CourseBlueprintCatalog.Sections
            .Select(item => item.Project.Code)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (!currentProjectCodes.Contains(code))
        {
            return NotFound(new { message = "Project not found" });
        }

        var project = await _context.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.ProjectCode == code);

        if (project is null)
        {
            return NotFound(new { message = "Project not found" });
        }

        var user = await _context.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return NotFound(new { message = "User not found" });
        }

        var accessSnapshot = await LearningAccessPolicy.BuildSnapshotAsync(_context, user);
        if (!LearningAccessPolicy.IsSectionAccessible(project.SectionCode, accessSnapshot))
        {
            return Forbid();
        }

        var milestones = await LearningAccessPolicy.BuildSectionMilestoneSnapshotAsync(
            _context,
            userId,
            project.SectionCode);
        if (!milestones.ProjectEligible)
        {
            return BadRequest(new
            {
                message = "Finish all section lessons and pass all unit quizzes before submitting the section project.",
                submissionEligibility = BuildSubmissionEligibilityPayload(milestones)
            });
        }

        var approvedSubmissionExists = await _context.ProjectSubmissions.AnyAsync(item =>
            item.UserId == userId &&
            item.ProjectCode == code &&
            item.Status == "Approved");
        if (approvedSubmissionExists)
        {
            return BadRequest(new
            {
                message = "This submission is already approved and can no longer be edited."
            });
        }

        var latestEditableSubmission = await _context.ProjectSubmissions
            .Where(item =>
                item.UserId == userId &&
                item.ProjectCode == code &&
                item.Status != "Approved")
            .OrderByDescending(item => item.SubmittedAt)
            .FirstOrDefaultAsync();
        var submission = latestEditableSubmission;
        if (submission is null)
        {
            submission = new Domain.Entities.ProjectSubmission
            {
                ProjectCode = code,
                UserId = userId
            };
            _context.ProjectSubmissions.Add(submission);
        }

        var nowUtc = DateTime.UtcNow;
        var specification = LearningExperienceCatalog.FindProject(code);
        var xpReward = specification?.XpReward ?? XpEconomy.DefaultProjectReward;
        var alreadyAwarded = await _context.XPLogs.AnyAsync(item =>
            item.UserId == userId &&
            item.ActivityType == "ProjectCompleted" &&
            item.ReferenceId == code);

        submission.SubmissionUrl = submissionUri.ToString();
        submission.Description = request.Description.Trim();
        submission.Status = "Approved";
        submission.SubmittedAt = nowUtc;

        user.LastLoginAt = nowUtc;

        var xpAwarded = 0;
        if (!alreadyAwarded)
        {
            xpAwarded = xpReward;
            user.ProjectsCompleted += 1;
            GamificationHelper.ApplyXp(user, xpReward);

            _context.XPLogs.Add(new Domain.Entities.XPLog
            {
                LogCode = Guid.NewGuid().ToString("N"),
                UserId = userId,
                XP = xpReward,
                ActivityType = "ProjectCompleted",
                ReferenceId = code,
                CreatedAt = nowUtc
            });
        }

        await _context.SaveChangesAsync();
        var dailyGoals = await DailyGoalEngine.SyncAsync(_context, user, nowUtc);
        if (dailyGoals.XpAwarded > 0)
        {
            await _context.SaveChangesAsync();
        }

        return Ok(new
        {
            success = true,
            status = submission.Status,
            submittedAt = submission.SubmittedAt,
            submissionUrl = submission.SubmissionUrl,
            description = submission.Description,
            xpAwarded,
            dailyGoalXpAwarded = dailyGoals.XpAwarded,
            canEditSubmission = false,
            projectsCompleted = user.ProjectsCompleted,
            level = user.Level,
            totalXP = user.TotalXP,
            currentXP = user.CurrentXP,
            nextLevelXP = user.NextLevelXP
        });
    }

    private static object BuildSubmissionEligibilityPayload(SectionMilestoneSnapshot milestones) => new
    {
        eligible = milestones.ProjectEligible,
        requirements = new
        {
            lessonsCompleted = milestones.LessonsCompleted,
            unitQuizzesPassed = milestones.UnitQuizzesPassed,
            completedLessons = milestones.CompletedLessons,
            totalLessons = milestones.TotalLessons,
            passedUnitQuizzes = milestones.PassedUnitQuizzes,
            totalUnitQuizzes = milestones.TotalUnitQuizzes
        }
    };
}

public sealed record ProjectSubmissionRequest(string SubmissionUrl, string Description);
