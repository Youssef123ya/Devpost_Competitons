using Akeel.Utilities.EF.Extensions.Models;
using MedMonitor.Shared.Dtos;

namespace MedMonitor.Infrastructure.Repositories.Interface
{
    public interface IVitalSignRepository : IRepository<MedMonitor.Infrastructure.Models.VitalSign>
    {
        Task<RowsWithPaginationInfo<MedMonitor.Infrastructure.Models.VitalSign>> ListAsync(
            ListCriteriaDto<MedMonitor.Infrastructure.Models.VitalSign> criteria);

        Task<RowsWithPaginationInfo<MedMonitor.Infrastructure.Models.VitalSign>> ListByPatientIdAsync(
            ListCriteriaDto<MedMonitor.Infrastructure.Models.VitalSign> criteria,
            string patientId);
    }
}
