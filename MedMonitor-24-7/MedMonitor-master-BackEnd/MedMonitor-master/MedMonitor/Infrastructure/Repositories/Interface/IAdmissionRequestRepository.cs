using Akeel.Utilities.EF.Extensions.Models;
using MedMonitor.Infrastructure.Models;
using MedMonitor.Shared.Dtos;

namespace MedMonitor.Infrastructure.Repositories.Interface
{
    public interface IAdmissionRequestRepository : IRepository<AdmissionRequest>
    {
        Task<RowsWithPaginationInfo<AdmissionRequest>> ListAsync(ListCriteriaDto<AdmissionRequest> criteria);
    }
}
