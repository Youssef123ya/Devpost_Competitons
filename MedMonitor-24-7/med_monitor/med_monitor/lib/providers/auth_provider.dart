import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:provider/provider.dart';
import '../services/signalr_service.dart';
import '../models/user_model.dart';
import '../services/dio_client.dart';
import '../providers/notification_provider.dart';

class AuthProvider with ChangeNotifier {
  UserModel? _currentUser;
  UserModel? get currentUser => _currentUser;
  UserModel? _user;
  UserModel? get user => _user;
  String? _token;
  String? get token => _token;
  // 1. تسجيل الدخول
  Future<bool> login(String username, String password) async {
    try {
      // 🔍 DEBUG: Log the request
      debugPrint('\n=== LOGIN REQUEST START ===');
      debugPrint('Resolved backend URL: ${DioClient.baseUrl}');
      debugPrint('Full login URL: ${DioClient.baseUrl}/LoginContoller/loginUser');
      debugPrint('Body: {"userName": "$username", "password": "***"}');
      
      final response = await DioClient.dio.post(
        '/LoginContoller/loginUser',
        data: {
          "userName": username,
          "password": password,
        },
      );

      // 🔍 DEBUG: Log the response
      debugPrint('Status Code: ${response.statusCode}');
      debugPrint('Response Body: ${response.data}');
      debugPrint('=== LOGIN REQUEST END ===\n');

      if (response.statusCode == 200) {
        debugPrint('Response data type: ${response.data.runtimeType}');
        debugPrint('Response data content: ${response.data}');

        final rawData = response.data is Map<String, dynamic>
            ? response.data as Map<String, dynamic>
            : response.data is String
                ? jsonDecode(response.data as String) as Map<String, dynamic>
                : response.data as Map;

        dynamic payload = rawData;
        if (rawData.containsKey('data')) {
          payload = rawData['data'];
        }
        if (payload is Map<String, dynamic> && payload.containsKey('data')) {
          payload = payload['data'];
        }

        if (payload is String) {
          try {
            payload = jsonDecode(payload);
          } catch (_) {
            payload = payload;
          }
        }

        if (payload is Map<String, dynamic> || payload is Map) {
          _currentUser = UserModel.fromJson(payload as Map<String, dynamic>);
          debugPrint('✅ currentUser object created: ${_currentUser?.toJson()}');
          debugPrint('✅ currentUser.token null? ${_currentUser?.token == null}');
          debugPrint('✅ currentUser.id null? ${_currentUser?.id == null}');
        } else {
          debugPrint('❌ LOGIN PARSE ERROR: Unexpected response data type. Expected Map, got ${payload.runtimeType}');
          return false;
        }

        final prefs = await SharedPreferences.getInstance();
        // بنسيف التوكن والبيانات الأساسية
        await prefs.setString('auth_token', _currentUser?.token ?? "");
        await prefs.setInt('role', _currentUser?.role ?? 2);

        // ✅ بنخزن نسخة JSON من اليوزر عشان لما يفتح الأبلكيشن تظهر بياناته فوراً
        await prefs.setString('user_profile', payload.toString());

        debugPrint('✅ Login successful for user: $username');
        notifyListeners();

        // Start SignalR connection for real-time notifications
        try {
          debugPrint('[E2E:Flutter][AuthProvider] Starting SignalR connection after login...');
          debugPrint('[E2E:Flutter][AuthProvider] Current user: ${_currentUser?.userName}, ID: ${_currentUser?.id}');
          // start without context; SignalR service will use navigatorKey to route notifications
          await Future.delayed(Duration.zero);
          await SignalRService().startConnection(null);
          debugPrint('🟢 [AuthProvider] ✅ SignalR.startConnection() completed');
        } catch (e) {
          debugPrint('🟢 [AuthProvider] ❌ SignalR start failed: $e');
        }

        // Fetch initial notifications for this user (doctor or nurse)
        try {
          debugPrint('[E2E:Flutter][AuthProvider] Fetching initial notifications...');
          final ctx = DioClient.navigatorKey.currentContext;
          debugPrint('[E2E:Flutter][AuthProvider] Context available: ${ctx != null}');
          
          if (ctx != null) {
            final notifProvider = Provider.of<NotificationProvider>(ctx, listen: false);
            final userId = _currentUser?.id ?? '';
            debugPrint('🟢 [AuthProvider] UserId for fetch: $userId');
            
            if (userId.isNotEmpty) {
              debugPrint('🟢 [AuthProvider] Calling fetchNotifications($userId)...');
              await notifProvider.fetchNotifications(userId);
              debugPrint('🟢 [AuthProvider] ✅ fetchNotifications() completed');
            } else {
              debugPrint('🟢 [AuthProvider] ❌ UserId is empty, cannot fetch');
            }
          } else {
            debugPrint('🟢 [AuthProvider] ❌ Context is null, cannot fetch notifications');
          }
        } catch (e) {
          debugPrint('🟢 [AuthProvider] ❌ Failed to fetch notifications after login: $e');
        }
        return true;
      }
      return false;
    } on DioException catch (e) {
      debugPrint('\n=== LOGIN ERROR ===');
      debugPrint('Error Type: ${e.type}');
      debugPrint('Status Code: ${e.response?.statusCode}');
      debugPrint('Error Message: ${e.message}');
      debugPrint('Error Response: ${e.response?.data}');
      debugPrint('Request Uri: ${e.requestOptions.uri}');
      debugPrint('Resolved base URL used by Dio: ${DioClient.baseUrl}');
      debugPrint('Request Data: ${e.requestOptions.data}');
      debugPrint('Request Headers: ${e.requestOptions.headers}');
      debugPrint('Dio error details: ${e.error}');
      debugPrint('=== LOGIN ERROR END ===\n');
      return false;
    } catch (e, stackTrace) {
      debugPrint('\n=== LOGIN UNKNOWN ERROR ===');
      debugPrint('Error: $e');
      debugPrint('Stack trace: $stackTrace');
      debugPrint('=== LOGIN UNKNOWN ERROR END ===\n');
      return false;
    }
  }

  // 2. تحديث البيانات محلياً (عشان البروفايل يسمع فوراً)
  // الدالة دي اللي بناديها من شاشات الـ Edit اللي عملناها سوا
  void updateLocalUser(UserModel updatedUser) {
    _currentUser = updatedUser;
    notifyListeners();
  }

  // 3. التسجيل
  String _registerError = '';
  String get registerError => _registerError;

  Future<bool> register({
    required String username,
    required String email,
    required String phone,
    required String password,
    required int role,
    required int gender,
  }) async {
    _registerError = '';
    notifyListeners();

    final body = {
      "FullName": username,
      "UserName": username,
      "Email": email,
      "PhoneNumber": phone,
      "Password": password,
      "Role": role,
      "Gender": gender,
      "DateOfBirth": DateTime.now().toIso8601String(),
      "Specialization": "General",
    };

    debugPrint('Register request body: $body');

    try {
      final response = await DioClient.dio.post(
        '/LoginContoller/Register',
        data: body,
      );
      debugPrint('Register response status: ${response.statusCode}');
      debugPrint('Register response data: ${response.data}');
      return response.statusCode == 200;
    } on DioException catch (e) {
      _registerError = e.response?.data?.toString() ?? e.message ?? '';
      debugPrint('Register status: ${e.response?.statusCode}');
      debugPrint('Register error body: ${e.response?.data}');
      debugPrint('Register message: ${e.message}');
      debugPrint('Parsed register error: ${_registerError}');
      notifyListeners();
      return false;
    } catch (e) {
      _registerError = e.toString();
      debugPrint('Dio Register Error: $e');
      notifyListeners();
      return false;
    }
  }
  // ✅ دالة نسيان كلمة المرور (مطابقة للـ Swagger: /LoginContoller/ForgetPasswordByEmail)
  Future<bool> forgetPassword(String email) async {
    try {
      debugPrint('=== SEND OTP DEBUG ===');
      debugPrint('Email: $email');
      debugPrint('Endpoint: ${DioClient.baseUrl}/LoginContoller/ForgetPasswordByEmail');
      debugPrint('Request query: ${ {'email': email} }');

      final response = await DioClient.dio.post(
        '/LoginContoller/ForgetPasswordByEmail',
        queryParameters: {'email': email},
      );

      debugPrint('Response status: ${response.statusCode}');
      debugPrint('Response body: ${response.data}');
      debugPrint('=== SEND OTP DEBUG END ===');

      // If backend returns the OTP and user id in the body, cache it locally
      if (response.statusCode == 200 && response.data != null) {
        try {
          final data = response.data is Map ? response.data : null;
          final payload = data?['data'] ?? data ?? response.data;

          if (payload is Map) {
            _resetEmail = payload['Email']?.toString() ?? email;
            _lastOtp = payload['Otp']?.toString() ?? payload['otp']?.toString() ?? payload['OTB']?.toString() ?? payload['otb']?.toString();
            _resetUserId = payload['UserId']?.toString() ?? payload['userId']?.toString();
            debugPrint('Cached reset info: email=$_resetEmail, userId=$_resetUserId, otp=$_lastOtp');
          }
        } catch (e) {
          debugPrint('Failed to parse forgetPassword response: $e');
        }
      }

      return response.statusCode == 200;
    } on DioException catch (e) {
      debugPrint("Forget Password Error: ${e.response?.data ?? e.message}");
      return false;
    } catch (e) {
      debugPrint("Unknown Error: $e");
      return false;
    }
  }
  // باقي الدوال (Forget Password & OTP) تظل كما هي مع التأكد من الـ Path
  Future<bool> verifyOtp({required String email, required String otpCode}) async {
    try {
      debugPrint('=== VERIFY OTP DEBUG ===');
      debugPrint('Email: $email');
      debugPrint('Code entered: $otpCode');

      final response = await DioClient.dio.post(
        '/LoginContoller/VerifyOtp',
        queryParameters: {'email': email, 'otp': otpCode},
      );

      debugPrint('Verify OTP response: ${response.statusCode}');
      debugPrint('Verify OTP body: ${response.data}');
      debugPrint('=== VERIFY OTP DEBUG END ===');
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('VERIFY OTP ERROR: $e');
      return false;
    }
  }

  // ✅ Cached values from forgetPassword response
  String? _resetUserId;
  String? _resetEmail;
  String? _lastOtp;

  String? get resetUserId => _resetUserId;

  // ✅ دالة إعادة تعيين كلمة المرور
  Future<bool> resetPassword({required String email, required String newPassword, required String otp, String? userId}) async {
    try {
      debugPrint('=== UPDATE PASSWORD DEBUG ===');
      debugPrint('Email: $email');
      debugPrint('Cached reset info: email=$_resetEmail, userId=$_resetUserId, otp=$_lastOtp');
      debugPrint('New password length: ${newPassword.length}');
      debugPrint('OTP sent to resetPassword: $otp');
      debugPrint('UserId passed to resetPassword: $userId');

      final body = {
        "Email": email,
        "UserId": userId ?? _resetUserId ?? "",
        "Otp": otp,
        "NewPassword": newPassword,
      };

      debugPrint('Endpoint: ${DioClient.baseUrl}/LoginContoller/ChangePasswordNotToken');
      debugPrint('Request body: $body');

      final response = await DioClient.dio.post(
        '/LoginContoller/ChangePasswordNotToken',
        data: body,
      );

      debugPrint('Status: ${response.statusCode}');
      debugPrint('Response: ${response.data}');
      debugPrint('=== UPDATE PASSWORD DEBUG END ===');

      return response.statusCode == 200;
    } on DioException catch (e) {
      debugPrint("Reset Password Error: ${e.response?.data ?? e.message}");
      return false;
    } catch (e) {
      debugPrint('Reset Password Unknown Error: $e');
      return false;
    }
  }

  // جوه كلاس AuthProvider
  Future<bool> updateUserProfile(UserModel updatedUser) async {
    try {
      // السواجر غالباً بيستخدم PUT للتحديث
      final response = await DioClient.dio.post(
        '/Users/ManageAsync',
        data: updatedUser.toJson(),
      );

      if (response.statusCode == 200) {
        // تحديث اليوزر الحالي في البروفايدر بالبيانات الجديدة
        _user = updatedUser;
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint("Update Profile Error: $e");
      return false;
    }
  }

  Future<void> logout() async {
    _currentUser = null;
    _user = null;
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('role');
    await prefs.remove('user_profile');
    notifyListeners();
  }
}