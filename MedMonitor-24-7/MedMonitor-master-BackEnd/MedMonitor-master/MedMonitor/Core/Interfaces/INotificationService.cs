using MedMonitor.Core.Dto;
using SystemTask = System.Threading.Tasks.Task;

namespace MedMonitor.Core.Interfaces
{
    public interface INotificationService
    {
        SystemTask CreateTaskNotificationAsync(int taskId, string nurseId, string taskName, string patientName, string startTime, string endTime, string note, string? alertLevel = null, string? unitName = null, string? patientId = null);
        Task<List<NotificationDto>> GetByNurseAsync(string nurseId);
        SystemTask MarkAsReadAsync(int notificationId);
    }
}
