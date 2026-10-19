namespace MedMonitor.Core.Dto
{
    /// <summary>
    /// Dashboard statistics data transfer object
    /// Contains all metrics displayed on the admin dashboard
    /// AvailableBeds is now calculated dynamically: (TotalUnits × BedsPerUnit) - OccupiedBeds
    /// </summary>
    public class DashboardStatsDto
    {
        // ✅ BED METRICS — Now with dynamic calculation
        public int TotalUnits { get; set; } = 7;           // Number of medical units (A, B, C, D, E, F, G)
        public int BedsPerUnit { get; set; } = 12;         // Fixed: 12 beds per unit
        public int TotalBeds { get; set; } = 84;           // Calculated: 7 × 12 = 84
        public int OccupiedBeds { get; set; }              // Count of beds with Status = Occupied
        public int AvailableBeds { get; set; }             // Calculated: TotalBeds - OccupiedBeds

        // PATIENT & USER METRICS
        public int TotalPatients { get; set; }
        public int TotalDoctors { get; set; }
        public int TotalNurses { get; set; }
        public int TotalRequests { get; set; }

        // AGE GROUP STATISTICS
        public int NewbornsCount { get; set; }
        public int ChildrenCount { get; set; }
        public int TeenagersCount { get; set; }
        public int AdultsCount { get; set; }
        public int ElderlyCount { get; set; }
    }
}
