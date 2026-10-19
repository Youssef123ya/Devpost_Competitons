# Complete Implementation Examples

## 1. PatientFormScreen - Complete Code

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/patient.dart';
import '../providers/medical_workflow_provider.dart';

class PatientFormScreen extends StatefulWidget {
  const PatientFormScreen({Key? key}) : super(key: key);

  @override
  State<PatientFormScreen> createState() => _PatientFormScreenState();
}

class _PatientFormScreenState extends State<PatientFormScreen> {
  late TextEditingController _nameController;
  late TextEditingController _idController;
  late TextEditingController _ageController;
  late TextEditingController _weightController;
  late TextEditingController _illnessController;
  late TextEditingController _companionPhoneController;
  late TextEditingController _nurseNameController;

  String _selectedGender = 'Male';

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _idController = TextEditingController();
    _ageController = TextEditingController();
    _weightController = TextEditingController();
    _illnessController = TextEditingController();
    _companionPhoneController = TextEditingController();
    _nurseNameController = TextEditingController();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _idController.dispose();
    _ageController.dispose();
    _weightController.dispose();
    _illnessController.dispose();
    _companionPhoneController.dispose();
    _nurseNameController.dispose();
    super.dispose();
  }

  void _submitForm() {
    // Validate
    if (_nameController.text.isEmpty ||
        _idController.text.isEmpty ||
        _ageController.text.isEmpty ||
        _weightController.text.isEmpty ||
        _illnessController.text.isEmpty ||
        _companionPhoneController.text.isEmpty ||
        _nurseNameController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all fields')),
      );
      return;
    }

    try {
      // Create patient
      final newPatient = Patient(
        id: _idController.text,
        name: _nameController.text,
        age: int.parse(_ageController.text),
        gender: _selectedGender,
        weight: double.parse(_weightController.text),
        illness: _illnessController.text,
        companionPhone: _companionPhoneController.text,
        nurseName: _nurseNameController.text,
        cameraUrl: 'http://localhost:5000/stream',
      );

      // Set pending patient
      context.read(pendingPatientProvider).setPendingPatient(newPatient);

      // Navigate
      Navigator.of(context).pushReplacementNamed('/beds-monitoring');
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFEDF3FF),
      appBar: AppBar(
        backgroundColor: const Color(0xFF719EFF),
        title: const Text('Patient Admission Form'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            _buildTextField('Name', _nameController),
            _buildTextField('ID', _idController),
            _buildTextField('Age', _ageController, isNumber: true),
            _buildGenderSelector(),
            _buildTextField('Weight (kg)', _weightController, isNumber: true),
            _buildTextField('Illness', _illnessController, maxLines: 2),
            _buildTextField('Companion Phone', _companionPhoneController),
            _buildTextField('Nurse Name', _nurseNameController),
            const SizedBox(height: 30),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: _submitForm,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF719EFF),
                    ),
                    child: const Text('Approve'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      _nameController.clear();
                      _idController.clear();
                      _ageController.clear();
                      _weightController.clear();
                      _illnessController.clear();
                      _companionPhoneController.clear();
                      _nurseNameController.clear();
                    },
                    child: const Text('Clear'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(
    String label,
    TextEditingController controller, {
    bool isNumber = false,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: isNumber ? TextInputType.number : TextInputType.text,
          maxLines: maxLines,
          decoration: InputDecoration(
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            contentPadding: const EdgeInsets.all(12),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildGenderSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Gender', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedGender = 'Male'),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _selectedGender == 'Male'
                        ? const Color(0xFF2E55A7)
                        : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF719EFF)),
                  ),
                  child: Text(
                    'Male',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: _selectedGender == 'Male'
                          ? Colors.white
                          : Colors.black,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedGender = 'Female'),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _selectedGender == 'Female'
                        ? const Color(0xFF2E55A7)
                        : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF719EFF)),
                  ),
                  child: Text(
                    'Female',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: _selectedGender == 'Female'
                          ? Colors.white
                          : Colors.black,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}
```

---

## 2. BedsMonitoringScreen - Key Sections

### Reactive Unit Selector
```dart
Widget _buildUnitSelector(BuildContext context) {
  return Consumer2<SelectedUnitNotifier, MedicalUnitsNotifier>(
    builder: (context, selectedUnit, units, _) {
      return DropdownButton<String>(
        value: selectedUnit.selectedUnit,
        items: units.getUnitNames().map((name) {
          return DropdownMenuItem(
            value: name,
            child: Text('Unit $name'),
          );
        }).toList(),
        onChanged: (value) {
          if (value != null) {
            selectedUnit.selectUnit(value);
          }
        },
      );
    },
  );
}
```

### Dynamic Occupancy Counter
```dart
Widget _buildOccupancyCounter(BuildContext context) {
  return Consumer2<SelectedUnitNotifier, MedicalUnitsNotifier>(
    builder: (context, selectedUnit, units, _) {
      final unit = units.getUnitByName(selectedUnit.selectedUnit);
      final occupied = unit?.occupiedBedCount ?? 0;
      final total = unit?.totalBeds ?? 12;

      return Text(
        'Beds: $occupied/$total',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
      );
    },
  );
}
```

### Bed Grid with Triple Consumer
```dart
Widget _buildBedsGrid(BuildContext context) {
  return Consumer3<SelectedUnitNotifier, MedicalUnitsNotifier, PendingPatientNotifier>(
    builder: (context, selectedUnit, units, pending, _) {
      final currentUnit = units.getUnitByName(selectedUnit.selectedUnit);
      if (currentUnit == null) return const Center(child: Text('Unit not found'));

      final bedSlots = currentUnit.generateBedSlots();

      return GridView.builder(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
        ),
        itemCount: bedSlots.length,
        itemBuilder: (context, index) {
          final patient = bedSlots[index];

          return patient == null
              ? _buildEmptyBedCard(context, index, selectedUnit.selectedUnit, units, pending)
              : _buildOccupiedBedCard(context, patient, index, selectedUnit.selectedUnit, units);
        },
      );
    },
  );
}
```

### Empty Bed Click Handler
```dart
void _handleEmptyBedClick(
  BuildContext context,
  int bedIndex,
  String unitName,
  MedicalUnitsNotifier units,
  PendingPatientNotifier pending,
) {
  if (!pending.hasPendingPatient) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('No pending patient to assign')),
    );
    return;
  }

  final patient = pending.pendingPatient!;
  
  final success = units.assignPatientToBed(
    unitName: unitName,
    patient: patient,
    bedIndex: bedIndex,
  );

  if (success) {
    pending.clearPendingPatient();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('✅ ${patient.name} assigned to bed $bedIndex')),
    );
  }
}
```

### Delete Confirmation Dialog
```dart
void _showDeleteDialog(
  BuildContext context,
  String patientName,
  VoidCallback onConfirm,
) {
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Delete Patient'),
      content: Text('Remove $patientName from this bed?'),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        TextButton(
          onPressed: () {
            Navigator.pop(context);
            onConfirm();
          },
          style: TextButton.styleFrom(foregroundColor: Colors.red),
          child: const Text('Delete'),
        ),
      ],
    ),
  );
}
```

---

## 3. State Management Flow Diagram

```
┌─────────────────────────────────┐
│  PatientFormScreen              │
│  ─────────────────────────────  │
│  • Collect patient data         │
│  • Validate form                │
│  • Call setPendingPatient()     │
│  • Navigate to beds screen      │
└────────────────┬────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ PendingPatient │
        │   Notifier     │
        └────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  BedsMonitoringScreen           │
│  ─────────────────────────────  │
│  • Display 12 bed slots         │
│  • Show unit selector           │
│  • Show occupancy counter       │
│  • Watch selected unit          │
│  • Watch medical units          │
│  • Watch pending patient        │
└─────────────────────────────────┘
          │                    │
          │                    │
    ┌─────▼──────┐      ┌──────▼────┐
    │Empty Bed   │      │Occupied   │
    │Card        │      │Bed Card   │
    │- Check if  │      │- Display  │
    │  pending   │      │  patient  │
    │- Click to  │      │- Show cam │
    │  assign    │      │- Delete   │
    └─────┬──────┘      │  button   │
          │              └──────┬────┘
          │                     │
          ▼                     ▼
    assignPatientToBed    removePatientFromBed
    clearPendingPatient        
          │                     │
          └─────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ MedicalUnits         │
         │ Notifier             │
         │ (State Updated)      │
         └──────────────────────┘
                    │
                    ▼
         Grid Regenerates
         UI Updates
```

---

## 4. Provider Consumer Patterns

### Pattern A: Single Consumer
```dart
Consumer<PendingPatientNotifier>(
  builder: (context, pending, _) {
    return Text(pending.hasPendingPatient ? 'Ready' : 'No Patient');
  },
)
```

### Pattern B: Double Consumer
```dart
Consumer2<SelectedUnitNotifier, MedicalUnitsNotifier>(
  builder: (context, selected, units, _) {
    final unit = units.getUnitByName(selected.selectedUnit);
    return Text('Unit: ${unit?.unitName}');
  },
)
```

### Pattern C: Triple Consumer
```dart
Consumer3<SelectedUnitNotifier, MedicalUnitsNotifier, PendingPatientNotifier>(
  builder: (context, selected, units, pending, _) {
    final unit = units.getUnitByName(selected.selectedUnit);
    final hasPending = pending.hasPendingPatient;
    return Text('$hasPending patients in Unit ${unit?.unitName}');
  },
)
```

---

## 5. Testing Code

```dart
// test/medical_workflow_test.dart

import 'package:flutter_test/flutter_test.dart';
import 'package:med_monitor/models/patient.dart';
import 'package:med_monitor/models/medical_unit.dart';
import 'package:med_monitor/providers/medical_workflow_provider.dart';

void main() {
  group('Medical Workflow Tests', () {
    test('PendingPatientNotifier - Set and Clear', () {
      final notifier = PendingPatientNotifier();
      
      expect(notifier.pendingPatient, isNull);
      expect(notifier.hasPendingPatient, false);

      final patient = Patient(
        id: '123',
        name: 'Test Patient',
        age: 45,
        gender: 'Male',
        weight: 80.0,
        illness: 'Test Illness',
        companionPhone: '01234567890',
        nurseName: 'Test Nurse',
      );

      notifier.setPendingPatient(patient);
      expect(notifier.pendingPatient, equals(patient));
      expect(notifier.hasPendingPatient, true);

      notifier.clearPendingPatient();
      expect(notifier.pendingPatient, isNull);
      expect(notifier.hasPendingPatient, false);
    });

    test('MedicalUnitsNotifier - Assign and Remove Patient', () {
      final notifier = MedicalUnitsNotifier();
      
      // Get unit A
      final unitA = notifier.getUnitByName('A');
      expect(unitA, isNotNull);
      expect(unitA!.occupiedBedCount, 0);

      // Create patient
      final patient = Patient(
        id: '123',
        name: 'Test',
        age: 45,
        gender: 'Male',
        weight: 80.0,
        illness: 'Test',
        companionPhone: '01234567890',
        nurseName: 'Test',
      );

      // Assign to bed
      final success = notifier.assignPatientToBed(
        unitName: 'A',
        patient: patient,
        bedIndex: 0,
      );

      expect(success, true);
      final unitAfterAssign = notifier.getUnitByName('A');
      expect(unitAfterAssign!.occupiedBedCount, 1);
      expect(unitAfterAssign.getPatientAtBed(0), isNotNull);

      // Remove from bed
      final removeSuccess = notifier.removePatientFromBed(
        unitName: 'A',
        bedIndex: 0,
      );

      expect(removeSuccess, true);
      final unitAfterRemove = notifier.getUnitByName('A');
      expect(unitAfterRemove!.occupiedBedCount, 0);
    });

    test('SelectedUnitNotifier - Select Unit', () {
      final notifier = SelectedUnitNotifier();
      
      expect(notifier.selectedUnit, 'A');

      notifier.selectUnit('B');
      expect(notifier.selectedUnit, 'B');

      notifier.selectUnit('C');
      expect(notifier.selectedUnit, 'C');
    });
  });
}
```

---

## 6. Integration with Main

```dart
// main.dart (Updated MultiProvider)

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MedMonitorApp());
}

class MedMonitorApp extends StatefulWidget {
  const MedMonitorApp({super.key});

  @override
  State<MedMonitorApp> createState() => _MedMonitorAppState();
}

class _MedMonitorAppState extends State<MedMonitorApp> {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // Existing providers
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => DoctorProvider()),
        // ... other existing providers

        // New Medical Workflow Providers
        ChangeNotifierProvider(create: (_) => PendingPatientNotifier()),
        ChangeNotifierProvider(create: (_) => MedicalUnitsNotifier()),
        ChangeNotifierProvider(create: (_) => SelectedUnitNotifier()),
        ChangeNotifierProvider(create: (_) => WorkflowNotifier()),
      ],
      child: MaterialApp(
        title: 'MedMonitor AI',
        theme: ThemeData(
          primaryColor: const Color(0xFF719EFF),
          useMaterial3: true,
        ),
        onGenerateRoute: (settings) {
          switch (settings.name) {
            case '/beds-monitoring':
              return MaterialPageRoute(
                builder: (_) => const BedsMonitoringScreen(),
              );
            // ... other routes
            default:
              return MaterialPageRoute(builder: (_) => const SplashScreen());
          }
        },
        initialRoute: '/',
      ),
    );
  }
}
```

---

This covers the complete implementation with all code examples ready to use!
