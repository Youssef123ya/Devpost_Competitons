import 'package:flutter/material.dart';
import '../models/vital_sign_model.dart';
import '../services/dio_client.dart';

class VitalSignProvider with ChangeNotifier {
  List<VitalSignModel> _allSigns = [];
  bool _isLoading = false;

  List<VitalSignModel> get allSigns => _allSigns;
  bool get isLoading => _isLoading;

  /// جلب العلامات الحيوية لمريض معين
  /// الـ Endpoint: GET /VitalSign/GetByPatient
  Future<void> fetchPatientSigns(String patientId) async {
    _isLoading = true;
    debugPrint('🔍 Fetching vitals for: $patientId');
    // Do not clear existing records to preserve history in memory
    notifyListeners();

    try {
      final response = await DioClient.dio.get(
        '/VitalSign/GetByPatient',
        queryParameters: {'patientId': patientId},
      );

      if (response.statusCode == 200) {
        dynamic raw = response.data;
        debugPrint('🔍 Raw vital sign response type: ${raw.runtimeType}');

        if (raw is Map<String, dynamic>) {
          if (raw.containsKey('rows')) {
            raw = raw['rows'];
          } else if (raw.containsKey('data')) {
            raw = raw['data'];
          }
        }

        List<dynamic> data;
        if (raw is List) {
          data = raw;
        } else if (raw is Map<String, dynamic>) {
          data = [raw];
        } else {
          data = [];
        }

        final fetched = data.map((item) {
          try {
            return VitalSignModel.fromJson(item as Map<String, dynamic>);
          } catch (e) {
            debugPrint('🔍 Error parsing vital sign item: $e');
            return null;
          }
        }).whereType<VitalSignModel>().toList();

        debugPrint('🔍 Response count: ${fetched.length}');
        debugPrint('🔍 Response JSON: ${response.data}');

        // Store the backend snapshot as-is to avoid stale or partial merge bugs
        _allSigns = fetched;
        _allSigns.sort((a, b) => b.recordedAt.compareTo(a.recordedAt));
        debugPrint("Total vitals in memory: ${_allSigns.length}");
      }
    } catch (e) {
      debugPrint("Error fetching vital signs: $e");
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// إضافة علامة حيوية جديدة (للطبيب أو الممرض)
  /// الـ Endpoint: POST /VitalSign/Add
  Future<bool> addVitalSign(VitalSignModel sign) async {
    try {
      final response = await DioClient.dio.post(
        '/VitalSign/Add',
        data: sign.toJson(),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Server may return existing record when skipping duplicate saves
        if (response.data != null) {
          final returned = VitalSignModel.fromJson(response.data);
          if (!_allSigns.any((e) => e.id == returned.id)) {
            _allSigns.add(returned);
          }
        } else {
          if (!_allSigns.any((e) => e.id == sign.id)) {
            _allSigns.add(sign);
          }
        }
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint("Error adding vital sign: $e");
      return false;
    }
  }

  /// جلب كل العلامات (لو احتجتيها في شاشة إحصائيات عامة) - غير متوفر في backend
  Future<void> fetchAllSigns() async {
    _isLoading = true;
    notifyListeners();
    try {
      // لا يوجد /GetAll في VitalSignController
      _allSigns = [];
    } catch (e) {
      debugPrint("Error: $e");
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}