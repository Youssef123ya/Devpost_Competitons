using Akeel.Utilities.EF.Extensions.Models;
using Akeel.Utilities.ValidateResult;
using MedMonitor.Core.Dto;

namespace MedMonitor.Core.Interfaces
{
    public interface IUsersService
    {
        Task<ValidateResult<UserWriterDto>> ManageUser(UserWriterDto UserDto);
        Task<ValidateResult<UserWriterDto>> GetUserById(string UserId);
        Task<ValidateResult<bool>> RemoveUser(string UserId);
        Task<RowsWithPaginationInfo<UserWriterDto>> ListAsync();
    }
}
