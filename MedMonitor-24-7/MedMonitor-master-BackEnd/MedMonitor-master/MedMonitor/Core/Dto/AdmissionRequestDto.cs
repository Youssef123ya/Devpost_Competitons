using MedMonitor.Shared.Enum;

namespace MedMonitor.Core.Dto
{
    public class AdmissionRequestDto
    {
        public int Id { get; set; }
        public string DoctorId { get; set; } = null!;
        public string? DoctorName { get; set; }
        public string PatientName { get; set; } = null!;
        public string? PatientId { get; set; }
        public string? Gender { get; set; }
        public int? Weight { get; set; }
        public int? Height { get; set; }
        public string? Illness { get; set; }
        public string? CompanionPhone { get; set; }
        public string? NurseName { get; set; }
        public int Age { get; set; }
        public string? MedicalHistory { get; set; }
        public string? Diagnosis { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public RequestStatusEnum Status { get; set; }
    }
}
