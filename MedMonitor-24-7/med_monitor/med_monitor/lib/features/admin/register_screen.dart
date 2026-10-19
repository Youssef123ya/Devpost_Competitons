import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:med_monitor/providers/auth_provider.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final nameController = TextEditingController();
  final emailController = TextEditingController();
  final phoneController = TextEditingController();
  final passwordController = TextEditingController();
  final confirmPasswordController = TextEditingController();

  String selectedRole = ""; // "Doctor" or "Nurse"

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffE9EEF6),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 50),
        child: Column(
          children: [
            const Text(
              "Create Account",
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Color(0xff2F4F9F),
              ),
            ),
            const SizedBox(height: 30),

            buildTextField("Full Name", nameController, false),
            buildTextField("Email", emailController, false),
            buildTextField("Phone Number", phoneController, false, isPhone: true),
            buildTextField("Password", passwordController, true),
            buildTextField("Confirm Password", confirmPasswordController, true),

            const SizedBox(height: 30),

            const Text(
              "CHOOSE YOUR ROLE",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xff2F4F9F),
              ),
            ),
            const SizedBox(height: 20),

            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Expanded(child: buildRoleItem("Doctor", "assets/doctor (1).png")),
                const SizedBox(width: 20),
                Expanded(child: buildRoleItem("Nurse", "assets/nurse (1).png")),
              ],
            ),

            const SizedBox(height: 40),

            SizedBox(
              width: double.infinity,
              height: 55,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xff6D8FEF),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                ),
                onPressed: () async {
                  // 1. التحقق من الحقول
                  if (nameController.text.isEmpty ||
                      emailController.text.isEmpty ||
                      phoneController.text.isEmpty ||
                      passwordController.text.isEmpty ||
                      selectedRole == "") {
                    showSnackBar("Please fill all fields and select a role");
                    return;
                  }

                  if (passwordController.text != confirmPasswordController.text) {
                    showSnackBar("Passwords do not match!");
                    return;
                  }

                  // 2. تحويل الـ Role لرقم يفهمه الباك إيند
                  // حسب السواجر: Admin=1, Doctor=2, Nurse=3
                  int roleValue = selectedRole == "Doctor" ? 2 : 3;

                  // إظهار Loading
                  showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (context) => const Center(child: CircularProgressIndicator(color: Color(0xff6D8FEF))),
                  );

                  final authProvider = Provider.of<AuthProvider>(context, listen: false);

                  // 3. نداء دالة الـ Register
                  bool success = await authProvider.register(
                    username: nameController.text.trim(),
                    email: emailController.text.trim(),
                    phone: phoneController.text.trim(),
                    password: passwordController.text,
                    role: roleValue,
                    gender: 1, // قيمة افتراضية (Male) لأنها مطلوبة في الباك
                  );

                  if (!mounted) return;
                  Navigator.pop(context); // إخفاء الـ Loading

                  if (success) {
                    showSnackBar("Account Created Successfully!", isError: false);
                    Navigator.pushReplacementNamed(context, '/login');
                  } else {
                    final errorMessage = authProvider.registerError.isNotEmpty
                        ? authProvider.registerError
                        : "Registration Failed! Username or Email might exist.";
                    showSnackBar(errorMessage);
                  }
                },
                child: const Text("Sign up", style: TextStyle(color: Colors.white, fontSize: 20)),
              ),
            ),

            const SizedBox(height: 15),

            SizedBox(
              width: double.infinity,
              height: 55,
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFF719EFF), width: 2),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                ),
                onPressed: () => Navigator.pushNamed(context, '/login'),
                child: const Text(
                  "Already have an account",
                  style: TextStyle(color: Color(0xff6D8FEF), fontSize: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void showSnackBar(String message, {bool isError = true}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Widget buildTextField(String hint, TextEditingController controller, bool isPass, {bool isPhone = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15),
      child: TextField(
        controller: controller,
        obscureText: isPass,
        keyboardType: isPhone
            ? TextInputType.phone
            : (hint == "Email" ? TextInputType.emailAddress : TextInputType.text),
        decoration: InputDecoration(
          hintText: hint,
          filled: true,
          fillColor: Colors.white,
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xff6D8FEF)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xff2F4F9F), width: 2),
          ),
        ),
      ),
    );
  }

  Widget buildRoleItem(String roleName, String imagePath) {
    bool isSelected = selectedRole == roleName;
    return GestureDetector(
      onTap: () => setState(() => selectedRole = roleName),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(5),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(15),
              border: Border.all(
                color: isSelected ? const Color(0xff2F4F9F) : Colors.transparent,
                width: 3,
              ),
              boxShadow: [
                if (isSelected)
                  BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10)
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.asset(imagePath, width: 100, height: 100, fit: BoxFit.cover),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            roleName,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: isSelected ? const Color(0xff2F4F9F) : Colors.grey,
            ),
          ),
        ],
      ),
    );
  }
}