import 'package:flutter/material.dart';
import '../models/ai_prediction_model.dart';
import '../services/ai_alert_service.dart';

class AiAlertProvider with ChangeNotifier {
  AiPredictionData? _lastPrediction;
  bool _isAnalyzing = false;
  String? _errorMessage;

  AiPredictionData? get lastPrediction => _lastPrediction;
  bool get isAnalyzing => _isAnalyzing;
  String? get errorMessage => _errorMessage;

  Future<void> analyzeVitals({
    required int heartRate,
    required int spO2,
    required int systolicBP,
    required int diastolicBP,
    required double temperature,
    required bool fallDetected,
    String? patientId,
    String? patientName,
  }) async {
    _isAnalyzing = true;
    _errorMessage = null;
    notifyListeners();

    final response = await AiAlertService.fetchAiPrediction(
      heartRate: heartRate,
      spO2: spO2,
      systolicBP: systolicBP,
      diastolicBP: diastolicBP,
      temperature: temperature,
      fallDetected: fallDetected,
      patientId: patientId,
      patientName: patientName,
    );

    if (response.success && response.data != null) {
      _lastPrediction = response.data;
    } else {
      _errorMessage = response.message ?? "Analysis failed";
    }

    _isAnalyzing = false;
    notifyListeners();
  }

  Color getAlertColor() {
    if (_lastPrediction == null) return Colors.grey;
    switch (_lastPrediction!.alertLevel.toLowerCase()) {
      case 'critical':
        return Colors.red;
      case 'warning':
        return Colors.orange;
      case 'normal':
        return Colors.green;
      default:
        return Colors.blue;
    }
  }
}
