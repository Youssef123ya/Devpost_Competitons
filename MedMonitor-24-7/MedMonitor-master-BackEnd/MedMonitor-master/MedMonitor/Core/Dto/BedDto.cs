using MedMonitor.Shared.Enum;

namespace MedMonitor.Core.Dto
{
    public class BedDto
    {
        public int Id { get; set; }
        public string BedNumber { get; set; } = null!;
        public BedStatusEnum Status { get; set; }
        
        // ✅ CHANGED: Store patient info directly instead of User reference
        public string? PatientId { get; set; }        // National ID or Patient ID
        public string? PatientName { get; set; }
        public int? PatientAge { get; set; }
        public string? Gender { get; set; }
        public int? Weight { get; set; }
        public int? Height { get; set; }
        public string? PatientIllness { get; set; }
        public string? CompanionPhone { get; set; }
        public string? NurseName { get; set; }
        public string? MedicalHistory { get; set; }
        public string? Diagnosis { get; set; }
        
        public DateTime? AssignedDate { get; set; }
    }
}
