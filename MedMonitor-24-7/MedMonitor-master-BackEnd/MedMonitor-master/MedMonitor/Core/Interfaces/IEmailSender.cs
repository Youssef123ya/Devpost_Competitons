namespace MedMonitor.Core.Interfaces
{
    public interface IEmailSender
    {
        Task<string> SendEmail(string toEmail, string subject);
        //MessageResource SendPhoneNumber(string mobileNumber, string otp);
        Task<int> SendPhoneNumber(string mobileNumber);
    }
}
