using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UXFriends.Domain.Entities
{
    public class LessonProgress
    {
        [Key]
        public int ProgressId { get; set; }
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        public string LessonCode { get; set; } = string.Empty;
        
        public int ProgressPercent { get; set; } = 0; // 0-100
        
        public DateTime? CompletedAt { get; set; }
        
        [MaxLength(50)]
        public string Status { get; set; } = "NotStarted"; // NotStarted, InProgress, Completed
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;
        
        [ForeignKey(nameof(LessonCode))]
        public Lesson Lesson { get; set; } = null!;
    }
}