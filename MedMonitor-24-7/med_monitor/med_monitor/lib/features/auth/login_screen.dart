import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:med_monitor/providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();

  final TextEditingController usernameController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  bool isPasswordHidden = true;

  @override
  Widget build(BuildContext context) {
    // listen: false لأننا بننادي دوال بس مش محتاجين الشاشة تعمل Rebuild كل شوية
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    return Scaffold(
      backgroundColor: const Color(0xFFEDF3FF),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 60),
                const Text(
                  "Login here",
                  style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFF2E55A7)),
                ),
                const SizedBox(height: 20),
                const Text(
                  "Welcome back you’ve\nbeen missed!",
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600, color: Colors.black),
                ),
                const SizedBox(height: 50),

                // 🔹 خانة الـ Username
                TextFormField(
                  controller: usernameController,
                  keyboardType: TextInputType.text,
                  validator: (value) {
                    if (value == null || value.isEmpty) return "Please enter your username";
                    return null;
                  },
                  decoration: buildInputDecoration("Username"),
                ),

                const SizedBox(height: 20),

                // 🔹 خانة الـ Password
                TextFormField(
                  controller: passwordController,
                  obscureText: isPasswordHidden,
                  validator: (value) {
                    if (value == null || value.isEmpty) return "Please enter your password";
                    return null;
                  },
                  decoration: buildInputDecoration("Password", isPassword: true),
                ),

                const SizedBox(height: 15),

                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => Navigator.pushNamed(context, '/forgot-email'),
                    child: const Text(
                      "Forgot your password?",
                      style: TextStyle(color: Color(0xFF2E55A7), fontWeight: FontWeight.w600),
                    ),
                  ),
                ),

                const SizedBox(height: 30),

                SizedBox(
                  width: double.infinity,
                  height: 55,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF719EFF),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                    ),
                    onPressed: () async {
                      try {
                        if (_formKey.currentState!.validate()) {
                          debugPrint('🔐 [LoginScreen] Starting login flow');
                          // إظهار Loading
                          showDialog(
                            context: context,
                            barrierDismissible: false,
                            builder: (context) => const Center(child: CircularProgressIndicator(color: Color(0xFF719EFF))),
                          );

                          // محاولة تسجيل الدخول
                          bool success = await authProvider.login(
                            usernameController.text.trim(),
                            passwordController.text,
                          );

                          debugPrint('🔐 [LoginScreen] Login returned: $success');
                          if (!mounted) {
                            debugPrint('🔐 [LoginScreen] Widget unmounted before closing dialog');
                            return;
                          }

                          debugPrint('🔐 [LoginScreen] Closing loading dialog');
                          Navigator.pop(context); // إخفاء الـ Loading

                          if (success) {
                            // 🔹 طباعة الدور بعد تسجيل الدخول
                            final userRole = authProvider.currentUser?.role;
                            debugPrint('Role after login: $userRole');

                            if (userRole == 1) {
                              debugPrint('🔐 [LoginScreen] Navigating to /welcome_back');
                              Navigator.pushNamedAndRemoveUntil(
                                context,
                                '/welcome_back',
                                (route) => false,
                              );
                            } else if (userRole == 2) {
                              debugPrint('🔐 [LoginScreen] Navigating to /doctor-home');
                              Navigator.pushNamedAndRemoveUntil(
                                context,
                                '/doctor-home',
                                (route) => false,
                              );
                            } else if (userRole == 3) {
                              debugPrint('🔐 [LoginScreen] Navigating to /nurse-home');
                              Navigator.pushNamedAndRemoveUntil(
                                context,
                                '/nurse-home',
                                (route) => false,
                              );
                            } else {
                              debugPrint('Unknown role: $userRole');
                              Navigator.pushNamedAndRemoveUntil(
                                context,
                                '/login',
                                (route) => false,
                              );
                            }
                          } else {
                            debugPrint('🔐 [LoginScreen] Login failed, showing snackbar');
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text("Login Failed! Please check your credentials."),
                                backgroundColor: Colors.red,
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                          }
                        }
                      } catch (e, stackTrace) {
                        debugPrint('🔴 [LoginScreen] Login button exception: $e');
                        debugPrint('🔴 [LoginScreen] Stack trace: $stackTrace');
                        if (mounted) {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Login exception: $e'),
                              backgroundColor: Colors.red,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      }
                    },
                    child: const Text(
                        "Sign in",
                        style: TextStyle(fontSize: 18, color: Colors.white, fontWeight: FontWeight.bold)
                    ),
                  ),
                ),

                // 🔹 Sign Up Link

              ],
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration buildInputDecoration(String hint, {bool isPassword = false}) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      suffixIcon: isPassword ? IconButton(
        icon: Icon(isPasswordHidden ? Icons.visibility_off : Icons.visibility, color: const Color(0xFF6E8FEF)),
        onPressed: () => setState(() => isPasswordHidden = !isPasswordHidden),
      ) : null,
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(15),
        borderSide: const BorderSide(color: Color(0xFF6E8FEF), width: 2),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(15),
        borderSide: const BorderSide(color: Color(0xFF3E5BA9), width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(15),
        borderSide: const BorderSide(color: Colors.red, width: 2),
      ),
    );
  }
}