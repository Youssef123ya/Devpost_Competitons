using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UXFriends.Domain.Entities
{
    public class GamificationProfile
    {
        [Key]
        public string UserId { get; set; } = string.Empty;
        
        public int TotalXP { get; set; } = 0;
        
        public int Level { get; set; } = 1;
        
        public int CurrentStreakCount { get; set; } = 0;
        
        public DateTime? LastActiveDate { get; set; }
        
        public int LevelProgressPercent { get; set; } = 0; // Progress to next level (0-100)
        
        public int WeeklyRank { get; set; } = 0;
        
        public int TotalBadges { get; set; } = 0;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;
    }
}