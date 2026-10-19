using Akeel.Utilities.EF.Extensions.Models;
using Akeel.Utilities.ValidateResult;
using MedMonitor.Core.Dto;

namespace MedMonitor.Core.Interfaces
{
    public interface IUserAgoraService
    {
        Task<ValidateResult<UserAgoraDto>> AddAsync(UserAgoraLogin userAgoraLogin);
        Task<ValidateResult<UserAgoraDto>> GetUserAgoraDtoById(int userId);
        Task<ValidateResult<bool>> RemoveUserAgora(UserAgoraDeleteDto userAgoraDeleteDto);
        Task<RowsWithPaginationInfo<UserAgoraDto>> ListAsync();

        Task<ValidateResult<UserAgoraChatTokenDto>> GenerateTokenForUserChat(string userName, string agoraProjectId, string agoraProjectName);
        Task<ValidateResult<UserAgoraChatTokenDto>> GenerateTokenForUserCall(UserCallDto userCallDto, string agoraProjectId, string agoraProjectName);
    }
}
