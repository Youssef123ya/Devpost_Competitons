import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/notification_provider.dart';

class AdminSettingsScreen extends StatelessWidget {
  const AdminSettingsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final notificationProvider = Provider.of<NotificationProvider>(context);

    return Scaffold(
      backgroundColor: const Color(0xFFE9EEF6),
      appBar: AppBar(
        backgroundColor: const Color(0xFF7CA1FF),
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "Settings",
          style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
        ),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(bottom: Radius.circular(20)),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 30),
        child: Column(
          children: [
            _buildSettingSection("Notifications", [
              _buildSettingItem(
                title: "Enable Notifications",
                value: notificationProvider.enableNotifications,
                onChanged: (val) => notificationProvider.updateSetting('enableNotifications', val),
              ),
              const Divider(thickness: 1.5, color: Colors.grey),
              _buildSettingItem(
                title: "Admission Alerts",
                value: notificationProvider.heartRateAlert,
                onChanged: (val) => notificationProvider.updateSetting('heartRateAlert', val),
              ),
              const Divider(thickness: 1.5, color: Colors.grey),
              _buildSettingItem(
                title: "System Alerts",
                value: notificationProvider.oxygenLevelAlert,
                onChanged: (val) => notificationProvider.updateSetting('oxygenLevelAlert', val),
              ),
            ]),
            const SizedBox(height: 30),
            _buildSettingSection("Display", [
              _buildSettingItem(
                title: "Dark Mode",
                value: false,
                onChanged: (val) {},
              ),
              const Divider(thickness: 1.5, color: Colors.grey),
              _buildSettingItem(
                title: "Show Statistics",
                value: true,
                onChanged: (val) {},
              ),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingSection(String title, List<Widget> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF3B5BB5),
          ),
        ),
        const SizedBox(height: 15),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(15),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withOpacity(0.1),
                blurRadius: 5,
              ),
            ],
          ),
          padding: const EdgeInsets.all(15),
          child: Column(children: items),
        ),
      ],
    );
  }

  Widget _buildSettingItem({
    required String title,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF3B5BB5),
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: const Color(0xFF7CA1FF),
            activeTrackColor: const Color(0xFF7CA1FF).withOpacity(0.3),
            inactiveThumbColor: Colors.grey[400],
            inactiveTrackColor: Colors.grey[300],
          ),
        ],
      ),
    );
  }
}
