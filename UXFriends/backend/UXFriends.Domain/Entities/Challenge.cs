using System.ComponentModel.DataAnnotations;

namespace UXFriends.Domain.Entities
{
    public class Challenge
    {
        [Key]
        public string ChallengeCode { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        public string Description { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string Difficulty { get; set; } = "Easy"; // Easy, Medium, Hard
        
        public int XpReward { get; set; } = 30;
        
        public bool IsCompleted { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        public ICollection<UserChallenge> UserChallenges { get; set; } = new List<UserChallenge>();
    }
}