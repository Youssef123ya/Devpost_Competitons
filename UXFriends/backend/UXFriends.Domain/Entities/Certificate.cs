using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UXFriends.Domain.Entities
{
    public class Certificate
    {
        [Key]
        public string CertificateCode { get; set; } = string.Empty;
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        public string SectionCode { get; set; } = string.Empty;
        
        [Required]
        public string CertificateNo { get; set; } = string.Empty; // Unique certificate number
        
        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;
        
        [ForeignKey(nameof(SectionCode))]
        public Section Section { get; set; } = null!;
    }
}