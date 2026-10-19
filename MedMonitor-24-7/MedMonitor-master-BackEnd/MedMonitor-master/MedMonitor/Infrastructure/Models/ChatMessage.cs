using System;

namespace MedMonitor.Infrastructure.Models
{
    public class ChatMessage
    {
        public int Id { get; set; }
        public string PatientId { get; set; } = null!;
        public string SenderId { get; set; } = null!;
        public string SenderName { get; set; } = null!;
        public string SenderRole { get; set; } = null!;
        public string ReceiverId { get; set; } = null!;
        public string Message { get; set; } = null!;
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; } = false;
    }
}
