import 'package:dio/dio.dart';
import 'dio_io_adapter_stub.dart'
  if (dart.library.io) 'dio_io_adapter_io.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

class DioClient {
  // Use your computer IP address for device testing
  static const String _defaultLocalBaseUrl = 'http://localhost:5140';
  static const String _defaultBaseUrl = AppConfig.backendBaseUrl;
  static const String _secureLocalBaseUrl = 'https://localhost:7191';
  static const String _androidEmulatorBaseUrl = 'http://10.0.2.2:5140';

  static String get baseUrl {
    if (kIsWeb) {
      final host = Uri.base.host;
      if (host.isNotEmpty && host != 'localhost' && host != '127.0.0.1') {
        return Uri(
          scheme: Uri.base.scheme == 'https' ? 'https' : 'http',
          host: host,
          port: 5140,
        ).toString();
      }
      return Uri.base.scheme == 'https'
          ? _secureLocalBaseUrl
          : _defaultLocalBaseUrl;
    }

    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return _defaultBaseUrl;
    }

    return _defaultBaseUrl;
  }

  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  static Dio get instance => dio;

  static final Dio dio = (() {
    final d = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 60),
        receiveTimeout: const Duration(seconds: 60),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Do not set IO-specific http client adapter on Web — importing
    // `dart:io`/`package:dio/io.dart` will fail on web. Mobile platforms
    // can use default adapters; if you need to customize the mobile
    // adapter (certificate validation), add a conditional import file.

    final adapter = createIOHttpClientAdapter();
    if (adapter != null) {
      d.httpClientAdapter = adapter;
    }

    d.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          try {
            final prefs = await SharedPreferences.getInstance();
            final token = prefs.getString('auth_token') ?? '';
            debugPrint('DioClient Request: ${options.method} ${options.baseUrl}${options.path} - uri=${options.uri} - token present: ${token.isNotEmpty}');
            if (token.isNotEmpty) {
              options.headers['Authorization'] = 'Bearer $token';
            }
            if (options.data is FormData) {
              options.headers.remove('Content-Type');
            }
          } catch (e) {
            debugPrint('DioClient: error reading token: $e');
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          final code = error.response?.statusCode;
          debugPrint('DioClient Error: type=${error.type} uri=${error.requestOptions.uri} message=${error.message} actualError=${error.error} responseStatus=${error.response?.statusCode} responseData=${error.response?.data}');
          if (code == 401) {
            try {
              final prefs = await SharedPreferences.getInstance();
              await prefs.remove('auth_token');
              await prefs.remove('role');
              await prefs.remove('user_profile');
            } catch (_) {
              // ignore
            }
            if (navigatorKey.currentState != null) {
              navigatorKey.currentState?.pushNamedAndRemoveUntil('/login', (route) => false);
            }
          }

          if (code == 403 || code == 404 || code == 500) {
            debugPrint('API error ($code): ${error.response?.data ?? error.message}');
          }

          return handler.next(error);
        },
      ),
      );

      return d;
    })();
}
