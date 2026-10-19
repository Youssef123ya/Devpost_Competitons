using System;
using System.ComponentModel.DataAnnotations;

namespace UXFriends.Domain.Entities
{
    public class PasswordResetToken
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [MaxLength(6)]
        public string Code { get; set; } = string.Empty;  // 6-digit code

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public DateTime ExpiresAt { get; set; }  // Valid for 10 minutes

        public bool IsUsed { get; set; } = false;

        public DateTime? UsedAt { get; set; }

        // Navigation
        public virtual User User { get; set; } = null!;
    }
}