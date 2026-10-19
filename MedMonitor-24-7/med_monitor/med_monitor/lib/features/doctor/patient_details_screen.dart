import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/app_config.dart';
import '../../models/patient.dart';
import '../../models/user_model.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/camera_stream_widget.dart';
import '../../features/doctor/patient_chat_screen.dart';
import '../../features/doctor/patient_reports_screen.dart';
import '../../features/doctor/personal_data_screen.dart';
import '../../features/doctor/vital_signs_screen.dart';

class PatientDetailScreen extends StatelessWidget {
  final dynamic patient;

  const PatientDetailScreen({super.key, required this.patient});

  static const Color _appBarBlue = Color(0xFF4D86FF);

  @override
  Widget build(BuildContext context) {
    final authProvider = context.read<AuthProvider>();
    final currentUser = authProvider.currentUser;
    final Patient displayPatient = patient is Patient
        ? patient
        : patient is UserModel
            ? Patient(
                id: patient.id ?? '',
                name: patient.userName ?? 'Unknown Patient',
                age: 0,
                gender: patient.gender?.toString() ?? 'Unknown',
                weight: 0,
                illness: patient.specialization ?? '',
                companionPhone: patient.phoneNumber ?? '',
                nurseName: '',
                assignedBedIndex: null,
                cameraUrl: AppConfig.streamUrl,
              )
            : Patient(
                id: '',
                name: 'Unknown Patient',
                age: 0,
                gender: 'Unknown',
                weight: 0,
                illness: '',
                companionPhone: '',
                nurseName: '',
                assignedBedIndex: null,
                cameraUrl: AppConfig.streamUrl,
              );
    bool hasAccessToChat() {
      if (currentUser == null) {
        debugPrint('❌ currentUser is null');
        return false;
      }

      // All doctors always have access
      if (currentUser!.role == 2) {
        return true;
      }

      // Nurse: compare case-insensitive + trimmed
      if (currentUser!.role == 3) {
        final nurseNameFromUser = (currentUser!.userName ?? '')
            .toLowerCase()
            .trim();
        final nurseNameFromPatient = (displayPatient.nurseName ?? '')
            .toLowerCase()
            .trim();

        debugPrint('=== CHAT ACCESS CHECK (NURSE) ===');
        debugPrint('currentUser.userName: "${currentUser!.userName}"');
        debugPrint('currentUser.role: "${currentUser!.role}"');
        debugPrint('displayPatient.nurseName: "${displayPatient.nurseName}"');
        debugPrint('Normalized user name: "$nurseNameFromUser"');
        debugPrint('Normalized patient nurse: "$nurseNameFromPatient"');
        debugPrint('Match result: ${nurseNameFromUser == nurseNameFromPatient}');
        debugPrint('=====================================');

        return nurseNameFromUser == nurseNameFromPatient;
      }

      return false;
    }

    final bool isDoctor = currentUser?.role == 2;
    final bedLabel = displayPatient.assignedBedIndex != null ? 'Bed ${displayPatient.assignedBedIndex}' : 'Unassigned';

    return Scaffold(
      backgroundColor: const Color(0xFFEDF3FF),
      appBar: AppBar(
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          displayPatient.name,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: _appBarBlue,
        actions: [
          IconButton(
            icon: const Icon(Icons.chat_bubble_outline),
            onPressed: () {
              final hasAccess = hasAccessToChat();

              if (!hasAccess) {
                showDialog(
                  context: context,
                  builder: (_) => AlertDialog(
                    title: const Text('Access denied'),
                    content: const Text('You are not assigned to this patient.'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK')),
                    ],
                  ),
                );
                return;
              }

              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => PatientChatScreen(patient: displayPatient),
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildHeader(bedLabel, displayPatient),
              const SizedBox(height: 20),
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: AspectRatio(
                  aspectRatio: 16 / 9,
                  child: CameraStreamWidget(
                    streamUrl: displayPatient.cameraUrl?.isNotEmpty == true
                        ? displayPatient.cameraUrl!
                        : AppConfig.streamUrl,
                    borderRadius: BorderRadius.zero,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 0.95,
                children: [
                  MenuCard(
                    label: 'Personal data',
                    imagePath: 'assets/personal data (1).png',
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => PersonalDataScreen(patient: displayPatient),
                      ),
                    ),
                  ),
                  MenuCard(
                    label: 'Vital signs',
                    imagePath: 'assets/vital signs (1).png',
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const VitalSignsScreen(),
                        // Pass the full Patient object so downstream screens
                        // can access both the id and the patient name for mapping
                        settings: RouteSettings(arguments: displayPatient),
                      ),
                    ),
                  ),
                  MenuCard(
                    label: 'Patient Reports',
                    imagePath: 'assets/patient reports(1).png',
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => PatientReportsScreen(patientId: displayPatient.id.toString()),
                        settings: RouteSettings(arguments: displayPatient.id),
                      ),
                    ),
                  ),
                  MenuCard(
                    label: 'Tasks',
                    imagePath: 'assets/tasks (1).png',
                    onTap: () {
                      final userRole = currentUser?.role;
                      final isDoctor = userRole == 2;
                      final isNurse = userRole == 3;

                      if (isDoctor) {
                        Navigator.pushNamed(
                          context,
                          '/createTasks',
                          arguments: {
                            'fromPatientDetails': true,
                            'patientId': displayPatient.id,
                            'patientName': displayPatient.name,
                            'nurseId': '',
                            'nurseName': displayPatient.nurseName,
                          },
                        );
                        return;
                      }

                      if (isNurse) {
                        Navigator.pushNamed(
                          context,
                          '/nurse-tasks',
                          arguments: {
                            'fromPatientDetails': true,
                            'patientId': displayPatient.id,
                            'patientName': displayPatient.name,
                            'nurseId': currentUser?.id,
                            'nurseName': currentUser?.userName,
                          },
                        );
                        return;
                      }

                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Unable to open tasks for this role.')),
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(String bedLabel, Patient displayPatient) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
      decoration: BoxDecoration(
        color: _appBarBlue,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            displayPatient.name,
            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            bedLabel,
            style: const TextStyle(color: Colors.white70, fontSize: 14),
          ),
          const SizedBox(height: 6),
          Text(
            'Nurse: ${displayPatient.nurseName}',
            style: const TextStyle(color: Colors.white70, fontSize: 14),
          ),
        ],
      ),
    );
  }
}

class MenuCard extends StatelessWidget {
  final String label;
  final String imagePath;
  final VoidCallback onTap;

  const MenuCard({super.key, required this.label, required this.imagePath, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: const Color(0xFFDDE8FF),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            const BoxShadow(
              color: Color.fromRGBO(0, 0, 0, 0.08),
              blurRadius: 10,
              offset: Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 18),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: 38,
              backgroundColor: Colors.white,
              backgroundImage: AssetImage(imagePath),
            ),
            const SizedBox(height: 12),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xFF4D86FF),
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
