using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UXFriends.Domain.Entities
{
    public class UserBadge
    {
        [Key]
        public string UserBadgeCode { get; set; } = string.Empty;
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        public string BadgeCode { get; set; } = string.Empty;
        
        public DateTime EarnedAt { get; set; } = DateTime.UtcNow;
        
        public bool IsUnlocked { get; set; } = true;
        
        // Navigation Properties
        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;
        
        [ForeignKey(nameof(BadgeCode))]
        public Badge Badge { get; set; } = null!;
    }
}