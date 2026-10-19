# Updating Flutter Screens to Use Typed Bed Model

## Overview

After the BedProvider update to use `List<Bed>` instead of `List<dynamic>`, you may need to update screens that access bed data. This guide shows how to migrate them.

---

## 1. Beds Monitoring Screen

### Before (With Dynamic)
```dart
// ❌ Accessing bed as dynamic
bed['status'] == 1
bed['bedNumber']
bed['patientId'] ?? 'EMPTY'
```

### After (With Typed Model)
```dart
// ✅ Accessing bed as typed object
bed.status == 1
bed.bedNumber
bed.patientId ?? 'EMPTY'

// ✅ Using helper properties
if (bed.isOccupied) { }
if (bed.isAvailable) { }
```

---

## 2. Bed Status Indicators

### Example: Display Bed Status Card

**Before:**
```dart
// ❌ Without typing
final bedStatus = bed['status'];
final color = bedStatus == 1 ? Colors.red : Colors.green;
final icon = bedStatus == 1 ? Icons.person : Icons.person_outline;
```

**After:**
```dart
// ✅ With typing - clearer intent
final color = bed.status == 1 ? Colors.red : Colors.green;
final icon = bed.isOccupied ? Icons.person : Icons.person_outline;
final subtitle = bed.patientId ?? 'EMPTY';  // Type-safe access
```

---

## 3. Building Bed Grid

### Example: Bed Grid in Monitoring Screen

**Before:**
```dart
// ❌ Dynamic casting required
GridView.builder(
  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 4),
  itemCount: provider.beds.length,
  itemBuilder: (context, index) {
    final bed = provider.beds[index];  // Could be any type
    return BedTile(
      bedNumber: bed['bedNumber'],     // Manual string conversion
      status: bed['status'],           // Manual int conversion
      hasPatient: bed['patientId'] != null,
    );
  },
)
```

**After:**
```dart
// ✅ Typed model, no casting needed
GridView.builder(
  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 4),
  itemCount: provider.beds.length,
  itemBuilder: (context, index) {
    final bed = provider.beds[index];  // Type-safe: Bed model
    return BedTile(
      bed: bed,  // Pass entire typed object
    );
  },
)
```

**BedTile Widget:**
```dart
class BedTile extends StatelessWidget {
  final Bed bed;  // ✅ Type-safe parameter

  const BedTile({required this.bed});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: bed.isOccupied ? Colors.red[100] : Colors.green[100],
        border: Border.all(
          color: bed.status == 2 ? Colors.orange : Colors.transparent,
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(bed.bedNumber, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          SizedBox(height: 8),
          Icon(
            bed.isOccupied ? Icons.person : Icons.person_outline,
            color: bed.isOccupied ? Colors.red : Colors.grey,
          ),
          if (bed.patientId != null)
            Text('Patient: ${bed.patientId}', style: TextStyle(fontSize: 10)),
        ],
      ),
    );
  }
}
```

---

## 4. Filtering Beds

### Example: Get Occupied Beds for Patient Assignment

**Before:**
```dart
// ❌ Manual filtering with magic numbers
final occupiedBeds = provider.beds
    .where((bed) => bed['status'] == 1 && bed['patientId'] != null)
    .toList();
```

**After:**
```dart
// ✅ Use typed model helper method
final occupiedBeds = provider.getOccupiedBeds();

// ✅ Or with explicit typing
final occupiedBeds = provider.beds
    .where((bed) => bed.isOccupied)
    .toList();
```

---

## 5. Patient Assignment Flow

### Example: Assign Patient to Bed

**Before:**
```dart
// ❌ Complex data handling
void assignPatient(BuildContext context) {
  final bedId = selectedBed['id'];
  final bedNumber = selectedBed['bedNumber'];
  
  context.read<BedProvider>().assignPatientToBed(
    bedId,
    patientId,
  );
}
```

**After:**
```dart
// ✅ Type-safe assignment
void assignPatient(BuildContext context) {
  final bed = provider.getBedById(selectedBedId);
  if (bed == null) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Bed not found')),
    );
    return;
  }

  if (!bed.isAvailable) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Bed ${bed.bedNumber} is not available')),
    );
    return;
  }

  context.read<BedProvider>().assignPatientToBed(
    bed.id,
    patientId,
  );
}
```

---

## 6. Bed Availability Checks

### Example: Show Available Beds for Selection

**Before:**
```dart
// ❌ Hard to understand what status means
dropdownItems: provider.beds
    .where((bed) => bed['status'] == 0)  // What's 0?
    .map((bed) => DropdownMenuItem(
      value: bed['id'],
      child: Text('Bed ${bed["bedNumber"]}'),
    ))
    .toList()
```

**After:**
```dart
// ✅ Self-documenting code
dropdownItems: provider.getAvailableBeds()
    .map((bed) => DropdownMenuItem(
      value: bed.id,
      child: Text('Bed ${bed.bedNumber}'),
    ))
    .toList()
```

---

## 7. Bed Details Display

### Example: Show Full Bed Information

**Before:**
```dart
// ❌ Manual type handling
Column(
  children: [
    Text('Bed: ${bed['bedNumber']}'),
    Text('Status: ${_getStatusText(bed["status"])}'),
    Text('Patient: ${bed["patientId"] ?? "EMPTY"}'),
    if (bed['assignedDate'] != null)
      Text('Assigned: ${bed["assignedDate"]}'),
  ],
)

String _getStatusText(int status) {
  switch (status) {
    case 0: return 'Available';
    case 1: return 'Occupied';
    case 2: return 'Maintenance';
    default: return 'Unknown';
  }
}
```

**After:**
```dart
// ✅ Using typed model helper properties
Column(
  children: [
    Text('Bed: ${bed.bedNumber}'),
    Text('Status: ${_getStatusText(bed.status)}'),
    Text('Patient: ${bed.patientId ?? "EMPTY"}'),
    if (bed.assignedDate != null)
      Text('Assigned: ${bed.assignedDate}'),
  ],
)

// ✅ Or use model's built-in helpers
Row(
  children: [
    Icon(bed.isOccupied ? Icons.person : Icons.person_outline),
    Text(bed.isOccupied ? 'Occupied' : 'Available'),
  ],
)
```

---

## 8. Real-Time Updates with Consumer

### Example: Update UI When Beds Change

**Before:**
```dart
// ❌ No type hints
Consumer<BedProvider>(
  builder: (context, provider, _) {
    return ListView.builder(
      itemCount: provider.beds.length,
      itemBuilder: (context, index) {
        final bed = provider.beds[index];  // Type unknown
        return ListTile(
          title: Text('${bed['bedNumber']}'),
          subtitle: Text('Patient: ${bed['patientId']}'),
        );
      },
    );
  },
)
```

**After:**
```dart
// ✅ Fully typed and autocompleted
Consumer<BedProvider>(
  builder: (context, provider, _) {
    final beds = provider.beds;  // Type: List<Bed>
    
    if (beds.isEmpty) {
      return Center(child: Text('No beds available'));
    }

    return ListView.builder(
      itemCount: beds.length,
      itemBuilder: (context, index) {
        final bed = beds[index];  // Type: Bed (autocompleted!)
        return ListTile(
          title: Text(bed.bedNumber),
          subtitle: Text('Patient: ${bed.patientId ?? "EMPTY"}'),
          trailing: bed.isOccupied 
            ? Icon(Icons.check_circle, color: Colors.green)
            : Icon(Icons.cancel, color: Colors.grey),
          onTap: bed.isAvailable 
            ? () => _assignPatient(context, bed)
            : null,
        );
      },
    );
  },
)
```

---

## 9. Bed Statistics

### Example: Calculate Bed Statistics

**Before:**
```dart
// ❌ Manual calculations
int totalBeds = provider.beds.length;
int occupied = provider.beds
    .where((b) => b['status'] == 1)
    .length;
int available = provider.beds
    .where((b) => b['status'] == 0)
    .length;
int maintenance = provider.beds
    .where((b) => b['status'] == 2)
    .length;

double occupancyRate = (occupied / totalBeds) * 100;
```

**After:**
```dart
// ✅ Use provider's built-in helper methods
final totalBeds = provider.totalBedsCount;
final occupied = provider.occupiedCount;
final available = provider.getAvailableBeds().length;
final maintenance = provider.getMaintenanceBeds().length;

final occupancyRate = (occupied / totalBeds) * 100;

// ✅ Better: Extract to extension
```

---

## 10. Creating an Extension for Common Operations

Create `lib/extensions/bed_extensions.dart`:

```dart
import '../models/bed.dart';

extension BedListExtensions on List<Bed> {
  int get occupiedCount => where((bed) => bed.isOccupied).length;
  int get availableCount => where((bed) => bed.isAvailable).length;
  int get maintenanceCount => where((bed) => bed.isMaintenance).length;
  
  double get occupancyRate => isEmpty 
    ? 0 
    : (occupiedCount / length) * 100;
  
  List<Bed> get occupiedBeds => where((bed) => bed.isOccupied).toList();
  List<Bed> get availableBeds => where((bed) => bed.isAvailable).toList();
  List<Bed> get maintenanceBeds => where((bed) => bed.isMaintenance).toList();
  
  Bed? findById(int id) {
    try {
      return firstWhere((bed) => bed.id == id);
    } catch (e) {
      return null;
    }
  }
  
  Bed? findByNumber(String number) {
    try {
      return firstWhere((bed) => bed.bedNumber == number);
    } catch (e) {
      return null;
    }
  }
  
  List<Bed> findByPatientId(String patientId) {
    return where((bed) => bed.patientId == patientId).toList();
  }
}
```

Usage:
```dart
// ✅ Clean and readable
final occupancy = provider.beds.occupancyRate;
final available = provider.beds.availableCount;
final bedsByPatient = provider.beds.findByPatientId(patientId);
```

---

## 11. Testing

### Unit Test Example

**Before:**
```dart
// ❌ Unclear what data structure is expected
test('occupiedCount should return correct number', () {
  final beds = [
    {'id': 1, 'status': 1},
    {'id': 2, 'status': 0},
    {'id': 3, 'status': 1},
  ];
  expect(beds.where((b) => b['status'] == 1).length, 2);
});
```

**After:**
```dart
// ✅ Type-safe and clear
test('occupiedCount should return correct number', () {
  final beds = [
    Bed(id: 1, bedNumber: '101', status: 1),
    Bed(id: 2, bedNumber: '102', status: 0),
    Bed(id: 3, bedNumber: '103', status: 1),
  ];
  expect(beds.where((bed) => bed.isOccupied).length, 2);
});
```

---

## Migration Checklist

When updating your screens to use the typed Bed model:

- [ ] Replace all `bed['property']` with `bed.property`
- [ ] Remove manual status value checks (use `bed.isOccupied`, `bed.isAvailable`, etc.)
- [ ] Update any type hints from `dynamic` to `Bed`
- [ ] Use provider's helper methods instead of manual filtering
- [ ] Add null checks for `patientId` using `bed.patientId ?? 'EMPTY'`
- [ ] Update any hardcoded status values (0, 1, 2) with enum or helper properties
- [ ] Create extensions for common operations
- [ ] Update tests to use typed model
- [ ] Verify autocomplete works in IDE

---

## Common Patterns

### Pattern 1: Safe Bed Access
```dart
// ✅ Safe: Returns null if not found
final bed = provider.getBedById(bedId);
if (bed != null && bed.isOccupied) {
  print('Patient ${bed.patientId} is in bed ${bed.bedNumber}');
}
```

### Pattern 2: Filter and Map
```dart
// ✅ Type-safe filtering and transformation
final occupiedWithPatients = provider.beds
    .where((bed) => bed.isOccupied && bed.patientId != null)
    .map((bed) => '${bed.bedNumber}: ${bed.patientId}')
    .toList();
```

### Pattern 3: Conditional Display
```dart
// ✅ Clear intent
if (bed.status == 2) {
  return Text('Under Maintenance', style: TextStyle(color: Colors.orange));
} else if (bed.isOccupied) {
  return Text('Occupied: ${bed.patientId}', style: TextStyle(color: Colors.red));
} else {
  return Text('Available', style: TextStyle(color: Colors.green));
}
```

---

## Benefits After Migration

✅ **Type Safety:** IDE catches errors before runtime
✅ **Autocomplete:** Full IDE support for Bed properties
✅ **Self-Documenting:** Code reads naturally
✅ **Refactoring:** Easy to rename properties across app
✅ **Testing:** Typed models easier to test
✅ **Performance:** Type hints allow better optimization
✅ **Maintainability:** Less error-prone than magic strings/numbers
