using System.ComponentModel.DataAnnotations;

namespace MedMonitor.Core.Dto
{
    public class ChangePasswordNotTokenDto
    {

        [Required] public string Email { get; set; } = null!;
        [Required] public string UserId { get; set; } = null!;
        [Required] public string Otp { get; set; } = null!;
        [Required] public string NewPassword { get; set; } = null!;

    }
}
