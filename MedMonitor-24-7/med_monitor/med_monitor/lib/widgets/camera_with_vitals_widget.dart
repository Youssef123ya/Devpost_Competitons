import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/camera_provider.dart';
import '../providers/vital_signs_camera_provider.dart';
import '../widgets/camera_stream_widget.dart';

/// Camera Display Widget with Vital Signs
/// عرض البث المباشر من الكاميرا مع نتائج الـ OCR
class CameraWithVitalsWidget extends StatefulWidget {
  final double height;
  final double? width;
  final bool showVitalSigns;
  final VoidCallback? onFrameReceived;

  const CameraWithVitalsWidget({
    Key? key,
    this.height = 400,
    this.width,
    this.showVitalSigns = true,
    this.onFrameReceived,
  }) : super(key: key);

  @override
  State<CameraWithVitalsWidget> createState() => _CameraWithVitalsWidgetState();
}

class _CameraWithVitalsWidgetState extends State<CameraWithVitalsWidget> {
  @override
  void initState() {
    super.initState();
    
    // Initialize camera provider
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final cameraProvider = Provider.of<CameraProvider>(context, listen: false);
      cameraProvider.initialize();
      
      // Start polling for vital signs
      if (widget.showVitalSigns) {
        final vitalProvider = Provider.of<VitalSignsCameraProvider>(context, listen: false);
        vitalProvider.initialize();
        vitalProvider.startPolling(interval: const Duration(seconds: 6));
      }
    });
  }

  @override
  void dispose() {
    final vitalProvider = Provider.of<VitalSignsCameraProvider>(context, listen: false);
    vitalProvider.stopPolling();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Camera Stream
        _buildCameraStream(),
        
        // Vital Signs Display (if enabled)
        if (widget.showVitalSigns) ...[
          const SizedBox(height: 12),
          _buildVitalSignsDisplay(),
        ],
      ],
    );
  }

  /// Build camera stream display
  Widget _buildCameraStream() {
    return Consumer<CameraProvider>(
      builder: (context, cameraProvider, _) {
        return Container(
          height: widget.height,
          width: widget.width ?? double.infinity,
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.shade300, width: 1),
            borderRadius: BorderRadius.circular(8),
            color: Colors.black,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(7),
            child: _buildMJPEGStream(cameraProvider),
          ),
        );
      },
    );
  }

  /// Build MJPEG stream with the shared CameraStreamWidget
  Widget _buildMJPEGStream(CameraProvider cameraProvider) {
    return Stack(
      fit: StackFit.expand,
      children: [
        CameraStreamWidget(
          streamUrl: cameraProvider.streamUrl,
          showLoadingIndicator: true,
          aspectRatio: 16 / 9,
        ),

        // Connection status indicator
        Positioned(
          top: 12,
          right: 12,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.black54,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: cameraProvider.isConnected ? Colors.green : Colors.red,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  cameraProvider.isConnected ? "🟢 متصل" : "🔴 غير متصل",
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  /// Build vital signs display
  Widget _buildVitalSignsDisplay() {
    return Consumer<VitalSignsCameraProvider>(
      builder: (context, vitalProvider, _) {
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFCADBFF),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF719EFF), width: 1.5),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "📊 نتائج الاستخراج (OCR)",
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF719EFF),
                    ),
                  ),
                  if (vitalProvider.status == "waiting")
                    Text(
                      "⏳ جاري الانتظار...",
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.orange.shade600,
                      ),
                    )
                  else if (vitalProvider.status == "error")
                    Text(
                      "❌ خطأ في الاستخراج",
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.red.shade600,
                      ),
                    )
                  else
                    Text(
                      "✅ نجح",
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.green.shade600,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 10),
              
              // Vital Signs Grid
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
                childAspectRatio: 1.3,
                children: [
                  _buildVitalSignCard(
                    icon: "❤️",
                    label: "معدل النبض",
                    value: vitalProvider.heartRate?.toString() ?? "N/A",
                    unit: "bpm",
                    color: Colors.red,
                  ),
                  _buildVitalSignCard(
                    icon: "🫁",
                    label: "SpO2",
                    value: vitalProvider.spO2?.toString() ?? "N/A",
                    unit: "%",
                    color: Colors.blue,
                  ),
                  _buildVitalSignCard(
                    icon: "🩸",
                    label: "ضغط الدم",
                    value: vitalProvider.bpFormatted,
                    unit: "mmHg",
                    color: Colors.purple,
                  ),
                  _buildVitalSignCard(
                    icon: "🌡️",
                    label: "درجة الحرارة",
                    value: vitalProvider.temperatureFormatted,
                    unit: "°C",
                    color: Colors.orange,
                  ),
                ],
              ),
              
              // Last Update Time
              if (vitalProvider.lastUpdateTime != null)
                Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: Text(
                    "🕐 آخر تحديث: ${_formatTime(vitalProvider.lastUpdateTime!)}",
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey.shade700,
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  /// Build individual vital sign card
  Widget _buildVitalSignCard({
    required String icon,
    required String label,
    required String value,
    required String unit,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3), width: 1),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          Text(icon, style: const TextStyle(fontSize: 24)),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 11,
              color: Colors.grey,
              fontWeight: FontWeight.w500,
            ),
          ),
          RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: value,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                TextSpan(
                  text: " $unit",
                  style: TextStyle(
                    fontSize: 10,
                    color: color.withOpacity(0.7),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Format time to readable string
  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);
    
    if (diff.inSeconds < 60) {
      return "قبل ${diff.inSeconds} ثانية";
    } else if (diff.inMinutes < 60) {
      return "قبل ${diff.inMinutes} دقيقة";
    } else {
      return time.toString().split('.')[0];
    }
  }
}
