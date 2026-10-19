using Akeel.Utilities.EF.Extensions.ExtensionMethods;
using Akeel.Utilities.EF.Extensions.Models;
using MedMonitor.Infrastructure.Data;
using MedMonitor.Infrastructure.Repositories.Interface;
using MedMonitor.Infrastructure.Repositories.QueryHelpers;
using MedMonitor.Shared.Dtos;

namespace MedMonitor.Infrastructure.Repositories.Business
{
    public class TaskRepository : Repository<MedMonitor.Infrastructure.Models.Task>, ITaskRepository
    {
        private readonly AppDbContext _context;
        private readonly TaskQueryHelper _queryHelper = new();

        public TaskRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<RowsWithPaginationInfo<MedMonitor.Infrastructure.Models.Task>> ListAsync(ListCriteriaDto<MedMonitor.Infrastructure.Models.Task> criteria)
        {
            return await _context.Tasks
                .IncludeRange(criteria.ListRelatedObjectsEnum, _queryHelper)
                .OnSelectListWithPaginationAsync(criteria.PaginationInfo, criteria.ListRelatedObjectsEnum, _queryHelper);
        }
    }
}
