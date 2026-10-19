import 'package:flutter/material.dart';
import 'dart:math';

// 1. تعريف الـ Enum عشان BedsScreen يشوفه
enum WaveType { ecg, brain, resp }

// 2. تغيير اسم الكلاس لـ WavePainter عشان BedsScreen يشوفها
class WavePainter extends CustomPainter {
  final WaveType type;
  final Color color;
  final double phase;

  WavePainter({required this.type, required this.color, required this.phase});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path();
    final double w = size.width;
    final double h = size.height;
    final double mid = h / 2;

    if (type == WaveType.ecg) {
      // كود رسم الـ ECG
      double step = w / 3;
      for (double i = -1; i < 3; i++) {
        double x = (i * step + (phase * w)) % (w + step) - (step * 0.5);
        if (x < 0 || x > w) continue;
        path.moveTo(x, mid);
        path.lineTo(x + step * 0.1, mid);
        path.lineTo(x + step * 0.15, mid - h * 0.4);
        path.lineTo(x + step * 0.2, mid + h * 0.3);
        path.lineTo(x + step * 0.25, mid);
        path.lineTo(x + step * 0.5, mid);
      }
    } else if (type == WaveType.brain) {
      // كود رسم الـ Brain
      for (double i = 0; i <= w; i++) {
        double y = mid + sin((i * 0.5) + (phase * 20)) * 3 + cos((i * 0.8)) * 2;
        if (i == 0) path.moveTo(i, y); else path.lineTo(i, y);
      }
    } else {
      // كود رسم الـ Resp
      for (double i = 0; i <= w; i++) {
        double y = mid + sin((i * 0.1) + (phase * 10)) * (h * 0.3);
        if (i == 0) path.moveTo(i, y); else path.lineTo(i, y);
      }
    }

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(WavePainter oldDelegate) => oldDelegate.phase != phase;
}