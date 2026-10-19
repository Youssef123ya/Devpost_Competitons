namespace MedMonitor.Infrastructure.Models
{
    public class Notification
    {
        public int Id { get; set; }

        // Optional patient id (GUID) for which this notification is related
        public string? PatientId { get; set; }

        public string NurseId { get; set; } = null!;
        public User Nurse { get; set; } = null!;

        public string Title { get; set; } = null!;
        public string TaskName { get; set; } = null!;
        public string PatientName { get; set; } = null!;
        public string StartTime { get; set; } = null!;
        public string EndTime { get; set; } = null!;
        public string Note { get; set; } = null!;
        public string? AlertLevel { get; set; }
        public string? UnitName { get; set; }

        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
