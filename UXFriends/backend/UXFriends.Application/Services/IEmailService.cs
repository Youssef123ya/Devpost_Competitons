using System.Threading.Tasks;

namespace UXFriends.Application.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetCodeAsync(string email, string code, string userName);
        Task SendEmailVerificationAsync(string email, string verificationUrl, string userName, DateTime expiresAtUtc);
    }
}
