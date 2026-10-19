import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/dashboard_stats_model.dart';
import '../models/user_model.dart';
import 'dio_client.dart';

class ApiService {
  // Use shared DioClient base URL logic for consistent backend connection.
  static final String baseUrl = DioClient.baseUrl;
  // Fallback base URL for local development (useful for web / emulators)
  static const String fallbackBaseUrl = "http://localhost:5140";

  static final Dio _dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 20),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  static Future<void> _addTokenToHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token') ?? '';
    if (token.isNotEmpty) {
      _dio.options.headers['Authorization'] = 'Bearer $token';
    }
  }

  // ── 1. تسجيل الدخول (حسب الـ Swagger: LoginContoller/loginUser) ──
  static Future<UserModel?> login(String userName, String password) async {
    try {
      final response = await _dio.post(
        '/LoginContoller/loginUser', // ✅ المسمى الصحيح من الباك إيند
        data: {
          'userName': userName,
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data;

        final prefs = await SharedPreferences.getInstance();
        // تأكدي من مسمى حقل التوكن في الرد (غالباً token أو data['token'])
        if (data['token'] != null) {
          await prefs.setString('auth_token', data['token']);
        }

        // تحويل البيانات لـ UserModel (تأكدي من شكل الـ JSON الراجع)
        return UserModel.fromJson(data['user'] ?? data);
      }
    } on DioException catch (e) {
      debugPrint("Dio Error: ${e.response?.data ?? e.message}");
    }
    return null;
  }

  // ── 2. جلب الطلبات المعلقة (حسب الـ Swagger: AdmissionRequest/GetPending) ──
  static Future<List<dynamic>> getPendingRequests() async {
    try {
      await _addTokenToHeaders();
      final response = await _dio.get('/AdmissionRequest/GetPending');
      return response.data as List;
    } catch (e) {
      debugPrint("Pending Requests Error: $e");
      return [];
    }
  }

  // ── 3. جلب بيانات لوحة التحكم ──
  static Future<DashboardStatsModel?> getDashboardStats() async {
    // If running on Web, prefer localhost (avoids emulator/host routing issues)
    if (kIsWeb) {
      _dio.options.baseUrl = fallbackBaseUrl;
      debugPrint('🌐 Running on Web - using fallback baseUrl: ${_dio.options.baseUrl}');
    }
    // Try primary baseUrl first; if it fails, attempt fallback (localhost)
    final originalBase = _dio.options.baseUrl;
    try {
      await _addTokenToHeaders();
      final response = await _dio.get('/Dashboard/Stats');

      // ✅ DEBUG: Print raw response
      debugPrint('📡 Dashboard Stats Raw Response: ${response.data}');
      debugPrint('📡 Response Type: ${response.data.runtimeType}');

      if (response.statusCode == 200) {
        dynamic payload = response.data;

        // Check if wrapped in 'data' object
        if (payload is Map<String, dynamic> && payload.containsKey('data')) {
          debugPrint('📡 Found "data" wrapper, unwrapping...');
          payload = payload['data'];
        }

        // Debug: Print payload after unwrapping
        debugPrint('📡 Payload after unwrap: $payload');
        if (payload is Map) debugPrint('📡 Payload keys: ${(payload as Map).keys.toList()}');

        if (payload is Map<String, dynamic>) {
          // Debug: Print key values safely
          debugPrint('📡 availableBeds value: ${payload['availableBeds']}');
          debugPrint('📡 totalUnits value: ${payload['totalUnits']}');
          debugPrint('📡 occupiedBeds value: ${payload['occupiedBeds']}');

          final model = DashboardStatsModel.fromJson(payload);
          debugPrint('✅ Parsed Model - availableBeds: ${model.availableBeds}, occupiedBeds: ${model.occupiedBeds}, totalBeds: ${model.totalBeds}');
          return model;
        }
        if (payload is Map) {
          debugPrint('📡 Converting Map to Map<String, dynamic>');
          final model = DashboardStatsModel.fromJson(Map<String, dynamic>.from(payload));
          debugPrint('✅ Parsed Model - availableBeds: ${model.availableBeds}');
          return model;
        }
      }
    } catch (e) {
      debugPrint("❌ Dashboard Stats Error (primary): $e");
      // Try fallback host (localhost) for web/dev environments
      try {
        debugPrint('🔁 Trying fallback host: $fallbackBaseUrl');
        _dio.options.baseUrl = fallbackBaseUrl;
        await _addTokenToHeaders();
        final resp2 = await _dio.get('/Dashboard/Stats');
        debugPrint('📡 Fallback Raw Response: ${resp2.data}');
        if (resp2.statusCode == 200) {
          dynamic payload = resp2.data;
          if (payload is Map<String, dynamic> && payload.containsKey('data')) payload = payload['data'];
          if (payload is Map<String, dynamic>) {
            final model = DashboardStatsModel.fromJson(payload);
            debugPrint('✅ Fallback Parsed Model - availableBeds: ${model.availableBeds}');
            return model;
          }
          if (payload is Map) {
            final model = DashboardStatsModel.fromJson(Map<String, dynamic>.from(payload));
            debugPrint('✅ Fallback Parsed Model - availableBeds: ${model.availableBeds}');
            return model;
          }
        }
      } catch (e2) {
        debugPrint('❌ Dashboard Stats Error (fallback): $e2');
      } finally {
        // Restore original base URL so we don't change behavior for other calls
        _dio.options.baseUrl = originalBase;
      }
    }
    return null;
  }

  // ── 4. تحديث البيانات (حسب الـ Swagger: Users/ManageAsync) ──
  // ملاحظة: الـ Swagger بيقول إن ده Multipart (عشان الصورة)
  static Future<bool> updateProfile(UserModel user) async {
    try {
      await _addTokenToHeaders();
      // هنا بنستخدم FormData عشان الـ Swagger طالب multipart/form-data
      FormData formData = FormData.fromMap({
        'Id': user.email, // أو الـ Id الحقيقي
        'UserName': user.userName,
        'PhoneNumber': user.phoneNumber,
        'Gender': user.gender,
        'Role': user.role,
        'Specialization': user.specialization,
      });

      final response = await _dio.post('/Users/ManageAsync', data: formData);
      return response.statusCode == 200;
    } catch (e) {
      debugPrint("Update Error: $e");
      return false;
    }
  }
}