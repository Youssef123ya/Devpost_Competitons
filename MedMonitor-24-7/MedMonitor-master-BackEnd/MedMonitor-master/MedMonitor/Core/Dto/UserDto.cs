using MedMonitor.Shared.Enum;
using System.ComponentModel.DataAnnotations;

namespace MedMonitor.Core.Dto
{
    public class UserDto
    {
        [Required] public string Id { get; set; } = null!;
        [Required] public string FullName { get; set; } = null!;
        [Required] public string UserName { get; set; } = null!;
        [Required] public string Email { get; set; } = null!;
        [Required] public string PhoneNumber { get; set; } = null!;
        [Required] public string Password { get; set; } = null!;

        public bool? IsActive { get; set; }
        public string? ImageUrl { get; set; }
        public IFormFile? Image { get; set; }

        public string? TockenAgora { get; set; }
        public string? TockenUserAgoraChat { get; set; }

        public GenderEnum? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public UserRoleEnum? Role { get; set; }
        public string? Specialization { get; set; }
        public bool InCall { get; set; }

        public ICollection<AttachmentDto> Attachments { get; set; } = new List<AttachmentDto>();
    }

    public class UserWriterDto
    {
        [Required] public string Id { get; set; } = null!;
        [Required] public string Email { get; set; } = null!;
        [Required] public string PhoneNumber { get; set; } = null!;

        public string? ImageUrl { get; set; }
        public IFormFile? Image { get; set; }


        public string? UserName { get; set; }

        public string? TockenAgora { get; set; }
        public string? TockenUserAgoraChat { get; set; }

        public GenderEnum? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public UserRoleEnum? Role { get; set; }
        public string? Specialization { get; set; }
    }

}

