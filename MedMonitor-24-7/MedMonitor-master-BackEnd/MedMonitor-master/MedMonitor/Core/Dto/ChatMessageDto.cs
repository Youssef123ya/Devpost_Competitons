using System;

namespace MedMonitor.Core.Dto
{
    public class ChatMessageDto
    {
        public int Id { get; set; }
        public string PatientId { get; set; } = null!;
        public string SenderId { get; set; } = null!;
        public string SenderName { get; set; } = null!;
        public string SenderRole { get; set; } = null!;
        public string ReceiverId { get; set; } = null!;
        public string Message { get; set; } = null!;
        public DateTime SentAt { get; set; }
        public bool IsRead { get; set; }
    }
}
