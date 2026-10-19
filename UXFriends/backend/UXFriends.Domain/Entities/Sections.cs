using System.ComponentModel.DataAnnotations;

namespace UXFriends.Domain.Entities
{
    public class Section
    {
        [Key]
        public string SectionCode { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;
        
        public int OrderNo { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        public ICollection<Unit> Units { get; set; } = new List<Unit>();
        public ICollection<Project> Projects { get; set; } = new List<Project>();
        public ICollection<Certificate> Certificates { get; set; } = new List<Certificate>();
        public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
    }
}