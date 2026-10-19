import 'package:flutter/material.dart';
import 'password_changed_screen.dart';
import '../services/api_service.dart';

class NewPasswordScreen extends StatefulWidget {
  final String emailOrPhone;

  const NewPasswordScreen({super.key, required this.emailOrPhone});

  @override
  State<NewPasswordScreen> createState() => _NewPasswordScreenState();
}

class _NewPasswordScreenState extends State<NewPasswordScreen> {
  final TextEditingController newPasswordController = TextEditingController();
  final TextEditingController confirmPasswordController = TextEditingController();
  final ApiService api = ApiService();
  bool isLoading = false;

  bool _obscureNew = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    newPasswordController.dispose();
    confirmPasswordController.dispose();
    super.dispose();
  }

  void resetPassword() async {
    final newPass = newPasswordController.text.trim();
    final confirmPass = confirmPasswordController.text.trim();

    if (newPass.isEmpty || confirmPass.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please fill all fields")),
      );
      return;
    }

    if (newPass != confirmPass) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Passwords do not match")),
      );
      return;
    }

    setState(() => isLoading = true);

    try {
      await api.resetPassword(
        emailOrPhone: widget.emailOrPhone,
        newPassword: newPass,
        confirmPassword: confirmPass,
      );

      if (!mounted) return;

      showDialog(
        context: context,
        barrierDismissible: true,
        builder: (context) => const PasswordChangedDialog(),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  InputDecoration customField(String hint, bool obscure, VoidCallback toggle) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: const Color(0xFFF5F5F5),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(30),
        borderSide: BorderSide.none,
      ),
      suffixIcon: IconButton(
        icon: Icon(obscure ? Icons.visibility_off : Icons.visibility),
        onPressed: toggle,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Create Password", style: TextStyle(color: Colors.black)),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: const BackButton(color: Colors.black),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Create a secure Password",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 5),
            const Text(
              "Please enter a strong Password and keep it well",
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 20),

            /// New Password
            TextField(
              controller: newPasswordController,
              obscureText: _obscureNew,
              decoration: customField(
                "New Password",
                _obscureNew,
                    () {
                  setState(() {
                    _obscureNew = !_obscureNew;
                  });
                },
              ),
            ),

            const SizedBox(height: 20),

            /// Confirm Password
            TextField(
              controller: confirmPasswordController,
              obscureText: _obscureConfirm,
              decoration: customField(
                "Confirm New Password",
                _obscureConfirm,
                    () {
                  setState(() {
                    _obscureConfirm = !_obscureConfirm;
                  });
                },
              ),
            ),

            const SizedBox(height: 20),

            const Text(
              "Must Contain at least",
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 5),
            const Text("8 character"),
            const Text("1 lower character"),
            const Text("1 Upper character"),

            const SizedBox(height: 60),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  padding: const EdgeInsets.all(15),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                onPressed: isLoading ? null : resetPassword,
                child: isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text("Reset"),
              ),
            ),
          ],
        ),
      ),
    );
  }
}