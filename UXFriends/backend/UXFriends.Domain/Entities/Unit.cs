using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UXFriends.Domain.Entities
{
    public class Unit
    {
        [Key]
        public string UnitCode { get; set; } = string.Empty;
        
        [Required]
        public string SectionCode { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;
        
        public int OrderNo { get; set; }
        
        public int Duration { get; set; } // in minutes
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey(nameof(SectionCode))]
        public Section Section { get; set; } = null!;
        
        public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
        public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
    }
}