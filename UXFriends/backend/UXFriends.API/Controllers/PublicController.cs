using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UXFriends.Infrastructure.Data;

namespace UXFriends.API.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/public")]
public class PublicController : ControllerBase
{
    [HttpGet("landing")]
    public IActionResult GetLandingOverview()
    {
        var learningPaths = CatalogContent.Sections
            .OrderBy(section => section.OrderNo)
            .Select(section =>
            {
                var units = CatalogContent.Units
                    .Where(unit => unit.SectionCode == section.Code)
                    .OrderBy(unit => unit.OrderNo)
                    .ToList();

                var unitCodes = units.Select(unit => unit.Code).ToHashSet();
                var lessons = CatalogContent.Lessons
                    .Where(lesson => unitCodes.Contains(lesson.UnitCode))
                    .OrderBy(lesson => lesson.OrderNo)
                    .ToList();

                return new
                {
                    code = section.Code,
                    titleAr = section.TitleAr,
                    titleEn = section.TitleEn,
                    descriptionAr = section.DescriptionAr,
                    descriptionEn = section.DescriptionEn,
                    icon = section.Icon,
                    difficulty = section.Difficulty,
                    unitsCount = units.Count,
                    lessonsCount = lessons.Count,
                    estimatedMinutes = units.Sum(unit => unit.DurationMinutes),
                    locked = section.IsLocked
                };
            })
            .ToList();

        return Ok(new
        {
            generatedAt = DateTime.UtcNow,
            cacheVersion = $"{CatalogContent.Sections.Count}-{CatalogContent.Units.Count}-{CatalogContent.Lessons.Count}-{CatalogContent.Challenges.Count}",
            metrics = new
            {
                sectionsCount = CatalogContent.Sections.Count,
                unitsCount = CatalogContent.Units.Count,
                lessonsCount = CatalogContent.Lessons.Count,
                totalCourseHours = Math.Round(CatalogContent.Units.Sum(unit => unit.DurationMinutes) / 60d, 1),
                challengesCount = CatalogContent.Challenges.Count,
                certificatesCount = CatalogContent.Sections.Count
            },
            learningPaths
        });
    }
}
