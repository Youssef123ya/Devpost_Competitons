import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

// --- Providers ---
import 'providers/auth_provider.dart';
import 'providers/doctor_provider.dart';
import 'providers/notification_provider.dart';
import 'providers/nurse_provider.dart';
import 'providers/bed_provider.dart';
import 'providers/vital_sign_provider.dart';
import 'providers/chat_provider.dart';
import 'providers/report_provider.dart';
import 'providers/reports_provider.dart';
import 'providers/admission_provider.dart';
import 'providers/ai_alert_provider.dart';
import 'providers/patient_workflow_provider.dart';
import 'providers/medical_workflow_provider.dart';
import 'providers/task_provider.dart';
import 'providers/dashboard_provider.dart';  // ✅ ADD: Import DashboardProvider



// --- Models ---
import 'models/user_model.dart';
import 'models/app_models.dart';
import 'models/task_model.dart';


// --- Screens: Splash & Welcome ---
import 'features/splash/splash_screen.dart';
import 'features/welcome/welcome1_screen.dart';
import 'features/welcome/welcome2_screen.dart';
import 'features/welcome/welcome3_screen.dart';

// --- Screens: Auth ---
import 'features/auth/login_screen.dart';
import 'features/admin/register_screen.dart';
import 'features/auth/forgot_password/forgot_password_email_screen.dart';
import 'features/auth/forgot_password/otp_verification_screen.dart';
import 'features/auth/forgot_password/reset_password_screen.dart';
import 'features/auth/forgot_password/update_password.dart';

// --- Screens: Doctor Features ---
import 'features/doctor/doctor_home_screen.dart';
import 'features/doctor/beds_screen.dart';
import 'features/doctor/patient_details_screen.dart';
import 'features/doctor/add_patient_screen.dart';
import 'features/doctor/doctor_tasks_screen.dart';
import 'features/doctor/doctor_add_task_screen.dart';
import 'features/doctor/patient_reports_screen.dart';
import 'features/doctor/monitor_screen.dart';
import 'features/doctor/help_screen.dart';
import 'features/doctor/doctor_admission_status_screen.dart';


import 'features/doctor/chat_screen.dart';
import 'features/doctor/warning_screen.dart';


// --- Screens: Admin & Welcome Back ---
import 'features/admin/welcome_back_screen.dart';
import 'features/admin/super_admin_screen.dart';
import 'features/admin/patient_form_screen.dart';
import 'features/admin/beds_monitoring_screen.dart';
import 'features/admin/edit_profile_screen.dart';
import 'features/admin/profile_screen.dart';
import 'features/admin/pending_admission_screen.dart';

// --- Screens: Nurse Features ---
import 'features/nurse/nurse_home_screen.dart';
import 'features/nurse/nurse_profile_screen.dart';
import 'features/nurse/nurse_tasks_screen_new.dart';
import 'features/nurse/update_nurse_profile_screen.dart';
import 'features/nurse/notifications_screen.dart';

// --- Screens: Additional Doctor/Shared Features ---
import 'features/doctor/settings_screen.dart';
import 'features/doctor/vital_signs_screen.dart';
import 'features/doctor/patient_status_screen.dart';
import 'features/doctor/personal_data_screen.dart';

import 'services/dio_client.dart';
import 'services/signalr_service.dart';
import 'services/notification_sound_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

// ✅ ROUTE OBSERVER: For detecting when screens come back into focus
final RouteObserver<ModalRoute<dynamic>> routeObserver = RouteObserver<ModalRoute<dynamic>>();

void main() {
  runZonedGuarded(
    () {
      WidgetsFlutterBinding.ensureInitialized();

      FlutterError.onError = (FlutterErrorDetails details) {
        FlutterError.presentError(details);
        debugPrint('🐞 FlutterError.onError: ${details.exceptionAsString()}');
        if (details.stack != null) {
          debugPrint('🐞 FlutterError stack: ${details.stack}');
        }
      };

      WidgetsBinding.instance.platformDispatcher.onError = (error, stack) {
        debugPrint('🐞 PlatformDispatcher.onError: $error');
        debugPrint('🐞 PlatformDispatcher stack: $stack');
        return true;
      };

      runApp(const MedMonitorApp());
    },
    (error, stack) {
      debugPrint('🐞 runZonedGuarded caught error: $error');
      debugPrint('🐞 runZonedGuarded stack: $stack');
    },
  );
}

class MedMonitorApp extends StatefulWidget {
  const MedMonitorApp({super.key});

  @override
  State<MedMonitorApp> createState() => _MedMonitorAppState();
}

class _MedMonitorAppState extends State<MedMonitorApp> with WidgetsBindingObserver {
  // ✅ بيانات تجريبية بالـ UserModel الموحد
  UserModel doctorUser = UserModel(
    userName: "Dr. Magdy Osama",
    email: "doctor@medmonitor.com",
    phoneNumber: "0123456789",
    dateOfBirth: "1980-01-01",
    gender: 1,
    specialization: "Cardiologist",
    role: 2, // Role الدكتور حسب السواجر هو 2
  );

  UserModel nurseUser = UserModel(
    userName: "Nurse Aya",
    email: "nurse@medmonitor.com",
    phoneNumber: "0111111111",
    dateOfBirth: "1990-03-20",
    gender: 2,
    specialization: "General",
    role: 3, // Role الممرضة حسب السواجر هو 3
  );

  UserModel adminUser = UserModel(
    userName: "Super Admin",
    email: "admin@medmonitor.com",
    phoneNumber: "0100000000",
    dateOfBirth: "1985-10-10",
    gender: 1,
    specialization: "System Admin",
    role: 1, // Role الأدمن حسب السواجر هو 1
  );

  void updateDoctorInfo(UserModel newUser) => setState(() => doctorUser = newUser);
  void updateNurseInfo(UserModel newUser) => setState(() => nurseUser = newUser);
  void updateAdminInfo(UserModel newUser) => setState(() => adminUser = newUser);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
        ChangeNotifierProvider(create: (_) => DoctorProvider()),
        ChangeNotifierProvider(create: (_) => NurseProvider()), // ✅ ضيفي السطر ده
        ChangeNotifierProvider(create: (_) => BedProvider()),
        ChangeNotifierProvider(create: (_) => VitalSignProvider()),
        ChangeNotifierProvider(create: (_) => ChatProvider()),
        ChangeNotifierProvider(create: (_) => ReportProvider()),
        ChangeNotifierProvider(create: (_) => ReportsProvider()),
        ChangeNotifierProvider(create: (_) => AdmissionProvider()),
        ChangeNotifierProvider(create: (_) => AiAlertProvider()),
        ChangeNotifierProvider(create: (_) => PatientWorkflowProvider()),
        ChangeNotifierProvider(create: (_) => TaskProvider()),
        ChangeNotifierProvider(create: (_) => DashboardProvider()),  // ✅ ADD: DashboardProvider
        // Medical Workflow Providers
        ChangeNotifierProvider(create: (_) => PendingPatientNotifier()),
        ChangeNotifierProvider(create: (_) => MedicalUnitsNotifier()),
        ChangeNotifierProvider(create: (_) => SelectedUnitNotifier()),
        ChangeNotifierProvider(create: (_) => WorkflowNotifier()),
      ],
      child: MaterialApp(
        navigatorKey: DioClient.navigatorKey,
        // ✅ CRITICAL FIX: Register RouteObserver for dashboard refresh on navigation
        navigatorObservers: [routeObserver],
        title: 'Med Monitor',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          primaryColor: const Color(0xFF719EFF),
          scaffoldBackgroundColor: const Color(0xFFEDF3FF),
        ),
        initialRoute: '/',
        onGenerateRoute: (settings) {
          switch (settings.name) {
            case '/':
              return MaterialPageRoute(builder: (_) => const SplashScreen());
            case '/welcome1': return MaterialPageRoute(builder: (_) => const Welcome1Screen());
            case '/welcome2': return MaterialPageRoute(builder: (_) => const Welcome2Screen());
            case '/welcome3': return MaterialPageRoute(builder: (_) => const Welcome3Screen());
            case '/login': return MaterialPageRoute(builder: (_) => const LoginScreen());
            case '/register': return MaterialPageRoute(builder: (_) => const RegisterScreen());
            case '/welcome_back': return MaterialPageRoute(builder: (_) => const WelcomeBackScreen());

            case '/forgot-email': return MaterialPageRoute(builder: (_) => const ForgotPasswordEmailScreen());
            case '/otp': return MaterialPageRoute(builder: (_) => const OtpVerificationScreen(), settings: settings);
            case '/reset-password': return MaterialPageRoute(builder: (_) => const ResetPasswordScreen(), settings: settings);
            case '/update-password-success': return MaterialPageRoute(builder: (_) => const UpdatePasswordScreen());

            case '/beds':
              return MaterialPageRoute(builder: (_) => const BedsScreen(), settings: settings);
            case '/addTask':
              return MaterialPageRoute(builder: (_) => const DoctorAddTaskScreen());
            case '/createTasks':
              final args = settings.arguments as Map<String, dynamic>?;
              return MaterialPageRoute(
                builder: (_) => DoctorTasksScreen(
                  fromPatientDetails: args?['fromPatientDetails'] ?? false,
                  showBackButton: args?['fromPatientDetails'] ?? false,
                  patientId: args?['patientId'],
                  patientName: args?['patientName'],
                  nurseId: args?['nurseId'],
                  nurseName: args?['nurseName'],
                ),
              );
            case '/patientDetails':
            // ✅ حل مشكلة الـ PatientData:
            // هنا بنحول الـ arguments لـ UserModel بشكل صريح
              final patient = settings.arguments as UserModel;
              return MaterialPageRoute(builder: (_) => PatientDetailScreen(patient: patient));
            case '/chat': // ✅ إضافة راوت الشات
              final args = settings.arguments as Map<String, dynamic>;
              return MaterialPageRoute(
                builder: (_) => ChatScreen(
                  receiverId: args['receiverId'],
                  receiverName: args['receiverName'],
                ),
              );
            case '/add_patient':
              final args = settings.arguments as Map<String, dynamic>;
              return MaterialPageRoute(
                builder: (_) => AddPatientScreen(
                  user: args['user'] as UserModel,
                  onUpdate: args['onUpdate'],
                ),
              );
            case '/timeConflict':
              return MaterialPageRoute(builder: (_) => const TimeConflictScreen());
            case '/doctor-home':
              return MaterialPageRoute(
                builder: (context) {
                  final authProvider = Provider.of<AuthProvider>(context, listen: false);
                  final currentDoctor = authProvider.currentUser ?? doctorUser;
                  return DoctorHomeScreen(user: currentDoctor, onUpdate: updateDoctorInfo);
                },
              );
            case '/notifications':
              return MaterialPageRoute(builder: (_) => const NotificationsScreen());
            case '/nurse-home':
              return MaterialPageRoute(
                builder: (context) {
                  final authProvider = Provider.of<AuthProvider>(context, listen: false);
                  final currentNurse = authProvider.currentUser ?? nurseUser;
                  return NurseHomeScreen(user: currentNurse, onUpdate: updateNurseInfo);
                },
              );
            case '/admin-home':
              return MaterialPageRoute(
                builder: (context) {
                  final authProvider = Provider.of<AuthProvider>(context, listen: false);
                  final currentAdmin = authProvider.currentUser ?? adminUser;
                  return SuperAdminScreen(user: currentAdmin, onUpdate: updateAdminInfo);
                },
              );
            case '/patient-details':
              final patient = settings.arguments as UserModel;
              return MaterialPageRoute(builder: (_) => PatientDetailScreen(patient: patient));
            case '/vital-signs':
              return MaterialPageRoute(builder: (_) => const VitalSignsScreen(), settings: settings);
            case '/tasks':
              final args = settings.arguments as Map<String, dynamic>?;
              return MaterialPageRoute(
                builder: (_) => DoctorTasksScreen(
                  showBackButton: args?['fromPatientDetails'] == true,
                  fromPatientDetails: args?['fromPatientDetails'] ?? false,
                  patientId: args?['patientId'] as String?,
                  patientName: args?['patientName'] as String?,
                  nurseId: args?['nurseId'] as String?,
                  nurseName: args?['nurseName'] as String?,
                  patientFilter: args?['patientName'] as String?,
                ),
              );
            case '/add-task':
              final args = settings.arguments as Map<String, dynamic>?;
              return MaterialPageRoute(
                builder: (_) => DoctorAddTaskScreen(
                  isEditing: args?['isEditing'] ?? false,
                  existingTask: args?['task'] as TaskModel?,
                  patientId: args?['patientId'] as String?,
                  patientName: args?['patientName'] as String?,
                  nurseId: args?['nurseId'] as String?,
                  nurseName: args?['nurseName'] as String?,
                ),
              );
            case '/profile':
              return MaterialPageRoute(builder: (_) => ProfileScreen(user: adminUser, onUpdate: updateAdminInfo, isEmbedded: false));
            case '/settings':
              return MaterialPageRoute(builder: (_) => const SettingsScreen());
            case '/admission-request':
              final request = settings.arguments as dynamic;
              return MaterialPageRoute(builder: (_) => PatientFormScreen(request: request));
            case '/patient-reports':
              return MaterialPageRoute(builder: (_) => const PatientReportsScreen(), settings: settings);
            case '/monitor':
              final patient = settings.arguments as UserModel;
              return MaterialPageRoute(builder: (_) => MonitorScreen(patient: patient));
            case '/help':
              return MaterialPageRoute(builder: (_) => const HelpScreen());
            case '/edit-profile':
              final args = settings.arguments as Map<String, dynamic>;
              return MaterialPageRoute(builder: (_) => EditProfileScreen(user: args['user'], onSave: args['onSave']));
            case '/super_admin':
              return MaterialPageRoute(builder: (_) => SuperAdminScreen(user: adminUser, onUpdate: updateAdminInfo));
            case '/beds-monitoring':
              return MaterialPageRoute(builder: (_) => const BedsMonitoringScreen());

            case '/pending_requests':
            case '/pending-admission':
              final args = settings.arguments as Map<String, dynamic>;
              return MaterialPageRoute(
                builder: (_) => PendingAdmissionScreen(
                  initialRequests: args['requests'] as List<AdmissionRequest>? ?? const [],
                  user: args['user'],
                  onUpdate: args['onUpdate'],
                ),
              );
            case '/patient-status':
              final status = settings.arguments as String;
              return MaterialPageRoute(builder: (_) => PatientStatusScreen(status: status));
            case '/personal-data':
              final patient = settings.arguments as UserModel;
              return MaterialPageRoute(builder: (_) => PersonalDataScreen(patient: patient));
            case '/nurse-profile':
              final args = settings.arguments as Map<String, dynamic>;
              return MaterialPageRoute(
                builder: (_) => NurseProfileScreen(
                  user: args['user'],
                  onUpdate: args['onUpdate'],
                ),
              );
            case '/nurse-tasks':
              final args = settings.arguments as Map<String, dynamic>?;
              final nurseId = args?['nurseId'] as String? ?? '';
              return MaterialPageRoute(
                builder: (_) => NurseTasksScreen(
                  nurseId: nurseId,
                  fromPatientDetails: args?['fromPatientDetails'] ?? false,
                  patientId: args?['patientId'] as String?,
                  patientName: args?['patientName'] as String?,
                ),
              );
            case '/update-nurse-profile':
              final args = settings.arguments as Map<String, dynamic>;
              return MaterialPageRoute(
                builder: (_) => UpdateNurseProfileScreen(
                  user: args['user'],
                  onSave: args['onSave'],
                ),
              );
            case '/doctor-admission-status':
              final args = settings.arguments as Map<String, dynamic>;
              return MaterialPageRoute(
                builder: (context) {
                  final authProvider = Provider.of<AuthProvider>(context, listen: false);
                  final currentDoctor = args['user'] as UserModel? ?? authProvider.currentUser ?? doctorUser;
                  return DoctorAdmissionStatusScreen(
                    user: currentDoctor,
                    onUpdate: args['onUpdate'] ?? updateDoctorInfo,
                  );
                },
              );

            default:
              return MaterialPageRoute(
                builder: (_) => Scaffold(body: Center(child: Text('Route ${settings.name} not found'))),
              );
          }
        },
      ),
    );
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Initialize audio at app startup so notification sound can play immediately.
    debugPrint('[Main] Initializing notification audio at app startup');
    NotificationSoundService().initializeAudio().then((_) {
      debugPrint('[Main] Notification audio initialization completed');
    }).catchError((e) {
      debugPrint('[Main] Notification audio initialization failed: $e');
    });

    // Attempt to start SignalR on app launch if a token exists
    _startSignalRIfToken();
  }

  Future<void> _startSignalRIfToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token') ?? '';
      debugPrint('[Main] Stored auth token exists: ${token.isNotEmpty}');
      if (token.isNotEmpty) {
        await SignalRService().startConnection(null);
        debugPrint('[Main] SignalR start attempted on app launch');
      }
    } catch (e) {
      debugPrint('[Main] Error checking token / starting SignalR: $e');
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    if (state == AppLifecycleState.resumed) {
      debugPrint('[Main] App resumed — ensuring SignalR connection');
      SignalRService().startConnection(null);
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }
}