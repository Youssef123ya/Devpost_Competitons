using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UXFriends.Domain.Entities
{
    public class XPLog
    {
        [Key]
        public string LogCode { get; set; } = string.Empty;
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        public int XP { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string ActivityType { get; set; } = string.Empty; // Lesson, Unit, Section, Challenge, Streak, etc.
        
        public string? ReferenceId { get; set; } // ID of the lesson/unit/section completed
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;
    }
}