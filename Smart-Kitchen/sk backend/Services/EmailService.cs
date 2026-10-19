using System.Net;
using System.Net.Mail;

namespace SmartKitchen.API.Services;

public class EmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendAsync(string name, string email, string message)
    {
        var section = _config.GetSection("ContactEmail");

        Console.WriteLine("=================================");
        Console.WriteLine("CONTACT EMAIL CONFIG");
        Console.WriteLine("=================================");
        Console.WriteLine($"Host: {section["Host"]}");
        Console.WriteLine($"Port: {section["Port"]}");
        Console.WriteLine($"Username: {section["Username"]}");
        Console.WriteLine($"Password Exists: {!string.IsNullOrWhiteSpace(section["Password"])}");
        Console.WriteLine($"SenderEmail: {section["SenderEmail"]}");
        Console.WriteLine($"RecipientEmail: {section["RecipientEmail"]}");
        Console.WriteLine("=================================");

        var host = section["Host"] ?? "smtp.gmail.com";
        var port = int.Parse(section["Port"] ?? "587");

        var username = FirstConfigured(
            section["Username"],
            Environment.GetEnvironmentVariable("SMARTKITCHEN_CONTACT_EMAIL_USERNAME"));

        if (string.IsNullOrWhiteSpace(username))
        {
            throw new InvalidOperationException(
                "Contact email username is not configured.");
        }

        var password = FirstConfigured(
            section["Password"],
            Environment.GetEnvironmentVariable("SMARTKITCHEN_CONTACT_EMAIL_PASSWORD"));

        if (string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException(
                "Contact email password is not configured.");
        }

        var senderEmail = FirstConfigured(section["SenderEmail"], username)!;
        var senderName = section["SenderName"] ?? "Smart Kitchen Contact";
        var recipientEmail = FirstConfigured(section["RecipientEmail"], senderEmail)!;

        using var smtp = new SmtpClient(host)
        {
            Port = port,
            Credentials = new NetworkCredential(username, password),
            EnableSsl = true
        };

        using var mail = new MailMessage
        {
            From = new MailAddress(senderEmail, senderName),
            Subject = $"Message from {name} ({email})",
            Body = $@"
You received a new message from your app:

Name: {name}
Email: {email}

Message:
{message}

-------------------------
Reply directly to respond to the user.",
            IsBodyHtml = false
        };

        mail.To.Add(recipientEmail);
        mail.ReplyToList.Add(new MailAddress(email));

        await smtp.SendMailAsync(mail);
    }

    private static string? FirstConfigured(params string?[] values) =>
        values.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v));
}
