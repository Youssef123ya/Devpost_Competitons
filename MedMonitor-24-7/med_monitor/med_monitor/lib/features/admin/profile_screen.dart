import 'package:flutter/material.dart';
import '../../models/user_model.dart'; // ✅ تم تغيير المسار للموديل الموحد
import '../../models/app_models.dart';
// تم حذف import الـ UserProfile القديم
import 'edit_profile_screen.dart'; // تأكدي إن دي كمان اتعدلت لـ UserModel

class ProfileScreen extends StatefulWidget {
  final UserModel user; // ✅ تم التعديل
  final void Function(UserModel) onUpdate; // ✅ تم التعديل
  final bool isEmbedded;

  const ProfileScreen({
    Key? key,
    required this.user,
    required this.onUpdate,
    this.isEmbedded = false,
  }) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  Widget build(BuildContext context) {
    // نستخدم widget.user مباشرة لضمان عرض أحدث بيانات دائماً
    final user = widget.user;

    // ✅ تحديث الحقول لتناسب مسميات UserModel الجديد
    final List<ProfileFieldData> profileFields = [
      ProfileFieldData(label: 'Email', value: user.email ?? "N/A"),
      // كلمة السر غالباً لا تأتي من السيرفر، نعرض نجوم ثابتة
      ProfileFieldData(label: 'Password', value: '••••••••'),
      ProfileFieldData(label: 'Date of birth', value: user.dateOfBirth ?? "N/A"),
      ProfileFieldData(
          label: 'Gender',
          value: user.gender == 1 ? "Male" : (user.gender == 2 ? "Female" : "N/A")
      ),
      ProfileFieldData(label: 'Phone', value: user.phoneNumber ?? "N/A"),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFFEDF3FF),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            decoration: const BoxDecoration(
              color: Color(0xFF719EFF),
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(30),
                bottomRight: Radius.circular(30),
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          widget.isEmbedded
                              ? const SizedBox(width: 48)
                              : IconButton(
                            icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white),
                            onPressed: () => Navigator.pop(context),
                          ),
                          IconButton(
                            icon: const Icon(Icons.edit, color: Colors.white),
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => EditProfileScreen(
                                    user: user,
                                    onSave: (updatedUser) {
                                      // نرسل التحديث للأب (SuperAdminScreen)
                                      widget.onUpdate(updatedUser);
                                    },
                                  ),
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                    const Text('Profile', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    // ✅ تغيير name لـ userName
                    Text(user.userName ?? "Admin", style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    Container(
                      width: 100, height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                        image: DecorationImage(
                          // ✅ دعم صورة السيرفر لو موجودة للأدمن
                          image: (user.imageUrl != null && user.imageUrl!.isNotEmpty)
                              ? NetworkImage(user.imageUrl!)
                              : const AssetImage('assets/super admin (1).png') as ImageProvider,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    const SizedBox(height: 15),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(20, 25, 20, 120),
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
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(data.label, style: const TextStyle(color: Color(0xFF2E55A7), fontSize: 15, fontWeight: FontWeight.bold)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
                data.value,
                textAlign: TextAlign.end,
                style: const TextStyle(color: Color(0xFF626262), fontSize: 14, fontWeight: FontWeight.w500)
            ),
          ),
        ],
      ),
    );
  }
}