namespace MedMonitor.Core.Dto
{
    public class NotificationDto
    {
        public int Id { get; set; }
        public string? PatientId { get; set; }
        public string NurseId { get; set; } = null!;
        public string? NurseName { get; set; }
        public string Title { get; set; } = null!;
        public string TaskName { get; set; } = null!;
        public string PatientName { get; set; } = null!;
        public string StartTime { get; set; } = null!;
        public string EndTime { get; set; } = null!;
        public string Note { get; set; } = null!;
        public string? AlertLevel { get; set; }
        public string? UnitName { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
