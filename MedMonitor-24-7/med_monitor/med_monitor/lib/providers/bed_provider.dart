import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../services/dio_client.dart';
import '../models/bed.dart';

class BedProvider with ChangeNotifier {
  final Dio _dio = DioClient.dio;
  final String baseUrl = "";

  List<Bed> _beds = [];  // ✅ FIXED: Now typed, not dynamic
  bool _isLoading = false;

  List<Bed> get beds => _beds;
  bool get isLoading => _isLoading;

  // ✅ Type-safe calculation of occupied beds
  int get occupiedCount => _beds.where((bed) => bed.status == 1).length;
  int get totalBedsCount => _beds.length;

  /// 1. جلب كل السراير من السيرفر
  Future<void> fetchAllBeds() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _dio.get('/Bed/GetAll');
      if (response.statusCode == 200) {
        // ✅ FIXED: Deserialize JSON to typed Bed objects
        _beds = (response.data as List)
            .map((json) => Bed.fromJson(json as Map<String, dynamic>))
            .toList();
        
        debugPrint('✅ Successfully loaded ${_beds.length} beds');
        
        // ✅ Debug logging to verify patient data is populated
        for (var bed in _beds) {
          debugPrint('Bed ${bed.bedNumber}: Status=${bed.status}, Patient=${bed.patientName}, Age=${bed.patientAge}');
        }
      }
    } catch (e) {
      debugPrint("❌ Fetch Beds Error: $e");
      // ✅ FIXED: Don't use fake fallback data - let UI handle empty state
      _beds = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// 2. حذف مريض من سرير (Discharge)
  Future<bool> removePatientFromBed(int bedId) async {
    try {
      final response = await _dio.post(
        '/Bed/RemovePatient',
        queryParameters: {'bedId': bedId},
      );

      if (response.statusCode == 200 && response.data == true) {
        debugPrint('✅ Successfully removed patient from bed $bedId');
        await fetchAllBeds();
        notifyListeners();
        return true;
      }

      debugPrint('⚠️ RemovePatient returned unexpected result: ${response.data}');
      return false;
    } catch (e) {
      debugPrint("❌ Remove Patient Error: $e");
      return false;
    }
  }

  /// 3. تسكين مريض على سرير (Assign)
  Future<void> assignPatientToBed(int bedId, String patientId) async {
    try {
      final response = await _dio.post('/Bed/AssignPatient', data: {
        "bedId": bedId,
        "patientId": patientId
      });

      if (response.statusCode == 200) {
        debugPrint('✅ Successfully assigned patient $patientId to bed $bedId');
        await fetchAllBeds();
      }
    } catch (e) {
      debugPrint("❌ Assign Patient Error: $e");
      rethrow; // Let caller handle the error
    }
  }

  /// 4. إنشاء سرير جديد (Create a new bed)
  Future<Bed?> createBed(String bedNumber) async {
    try {
      final response = await _dio.post('/Bed/Create', data: {
        'bedNumber': bedNumber,
        'status': 0,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        debugPrint('✅ Created bed $bedNumber');
        if (response.data is Map<String, dynamic>) {
          return Bed.fromJson(response.data as Map<String, dynamic>);
        }
      }
    } catch (e) {
      debugPrint('❌ Create Bed Error: $e');
      rethrow;
    }
    return null;
  }

  /// Get a specific bed by ID
  Bed? getBedById(int bedId) {
    try {
      return _beds.firstWhere((bed) => bed.id == bedId);
    } catch (e) {
      return null;
    }
  }

  /// Get a specific bed by bed number
  Bed? getBedByNumber(String bedNumber) {
    try {
      return _beds.firstWhere((bed) => bed.bedNumber == bedNumber);
    } catch (e) {
      return null;
    }
  }

  /// Get all occupied beds
  List<Bed> getOccupiedBeds() => _beds.where((bed) => bed.isOccupied).toList();

  /// Get all available beds
  List<Bed> getAvailableBeds() => _beds.where((bed) => bed.isAvailable).toList();

  /// Get all beds under maintenance
  List<Bed> getMaintenanceBeds() => _beds.where((bed) => bed.isMaintenance).toList();
}