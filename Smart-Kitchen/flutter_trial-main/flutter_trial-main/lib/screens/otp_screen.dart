import 'package:flutter/material.dart';
import 'new_password.dart';
import '../services/api_service.dart';

class OtpScreen extends StatefulWidget {
  final String emailOrPhone;

  const OtpScreen({super.key, required this.emailOrPhone});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final ApiService api = ApiService();

  final TextEditingController c1 = TextEditingController();
  final TextEditingController c2 = TextEditingController();
  final TextEditingController c3 = TextEditingController();
  final TextEditingController c4 = TextEditingController();

  final FocusNode f1 = FocusNode();
  final FocusNode f2 = FocusNode();
  final FocusNode f3 = FocusNode();
  final FocusNode f4 = FocusNode();

  bool isLoading = false;

  @override
  void dispose() {
    c1.dispose();
    c2.dispose();
    c3.dispose();
    c4.dispose();
    f1.dispose();
    f2.dispose();
    f3.dispose();
    f4.dispose();
    super.dispose();
  }

  Widget otpBox(TextEditingController controller, FocusNode node,
      {FocusNode? nextNode, FocusNode? prevNode}) {
    return SizedBox(
      width: 55,
      height: 55,
      child: TextField(
        controller: controller,
        focusNode: node,
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        maxLength: 1,
        style: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
        decoration: InputDecoration(
          counterText: "",
          filled: true,
          fillColor: const Color(0xFFF5F5F5),
          contentPadding: const EdgeInsets.symmetric(vertical: 0),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
        ),
        onChanged: (value) {
          if (value.isNotEmpty) {
            if (nextNode != null) {
              FocusScope.of(context).requestFocus(nextNode);
            } else {
              node.unfocus();
            }
          } else {
            if (prevNode != null) {
              FocusScope.of(context).requestFocus(prevNode);
            }
          }
        },
      ),
    );
  }

  void _verifyOtp() async {
    final otp = (c1.text + c2.text + c3.text + c4.text).trim();

    if (otp.length < 4) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please enter a 4-digit OTP")),
      );
      return;
    }

    if (isLoading) return;

    setState(() => isLoading = true);

    try {
      await api.verifyOtp(
        otp: otp,
        emailOrPhone: widget.emailOrPhone.trim(),
      );

      if (!mounted) return;

      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) =>
              NewPasswordScreen(emailOrPhone: widget.emailOrPhone),
        ),
      );
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Invalid or expired OTP. Try again."),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            const SizedBox(height: 20),

            const Text(
              "Forget Your Password",
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 8),

            Text(
              "Please Enter the code that sent to\n${widget.emailOrPhone}",
              style: const TextStyle(
                fontSize: 13,
                color: Colors.grey,
              ),
            ),

            const SizedBox(height: 30),

            /// OTP Boxes
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                otpBox(c1, f1, nextNode: f2),
                otpBox(c2, f2, nextNode: f3, prevNode: f1),
                otpBox(c3, f3, nextNode: f4, prevNode: f2),
                otpBox(c4, f4, prevNode: f3),
              ],
            ),

            const SizedBox(height: 30),

            /// Verify Button
            SizedBox(
              width: double.infinity,
              height: 55,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                  elevation: 0,
                ),
                onPressed: isLoading ? null : _verifyOtp,
                child: isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text(
                  "Verify",
                  style: TextStyle(fontSize: 16),
                ),
              ),
            ),

            const SizedBox(height: 15),

            /*const Center(
              child: Text(
                "Don't receive the code ? Resend Code",
                style: TextStyle(
                  color: Colors.grey,
                  fontSize: 12,
                ),
              ),
            ),*/
          ],
        ),
      ),
    );
  }
}