import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'dart:convert';
import '../models/user_model.dart';
import '../services/dio_client.dart';

class DoctorProvider with ChangeNotifier {
  final Dio _dio = DioClient.instance;
  final String baseUrl = DioClient.baseUrl;

  List<dynamic> _beds = [];
  List<dynamic> _tasks = [];
  bool _isLoading = false;

  List<dynamic> get beds => _beds;
  List<dynamic> get tasks => _tasks;
  bool get isLoading => _isLoading;

  // ------------------- (1) السراير - Beds -------------------

  /// جلب السراير (Swagger: /Bed/GetAll)
  Future<void> fetchBeds() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _dio.get('/Bed/GetAll');

      if (response.statusCode == 200) {
        _beds = response.data;
        debugPrint("Successfully fetched ${_beds.length} beds");
      }
    } catch (e) {
      debugPrint("Dio Error (Fetch Beds): $e");
      _beds = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// جلب السراير حسب الوحدة (Swagger: /Bed/GetByUnit)
  Future<void> fetchBedsByUnit(String unitId) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _dio.get(
        '/Bed/GetByUnit',
        queryParameters: {"unitId": unitId},
      );

      if (response.statusCode == 200) {
        _beds = response.data;
      }
    } catch (e) {
      debugPrint("Dio Error (Fetch Beds By Unit): $e");
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ------------------- (2) المهام - Tasks -------------------

  Future<void> fetchAllTasks() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _dio.get('/Task/GetAll');

      if (response.statusCode == 200) {
        _tasks = response.data;
        debugPrint("Successfully fetched ${_tasks.length} tasks");
      }
    } catch (e) {
      debugPrint("Dio Error (Fetch Tasks): $e");
      _tasks = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<List<UserModel>> fetchNurses() async {
    try {
      debugPrint('=== FETCH NURSES PROVIDER DEBUG ===');
      debugPrint('Requesting: ${_dio.options.baseUrl}/Users');

      final response = await _dio.get('/Users');

      debugPrint('Status: ${response.statusCode}');
      debugPrint('Data type: ${response.data.runtimeType}');

      List<dynamic> usersList = [];

      if (response.data is Map && response.data['rows'] is List) {
        usersList = response.data['rows'] as List;
        debugPrint('Unwrapped from rows key. Count: ${usersList.length}');
      } else if (response.data is Map && response.data['data'] is List) {
        usersList = response.data['data'] as List;
        debugPrint('Unwrapped from data key. Count: ${usersList.length}');
      } else if (response.data is List) {
        usersList = response.data as List;
        debugPrint('Direct list. Count: ${usersList.length}');
      } else {
        debugPrint('Unexpected format: ${response.data}');
        return [];
      }

      final List<UserModel> allUsers = usersList
          .map((item) {
            try {
              return UserModel.fromJson(item as Map<String, dynamic>);
            } catch (e) {
              debugPrint('Parse error for item: $item → $e');
              return null;
            }
          })
          .whereType<UserModel>()
          .toList();

      debugPrint('Total users parsed: ${allUsers.length}');
      debugPrint('All roles: ${allUsers.map((u) => u.role).toList()}');

      final nurses = allUsers.where((u) => u.role == 3).toList();

      debugPrint('Nurses found: ${nurses.length}');
      debugPrint('Nurse names: ${nurses.map((n) => n.userName).toList()}');

      return nurses;
    } catch (e) {
      debugPrint('Dio Error (fetchNurses): $e');
      return [];
    }
  }

  Future<bool> createTask({
    required String taskName,
    required String patientId,
    required String patientName,
    required String nurseId,
    required String nurseName,
    required String date,
    required String startTime,
    required String endTime,
    required String note,
    required String color,
    required String remind,
    required String repeat,
    required String doctorId,
  }) async {
    try {
      // Combine date and time to create proper ISO 8601 DateTime format
      // date: "2026-05-30T00:00:00", startTime: "11:42:00" → "2026-05-30T11:42:00"
      final dateOnly = date.split('T')[0];  // Extract "2026-05-30"
      final startTimeIso = "${dateOnly}T${startTime}";  // "2026-05-30T11:42:00"
      final endTimeIso = "${dateOnly}T${endTime}";      // "2026-05-30T12:42:00"

      final requestBody = {
        "id": 0,  // New task
        "title": taskName,  // Changed from taskName to match backend DTO
        "notes": note,  // Changed from note to match backend DTO
        "startTime": startTimeIso,  // Full ISO 8601 DateTime
        "endTime": endTimeIso,  // Full ISO 8601 DateTime
        "status": 1,  // TaskStatusEnum.New (required field)
        "doctorId": doctorId,
        "nurseId": nurseId,
        "patientId": patientId,
        // Removed extra fields: patientName, nurseName, date, color, remind, repeat
      };

      print('');
      print('╔════════════════════════════════════════════════════════════════╗');
      print('║       🟢 DOCTOR PROVIDER - createTask() CORRECTED REQUEST     ║');
      print('╚════════════════════════════════════════════════════════════════╝');
      print('📤 Endpoint: ${_dio.options.baseUrl}/Task/Create');
      print('');
      print('📦 EXACT REQUEST BODY JSON:');
      print(jsonEncode(requestBody));
      print('');
      print('📋 CORRECTED FIELD MAPPING:');
      print('  API Contract Fields (TaskDto.cs):');
      print('    - id: 0 (new task)');
      print('    - title: "$taskName" (was taskName, now title)');
      print('    - notes: "$note" (was note, now notes)');
      print('    - startTime: "$startTimeIso" (combined date+time to ISO 8601)');
      print('    - endTime: "$endTimeIso" (combined date+time to ISO 8601)');
      print('    - status: 1 (TaskStatusEnum.New - ADDED)');
      print('    - doctorId: "$doctorId"');
      print('    - nurseId: "$nurseId"');
      print('    - patientId: "$patientId"');
      print('');
      print('  Extra fields REMOVED:');
      print('    - date, patientName, nurseName, color, remind, repeat');
      print('');
      print('⏳ Posting request...');
      print('─' * 64);

      final response = await _dio.post(
        '/Task/Create',
        data: requestBody,
      );

      print('─' * 64);
      print('📥 RESPONSE FROM BACKEND:');
      print('Status Code: ${response.statusCode}');
      print('Response Data: ${response.data.toString()}');
      print('');

      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅ Task created successfully');
        await fetchAllTasks();
        print('╚════════════════════════════════════════════════════════════════╝');
        print('');
        return true;
      }
      print('❌ Unexpected status code: ${response.statusCode}');
      print('╚════════════════════════════════════════════════════════════════╝');
      print('');
      return false;
    } catch (e) {
      print('─' * 64);
      print('❌ EXCEPTION CAUGHT:');
      print('Error Type: ${e.runtimeType}');
      print('Error Message: $e');
      print('');
      print('Full Error: $e');
      print('╚════════════════════════════════════════════════════════════════╝');
      print('');
      debugPrint("Dio Error (Create Task): $e");
      return false;
    }
  }

  // ------------------- (3) العلامات الحيوية والطلبات -------------------

  /// جلب العلامات الحيوية (Swagger: /VitalSign/GetByPatient)
  Future<void> fetchVitalSigns(dynamic patientId) async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _dio.get(
        '/VitalSign/GetByPatient',
        queryParameters: {"patientId": patientId},
      );
      if (response.statusCode == 200) {
        // Update local state if needed
      }
    } catch (e) {
      debugPrint("Dio Error (Fetch Vitals): $e");
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// متوافق مع الكود القديم
  Future<List<dynamic>> fetchPatientVitals(dynamic patientId) async {
    try {
      final response = await _dio.get(
        '/VitalSign/GetByPatient',
        queryParameters: {"patientId": patientId},
      );
      return response.statusCode == 200 ? response.data : [];
    } catch (e) {
      debugPrint("Dio Error (Fetch Vitals): $e");
      return [];
    }
  }

  Future<bool> createAdmissionRequest({
    required String doctorId,
    required String patientName,
    required String patientId,
    required int age,
    required String gender,
    int height = 0,
    required int weight,
    required String illness,
    required String companionPhone,
    required String nurseName,
    required int status,
    String? medicalHistory,
    String? diagnosis,
  }) async {
    try {
      final response = await _dio.post(
        '/AdmissionRequest/Create',
        data: {
          "id": 0,
          "doctorId": doctorId,
          "patientName": patientName,
          "patientId": patientId,
          "age": age,
          "gender": gender,
          "height": height,  // ✅ FIXED: Send height correctly
          "weight": weight,  // ✅ FIXED: Send weight correctly
          "illness": illness,
          "companionPhone": companionPhone,
          "nurseName": nurseName,
          "medicalHistory": medicalHistory ?? "",
          "diagnosis": diagnosis ?? "",
          "status": status,
        },
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint("Dio Error (Create Admission): $e");
      return false;
    }
  }
}
