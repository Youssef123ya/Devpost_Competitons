import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/patient.dart';
import '../../providers/patient_workflow_provider.dart';
import 'patient_form_screen_enhanced.dart';

/// Demo/Testing Screen for the Medical Workflow
/// This file shows how to test and demonstrate the complete workflow
class MedicalWorkflowDemoScreen extends StatefulWidget {
  const MedicalWorkflowDemoScreen({Key? key}) : super(key: key);

  @override
  State<MedicalWorkflowDemoScreen> createState() =>
      _MedicalWorkflowDemoScreenState();
}

class _MedicalWorkflowDemoScreenState extends State<MedicalWorkflowDemoScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFEDF3FF),
      appBar: AppBar(
        backgroundColor: const Color(0xFF719EFF),
        title: const Text('Medical Workflow Demo'),
        centerTitle: true,
      ),
      body: Consumer<PatientWorkflowProvider>(
        builder: (context, provider, _) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Section: Workflow Status
                _buildSectionTitle('📊 Workflow Status'),
                const SizedBox(height: 12),
                _buildStatusCard(provider),
                const SizedBox(height: 24),

                // Section: Quick Actions
                _buildSectionTitle('⚡ Quick Actions'),
                const SizedBox(height: 12),
                _buildQuickActions(context, provider),
                const SizedBox(height: 24),

                // Section: Medical Units
                _buildSectionTitle('🏥 Medical Units'),
                const SizedBox(height: 12),
                _buildUnitsDisplay(provider),
                const SizedBox(height: 24),

                // Section: Test Data
                _buildSectionTitle('🧪 Test with Sample Data'),
                const SizedBox(height: 12),
                _buildSampleDataButtons(context),
                const SizedBox(height: 24),

                // Section: Debug Info
                _buildSectionTitle('🐛 Debug Information'),
                const SizedBox(height: 12),
                _buildDebugInfo(provider),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Color(0xFF2E55A7),
        ),
      ),
    );
  }

  Widget _buildStatusCard(PatientWorkflowProvider provider) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF6B8DD6), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Pending Patient Status
          _buildStatusRow(
            'Pending Patient:',
            provider.hasPendingPatient()
                ? provider.pendingPatient!.name
                : 'None',
            provider.hasPendingPatient() ? Colors.green : Colors.orange,
          ),
          const SizedBox(height: 8),

          // Selected Unit
          _buildStatusRow(
            'Selected Unit:',
            provider.selectedUnitName,
            const Color(0xFF5B9EFF),
          ),
          const SizedBox(height: 8),

          // Occupancy in Selected Unit
          _buildStatusRow(
            'Beds Occupancy:',
            '${provider.getOccupiedBedCountForSelectedUnit()}/${provider.getTotalBedsForSelectedUnit()}',
            const Color(0xFF719EFF),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusRow(String label, String value, Color valueColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Color(0xFF555555),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: valueColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: valueColor, width: 1),
          ),
          child: Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: valueColor,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActions(
    BuildContext context,
    PatientWorkflowProvider provider,
  ) {
    return Column(
      children: [
        // Start New Patient Form
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) =>
                      const PatientFormScreenEnhanced(),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF5B9EFF),
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            icon: const Icon(Icons.person_add),
            label: const Text(
              'Start New Patient Form',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
          ),
        ),
        const SizedBox(height: 10),

        // Clear Pending Patient
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () {
              provider.clearPendingPatient();
              _showSnackBar('Pending patient cleared', Colors.orange);
            },
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFF719EFF), width: 2),
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            icon: const Icon(Icons.clear),
            label: const Text(
              'Clear Pending Patient',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Color(0xFF719EFF),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildUnitsDisplay(PatientWorkflowProvider provider) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF6B8DD6), width: 1.5),
      ),
      child: Column(
        children: List.generate(
          provider.unitNames.length,
          (index) {
            final unitName = provider.unitNames[index];
            final unit = provider.medicalUnits[unitName]!;
            final isSelected = provider.selectedUnitName == unitName;

            return GestureDetector(
              onTap: () => provider.switchUnit(unitName),
              child: Container(
                decoration: BoxDecoration(
                  color: isSelected
                      ? const Color(0xFFE8F0FF)
                      : Colors.white,
                  border: Border(
                    bottom: BorderSide(
                      color: const Color(0xFFE0E0E0),
                      width: index < provider.unitNames.length - 1 ? 1 : 0,
                    ),
                  ),
                ),
                padding: const EdgeInsets.all(12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Unit $unitName',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: isSelected
                                ? const Color(0xFF2E55A7)
                                : const Color(0xFF555555),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Beds: ${unit.occupiedBedCount}/${unit.totalBeds}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF888888),
                          ),
                        ),
                      ],
                    ),
                    if (isSelected)
                      const Icon(
                        Icons.check_circle,
                        color: Color(0xFF5B9EFF),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildSampleDataButtons(BuildContext context) {
    final provider = context.read<PatientWorkflowProvider>();

    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              // Create sample patient
              final samplePatient = Patient(
                id: 'P001',
                name: 'Ahmed Hassan',
                age: 45,
                gender: 'Male',
                weight: 75.5,
                illness: 'High Blood Pressure',
                companionPhone: '01234567890',
                nurseName: 'Fatima Ahmed',
                cameraUrl: 'https://example.com/stream',
              );

              provider.submitPatientForm(samplePatient);
              _showSnackBar(
                'Sample patient added (pending)',
                Colors.green,
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF4CAF50),
              padding: const EdgeInsets.symmetric(vertical: 10),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text(
              'Load Sample Patient',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              // Assign pending patient to bed 0
              final success = provider.assignPendingPatientToBed(0);
              if (success) {
                _showSnackBar('Patient assigned to bed 0', Colors.green);
              } else {
                _showSnackBar('No pending patient to assign', Colors.red);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2196F3),
              padding: const EdgeInsets.symmetric(vertical: 10),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text(
              'Assign Pending Patient to Bed 0',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDebugInfo(PatientWorkflowProvider provider) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFDDDDDD), width: 1),
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Provider State:',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 12,
              color: Color(0xFF333333),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '• Selected Unit: ${provider.selectedUnitName}',
            style: const TextStyle(fontSize: 11, fontFamily: 'monospace'),
          ),
          const SizedBox(height: 4),
          Text(
            '• Available Units: ${provider.unitNames.join(", ")}',
            style: const TextStyle(fontSize: 11, fontFamily: 'monospace'),
          ),
          const SizedBox(height: 4),
          Text(
            '• Has Pending Patient: ${provider.hasPendingPatient()}',
            style: const TextStyle(fontSize: 11, fontFamily: 'monospace'),
          ),
          const SizedBox(height: 4),
          Text(
            '• Total Units: ${provider.medicalUnits.length}',
            style: const TextStyle(fontSize: 11, fontFamily: 'monospace'),
          ),
          const SizedBox(height: 4),
          Text(
            '• Total Patients (All Units): ${provider.medicalUnits.values.fold<int>(0, (sum, unit) => sum + unit.patients.length)}',
            style: const TextStyle(fontSize: 11, fontFamily: 'monospace'),
          ),
        ],
      ),
    );
  }

  void _showSnackBar(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
        duration: const Duration(seconds: 2),
      ),
    );
  }
}
