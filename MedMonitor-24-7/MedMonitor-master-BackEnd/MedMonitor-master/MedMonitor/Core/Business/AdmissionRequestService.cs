using Akeel.Utilities.EF.Extensions.Models;
using Akeel.Utilities.ValidateResult;
using AutoMapper;
using MedMonitor.Core.Dto;
using MedMonitor.Core.Interfaces;
using MedMonitor.Infrastructure.Data;
using MedMonitor.Infrastructure.Models;
using MedMonitor.Infrastructure.Repositories.Interface;
using Microsoft.EntityFrameworkCore;
using MedMonitor.Shared.Dtos;
using MedMonitor.Shared.Enum;

namespace MedMonitor.Core.Business
{
    public class AdmissionRequestService : IAdmissionRequestService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly AppDbContext _dbContext;

        public AdmissionRequestService(IUnitOfWork unitOfWork, IMapper mapper, AppDbContext dbContext)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _dbContext = dbContext;
        }

        #region CREATE
        public async Task<ValidateResult<AdmissionRequestDto>> Create(AdmissionRequestDto dto, string doctorId)
        {
            var entity = _mapper.Map<AdmissionRequest>(dto);
            entity.DoctorId = doctorId;
            entity.Status = RequestStatusEnum.Pending;
            entity.CreatedAt = DateTime.UtcNow;

            _unitOfWork.AdmissionRequest.Add(entity);
            await _unitOfWork.SaveAsync();

            return _mapper.Map<AdmissionRequestDto>(entity);
        }
        #endregion

        #region UPDATE
        public async Task<ValidateResult<AdmissionRequestDto>> Update(AdmissionRequestDto dto)
        {
            var entity = await _unitOfWork.AdmissionRequest.FindAsync(x => x.Id == dto.Id);

            if (entity == null)
                return ErrorDto.Factory(ErrorCodesEnum.NotFound);

            entity.PatientName = dto.PatientName;
            entity.PatientId = dto.PatientId;
            entity.Gender = dto.Gender;
            entity.Weight = dto.Weight;
            entity.Height = dto.Height;
            entity.Illness = dto.Illness;
            entity.CompanionPhone = dto.CompanionPhone;
            entity.NurseName = dto.NurseName;
            entity.Age = dto.Age;
            entity.MedicalHistory = dto.MedicalHistory;
            entity.Diagnosis = dto.Diagnosis;

            _unitOfWork.AdmissionRequest.Update(entity);
            await _unitOfWork.SaveAsync();

            return _mapper.Map<AdmissionRequestDto>(entity);
        }
        #endregion

        #region DELETE
        public async Task<ValidateResult<bool>> Delete(int id)
        {
            var entity = await _unitOfWork.AdmissionRequest.FindAsync(x => x.Id == id);

            if (entity == null)
                return ErrorDto.Factory(ErrorCodesEnum.NotFound);

            _unitOfWork.AdmissionRequest.Remove(entity);
            await _unitOfWork.SaveAsync();

            return true;
        }
        #endregion

        #region GET ALL
        public async Task<List<AdmissionRequestDto>> GetAll()
        {
            var data = await _dbContext.AdmissionRequests
                .Include(x => x.Doctor)
                .AsNoTracking()
                .ToListAsync();

            return _mapper.Map<List<AdmissionRequestDto>>(data);
        }
        #endregion

        #region GET BY ID
        public async Task<AdmissionRequestDto> GetById(int id)
        {
            var data = await _unitOfWork.AdmissionRequest.FindAsync(x => x.Id == id);

            return _mapper.Map<AdmissionRequestDto>(data);
        }
        #endregion

        #region GET PENDING
        public async Task<List<AdmissionRequestDto>> GetPending()
        {
            var data = await _dbContext.AdmissionRequests
                .Include(x => x.Doctor)
                .Where(x => x.Status == RequestStatusEnum.Pending)
                .AsNoTracking()
                .ToListAsync();

            return _mapper.Map<List<AdmissionRequestDto>>(data);
        }
        #endregion

        #region APPROVE
        // ✅ UPDATED: Accept specific bedId chosen by admin
        public async Task<ValidateResult<bool>> Approve(int id, int bedId)
        {
            var entity = await _unitOfWork.AdmissionRequest.FindAsync(x => x.Id == id);

            if (entity == null)
                return ErrorDto.Factory(ErrorCodesEnum.NotFound);

            entity.Status = RequestStatusEnum.Approved;
            _unitOfWork.AdmissionRequest.Update(entity);

            // ✅ FIXED: Assign to SPECIFIC bed chosen by admin
            var bed = await _unitOfWork.Bed.FindAsync(x => x.Id == bedId && 
                                                          x.Status == BedStatusEnum.Available);
            
            if (bed == null)
                return ErrorDto.Factory(ErrorCodesEnum.NotFound);
                // Bed not found or not available anymore

            bed.PatientId = entity.PatientId;            // National ID or Patient ID
            bed.PatientName = entity.PatientName;
            bed.PatientAge = entity.Age;
            bed.Gender = entity.Gender;
            bed.Weight = entity.Weight;
            bed.Height = entity.Height;
            bed.PatientIllness = entity.Illness;
            bed.CompanionPhone = entity.CompanionPhone;
            bed.NurseName = entity.NurseName;
            bed.MedicalHistory = entity.MedicalHistory;
            bed.Diagnosis = entity.Diagnosis;
            bed.Status = BedStatusEnum.Occupied;
            bed.AssignedDate = DateTime.UtcNow;
            _unitOfWork.Bed.Update(bed);

            // Keep the admission record in sync with the assigned bed.
            entity.BedNumber = bed.BedNumber;
            _unitOfWork.AdmissionRequest.Update(entity);

            await _unitOfWork.SaveAsync();
            
            System.Diagnostics.Debug.WriteLine($"✅ Approved: Patient {bed.PatientName} (Age: {bed.PatientAge}) assigned to Bed {bed.BedNumber}");
            return true;
        }
        #endregion

        #region REJECT
        public async Task<ValidateResult<bool>> Reject(int id)
        {
            var entity = await _unitOfWork.AdmissionRequest.FindAsync(x => x.Id == id);

            if (entity == null)
                return ErrorDto.Factory(ErrorCodesEnum.NotFound);

            entity.Status = RequestStatusEnum.Rejected;

            _unitOfWork.AdmissionRequest.Update(entity);
            await _unitOfWork.SaveAsync();

            return true;
        }
        #endregion
    }
}