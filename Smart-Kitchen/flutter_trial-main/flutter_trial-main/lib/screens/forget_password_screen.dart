import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'otp_screen.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState
    extends State<ForgotPasswordScreen> {

  bool isEmailSelected = true;

  final TextEditingController emailController =
  TextEditingController();

  final TextEditingController phoneController =
  TextEditingController();

  final ApiService api = ApiService();

  bool isLoading = false;

  InputDecoration customInputDecoration(
      String hint,
      ) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: const Color(0xFFF5F5F5),

      contentPadding:
      const EdgeInsets.symmetric(
        vertical: 16,
        horizontal: 16,
      ),

      border: OutlineInputBorder(
        borderRadius:
        BorderRadius.circular(
          30,
        ),
        borderSide:
        BorderSide.none,
      ),
    );
  }

  void sendCode() async {

    final email =
    emailController.text.trim();

    final phone =
    phoneController.text.trim();

    if (
    (isEmailSelected &&
        email.isEmpty)
        ||
        (!isEmailSelected &&
            phone.isEmpty)
    ) {

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(

        const SnackBar(
          content: Text(
            "Please enter your email or phone",
          ),
        ),
      );

      return;
    }

    setState(() {
      isLoading = true;
    });

    try {

      await api.sendOtp(

        email:
        isEmailSelected
            ? email
            : null,

        phone:
        !isEmailSelected
            ? phone
            : null,
      );

      if (!mounted) return;

      final emailOrPhone =
      isEmailSelected
          ? email
          : phone;

      Navigator.push(

        context,

        MaterialPageRoute(

          builder:
              (_) =>
              OtpScreen(
                emailOrPhone:
                emailOrPhone,
              ),
        ),
      );

    } catch (e) {

      if (!mounted) return;

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(

        SnackBar(
          content:
          Text(
            e.toString(),
          ),
        ),
      );

    } finally {

      if (mounted) {

        setState(() {
          isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(
      BuildContext context,
      ) {

    final instructionText =
    isEmailSelected

        ? "Please Enter Your email to send the reset code to it"

        : "Please Enter Your Phone Number to send the reset code to it";

    return Scaffold(

      backgroundColor:
      Colors.white,

      appBar: AppBar(

        elevation: 0,

        backgroundColor:
        Colors.white,

        iconTheme:
        const IconThemeData(
          color: Colors.black,
        ),
      ),

      body: Padding(

        padding:
        const EdgeInsets.symmetric(
          horizontal: 24,
        ),

        child:
        SingleChildScrollView(

          child: Column(

            crossAxisAlignment:
            CrossAxisAlignment.start,

            children: [

              const SizedBox(
                height: 10,
              ),

              const Text(

                "Forget Your Password",

                style:
                TextStyle(
                  fontSize: 22,
                  fontWeight:
                  FontWeight.bold,
                  color:
                  Colors.black,
                ),
              ),

              const SizedBox(
                height: 8,
              ),

              Text(

                instructionText,

                style:
                const TextStyle(
                  fontSize: 13,
                  color:
                  Colors.grey,
                ),
              ),

              const SizedBox(
                height: 30,
              ),

              /// Toggle Buttons
              Row(

                children: [

                  Expanded(

                    child:
                    GestureDetector(

                      onTap: () {

                        FocusScope.of(
                          context,
                        ).unfocus();

                        setState(() {
                          isEmailSelected =
                          false;
                        });
                      },

                      child:
                      Container(

                        height: 50,

                        alignment:
                        Alignment.center,

                        decoration:
                        BoxDecoration(

                          color:
                          !isEmailSelected
                              ? Colors.black
                              : Colors.white,

                          borderRadius:
                          BorderRadius.circular(
                            30,
                          ),

                          border:
                          Border.all(
                            color:
                            Colors.black,
                          ),
                        ),

                        child:
                        Text(

                          "By Phone Number",

                          style:
                          TextStyle(

                            fontSize: 12,

                            color:
                            !isEmailSelected
                                ? Colors.white
                                : Colors.black,
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(
                    width: 12,
                  ),

                  Expanded(

                    child:
                    GestureDetector(

                      onTap: () {

                        FocusScope.of(
                          context,
                        ).unfocus();

                        setState(() {
                          isEmailSelected =
                          true;
                        });
                      },

                      child:
                      Container(

                        height: 50,

                        alignment:
                        Alignment.center,

                        decoration:
                        BoxDecoration(

                          color:
                          isEmailSelected
                              ? Colors.black
                              : Colors.white,

                          borderRadius:
                          BorderRadius.circular(
                            30,
                          ),

                          border:
                          Border.all(
                            color:
                            Colors.black,
                          ),
                        ),

                        child:
                        Text(

                          "By Email",

                          style:
                          TextStyle(

                            fontSize: 12,

                            color:
                            isEmailSelected
                                ? Colors.white
                                : Colors.black,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(
                height: 30,
              ),

              /// INPUT
              TextField(

                key:
                ValueKey(
                  isEmailSelected,
                ),

                controller:
                isEmailSelected
                    ? emailController
                    : phoneController,

                keyboardType:
                isEmailSelected
                    ? TextInputType.emailAddress
                    : TextInputType.phone,

                decoration:
                customInputDecoration(

                  isEmailSelected
                      ? "ex@gmail.com"
                      : "Enter phone number",
                ),
              ),

              const SizedBox(
                height: 25,
              ),

              /// SEND BUTTON
              SizedBox(

                width:
                double.infinity,

                height: 55,

                child:
                ElevatedButton(

                  style:
                  ElevatedButton.styleFrom(

                    backgroundColor:
                    Colors.black,

                    shape:
                    RoundedRectangleBorder(

                      borderRadius:
                      BorderRadius.circular(
                        30,
                      ),
                    ),

                    elevation: 0,
                  ),

                  onPressed:
                  isLoading
                      ? null
                      : sendCode,

                  child:

                  isLoading

                      ? const CircularProgressIndicator(
                    color:
                    Colors.white,
                  )

                      : const Text(

                    "Send Code",

                    style:
                    TextStyle(
                      fontSize: 16,
                    ),
                  ),
                ),
              ),

              const SizedBox(
                height: 15,
              ),
            ],
          ),
        ),
      ),
    );
  }
}