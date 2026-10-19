using AutoMapper;
using MedMonitor.Core.Dto;
using MedMonitor.Core.Interfaces;
using MedMonitor.Infrastructure.Models;
using MedMonitor.Infrastructure.Repositories.Interface;
using MedMonitor.Shared.Dtos;

namespace MedMonitor.Core.Business
{
    public class VitalSignService : IVitalSignService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public VitalSignService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<VitalSignDto> Add(VitalSignDto dto)
        {
            var recordedAtUtc = dto.RecordedAt.Kind == DateTimeKind.Utc
                ? dto.RecordedAt
                : dto.RecordedAt.ToUniversalTime();

            var hourStart = new DateTime(
                recordedAtUtc.Year,
                recordedAtUtc.Month,
                recordedAtUtc.Day,
                recordedAtUtc.Hour,
                0, 0,
                DateTimeKind.Utc);

            var hourEnd = hourStart.AddHours(1);

            var patientId = NormalizePatientId(dto.PatientId);

            var exists = await _unitOfWork.VitalSign.AnyAsync(v =>
                v.PatientId == patientId &&
                v.RecordedAt >= hourStart &&
                v.RecordedAt < hourEnd);

            if (exists == true)
            {
                var existing = await _unitOfWork.VitalSign.FindAsync(v =>
                    v.PatientId == patientId &&
                    v.RecordedAt >= hourStart &&
                    v.RecordedAt < hourEnd);

                return _mapper.Map<VitalSignDto>(existing);
            }

            var entity = _mapper.Map<VitalSign>(dto);
            entity.PatientId = patientId;
            _unitOfWork.VitalSign.Add(entity);
            await _unitOfWork.SaveAsync();
            return _mapper.Map<VitalSignDto>(entity);
        }

        public async Task<List<VitalSignDto>> GetByPatient(string patientId)
        {
            var criteria = new ListCriteriaDto<VitalSign>();
            var normalizedPatientId = NormalizePatientId(patientId);

            var data = await _unitOfWork.VitalSign.ListByPatientIdAsync(criteria, normalizedPatientId);

            return _mapper.Map<List<VitalSignDto>>(data.Rows);
        }

        public async Task<bool> Delete(int id)
        {
            var entity = await _unitOfWork.VitalSign.FindAsync(x => x.Id == id);
            _unitOfWork.VitalSign.Remove(entity);
            await _unitOfWork.SaveAsync();
            return true;
        }
        private string? NormalizePatientId(string? patientId)
        {
            if (string.IsNullOrWhiteSpace(patientId))
                return null;

            return patientId.Trim();
        }
    }
}
