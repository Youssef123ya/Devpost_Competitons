import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/user_model.dart';
import '../../providers/auth_provider.dart';

class UpdateNurseProfileScreen extends StatefulWidget {
  final UserModel user;
  final Function(UserModel) onSave;

  const UpdateNurseProfileScreen({super.key, required this.user, required this.onSave});

  @override
  State<UpdateNurseProfileScreen> createState() => _UpdateNurseProfileScreenState();
}

class _UpdateNurseProfileScreenState extends State<UpdateNurseProfileScreen> {
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _dobController;
  late TextEditingController _emailController;
  late int _selectedGender;
  bool _isLoading = false;

  // تعريف الألوان كـ static عشان نقدر نستخدمها في كل مكان بسهولة
  static const Color primaryBlue = Color(0xFF719EFF);
  static const Color textColor = Color(0xFF2E55A7);

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.user.userName);
    _phoneController = TextEditingController(text: widget.user.phoneNumber);
    _dobController = TextEditingController(text: widget.user.dateOfBirth);
    _emailController = TextEditingController(text: widget.user.email);
    _selectedGender = widget.user.gender ?? 1;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _dobController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _handleUpdate() async {
    setState(() => _isLoading = true);

    UserModel updatedData = widget.user.copyWith(
      userName: _nameController.text.trim(),
      phoneNumber: _phoneController.text.trim(),
      dateOfBirth: _dobController.text.trim(),
      email: _emailController.text.trim(),
      gender: _selectedGender,
    );

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    bool success = await authProvider.updateUserProfile(updatedData);

    setState(() => _isLoading = false);

    if (success) {
      widget.onSave(updatedData);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Profile Updated Successfully!")),
        );
        Navigator.pop(context, updatedData);
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Failed to update profile on server")),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFEDF3FF),
      appBar: AppBar(
        backgroundColor: primaryBlue,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text(
          'Update Profile',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Center(
              child: Stack(
                children: [
                  Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white,
                      border: Border.all(color: primaryBlue, width: 3), // شيلنا const
                      image: DecorationImage(
                        image: (widget.user.imagePath != null && widget.user.imagePath!.isNotEmpty)
                            ? NetworkImage(widget.user.imagePath!)
                            : const AssetImage('assets/nurse (1).png') as ImageProvider,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: CircleAvatar(
                      backgroundColor: primaryBlue,
                      radius: 18,
                      child: IconButton(
                        icon: const Icon(Icons.camera_alt, size: 18, color: Colors.white),
                        onPressed: () {},
                      ),
                    ),
                  )
                ],
              ),
            ),
            const SizedBox(height: 30),
            _buildEditField("Full Name", _nameController),
            const SizedBox(height: 15),
            _buildEditField("Phone Number", _phoneController),
            const SizedBox(height: 15),
            _buildEditField("Date of Birth (YYYY-MM-DD)", _dobController, isDate: true),
            const SizedBox(height: 15),
            _buildEditField("Email Address", _emailController),
            const SizedBox(height: 25),
            const Align(
              alignment: Alignment.centerLeft,
              child: Text(" Gender", style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                Radio<int>(
                  value: 1,
                  groupValue: _selectedGender,
                  onChanged: (v) => setState(() => _selectedGender = v!),
                  activeColor: primaryBlue,
                ),
                const Text('Male', style: TextStyle(color: textColor)),
                const SizedBox(width: 30),
                Radio<int>(
                  value: 2,
                  groupValue: _selectedGender,
                  onChanged: (v) => setState(() => _selectedGender = v!),
                  activeColor: primaryBlue,
                ),
                const Text('Female', style: TextStyle(color: textColor)),
              ],
            ),
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              height: 55,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryBlue,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                  elevation: 2,
                ),
                onPressed: _isLoading ? null : _handleUpdate,
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text(
                  'Update Now',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEditField(String label, TextEditingController controller, {bool isDate = false}) {
    return TextField(
      controller: controller,
      style: const TextStyle(color: textColor, fontWeight: FontWeight.w600),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: primaryBlue, fontSize: 14), // شيلنا الـ const من هنا
        filled: true,
        fillColor: Colors.white,
        suffixIcon: isDate ? const Icon(Icons.calendar_today, color: primaryBlue, size: 20) : null, // شيلنا الـ const من هنا
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: const BorderSide(color: primaryBlue, width: 1), // شيلنا الـ const من هنا
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: const BorderSide(color: textColor, width: 2),
        ),
      ),
    );
  }
}