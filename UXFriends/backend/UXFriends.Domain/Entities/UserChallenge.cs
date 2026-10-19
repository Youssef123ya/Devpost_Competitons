using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UXFriends.Domain.Entities
{
    public class UserChallenge
    {
        [Key]
        public string UserChallengeCode { get; set; } = string.Empty;
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        public string ChallengeCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(64)]
        public string CycleKey { get; set; } = string.Empty;
        
        public DateTime? CompletedAt { get; set; }

        public DateTime? ExpiresAt { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;
        
        [ForeignKey(nameof(ChallengeCode))]
        public Challenge Challenge { get; set; } = null!;
    }
}
