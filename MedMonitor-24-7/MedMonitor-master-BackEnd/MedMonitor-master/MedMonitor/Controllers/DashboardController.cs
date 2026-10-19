using MedMonitor.Core.Dto;
using MedMonitor.Core.Constants;
using MedMonitor.Infrastructure.Data;
using MedMonitor.Shared.Enum;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedMonitor.Controllers
{
    public class DashboardController : BaseController
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get dashboard statistics with dynamically calculated bed availability
        /// 
        /// CALCULATION:
        /// - TotalUnits = 7 (A, B, C, D, E, F, G)
        /// - BedsPerUnit = 12 (constant)
        /// - TotalBeds = 7 × 12 = 84
        /// - OccupiedBeds = count of beds with Status = Occupied
        /// - AvailableBeds = TotalBeds - OccupiedBeds ✅ DYNAMIC!
        /// 
        /// If admin adds Unit H later:
        /// - Update BedConfiguration.TOTAL_UNITS = 8
        /// - AvailableBeds automatically becomes: (8 × 12) - occupiedBeds = 96 - occupiedBeds
        /// </summary>
        [HttpGet("Stats")]
        public async Task<IActionResult> Stats()
        {
            try
            {
                // ✅ BED CALCULATION — Now dynamic based on units configuration
                int totalUnits = BedConfiguration.TOTAL_UNITS;
                int bedsPerUnit = BedConfiguration.BEDS_PER_UNIT;
                int totalBeds = BedConfiguration.TotalBeds; // 84

                // Count only occupied beds
                int occupiedBeds = await _context.Beds.CountAsync(b => (int)b.Status == 1);

                // ✅ CRITICAL FIX: Calculate available as remainder, not from Status=0
                // This handles cases where beds might be in other states (maintenance, etc.)
                int availableBeds = totalBeds - occupiedBeds;

                // USERS — from AspNetUsers by Role
                var totalDoctors = await _context.Users.CountAsync(u => (int)u.Role == 2);
                var totalNurses = await _context.Users.CountAsync(u => (int)u.Role == 3);

                // PATIENTS — approved admission requests only (Status=2)
                var approvedPatients = await _context.AdmissionRequests
                    .Where(r => (int)r.Status == 2)
                    .ToListAsync();
                var totalPatients = approvedPatients.Count;

                // ALL REQUESTS
                var totalRequests = await _context.AdmissionRequests.CountAsync();

                // AGE STATISTICS — from approved patients
                var newbornsCount = approvedPatients.Count(r => r.Age == 0);
                var childrenCount = approvedPatients.Count(r => r.Age >= 1 && r.Age <= 12);
                var teenagersCount = approvedPatients.Count(r => r.Age >= 13 && r.Age <= 19);
                var adultsCount = approvedPatients.Count(r => r.Age >= 20 && r.Age <= 64);
                var elderlyCount = approvedPatients.Count(r => r.Age >= 65);

                var result = new DashboardStatsDto
                {
                    // ✅ Bed metrics — now properly calculated
                    TotalUnits = totalUnits,
                    BedsPerUnit = bedsPerUnit,
                    TotalBeds = totalBeds,
                    OccupiedBeds = occupiedBeds,
                    AvailableBeds = availableBeds,

                    // Patient & user metrics
                    TotalPatients = totalPatients,
                    TotalDoctors = totalDoctors,
                    TotalNurses = totalNurses,
                    TotalRequests = totalRequests,

                    // Age statistics
                    NewbornsCount = newbornsCount,
                    ChildrenCount = childrenCount,
                    TeenagersCount = teenagersCount,
                    AdultsCount = adultsCount,
                    ElderlyCount = elderlyCount,
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                // Log error and return default stats
                return StatusCode(500, new { error = "Failed to fetch dashboard stats", details = ex.Message });
            }
        }
    }
}
