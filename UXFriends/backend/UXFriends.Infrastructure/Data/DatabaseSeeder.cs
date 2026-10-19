using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UXFriends.Domain.Entities;

namespace UXFriends.Infrastructure.Data;

public class DatabaseSeeder
{
    private readonly UXFriendsDbContext _dbContext;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(UXFriendsDbContext dbContext, ILogger<DatabaseSeeder> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        await SeedSectionsAsync();
        await SeedUnitsAsync();
        await SeedLessonsAsync();
        await SeedChallengesAsync();
        await SeedBadgesAsync();
        await SeedProjectsAsync();
    }

    private async Task SeedSectionsAsync()
    {
        foreach (var item in CatalogContent.Sections)
        {
            if (await _dbContext.Sections.AnyAsync(section => section.SectionCode == item.Code))
            {
                continue;
            }

            _dbContext.Sections.Add(new Section
            {
                SectionCode = item.Code,
                Title = item.TitleEn,
                Description = item.DescriptionEn,
                OrderNo = item.OrderNo
            });
        }

        await _dbContext.SaveChangesAsync();
    }

    private async Task SeedUnitsAsync()
    {
        foreach (var item in CatalogContent.Units)
        {
            if (await _dbContext.Units.AnyAsync(unit => unit.UnitCode == item.Code))
            {
                continue;
            }

            _dbContext.Units.Add(new Unit
            {
                UnitCode = item.Code,
                SectionCode = item.SectionCode,
                Title = item.TitleEn,
                Description = item.DescriptionEn,
                Duration = item.DurationMinutes,
                OrderNo = item.OrderNo
            });
        }

        await _dbContext.SaveChangesAsync();
    }

    private async Task SeedLessonsAsync()
    {
        foreach (var item in CatalogContent.Lessons)
        {
            if (await _dbContext.Lessons.AnyAsync(lesson => lesson.LessonCode == item.Code))
            {
                continue;
            }

            _dbContext.Lessons.Add(new Lesson
            {
                LessonCode = item.Code,
                UnitCode = item.UnitCode,
                Title = item.TitleEn,
                Description = item.DescriptionEn,
                Content = item.ContentEn,
                OrderNo = item.OrderNo
            });
        }

        await _dbContext.SaveChangesAsync();
    }

    private async Task SeedChallengesAsync()
    {
        foreach (var item in CatalogContent.Challenges)
        {
            if (await _dbContext.Challenges.AnyAsync(challenge => challenge.ChallengeCode == item.Code))
            {
                continue;
            }

            _dbContext.Challenges.Add(new Challenge
            {
                ChallengeCode = item.Code,
                Title = item.TitleEn,
                Description = item.DescriptionEn,
                Difficulty = item.Difficulty,
                XpReward = item.XpReward,
                IsCompleted = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _dbContext.SaveChangesAsync();
    }

    private async Task SeedBadgesAsync()
    {
        foreach (var item in CatalogContent.Badges)
        {
            var existingBadge = await _dbContext.Badges
                .FirstOrDefaultAsync(badge => badge.BadgeCode == item.Code);

            if (existingBadge is not null)
            {
                existingBadge.BadgeName = item.NameEn;
                existingBadge.Description = item.DescriptionEn;
                existingBadge.BadgeIcon = item.Icon;
                continue;
            }

            _dbContext.Badges.Add(new Badge
            {
                BadgeCode = item.Code,
                BadgeName = item.NameEn,
                Description = item.DescriptionEn,
                BadgeIcon = item.Icon
            });
        }

        await _dbContext.SaveChangesAsync();
    }

    private async Task SeedProjectsAsync()
    {
        foreach (var section in CourseBlueprintCatalog.Sections)
        {
            var project = section.Project;
            var existingProject = await _dbContext.Projects
                .FirstOrDefaultAsync(item => item.ProjectCode == project.Code);

            if (existingProject is null)
            {
                _dbContext.Projects.Add(new Project
                {
                    ProjectCode = project.Code,
                    SectionCode = section.Code,
                    Title = project.TitleEn,
                    Description = project.DescriptionEn,
                    Requirements = project.RequirementsEn
                });
                continue;
            }

            existingProject.SectionCode = section.Code;
            existingProject.Title = project.TitleEn;
            existingProject.Description = project.DescriptionEn;
            existingProject.Requirements = project.RequirementsEn;
        }

        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("Seeded project catalog.");
    }
}
