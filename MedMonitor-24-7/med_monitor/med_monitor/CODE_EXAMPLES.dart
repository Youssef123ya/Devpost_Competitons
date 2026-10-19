/// Code Examples - Medical Workflow Implementation
/// This file demonstrates real-world usage patterns

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

// ============================================================================
// EXAMPLE 1: Minimal Setup in main.dart
// ============================================================================

void example1_MainSetup() {
  /*
  import 'package:provider/provider.dart';
  import 'providers/patient_workflow_provider.dart';

  void main() {
    runApp(const MyApp());
  }

  class MyApp extends StatelessWidget {
    const MyApp({Key? key}) : super(key: key);

    @override
    Widget build(BuildContext context) {
      return MultiProvider(
        providers: [
          // Add this provider
          ChangeNotifierProvider(
            create: (_) => PatientWorkflowProvider(),
          ),
          // ... your other providers
        ],
        child: MaterialApp(
          title: 'MedMonitor',
          home: const YourHomeScreen(),
        ),
      );
    }
  }
  */
}

// ============================================================================
// EXAMPLE 2: Navigate to Patient Form
// ============================================================================

class AdminScreenExample extends StatelessWidget {
  const AdminScreenExample({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Admin Dashboard')),
      body: Center(
        child: ElevatedButton(
          onPressed: () {
            // Navigate to patient form
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const PatientFormScreenEnhanced(),
              ),
            );
          },
          child: const Text('Add New Patient'),
        ),
      ),
    );
  }
}

// ============================================================================
// EXAMPLE 3: Display Pending Patient Status
// ============================================================================

class PendingPatientWidget extends StatelessWidget {
  const PendingPatientWidget({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<PatientWorkflowProvider>(
      builder: (context, provider, _) {
        final hasPending = provider.hasPendingPatient();
        final patient = provider.pendingPatient;

        if (!hasPending) {
          return const Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text('No pending patients'),
            ),
          );
        }

        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Pending Patient',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text('Name: ${patient!.name}'),
                Text('ID: ${patient.id}'),
                Text('Age: ${patient.age}'),
                Text('Illness: ${patient.illness}'),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () {
                    // Navigate to beds to assign
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) =>
                            const BedsMonitoringScreenEnhanced(),
                      ),
                    );
                  },
                  child: const Text('Go to Beds'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// ============================================================================
// EXAMPLE 4: Access Provider and Check State
// ============================================================================

class StateCheckExample extends StatelessWidget {
  const StateCheckExample({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () {
        final provider = context.read<PatientWorkflowProvider>();

        // Check if there's a pending patient
        if (!provider.hasPendingPatient()) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No pending patient')),
          );
          return;
        }

        // Get occupancy info
        final occupiedCount =
            provider.getOccupiedBedCountForSelectedUnit();
        final totalBeds = provider.getTotalBedsForSelectedUnit();
        final selectedUnit = provider.selectedUnitName;

        debugPrint(
          'Unit: $selectedUnit, Occupancy: $occupiedCount/$totalBeds',
        );

        // Get all units
        final units = provider.unitNames;
        debugPrint('Available units: $units');
      },
      child: const Text('Check Provider State'),
    );
  }
}

// ============================================================================
// EXAMPLE 5: Create and Submit Patient Form
// ============================================================================

class SubmitPatientExample extends StatelessWidget {
  const SubmitPatientExample({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () {
        // Create a patient object
        final patient = Patient(
          id: 'P001',
          name: 'Ahmed Hassan',
          age: 45,
          gender: 'Male',
          weight: 75.5,
          illness: 'High Blood Pressure',
          companionPhone: '01234567890',
          nurseName: 'Fatima Ahmed',
        );

        // Submit to provider
        context.read<PatientWorkflowProvider>().submitPatientForm(patient);

        // Navigate to beds
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const BedsMonitoringScreenEnhanced(),
          ),
        );
      },
      child: const Text('Submit Sample Patient'),
    );
  }
}

// ============================================================================
// EXAMPLE 6: Assign Patient to Bed Programmatically
// ============================================================================

class AssignPatientExample extends StatelessWidget {
  const AssignPatientExample({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () {
        final provider = context.read<PatientWorkflowProvider>();

        // Try to assign to bed 0
        final success = provider.assignPendingPatientToBed(0);

        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Patient assigned to bed 0')),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed: No pending patient or bed occupied'),
            ),
          );
        }
      },
      child: const Text('Assign to Bed 0'),
    );
  }
}

// ============================================================================
// EXAMPLE 7: Switch Unit and Monitor Changes
// ============================================================================

class SwitchUnitExample extends StatelessWidget {
  const SwitchUnitExample({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<PatientWorkflowProvider>(
      builder: (context, provider, _) {
        final currentUnit = provider.selectedUnitName;
        final units = provider.unitNames;

        return Column(
          children: [
            Text('Current Unit: $currentUnit'),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              children: units.map((unit) {
                final isSelected = unit == currentUnit;
                return ElevatedButton(
                  onPressed: () => provider.switchUnit(unit),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isSelected ? Colors.blue : Colors.grey,
                  ),
                  child: Text('Unit $unit'),
                );
              }).toList(),
            ),
          ],
        );
      },
    );
  }
}

// ============================================================================
// EXAMPLE 8: Display Real-time Occupancy
// ============================================================================

class OccupancyDisplayExample extends StatelessWidget {
  const OccupancyDisplayExample({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<PatientWorkflowProvider>(
      builder: (context, provider, _) {
        final occupied = provider.getOccupiedBedCountForSelectedUnit();
        final total = provider.getTotalBedsForSelectedUnit();
        final percentage = (occupied / total * 100).toStringAsFixed(1);

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.blue),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            children: [
              Text(
                'Beds: $occupied/$total ($percentage%)',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: occupied / total,
                  minHeight: 8,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ============================================================================
// EXAMPLE 9: Remove Patient with Confirmation
// ============================================================================

class RemovePatientExample extends StatelessWidget {
  final int bedIndex;
  final String patientName;

  const RemovePatientExample({
    Key? key,
    required this.bedIndex,
    required this.patientName,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () {
        // Show confirmation dialog
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Remove Patient'),
            content: Text('Are you sure you want to remove $patientName?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () {
                  // Remove patient
                  context
                      .read<PatientWorkflowProvider>()
                      .removePatientFromBed(bedIndex);

                  Navigator.pop(context);

                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('$patientName removed'),
                    ),
                  );
                },
                child: const Text(
                  'Delete',
                  style: TextStyle(color: Colors.red),
                ),
              ),
            ],
          ),
        );
      },
      style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
      child: const Text('Delete Patient'),
    );
  }
}

// ============================================================================
// EXAMPLE 10: Build Unit Selector Dropdown
// ============================================================================

class UnitSelectorExample extends StatelessWidget {
  const UnitSelectorExample({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<PatientWorkflowProvider>(
      builder: (context, provider, _) {
        return DropdownButton<String>(
          value: provider.selectedUnitName,
          items: provider.unitNames.map((unit) {
            return DropdownMenuItem(
              value: unit,
              child: Text('Unit $unit'),
            );
          }).toList(),
          onChanged: (value) {
            if (value != null) {
              provider.switchUnit(value);
            }
          },
        );
      },
    );
  }
}

// ============================================================================
// EXAMPLE 11: Get Bed Slots for Grid
// ============================================================================

class BedSlotsGridExample extends StatelessWidget {
  const BedSlotsGridExample({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<PatientWorkflowProvider>(
      builder: (context, provider, _) {
        final bedSlots = provider.getBedSlotsForSelectedUnit();

        return GridView.builder(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.75,
          ),
          itemCount: bedSlots.length,
          itemBuilder: (context, index) {
            final patient = bedSlots[index];

            if (patient != null) {
              // Occupied bed
              return Card(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('${patient.name}, Age: ${patient.age}'),
                    Text('Nurse: ${patient.nurseName}'),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () => provider.removePatientFromBed(index),
                      child: const Text('Delete'),
                    ),
                  ],
                ),
              );
            } else {
              // Empty bed
              return Card(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.bed, size: 32),
                    const Text('No Patient'),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () {
                        if (provider.hasPendingPatient()) {
                          provider.assignPendingPatientToBed(index);
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('No pending patient'),
                            ),
                          );
                        }
                      },
                      child: const Text('Add Patient'),
                    ),
                  ],
                ),
              );
            }
          },
        );
      },
    );
  }
}

// ============================================================================
// EXAMPLE 12: Clear Pending Patient
// ============================================================================

class ClearPendingExample extends StatelessWidget {
  const ClearPendingExample({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () {
        context.read<PatientWorkflowProvider>().clearPendingPatient();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pending patient cleared')),
        );
      },
      child: const Text('Clear Pending Patient'),
    );
  }
}

// ============================================================================
// NOTE: Import these in your actual code:
// 
// import 'features/admin/patient_form_screen_enhanced.dart';
// import 'features/admin/beds_monitoring_screen_enhanced.dart';
// import 'models/patient.dart';
// import 'providers/patient_workflow_provider.dart';
// ============================================================================
