import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../models/ai_prediction_model.dart';
import 'dio_client.dart';

class AiAlertService {
  /// Sends vital signs and fall status to get an AI-based prediction.
  static Future<AiPredictionResponse> fetchAiPrediction({
    required int heartRate,
    required int spO2,
    required int systolicBP,
    required int diastolicBP,
    required double temperature,
    required bool fallDetected,
    String? patientId,
    String? patientName,
  }) async {
    try {
      debugPrint('[AIAlertService] patientId=${patientId ?? "(none)"}');
      debugPrint('[AIAlertService] patientName=${patientName ?? "(none)"}');
      debugPrint('[AIAlertService] Preparing AI Predict request');

      final queryParameters = <String, dynamic>{};
      if (patientId != null && patientId.isNotEmpty) {
        queryParameters['patientId'] = patientId;
      }
      if (patientName != null && patientName.isNotEmpty) {
        queryParameters['patientName'] = patientName;
      }

      final requestBody = {
        "heartRate": heartRate,
        "spO2": spO2,
        "systolicBP": systolicBP,
        "diastolicBP": diastolicBP,
        "temperature": temperature,
        "fallDetected": fallDetected,
        if (patientId != null && patientId.isNotEmpty) "patientId": patientId,
        if (patientName != null && patientName.isNotEmpty) "patientName": patientName,
      };

      debugPrint('[AIAlertService] AI Predict queryParameters: $queryParameters');
      debugPrint('[AIAlertService] AI Predict requestBody: $requestBody');

      final response = await DioClient.dio.post(
        '/AIAlert/Predict',
        queryParameters: queryParameters.isNotEmpty ? queryParameters : null,
        data: requestBody,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return AiPredictionResponse.fromJson(response.data);
      } else {
        return AiPredictionResponse(
          success: false, 
          message: "Server returned error: ${response.statusCode}"
        );
      }
    } on DioException catch (e) {
      debugPrint("AI Prediction Error: ${e.response?.data ?? e.message}");
      return AiPredictionResponse(
        success: false, 
        message: e.response?.data?['message'] ?? e.message
      );
    } catch (e) {
      debugPrint("Unexpected Error in fetchAiPrediction: $e");
      return AiPredictionResponse(
        success: false, 
        message: e.toString()
      );
    }
  }
}
