using MedMonitor.Core.Dto;
using MedMonitor.Core.Interfaces;

namespace MedMonitor.Core.Business
{
    /// <summary>
    /// Service for AI Alert Prediction
    /// Uses rule-based simulation for predicting patient health alerts
    /// Note: This is a demonstration implementation for graduation project
    /// In production, this would integrate with actual ML models
    /// </summary>
    public class AIAlertService : IAIAlertService
    {
        private readonly ILogger<AIAlertService> _logger;

        public AIAlertService(ILogger<AIAlertService> logger)
        {
            _logger = logger;
        }

        public async Task<AiPredictionResponseDto> PredictAlertLevelAsync(AiPredictionRequestDto request)
        {
            try
            {
                _logger.LogInformation("Starting AI alert prediction for vital signs analysis");

                var prediction = AnalyzeVitals(request);

                _logger.LogInformation($"Prediction completed: {prediction.AlertLevel} - Confidence: {prediction.Confidence}%");

                return await Task.FromResult(prediction);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error during AI prediction: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Analyzes vital signs using rule-based logic to determine alert level
        /// </summary>
        private AiPredictionResponseDto AnalyzeVitals(AiPredictionRequestDto vitals)
        {
            var response = new AiPredictionResponseDto();
            var reasons = new List<string>();
            double confidence = 100.0;

            // Check for CRITICAL conditions
            if (IsCritical(vitals, reasons, ref confidence))
            {
                response.AlertLevel = "Critical";
            }
            // Check for WARNING conditions
            else if (IsWarning(vitals, reasons, ref confidence))
            {
                response.AlertLevel = "Warning";
            }
            // Otherwise NORMAL
            else
            {
                response.AlertLevel = "Normal";
                reasons.Add("All vital signs are within normal range.");
                confidence = 95.0;
            }

            response.Confidence = confidence;
            response.Reason = string.Join(" ", reasons);
            // Populate structured abnormal vitals for client UI
            response.AbnormalVitals = reasons;
            response.AbnormalCount = reasons.Count;

            return response;
        }

        /// <summary>
        /// Evaluates critical conditions
        /// </summary>
        private bool IsCritical(AiPredictionRequestDto vitals, List<string> reasons, ref double confidence)
        {
            bool isCritical = false;

            // Critical: SpO2 < 85 (Severe Hypoxemia)
            if (vitals.SpO2 < 85)
            {
                reasons.Add($"Critical hypoxemia detected: SpO2 {vitals.SpO2}% (Normal: 95-100%).");
                isCritical = true;
                confidence = 98.5;
            }

            // Critical: Heart Rate > 140 (Severe Tachycardia)
            if (vitals.HeartRate > 140)
            {
                reasons.Add($"Severe tachycardia detected: Heart Rate {vitals.HeartRate} bpm (Normal: 60-100 bpm).");
                isCritical = true;
                confidence = Math.Max(confidence, 97.0);
            }

            // Critical: Systolic BP < 80 (Severe Hypotension)
            if (vitals.SystolicBP < 80)
            {
                reasons.Add($"Severe hypotension detected: Systolic BP {vitals.SystolicBP} mmHg (Normal: 90-120 mmHg).");
                isCritical = true;
                confidence = Math.Max(confidence, 98.0);
            }

            // Critical: Temperature > 39.5 (High Fever)
            if (vitals.Temperature > 39.5)
            {
                reasons.Add($"High fever detected: Temperature {vitals.Temperature}°C (Critical: >39.5°C).");
                isCritical = true;
                confidence = 96.5;
            }

            // Critical: Fall detected with abnormal vitals
            if (vitals.FallDetected && (vitals.HeartRate > 120 || vitals.SpO2 < 94))
            {
                if (!reasons.Any(r => r.Contains("Fall")))
                {
                    reasons.Add("Patient fall detected with abnormal vital response.");
                    isCritical = true;
                    confidence = Math.Max(confidence, 94.5);
                }
            }

            return isCritical;
        }

        /// <summary>
        /// Evaluates warning conditions
        /// </summary>
        private bool IsWarning(AiPredictionRequestDto vitals, List<string> reasons, ref double confidence)
        {
            bool isWarning = false;

            // Warning: SpO2 90-94 (Mild Hypoxemia)
            if (vitals.SpO2 >= 85 && vitals.SpO2 < 95)
            {
                reasons.Add($"Mild oxygen saturation concern: SpO2 {vitals.SpO2}% (Optimal: 95-100%).");
                isWarning = true;
                confidence = 88.0;
            }

            // Warning: Heart Rate 100-140 (Tachycardia)
            if (vitals.HeartRate >= 100 && vitals.HeartRate <= 140)
            {
                reasons.Add($"Elevated heart rate: {vitals.HeartRate} bpm (Normal: 60-100 bpm).");
                isWarning = true;
                confidence = Math.Max(confidence, 85.0);
            }

            // Warning: Systolic BP 80-90 or >130 (Borderline)
            if ((vitals.SystolicBP >= 80 && vitals.SystolicBP < 90) || vitals.SystolicBP > 130)
            {
                if (vitals.SystolicBP < 90)
                {
                    reasons.Add($"Low blood pressure: Systolic BP {vitals.SystolicBP} mmHg.");
                }
                else
                {
                    reasons.Add($"Elevated blood pressure: Systolic BP {vitals.SystolicBP} mmHg.");
                }
                isWarning = true;
                confidence = Math.Max(confidence, 82.0);
            }

            // Warning: Temperature 37.8-39.5 (Mild Fever)
            if (vitals.Temperature > 37.8 && vitals.Temperature <= 39.5)
            {
                reasons.Add($"Elevated temperature: {vitals.Temperature}°C (Normal: 36.5-37.5°C).");
                isWarning = true;
                confidence = Math.Max(confidence, 80.0);
            }

            // Warning: Fall detected even with normal vitals
            if (vitals.FallDetected && vitals.HeartRate <= 120 && vitals.SpO2 >= 94)
            {
                reasons.Add("Patient fall detected. Monitor closely for delayed symptoms.");
                isWarning = true;
                confidence = Math.Max(confidence, 75.0);
            }

            // Warning: Diastolic BP concerns
            if (vitals.DiastolicBP > 90)
            {
                reasons.Add($"Elevated diastolic pressure: {vitals.DiastolicBP} mmHg (Normal: <80 mmHg).");
                isWarning = true;
                confidence = Math.Max(confidence, 78.0);
            }

            return isWarning;
        }
    }
}
