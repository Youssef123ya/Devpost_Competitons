using AutoMapper;
using MedMonitor.Core.Dto;
using MedMonitor.Core.Interfaces;
using MedMonitor.Infrastructure.Models;
using MedMonitor.Infrastructure.Repositories.Interface;
using MedMonitor.Shared.Dtos;
using MedMonitor.Shared.Enum;

namespace MedMonitor.Core.Business
{
    public class BedService : IBedService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public BedService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        #region GET ALL
        public async Task<List<BedDto>> GetAll()
        {
            // ✅ CHANGED: Use simple ListAsync without pagination - no need for Include
            var data = await _unitOfWork.Bed.ListAsync();
            return _mapper.Map<List<BedDto>>(data);
        }
        #endregion

        #region GET BY ID
        public async Task<BedDto> GetById(int id)
        {
            var data = await _unitOfWork.Bed.FindAsync(x => x.Id == id);

            return _mapper.Map<BedDto>(data);
        }
        #endregion

        #region CREATE
        public async Task<BedDto> Create(BedDto dto)
        {
            var entity = _mapper.Map<Bed>(dto);

            entity.Status = dto.Status;

            _unitOfWork.Bed.Add(entity);
            await _unitOfWork.SaveAsync();

            return _mapper.Map<BedDto>(entity);
        }
        #endregion

        #region UPDATE
        public async Task<BedDto> Update(BedDto dto)
        {
            var entity = await _unitOfWork.Bed.FindAsync(x => x.Id == dto.Id);

            if (entity == null)
                return null;

            entity.BedNumber = dto.BedNumber;
            entity.Status = dto.Status;

            _unitOfWork.Bed.Update(entity);
            await _unitOfWork.SaveAsync();

            return _mapper.Map<BedDto>(entity);
        }
        #endregion

        #region DELETE
        public async Task<bool> Delete(int id)
        {
            var entity = await _unitOfWork.Bed.FindAsync(x => x.Id == id);

            if (entity == null)
                return false;

            _unitOfWork.Bed.Remove(entity);
            await _unitOfWork.SaveAsync();

            return true;
        }
        #endregion

        #region ASSIGN PATIENT
        public async Task<bool> AssignPatient(int bedId, string patientId)
        {
            var bed = await _unitOfWork.Bed.FindAsync(x => x.Id == bedId);

            if (bed == null)
                return false;

            // ✅ Preserve the assigned patient ID so the UI and VitalSign queries
            // can look up the correct patient later.
            bed.PatientId = patientId;
            bed.Status = BedStatusEnum.Occupied;
            bed.AssignedDate = DateTime.UtcNow;

            _unitOfWork.Bed.Update(bed);
            await _unitOfWork.SaveAsync();

            return true;
        }
        #endregion

        #region REMOVE PATIENT
        public async Task<bool> RemovePatient(int bedId)
        {
            var bed = await _unitOfWork.Bed.FindAsync(x => x.Id == bedId);

            if (bed == null)
                return false;

            // ✅ Clear patient data from bed record
            bed.PatientId = null;
            bed.PatientName = null;
            bed.PatientAge = null;
            bed.Gender = null;
            bed.Weight = null;
            bed.Height = null;
            bed.PatientIllness = null;
            bed.CompanionPhone = null;
            bed.NurseName = null;
            bed.MedicalHistory = null;
            bed.Diagnosis = null;
            bed.Status = BedStatusEnum.Available;
            bed.AssignedDate = null;

            _unitOfWork.Bed.Update(bed);
            await _unitOfWork.SaveAsync();

            return true;
        }
        #endregion
    }
}
