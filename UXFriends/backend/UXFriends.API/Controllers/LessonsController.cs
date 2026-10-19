using System.ComponentModel.DataAnnotations;
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
public class LessonsController : ControllerBase
{
    private readonly UXFriendsDbContext _context;

    public LessonsController(UXFriendsDbContext context)
    {
        _context = context;
    }

    [HttpGet("{code}")]
    public async Task<IActionResult> GetLesson(string code)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var lesson = CatalogContent.FindLesson(code);
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
        if (!LearningAccessPolicy.IsLessonAccessible(lesson, accessSnapshot))
        {
            return Forbid();
        }

        var progress = await _context.LessonProgress
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.UserId == userId && item.LessonCode == code);

        var unit = CatalogContent.FindUnit(lesson.UnitCode);
        var section = unit is null ? null : CatalogContent.FindSection(unit.SectionCode);
        var unitLessons = CatalogContent.Lessons
            .Where(item => item.UnitCode == lesson.UnitCode)
            .OrderBy(item => item.OrderNo)
            .ToList();
        var lessonIndex = unitLessons.FindIndex(item => item.Code == lesson.Code);
        var quiz = LearningExperienceCatalog.BuildLessonQuiz(lesson.Code);
        var contentBlocks = LearningExperienceCatalog.GetLessonBlocks(lesson)
            .Select(block => new
            {
                id = block.Id,
                type = block.Type,
                titleAr = block.TitleAr,
                titleEn = block.TitleEn,
                bodyAr = block.BodyAr,
                bodyEn = block.BodyEn,
                itemsAr = block.ItemsAr,
                itemsEn = block.ItemsEn,
                accentAr = block.AccentAr,
                accentEn = block.AccentEn,
                visualKey = block.VisualKey,
                captionAr = block.CaptionAr,
                captionEn = block.CaptionEn
            });

        return Ok(new
        {
            code = lesson.Code,
            unitCode = lesson.UnitCode,
            unitTitleAr = unit?.TitleAr ?? lesson.UnitCode,
            unitTitleEn = unit?.TitleEn ?? lesson.UnitCode,
            sectionCode = unit?.SectionCode,
            sectionTitleAr = section?.TitleAr,
            sectionTitleEn = section?.TitleEn,
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
            completed = progress?.CompletedAt is not null || progress?.Status == "Completed",
            previousLessonCode = lessonIndex > 0 ? unitLessons[lessonIndex - 1].Code : null,
            nextLessonCode = lessonIndex >= 0 && lessonIndex < unitLessons.Count - 1
                ? unitLessons[lessonIndex + 1].Code
                : null,
            contentBlocks,
            quiz = quiz is null
                ? null
                : new
                {
                    questionCount = quiz.Questions.Count,
                    xpReward = quiz.XpReward
                }
        });
    }

    [HttpGet("{code}/note")]
    public async Task<IActionResult> GetLessonNote(string code)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var lesson = CatalogContent.FindLesson(code);
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
        if (!LearningAccessPolicy.IsLessonAccessible(lesson, accessSnapshot))
        {
            return Forbid();
        }

        var note = await _context.UserNotes
            .AsNoTracking()
            .Where(item => item.UserId == userId && item.LessonCode == code)
            .OrderByDescending(item => item.UpdatedAt)
            .FirstOrDefaultAsync();

        return Ok(new
        {
            lessonCode = code,
            content = note?.Content ?? string.Empty,
            hasNote = !string.IsNullOrWhiteSpace(note?.Content),
            createdAt = note?.CreatedAt,
            updatedAt = note?.UpdatedAt
        });
    }

    [HttpPut("{code}/note")]
    public async Task<IActionResult> SaveLessonNote(string code, [FromBody] LessonNoteDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var lesson = CatalogContent.FindLesson(code);
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
        if (!LearningAccessPolicy.IsLessonAccessible(lesson, accessSnapshot))
        {
            return Forbid();
        }

        var nowUtc = DateTime.UtcNow;
        var normalizedContent = (request.Content ?? string.Empty).Trim();
        var notes = await _context.UserNotes
            .Where(item => item.UserId == userId && item.LessonCode == code)
            .OrderByDescending(item => item.UpdatedAt)
            .ToListAsync();

        var note = notes.FirstOrDefault();
        if (notes.Count > 1)
        {
            _context.UserNotes.RemoveRange(notes.Skip(1));
        }

        if (string.IsNullOrWhiteSpace(normalizedContent))
        {
            if (note is not null)
            {
                _context.UserNotes.Remove(note);
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                lessonCode = code,
                content = string.Empty,
                hasNote = false,
                createdAt = (DateTime?)null,
                updatedAt = (DateTime?)null
            });
        }

        if (note is null)
        {
            note = new UserNote
            {
                NoteCode = Guid.NewGuid().ToString("N"),
                UserId = userId,
                LessonCode = code,
                CreatedAt = nowUtc
            };
            _context.UserNotes.Add(note);
        }

        note.Content = normalizedContent;
        note.UpdatedAt = nowUtc;

        await _context.SaveChangesAsync();
        var badgesAwarded = await BadgeSyncEngine.SyncAsync(_context, user, nowUtc);
        if (badgesAwarded > 0)
        {
            await _context.SaveChangesAsync();
        }

        return Ok(new
        {
            lessonCode = code,
            content = note.Content,
            hasNote = true,
            createdAt = note.CreatedAt,
            updatedAt = note.UpdatedAt,
            badgesAwarded
        });
    }

    [HttpPost("{code}/complete")]
    public async Task<IActionResult> CompleteLesson(string code)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var lesson = CatalogContent.FindLesson(code);
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
        if (!LearningAccessPolicy.IsLessonAccessible(lesson, accessSnapshot))
        {
            return Forbid();
        }

        var progress = await _context.LessonProgress
            .FirstOrDefaultAsync(item => item.UserId == userId && item.LessonCode == code);

        var wasAlreadyCompleted = progress?.CompletedAt is not null || progress?.Status == "Completed";

        if (progress is null)
        {
            progress = new LessonProgress
            {
                UserId = userId,
                LessonCode = code
            };
            _context.LessonProgress.Add(progress);
        }

        progress.ProgressPercent = 100;
        progress.Status = "Completed";
        progress.CompletedAt = progress.CompletedAt ?? DateTime.UtcNow;
        progress.UpdatedAt = DateTime.UtcNow;

        if (!wasAlreadyCompleted)
        {
            user.LessonsCompleted += 1;
            user.LastLoginAt = DateTime.UtcNow;
            GamificationHelper.ApplyXp(user, lesson.XpReward);

            _context.XPLogs.Add(new XPLog
            {
                LogCode = Guid.NewGuid().ToString("N"),
                UserId = userId,
                XP = lesson.XpReward,
                ActivityType = "LessonCompleted",
                ReferenceId = lesson.Code
            });

            await AwardBadgeIfMissingAsync(userId, "first-lesson");
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            xpAwarded = wasAlreadyCompleted ? 0 : lesson.XpReward,
            lessonsCompleted = user.LessonsCompleted,
            level = user.Level,
            totalXP = user.TotalXP,
            currentXP = user.CurrentXP,
            nextLevelXP = user.NextLevelXP
        });
    }

    private async Task AwardBadgeIfMissingAsync(string userId, string badgeCode)
    {
        var exists = await _context.UserBadges.AnyAsync(item =>
            item.UserId == userId && item.BadgeCode == badgeCode);
        if (exists)
        {
            return;
        }

        _context.UserBadges.Add(new UserBadge
        {
            UserBadgeCode = Guid.NewGuid().ToString("N"),
            UserId = userId,
            BadgeCode = badgeCode,
            IsUnlocked = true,
            EarnedAt = DateTime.UtcNow
        });
    }

    public sealed class LessonNoteDto
    {
        [MaxLength(6000)]
        public string? Content { get; set; }
    }
}
