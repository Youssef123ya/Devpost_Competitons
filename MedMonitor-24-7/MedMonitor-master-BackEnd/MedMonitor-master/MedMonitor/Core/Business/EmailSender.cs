using MailKit.Net.Smtp;
using MailKit.Security;
using MedMonitor.Core.Interfaces;
using MedMonitor.Extenstions;
using Microsoft.Extensions.Options;
using MimeKit;
using Twilio;
using Twilio.Rest.Api.V2010.Account;

namespace MedMonitor.Core.Business
{
    public class EmailSender : IEmailSender
    {
        private readonly TwilioSettings _twilio;
        private readonly EmailSettings _emailSettings;

        public EmailSender(IOptions<TwilioSettings> twilio, IOptions<EmailSettings> emailSettings)
        {
            _twilio = twilio.Value;
            _emailSettings = emailSettings.Value;
        }
        public async Task<string> SendEmail(string toEmail, string subject)
        {
            string otp = (BetterRandom.NextInt() % 1000000).ToString("000000");
            Console.WriteLine($"=== [DEV] OTP GENERATED === Email: {toEmail}, Subject: {subject}, Code: {otp}");

            if (string.IsNullOrEmpty(_emailSettings.SenderEmail))
            {
                throw new Exception("SenderEmail is not configured in appsettings.json");
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_emailSettings.SenderName ?? "Med Monitor", _emailSettings.SenderEmail));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;
            message.Body = new TextPart("plain")
            {
                Text = $"Your OTP verification code is: {otp}\n\n" +
                       "This code expires in 10 minutes.\n" +
                       "Do not share this code with anyone."
            };

            try
            {
                using var smtp = new SmtpClient();
                await smtp.ConnectAsync("smtp.gmail.com", 587, SecureSocketOptions.StartTls);
                await smtp.AuthenticateAsync(_emailSettings.SenderEmail, _emailSettings.SenderPassword);
                await smtp.SendAsync(message);
                await smtp.DisconnectAsync(true);
                Console.WriteLine($"[SUCCESS] OTP sent to: {toEmail}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] {ex.Message}");
                Console.WriteLine($"[DEV FALLBACK] OTP: {otp}");
            }

            return otp;
        }

        public async Task<int> SendPhoneNumber(string mobileNumber)
        {
            string otp = (BetterRandom.NextInt() % 1000000).ToString("000000");
            TwilioClient.Init(_twilio.AccountSID, _twilio.AuthToken);

            string messageBody = $"Your OTP code is: {otp}. Please use this code to complete your verification.";

            var messageResult = await Task.Run(() =>
                MessageResource.Create(
                    body: messageBody,
                    from: new Twilio.Types.PhoneNumber(_twilio.TwilioPhoneNumber),
                    to: new Twilio.Types.PhoneNumber(mobileNumber)
                )
            );
            return Convert.ToInt32(otp);
        }


    }
}
