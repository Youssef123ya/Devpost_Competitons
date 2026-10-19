# Flutter App - Integration with MedMonitor API

## 🔗 ربط تطبيق Flutter مع الـ Backend API

---

## 1️⃣ تثبيت المكتبات المطلوبة

### في `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  dio: ^5.0.0                    # HTTP client
  provider: ^6.0.0               # State management
  flutter_secure_storage: ^9.0.0 # Secure token storage
  intl: ^0.19.0                  # Localization
```

### تثبيت المكتبات:

```bash
flutter pub get
```

---

## 2️⃣ إعداد الـ ApiService

### ملف: `lib/services/api_service.dart`

```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  // استخدم قيمة مناسبة حسب بيئة التطوير
  static const String baseUrl = 'http://localhost:5140/api';
  // للـ Android Emulator: 'http://10.0.2.2:5140/api'
  // للـ Physical Device: 'http://192.168.X.X:5140/api'
  
  static final Dio _dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: Duration(seconds: 15),
      receiveTimeout: Duration(seconds: 15),
      contentType: Headers.jsonContentType,
    ),
  );

  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'auth_token';

  /// 🔐 Login - تسجيل الدخول
  static Future<Map<String, dynamic>> login(
    String username,
    String password,
  ) async {
    try {
      final response = await _dio.post(
        '/login',
        data: {
          'userName': username,
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        final token = response.data['data']['token'];
        await _storage.write(key: _tokenKey, value: token);
        _dio.options.headers['Authorization'] = 'Bearer $token';
        return response.data['data'];
      }
      throw Exception('Login failed: ${response.statusMessage}');
    } on DioException catch (e) {
      throw Exception('Login error: ${e.message}');
    }
  }

  /// 📝 Register - التسجيل الجديد
  static Future<Map<String, dynamic>> register({
    required String fullName,
    required String username,
    required String email,
    required String phone,
    required String password,
    required int role, // 2 = Doctor, 3 = Nurse
    required int gender, // 1 = Male, 2 = Female
  }) async {
    try {
      final response = await _dio.post(
        '/login/Register',
        data: {
          'fullName': fullName,
          'userName': username,
          'email': email,
          'phoneNumber': phone,
          'password': password,
          'role': role,
          'gender': gender,
          'dateOfBirth': DateTime.now().toIso8601String(),
        },
      );

      if (response.statusCode == 200) {
        final token = response.data['data']['token'];
        await _storage.write(key: _tokenKey, value: token);
        _dio.options.headers['Authorization'] = 'Bearer $token';
        return response.data['data'];
      }
      throw Exception('Registration failed');
    } on DioException catch (e) {
      throw Exception('Registration error: ${e.response?.data['message'] ?? e.message}');
    }
  }

  /// 📊 Get Dashboard Stats
  static Future<Map<String, dynamic>> getDashboardStats() async {
    try {
      await _ensureTokenLoaded();
      final response = await _dio.get('/dashboard/Stats');
      return response.data['data'] ?? {};
    } on DioException catch (e) {
      throw Exception('Dashboard error: ${e.message}');
    }
  }

  /// 👤 Get User Profile
  static Future<Map<String, dynamic>> getUserProfile(String userId) async {
    try {
      await _ensureTokenLoaded();
      final response = await _dio.get('/users/$userId');
      return response.data['data'] ?? {};
    } on DioException catch (e) {
      throw Exception('Profile error: ${e.message}');
    }
  }

  /// ✏️ Update User Profile
  static Future<bool> updateUserProfile(
    String userId,
    Map<String, dynamic> data,
  ) async {
    try {
      await _ensureTokenLoaded();
      final response = await _dio.put(
        '/users/$userId',
        data: FormData.fromMap(data),
      );
      return response.statusCode == 200;
    } on DioException catch (e) {
      throw Exception('Update error: ${e.message}');
    }
  }

  /// 🛏️ Get All Beds
  static Future<List<Map<String, dynamic>>> getBeds() async {
    try {
      await _ensureTokenLoaded();
      final response = await _dio.get('/beds');
      final data = response.data['data'] as List;
      return data.map((e) => e as Map<String, dynamic>).toList();
    } on DioException catch (e) {
      throw Exception('Beds error: ${e.message}');
    }
  }

  /// 📋 Get Admission Requests
  static Future<List<Map<String, dynamic>>> getAdmissionRequests(String doctorId) async {
    try {
      await _ensureTokenLoaded();
      final response = await _dio.get('/admissionrequest/doctor-requests/$doctorId');
      final data = response.data['data'] as List;
      return data.map((e) => e as Map<String, dynamic>).toList();
    } on DioException catch (e) {
      throw Exception('Admission error: ${e.message}');
    }
  }

  /// ➕ Create Admission Request
  static Future<bool> createAdmissionRequest(Map<String, dynamic> data) async {
    try {
      await _ensureTokenLoaded();
      final response = await _dio.post('/admissionrequest', data: data);
      return response.statusCode == 201;
    } on DioException catch (e) {
      throw Exception('Create admission error: ${e.message}');
    }
  }

  /// 📝 Get Tasks
  static Future<List<Map<String, dynamic>>> getTasks({
    int pageNumber = 1,
    int pageSize = 10,
  }) async {
    try {
      await _ensureTokenLoaded();
      final response = await _dio.get(
        '/task',
        queryParameters: {
          'pageNumber': pageNumber,
          'pageSize': pageSize,
        },
      );
      final data = response.data['data'] as List;
      return data.map((e) => e as Map<String, dynamic>).toList();
    } on DioException catch (e) {
      throw Exception('Tasks error: ${e.message}');
    }
  }

  /// ➕ Create Task
  static Future<bool> createTask(Map<String, dynamic> data) async {
    try {
      await _ensureTokenLoaded();
      final response = await _dio.post('/task', data: data);
      return response.statusCode == 201;
    } on DioException catch (e) {
      throw Exception('Create task error: ${e.message}');
    }
  }

  /// 📈 Get Vital Signs
  static Future<List<Map<String, dynamic>>> getVitalSigns({
    String? patientId,
    int pageNumber = 1,
    int pageSize = 10,
  }) async {
    try {
      await _ensureTokenLoaded();
      final response = await _dio.get(
        '/vitalsign',
        queryParameters: {
          if (patientId != null) 'patientId': patientId,
          'pageNumber': pageNumber,
          'pageSize': pageSize,
        },
      );
      final data = response.data['data'] as List;
      return data.map((e) => e as Map<String, dynamic>).toList();
    } on DioException catch (e) {
      throw Exception('Vital signs error: ${e.message}');
    }
  }

  /// ➕ Add Vital Signs
  static Future<bool> addVitalSigns(Map<String, dynamic> data) async {
    try {
      await _ensureTokenLoaded();
      final response = await _dio.post('/vitalsign', data: data);
      return response.statusCode == 201;
    } on DioException catch (e) {
      throw Exception('Add vital signs error: ${e.message}');
    }
  }

  /// 🔓 Logout
  static Future<void> logout() async {
    try {
      await _storage.delete(key: _tokenKey);
      _dio.options.headers.remove('Authorization');
    } catch (e) {
      print('Logout error: $e');
    }
  }

  /// 🔄 Check if user is logged in
  static Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: _tokenKey);
    return token != null && token.isNotEmpty;
  }

  /// 🔑 Get saved token
  static Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  /// ✅ Ensure token is loaded
  static Future<void> _ensureTokenLoaded() async {
    final token = await _storage.read(key: _tokenKey);
    if (token != null && token.isNotEmpty) {
      _dio.options.headers['Authorization'] = 'Bearer $token';
    }
  }

  /// 🔌 Add Interceptors for debugging
  static void setupInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          print('🔵 Request: ${options.method} ${options.path}');
          return handler.next(options);
        },
        onResponse: (response, handler) {
          print('🟢 Response: ${response.statusCode} ${response.data}');
          return handler.next(response);
        },
        onError: (DioException e, handler) {
          print('🔴 Error: ${e.message}');
          print('Response: ${e.response?.data}');
          return handler.next(e);
        },
      ),
    );
  }
}
```

---

## 3️⃣ إنشاء AuthProvider

### ملف: `lib/providers/auth_provider.dart`

```dart
import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _currentUser;
  String? _token;
  bool _isLoading = false;
  String? _errorMessage;

  // Getters
  UserModel? get currentUser => _currentUser;
  String? get token => _token;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isLoggedIn => _currentUser != null && _token != null;

  // 🔐 Login
  Future<bool> login(String username, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final data = await ApiService.login(username, password);
      
      _currentUser = UserModel(
        id: data['id'],
        userName: data['userName'],
        email: data['email'],
        phoneNumber: data['phoneNumber'],
        role: data['role'],
        token: data['token'],
        imageUrl: data['imageUrl'],
        specialization: data['specialization'],
      );
      
      _token = data['token'];
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // 📝 Register
  Future<bool> register({
    required String fullName,
    required String username,
    required String email,
    required String phone,
    required String password,
    required int role,
    required int gender,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final data = await ApiService.register(
        fullName: fullName,
        username: username,
        email: email,
        phone: phone,
        password: password,
        role: role,
        gender: gender,
      );

      _currentUser = UserModel(
        id: data['id'],
        userName: data['userName'],
        email: data['email'],
        phoneNumber: data['phoneNumber'],
        role: data['role'],
        token: data['token'],
      );

      _token = data['token'];
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // 🔓 Logout
  Future<void> logout() async {
    await ApiService.logout();
    _currentUser = null;
    _token = null;
    notifyListeners();
  }

  // ✅ Check if logged in
  Future<void> checkLoginStatus() async {
    final isLoggedIn = await ApiService.isLoggedIn();
    if (!isLoggedIn) {
      _currentUser = null;
      _token = null;
    }
    notifyListeners();
  }
}
```

---

## 4️⃣ استخدام في الشاشات

### Login Screen

```dart
import 'package:provider/provider.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _userController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        return Scaffold(
          body: SingleChildScrollView(
            child: Column(
              children: [
                TextField(
                  controller: _userController,
                  decoration: InputDecoration(hintText: 'Username'),
                ),
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: InputDecoration(hintText: 'Password'),
                ),
                ElevatedButton(
                  onPressed: authProvider.isLoading
                      ? null
                      : () async {
                          final success = await authProvider.login(
                            _userController.text,
                            _passwordController.text,
                          );

                          if (success) {
                            Navigator.pushReplacementNamed(
                              context,
                              '/admin-home',
                            );
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  authProvider.errorMessage ?? 'Login failed',
                                ),
                              ),
                            );
                          }
                        },
                  child: authProvider.isLoading
                      ? CircularProgressIndicator()
                      : Text('Login'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
```

---

## 5️⃣ معالجة الأخطاء

### ملف: `lib/services/error_handler.dart`

```dart
class ErrorHandler {
  static String handleError(dynamic error) {
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
          return 'Connection timeout';
        case DioExceptionType.receiveTimeout:
          return 'Receive timeout';
        case DioExceptionType.badResponse:
          return error.response?.data?['message'] ?? 'Error occurred';
        case DioExceptionType.unknown:
          return 'Connection error';
        default:
          return 'Unknown error';
      }
    }
    return error.toString();
  }
}
```

---

## 6️⃣ اختبار الاتصال

### في `main.dart`:

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // اختبر الاتصال بـ API
  ApiService.setupInterceptors();
  
  runApp(const MedMonitorApp());
}
```

---

## 📱 اختبار من Device مختلف

### على Android Emulator:
```dart
static const String baseUrl = 'http://10.0.2.2:5140/api';
```

### على Physical Device (نفس الشبكة):
```dart
static const String baseUrl = 'http://192.168.1.100:5140/api'; // ضع IP الكمبيوتر
```

### للتحقق من IP:
```bash
ipconfig  # Windows
ifconfig  # Mac/Linux
```

---

## ✅ Checklist

- [ ] تثبيت dio و provider
- [ ] إنشاء ApiService
- [ ] إنشاء AuthProvider
- [ ] ربط Login مع API
- [ ] ربط Register مع API
- [ ] اختبار من Emulator/Device
- [ ] معالجة الأخطاء
- [ ] Logout functionality

---

**تم الإعداد في**: May 19, 2026
