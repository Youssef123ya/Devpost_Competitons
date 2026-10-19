import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:med_monitor/providers/auth_provider.dart';

class OtpVerificationScreen extends StatefulWidget {
  const OtpVerificationScreen({Key? key}) : super(key: key);

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  // السواجر بتاعك مش محدد عدد أرقام الـ OTP، بس الدارج 5 أو 6، إحنا هنمشي على كودك (6 خانات)
  final List<TextEditingController> _controllers = List.generate(6, (index) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (index) => FocusNode());

  bool _isLoading = false;
  String _userEmail = '';
  String? _userId;

  @override
  void dispose() {
    for (var controller in _controllers) controller.dispose();
    for (var node in _focusNodes) node.dispose();
    super.dispose();
  }

  void _onCodeChanged(String value, int index) {
    if (value.isNotEmpty) {
      if (index < 5) {
        _focusNodes[index + 1].requestFocus();
      } else {
        _focusNodes[index].unfocus();
      }
    } else {
      if (index > 0) {
        _focusNodes[index - 1].requestFocus();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)?.settings.arguments;
    _userEmail = '';
    _userId = null;

    if (args is Map) {
      _userEmail = args['email']?.toString() ?? '';
      _userId = args['userId']?.toString();
    } else {
      _userEmail = args as String? ?? '';
    }

    debugPrint('OtpVerificationScreen received email=$_userEmail, userId=$_userId');

    return Scaffold(
      backgroundColor: const Color(0xFFF3F5FA),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              _buildBackButton(context),
              const SizedBox(height: 40),
              const Text("Check your email",
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Color(0xFF3B5BB5))),
              const SizedBox(height: 16),
              Text(
                "We sent a code to $_userEmail\nEnter 6 digit code that mentioned in the email",
                style: const TextStyle(fontSize: 16, color: Colors.grey, height: 1.5),
              ),
              const SizedBox(height: 40),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(6, (index) => _buildOtpSlot(index)),
              ),
              const SizedBox(height: 40),
              _buildVerifyButton(_userEmail),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOtpSlot(int index) {
    return SizedBox(
      width: 45, // ✅ Reduced from 55 to 45 to prevent overflow
      height: 55, // ✅ Slightly reduced height
      child: TextField(
        controller: _controllers[index],
        focusNode: _focusNodes[index],
        keyboardType: TextInputType.number,
        textAlign: TextAlign.center,
        maxLength: 1,
        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        decoration: InputDecoration(
          counterText: "",
          filled: true,
          fillColor: Colors.white,
          contentPadding: EdgeInsets.zero, // ✅ Ensure text is centered
          enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF6C8CE3), width: 1.5)
          ),
          focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF3B5BB5), width: 2)
          ),
        ),
        onChanged: (value) => _onCodeChanged(value, index),
      ),
    );
  }

  Widget _buildVerifyButton(String email) {
    return SizedBox(
      width: double.infinity,
      height: 55,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF719EFF),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        ),
        onPressed: _isLoading ? null : () => _handleVerify(email),
        child: _isLoading
            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : const Text("Verify Code", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white)),
      ),
    );
  }

  Future<void> _handleVerify(String email) async {
    String code = _controllers.map((c) => c.text).join();

    if (code.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Please enter the complete 6-digit code")));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);

      debugPrint('OtpVerificationScreen verify request: email=$email, code=$code');

      // الربط مع الدالة اللي ضفناها في البروفايدر فوق
      bool isSuccess = await authProvider.verifyOtp(
        email: email,
        otpCode: code,
      );

      if (!mounted) return;

      if (isSuccess) {
        debugPrint('OtpVerificationScreen verify passed. Navigating to reset screen with email=$email, otp=$code, userId=${_userId}');
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Code Verified Successfully!"), backgroundColor: Colors.green)
        );

        // الانتقال لصفحة تعيين كلمة المرور الجديدة
        Navigator.pushReplacementNamed(
            context,
            '/reset-password',
            arguments: {
              'email': email,
              'otp': code,
              'userId': _userId,
            }
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Invalid or expired code."), backgroundColor: Colors.red)
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Connection error.")));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildBackButton(BuildContext context) {
    return CircleAvatar(
      backgroundColor: Colors.white,
      child: IconButton(
        icon: const Icon(Icons.arrow_back, color: Colors.black),
        onPressed: () => Navigator.pop(context),
      ),
    );
  }
}