import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/notification_provider.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // بنسحب البيانات من البروفايدر
    final navProvider = Provider.of<NotificationProvider>(context);

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
            _buildSettingItem(
              title: "Enable Notifications",
              value: navProvider.enableNotifications,
              onChanged: (val) => navProvider.updateSetting('enableNotifications', val),
            ),
            const Divider(thickness: 1.5, color: Colors.grey),

            _buildSettingItem(
              title: "Heart Rate Alert",
              value: navProvider.heartRateAlert,
              onChanged: (val) => navProvider.updateSetting('heartRateAlert', val),
            ),

            _buildSettingItem(
              title: "Oxygen Level Alert",
              value: navProvider.oxygenLevelAlert,
              onChanged: (val) => navProvider.updateSetting('oxygenLevelAlert', val),
            ),

            _buildSettingItem(
              title: "Task Delay Alert",
              value: navProvider.taskDelayAlert,
              onChanged: (val) => navProvider.updateSetting('taskDelayAlert', val),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingItem({
    required String title,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 15),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 20,
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