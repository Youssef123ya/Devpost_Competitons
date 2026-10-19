using Akeel.Utilities.EF.Extensions.Models;
using MedMonitor.Infrastructure.Models;
using MedMonitor.Infrastructure.Repositories.Business;

namespace MedMonitor.Infrastructure.Repositories.Interface
{
    public interface IUserRepository : IRepository<User>
    {
        Task<RowsWithPaginationInfo<User>> ListAsync(Shared.Dtos.ListCriteriaDto<User> criteria);
    }
}
