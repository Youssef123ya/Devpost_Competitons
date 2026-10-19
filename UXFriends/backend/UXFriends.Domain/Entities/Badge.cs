using System.ComponentModel.DataAnnotations;

namespace UXFriends.Domain.Entities
{
    public class Badge
    {
        [Key]
        public string BadgeCode { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string BadgeName { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string BadgeIcon { get; set; } = string.Empty; // URL or icon name
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        public ICollection<UserBadge> UserBadges { get; set; } = new List<UserBadge>();
    }
}