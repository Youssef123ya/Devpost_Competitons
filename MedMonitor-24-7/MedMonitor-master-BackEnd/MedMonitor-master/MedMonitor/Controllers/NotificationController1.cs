using MedMonitor.Core.Dto;
using MedMonitor.Infrastructure.Data;
using MedMonitor.Infrastructure.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MedMonitor.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<NotificationController> _logger;

        public NotificationController(AppDbContext context, ILogger<NotificationController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("GetByNurse")]
        public async Task<IActionResult> GetByNurse(string nurseId)
        {
            try
            {
                _logger.LogInformation("📬 GetByNurse called for nurseId: {NurseId}", nurseId);

                var notifications = await _context.Notifications
                    .Where(n => n.NurseId == nurseId)
                    .OrderByDescending(n => n.CreatedAt)
                    .ToListAsync();

                var nurseIds = notifications.Select(n => n.NurseId).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().ToList();
                var nurseNames = await _context.Users
                    .Where(u => nurseIds.Contains(u.Id))
                    .ToDictionaryAsync(u => u.Id, u => u.UserName);

                var dtos = notifications.Select(n => new NotificationDto
                {
                    Id = n.Id,
                    PatientId = n.PatientId,
                    NurseId = n.NurseId,
                    NurseName = nurseNames.TryGetValue(n.NurseId, out var nurseName) ? nurseName : null,
                    Title = n.Title,
                    TaskName = n.TaskName,
                    PatientName = n.PatientName,
                    StartTime = n.StartTime,
                    EndTime = n.EndTime,
                    Note = n.Note,
                    AlertLevel = n.AlertLevel,
                    UnitName = n.UnitName,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt
                }).ToList();

                _logger.LogInformation("✅ Returning {Count} notifications", dtos.Count);
                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error in GetByNurse: {Error}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("MarkAsRead/{id}")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            try
            {
                _logger.LogInformation("📝 MarkAsRead called for notificationId: {Id}", id);

                var notification = await _context.Notifications.FindAsync(id);
                if (notification == null)
                {
                    return NotFound(new { message = "Notification not found" });
                }

                notification.IsRead = true;
                _context.Notifications.Update(notification);
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Notification {Id} marked as read", id);

                var nurseUser = await _context.Users.FindAsync(notification.NurseId);
                return Ok(new NotificationDto
                {
                    Id = notification.Id,
                    PatientId = notification.PatientId,
                    NurseId = notification.NurseId,
                    NurseName = nurseUser?.UserName,
                    Title = notification.Title,
                    TaskName = notification.TaskName,
                    PatientName = notification.PatientName,
                    StartTime = notification.StartTime,
                    EndTime = notification.EndTime,
                    Note = notification.Note,
                    AlertLevel = notification.AlertLevel,
                    UnitName = notification.UnitName,
                    IsRead = notification.IsRead,
                    CreatedAt = notification.CreatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error marking notification as read: {Error}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
