using AutoMapper;
using MedMonitor.Core.Dto;
using MedMonitor.Core.Interfaces;
using MedMonitor.Infrastructure.Data;
using MedMonitor.Infrastructure.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using SystemTask = System.Threading.Tasks.Task;

namespace MedMonitor.Core.Business
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<NotificationService> _logger;
        private readonly IHubContext<Hubs.ChatHub> _hubContext;

        public NotificationService(
            AppDbContext context,
            IMapper mapper,
            ILogger<NotificationService> logger,
            IHubContext<Hubs.ChatHub> hubContext)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _hubContext = hubContext;
        }

        public async SystemTask CreateTaskNotificationAsync(int taskId, string nurseId, string taskName, string patientName, string startTime, string endTime, string note, string? alertLevel = null, string? unitName = null, string? patientId = null)
        {
            try
            {
                _logger.LogInformation("📬 Creating notification for task {TaskId} to nurse {NurseId}", taskId, nurseId);

                // NOTE: Duplicate/time-based deduplication removed — rely only on PatientAlertStates for dedup.

                var beforeCount = await _context.Notifications.CountAsync();
                _logger.LogInformation("[E2E:Backend][NotificationService] Notifications count before insert: {Count}", beforeCount);

                var resolvedPatientId = await ResolveNotificationPatientIdAsync(patientId);
                var notification = new Notification
                {
                    PatientId = resolvedPatientId,
                    NurseId = nurseId,
                    Title = taskName,
                    TaskName = taskName,
                    PatientName = patientName ?? "N/A",
                    StartTime = startTime,
                    EndTime = endTime,
                    Note = note ?? "",
                    AlertLevel = alertLevel,
                    UnitName = unitName,
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                };

                _logger.LogInformation("[E2E:Backend][NotificationService] Creating notification object for NurseId={NurseId}, TaskName={TaskName}, PatientName={PatientName}, AlertLevel={AlertLevel}", nurseId, taskName, patientName, alertLevel);

                try
                {
                    _context.Notifications.Add(notification);
                    await _context.SaveChangesAsync();

                    var afterCount = await _context.Notifications.CountAsync();
                    _logger.LogInformation("✅ Notification created with ID: {NotificationId}", notification.Id);
                        _logger.LogInformation("[NOTIFICATION CREATED] PatientId={PatientId}, PatientName={PatientName}, AlertLevel={AlertLevel}, UnitName={UnitName}, CreatedAt={CreatedAt}", notification.PatientId, notification.PatientName, notification.AlertLevel, notification.UnitName, notification.CreatedAt);
                    _logger.LogInformation("[E2E:Backend][NotificationService] Notification saved details: Id={NotificationId}, NurseId={NurseId}, PatientId={PatientId}, Title={Title}, PatientName={PatientName}, AlertLevel={AlertLevel}, CreatedAt={CreatedAt}", notification.Id, notification.NurseId, notification.PatientId, notification.Title, notification.PatientName, notification.AlertLevel, notification.CreatedAt);
                    _logger.LogInformation("[E2E:Backend][NotificationService] Notifications count after insert: {Count}", afterCount);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ [E2E:Backend][NotificationService] Exception while saving notification: {Message}", ex.Message);
                    _logger.LogError("StackTrace: {StackTrace}", ex.StackTrace);
                    throw;
                }

                // Send real-time via SignalR if nurse is connected
var nurseUser = await _context.Users.FindAsync(notification.NurseId);
                    var notificationDto = new NotificationDto
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
                };

                try
                {
                    var payloadJson = JsonSerializer.Serialize(notificationDto);
                    _logger.LogInformation("[E2E:Backend][NotificationService] Sending SignalR payload to User={NurseId} with NotificationId={NotificationId}. Payload={Payload}", nurseId, notification.Id, payloadJson);
                    // Primary delivery via built-in user mapping
                    await _hubContext.Clients
                        .User(nurseId)
                        .SendAsync("ReceiveTaskNotification", notificationDto);

                    // Backwards-compatible generic notification event
                    await _hubContext.Clients
                        .User(nurseId)
                        .SendAsync("ReceiveNotification", notificationDto);

                    // Fallback: also send to a per-user group in case IUserIdProvider mapping differs
                    var userGroup = $"user-{nurseId}";
                    await _hubContext.Clients
                        .Group(userGroup)
                        .SendAsync("ReceiveTaskNotification", notificationDto);

                    await _hubContext.Clients
                        .Group(userGroup)
                        .SendAsync("ReceiveNotification", notificationDto);

                    _logger.LogInformation("📤 [E2E:Backend][NotificationService] SignalR notifications sent to nurse {NurseId} with NotificationId={NotificationId} (including group fallback)", nurseId, notification.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ [E2E:Backend][NotificationService] Exception while sending SignalR notification: {Message}", ex.Message);
                    _logger.LogError("StackTrace: {StackTrace}", ex.StackTrace);
                    // do not rethrow - signal delivery failure shouldn't break notification persistence
                }
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ [E2E:Backend][NotificationService] Error creating notification for nurse {NurseId}: {Error}", nurseId, ex.Message);
                throw;
            }
        }

        private static string? NormalizePatientId(string? patientId)
        {
            return string.IsNullOrWhiteSpace(patientId) ? null : patientId.Trim();
        }

        private async Task<string?> ResolveNotificationPatientIdAsync(string? patientId)
        {
            var normalizedPatientId = NormalizePatientId(patientId);
            if (string.IsNullOrWhiteSpace(normalizedPatientId))
                return null;

            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Id == normalizedPatientId ||
                u.UserName == normalizedPatientId ||
                u.PhoneNumber == normalizedPatientId ||
                u.Email == normalizedPatientId);

            return user?.Id ?? normalizedPatientId;
        }

        public async Task<List<NotificationDto>> GetByNurseAsync(string nurseId)
        {
            try
            {
                var notifications = await _context.Notifications
                    .Where(n => n.NurseId == nurseId)
                    .OrderByDescending(n => n.CreatedAt)
                    .ToListAsync();

                var nurseIds = notifications.Select(n => n.NurseId).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().ToList();
                var nurseNames = await _context.Users
                    .Where(u => nurseIds.Contains(u.Id))
                    .ToDictionaryAsync(u => u.Id, u => u.UserName);

                return notifications.Select(n => new NotificationDto
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
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error getting notifications: {Error}", ex.Message);
                throw;
            }
        }

        public async SystemTask MarkAsReadAsync(int notificationId)
        {
            try
            {
                var notification = await _context.Notifications.FindAsync(notificationId);
                if (notification == null)
                    throw new ArgumentException($"Notification {notificationId} not found");

                notification.IsRead = true;
                _context.Notifications.Update(notification);
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Notification {NotificationId} marked as read", notificationId);
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error marking notification as read: {Error}", ex.Message);
                throw;
            }
        }
    }
}
