namespace MedMonitor.Core.Dto
{
    public class OtpDto
    {
        public string? UserId { get; set; }
        public string? Otp { get; set; }

    }
    public class ForgetPasswordEmailDto : OtpDto
    {
        public string? Email { get; set; }

    }
    public class ForgetPasswordPhoneNumberDto : OtpDto
    {
        public string? PhoneNumber { get; set; }

    }
}
