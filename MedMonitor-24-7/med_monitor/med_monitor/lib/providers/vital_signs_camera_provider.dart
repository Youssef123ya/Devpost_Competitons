import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'dart:async';

/// Vital Signs Camera Provider
/// استخراج والبحث عن نتائج الـ OCR من الـ Python Service
class VitalSignsCameraProvider extends ChangeNotifier {
  final Dio _dio = Dio();
  String _apiBaseUrl = AppConfig.cameraApiBaseUrl;

  // Vital Signs Data
  int? _heartRate;
  int? _spO2;
  int? _bpSystolic;
  int? _bpDiastolic;
  double? _temperature;
  
  // Confidence Scores
  double _hrConfidence = 0.0;
  double _spo2Confidence = 0.0;
  double _bpConfidence = 0.0;
  double _tempConfidence = 0.0;
  
  // Status
  String _status = "waiting"; // waiting, extracting, success, error
  String? _lastErrorMessage;
  DateTime? _lastUpdateTime;
  bool _isPolling = false;
  
  Timer? _pollingTimer;

  // Getters
  int? get heartRate => _heartRate;
  int? get spO2 => _spO2;
  int? get bpSystolic => _bpSystolic;
  int? get bpDiastolic => _bpDiastolic;
  double? get temperature => _temperature;
  
  double get hrConfidence => _hrConfidence;
  double get spo2Confidence => _spo2Confidence;
  double get bpConfidence => _bpConfidence;
  double get tempConfidence => _tempConfidence;
  
  String get status => _status;
  String? get lastErrorMessage => _lastErrorMessage;
  DateTime? get lastUpdateTime => _lastUpdateTime;
  bool get isPolling => _isPolling;

  /// Initialize provider
  void initialize({String apiBaseUrl = AppConfig.cameraApiBaseUrl}) {
    _apiBaseUrl = apiBaseUrl;
    _status = "waiting";
    notifyListeners();
  }

  /// Start polling for vital signs every [interval] seconds
  void startPolling({Duration interval = const Duration(seconds: 6)}) {
    if (_isPolling) return;
    
    _isPolling = true;
    
    // Fetch immediately
    _fetchLatestVitals();
    
    // Then poll regularly
    _pollingTimer = Timer.periodic(interval, (_) {
      _fetchLatestVitals();
    });
    
    notifyListeners();
  }

  /// Stop polling
  void stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
    _isPolling = false;
    notifyListeners();
  }

  /// Fetch latest vital signs from API
  Future<void> _fetchLatestVitals() async {
    try {
      final response = await _dio.get(
        "$_apiBaseUrl/vital-signs/latest",
        options: Options(sendTimeout: const Duration(seconds: 5)),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        _parseVitalSigns(data);
        _status = data['status'] ?? 'success';
        _lastErrorMessage = null;
      } else {
        _status = 'error';
        _lastErrorMessage = 'Server returned ${response.statusCode}';
      }
    } on DioException catch (e) {
      _status = 'error';
      _lastErrorMessage = e.message ?? 'Connection error';
    } catch (e) {
      _status = 'error';
      _lastErrorMessage = e.toString();
    }
    
    notifyListeners();
  }

  /// Parse vital signs from API response
  void _parseVitalSigns(Map<String, dynamic> data) {
    try {
      final vitals = data['vitals'] as Map<String, dynamic>;
      final confidence = data['confidence'] as Map<String, dynamic>;

      _heartRate = vitals['hr'];
      _spO2 = vitals['spo2'];
      _bpSystolic = vitals['bp_sys'];
      _bpDiastolic = vitals['bp_dia'];
      _temperature = vitals['temp']?.toDouble();

      _hrConfidence = (confidence['hr'] as num?)?.toDouble() ?? 0.0;
      _spo2Confidence = (confidence['spo2'] as num?)?.toDouble() ?? 0.0;
      _bpConfidence = (confidence['bp'] as num?)?.toDouble() ?? 0.0;
      _tempConfidence = (confidence['temp'] as num?)?.toDouble() ?? 0.0;

      _lastUpdateTime = DateTime.now();
    } catch (e) {
      print("❌ خطأ في تحليل البيانات: $e");
    }
  }

  /// Get formatted Blood Pressure string
  String get bpFormatted {
    if (_bpSystolic != null && _bpDiastolic != null) {
      return "$_bpSystolic/$_bpDiastolic";
    }
    return "N/A";
  }

  /// Get formatted Temperature string
  String get temperatureFormatted {
    if (_temperature != null) {
      return _temperature!.toStringAsFixed(1);
    }
    return "N/A";
  }

  /// Reset vital signs
  void reset() {
    _heartRate = null;
    _spO2 = null;
    _bpSystolic = null;
    _bpDiastolic = null;
    _temperature = null;
    _hrConfidence = 0.0;
    _spo2Confidence = 0.0;
    _bpConfidence = 0.0;
    _tempConfidence = 0.0;
    _status = "waiting";
    _lastErrorMessage = null;
    _lastUpdateTime = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
    super.dispose();
  }
}
