import 'package:flutter/material.dart';

import '../config/app_config.dart';

/// Camera Stream Provider
/// إدارة حالة بث الكاميرا والاتصال بالخدمة
class CameraProvider extends ChangeNotifier {
  String _streamUrl = AppConfig.streamUrl;
  String _apiBaseUrl = AppConfig.cameraApiBaseUrl;
  
  bool _isConnected = false;
  bool _isLoading = false;
  String? _errorMessage;
  
  DateTime? _lastFrameTime;

  // Getters
  String get streamUrl => _streamUrl;
  String get apiBaseUrl => _apiBaseUrl;
  bool get isConnected => _isConnected;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  DateTime? get lastFrameTime => _lastFrameTime;

  /// Initialize camera stream
  /// للتوافق مع أي عنوان IP أو أي تكوين شبكي مختلف
  void initialize({
    String streamUrl = AppConfig.streamUrl,
    String apiBaseUrl = AppConfig.cameraApiBaseUrl,
  }) {
    _streamUrl = streamUrl;
    _apiBaseUrl = apiBaseUrl;
    _isConnected = true;
    _errorMessage = null;
    notifyListeners();
  }

  /// Frame received callback - used to track stream activity
  void onFrameReceived() {
    _lastFrameTime = DateTime.now();
    _isConnected = true;
    _errorMessage = null;
    notifyListeners();
  }

  /// Stream connection error
  void onStreamError(String error) {
    _isConnected = false;
    _errorMessage = error;
    notifyListeners();
  }

  /// Set loading state
  void setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  /// Dispose
  @override
  void dispose() {
    super.dispose();
  }
}
