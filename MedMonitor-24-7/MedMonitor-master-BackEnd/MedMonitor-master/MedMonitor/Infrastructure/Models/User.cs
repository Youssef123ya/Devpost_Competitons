using MedMonitor.Shared.Enum;
using Microsoft.AspNetCore.Identity;

namespace MedMonitor.Infrastructure.Models
{
    public class User : IdentityUser
    {
        public string? FullName { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public GenderEnum? Gender { get; set; }

        public string? ImageUrl { get; set; }

        public bool IsActive { get; set; } = true;

        public UserRoleEnum Role { get; set; }

        // Doctor only
        public string? Specialization { get; set; }

        // Agora
        public string? TockenAgora { get; set; }
        public string? TockenUserAgoraChat { get; set; }
        public bool InCall { get; set; } = false;

   
        public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();

        public ICollection<Task> TasksAsDoctor { get; set; } = new List<Task>();
        public ICollection<Task> TasksAsNurse { get; set; } = new List<Task>();

        public string? ResetOtp { get; set; }
        public DateTime? OtpExpiry { get; set; }

        public ICollection<AdmissionRequest> Requests { get; set; } = new List<AdmissionRequest>();
        public ICollection<VitalSign> VitalSigns { get; set; } = new List<VitalSign>();
    }
}
