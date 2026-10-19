using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UXFriends.Domain.Entities
{
    public class AIAgent
    {
        [Key]
        public string AgentId { get; set; } = string.Empty;
        
        [MaxLength(100)]
        public string ModelVersion { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        public ICollection<AIReport> Reports { get; set; } = new List<AIReport>();
    }
    
    public class AIReport
    {
        [Key]
        public int ReportId { get; set; }
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        public string AgentId { get; set; } = string.Empty;
        
        public string ReportType { get; set; } = "Weekly"; // Weekly, Monthly
        
        public string Strengths { get; set; } = string.Empty; // JSON
        
        public string Weaknesses { get; set; } = string.Empty; // JSON
        
        public string Recommendations { get; set; } = string.Empty; // JSON
        
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;
        
        [ForeignKey(nameof(AgentId))]
        public AIAgent Agent { get; set; } = null!;
    }
}