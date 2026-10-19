import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:med_monitor/services/dio_client.dart';

class ReportsProvider extends ChangeNotifier {
  // Store attachment data: { id, fileUrl }
  // Using List<Map> to keep track of attachment IDs for deletion
  final Map<String, List<Map<String, dynamic>>> _radiology = {};
  final Map<String, List<Map<String, dynamic>>> _laboratory = {};
  final Map<String, List<String>> _dailyReports = {};

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  // AttachmentTypeEnum mapping from backend
  static const int TYPE_REPORT = 1;
  static const int TYPE_SCAN = 2; // radiology
  static const int TYPE_ANALYSIS = 3; // laboratory
  static const int TYPE_OTHER = 4;

  List<Map<String, dynamic>> getRadiology(String patientId) => _radiology[patientId] ?? [];

  List<Map<String, dynamic>> getLaboratory(String patientId) => _laboratory[patientId] ?? [];

  List<String> getDailyReports(String patientId) => _dailyReports[patientId] ?? [];

  Future<void> fetchAttachments(String userId) async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await DioClient.dio.post(
        '/Attachments/GetAttachmentByUserId',
        queryParameters: {'UserId': userId},
      );
      if (response.statusCode == 200 && response.data != null) {
        dynamic data = response.data;
        // normalize to list
        List<dynamic>? rows;
        if (data is Map && data['rows'] is List) rows = List.from(data['rows']);
        else if (data is List) rows = List.from(data);

        _radiology[userId] = [];
        _laboratory[userId] = [];

        if (rows != null) {
          for (var item in rows) {
            try {
              final map = item as Map<String, dynamic>;
              // type may be numeric or string
              final dynamic rawType = map['type'] ?? map['Type'] ?? map['typeName'] ?? map['TypeName'];
              final String fileUrlRaw = (map['fileUrl'] ?? map['FileUrl'] ?? map['attachUrl'] ?? map['AttachUrl'] ?? '') as String;
              if (fileUrlRaw.isEmpty) continue;

              final String rawUrl = fileUrlRaw.trim().replaceAll('\\', '/');
              final String fullUrl;
              if (rawUrl.toLowerCase().startsWith('http://') || rawUrl.toLowerCase().startsWith('https://')) {
                fullUrl = Uri.tryParse(rawUrl)?.toString() ?? Uri.encodeFull(rawUrl);
              } else {
                final encoded = Uri.encodeFull(rawUrl);
                fullUrl = Uri.parse(DioClient.baseUrl).resolve(encoded).toString();
              }
              debugPrint('🔎 [ReportsProvider] Attachment raw URL: $fileUrlRaw -> fullUrl: $fullUrl');

              int typeInt = 0;
              if (rawType is int) typeInt = rawType;
              else if (rawType is String) {
                // try parse numeric string
                typeInt = int.tryParse(rawType) ?? 0;
                if (typeInt == 0) {
                  // convert enum name to int mapping
                  final lowered = rawType.toLowerCase();
                  if (lowered.contains('report')) typeInt = TYPE_REPORT;
                  else if (lowered.contains('scan')) typeInt = TYPE_SCAN;
                  else if (lowered.contains('analysis')) typeInt = TYPE_ANALYSIS;
                  else typeInt = TYPE_OTHER;
                }
              }

              final int attachmentId = map['id'] ?? 0;
              if (typeInt == TYPE_SCAN) {
                _radiology[userId]!.add({'id': attachmentId, 'fileUrl': fullUrl});
              } else if (typeInt == TYPE_ANALYSIS) {
                _laboratory[userId]!.add({'id': attachmentId, 'fileUrl': fullUrl});
              } else if (typeInt == TYPE_REPORT) {
                _dailyReports.putIfAbsent(userId, () => []);
                _dailyReports[userId]!.add(fullUrl);
              }
            } catch (e) {
              debugPrint('Attachment parsing error: $e');
            }
          }
        }
      }
    } catch (e) {
      debugPrint('❌ Fetch attachments error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> uploadImage({
    required String userId,
    required List<int> fileBytes,
    required String fileName,
    required String addBy,
    required int type,
  }) async {
    try {
      final formData = FormData();
      formData.fields.addAll([
        MapEntry('UserId', userId),
        MapEntry('UploadedDate', DateTime.now().toUtc().toIso8601String()),
        MapEntry('AddBy', addBy),
        MapEntry('Type', type.toString()),
        MapEntry('FileName', fileName),
      ]);
      formData.files.add(
        MapEntry('Attachments', MultipartFile.fromBytes(fileBytes, filename: fileName)),
      );

      final response = await DioClient.dio.post('/Attachments/ManageAsync', data: formData);
      if (response.statusCode == 200 && response.data != null) {
        // refresh attachments from server
        await fetchAttachments(userId);
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('❌ Upload error: $e');
      return false;
    }
  }

  void addDailyReport(String patientId, String reportText) {
    _dailyReports.putIfAbsent(patientId, () => []);
    _dailyReports[patientId]!.add(reportText);
    notifyListeners();
  }

  Future<bool> deleteAttachment(int attachmentId, String userId) async {
    try {
      final response = await DioClient.dio.delete(
        '/Attachments/RemoveAttachment?attachmentId=$attachmentId',
      );
      if (response.statusCode == 200) {
        // refresh after delete
        await fetchAttachments(userId);
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('❌ Delete attachment error: $e');
      return false;
    }
  }

  void removeRadiologyImageUrl(String patientId, int index) {
    _radiology[patientId]?.removeAt(index);
    notifyListeners();
  }

  void removeLaboratoryImageUrl(String patientId, int index) {
    _laboratory[patientId]?.removeAt(index);
    notifyListeners();
  }
}
