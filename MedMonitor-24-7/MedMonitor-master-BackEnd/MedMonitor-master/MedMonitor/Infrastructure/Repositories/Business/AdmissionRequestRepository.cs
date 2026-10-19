using Akeel.Utilities.EF.Extensions.ExtensionMethods;
using Akeel.Utilities.EF.Extensions.Models;
using MedMonitor.Infrastructure.Data;
using MedMonitor.Infrastructure.Models;
using MedMonitor.Infrastructure.Repositories.Interface;
using MedMonitor.Infrastructure.Repositories.QueryHelpers;
using MedMonitor.Shared.Dtos;

namespace MedMonitor.Infrastructure.Repositories.Business
{
    public class AdmissionRequestRepository : Repository<AdmissionRequest>, IAdmissionRequestRepository
    {
        private readonly AppDbContext _context;
        private readonly AdmissionRequestQueryHelper _queryHelper = new();

        public AdmissionRequestRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<RowsWithPaginationInfo<AdmissionRequest>> ListAsync(ListCriteriaDto<AdmissionRequest> criteria)
        {
            return await _context.AdmissionRequests
                .IncludeRange(criteria.ListRelatedObjectsEnum, _queryHelper)
                .OnSelectListWithPaginationAsync(criteria.PaginationInfo, criteria.ListRelatedObjectsEnum, _queryHelper);
        }
        public async Task<RowsWithPaginationInfo<AdmissionRequest>> ListByDoctorIdAsync(
            ListCriteriaDto<AdmissionRequest> criteria,
            string doctorId)
        {
            var query = _context.AdmissionRequests
                .Where(x => x.DoctorId == doctorId);

            return await query
                .OnSelectListWithPaginationAsync(criteria.PaginationInfo, criteria.ListRelatedObjectsEnum, _queryHelper);
        }
    }
}
