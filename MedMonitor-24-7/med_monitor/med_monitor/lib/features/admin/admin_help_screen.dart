import 'package:flutter/material.dart';

class AdminHelpScreen extends StatelessWidget {
  const AdminHelpScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    const Color primaryBlue = Color(0xFF7CA1FF);
    const Color textBlue = Color(0xFF3B5BB5);

    return Scaffold(
      backgroundColor: const Color(0xFFE9EEF6),
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
            const Text(
              "ICU Monitoring System - Super Admin Guide",
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: textBlue,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 25),
            _buildSectionTitle("1-System Overview"),
            _buildSectionContent(
              "The ICU Monitoring System connects patients with doctors and nurses in real time. As Super Admin, you have access to manage all hospital resources, monitor admissions, and oversee bed management.",
            ),
            _buildSectionTitle("2-Dashboard"),
            _buildSectionContent(
              "The dashboard displays critical statistics including occupied beds, available beds, total patients, doctors, nurses, and pending admission requests. Refresh the screen to see updated data.",
            ),
            _buildSectionTitle("3-Managing Admission Requests"),
            _buildBulletPoint("View all pending admission requests"),
            _buildBulletPoint("Approve or reject patient admission requests"),
            _buildBulletPoint("View patient details and medical history"),
            _buildBulletPoint("Track request status in real time"),
            const SizedBox(height: 20),
            _buildSectionTitle("4-User Management"),
            _buildBulletPoint("View all doctors, nurses, and patients"),
            _buildBulletPoint("Monitor user activity and profiles"),
            _buildBulletPoint("Manage user permissions and roles"),
            const SizedBox(height: 20),
            _buildSectionTitle("5-Common Tasks"),
            _buildFAQItem(
              "How do I approve an admission request?",
              "Go to Pending Admission Requests and select the request. Click Approve to add the patient to the system.",
            ),
            _buildFAQItem(
              "How do I check bed availability?",
              "The dashboard shows occupied and available beds in real time. Use this information to approve admission requests.",
            ),
            _buildFAQItem(
              "How can I view patient statistics?",
              "Scroll down on the dashboard to see age group statistics and patient distribution.",
            ),
            _buildFAQItem(
              "How do I access my profile?",
              "Tap the Profile icon in the bottom navigation or use the menu in the header.",
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

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

  Widget _buildSectionContent(String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15),
      child: Text(
        content,
        style: const TextStyle(
          fontSize: 16,
          color: Color(0xFF3B5BB5),
          height: 1.5,
        ),
      ),
    );
  }

  Widget _buildBulletPoint(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 15),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("• ", style: TextStyle(fontSize: 18, color: Color(0xFF3B5BB5))),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 16, color: Color(0xFF3B5BB5), height: 1.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFAQItem(String question, String answer) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Q: $question",
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF3B5BB5),
            ),
          ),
          const SizedBox(height: 5),
          Text(
            "A: $answer",
            style: const TextStyle(
              fontSize: 15,
              color: Color(0xFF3B5BB5),
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}
