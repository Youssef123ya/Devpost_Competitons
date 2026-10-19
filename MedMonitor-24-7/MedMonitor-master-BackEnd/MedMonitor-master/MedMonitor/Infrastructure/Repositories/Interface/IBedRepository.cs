using Akeel.Utilities.EF.Extensions.Models;
using MedMonitor.Infrastructure.Models;
using MedMonitor.Shared.Dtos;

namespace MedMonitor.Infrastructure.Repositories.Interface
{
    public interface IBedRepository : IRepository<Bed>
    {
        Task<RowsWithPaginationInfo<Bed>> ListAsync(ListCriteriaDto<Bed> criteria);
    }
}
