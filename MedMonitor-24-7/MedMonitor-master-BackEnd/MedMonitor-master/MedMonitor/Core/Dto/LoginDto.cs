using System.ComponentModel.DataAnnotations;

namespace MedMonitor.Core.Dto
{
    public class LoginDto
    {
        [Required] public string UserName { get; set; } = null!;
        [Required] public string Password { get; set; } = null!;
    }

    public class LoginCustomerDto
    {
        [Required] public string PhoneNumber { get; set; } = null!;
        [Required] public string Password { get; set; } = null!;
    }
}
