using Akeel.Utilities.EF.Extensions.ExtensionMethods;
using Akeel.Utilities.EF.Extensions.Models;
using MedMonitor.Infrastructure.Data;
using MedMonitor.Infrastructure.Models;
using MedMonitor.Infrastructure.Repositories.Interface;
using MedMonitor.Infrastructure.Repositories.QueryHelpers;
using MedMonitor.Shared.Dtos;

namespace MedMonitor.Infrastructure.Repositories.Business
{
    public class BedRepository : Repository<Bed>, IBedRepository
    {
        private readonly AppDbContext _context;
        private readonly BedQueryHelper _queryHelper = new();

        public BedRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<RowsWithPaginationInfo<Bed>> ListAsync(ListCriteriaDto<Bed> criteria)
        {
            return await _context.Beds
                .IncludeRange(criteria.ListRelatedObjectsEnum, _queryHelper)
                .OnSelectListWithPaginationAsync(criteria.PaginationInfo, criteria.ListRelatedObjectsEnum, _queryHelper);
        }
    }
}
