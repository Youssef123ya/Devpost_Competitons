using System.ComponentModel.DataAnnotations;

namespace MedMonitor.Core.Dto
{
    public class AiPredictionRequestDto
    {
        [Required(ErrorMessage = "HeartRate is required")]
        [Range(0, 300, ErrorMessage = "HeartRate must be between 0 and 300")]
        public int HeartRate { get; set; }

        [Required(ErrorMessage = "SpO2 is required")]
        [Range(0, 100, ErrorMessage = "SpO2 must be between 0 and 100")]
        public float SpO2 { get; set; }

        [Required(ErrorMessage = "SystolicBP is required")]
        [Range(0, 300, ErrorMessage = "SystolicBP must be between 0 and 300")]
        public int SystolicBP { get; set; }

        [Required(ErrorMessage = "DiastolicBP is required")]
        [Range(0, 200, ErrorMessage = "DiastolicBP must be between 0 and 200")]
        public int DiastolicBP { get; set; }

        [Required(ErrorMessage = "Temperature is required")]
        [Range(35, 43, ErrorMessage = "Temperature must be between 35 and 43")]
        public float Temperature { get; set; }

        public string? PatientId { get; set; }

        public string? PatientName { get; set; }

        public bool FallDetected { get; set; } = false;
    }
}
