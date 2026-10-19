import 'package:flutter/material.dart';

class DynamicCirclePainter extends CustomPainter {
  final double xOffsetPercent;
  DynamicCirclePainter({required this.xOffsetPercent});

  @override
  void paint(Canvas canvas, Size size) {
    Paint p = Paint()
      ..color = const Color(0xFF719EFF)
      ..style = PaintingStyle.fill;

    double r = 38;
    double x = size.width * xOffsetPercent;

    Path path = Path()
      ..moveTo(0, 30)
      ..lineTo(x - r - 10, 30)
      ..quadraticBezierTo(x - r, 30, x - r, 30 - 5)
      ..arcToPoint(Offset(x + r, 30 - 5), radius: Radius.circular(r), clockwise: false)
      ..quadraticBezierTo(x + r, 30, x + r + 10, 30)
      ..lineTo(size.width, 30)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();

    canvas.drawPath(path, p);
  }

  @override
  bool shouldRepaint(DynamicCirclePainter old) => old.xOffsetPercent != xOffsetPercent;
}