using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UXFriends.Domain.Entities
{
    public class LeaderboardEntry
    {
        [Key]
        public string EntryCode { get; set; } = string.Empty;
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        public int Rank { get; set; }
        
        public int Score { get; set; } // XP earned in the week
        
        public DateTime WeekStartDate { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;
    }
}