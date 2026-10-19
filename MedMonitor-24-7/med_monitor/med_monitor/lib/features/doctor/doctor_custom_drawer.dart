import 'package:flutter/material.dart';
import '../../models/user_model.dart'; // ✅ الموديل الموحد
import '../../features/doctor/logout_screen.dart';
import '../../features/doctor/settings_screen.dart';
import '../../features/doctor/help_screen.dart';
// تأكدي أن هذه الشاشة أيضاً تم تعديلها لتقبل UserModel
import '../../features/doctor/update_doctor_profile_screen.dart';

class CustomSideDrawer extends StatelessWidget {
  final UserModel user; // ✅ تم التغيير لـ UserModel
  final Function(UserModel) onUpdate; // ✅ تم التغيير لـ UserModel
  final VoidCallback onProfileBack;

  const CustomSideDrawer({
    super.key,
    required this.user,
    required this.onUpdate,
    required this.onProfileBack,
  });

  @override
  Widget build(BuildContext context) {
    // توحيد الألوان
    const Color itemsColor = Colors.black;
    const Color nameColor = Color(0xFF2E55A7);

    return Drawer(
      backgroundColor: Colors.white,
      width: MediaQuery.of(context).size.width * 0.75,
      child: Column(
        children: [
          // Header
          Container(
            height: 180,
            width: double.infinity,
            decoration: const BoxDecoration(
              color: Color(0xFF719EFF),
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(30),
                bottomRight: Radius.circular(30),
              ),
            ),
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 35,
                      backgroundColor: Colors.white,
                      backgroundImage: (user.imageUrl != null && user.imageUrl!.isNotEmpty)
                          ? NetworkImage(user.imageUrl!)
                          : const AssetImage('assets/doctor (1).png') as ImageProvider,
                    ),
                    const SizedBox(width: 15),
                    Flexible(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user.userName ?? "Doctor", // ✅ استخدام userName
                            style: const TextStyle(
                              color: nameColor,
                              fontSize: 19,
                              fontWeight: FontWeight.bold,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            user.specialization ?? "Medical Specialist", // ✅ جلب التخصص
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // القائمة
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              physics: const BouncingScrollPhysics(),
              children: [
                // 1. تعديل الملف الشخصي
                _drawerItem(Icons.edit_note_outlined, ' Profile', itemsColor, () async {
                  Navigator.pop(context);
                  await Navigator.push(
                    context,
                    MaterialPageRoute(
                      // ✅ تم التمرير كـ UserModel
                      builder: (c) => UpdateProfileScreen(user: user, onSave: onUpdate),
                    ),
                  );
                  onProfileBack();
                }),

                // 2. الإعدادات
                _drawerItem(Icons.settings_outlined, 'Settings', itemsColor, () {
                  Navigator.pop(context);
                  Navigator.push(context, MaterialPageRoute(builder: (c) => const SettingsScreen()));
                }),

                // 3. المساعدة
                _drawerItem(Icons.help_outline, 'Help', itemsColor, () {
                  Navigator.pop(context);
                  Navigator.push(context, MaterialPageRoute(builder: (c) => const HelpScreen()));
                }),

                // 4. تسجيل الخروج
                _drawerItem(Icons.logout, 'Log out', itemsColor, () {
                  Navigator.pop(context);
                  LogoutDialog.show(context);
                }),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _drawerItem(IconData ic, String t, Color color, VoidCallback onTap) => ListTile(
    leading: Icon(ic, color: color, size: 26),
    title: Text(
      t,
      style: TextStyle(
        color: color,
        fontSize: 16,
        fontWeight: FontWeight.w500,
      ),
    ),
    trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
    onTap: onTap,
  );
}