using Akeel.Utilities.ValidateResult;
using MedMonitor.Core.Dto;

namespace MedMonitor.Core.Interfaces
{
    public interface IAdmissionRequestService
    {
        Task<ValidateResult<AdmissionRequestDto>> Create(AdmissionRequestDto dto, string doctorId);
        Task<ValidateResult<AdmissionRequestDto>> Update(AdmissionRequestDto dto);
        Task<ValidateResult<bool>> Delete(int id);
        Task<List<AdmissionRequestDto>> GetAll();
        Task<AdmissionRequestDto> GetById(int id);
        Task<List<AdmissionRequestDto>> GetPending();
        Task<ValidateResult<bool>> Approve(int id, int bedId);  // ✅ UPDATED: Accept bedId
        Task<ValidateResult<bool>> Reject(int id);
    }
}
