namespace MedMonitor.Extenstions
{
    public class EmailSettings
    {
        public string SmtpServer { get; set; } = null!;
        public int Port { get; set; }
        public string SenderEmail { get; set; } = null!;
        public string SenderPassword { get; set; } = null!;
        public bool EnableSsl { get; set; }
        public string SenderName { get; set; } = null!;
    }
}
