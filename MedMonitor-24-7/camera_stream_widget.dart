// lib/widgets/camera_stream_widget.dart

import 'package:flutter/material.dart';
import 'dart:typed_data';
import 'dart:async';
import 'package:http/http.dart' as http;

/// Widget لعرض MJPEG Stream من Python Camera Service
class CameraStreamWidget extends StatefulWidget {
  final String streamUrl;
  final double? width;
  final double? height;
  final VoidCallback? onError;
  final VoidCallback? onConnected;

  const CameraStreamWidget({
    Key? key,
    required this.streamUrl,
    this.width,
    this.height,
    this.onError,
    this.onConnected,
  }) : super(key: key);

  @override
  State<CameraStreamWidget> createState() => _CameraStreamWidgetState();
}

class _CameraStreamWidgetState extends State<CameraStreamWidget> {
  late StreamController<Uint8List> _streamController;
  Uint8List? _currentFrame;
  bool _isConnected = false;
  bool _isLoading = true;
  String? _errorMessage;
  late Timer _reconnectTimer;
  int _reconnectAttempts = 0;
  static const int maxReconnectAttempts = 5;

  @override
  void initState() {
    super.initState();
    _streamController = StreamController<Uint8List>();
    _startStreamListener();
  }

  /// بدء الاستماع للـ Stream من الخادم
  void _startStreamListener() {
    _streamFromServer();
  }

  /// قراءة MJPEG Stream من الخادم
  Future<void> _streamFromServer() async {
    try {
      final request = http.Request('GET', Uri.parse(widget.streamUrl));

      final http.StreamedResponse response = await request.send().timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw Exception('Connection timeout');
        },
      );

      if (response.statusCode != 200) {
        throw Exception(
            'Server error: ${response.statusCode} - ${response.reasonPhrase}');
      }

      if (!mounted) return;

      setState(() {
        _isConnected = true;
        _isLoading = false;
        _errorMessage = null;
        _reconnectAttempts = 0;
      });

      widget.onConnected?.call();

      // قراءة البيانات من الـ Stream
      final boundary = _extractBoundary(response.headers['content-type'] ?? '');

      await response.stream
          .transform<String>(utf8.decoder)
          .listen(
            (chunk) {
              _processMJPEGChunk(chunk, boundary);
            },
            onError: (error) {
              _handleError(error.toString());
            },
            onDone: () {
              if (mounted) {
                _handleError('Stream disconnected');
              }
            },
            cancelOnError: true,
          )
          .asFuture<void>();
    } on SocketException catch (e) {
      _handleError('Connection error: ${e.message}');
    } on TimeoutException {
      _handleError('Connection timeout');
    } catch (e) {
      _handleError(e.toString());
    }
  }

  /// استخراج boundary من MJPEG stream
  String _extractBoundary(String contentType) {
    final match = RegExp(r'boundary=(.+?)(?:\s|$)').firstMatch(contentType);
    return match?.group(1) ?? 'frame';
  }

  /// معالجة MJPEG chunks
  void _processMJPEGChunk(String chunk, String boundary) {
    final parts = chunk.split('--$boundary');

    for (final part in parts) {
      // ابحث عن JPEG data
      final jpegStart = part.indexOf('\r\n\r\n');
      if (jpegStart == -1) continue;

      final dataStart = jpegStart + 4;
      final jpegEnd = part.indexOf('\r\n', dataStart);

      if (jpegEnd == -1) continue;

      try {
        final jpegData = part.substring(dataStart, jpegEnd);
        final bytes = Uint8List.fromList(utf8.encode(jpegData));

        if (mounted) {
          setState(() {
            _currentFrame = bytes;
          });
          _streamController.add(bytes);
        }
      } catch (e) {
        debugPrint('Error processing JPEG chunk: $e');
      }
    }
  }

  /// معالجة الأخطاء والمحاولة مجدداً
  void _handleError(String error) {
    debugPrint('❌ Camera Stream Error: $error');

    if (!mounted) return;

    setState(() {
      _isConnected = false;
      _errorMessage = error;
    });

    widget.onError?.call();

    // محاولة الاتصال مجدداً
    if (_reconnectAttempts < maxReconnectAttempts) {
      _reconnectAttempts++;
      final waitTime = Duration(seconds: 2 * _reconnectAttempts);

      debugPrint('🔄 محاولة الاتصال مجدداً في ${waitTime.inSeconds} ثانية...');

      _reconnectTimer = Timer(waitTime, () {
        if (mounted) {
          _startStreamListener();
        }
      });
    } else {
      setState(() {
        _errorMessage = 'فشل الاتصال بعد $maxReconnectAttempts محاولات';
      });
    }
  }

  @override
  void dispose() {
    _reconnectTimer.cancel();
    _streamController.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: widget.width ?? double.infinity,
      height: widget.height ?? 400,
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: _isConnected ? Colors.green : Colors.red,
          width: 2,
        ),
      ),
      child: Stack(
        children: [
          // عرض الصورة الحالية
          if (_currentFrame != null)
            Center(
              child: Image.memory(
                _currentFrame!,
                fit: BoxFit.contain,
                frameBuilder: (context, child, frame, wasSynchronouslyLoaded) {
                  return child;
                },
                errorBuilder: (context, error, stackTrace) {
                  return _buildErrorWidget('Failed to display frame');
                },
              ),
            )
          else if (_isLoading)
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation(Colors.white),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    '🎥 جاري الاتصال بالكاميرا...',
                    style: TextStyle(color: Colors.white, fontSize: 16),
                  ),
                ],
              ),
            )
          else
            _buildErrorWidget(_errorMessage ?? 'No stream available'),

          // Status indicator
          Positioned(
            top: 10,
            right: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: _isConnected ? Colors.green : Colors.red,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _isConnected ? Icons.check_circle : Icons.error,
                    color: Colors.white,
                    size: 16,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    _isConnected ? '🟢 متصل' : '🔴 منقطع',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorWidget(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.videocam_off,
            color: Colors.white70,
            size: 64,
          ),
          const SizedBox(height: 16),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 16),
          if (!_isConnected && _reconnectAttempts < maxReconnectAttempts)
            Text(
              'محاولة الاتصال... ($_reconnectAttempts/$maxReconnectAttempts)',
              style: const TextStyle(
                color: Colors.orange,
                fontSize: 12,
              ),
            ),
        ],
      ),
    );
  }
}

// مثال على الاستخدام
class CameraMonitoringScreen extends StatefulWidget {
  final String pythonServiceUrl;

  const CameraMonitoringScreen({
    Key? key,
    this.pythonServiceUrl = 'http://localhost:8000/stream',
  }) : super(key: key);

  @override
  State<CameraMonitoringScreen> createState() => _CameraMonitoringScreenState();
}

class _CameraMonitoringScreenState extends State<CameraMonitoringScreen> {
  Map<String, dynamic> _vitalSigns = {};
  bool _isLoadingVitals = false;

  @override
  void initState() {
    super.initState();
    _fetchVitalSigns();
    // تحديث الـ vital signs كل 5 ثواني
    Timer.periodic(const Duration(seconds: 5), (_) => _fetchVitalSigns());
  }

  Future<void> _fetchVitalSigns() async {
    try {
      setState(() => _isLoadingVitals = true);

      final response = await http
          .get(Uri.parse('http://localhost:8000/vitals'))
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (mounted) {
          setState(() {
            _vitalSigns = data;
            _isLoadingVitals = false;
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching vital signs: $e');
      if (mounted) {
        setState(() => _isLoadingVitals = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('🏥 مراقبة المريض - Monitoring'),
        backgroundColor: const Color(0xFF2196F3),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Live Camera Stream
            Padding(
              padding: const EdgeInsets.all(16),
              child: CameraStreamWidget(
                streamUrl: widget.pythonServiceUrl,
                height: 400,
                onConnected: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('✅ تم الاتصال بالكاميرا'),
                      backgroundColor: Colors.green,
                      duration: Duration(seconds: 2),
                    ),
                  );
                },
                onError: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('❌ خطأ في الاتصال بالكاميرا'),
                      backgroundColor: Colors.red,
                      duration: Duration(seconds: 2),
                    ),
                  );
                },
              ),
            ),

            // Vital Signs Display
            Padding(
              padding: const EdgeInsets.all(16),
              child: Card(
                elevation: 4,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        '📊 الـ Vital Signs المستخرجة',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildVitalRow(
                        'Heart Rate',
                        _vitalSigns['heart_rate']?.toString() ?? '--',
                        'bpm',
                        Icons.favorite,
                        Colors.red,
                      ),
                      const Divider(),
                      _buildVitalRow(
                        'SpO2',
                        _vitalSigns['spo2']?.toString() ?? '--',
                        '%',
                        Icons.air,
                        Colors.blue,
                      ),
                      const Divider(),
                      _buildVitalRow(
                        'Blood Pressure',
                        _vitalSigns['blood_pressure']?.toString() ?? '--',
                        'mmHg',
                        Icons.favorite_border,
                        Colors.orange,
                      ),
                      const Divider(),
                      _buildVitalRow(
                        'Temperature',
                        _vitalSigns['temperature']?.toString() ?? '--',
                        '°C',
                        Icons.thermostat,
                        Colors.green,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVitalRow(String label, String value, String unit, IconData icon,
      Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$value $unit',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ],
        ),
        if (_isLoadingVitals)
          const SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
      ],
    );
  }
}
