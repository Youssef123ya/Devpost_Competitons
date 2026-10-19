import 'package:flutter/material.dart';

class HelpScreen extends StatelessWidget {
  const HelpScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // تعريف اللون الأزرق الموحد للتطبيق
    const Color primaryBlue = Color(0xFF7CA1FF);
    const Color textBlue = Color(0xFF3B5BB5);

    return Scaffold(
      backgroundColor: const Color(0xFFE9EEF6),

      /// --- AppBar ---
      appBar: AppBar(
        backgroundColor: primaryBlue,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "Help",
          style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
        ),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(bottom: Radius.circular(20)),
        ),
      ),

      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            /// الوصف التعريفي العلوي
            const Text(
              "This system connects ICU patients with doctors and nurses in real time to reduce medical errors and improve response time.",
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: textBlue,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 25),

            /// القسم الأول
            _buildSectionTitle("1-How Monitoring Works"),
            _buildSectionContent(
              "Each patient is monitored through a live camera feed. The system analyzes the video using Computer Vision (OpenCV) to detect vital signs like heart rate, oxygen level, and breathing rate.",
            ),

            /// القسم الثاني
            _buildSectionTitle("2-Using the Mobile App"),
            _buildSectionContent(
              "You can view all patient data and history through the Flutter mobile app. The app also allows you to track tasks, receive alerts, and view live data from each bed.",
            ),

            /// القسم الثالث (Common Actions)
            _buildSectionTitle("3-Common Actions"),
            _buildBulletPoint("Add or edit patient data"),
            _buildBulletPoint("View real-time vital signs"),
            _buildBulletPoint("Receive alerts for abnormal readings"),
            _buildBulletPoint("Mark tasks as completed"),
            _buildBulletPoint("Sync with connected devices"),
            const SizedBox(height: 20),

            /// القسم الرابع (FAQ)
            _buildSectionTitle("4-Frequently Asked Questions (FAQ)"),
            _buildFAQItem(
              "Why am I not receiving alerts?",
              "Check that notifications are enabled in Settings.",
            ),
            _buildFAQItem(
              "How do I connect a new device?",
              "Go to Device Settings and select “Add Device.”",
            ),
            _buildFAQItem(
              "How often is the data updated?",
              "Every few seconds, based on your chosen refresh rate.",
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  // ميثود لعنوان القسم
  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 19,
          fontWeight: FontWeight.bold,
          color: Color(0xFF3B5BB5),
        ),
      ),
    );
  }

  // ميثود لمحتوى القسم
  Widget _buildSectionContent(String content) {
    return Text(
      content,
      textAlign: TextAlign.center, // خليته Center زي الصورة بالظبط
      style: TextStyle(
        fontSize: 15,
        color: const Color(0xFF7CA1FF).withOpacity(0.9),
        height: 1.6,
      ),
    );
  }

  // ميثود للنقاط (Bullet Points)
  Widget _buildBulletPoint(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 10, bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("• ", style: TextStyle(color: Color(0xFF7CA1FF), fontSize: 20)),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 15, color: Color(0xFF7CA1FF)),
            ),
          ),
        ],
      ),
    );
  }

  // ميثود للأسئلة الشائعة
  Widget _buildFAQItem(String question, String answer) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "• $question",
            style: const TextStyle(fontSize: 15, color: Color(0xFF7CA1FF), fontWeight: FontWeight.w500),
          ),
          Padding(
            padding: const EdgeInsets.only(left: 20, top: 5),
            child: Text(
              "→ $answer",
              style: const TextStyle(fontSize: 14, color: Color(0xFF7CA1FF)),
            ),
          ),
        ],
      ),
    );
  }
}