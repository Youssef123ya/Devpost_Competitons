import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_trial/screens/home_screen.dart';
import 'firebase_options.dart';

// Screens
import 'screens/welcome_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/edit_profile_screen.dart';
import 'screens/privacy_policy_screen.dart';
import 'screens/contact_us_screen.dart';
import 'screens/success_screen.dart';
import 'screens/delete_account_screen.dart';
import 'screens/chat_screen.dart';

// Auth
import 'screens/auth/login_screen.dart';
import 'screens/auth/signup_screen.dart';
import 'screens/forget_password_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  runApp(const SmartKitchenApp());
}

class SmartKitchenApp extends StatelessWidget {
  const SmartKitchenApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Smart Kitchen',

      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: Colors.white,
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.black),
      ),


      initialRoute: '/',

      routes: {
        '/': (context) => const WelcomePage(),

        // Auth
        '/login': (context) => const LoginScreen(),
        '/signup': (context) => const SignUpScreen(),
        '/forget': (context) => const ForgotPasswordScreen(),

        // Home
        '/home': (context) => const HomeScreen(),

        '/profile': (context) => const ProfileScreen(),
        '/settings': (context) => const SettingsScreen(),
        '/editProfile': (context) => const EditProfileScreen(),
        '/privacy': (context) => const PrivacyPolicyScreen(),
        '/contact': (context) => const ContactUsScreen(),
        '/success': (context) => const SuccessScreen(),
        '/deleteAccount': (context) => const DeleteAccountScreen(),

        '/chat': (context) => const ChatScreen(),
      },
    );
  }
}