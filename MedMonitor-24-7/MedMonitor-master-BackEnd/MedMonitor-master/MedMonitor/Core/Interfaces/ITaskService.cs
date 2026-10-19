using MedMonitor.Core.Dto;
using MedMonitor.Shared.Enum;

namespace MedMonitor.Core.Interfaces
{
    public interface ITaskService
    {
        Task<List<TaskDto>> GetAll();
        Task<TaskDto> GetById(int id);
        Task<TaskDto> Create(TaskDto dto);
        Task<TaskDto> Update(TaskDto dto);
        Task<bool> Delete(int id);
        Task<bool> ChangeStatus(int id, TaskStatusEnum status);
    }
}
