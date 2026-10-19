namespace MedMonitor.Core.Dto
{
    public class VitalSignDto
    {
        public int Id { get; set; }
        public string PatientId { get; set; } = null!;
        public float Temperature { get; set; }
        public int HeartRate { get; set; }
        public int BloodPressure { get; set; }
        
        // OCR Fields
        public int? SpO2 { get; set; }
        public int? EtCO2 { get; set; }
        public int? Pulse { get; set; }
        public int? RespiratoryRate { get; set; }
        
        public DateTime RecordedAt { get; set; }
    }
}
