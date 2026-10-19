using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Hosting;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace UXFriends.Infrastructure.Services
{
    public class EmailService : UXFriends.Application.Services.IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;
        private readonly IHostEnvironment _environment;

        public EmailService(
            IConfiguration configuration,
            ILogger<EmailService> logger,
            IHostEnvironment environment)
        {
            _configuration = configuration;
            _logger = logger;
            _environment = environment;
        }

        public async Task SendPasswordResetCodeAsync(string email, string code, string userName)
        {
            try
            {
                var htmlBody = $@"
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset='utf-8'>
                    </head>
                    <body>
                        <div dir='rtl' style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                            <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;'>
                                <h1 style='color: white; margin: 0; font-size: 32px;'>UXFriends</h1>
                            </div>
                            <div style='background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;'>
                                <h2 style='color: #333; text-align: right;'>مرحباً {userName}،</h2>
                                <p style='color: #666; font-size: 16px; line-height: 1.6; text-align: right;'>
                                    تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.
                                </p>
                                <div style='background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;'>
                                    <p style='color: #666; margin-bottom: 10px;'>رمز التحقق الخاص بك:</p>
                                    <h1 style='color: #667eea; font-size: 48px; letter-spacing: 10px; margin: 15px 0; font-weight: bold;'>{code}</h1>
                                    <p style='color: #999; font-size: 14px; margin-top: 15px;'>
                                        ⏰ الرمز صالح لمدة 10 دقائق
                                    </p>
                                </div>
                                <p style='color: #666; font-size: 14px; text-align: right;'>
                                    ⚠️ إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني.
                                </p>
                                <hr style='border: none; border-top: 1px solid #ddd; margin: 30px 0;'>
                                <p style='color: #999; font-size: 12px; text-align: center;'>
                                    © 2024 UXFriends. جميع الحقوق محفوظة.
                                </p>
                            </div>
                        </div>
                    </body>
                    </html>
                ";

                await SendEmailAsync(
                    email,
                    userName,
                    "رمز إعادة تعيين كلمة المرور - UXFriends",
                    htmlBody,
                    devLogMessage: $"Development password reset code for {email}: {code}");
            }
            catch (MailKit.Security.AuthenticationException ex)
            {
                _logger.LogError($"SMTP Authentication Error: {ex.Message}");
                _logger.LogError("Make sure you're using a Gmail App Password (not your regular password).");
                _logger.LogError("To create an App Password: 1) Enable 2FA on your Google account, 2) Go to https://myaccount.google.com/apppasswords");
                throw new Exception($"Email authentication failed. Please check SMTP credentials.", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Email Error: {ex.Message}");
                throw;
            }
        }

        public async Task SendEmailVerificationAsync(string email, string verificationUrl, string userName, DateTime expiresAtUtc)
        {
            var expiresAtLocal = TimeZoneInfo.ConvertTimeFromUtc(expiresAtUtc, TimeZoneInfo.Local);
            var htmlBody = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                </head>
                <body>
                    <div dir='rtl' style='font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8fafc;'>
                        <div style='background: linear-gradient(135deg, #7c3aed 0%, #14b8a6 100%); padding: 32px; text-align: center; border-radius: 16px 16px 0 0;'>
                            <h1 style='color: white; margin: 0; font-size: 34px;'>UXFriends</h1>
                            <p style='color: rgba(255,255,255,0.88); margin: 10px 0 0;'>تأكيد البريد الإلكتروني</p>
                        </div>
                        <div style='background: white; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0;'>
                            <h2 style='color: #0f172a; text-align: right; margin-top: 0;'>مرحباً {userName}،</h2>
                            <p style='color: #475569; font-size: 16px; line-height: 1.8; text-align: right;'>
                                فعّل بريدك الإلكتروني خلال 48 ساعة من إنشاء الحساب حتى يحتفظ حسابك وتقدمك داخل المنصة.
                            </p>
                            <div style='background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;'>
                                <a href='{verificationUrl}' style='display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #14b8a6 100%); color: white; text-decoration: none; font-size: 18px; font-weight: 700; padding: 16px 28px; border-radius: 14px;'>
                                    تأكيد البريد الإلكتروني
                                </a>
                                <p style='color: #64748b; font-size: 14px; line-height: 1.7; margin: 18px 0 0;'>
                                    ينتهي هذا الرابط في: {expiresAtLocal:yyyy-MM-dd HH:mm} (بالتوقيت المحلي للخادم)
                                </p>
                            </div>
                            <p style='color: #475569; font-size: 14px; line-height: 1.8; text-align: right;'>
                                إذا لم تتم عملية التحقق خلال المهلة، سيُحذف الحساب تلقائياً مع أي تقدم مرتبط به.
                            </p>
                            <p style='color: #94a3b8; font-size: 12px; line-height: 1.7; word-break: break-word; text-align: right;'>
                                إذا لم يعمل الزر، انسخ هذا الرابط وافتحه في المتصفح:<br />
                                <span>{verificationUrl}</span>
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            ";

            await SendEmailAsync(
                email,
                userName,
                "تأكيد البريد الإلكتروني - UXFriends",
                htmlBody,
                devLogMessage: $"Development verification email for {email}: {verificationUrl}");
        }

        private async Task SendEmailAsync(
            string email,
            string userName,
            string subject,
            string htmlBody,
            string? devLogMessage = null)
        {
            var smtpHost = _configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
            var smtpUsername = _configuration["Email:Username"];
            var smtpPassword = _configuration["Email:Password"];
            var fromEmail = _configuration["Email:FromEmail"] ?? smtpUsername;
            var fromName = _configuration["Email:FromName"] ?? "UXFriends";
            var emailMode = _configuration["Email:Mode"] ?? "Smtp";

            if (string.Equals(emailMode, "Development", StringComparison.OrdinalIgnoreCase))
            {
                var outputDirectory = Path.Combine(_environment.ContentRootPath, "dev-emails");
                Directory.CreateDirectory(outputDirectory);

                var filePath = Path.Combine(
                    outputDirectory,
                    $"{DateTime.UtcNow:yyyyMMdd-HHmmss}-{email.Replace("@", "_at_")}.html");

                await File.WriteAllTextAsync(filePath, htmlBody);
                _logger.LogInformation("Stored development email for {Email} at {FilePath}", email, filePath);
                if (!string.IsNullOrWhiteSpace(devLogMessage))
                {
                    _logger.LogInformation(devLogMessage);
                }
                return;
            }

            if (string.IsNullOrEmpty(smtpUsername) || string.IsNullOrEmpty(smtpPassword))
            {
                throw new InvalidOperationException("SMTP credentials are not configured.");
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromEmail!));
            message.To.Add(new MailboxAddress(userName, email));
            message.Subject = subject;
            message.Body = new TextPart("html")
            {
                Text = htmlBody
            };

            using var smtpClient = new SmtpClient();
            _logger.LogInformation("Connecting to SMTP server {Host}:{Port}", smtpHost, smtpPort);

            if (smtpPort == 465)
            {
                await smtpClient.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.SslOnConnect);
            }
            else
            {
                await smtpClient.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTls);
            }

            _logger.LogInformation("Authenticating with SMTP server");
            await smtpClient.AuthenticateAsync(smtpUsername, smtpPassword);

            _logger.LogInformation("Sending email to {Email}", email);
            await smtpClient.SendAsync(message);
            await smtpClient.DisconnectAsync(true);
            _logger.LogInformation("Email sent successfully to {Email}", email);
        }
    }
}
