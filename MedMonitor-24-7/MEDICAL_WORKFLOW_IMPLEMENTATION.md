# MedMonitor AI - Dynamic State Management Implementation

## Overview
This document describes the complete state management workflow implemented for the MedMonitor AI Flutter application using Provider pattern. The system enables dynamic patient admission and bed allocation across multiple ICU units.

---

## Architecture Components

### 1. **Data Models**

#### **Patient Model** (`lib/models/patient.dart`)
Represents a single patient in the ICU system.

**Fields:**
- `id`: String - Unique patient identifier
- `name`: String - Patient full name
- `age`: int - Patient age
- `gender`: String - Patient gender (Male/Female)
- `weight`: double - Patient weight in kg
- `illness`: String - Primary illness/diagnosis
- `companionPhone`: String - Emergency contact phone
- `nurseName`: String - Assigned nurse name
- `assignedBedIndex`: int? - Bed slot (0-11) when assigned, null if unassigned
- `cameraUrl`: String? - Live camera stream URL (default: http://localhost:5000/stream)

**Key Methods:**
- `copyWith()` - Immutable copy with selective field updates
- `toJson() / fromJson()` - Serialization for API communication
- `==` and `hashCode` - Equality comparison

---

#### **MedicalUnit Model** (`lib/models/medical_unit.dart`)
Represents an ICU unit with 12 bed slots.

**Fields:**
- `unitName`: String - Unit identifier (A, B, C, etc.)
- `totalBeds`: int - Total bed capacity (default: 12)
- `patients`: List<Patient> - All patients assigned to this unit

**Key Methods:**
- `getPatientAtBed(bedIndex)` - Fetch patient at specific bed
- `generateBedSlots()` - Returns List<Patient?> with 12 slots (null for empty beds)
- `assignPatientToBed(patient, bedIndex)` - Assign patient, returns new unit instance
- `removePatientFromBed(bedIndex)` - Remove patient, returns new unit instance
- `occupiedBedCount` - Count of occupied beds
- `availableBedCount` - Count of available beds

---

### 2. **State Management Providers** (`lib/providers/medical_workflow_provider.dart`)

#### **PendingPatientNotifier (ChangeNotifier)**
Holds a temporary patient after form approval, before bed assignment.

**State:**
- `_pendingPatient`: Patient? - Currently pending patient (null if none)

**Methods:**
- `setPendingPatient(patient)` - Store patient after form approval
- `clearPendingPatient()` - Clear after successful bed assignment
- `hasPendingPatient` - Get - Boolean check

**Lifecycle:**
1. Form approved → `setPendingPatient()`
2. Bed selected → Patient assigned → `clearPendingPatient()`

---

#### **MedicalUnitsNotifier (ChangeNotifier)**
Manages all medical units and their patient assignments.

**State:**
- `_units`: List<MedicalUnit> - All units (A, B, C initialized by default)

**Methods:**
- `assignPatientToBed()` - Adds patient to specific bed in specific unit
- `removePatientFromBed()` - Removes patient from bed
- `getUnitByName(unitName)` - Fetch unit by name
- `addUnit(unitName)` - Add new unit
- `getUnitNames()` - Returns list of unit identifiers

**State Updates:**
Uses immutable patterns - creates new unit instances when patients are added/removed.

---

#### **SelectedUnitNotifier (ChangeNotifier)**
Tracks which unit is currently being viewed.

**State:**
- `_selectedUnit`: String - Currently selected unit name (default: 'A')

**Methods:**
- `selectUnit(unitName)` - Change active unit
- `selectedUnit` - Getter

---

#### **WorkflowNotifier (ChangeNotifier)**
Manages form submission and bed selection workflow state.

**State:**
```dart
class WorkflowState {
  final bool isFormSubmitted;
  final String? selectedBedUnitForAssignment;
  final int? selectedBedIndexForAssignment;
}
```

**Methods:**
- `markFormAsSubmitted()` - Flag form as processed
- `selectBedForAssignment()` - Mark bed selection
- `clearBedAssignmentSelection()` - Clear bed selection
- `reset()` - Clear all workflow state

---

### 3. **Provider Registrations**

```dart
// In main.dart MultiProvider setup:
ChangeNotifierProvider(create: (_) => PendingPatientNotifier()),
ChangeNotifierProvider(create: (_) => MedicalUnitsNotifier()),
ChangeNotifierProvider(create: (_) => SelectedUnitNotifier()),
ChangeNotifierProvider(create: (_) => WorkflowNotifier()),
```

---

## Screen Implementations

### **PatientFormScreen** (`lib/features/admin/patient_form_screen.dart`)

**Purpose:** Collect patient information and create pending patient record.

**Key Features:**
- Form fields: Name, ID, Age, Gender, Weight, Illness, Companion Phone, Nurse Name
- Validation: All fields required
- Approve Button: Creates Patient object and calls `setPendingPatient()`
- Rejection Button: Clears form without navigation
- Post-Approval: Navigates to BedsMonitoringScreen
- Navigation Route: `/beds-monitoring`

**Form Validation:**
```dart
if (fields are empty) {
  Show error SnackBar
  Return
}

Create Patient object:
- ID: From form
- cameraUrl: Default 'http://localhost:5000/stream'
- assignedBedIndex: null (not yet assigned)

Set pending: context.read(pendingPatientProvider).setPendingPatient()
Navigate: Navigator.pushReplacementNamed('/beds-monitoring')
```

---

### **BedsMonitoringScreen** (`lib/features/admin/beds_monitoring_screen.dart`)

**Purpose:** Display 12 bed slots per unit with dynamic patient management.

**Key Features:**

#### **Header Bar:**
- Back button for navigation
- Unit Dropdown selector (A, B, C)
- Occupied beds counter (e.g., "Beds: 3/12")
- All update reactively when unit changes

#### **Bed Grid (2x6):**
Displays 12 bed cards using GridView:

**Empty Bed Card:**
- Hospital bed icon
- "No Patient added yet" text
- "Click to add patient" button (if pending patient exists)
- Yellow border if pending patient is available
- Grey border if no pending patient

**Occupied Bed Card:**
- CameraStreamWidget showing live MJPEG stream
- Patient details:
  - Name (bold)
  - Age
  - Assigned Nurse
  - Illness
- Close (X) button for deletion (top right)

#### **Interaction Logic:**

**Empty Bed + Pending Patient Click:**
```
1. Get pending patient from state
2. Call medicalUnitsNotifier.assignPatientToBed()
3. If successful:
   - Clear pending patient
   - Show success SnackBar
   - Bed slot updates with patient card
4. If no pending patient:
   - Show warning SnackBar
```

**Delete Patient (X Button Click:**
```
1. Show confirmation dialog
2. On confirm:
   - Call removePatientFromBed()
   - Bed returns to empty state
   - Show success SnackBar
3. On cancel:
   - Dismiss dialog
   - No changes
```

**Unit Change (Dropdown):**
```
1. Get new unit
2. Select new unit
3. Grid regenerates with new unit's bed slots
4. Counter updates
5. Pending patient buffer unchanged
```

---

## Data Flow Diagram

```
PatientFormScreen
        ↓
[Form Submission]
        ↓
pendingPatientNotifier.setPendingPatient()
        ↓
Navigate to BedsMonitoringScreen
        ↓
BedsMonitoringScreen displays:
├─ SelectedUnitNotifier (current unit)
├─ MedicalUnitsNotifier (all units & patients)
└─ PendingPatientNotifier (pending patient)
        ↓
User clicks empty bed with pending patient
        ↓
medicalUnitsNotifier.assignPatientToBed()
        ↓
pendingPatientNotifier.clearPendingPatient()
        ↓
Bed card updates with patient
Occupied Beds counter increments
```

---

## State Mutation Pattern

**Immutability Principle:**
- Never modify `_units` or `_pendingPatient` directly
- Always create new instances
- Use `copyWith()` for Patient
- Use `assignPatientToBed()` / `removePatientFromBed()` for MedicalUnit

**Example:**
```dart
// Wrong ❌
_units[0].patients.add(newPatient);

// Correct ✅
final updatedUnit = _units[0].assignPatientToBed(newPatient, bedIndex);
_units[0] = updatedUnit;
notifyListeners();
```

---

## Consumer Usage Examples

### **In BedsMonitoringScreen:**

```dart
// Watch pending patient
Consumer<PendingPatientNotifier>(
  builder: (context, notifier, _) {
    if (notifier.hasPendingPatient) {
      // Show "Click to add" button
    }
  },
)

// Watch selected unit
Consumer<SelectedUnitNotifier>(
  builder: (context, notifier, _) {
    final unit = medicalUnitsNotifier.getUnitByName(notifier.selectedUnit);
    // Rebuild grid
  },
)

// Watch medical units
Consumer<MedicalUnitsNotifier>(
  builder: (context, notifier, _) {
    final bedSlots = notifier.getUnitByName(selectedUnit).generateBedSlots();
    // Display bed grid
  },
)
```

---

## Routes

```dart
'/beds-monitoring': BedsMonitoringScreen()
  // Accessible after patient form approval
  // Triggered by PatientFormScreen
```

---

## Integration with Existing System

The medical workflow providers coexist with existing providers:
- AdmissionProvider (handles API admission requests)
- DoctorProvider (manages doctor data)
- Other existing providers

**No conflicts** - the new workflow is isolated and can be used independently or integrated with existing flows.

---

## Testing Workflow

### **Test Case 1: Complete Admission Flow**
1. Navigate to PatientFormScreen
2. Fill all form fields
3. Click Approve
4. Verify navigation to BedsMonitoringScreen
5. Verify pending patient is set
6. Click empty bed
7. Verify patient assigned to bed
8. Verify pending patient cleared
9. Verify counter updated

### **Test Case 2: Unit Switching**
1. In BedsMonitoringScreen
2. Change unit via dropdown
3. Verify bed grid updates
4. Verify counter updates
5. Verify pending patient persists across units

### **Test Case 3: Patient Deletion**
1. Assigned patient in bed
2. Click close (X) button
3. Confirm deletion
4. Verify bed returns to empty
5. Verify counter decremented

### **Test Case 4: Empty Bed Without Pending Patient**
1. Clear pending patient buffer
2. Click empty bed
3. Verify warning SnackBar
4. Verify no assignment occurs

---

## Future Enhancements

1. **Persistence:** Save state to SharedPreferences/Database
2. **Real-time Updates:** Integrate with WebSocket for live bed updates
3. **Multiple Admins:** Support concurrent patient form submissions
4. **Bed Preferences:** Allow unit-specific bed configuration
5. **Patient Transfer:** Enable moving patients between beds/units
6. **Audit Logging:** Track all assignment/removal actions

---

## Dependencies

- `provider: ^6.0.5` - State management (already in pubspec.yaml)
- `camera_stream_widget` - For live MJPEG display

---

## File Structure

```
lib/
├── models/
│   ├── patient.dart (NEW)
│   ├── medical_unit.dart (NEW)
│   └── ... (existing models)
├── providers/
│   ├── medical_workflow_provider.dart (NEW)
│   └── ... (existing providers)
├── features/
│   ├── admin/
│   │   ├── patient_form_screen.dart (UPDATED)
│   │   ├── beds_monitoring_screen.dart (NEW)
│   │   └── ... (existing screens)
│   └── ... (other features)
├── main.dart (UPDATED - added new providers & routes)
└── ...
```

---

## Summary

This state management implementation provides:
✅ **Clean Architecture:** Separated data models from UI logic
✅ **Reactive UI:** Changes propagate automatically via Consumers
✅ **Type Safety:** Immutable models with strong typing
✅ **Scalability:** Easily add more units or features
✅ **Testability:** Logic isolated in notifiers, easy to unit test
✅ **Performance:** Only affected widgets rebuild on state change

The workflow is production-ready and can be deployed to the MedMonitor AI system.
