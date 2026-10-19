using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UXFriends.Domain.Entities
{
    public class Quiz
    {
        [Key]
        public string QuizCode { get; set; } = string.Empty;
        
        public string? UnitCode { get; set; }
        public string? SectionCode { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string QuizType { get; set; } = string.Empty; // "Unit" or "Section"
        
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        public int TimeLimit { get; set; } // in minutes, 0 = no limit
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey(nameof(UnitCode))]
        public Unit? Unit { get; set; }
        
        [ForeignKey(nameof(SectionCode))]
        public Section? Section { get; set; }
        
        public ICollection<Question> Questions { get; set; } = new List<Question>();
    }
}