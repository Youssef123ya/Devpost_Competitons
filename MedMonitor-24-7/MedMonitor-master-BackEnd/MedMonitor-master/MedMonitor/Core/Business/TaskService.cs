using AutoMapper;
using MedMonitor.Core.Dto;
using MedMonitor.Core.Interfaces;
using MedMonitor.Infrastructure.Repositories.Interface;
using MedMonitor.Shared.Dtos;
using MedMonitor.Shared.Enum;
using Microsoft.Extensions.Logging;

namespace MedMonitor.Core.Business
{
    public class TaskService : ITaskService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ILogger<TaskService> _logger;
        private readonly INotificationService _notificationService;

        public TaskService(IUnitOfWork unitOfWork, IMapper mapper, ILogger<TaskService> logger, INotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _logger = logger;
            _notificationService = notificationService;
        }

        public async Task<List<TaskDto>> GetAll()
        {
            var data = await _unitOfWork.Task.ListAsync(new ListCriteriaDto<Infrastructure.Models.Task>());
            return _mapper.Map<List<TaskDto>>(data);
        }

        public async Task<TaskDto> GetById(int id)
        {
            var data = await _unitOfWork.Task.FindAsync(x => x.Id == id);
            return _mapper.Map<TaskDto>(data);
        }

        public async Task<TaskDto> Create(TaskDto dto)
        {
            try
            {
                _logger.LogInformation("📤 TaskService.Create() called");
                _logger.LogInformation("  - Title: {Title}", dto.Title);
                _logger.LogInformation("  - DoctorId: {DoctorId}", dto.DoctorId);
                _logger.LogInformation("  - NurseId: {NurseId}", dto.NurseId);
                _logger.LogInformation("  - PatientId: {PatientId}", dto.PatientId);
                _logger.LogInformation("  - StartTime: {StartTime}", dto.StartTime);
                _logger.LogInformation("  - EndTime: {EndTime}", dto.EndTime);

                // Validate required fields
                if (string.IsNullOrWhiteSpace(dto.Title))
                    throw new ArgumentException("Title is required");
                if (string.IsNullOrWhiteSpace(dto.DoctorId))
                    throw new ArgumentException("DoctorId is required");
                if (string.IsNullOrWhiteSpace(dto.NurseId))
                    throw new ArgumentException("NurseId is required");
                // PatientId is optional. If provided, resolve to the actual AspNetUsers.Id.
                string? resolvedPatientId = null;
                if (!string.IsNullOrWhiteSpace(dto.PatientId))
                {
                    resolvedPatientId = await ResolvePatientUserIdAsync(dto.PatientId);
                    if (string.IsNullOrWhiteSpace(resolvedPatientId))
                        throw new ArgumentException($"Patient with identifier '{dto.PatientId}' not found");
                }

                if (dto.StartTime == default)
                    throw new ArgumentException("StartTime is required");
                if (dto.EndTime == default)
                    throw new ArgumentException("EndTime is required");

                var entity = _mapper.Map<Infrastructure.Models.Task>(dto);
                // Ensure entity PatientId is null when not provided or when no matching user exists.
                entity.PatientId = string.IsNullOrWhiteSpace(resolvedPatientId) ? null : resolvedPatientId;
                entity.PatientName = dto.PatientName;
                entity.NurseName = dto.NurseName;
                entity.Remind = dto.Remind;
                entity.Repeat = dto.Repeat;
                _unitOfWork.Task.Add(entity);
                await _unitOfWork.SaveAsync();
                
                _logger.LogInformation("✅ Task created successfully with ID: {TaskId}", entity.Id);

                // 🔔 Create notification for nurse
                try
                {
                    await _notificationService.CreateTaskNotificationAsync(
                        entity.Id,
                        dto.NurseId,
                        dto.Title,
                        dto.PatientName ?? "N/A",
                        dto.StartTime.ToString("yyyy-MM-dd HH:mm"),
                        dto.EndTime.ToString("yyyy-MM-dd HH:mm"),
                        dto.Notes ?? "",
                        null,
                        null,
                        resolvedPatientId
                    );
                    _logger.LogInformation("[NOTIFICATION CREATED] TaskService created notification for TaskId={TaskId}, PatientId={PatientId}, NurseId={NurseId}", entity.Id, resolvedPatientId ?? dto.PatientId, dto.NurseId);
                    _logger.LogInformation("✅ Notification sent to nurse {NurseId}", dto.NurseId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("⚠️ Failed to send notification: {Error}", ex.Message);
                    // Don't throw - notification failure shouldn't block task creation
                }

                return _mapper.Map<TaskDto>(entity);
            }
            catch (ArgumentException ex)
            {
                _logger.LogError("❌ Validation error: {Error}", ex.Message);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error creating task: {Error}", ex.Message);
                throw;
            }
        }

        public async Task<TaskDto> Update(TaskDto dto)
        {
            var entity = await _unitOfWork.Task.FindAsync(x => x.Id == dto.Id);

            entity.Title = dto.Title;
            entity.Notes = dto.Notes;
            entity.StartTime = dto.StartTime;
            entity.EndTime = dto.EndTime;
            entity.DoctorId = dto.DoctorId;
            entity.NurseId = dto.NurseId;
            var resolvedPatientId = await ResolvePatientUserIdAsync(dto.PatientId);
            entity.PatientId = string.IsNullOrWhiteSpace(resolvedPatientId) ? null : resolvedPatientId;
            entity.PatientName = dto.PatientName;
            entity.NurseName = dto.NurseName;
            entity.Remind = dto.Remind;
            entity.Repeat = dto.Repeat;

            _unitOfWork.Task.Update(entity);
            await _unitOfWork.SaveAsync();

            return _mapper.Map<TaskDto>(entity);
        }

        public async Task<bool> Delete(int id)
        {
            var entity = await _unitOfWork.Task.FindAsync(x => x.Id == id);
            _unitOfWork.Task.Remove(entity);
            await _unitOfWork.SaveAsync();
            return true;
        }

        public async Task<bool> ChangeStatus(int id, TaskStatusEnum status)
        {
            var entity = await _unitOfWork.Task.FindAsync(x => x.Id == id);
            entity.Status = status;
            await _unitOfWork.SaveAsync();
            return true;
        }

        private string? NormalizePatientId(string? patientId)
        {
            return string.IsNullOrWhiteSpace(patientId) ? null : patientId.Trim();
        }

        private async Task<string?> ResolvePatientUserIdAsync(string? patientId)
        {
            var normalizedPatientId = NormalizePatientId(patientId);
            if (string.IsNullOrWhiteSpace(normalizedPatientId))
                return null;

            var user = await _unitOfWork.User.FindAsync(u =>
                u.Id == normalizedPatientId ||
                u.UserName == normalizedPatientId ||
                u.PhoneNumber == normalizedPatientId ||
                u.Email == normalizedPatientId);

            return user?.Id;
        }
    }
}
