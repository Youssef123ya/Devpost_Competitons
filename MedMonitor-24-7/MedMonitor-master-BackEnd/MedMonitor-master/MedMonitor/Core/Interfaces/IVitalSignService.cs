using MedMonitor.Core.Dto;

namespace MedMonitor.Core.Interfaces
{
    public interface IVitalSignService
    {
        Task<VitalSignDto> Add(VitalSignDto dto);
        Task<List<VitalSignDto>> GetByPatient(string patientId);
        Task<bool> Delete(int id);
    }
}
