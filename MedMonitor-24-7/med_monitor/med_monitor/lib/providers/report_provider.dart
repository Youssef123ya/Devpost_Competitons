import 'package:flutter/material.dart';
import '../models/report_model.dart';
import '../services/dio_client.dart';

class ReportProvider with ChangeNotifier {
  List<PatientReportModel> _reports = [];
  bool _isLoading = false;

  List<PatientReportModel> get reports => _reports;
  bool get isLoading => _isLoading;

  // جلب التقارير من السيرفر (Swagger: /Attachments/GetAttachmentByUserId)
  Future<void> fetchReports(String patientId) async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await DioClient.dio.post(
        '/Attachments/GetAttachmentByUserId',
        queryParameters: {'UserId': patientId},
      );
      if (response.statusCode == 200) {
        final data = response.data;
        if (data is Map && data['rows'] is List) {
          _reports = (data['rows'] as List).map((json) => PatientReportModel.fromJson(json)).toList();
        } else if (data is List) {
          _reports = data.map((json) => PatientReportModel.fromJson(json)).toList();
        } else {
          _reports = [];
        }
      }
    } catch (e) {
      debugPrint("Fetch Reports Error: $e");
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
