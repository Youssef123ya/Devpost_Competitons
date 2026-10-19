import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:math';
import '../../models/user_model.dart';
import '../../providers/ai_alert_provider.dart';
import 'ai_alert_screen.dart';
import '../../providers/vital_sign_provider.dart';

class MonitorScreen extends StatefulWidget {
  final UserModel patient;
  final int updateCounter;

  const MonitorScreen({
    super.key,
    required this.patient,
    this.updateCounter = 0,
  });

  @override
  State<MonitorScreen> createState() => _MonitorScreenState();
}

class _MonitorScreenState extends State<MonitorScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  bool _alertShown = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();

    // Fetch initial vitals and trigger first AI analysis
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadAndAnalyze();
    });
  }

  Future<void> _loadAndAnalyze() async {
    final vitalProvider = Provider.of<VitalSignProvider>(context, listen: false);
    final aiProvider = Provider.of<AiAlertProvider>(context, listen: false);

    await vitalProvider.fetchPatientSigns(widget.patient.id ?? "1");
    
    if (vitalProvider.allSigns.isNotEmpty) {
      final latest = vitalProvider.allSigns.last;
      
      // Parse BP (assuming format "120/80")
      List<String> bpParts = latest.bloodPressure.split('/');
      int systolic = int.tryParse(bpParts[0]) ?? 120;
      int diastolic = bpParts.length > 1 ? (int.tryParse(bpParts[1]) ?? 80) : 80;

      await aiProvider.analyzeVitals(
        heartRate: latest.heartRate,
        spO2: 98, // Placeholder if not in model yet
        systolicBP: systolic,
        diastolicBP: diastolic,
        temperature: latest.temperature,
        fallDetected: false, // Default
        patientId: widget.patient.id,
        patientName: widget.patient.userName,
      );

      // After analysis, show full-screen alert if non-normal and not already shown
      final pred = aiProvider.lastPrediction;
      if (pred != null) {
        final level = pred.alertLevel.toLowerCase();
        if (level != 'normal' && !_alertShown) {
          _alertShown = true;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (!mounted) return;
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => AiAlertScreen(prediction: pred, patient: widget.patient),
              ),
            );
          });
        } else if (level == 'normal') {
          _alertShown = false;
        }
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(MonitorScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.updateCounter != widget.updateCounter) {
      _controller.forward(from: 0.0);
      _loadAndAnalyze();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<VitalSignProvider, AiAlertProvider>(
      builder: (context, vitalProvider, aiProvider, child) {
        final latestSign = vitalProvider.allSigns.isNotEmpty ? vitalProvider.allSigns.last : null;
        
        final int bpm = latestSign?.heartRate ?? 75;
        final double temp = latestSign?.temperature ?? 36.6;
        final String bp = latestSign?.bloodPressure ?? "120/80";
        final int brain = 65;
        final int resp = 20;

        return Scaffold(
          body: Stack(
            children: [
              AnimatedBuilder(
                animation: _controller,
                builder: (context, child) {
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Color(0xFF020E1A), Color(0xFF041830)],
                      ),
                    ),
                    child: Row(
                      children: [
                        SizedBox(
                          width: 55,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _vitalLabel('$bpm', 'BPM', aiProvider.getAlertColor()),
                              _vitalLabel('$brain', '%', const Color(0xFF719EFF)),
                              _vitalLabel('$resp', 'RPM', const Color(0xFFFFD700)),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _waveRow(WaveType.ecg, aiProvider.getAlertColor(), _controller.value),
                              _waveRow(WaveType.brain, const Color(0xFF719EFF), _controller.value),
                              _waveRow(WaveType.resp, const Color(0xFFFFD700), _controller.value),
                            ],
                          ),
                        ),
                        Container(
                          width: 85,
                          margin: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              _statBox('EtO2', '98', 'mOs', const Color(0xFF00FF88)),
                              _statBox('NIBP', bp, '(93)', const Color(0xFFFF4444)),
                              _statBox('TEMP', '$temp', '°C', const Color(0xFF719EFF)),
                              if (aiProvider.isAnalyzing)
                                const SizedBox(height: 10, width: 10, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
              
              // AI Alert Overlay
              if (aiProvider.lastPrediction != null)
                Positioned(
                  bottom: 20,
                  left: 20,
                  right: 100,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.8),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: aiProvider.getAlertColor(), width: 2),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              "AI Status: ${aiProvider.lastPrediction!.alertLevel}",
                              style: TextStyle(color: aiProvider.getAlertColor(), fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            Text(
                              "${aiProvider.lastPrediction!.confidence.toStringAsFixed(1)}% Confidence",
                              style: const TextStyle(color: Colors.white70, fontSize: 12),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          aiProvider.lastPrediction!.mainReason,
                          style: const TextStyle(color: Colors.white, fontSize: 11),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _vitalLabel(String value, String unit, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(unit, style: TextStyle(color: color.withOpacity(0.8), fontSize: 8, fontWeight: FontWeight.bold)),
        Text(value, style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.w900, height: 1.1)),
      ],
    );
  }

  Widget _waveRow(WaveType type, Color color, double phase) {
    return SizedBox(
      height: 30,
      child: CustomPaint(
        painter: MonitorPainter(type: type, color: color, phase: phase),
        child: Container(),
      ),
    );
  }

  Widget _statBox(String label, String val1, String val2, Color color) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: Colors.white38, fontSize: 7)),
        Text(val1, style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.bold)),
        Text(val2, style: TextStyle(color: color.withOpacity(0.6), fontSize: 7)),
      ],
    );
  }
}

enum WaveType { ecg, brain, resp }

class MonitorPainter extends CustomPainter {
  final WaveType type;
  final Color color;
  final double phase;

  MonitorPainter({required this.type, required this.color, required this.phase});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    final path = Path();
    final double mid = size.height / 2;
    final double width = size.width;

    if (type == WaveType.ecg) {
      for (double i = 0; i < width; i++) {
        double x = i;
        double relativeX = (i / width + phase) % 1.0;
        double y = mid;

        if (relativeX > 0.1 && relativeX < 0.15) y -= 15;
        else if (relativeX >= 0.15 && relativeX < 0.2) y += 15;

        if (i == 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      }
    } else {
      for (double i = 0; i < width; i++) {
        double freq = (type == WaveType.brain) ? 0.15 : 0.08;
        double amp = (type == WaveType.brain) ? 8 : 5;
        double y = mid + sin((i * freq) + (phase * 2 * pi)) * amp;
        if (i == 0) path.moveTo(i, y);
        else path.lineTo(i, y);
      }
    }
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => true;
}
