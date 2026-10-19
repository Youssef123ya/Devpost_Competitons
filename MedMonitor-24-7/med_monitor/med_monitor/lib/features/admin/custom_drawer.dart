import 'package:flutter/material.dart';
import '../../models/user_model.dart'; // ✅ الموديل الجديد
import '../../features/doctor/logout_screen.dart';
import 'admin_settings_screen.dart';
import 'admin_help_screen.dart';

class CustomSideDrawer extends StatelessWidget {
  final UserModel user; // ✅ تغيير النوع لـ UserModel
  final Function(UserModel) onUpdate; // ✅ تغيير النوع
  final VoidCallback onProfileBack;

  const CustomSideDrawer({
    super.key,
    required this.user,
    required this.onUpdate,
    required this.onProfileBack,
  });

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: Colors.white,
      child: Column(
        children: [
          UserAccountsDrawerHeader(
            decoration: const BoxDecoration(color: Color(0xFF719EFF)),
            accountName: Text(user.userName ?? "Admin", style: const TextStyle(fontWeight: FontWeight.bold)),
            accountEmail: Text(user.email ?? ""),
            currentAccountPicture: const CircleAvatar(
              backgroundImage: AssetImage('assets/super admin (1).png'),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.person),
            title: const Text('My Profile'),
            onTap: () {
              Navigator.pop(context);
              onProfileBack();
            },
          ),
          ListTile(
            leading: const Icon(Icons.settings),
            title: const Text('Settings'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (c) => const AdminSettingsScreen()),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.help),
            title: const Text('Help'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (c) => const AdminHelpScreen()),
              );
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Logout', style: TextStyle(color: Colors.red)),
            onTap: () {
              Navigator.pop(context);
              LogoutDialog.show(context);
            },
          ),
        ],
      ),
    );
  }
}