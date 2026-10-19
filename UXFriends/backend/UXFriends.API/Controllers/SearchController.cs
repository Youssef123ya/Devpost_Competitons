using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UXFriends.API.Support;
using UXFriends.Infrastructure.Data;

namespace UXFriends.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class SearchController : ControllerBase
{
    private readonly UXFriendsDbContext _context;

    public SearchController(UXFriendsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string? q)
    {
        var query = q?.Trim();
        if (string.IsNullOrWhiteSpace(query))
        {
            return Ok(Array.Empty<object>());
        }

        var currentProjectCodes = CourseBlueprintCatalog.Sections
            .Select(item => item.Project.Code)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var projects = await _context.Projects
            .Where(project => currentProjectCodes.Contains(project.ProjectCode))
            .AsNoTracking()
            .ToListAsync();

        var results = new List<SearchResultItem>();

        results.AddRange(CatalogContent.Sections
            .Where(section => Matches(query, section.TitleAr, section.TitleEn, section.DescriptionAr, section.DescriptionEn))
            .Select(section => new SearchResultItem(
                section.Code,
                section.Code,
                "section",
                section.Code,
                null,
                section.TitleAr,
                section.TitleEn,
                section.DescriptionAr,
                section.DescriptionEn,
                "مسار",
                "Path",
                GetScore(query, section.TitleAr, section.TitleEn))));

        results.AddRange(CatalogContent.Lessons
            .Where(lesson => Matches(query, lesson.TitleAr, lesson.TitleEn, lesson.DescriptionAr, lesson.DescriptionEn))
            .Select(lesson =>
            {
                var unit = CatalogContent.FindUnit(lesson.UnitCode);

                return new SearchResultItem(
                    lesson.Code,
                    lesson.Code,
                    "lesson",
                    unit?.SectionCode,
                    lesson.UnitCode,
                    lesson.TitleAr,
                    lesson.TitleEn,
                    lesson.DescriptionAr,
                    lesson.DescriptionEn,
                    "درس",
                    "Lesson",
                    GetScore(query, lesson.TitleAr, lesson.TitleEn));
            }));

        results.AddRange(CatalogContent.Challenges
            .Where(challenge => Matches(query, challenge.TitleAr, challenge.TitleEn, challenge.DescriptionAr, challenge.DescriptionEn))
            .Select(challenge => new SearchResultItem(
                challenge.Code,
                challenge.Code,
                "challenge",
                null,
                null,
                challenge.TitleAr,
                challenge.TitleEn,
                challenge.DescriptionAr,
                challenge.DescriptionEn,
                "تحدي",
                "Challenge",
                GetScore(query, challenge.TitleAr, challenge.TitleEn))));

        results.AddRange(projects
            .Select(project =>
            {
                var localized = ProjectLocalization.GetContent(
                    project.ProjectCode,
                    project.Title,
                    project.Description,
                    project.Requirements);

                return new { project.ProjectCode, project.SectionCode, localized };
            })
            .Where(item => Matches(
                query,
                item.localized.TitleAr,
                item.localized.TitleEn,
                item.localized.DescriptionAr,
                item.localized.DescriptionEn))
            .Select(item => new SearchResultItem(
                item.ProjectCode,
                item.ProjectCode,
                "project",
                item.SectionCode,
                null,
                item.localized.TitleAr,
                item.localized.TitleEn,
                item.localized.DescriptionAr,
                item.localized.DescriptionEn,
                "مشروع",
                "Project",
                GetScore(query, item.localized.TitleAr, item.localized.TitleEn))));

        results.AddRange(CatalogContent.Sections
            .Where(section => Matches(
                query,
                $"شهادة {section.TitleAr}",
                $"{section.TitleEn} Certificate",
                section.DescriptionAr,
                section.DescriptionEn))
            .Select(section => new SearchResultItem(
                $"certificate-{section.Code}",
                section.Code,
                "certificate",
                section.Code,
                null,
                $"شهادة {section.TitleAr}",
                $"{section.TitleEn} Certificate",
                $"الشهادة الخاصة بمسار {section.TitleAr}.",
                $"Certificate for the {section.TitleEn} path.",
                "شهادة",
                "Certificate",
                GetScore(query, $"شهادة {section.TitleAr}", $"{section.TitleEn} Certificate"))));

        var payload = results
            .OrderBy(item => item.Score)
            .ThenBy(item => item.Type)
            .Take(24)
            .Select(item => new
            {
                id = item.Id,
                code = item.Code,
                type = item.Type,
                sectionCode = item.SectionCode,
                unitCode = item.UnitCode,
                titleAr = item.TitleAr,
                titleEn = item.TitleEn,
                descriptionAr = item.DescriptionAr,
                descriptionEn = item.DescriptionEn,
                badgeAr = item.BadgeAr,
                badgeEn = item.BadgeEn
            });

        return Ok(payload);
    }

    private static bool Matches(string query, params string?[] values) =>
        values.Any(value =>
            !string.IsNullOrWhiteSpace(value) &&
            value.Contains(query, StringComparison.OrdinalIgnoreCase));

    private static int GetScore(string query, params string?[] values)
    {
        foreach (var value in values)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                continue;
            }

            if (value.StartsWith(query, StringComparison.OrdinalIgnoreCase))
            {
                return 0;
            }
        }

        return 1;
    }

    private sealed record SearchResultItem(
        string Id,
        string Code,
        string Type,
        string? SectionCode,
        string? UnitCode,
        string TitleAr,
        string TitleEn,
        string DescriptionAr,
        string DescriptionEn,
        string BadgeAr,
        string BadgeEn,
        int Score);
}
