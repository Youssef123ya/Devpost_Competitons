import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:med_monitor/providers/auth_provider.dart';

class ForgotPasswordEmailScreen extends StatefulWidget {
  const ForgotPasswordEmailScreen({super.key});

  @override
  State<ForgotPasswordEmailScreen> createState() => _ForgotPasswordEmailScreenState();
}

class _ForgotPasswordEmailScreenState extends State<ForgotPasswordEmailScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController emailController = TextEditingController();
  bool isLoading = false;

  @override
  void dispose() {
    emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffE9EEF6),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),
                _buildBackButton(context),
                const SizedBox(height: 40),
                const Text("Forgot password",
                    style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold, color: Color(0xff2F4F9F))),
                const SizedBox(height: 15),
                const Text("Please enter your email to reset the password",
                    style: TextStyle(fontSize: 16, color: Colors.grey)),
                const SizedBox(height: 40),

                TextFormField(
                  controller: emailController,
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    if (value == null || value.isEmpty) return "Email is required";
                    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                      return "Please enter a valid email";
                    }
                    return null;
                  },
                  decoration: _inputDecoration("Email"),
                ),

                const SizedBox(height: 40),
                _buildResetButton(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildResetButton() {
    return SizedBox(
      width: double.infinity,
      height: 55,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xff719EFF),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        ),
        onPressed: isLoading ? null : () async {
          if (!_formKey.currentState!.validate()) return;

          setState(() => isLoading = true);

          try {
            // ✅ استخدام listen: false مهم جداً داخل الـ Functions
            final authProvider = Provider.of<AuthProvider>(context, listen: false);

            // نداء الـ API المربوط بالـ Swagger (POST /LoginContoller/ForgetPasswordByEmail)
            bool isSent = await authProvider.forgetPassword(emailController.text.trim());

            if (!mounted) return;

            if (isSent) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text("Reset code sent to your email!"),
                  backgroundColor: Colors.green,
                ),
              );

              final userId = authProvider.resetUserId;
              // ✅ توجيه لشاشة الـ OTP مع تمرير الإيميل و userId
              Navigator.pushNamed(
                  context,
                  '/otp',
                  arguments: {
                    'email': emailController.text.trim(),
                    'userId': userId,
                  }
              );
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text("Email not found or server error"),
                  backgroundColor: Colors.red,
                ),
              );
            }
          } catch (e) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text("An error occurred, please try again.")),
            );
          } finally {
            if (mounted) setState(() => isLoading = false);
          }
        },
        child: isLoading
            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : const Text("Reset Password", style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildBackButton(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.pop(context),
      child: Container(
        width: 45, height: 45,
        decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
        child: const Icon(Icons.arrow_back, color: Color(0xff2F4F9F)),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: Colors.white,
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: const BorderSide(color: Color(0xff5F84E8))
      ),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: const BorderSide(color: Color(0xff2F4F9F), width: 2)
      ),
    );
  }
}