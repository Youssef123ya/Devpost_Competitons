using System.ComponentModel.DataAnnotations;
namespace SmartKitchen.API.Models;
public class SensorReading
{
    [Key]
    public int Id { get; set; }
    public int GasValue { get; set; }
    public bool Light { get; set; }
    public bool Buzzer { get; set; }

    public double Temperature { get; set; }
    public double Humidity { get; set; }
    public bool MotionDetected { get; set; }
    public bool FlameDetected { get; set; }
    public double Distance { get; set; }
    [MaxLength(10)]
    public string LED { get; set; } = "OFF";
    [MaxLength(10)]
    public string GasValve { get; set; } = "CLOSED";
    [MaxLength(10)]
    public string Basket { get; set; } = "CLOSED";
    [MaxLength(10)]
    public string Hand { get; set; } = "NO";
    [MaxLength(10)]
    public string BuzzerState { get; set; } = "OFF";
    [Required, MaxLength(30)]
    public string State { get; set; } = "Normal";
}
