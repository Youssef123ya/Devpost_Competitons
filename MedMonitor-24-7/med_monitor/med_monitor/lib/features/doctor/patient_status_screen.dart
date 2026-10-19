import 'package:flutter/material.dart';

class PatientStatusScreen extends StatelessWidget {
  final String status; // لاستقبال الحالة من السيرفر (pending, approved, rejected, etc.)

  const PatientStatusScreen({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    const Color primaryBlue = Color(0xFF719BFF);
    const Color backgroundBlue = Color(0xFFF4F7FF);

    // دالة مساعدة لتحديد الأيقونة واللون بناءً على الحالة
    IconData getStatusIcon() {
      switch (status.toLowerCase()) {
        case 'pending': return Icons.hourglass_empty;
        case 'stable':
        case 'approved': return Icons.check_circle_outline;
        case 'critical':
        case 'rejected': return Icons.error_outline;
        default: return Icons.info_outline;
      }
    }

    Color getStatusColor() {
      switch (status.toLowerCase()) {
        case 'pending': return Colors.grey;
        case 'stable':
        case 'approved': return Colors.green;
        case 'critical':
        case 'rejected': return Colors.redAccent;
        default: return primaryBlue;
      }
    }

    return Scaffold(
      backgroundColor: backgroundBlue,
      body: Column(
        children: [
          // الشريط العلوي (Custom AppBar) - كما هو في تصميمك
          Container(
            height: 120,
            width: double.infinity,
            decoration: const BoxDecoration(
              color: primaryBlue,
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(25),
                bottomRight: Radius.circular(25),
              ),
            ),
            child: SafeArea(
              child: Stack( // أضفت Stack عشان زرار الرجوع لو حبيتي
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                  const Center(
                    child: Text(
                      "Request status",
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // تصميم الأيقونة الدائرية (تتغير حسب الحالة)
                Container(
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    color: getStatusColor().withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: getStatusColor(),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        getStatusIcon(),
                        color: Colors.white,
                        size: 50,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                // نص الحالة
                Text(
                  status.toUpperCase(),
                  style: TextStyle(
                    fontSize: 32,
                    color: getStatusColor().withOpacity(0.8),
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  "Your request is being processed",
                  style: TextStyle(color: Colors.grey, fontSize: 14),
                ),
                const SizedBox(height: 60),

                // زر العودة بتصميم متناسق مع الألوان
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40),
                  child: SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryBlue,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                      ),
                      onPressed: () => Navigator.pop(context),
                      child: const Text(
                        "Back to Home",
                        style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}