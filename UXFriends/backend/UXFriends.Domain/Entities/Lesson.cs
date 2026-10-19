using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UXFriends.Domain.Entities
{
    public class Lesson
    {
        [Key]
        public string LessonCode { get; set; } = string.Empty;
        
        [Required]
        public string UnitCode { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;
        
        public string Content { get; set; } = string.Empty; // Rich text/HTML content
        
        public int OrderNo { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey(nameof(UnitCode))]
        public Unit Unit { get; set; } = null!;
        
        public ICollection<LessonProgress> ProgressRecords { get; set; } = new List<LessonProgress>();
        public ICollection<UserNote> Notes { get; set; } = new List<UserNote>();
    }
}