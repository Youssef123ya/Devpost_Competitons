import 'package:flutter/material.dart';

// استخدام نفس الألوان اللي في مشروعك
class AppColors {
  static const Color primaryBlue = Color(0xFF7CA1FF);
  static const Color darkBlue = Color(0xFF3B5BB5);
  static const Color scaffoldBg = Color(0xFFE9EEF6);
}

class TimeConflictScreen extends StatelessWidget {
  const TimeConflictScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBg,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(30.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // أيقونة التحذير
              const Icon(
                Icons.warning_amber_rounded,
                size: 100,
                color: Colors.orangeAccent,
              ),
              const SizedBox(height: 20),
              const Text(
                "Time Conflict!",
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: AppColors.darkBlue,
                ),
              ),
              const SizedBox(height: 15),
              const Text(
                "This time slot is already taken by another pending task. Please choose a different time.",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.red,
                ),
              ),
              const SizedBox(height: 40),
              // زرار العودة لتعديل الوقت
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryBlue,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(15),
                    ),
                  ),
                  onPressed: () => Navigator.pop(context),
                  child: const Text(
                    "Go Back",
                    style: TextStyle(color: Colors.white, fontSize: 18),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}