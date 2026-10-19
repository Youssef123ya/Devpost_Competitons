import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:med_monitor/providers/auth_provider.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({Key? key}) : super(key: key);

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isLoading = false;
  String? _passedUserId;

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _updatePassword(String email, String otp) async {
    if (!_formKey.currentState!.validate()) return;

    // ✅ تأكيد إضافي لو الإيميل مجاش من الشاشة اللي فاتت
    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Email is missing. Please try again from the start.")),
      );
      return;
    }

    if (otp.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("OTP is missing. Please verify the code first.")),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);

      debugPrint('ResetPasswordScreen calling resetPassword with email=$email, otp=$otp, newPasswordLength=${_passwordController.text.trim().length}');

      // ✅ استدعاء الدالة المربوطة بالـ Swagger (ChangePasswordNotToken)
      bool isSuccess = await authProvider.resetPassword(
        email: email,
        newPassword: _passwordController.text.trim(),
        otp: otp,
        userId: _passedUserId,
      );

      if (!mounted) return;

      if (isSuccess) {
        // التوجه لشاشة النجاح
        Navigator.pushReplacementNamed(context, '/update-password-success');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Failed to update password. Please try again.")),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Connection Error. Please check your internet.")),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // ✅ استلام الإيميل والـ OTP الممررين من شاشة الـ OTP
    final args = ModalRoute.of(context)?.settings.arguments;
    String userEmail = '';
    String? passedOtp;
    _passedUserId = null;
    if (args is Map) {
      userEmail = args['email']?.toString() ?? '';
      passedOtp = args['otp']?.toString();
      _passedUserId = args['userId']?.toString();
    } else {
      userEmail = args as String? ?? '';
    }

    debugPrint('ResetPasswordScreen received email=$userEmail, otp=$passedOtp, userId=$_passedUserId');

    return Scaffold(
      backgroundColor: const Color(0xFFF3F5FA),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),
                _buildBackButton(),
                const SizedBox(height: 40),
                const Text("Set a new password",
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Color(0xFF3B5BB5))),
                const SizedBox(height: 16),
                const Text("Create a new password. Ensure it differs from previous ones for security",
                    style: TextStyle(fontSize: 16, color: Colors.grey, height: 1.5)),
                const SizedBox(height: 40),

                _buildPasswordField(
                  controller: _passwordController,
                  hint: "Password",
                  obscure: _obscurePassword,
                  onToggle: () => setState(() => _obscurePassword = !_obscurePassword),
                  validator: (value) {
                    if (value == null || value.isEmpty) return "Please enter password";
                    if (value.length < 6) return "Minimum 6 characters required"; // حسب أغلب قواعد البيانات
                    return null;
                  },
                ),

                const SizedBox(height: 20),

                _buildPasswordField(
                  controller: _confirmPasswordController,
                  hint: "Confirm Password",
                  obscure: _obscureConfirmPassword,
                  onToggle: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                  validator: (value) {
                    if (value == null || value.isEmpty) return "Please confirm your password";
                    if (value != _passwordController.text) return "Passwords do not match";
                    return null;
                  },
                ),

                const SizedBox(height: 40),

                SizedBox(
                  width: double.infinity,
                  height: 55,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6C8CE3),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                    ),
                    onPressed: _isLoading ? null : () => _updatePassword(userEmail, passedOtp ?? ''),
                    child: _isLoading
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text("Update Password",
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPasswordField({
    required TextEditingController controller,
    required String hint,
    required bool obscure,
    required VoidCallback onToggle,
    required String? Function(String?) validator,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      validator: validator,
      decoration: InputDecoration(
        hintText: hint,
        filled: true,
        fillColor: Colors.white,
        suffixIcon: IconButton(
          icon: Icon(obscure ? Icons.visibility_off : Icons.visibility, color: Colors.grey),
          onPressed: onToggle,
        ),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(15),
            borderSide: const BorderSide(color: Color(0xFF6C8CE3), width: 1.5)
        ),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(15),
            borderSide: const BorderSide(color: Color(0xFF3B5BB5), width: 2)
        ),
        errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(15),
            borderSide: const BorderSide(color: Colors.red, width: 1)
        ),
        focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(15),
            borderSide: const BorderSide(color: Colors.red, width: 2)
        ),
      ),
    );
  }

  Widget _buildBackButton() {
    return GestureDetector(
      onTap: () => Navigator.pop(context),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
        child: const Icon(Icons.arrow_back, color: Colors.black),
      ),
    );
  }
}