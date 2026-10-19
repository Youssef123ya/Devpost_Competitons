using MedMonitor.Core.Dto;

namespace MedMonitor.Core.Interfaces
{
    /// <summary>
    /// Interface for AI Alert Prediction Service
    /// Analyzes patient vital signs and predicts alert levels
    /// </summary>
    public interface IAIAlertService
    {
        /// <summary>
        /// Predicts alert level based on patient vital signs
        /// </summary>
        /// <param name="request">Patient vital signs data</param>
        /// <returns>AI prediction with alert level, confidence, and reason</returns>
        Task<AiPredictionResponseDto> PredictAlertLevelAsync(AiPredictionRequestDto request);
    }
}
