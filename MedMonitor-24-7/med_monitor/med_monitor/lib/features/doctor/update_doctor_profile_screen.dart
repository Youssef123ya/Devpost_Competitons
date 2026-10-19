import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../../models/user_model.dart'; // ✅ تم تغيير المسار للموديل الموحد

class UpdateProfileScreen extends StatefulWidget {
  final UserModel user; // ✅ تم التعديل لـ UserModel
  final Function(UserModel) onSave; // ✅ تم التعديل لـ UserModel

  const UpdateProfileScreen({super.key, required this.user, required this.onSave});

  @override
  State<UpdateProfileScreen> createState() => _UpdateProfileScreenState();
}

class _UpdateProfileScreenState extends State<UpdateProfileScreen> {
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _dobController;
  late TextEditingController _emailController;
  late TextEditingController _passController;
  late int _selectedGender; // ✅ تم التغيير لـ int (1 أو 2)

  @override
  void initState() {
    super.initState();
    // ✅ استخدام المسميات الجديدة من الـ UserModel
    _nameController = TextEditingController(text: widget.user.userName);
    _phoneController = TextEditingController(text: widget.user.phoneNumber);
    _dobController = TextEditingController(text: widget.user.dateOfBirth);
    _emailController = TextEditingController(text: widget.user.email);
    _passController = TextEditingController(text: ""); // كلمة المرور يفضل أن تبدأ فارغة
    _selectedGender = widget.user.gender ?? 1; // القيمة الافتراضية 1
  }

  // دالة حفظ البيانات في ذاكرة الجهاز (SharedPreferences)
  Future<void> _saveToDisk(UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    // ✅ استخدام دالة toJson الموجودة في الموديل الجديد
    String userJson = jsonEncode(user.toJson());
    await prefs.setString('user_profile', userJson);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _dobController.dispose();
    _emailController.dispose();
    _passController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const Color primaryBlue = Color(0xFF719EFF);
    const Color textColor = Color(0xFF2E55A7);

    return Scaffold(
      backgroundColor: const Color(0xFFEDF3FF),
      appBar: AppBar(
        backgroundColor: primaryBlue,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text(
          'Edit Profile',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Center(
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.indigo[900],
                  image: DecorationImage(
                    image: (widget.user.imageUrl != null && widget.user.imageUrl!.isNotEmpty)
                        ? NetworkImage(widget.user.imageUrl!)
                        : const AssetImage('assets/doctor (1).png') as ImageProvider,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 30),

            _buildEditField("Name", _nameController),
            const SizedBox(height: 15),
            _buildEditField("Phone", _phoneController),
            const SizedBox(height: 15),
            _buildEditField("Date of birth", _dobController, isDate: true),
            const SizedBox(height: 15),
            _buildEditField("Email", _emailController),
            const SizedBox(height: 15),
            _buildEditField("Password", _passController, isPassword: true),

            const SizedBox(height: 20),

            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Radio<int>(
                  value: 1, // ✅ 1 للميل
                  groupValue: _selectedGender,
                  onChanged: (v) => setState(() => _selectedGender = v!),
                  activeColor: primaryBlue,
                ),
                const Text('Male', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
                const SizedBox(width: 40),
                Radio<int>(
                  value: 2, // ✅ 2 للفيميل
                  groupValue: _selectedGender,
                  onChanged: (v) => setState(() => _selectedGender = v!),
                  activeColor: primaryBlue,
                ),
                const Text('Female', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
              ],
            ),

            const SizedBox(height: 30),

            SizedBox(
              width: double.infinity,
              height: 55,
              child: ElevatedButton(
                onPressed: () async {
                  // ✅ استخدام دالة copyWith لتحديث البيانات
                  UserModel updatedUser = widget.user.copyWith(
                    userName: _nameController.text.trim(),
                    phoneNumber: _phoneController.text.trim(),
                    dateOfBirth: _dobController.text.trim(),
                    email: _emailController.text.trim(),
                    gender: _selectedGender,
                  );

                  await _saveToDisk(updatedUser);
                  widget.onSave(updatedUser);
                  Navigator.of(context).pop();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryBlue,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text(
                  'Update Profile',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEditField(String label, TextEditingController controller, {bool isPassword = false, bool isDate = false}) {
    return TextField(
      controller: controller,
      obscureText: isPassword,
      style: const TextStyle(color: Color(0xFF2E55A7), fontWeight: FontWeight.w600),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Color(0xFF719EFF), fontSize: 14),
        filled: true,
        fillColor: Colors.white,
        suffixIcon: isDate ? const Icon(Icons.calendar_today_outlined, color: Colors.grey) : null,
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF719EFF)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF2E55A7), width: 2),
        ),
      ),
    );
  }
}