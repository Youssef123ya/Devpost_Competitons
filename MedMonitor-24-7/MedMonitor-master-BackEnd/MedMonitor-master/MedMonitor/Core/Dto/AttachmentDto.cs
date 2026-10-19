using MedMonitor.Shared.Enum;
using System.ComponentModel.DataAnnotations;

namespace MedMonitor.Core.Dto
{
    public class AttachmentWriterDto
    {
        public int Id { get; set; }
        public string UserId { get; set; } = null!;
        public DateTime? UploadedDate { get; set; }

        public List<string> FileName { get; set; } = null!;
        public List<IFormFile> Attachments { get; set; } = null!;

        public string? AddBy { get; set; }
        public AttachmentTypeEnum Type { get; set; }
    }
    public class AttachmentDto : AttachmentWriterDto
    {
        public UserDto User { get; set; } = null!;
        public string? AttachUrl { get; set; }

    }
    public class AttachmentResult
    {
        public string FileUrl { get; set; }
        public string Type { get; set; }
        public int Id { get; set; }
    }
  
}
