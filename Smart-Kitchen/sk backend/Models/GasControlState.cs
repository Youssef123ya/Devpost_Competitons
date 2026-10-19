using System.ComponentModel.DataAnnotations;

namespace SmartKitchen.API.Models;

public class GasControlState
{
    [Key]
    public int Id { get; set; }

    public bool IsEnabled { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
