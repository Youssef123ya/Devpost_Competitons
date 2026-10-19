using Akeel.Utilities.ValidateResult;
using MedMonitor.Core.Dto;

namespace MedMonitor.Core.Interfaces
{
    public interface IAgoraManagementService
    {
        Task<ValidateResult<AgoraProjectDto>> AddAsync(AgoraProjectDto agoraProjectDto);
        Task<ValidateResult<AgoraProjectDto>> GetAgoraProjectById(string agoraProjectId, string agoraProjectName);
        Task<ValidateResult<AgoraProjectWithTokenDto>> GetAgoraProjectWithToken(string agoraProjectId, string agoraProjectName);
        Task<ValidateResult<bool>> RemoveAgoraProject(string agoraProjectId);
        Task<List<AgoraProjectDto>> ListAsync();
    }
}
