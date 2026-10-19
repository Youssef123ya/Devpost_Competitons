class AiPredictionResponse {
  final bool success;
  final AiPredictionData? data;
  final String? message;

  AiPredictionResponse({
    required this.success,
    this.data,
    this.message,
  });

  factory AiPredictionResponse.fromJson(Map<String, dynamic> json) {
    return AiPredictionResponse(
      success: json['success'] ?? false,
      data: json['data'] != null ? AiPredictionData.fromJson(json['data']) : null,
      message: json['message'],
    );
  }
}

class AiPredictionData {
  final String alertLevel; // Critical, Warning, Normal
  final double confidence;
  final String mainReason;
  final int abnormalCount;
  final List<String> abnormalVitals;
  final String timestamp;

  AiPredictionData({
    required this.alertLevel,
    required this.confidence,
    required this.mainReason,
    required this.abnormalCount,
    required this.abnormalVitals,
    required this.timestamp,
  });

  factory AiPredictionData.fromJson(Map<String, dynamic> json) {
    return AiPredictionData(
      alertLevel: json['alert_level'] ?? json['alertLevel'] ?? 'Normal',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
      mainReason: json['main_reason'] ?? json['reason'] ?? 'Unknown',
      abnormalCount: json['abnormalCount'] ?? json['abnormal_count'] ?? 0,
      abnormalVitals: List<String>.from(json['abnormalVitals'] ?? json['abnormal_vitals'] ?? []),
      timestamp: json['timestamp'] ?? json['predictionTime'] ?? DateTime.now().toIso8601String(),
    );
  }
}
