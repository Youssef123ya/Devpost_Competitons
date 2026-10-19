using System;
using System.ComponentModel.DataAnnotations;

namespace UXFriends.Domain.Entities
{
    public class EmailVerificationToken
    {
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [MaxLength(128)]
        public string TokenHash { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime ExpiresAt { get; set; }

        public bool IsUsed { get; set; }

        public DateTime? UsedAt { get; set; }

        public virtual User? User { get; set; }
    }
}
