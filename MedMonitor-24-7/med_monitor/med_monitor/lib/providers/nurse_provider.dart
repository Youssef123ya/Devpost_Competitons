import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../services/dio_client.dart';

class NurseProvider with ChangeNotifier {

  bool _isLoading = false;
  List<dynamic> _units = [];
  List<dynamic> _nurseTasks = [];

  bool get isLoading => _isLoading;
  List<dynamic> get units => _units;
  List<dynamic> get nurseTasks => _nurseTasks;

  /// ✅ جلب جميع الأقسام (Units) من السواجر
  Future<void> fetchAllUnits() async {
    _isLoading = true;
    //notifyListeners(); // لو حابة الشاشة تظهر لودينج فوراً

    try {
      // ملحوظة: لا يوجد UnitController في backend، لذا داتا تجريبية
      _units = [
        {"name": "ICU - A"},
        {"name": "ICU - B"},
        {"name": "ER - C"},
        {"name": "Surgery - D"},
      ];
    } catch (e) {
      debugPrint("Error fetching units: $e");
      // لو الـ API لسه مش جاهز، ممكن نسيبها لستة تجريبية عشان الديزاين ميبوظش
      _units = [
        {"name": "ICU - A"},
        {"name": "ICU - B"},
        {"name": "ER - C"},
        {"name": "Surgery - D"},
      ];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// ✅ جلب المهام الخاصة بالممرض (Swagger: /Task/GetAll)
  Future<void> fetchNurseTasks(String nurseId) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await DioClient.dio.get('/Task/GetAll');

      if (response.statusCode == 200) {
        _nurseTasks = response.data;
      }
    } catch (e) {
      debugPrint("Error fetching nurse tasks: $e");
      _nurseTasks = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// ✅ تحديث حالة مهمة (Swagger: /Task/ChangeStatus)
  Future<bool> updateTaskStatus(int taskId, int status) async {
    try {
      final response = await DioClient.dio.post('/Task/ChangeStatus', data: {
        "id": taskId,
        "status": status,
      });
      return response.statusCode == 200;
    } catch (e) {
      debugPrint("Error updating task: $e");
      return false;
    }
  }
}