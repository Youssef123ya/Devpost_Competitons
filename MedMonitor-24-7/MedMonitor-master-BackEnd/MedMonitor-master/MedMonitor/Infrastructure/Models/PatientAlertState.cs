namespace MedMonitor.Infrastructure.Models
{
    public class PatientAlertState
    {
        public int Id { get; set; }
        public string PatientId { get; set; } = null!;
        public bool IsAlertActive { get; set; } = false;
        public string? LastAlertLevel { get; set; }
        public DateTime? LastAlertSentAt { get; set; }
    }
}
