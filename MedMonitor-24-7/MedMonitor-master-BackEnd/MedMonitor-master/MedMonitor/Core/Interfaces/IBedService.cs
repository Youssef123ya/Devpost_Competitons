using MedMonitor.Core.Dto;

namespace MedMonitor.Core.Interfaces
{
    public interface IBedService
    {
        Task<List<BedDto>> GetAll();
        Task<BedDto> GetById(int id);
        Task<BedDto> Create(BedDto dto);
        Task<BedDto> Update(BedDto dto);
        Task<bool> Delete(int id);

        Task<bool> AssignPatient(int bedId, string patientId);
        Task<bool> RemovePatient(int bedId);
    }
}
