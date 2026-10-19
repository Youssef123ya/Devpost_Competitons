using Akeel.Utilities.EF.Extensions.ExtensionMethods;
using Akeel.Utilities.EF.Extensions.Models;
using Microsoft.EntityFrameworkCore;
using MedMonitor.Infrastructure.Data;
using MedMonitor.Infrastructure.Repositories.Interface;
using MedMonitor.Infrastructure.Repositories.QueryHelpers;
using MedMonitor.Shared.Dtos;
using System.Diagnostics;

namespace MedMonitor.Infrastructure.Repositories.Business
{
    public class VitalSignRepository : Repository<MedMonitor.Infrastructure.Models.VitalSign>, IVitalSignRepository
    {
        private readonly AppDbContext _context;
        private readonly VitalSignQueryHelper _queryHelper = new();

        public VitalSignRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<RowsWithPaginationInfo<MedMonitor.Infrastructure.Models.VitalSign>> ListAsync(
            ListCriteriaDto<MedMonitor.Infrastructure.Models.VitalSign> criteria)
        {
            return await _context.Set<MedMonitor.Infrastructure.Models.VitalSign>()
                .IncludeRange(criteria.ListRelatedObjectsEnum, _queryHelper)
                .OnSelectListWithPaginationAsync(criteria.PaginationInfo, criteria.ListRelatedObjectsEnum, _queryHelper);
        }

        public async Task<RowsWithPaginationInfo<MedMonitor.Infrastructure.Models.VitalSign>> ListByPatientIdAsync(
            ListCriteriaDto<MedMonitor.Infrastructure.Models.VitalSign> criteria,
            string patientId)
        {
            // 🔍 DIAGNOSTIC: Log incoming patientId
            Debug.WriteLine($"🔍 [VitalSignRepository.ListByPatientIdAsync] PatientId received: '{patientId}'");
            
            // Get total records count for diagnostics
            var totalRecords = await _context.VitalSigns.CountAsync();
            Debug.WriteLine($"🔍 [VitalSignRepository.ListByPatientIdAsync] Total VitalSign records in database: {totalRecords}");
            
            // Get records matching this patientId
            var matchingRecords = await _context.VitalSigns
                .Where(x => x.PatientId == patientId)
                .CountAsync();
            Debug.WriteLine($"🔍 [VitalSignRepository.ListByPatientIdAsync] Records matching patientId '{patientId}': {matchingRecords}");
            
            // If no matches, show all unique patientIds in database
            if (matchingRecords == 0 && totalRecords > 0)
            {
                var allPatientIds = await _context.VitalSigns
                    .Select(x => x.PatientId)
                    .Distinct()
                    .ToListAsync();
                Debug.WriteLine($"🔍 [VitalSignRepository.ListByPatientIdAsync] Unique PatientIds in database: {string.Join(", ", allPatientIds)}");
            }
            
            var query = _context.Set<MedMonitor.Infrastructure.Models.VitalSign>()
                .Where(x => x.PatientId == patientId);

            return await query
                .IncludeRange(criteria.ListRelatedObjectsEnum, _queryHelper)
                .OnSelectListWithPaginationAsync(criteria.PaginationInfo, criteria.ListRelatedObjectsEnum, _queryHelper);
        }
    }
}
