# State Management Quick Reference

## 1. Creating a Patient

```dart
final newPatient = Patient(
  id: '12345',
  name: 'Ahmed Mohamed',
  age: 45,
  gender: 'Male',
  weight: 85.5,
  illness: 'Heart Attack',
  companionPhone: '01012345678',
  nurseName: 'Nurse Aya',
  cameraUrl: 'http://192.168.1.100:5000/stream',
);
```

## 2. Setting Pending Patient (After Form Approval)

```dart
// In PatientFormScreen - Approve Button
context.read(pendingPatientProvider).setPendingPatient(newPatient);

// Navigate to Beds Screen
Navigator.of(context).pushReplacementNamed('/beds-monitoring');
```

## 3. Assigning Patient to Bed

```dart
// In BedsMonitoringScreen - Empty Bed Click
final pendingPatient = context.read(pendingPatientProvider).pendingPatient!;

final success = context.read(medicalUnitsProvider).assignPatientToBed(
  unitName: 'A',
  patient: pendingPatient,
  bedIndex: 0,
);

if (success) {
  context.read(pendingPatientProvider).clearPendingPatient();
  // Show success message
}
```

## 4. Removing Patient from Bed

```dart
// In BedsMonitoringScreen - Delete Button Click
context.read(medicalUnitsProvider).removePatientFromBed(
  unitName: 'A',
  bedIndex: 2,
);
```

## 5. Switching Units

```dart
// In BedsMonitoringScreen - Dropdown Change
context.read(selectedUnitProvider).selectUnit('B');
// Grid auto-updates via Consumer
```

## 6. Getting Current Unit Data

```dart
// Get current unit name
final unitName = context.read(selectedUnitProvider).selectedUnit;

// Get unit object
final unit = context.read(medicalUnitsProvider).getUnitByName(unitName);

// Get bed slots (List<Patient?>)
final bedSlots = unit?.generateBedSlots() ?? [];
```

## 7. Watching for Changes (in build)

```dart
// Watch pending patient
Consumer<PendingPatientNotifier>(
  builder: (context, notifier, _) {
    return Text(
      notifier.hasPendingPatient ? 'Patient Ready' : 'No Patient',
    );
  },
)

// Watch selected unit
Consumer<SelectedUnitNotifier>(
  builder: (context, notifier, _) {
    return Text('Unit: ${notifier.selectedUnit}');
  },
)

// Watch all units
Consumer<MedicalUnitsNotifier>(
  builder: (context, notifier, _) {
    final units = notifier.getUnitNames();
    return DropdownButton(items: /* ... */);
  },
)
```

## 8. Getting Occupancy Info

```dart
final unit = medicalUnitsNotifier.getUnitByName('A');
final occupied = unit?.occupiedBedCount ?? 0;
final available = unit?.availableBedCount ?? 0;
final total = unit?.totalBeds ?? 12;

print('Beds: $occupied/$total (Available: $available)');
```

## 9. Patient Model - Copy with Updates

```dart
final existingPatient = Patient(
  id: '123',
  name: 'Ahmed',
  age: 45,
  // ... other fields
);

// Update nurse assignment
final updatedPatient = existingPatient.copyWith(
  nurseName: 'New Nurse Name',
);
```

## 10. Multi-Unit Operations

```dart
// Get all units
final allUnits = context.read(medicalUnitsProvider).units;

// Iterate through units
for (var unit in allUnits) {
  print('Unit ${unit.unitName}: ${unit.occupiedBedCount} occupied');
  
  // Get all patients in unit
  for (var patient in unit.patients) {
    print('  - ${patient.name} in bed ${patient.assignedBedIndex}');
  }
}
```

## 11. Error Handling

```dart
try {
  final success = context.read(medicalUnitsProvider).assignPatientToBed(
    unitName: 'A',
    patient: patient,
    bedIndex: 5,
  );
  
  if (!success) {
    showSnackBar('Failed to assign patient');
  }
} catch (e) {
  showSnackBar('Error: ${e.toString()}');
}
```

## 12. Workflow State Management

```dart
// Mark form as submitted
context.read(workflowProvider).markFormAsSubmitted();

// Select bed for assignment
context.read(workflowProvider).selectBedForAssignment('A', 3);

// Get current workflow state
final state = context.read(workflowProvider).state;
print('Form submitted: ${state.isFormSubmitted}');
print('Selected bed: ${state.selectedBedIndexForAssignment}');

// Clear workflow
context.read(workflowProvider).reset();
```

## Provider Dependencies

```dart
// main.dart
MultiProvider(
  providers: [
    // ... existing providers
    ChangeNotifierProvider(create: (_) => PendingPatientNotifier()),
    ChangeNotifierProvider(create: (_) => MedicalUnitsNotifier()),
    ChangeNotifierProvider(create: (_) => SelectedUnitNotifier()),
    ChangeNotifierProvider(create: (_) => WorkflowNotifier()),
  ],
  child: const MedMonitorApp(),
)
```

## Routes

```dart
// Navigate to Beds Monitoring Screen
Navigator.of(context).pushReplacementNamed('/beds-monitoring');

// Or with replacement
Navigator.of(context).pushNamed('/beds-monitoring');
```

## Common Patterns

### Pattern 1: Form Submission → Bed Assignment

```dart
void _submitForm() {
  // Create patient
  final patient = Patient(/* ... */);
  
  // Set as pending
  context.read(pendingPatientProvider).setPendingPatient(patient);
  
  // Navigate
  Navigator.of(context).pushReplacementNamed('/beds-monitoring');
}
```

### Pattern 2: Reactive Bed Grid

```dart
Consumer<SelectedUnitNotifier>(
  builder: (_, selectedUnit, __) {
    return Consumer<MedicalUnitsNotifier>(
      builder: (_, units, __) {
        final currentUnit = units.getUnitByName(selectedUnit.selectedUnit);
        final bedSlots = currentUnit?.generateBedSlots() ?? [];
        
        return GridView.builder(
          itemCount: bedSlots.length,
          itemBuilder: (context, index) {
            final patient = bedSlots[index];
            return patient == null
              ? _buildEmptyBedCard(index)
              : _buildOccupiedBedCard(patient);
          },
        );
      },
    );
  },
)
```

### Pattern 3: Conditional Bed Click

```dart
void _onBedClicked(int bedIndex) {
  final hasPending = context.read(pendingPatientProvider).hasPendingPatient;
  
  if (hasPending) {
    // Assign patient
    final pending = context.read(pendingPatientProvider).pendingPatient!;
    context.read(medicalUnitsProvider).assignPatientToBed(
      unitName: context.read(selectedUnitProvider).selectedUnit,
      patient: pending,
      bedIndex: bedIndex,
    );
    context.read(pendingPatientProvider).clearPendingPatient();
  } else {
    // Show no patient message
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('No pending patient')),
    );
  }
}
```

## Debugging Tips

```dart
// Print all units and patients
context.read(medicalUnitsProvider).units.forEach((unit) {
  print('Unit: ${unit.unitName}');
  unit.patients.forEach((patient) {
    print('  Patient: ${patient.name} at bed ${patient.assignedBedIndex}');
  });
});

// Check pending patient
final pending = context.read(pendingPatientProvider).pendingPatient;
print('Pending: ${pending?.name ?? "None"}');

// Check selected unit
final selected = context.read(selectedUnitProvider).selectedUnit;
print('Selected Unit: $selected');
```

## Performance Notes

- Use `Consumer` instead of `Provider.of()` with `listen: false` in build methods
- Wrap only the widgets that need to rebuild with `Consumer`
- Avoid rebuilding entire screens when only small parts change
- GridView with `Consumer` ensures only affected bed cards rebuild

## State Reset

```dart
// Clear all pending state
context.read(pendingPatientProvider).clearPendingPatient();

// Reset workflow
context.read(workflowProvider).reset();

// Reset unit selection
context.read(selectedUnitProvider).selectUnit('A');

// To completely start over (if needed)
context.read(pendingPatientProvider).clearPendingPatient();
context.read(workflowProvider).reset();
context.read(selectedUnitProvider).selectUnit('A');
```
