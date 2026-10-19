import 'package:flutter/material.dart';
import '../../models/user_model.dart'; // ✅ الموديل الجديد الموحد
import 'update_nurse_profile_screen.dart';

// كلاس بسيط لتنظيم عرض البيانات
class ProfileFieldData {
  final String label;
  final String value;
  ProfileFieldData({required this.label, required this.value});
}

class NurseProfileScreen extends StatefulWidget {
  final UserModel user; // ✅ تغيير النوع
  final void Function(UserModel) onUpdate; // ✅ تغيير النوع

  const NurseProfileScreen({
    super.key,
    required this.user,
    required this.onUpdate,
  });

  @override
  State<NurseProfileScreen> createState() => _NurseProfileScreenState();
}

class _NurseProfileScreenState extends State<NurseProfileScreen> {
  @override
  Widget build(BuildContext context) {
    // بناء القائمة بناءً على بيانات UserModel الحقيقية
    final List<ProfileFieldData> profileFields = [
      ProfileFieldData(label: 'Email', value: widget.user.email ?? "N/A"),
      ProfileFieldData(label: 'Specialization', value: widget.user.specialization ?? "General Nurse"),
      ProfileFieldData(label: 'Date of birth', value: widget.user.dateOfBirth ?? "N/A"),
      ProfileFieldData(
          label: 'Gender',
          value: widget.user.gender == 1 ? 'Male' : (widget.user.gender == 2 ? 'Female' : 'N/A')
      ),
      ProfileFieldData(label: 'Phone', value: widget.user.phoneNumber ?? "N/A"),
    ];

    const Color headerColor = Color(0xFF719EFF);
    const Color mainBackgroundColor = Color(0xFFEDF3FF);

    return Scaffold(
      backgroundColor: mainBackgroundColor,
      body: Column(
        children: [
          // --- Header ---
          Container(
            width: double.infinity,
            decoration: const BoxDecoration(
              color: headerColor,
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(30),
                bottomRight: Radius.circular(30),
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Column(
                children: [
                  // زر التعديل
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: Align(
                      alignment: Alignment.centerRight,
                      child: IconButton(
                        icon: const Icon(Icons.edit, color: Colors.white),
                        onPressed: () async {
                          final updatedUser = await Navigator.pushNamed<UserModel>(
                            context,
                            '/edit-profile',
                            arguments: {
                              'user': widget.user,
                              'onSave': (newUser) {
                                widget.onUpdate(newUser);
                              },
                            },
                          );

                          if (updatedUser != null) {
                            setState(() {}); // تحديث الشاشة بالبيانات الجديدة
                          }
                        },
                      ),
                    ),
                  ),
                  const Text(
                    'Profile',
                    style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 15),

                  // صورة الممرضة (Dynamic)
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 3),
                      image: DecorationImage(
                        image: (widget.user.imagePath != null && widget.user.imagePath!.isNotEmpty)
                            ? NetworkImage(widget.user.imagePath!)
                            : const AssetImage('assets/nurse (1).png') as ImageProvider,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    widget.user.userName ?? "Nurse Name",
                    style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 25),
                ],
              ),
            ),
          ),

          // --- قائمة البيانات ---
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(20, 25, 20, 110),
              physics: const BouncingScrollPhysics(),
              itemCount: profileFields.length,
              itemBuilder: (context, index) => _buildProfileItem(profileFields[index]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileItem(ProfileFieldData data) {
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: const Color(0xFFDDE7F5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            data.label,
            style: const TextStyle(color: Color(0xFF2E55A7), fontSize: 15, fontWeight: FontWeight.bold),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              data.value,
              textAlign: TextAlign.end,
              style: const TextStyle(color: Color(0xFF626262), fontSize: 14, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}