using MedMonitor.Shared.Enum;

namespace MedMonitor.Infrastructure.Models
{
    public class Task
    {
        public int Id { get; set; }

        public string Title { get; set; } = null!;

        public string? Notes { get; set; }

        public DateTime StartTime { get; set; }

        public DateTime EndTime { get; set; }

        public TaskStatusEnum Status { get; set; } = TaskStatusEnum.New;

        public string DoctorId { get; set; } = null!;
        public User Doctor { get; set; } = null!;

        public string NurseId { get; set; } = null!;
        public User Nurse { get; set; } = null!;

        public string? PatientId { get; set; }
        public User? Patient { get; set; }
        public string? PatientName { get; set; }
        public string? NurseName { get; set; }
        public string? Remind { get; set; }
        public string? Repeat { get; set; }
    }
}
