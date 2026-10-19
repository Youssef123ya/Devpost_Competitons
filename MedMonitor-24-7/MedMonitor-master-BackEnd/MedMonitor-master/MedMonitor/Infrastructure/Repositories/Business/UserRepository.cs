using Akeel.Utilities.EF.Extensions.ExtensionMethods;
using Akeel.Utilities.EF.Extensions.Models;
using MedMonitor.Infrastructure.Data;
using MedMonitor.Infrastructure.Models;
using MedMonitor.Infrastructure.Repositories.Interface;
using MedMonitor.Infrastructure.Repositories.QueryHelpers;
using MedMonitor.Shared.Dtos;

namespace MedMonitor.Infrastructure.Repositories.Business
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        private readonly AppDbContext _context;
        private readonly UserQueryHelper _UserQueryHelper = new UserQueryHelper();
        public UserRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }
        public async Task<RowsWithPaginationInfo<User>> ListAsync(ListCriteriaDto<User> criteria)
        {
            return await _context.Users.IncludeRange(criteria.ListRelatedObjectsEnum, _UserQueryHelper)
                .OnSelectListWithPaginationAsync(criteria.PaginationInfo, criteria.ListRelatedObjectsEnum,
                    _UserQueryHelper);
        }
    }
}
