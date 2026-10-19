using System.ComponentModel.DataAnnotations;

namespace UXFriends.Domain.Entities;

public class AIChatSession
{
    [Key]
    [MaxLength(64)]
    public string SessionCode { get; set; } = string.Empty;

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public string MessagesJson { get; set; } = "[]";

    [Required]
    public string ContextSnapshotJson { get; set; } = "{}";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual User? User { get; set; }
}
