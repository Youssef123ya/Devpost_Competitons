using MedMonitor.Shared.Enum;
using System.ComponentModel.DataAnnotations;

namespace MedMonitor.Infrastructure.Models
{
    public class Attachment
    {
        [Key]
        public int Id { get; set; }

        public string UserId { get; set; } = null!;
        public User User { get; set; } = null!;

        public DateTime UploadedDate { get; set; } = DateTime.UtcNow;

        public string AttachUrl { get; set; } = null!;

        public string? AddBy { get; set; }

        public AttachmentTypeEnum Type { get; set; }
    }
}
