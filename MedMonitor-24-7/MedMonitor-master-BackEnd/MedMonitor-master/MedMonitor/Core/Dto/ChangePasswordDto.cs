using System.ComponentModel.DataAnnotations;

namespace MedMonitor.Core.Dto
{
    public class ChangePasswordDto
    {
        public string? UserId { get; set; }

        [Required]
        public string OldPassword { get; set; } = null!;
        [Required]
        public string NewPassword { get; set; } = null!;

    }
}
