namespace MedMonitor.Core.Dto
{
    public class AiPredictionResponseDto
    {
        public string AlertLevel { get; set; } = null!;
        public double Confidence { get; set; }
        public string Reason { get; set; } = null!;
        public DateTime PredictionTime { get; set; } = DateTime.UtcNow;
        // List of individual abnormal vital descriptions (e.g. "SpO2 low: 88%")
        public List<string> AbnormalVitals { get; set; } = new();
        // Count of abnormal vitals
        public int AbnormalCount { get; set; }
    }
}
