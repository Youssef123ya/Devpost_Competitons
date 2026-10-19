using System;
using System.Linq;
using Task = System.Threading.Tasks.Task;
using MedMonitor.Core.Dto;
using MedMonitor.Core.Interfaces;
using MedMonitor.Infrastructure.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedMonitor.Controllers
{
    /// <summary>
    /// AI Alert Prediction Controller
    /// Handles patient vital signs analysis and alert prediction
    /// </summary>
    public class AIAlertController : BaseController
    {
        private readonly IAIAlertService _aiAlertService;
        private readonly ILogger<AIAlertController> _logger;
        private readonly Core.Interfaces.INotificationService _notificationService;
        private readonly MedMonitor.Infrastructure.Data.AppDbContext _dbContext;

        public AIAlertController(IAIAlertService aiAlertService, ILogger<AIAlertController> logger, Core.Interfaces.INotificationService notificationService, MedMonitor.Infrastructure.Data.AppDbContext dbContext)
        {
            _aiAlertService = aiAlertService;
            _logger = logger;
            _notificationService = notificationService;
            _dbContext = dbContext;
        }

        /// <summary>
        /// Predicts alert level based on patient vital signs
        /// </summary>
        /// <param name="request">Patient vital signs (HeartRate, SpO2, Blood Pressure, Temperature)</param>
        /// <returns>Alert prediction with level, confidence percentage, and reason</returns>
        /// <response code="200">Prediction successful</response>
        /// <response code="400">Invalid vital signs data</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="500">Server error during prediction</response>
        [HttpPost("Predict")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> PredictAlertLevel([FromBody] AiPredictionRequestDto request, [FromQuery] string? patientId = null, [FromQuery] string? patientName = null)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid vital signs data received");
                    return BadRequest(new
                    {
                        message = "Invalid vital signs data",
                        errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                    });
                }

                _logger.LogInformation($"Processing AI alert prediction for user: {CurrentUserId}");
                _logger.LogInformation("[E2E:Backend][AIAlertController] Request metadata => patientIdQuery={PatientIdQuery}, patientIdBody={PatientIdBody}, patientNameQuery={PatientNameQuery}, patientNameBody={PatientNameBody}", patientId, request.PatientId, patientName, request.PatientName);

                if (string.IsNullOrWhiteSpace(patientId) && !string.IsNullOrWhiteSpace(request.PatientId))
                {
                    patientId = request.PatientId;
                }

                if (string.IsNullOrWhiteSpace(patientName) && !string.IsNullOrWhiteSpace(request.PatientName))
                {
                    patientName = request.PatientName;
                }

                var prediction = await _aiAlertService.PredictAlertLevelAsync(request);

                string NormalizePatientStateKey(string? id, string? name)
                {
                    if (!string.IsNullOrWhiteSpace(id))
                        return id.Trim();

                    var normalizedName = string.IsNullOrWhiteSpace(name) ? string.Empty : name.Trim().ToLowerInvariant();
                    return string.IsNullOrWhiteSpace(normalizedName) ? "unknown:unknown" : $"unknown:{normalizedName}";
                }

                // If the model returned a warning or critical alert, create and dispatch notifications
                try
                {
                    var level = prediction.AlertLevel?.ToLowerInvariant();
                    var resolvedPatientId = NormalizePatientId(string.IsNullOrWhiteSpace(patientId) ? request.PatientId : patientId);
                    var resolvedPatientName = string.IsNullOrWhiteSpace(patientName) ? request.PatientName : patientName;
                    var patientUser = await FindPatientUserAsync(resolvedPatientId);
                    var notificationPatientId = patientUser?.Id ?? resolvedPatientId;
                    var patientStateKey = NormalizePatientStateKey(notificationPatientId, resolvedPatientName);
                    var isNormalAlert = string.IsNullOrWhiteSpace(level) || string.Equals(level, "normal", StringComparison.OrdinalIgnoreCase);

                    _logger.LogInformation(
                        "AI ALERT => patientId={PatientId}, patientName={PatientName}, resolvedPatientId={ResolvedPatientId}, notificationPatientId={NotificationPatientId}, patientUserFound={PatientUserFound}, alertLevel={AlertLevel}",
                        patientId,
                        patientName,
                        resolvedPatientId,
                        notificationPatientId,
                        patientUser != null,
                        level
                    );
                    _logger.LogInformation("[E2E:Backend][AIAlertController] Resolved metadata => patientStateKey={PatientStateKey}, resolvedPatientName={ResolvedPatientName}, notificationPatientId={NotificationPatientId}", patientStateKey, resolvedPatientName, notificationPatientId);

                    if (isNormalAlert)
                    {
                        var existingState = await _dbContext.PatientAlertStates.FirstOrDefaultAsync(a => a.PatientId == patientStateKey);
                        if (existingState != null)
                        {
                            existingState.IsAlertActive = false;
                            existingState.LastAlertLevel = "normal";
                            existingState.LastAlertSentAt = DateTime.UtcNow;
                            _dbContext.PatientAlertStates.Update(existingState);
                            await _dbContext.SaveChangesAsync();
                            _logger.LogInformation("AI alert state reset to normal for patient state {PatientStateKey}", patientStateKey);
                        }
                        // when returning to normal we do not send notifications
                    }
                    else
                    {
                        var existingState = await _dbContext.PatientAlertStates.FirstOrDefaultAsync(a => a.PatientId == patientStateKey);
                        var nowUtc = DateTime.UtcNow;
                        TimeSpan? timeSince = null;
                        if (existingState?.LastAlertSentAt != null)
                            timeSince = nowUtc - existingState.LastAlertSentAt.Value;

                        // Log AI ALERT info
                        _logger.LogInformation("[AI ALERT] PatientId={PatientId}, PatientName={PatientName}, AlertLevel={AlertLevel}, LastAlertSentAt={LastAlertSentAt}, TimeSinceLastAlert={TimeSince}", patientId, resolvedPatientName, prediction.AlertLevel, existingState?.LastAlertSentAt, timeSince?.TotalSeconds);

                        var shouldNotify = false;

                        if (existingState == null)
                        {
                            shouldNotify = true;
                            existingState = new Infrastructure.Models.PatientAlertState
                            {
                                PatientId = patientStateKey,
                                IsAlertActive = true,
                                LastAlertLevel = level,
                                LastAlertSentAt = nowUtc
                            };
                            _dbContext.PatientAlertStates.Add(existingState);
                            await _dbContext.SaveChangesAsync();
                        }
                        else if (!string.Equals(existingState.LastAlertLevel, level, StringComparison.OrdinalIgnoreCase))
                        {
                            shouldNotify = true;
                            existingState.IsAlertActive = true;
                            existingState.LastAlertLevel = level;
                            existingState.LastAlertSentAt = nowUtc;
                            _dbContext.PatientAlertStates.Update(existingState);
                            await _dbContext.SaveChangesAsync();
                        }
                        else if (!existingState.LastAlertSentAt.HasValue || (nowUtc - existingState.LastAlertSentAt.Value) >= TimeSpan.FromMinutes(1))
                        {
                            shouldNotify = true;
                            existingState.IsAlertActive = true;
                            existingState.LastAlertLevel = level;
                            existingState.LastAlertSentAt = nowUtc;
                            _dbContext.PatientAlertStates.Update(existingState);
                            await _dbContext.SaveChangesAsync();
                        }

                        if (shouldNotify)
                        {
                            _logger.LogInformation("[E2E:Backend][AIAlertController] Decision before notify: patientStateKey={PatientStateKey}, patientName={PatientName}, prediction.AlertLevel={AlertLevel}, shouldNotify={ShouldNotify}, existingStateNull={ExistingNull}", patientStateKey, resolvedPatientName, prediction.AlertLevel, shouldNotify, existingState == null);
                            _logger.LogInformation("[E2E:Backend][AIAlertController] existingState: IsAlertActive={IsAlertActive}, LastAlertLevel={LastAlertLevel}", existingState?.IsAlertActive, existingState?.LastAlertLevel);
                            if (existingState != null)
                            {
                                _logger.LogInformation("[E2E:Backend][AIAlertController] existingState: IsAlertActive={IsAlertActive}, LastAlertLevel={LastAlertLevel}", existingState.IsAlertActive, existingState.LastAlertLevel);
                            }

                            var effectivePatientName = resolvedPatientName;
                            var nurseUserId = string.Empty;
                            string? unitName = null;
                            MedMonitor.Infrastructure.Models.AdmissionRequest? admission = null;

                            if (!string.IsNullOrWhiteSpace(resolvedPatientId))
                            {
                                admission = await _dbContext.AdmissionRequests.FirstOrDefaultAsync(a => a.PatientId == resolvedPatientId);
                                _logger.LogInformation("AI ALERT => admission lookup for ResolvedPatientId={ResolvedPatientId}: AdmissionFound={AdmissionFound}", resolvedPatientId, admission != null);

                                if (admission == null && !string.IsNullOrWhiteSpace(resolvedPatientName))
                                {
                                    admission = await _dbContext.AdmissionRequests.FirstOrDefaultAsync(a => a.PatientName == resolvedPatientName);
                                    _logger.LogInformation("AI ALERT => admission lookup by name for ResolvedPatientName={ResolvedPatientName}: AdmissionFound={AdmissionFound}", resolvedPatientName, admission != null);
                                }

                                if (admission != null)
                                {
                                    _logger.LogInformation("AI ALERT => admission.NurseName={NurseName}", admission.NurseName);
                                    effectivePatientName = string.IsNullOrWhiteSpace(effectivePatientName) ? admission.PatientName : effectivePatientName;
                                    if (!string.IsNullOrWhiteSpace(admission.NurseName))
                                    {
                                        var nurseUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserName == admission.NurseName);
                                        _logger.LogInformation("AI ALERT => nurseUser lookup for NurseName={NurseName}: NurseUserFound={NurseUserFound}", admission.NurseName, nurseUser != null);
                                        if (nurseUser != null)
                                            nurseUserId = nurseUser.Id;
                                    }
                                }

                                var assignedBed = await _dbContext.Beds.FirstOrDefaultAsync(b => b.PatientId == resolvedPatientId);
                                _logger.LogInformation("AI ALERT => bed lookup for ResolvedPatientId={ResolvedPatientId}: BedFound={BedFound}", resolvedPatientId, assignedBed != null);
                                if (assignedBed == null && !string.IsNullOrWhiteSpace(resolvedPatientName))
                                {
                                    assignedBed = await _dbContext.Beds.FirstOrDefaultAsync(b => b.PatientName == resolvedPatientName);
                                    _logger.LogInformation("AI ALERT => bed lookup by name for ResolvedPatientName={ResolvedPatientName}: BedFound={BedFound}", resolvedPatientName, assignedBed != null);
                                }

                                if (assignedBed != null)
                                {
                                    unitName = assignedBed.BedNumber;
                                    if (string.IsNullOrWhiteSpace(effectivePatientName))
                                    {
                                        effectivePatientName = assignedBed.PatientName;
                                        _logger.LogInformation("AI ALERT => Patient name found from Beds table: PatientName={PatientName}, BedNumber={BedNumber}", assignedBed.PatientName, assignedBed.BedNumber);
                                    }

                                    if (admission != null && !string.Equals(admission.BedNumber, assignedBed.BedNumber, StringComparison.OrdinalIgnoreCase))
                                    {
                                        admission.BedNumber = assignedBed.BedNumber;
                                        _dbContext.AdmissionRequests.Update(admission);
                                        await _dbContext.SaveChangesAsync();
                                        _logger.LogInformation("AI ALERT => synchronized AdmissionRequest.BedNumber to Bed.BedNumber: {BedNumber}", assignedBed.BedNumber);
                                    }
                                }
                                else if (admission != null)
                                {
                                    unitName = admission.BedNumber;
                                }

                                if (string.IsNullOrWhiteSpace(unitName))
                                {
                                    var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == resolvedPatientId || u.UserName == resolvedPatientId || u.PhoneNumber == resolvedPatientId || u.Email == resolvedPatientId);
                                    _logger.LogInformation("AI ALERT => user lookup for ResolvedPatientId={ResolvedPatientId}: UserFound={UserFound}", resolvedPatientId, user != null);
                                    if (user != null && !string.IsNullOrWhiteSpace(user.FullName))
                                    {
                                        effectivePatientName = user.FullName;
                                        _logger.LogInformation("AI ALERT => Patient name found from AspNetUsers table: FullName={FullName}", user.FullName);
                                    }
                                }
                            }

                            if (string.IsNullOrWhiteSpace(effectivePatientName))
                                effectivePatientName = "Unknown Patient";

                            var title = $"AI Alert - {prediction.AlertLevel}";
                            var note = prediction.Reason ?? string.Empty;
                            var startTime = DateTime.UtcNow.ToString("o");

                            // Temporary debug log: core patient/alert metadata before creating notifications
                            _logger.LogInformation("[E2E:Backend][AIAlertController] DEBUG BEFORE CREATE => originalPatientId={OriginalPatientId}, resolvedPatientId={ResolvedPatientId}, notificationPatientId={NotificationPatientId}, effectivePatientName={EffectivePatientName}, unitName={UnitName}, nurseUserId={NurseUserId}, alertLevel={AlertLevel}", patientId, resolvedPatientId, notificationPatientId, effectivePatientName, unitName, nurseUserId, prediction.AlertLevel);

                            _logger.LogInformation("AI ALERT => NurseName={NurseName}", admission?.NurseName);
                            _logger.LogInformation("AI ALERT => NurseId={NurseId}", nurseUserId);

                            if (!string.IsNullOrWhiteSpace(nurseUserId))
                            {
                                _logger.LogInformation("[E2E:Backend][AIAlertController] About to create notification for nurse: nurseUserId={NurseUserId}, title={Title}, note={Note}, resolvedPatientName={ResolvedPatientName}, alertLevel={AlertLevel}, notificationPatientId={NotificationPatientId}", nurseUserId, title, note, effectivePatientName, prediction.AlertLevel, notificationPatientId);
                                try
                                {
                                    await _notificationService.CreateTaskNotificationAsync(0, nurseUserId, title, effectivePatientName, startTime, string.Empty, note, prediction.AlertLevel, unitName, notificationPatientId);
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogError(ex, "❌ [E2E:Backend][AIAlertController] Exception when creating nurse notification: {Message}", ex.Message);
                                    _logger.LogError("StackTrace: {StackTrace}", ex.StackTrace);
                                }
                                _logger.LogInformation("AI alert notification created for nurse {NurseId}", nurseUserId);
                            }

                            var doctorIds = _dbContext.Users.Where(u => u.Role == MedMonitor.Shared.Enum.UserRoleEnum.Doctor).Select(u => u.Id).ToList();
                            _logger.LogInformation("[E2E:Backend][AIAlertController] Doctors to notify count: {DoctorCount}", doctorIds.Count);
                            foreach (var docId in doctorIds)
                            {
                                _logger.LogInformation("[E2E:Backend][AIAlertController] About to create notification for doctor: doctorId={DoctorId}, title={Title}, note={Note}, notificationPatientId={NotificationPatientId}", docId, title, note, notificationPatientId);
                                try
                                {
                                    await _notification_service_CreateSafely(docId, title, effectivePatientName, startTime, note, prediction.AlertLevel, unitName, notificationPatientId);
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogError(ex, "❌ [E2E:Backend][AIAlertController] Exception when creating doctor notification for {DoctorId}: {Message}", docId, ex.Message);
                                    _logger.LogError("StackTrace: {StackTrace}", ex.StackTrace);
                                }
                            }
                            _logger.LogInformation("AI alert notifications created for {Count} doctors", doctorIds.Count);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError("Error while creating/dispatching AI alert notifications: {Message}", ex.Message);
                }

                return Ok(new
                {
                    success = true,
                    data = prediction
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error during prediction: {ex.Message}");
                return StatusCode(500, new
                {
                    message = "An error occurred during prediction",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get service health status
        /// </summary>
        /// <returns>Service status information</returns>
        [HttpGet("Health")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public IActionResult GetHealth()
        {
            return Ok(new
            {
                status = "healthy",
                service = "AI Alert Prediction Service",
                version = "1.0.0",
                timestamp = DateTime.UtcNow
            });
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

            var user = await _dbContext.Users.FirstOrDefaultAsync(u =>
                u.Id == normalizedPatientId ||
                u.UserName == normalizedPatientId ||
                u.PhoneNumber == normalizedPatientId ||
                u.Email == normalizedPatientId);

            return user?.Id ?? normalizedPatientId;
        }

        private async Task<Infrastructure.Models.User?> FindPatientUserAsync(string? patientId)
        {
            var normalizedPatientId = NormalizePatientId(patientId);
            if (string.IsNullOrWhiteSpace(normalizedPatientId))
                return null;

            return await _dbContext.Users.FirstOrDefaultAsync(u =>
                u.Id == normalizedPatientId ||
                u.UserName == normalizedPatientId ||
                u.PhoneNumber == normalizedPatientId ||
                u.Email == normalizedPatientId);
        }

        private async Task _notification_service_CreateSafely(string userId, string title, string patientName, string startTime, string note, string? alertLevel, string? unitName, string? patientId = null)
        {
            try
            {
                await _notificationService.CreateTaskNotificationAsync(0, userId, title, patientName, startTime, string.Empty, note, alertLevel, unitName, patientId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [E2E:Backend][AIAlertController] _notification_service_CreateSafely failed for user {UserId}: {Message}", userId, ex.Message);
                _logger.LogError("StackTrace: {StackTrace}", ex.StackTrace);
                throw;
            }
        }
    }
}
