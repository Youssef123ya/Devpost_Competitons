using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UXFriends.Domain.Entities
{
    public class Project
    {
        [Key]
        public string ProjectCode { get; set; } = string.Empty;
        
        [Required]
        public string SectionCode { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        public string Description { get; set; } = string.Empty;
        
        public string Requirements { get; set; } = string.Empty; // JSON or HTML
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey(nameof(SectionCode))]
        public Section Section { get; set; } = null!;
        
        public ICollection<ProjectSubmission> Submissions { get; set; } = new List<ProjectSubmission>();
    }
    
    // Project Submission Entity
    public class ProjectSubmission
    {
        [Key]
        public int SubmissionId { get; set; }
        
        [Required]
        public string ProjectCode { get; set; } = string.Empty;
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        public string SubmissionUrl { get; set; } = string.Empty; // Link to uploaded work
        
        public string Description { get; set; } = string.Empty;
        
        [MaxLength(50)]
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
        
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey(nameof(ProjectCode))]
        public Project Project { get; set; } = null!;
        
        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;
    }
}