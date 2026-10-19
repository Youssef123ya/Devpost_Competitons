using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UXFriends.API.Support;
using UXFriends.Domain.Entities;
using UXFriends.Infrastructure.Data;

namespace UXFriends.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PortfolioController : ControllerBase
{
    private readonly UXFriendsDbContext _context;

    public PortfolioController(UXFriendsDbContext context)
    {
        _context = context;
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetPortfolio()
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

        await EnsurePortfolioIdentityAsync(user);

        var portfolioData = await BuildPortfolioDataAsync(user, includePrivateData: true);
        return Ok(portfolioData);
    }

    [Authorize]
    [HttpPut("privacy")]
    public async Task<IActionResult> UpdatePrivacy([FromBody] UpdatePortfolioPrivacyDto dto)
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

        await EnsurePortfolioIdentityAsync(user);
        user.PortfolioVisibility = dto.Visibility;
        await _context.SaveChangesAsync();

        return Ok(BuildPrivacyPayload(user));
    }

    [Authorize]
    [HttpPost("privacy/regenerate")]
    public async Task<IActionResult> RegenerateAccessLink()
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

        await EnsurePortfolioIdentityAsync(user);
        user.PortfolioAccessKey = CreateAccessKey();
        await _context.SaveChangesAsync();

        return Ok(BuildPrivacyPayload(user));
    }

    [AllowAnonymous]
    [HttpGet("public")]
    public async Task<IActionResult> GetPublicPortfolio([FromQuery] string slug, [FromQuery(Name = "access")] string? accessKey)
    {
        if (string.IsNullOrWhiteSpace(slug))
        {
            return BadRequest(new { message = "Portfolio slug is required." });
        }

        var user = await _context.Users.FirstOrDefaultAsync(item => item.PortfolioSlug == slug.Trim());
        if (user is null)
        {
            return NotFound(new { message = "Portfolio not found" });
        }

        await EnsurePortfolioIdentityAsync(user);

        var accessError = ValidatePublicAccess(user, accessKey);
        if (accessError is not null)
        {
            return accessError;
        }

        var portfolioData = await BuildPortfolioDataAsync(user, includePrivateData: false);
        return Ok(portfolioData);
    }

    [AllowAnonymous]
    [HttpGet("public/project")]
    public async Task<IActionResult> GetPublicProject(
        [FromQuery] string slug,
        [FromQuery] string projectCode,
        [FromQuery(Name = "access")] string? accessKey)
    {
        if (string.IsNullOrWhiteSpace(slug))
        {
            return BadRequest(new { message = "Portfolio slug is required." });
        }

        var user = await _context.Users.FirstOrDefaultAsync(item => item.PortfolioSlug == slug.Trim());
        if (user is null)
        {
            return NotFound(new { message = "Portfolio not found" });
        }

        await EnsurePortfolioIdentityAsync(user);

        var accessError = ValidatePublicAccess(user, accessKey);
        if (accessError is not null)
        {
            return accessError;
        }

        var approvedSubmission = await _context.ProjectSubmissions
            .Include(item => item.Project)
            .Where(item =>
                item.UserId == user.Id &&
                item.ProjectCode == projectCode &&
                item.Status == "Approved")
            .OrderByDescending(item => item.SubmittedAt)
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (approvedSubmission is null)
        {
            return NotFound(new { message = "Project not found" });
        }

        var localized = ProjectLocalization.GetContent(
            approvedSubmission.Project.ProjectCode,
            approvedSubmission.Project.Title,
            approvedSubmission.Project.Description,
            approvedSubmission.Project.Requirements);
        var section = CatalogContent.FindSection(approvedSubmission.Project.SectionCode);

        return Ok(new
        {
            code = approvedSubmission.Project.ProjectCode,
            sectionCode = approvedSubmission.Project.SectionCode,
            sectionTitleAr = section?.TitleAr ?? approvedSubmission.Project.SectionCode,
            sectionTitleEn = section?.TitleEn ?? approvedSubmission.Project.SectionCode,
            titleAr = localized.TitleAr,
            titleEn = localized.TitleEn,
            descriptionAr = localized.DescriptionAr,
            descriptionEn = localized.DescriptionEn,
            requirementsAr = localized.RequirementsAr,
            requirementsEn = localized.RequirementsEn,
            submissionStatus = approvedSubmission.Status,
            submittedAt = approvedSubmission.SubmittedAt,
            submissionUrl = string.IsNullOrWhiteSpace(approvedSubmission.SubmissionUrl)
                ? null
                : approvedSubmission.SubmissionUrl
        });
    }

    private IActionResult? ValidatePublicAccess(User user, string? accessKey)
    {
        if (string.Equals(user.PortfolioVisibility, "private", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                message = "This portfolio is private."
            });
        }

        return null;
    }

    private async Task<object> BuildPortfolioDataAsync(User user, bool includePrivateData)
    {
        var approvedProjects = await GetApprovedProjectsAsync(user.Id);
        var certificatesCount = await _context.Certificates.CountAsync(item => item.UserId == user.Id);
        var badgesCount = await _context.UserBadges.CountAsync(item => item.UserId == user.Id && item.IsUnlocked);
        var fullName = $"{user.FirstName} {user.LastName}".Trim();
        var ownerProfile = new
        {
            firstName = user.FirstName,
            lastName = user.LastName,
            fullName,
            email = includePrivateData ? user.Email : null,
            avatar = user.Avatar,
            professionalTitle = user.ProfessionalTitle,
            bio = user.Bio,
            location = user.Location,
            website = user.Website,
            level = user.Level,
            totalXP = user.TotalXP,
            learningGoal = user.LearningGoal,
            skillLevel = user.SkillLevel,
            joinDate = user.CreatedAt
        };

        return new
        {
            profile = ownerProfile,
            owner = ownerProfile,
            privacy = includePrivateData
                ? BuildPrivacyPayload(user)
                : new
                {
                    visibility = NormalizeVisibility(user.PortfolioVisibility),
                    slug = user.PortfolioSlug,
                    publicUrl = BuildPublicUrl(user)
                },
            stats = new
            {
                approvedProjects = approvedProjects.Count,
                certificates = certificatesCount,
                badges = badgesCount
            },
            projects = approvedProjects
        };
    }

    private object BuildPrivacyPayload(User user)
    {
        return new
        {
            visibility = NormalizeVisibility(user.PortfolioVisibility),
            slug = user.PortfolioSlug,
            accessKey = user.PortfolioAccessKey,
            publicUrl = BuildPublicUrl(user)
        };
    }

    private async Task<List<object>> GetApprovedProjectsAsync(string userId)
    {
        var submissions = await _context.ProjectSubmissions
            .Include(item => item.Project)
            .Where(item => item.UserId == userId && item.Status == "Approved")
            .OrderByDescending(item => item.SubmittedAt)
            .AsNoTracking()
            .ToListAsync();

        return submissions
            .GroupBy(item => item.ProjectCode)
            .Select(group => group.OrderByDescending(item => item.SubmittedAt).First())
            .Select(item =>
            {
                var localized = ProjectLocalization.GetContent(
                    item.Project.ProjectCode,
                    item.Project.Title,
                    item.Project.Description,
                    item.Project.Requirements);
                var section = CatalogContent.FindSection(item.Project.SectionCode);

                return (object)new
                {
                    code = item.Project.ProjectCode,
                    sectionCode = item.Project.SectionCode,
                    sectionTitleAr = section?.TitleAr ?? item.Project.SectionCode,
                    sectionTitleEn = section?.TitleEn ?? item.Project.SectionCode,
                    titleAr = localized.TitleAr,
                    titleEn = localized.TitleEn,
                    descriptionAr = localized.DescriptionAr,
                    descriptionEn = localized.DescriptionEn,
                    submissionStatus = item.Status,
                    submittedAt = item.SubmittedAt,
                    submissionUrl = string.IsNullOrWhiteSpace(item.SubmissionUrl)
                        ? null
                        : item.SubmissionUrl
                };
            })
            .ToList();
    }

    private async Task EnsurePortfolioIdentityAsync(User user)
    {
        var hasChanges = false;

        if (string.IsNullOrWhiteSpace(user.PortfolioSlug))
        {
            user.PortfolioSlug = await BuildUniqueSlugAsync(user);
            hasChanges = true;
        }

        if (string.IsNullOrWhiteSpace(user.PortfolioAccessKey))
        {
            user.PortfolioAccessKey = CreateAccessKey();
            hasChanges = true;
        }

        if (string.IsNullOrWhiteSpace(user.PortfolioVisibility))
        {
            user.PortfolioVisibility = "private";
            hasChanges = true;
        }
        else if (string.Equals(user.PortfolioVisibility, "link-only", StringComparison.OrdinalIgnoreCase))
        {
            user.PortfolioVisibility = "private";
            hasChanges = true;
        }

        if (hasChanges)
        {
            await _context.SaveChangesAsync();
        }
    }

    private async Task<string> BuildUniqueSlugAsync(User user)
    {
        var fullName = $"{user.FirstName}-{user.LastName}";
        var baseSlug = Regex.Replace(fullName.ToLowerInvariant(), "[^a-z0-9]+", "-").Trim('-');
        if (string.IsNullOrWhiteSpace(baseSlug))
        {
            baseSlug = "learner";
        }

        var candidate = baseSlug;
        var counter = 1;

        while (await _context.Users.AnyAsync(item => item.Id != user.Id && item.PortfolioSlug == candidate))
        {
            candidate = $"{baseSlug}-{counter}";
            counter++;
        }

        return candidate;
    }

    private string BuildPublicUrl(User user)
    {
        var origin = Request.Headers.Origin.FirstOrDefault();
        var baseUrl = string.IsNullOrWhiteSpace(origin) ? "http://localhost:5173" : origin.TrimEnd('/');
        return $"{baseUrl}/portfolio/public?slug={Uri.EscapeDataString(user.PortfolioSlug)}";
    }

    private static string CreateAccessKey()
    {
        return Guid.NewGuid().ToString("N")[..16];
    }

    private static string NormalizeVisibility(string? value)
    {
        return value switch
        {
            "public" => "public",
            "private" => "private",
            _ => "private"
        };
    }

    public sealed class UpdatePortfolioPrivacyDto
    {
        [Required]
        [RegularExpression("^(public|private)$")]
        public string Visibility { get; set; } = "private";
    }
}
