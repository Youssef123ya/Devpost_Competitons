# Medical Workflow Implementation Guide

This guide explains the complete medical patient workflow implementation using Flutter and Provider State Management.

## 📋 Overview

The system manages a complete patient admission workflow:
1. **Patient Form Screen** - Super Admin fills and approves patient data
2. **Beds Monitoring Screen** - Dynamic bed allocation and patient monitoring

## 🏗️ Architecture

### State Management: Provider Pattern

```
PatientWorkflowProvider
├── Manages pending patient state
├── Manages multiple medical units
├── Handles bed allocation logic
└── Notifies UI on state changes
```

## 📁 File Structure

```
lib/
├── models/
│   ├── patient.dart              # Patient data model
│   └── medical_unit.dart         # Medical unit with beds
├── providers/
│   └── patient_workflow_provider.dart  # State management
├── features/
│   └── admin/
│       ├── patient_form_screen_enhanced.dart
│       └── beds_monitoring_screen_enhanced.dart
└── widgets/
    ├── patient_bed_card.dart     # Occupied bed UI
    └── empty_bed_card.dart       # Empty bed UI
```

## 🔑 Key Components

### 1. Data Models

#### Patient Model (`models/patient.dart`)
```dart
class Patient {
  final String id;
  final String name;
  final int age;
  final String gender;
  final double weight;
  final String illness;
  final String companionPhone;
  final String nurseName;
  final int? assignedBedIndex;  // null if not assigned
  final String? cameraUrl;       // Optional camera stream
}
```

#### MedicalUnit Model (`models/medical_unit.dart`)
```dart
class MedicalUnit {
  final String unitName;         // e.g., 'A', 'B', 'C'
  final int totalBeds;           // Default: 12
  final List<Patient> patients;  // Assigned patients
  
  // Helper methods:
  List<Patient?> generateBedSlots()      // Generate 12-slot array
  Patient? getPatientAtBed(int bedIndex) // Get patient at specific bed
  MedicalUnit assignPatientToBed()       // Assign patient to bed
  MedicalUnit removePatientFromBed()     // Remove patient from bed
}
```

### 2. State Management Provider

#### PatientWorkflowProvider (`providers/patient_workflow_provider.dart`)

**State Variables:**
- `_pendingPatient` - Holds patient data after form approval
- `_medicalUnits` - Map of units with their patients
- `_selectedUnitName` - Currently selected unit for monitoring

**Key Methods:**

```dart
// Submit patient form - holds as pending
void submitPatientForm(Patient patient)

// Assign pending patient to specific bed
bool assignPendingPatientToBed(int bedIndex)

// Remove patient from bed
void removePatientFromBed(int bedIndex)

// Switch between units
void switchUnit(String unitName)

// Clear pending patient
void clearPendingPatient()

// Get bed slots for selected unit
List<Patient?> getBedSlotsForSelectedUnit()

// Check occupancy
int getOccupiedBedCountForSelectedUnit()
```

### 3. UI Screens

#### Patient Form Screen (`patient_form_screen_enhanced.dart`)

**Features:**
- Collects all patient information via text fields
- Gender selection (Male/Female)
- Form validation before submission
- "Approve" button - submits patient as pending
- "Rejection" button - clears and navigates back
- Responsive design with error handling

**Flow:**
1. User fills form with all patient details
2. Clicks "Approve"
3. Patient stored in `_pendingPatient` state
4. Auto-navigates to Beds Monitoring Screen

#### Beds Monitoring Screen (`beds_monitoring_screen_enhanced.dart`)

**Features:**
- **Top Bar:**
  - Bed counter: `Beds: {occupied}/{total}`
  - Unit selector dropdown (A, B, C, etc.)
  - Back navigation

- **Dynamic Bed Grid:**
  - 12 bed slots in 2-column grid
  - Responsive card layout
  - Each bed is either occupied or empty

**Occupied Bed Card:**
- Monitor stream preview (placeholder with BPM display)
- Patient details: Name, Age, Nurse, Illness
- "Delete Patient" button with confirmation dialog

**Empty Bed Card:**
- Hospital bed illustration
- "No Patient added yet" text
- "Click to add patient" button
- On click: Assigns pending patient to this bed

## 🔄 Workflow Diagram

```
┌─────────────────────────────┐
│   Patient Form Screen       │
│  (Fill patient details)     │
└──────────────┬──────────────┘
               │
               │ Click "Approve"
               ▼
      ┌────────────────────┐
      │ submitPatientForm()│
      │ Set _pendingPatient│
      └────────────┬───────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │ Beds Monitoring Screen       │
    │ (Dynamic Unit Dashboard)     │
    └──────────────┬───────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
    ┌─────────┐         ┌──────────┐
    │ Click   │         │ Switch   │
    │ Empty   │         │ Units    │
    │ Bed     │         │ (A,B,C)  │
    └────┬────┘         └──────────┘
         │
         │ assignPendingPatientToBed()
         │ _pendingPatient = null
         ▼
    ┌────────────────┐
    │ Patient Assigned│
    │ to Bed Instantly│
    └────────────────┘
```

## 🎯 Usage Example

### Integration in main.dart

```dart
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
        ChangeNotifierProvider(
          create: (_) => PatientWorkflowProvider(),
        ),
        // Other providers...
      ],
      child: MaterialApp(
        title: 'MedMonitor',
        home: const PatientFormScreenEnhanced(),
        // or routes...
      ),
    );
  }
}
```

### Navigate to Patient Form

```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => const PatientFormScreenEnhanced(),
  ),
);
```

### Access Workflow State

```dart
// In any widget within the provider scope:
final provider = context.read<PatientWorkflowProvider>();

// Check if pending patient exists
if (provider.hasPendingPatient()) {
  final patient = provider.pendingPatient;
  print('Pending: ${patient?.name}');
}

// Get all units
final units = provider.unitNames; // ['A', 'B', 'C']

// Get current unit occupancy
final occupied = provider.getOccupiedBedCountForSelectedUnit();
final total = provider.getTotalBedsForSelectedUnit();
```

## 🛠️ Customization

### Add More Medical Units

```dart
final provider = context.read<PatientWorkflowProvider>();
provider.addMedicalUnit('D', 12);  // Add unit D with 12 beds
```

### Change Beds Per Unit

Edit `patient_workflow_provider.dart`:
```dart
Map<String, MedicalUnit> _medicalUnits = {
  'A': const MedicalUnit(unitName: 'A', totalBeds: 20),  // Changed to 20
  'B': const MedicalUnit(unitName: 'B', totalBeds: 12),
};
```

### Modify UI Colors

Update color constants in screen files:
```dart
// Current color palette
Color(0xFF719EFF)   // Primary blue
Color(0xFF2E55A7)   // Dark blue
Color(0xFF5B9EFF)   // Light blue
Color(0xFFEDF3FF)   // Background
```

## 🔌 Integration with Backend

### Current Implementation: In-Memory State

The current implementation uses Provider for client-side state management. To integrate with a backend:

1. **Add API Service:**
   ```dart
   class PatientService {
     Future<Patient> createPatient(Patient patient) async {
       final response = await dio.post('/patients', data: patient.toJson());
       return Patient.fromJson(response.data);
     }
     
     Future<void> assignPatientToUnit(String patientId, int bedIndex) async {
       await dio.post('/beds/assign', data: {
         'patientId': patientId,
         'bedIndex': bedIndex,
       });
     }
   }
   ```

2. **Update Provider:**
   ```dart
   class PatientWorkflowProvider with ChangeNotifier {
     final PatientService _service = PatientService();
     
     Future<bool> assignPendingPatientToBed(int bedIndex) async {
       if (_pendingPatient == null) return false;
       
       try {
         // Save to backend
         await _service.assignPatientToUnit(
           _pendingPatient!.id,
           bedIndex,
         );
         
         // Update local state
         final currentUnit = _medicalUnits[_selectedUnitName]!;
         final updatedUnit = currentUnit.assignPatientToBed(
           _pendingPatient!,
           bedIndex,
         );
         _medicalUnits[_selectedUnitName] = updatedUnit;
         _pendingPatient = null;
         notifyListeners();
         return true;
       } catch (e) {
         debugPrint('Error: $e');
         return false;
       }
     }
   }
   ```

## ✨ Features Implemented

✅ Patient form with all required fields
✅ Form validation and error handling
✅ Pending patient state management
✅ Multiple medical units support
✅ 12-bed dynamic grid generation
✅ Occupied bed display with patient info
✅ Empty bed cards with add patient functionality
✅ Unit switching with dynamic updates
✅ Bed occupancy counter
✅ Patient deletion with confirmation
✅ Clean, modular code structure
✅ Responsive design
✅ Error handling and user feedback

## 📱 Responsive Design

The implementation uses:
- `GridView` for responsive bed layout
- `Expanded` widgets for flexible layouts
- `MediaQuery` for screen-aware padding
- Appropriate `CrossAxisAlignment` and `MainAxisAlignment`

All screens adapt to different screen sizes and orientations.

## 🐛 Troubleshooting

### Pending Patient Not Showing

```dart
// Check if pending patient is set
final hasPending = provider.hasPendingPatient();
debugPrint('Has pending: $hasPending');
debugPrint('Pending: ${provider.pendingPatient?.name}');
```

### Beds Not Updating After Assignment

Ensure you're using `Consumer<PatientWorkflowProvider>` widget to rebuild on state changes.

### Unit Switching Issues

Verify unit names are case-sensitive. Use `provider.unitNames` to get available units.

## 📚 Additional Resources

- **Provider Documentation:** https://pub.dev/packages/provider
- **Flutter Responsive Design:** https://flutter.dev/docs/development/ui/layout/responsive
- **State Management Best Practices:** https://flutter.dev/docs/development/data-and-backend/state-mgmt/intro

---

**Last Updated:** 2026
**Version:** 1.0.0
