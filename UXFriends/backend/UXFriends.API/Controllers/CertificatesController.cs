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
public class CertificatesController : ControllerBase
{
    private readonly UXFriendsDbContext _context;

    public CertificatesController(UXFriendsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetCertificates()
    {
        var user = await GetCurrentUserAsync();
        if (user is null)
        {
            return Unauthorized();
        }

        await EnsureIssuedCertificatesAsync(user.Id);
        var certificates = await BuildCertificateEntriesAsync(user);
        return Ok(certificates);
    }

    [HttpGet("{code}")]
    public async Task<IActionResult> GetCertificate(string code)
    {
        var user = await GetCurrentUserAsync();
        if (user is null)
        {
            return Unauthorized();
        }

        await EnsureIssuedCertificatesAsync(user.Id);
        var certificate = (await BuildCertificateEntriesAsync(user))
            .FirstOrDefault(item => item.Code == code && item.Status == "available");

        if (certificate is null)
        {
            return NotFound(new { message = "Certificate not found" });
        }

        return Ok(certificate);
    }

    private async Task<User?> GetCurrentUserAsync()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return null;
        }

        return await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == userId);
    }

    private async Task EnsureIssuedCertificatesAsync(string userId)
    {
        var passedSectionAttempts = await _context.QuizAttempts
            .Where(item =>
                item.UserId == userId &&
                item.Scope == "section" &&
                item.Passed &&
                item.SectionCode != null)
            .AsNoTracking()
            .ToListAsync();

        var existingSectionCodes = await _context.Certificates
            .Where(item => item.UserId == userId)
            .Select(item => item.SectionCode)
            .ToListAsync();

        var existingLookup = existingSectionCodes.ToHashSet();
        var certificatesToCreate = new List<Certificate>();

        foreach (var section in CatalogContent.Sections)
        {
            if (existingLookup.Contains(section.Code))
            {
                continue;
            }

            var latestPassedAttempt = passedSectionAttempts
                .Where(item => item.SectionCode == section.Code)
                .OrderByDescending(item => item.SubmittedAt)
                .FirstOrDefault();

            if (latestPassedAttempt is null)
            {
                continue;
            }

            certificatesToCreate.Add(new Certificate
            {
                CertificateCode = Guid.NewGuid().ToString("N"),
                UserId = userId,
                SectionCode = section.Code,
                CertificateNo = BuildCertificateNo(section.Code),
                IssuedAt = latestPassedAttempt.SubmittedAt
            });
        }

        if (certificatesToCreate.Count == 0)
        {
            return;
        }

        _context.Certificates.AddRange(certificatesToCreate);
        await _context.SaveChangesAsync();
    }

    private async Task<List<CertificateEntryDto>> BuildCertificateEntriesAsync(User user)
    {
        var issuedCertificates = await _context.Certificates
            .Where(item => item.UserId == user.Id)
            .AsNoTracking()
            .ToListAsync();

        var certificateLookup = issuedCertificates.ToDictionary(item => item.SectionCode);
        var passedExamSectionCodes = await _context.QuizAttempts
            .Where(item =>
                item.UserId == user.Id &&
                item.Scope == "section" &&
                item.Passed &&
                item.SectionCode != null)
            .Select(item => item.SectionCode!)
            .Distinct()
            .ToListAsync();

        var learnerName = $"{user.FirstName} {user.LastName}".Trim();
        var result = new List<CertificateEntryDto>(CatalogContent.Sections.Count);

        foreach (var section in CatalogContent.Sections)
        {
            var milestones = await LearningAccessPolicy.BuildSectionMilestoneSnapshotAsync(
                _context,
                user.Id,
                section.Code);
            var examPassed = passedExamSectionCodes.Contains(section.Code);
            certificateLookup.TryGetValue(section.Code, out var certificate);
            var progress = milestones.TotalLessons == 0
                ? 0
                : certificate is not null
                    ? 100
                    : (int)Math.Round(milestones.CompletedLessons * 100d / milestones.TotalLessons);

            result.Add(new CertificateEntryDto(
                section.Code,
                section.Code,
                $"شهادة {section.TitleAr}",
                $"{section.TitleEn} Certificate",
                section.TitleAr,
                section.TitleEn,
                section.DescriptionAr,
                section.DescriptionEn,
                certificate is null ? "locked" : "available",
                progress,
                milestones.CompletedLessons,
                milestones.TotalLessons,
                milestones.FinalExamEligible,
                examPassed,
                certificate?.IssuedAt,
                certificate?.CertificateNo,
                learnerName));
        }

        return result;
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

    private sealed record CertificateEntryDto(
        string Code,
        string SectionCode,
        string TitleAr,
        string TitleEn,
        string PathAr,
        string PathEn,
        string DescriptionAr,
        string DescriptionEn,
        string Status,
        int Progress,
        int LessonsCompleted,
        int TotalLessons,
        bool ExamReady,
        bool ExamPassed,
        DateTime? IssuedAt,
        string? CertificateNo,
        string LearnerName);
}
