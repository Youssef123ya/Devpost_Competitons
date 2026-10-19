using Akeel.Utilities.EF.Extensions.Models;
using MedMonitor.Shared.Dtos;

namespace MedMonitor.Infrastructure.Repositories.Interface
{
    public interface ITaskRepository : IRepository<MedMonitor.Infrastructure.Models.Task>
    {
        Task<RowsWithPaginationInfo<MedMonitor.Infrastructure.Models.Task>> ListAsync(ListCriteriaDto<MedMonitor.Infrastructure.Models.Task> criteria);
    }
}
