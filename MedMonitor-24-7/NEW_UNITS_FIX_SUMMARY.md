# Fix: New Units Not Appearing in Doctor/Nurse Home Screens

## Problem
When Super Admin adds a new unit (e.g., Unit H) with 12 beds via the (+) Add Unit button:
- Unit H doesn't appear in Doctor Home Screen ❌
- Unit H doesn't appear in Nurse Home Screen ❌
- Patients assigned to Unit H beds don't display ❌

## Root Cause
Both `doctor_home_screen.dart` and `nurse_home_screen.dart` had **hardcoded unit lists**:

### BEFORE (Broken)
```dart
List<String> units = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
```

This meant ANY new unit added dynamically would never appear in these screens.

---

## Step 1 — Solution Applied: Dynamic Unit Extraction

### Doctor Home Screen (`lib/features/doctor/doctor_home_screen.dart`)

**Added import:**
```dart
import '../../providers/bed_provider.dart';
```

**Updated initState() to fetch beds:**
```dart
@override
void initState() {
  super.initState();
  currentUser = widget.user;

  WidgetsBinding.instance.addPostFrameCallback((_) {
    final bedProvider = Provider.of<BedProvider>(context, listen: false);
    bedProvider.fetchAllBeds();  // ✅ Fetch all beds including new units
    
    final doctorProvider = Provider.of<DoctorProvider>(context, listen: false);
    doctorProvider.fetchBedsByUnit("1");
  });
}
```

**Updated _buildUnitsView() to use dynamic units:**
```dart
Widget _buildUnitsView(DoctorProvider provider) {
  // ✅ Dynamic units from BedProvider instead of hardcoded
  final bedProvider = Provider.of<BedProvider>(context);
  final beds = bedProvider.beds;
  
  List<String> units = beds
      .map((bed) => bed.bedNumber.isNotEmpty ? bed.bedNumber[0] : '')
      .where((unit) => unit.isNotEmpty)
      .toSet()
      .toList()
    ..sort();  // A, B, C... H in alphabetical order
  
  if (units.isEmpty) {
    units = ['A', 'B', 'C', 'D', 'E', 'F', 'G']; // Fallback if no beds
  }

  // ... rest of build code ...
}
```

### Nurse Home Screen (`lib/features/nurse/nurse_home_screen.dart`)

**Same fixes applied:**
1. Added `import '../../providers/bed_provider.dart';`
2. Updated `initState()` to call `bedProvider.fetchAllBeds()`
3. Updated `_buildUnitsView()` to dynamically extract units from beds

---

## Step 2 — How Beds Screen Works (Already Good ✅)

**File:** `lib/features/doctor/beds_screen.dart`

This screen already dynamically filters beds by unit letter:

```dart
final String unitName = args != null ? args.toString() : 'Unknown';

// Filter beds for this specific unit
final allUnitBeds = bedProvider.beds
    .where((bed) => bed.bedNumber.startsWith(unitName))
    .toList();
```

So when a new unit is added, this screen automatically shows all beds for that unit.

---

## Step 3 — How New Beds Are Created

**File:** `lib/features/admin/patient_form_screen.dart`

When Super Admin taps **(+) Add New Unit**:

```dart
Future<void> _addNewUnit(BuildContext context, StateSetter dialogSetState) async {
  final bedProvider = context.read<BedProvider>();
  
  // Find last unit letter
  final units = bedProvider.beds
      .map((b) => b.bedNumber.isNotEmpty ? b.bedNumber[0] : '')
      .where((unit) => unit.isNotEmpty)
      .toSet()
      .toList()
    ..sort();

  // Calculate next unit (e.g., G → H)
  final nextUnit = units.isEmpty ? 'A' : String.fromCharCode(units.last.codeUnitAt(0) + 1);
  
  // Create 12 beds for new unit via API
  for (var i = 1; i <= 12; i++) {
    try {
      await bedProvider.createBed('$nextUnit$i');  // POST /Bed/Create
    } catch (e) {
      debugPrint('Failed to create bed $nextUnit$i: $e');
    }
  }

  // Refresh all beds from server
  await bedProvider.fetchAllBeds();
  dialogSetState(() {});

  // Show confirmation
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Unit $nextUnit created with 12 beds ✅')),
  );
}
```

**API Call:**
```
POST /Bed/Create
{
  "bedNumber": "H1",
  "status": 0  // Available
}
```

---

## Step 4 — Auto-Refresh Flow

After **Super Admin adds Unit H**:

1. ✅ `bedProvider.createBed('H1')` → `bedProvider.createBed('H12')` creates 12 beds in DB
2. ✅ `bedProvider.fetchAllBeds()` fetches all beds including H1-H12
3. ✅ Doctor/Nurse home screens watch `BedProvider` (via `Provider.of<BedProvider>(context)`)
4. ✅ Screens automatically rebuild with new units list including 'H'
5. ✅ When doctor/nurse taps **Unit H**, beds_screen filters and shows H1-H12

---

## Step 5 — Verification Checklist

### Database Level
Run this SQL to verify new beds are created:
```sql
SELECT Id, BedNumber, Status 
FROM Beds 
WHERE BedNumber LIKE 'H%'
ORDER BY BedNumber;
```

Expected: 12 rows with bedNumber H1, H2, ... H12 and status=0 (available)

### App Level
1. ✅ Open Admin Approval Screen
2. ✅ Tap **(+) Add New Unit** → creates Unit H with 12 beds
3. ✅ Approve a patient → Unit H appears in bed selection dialog
4. ✅ Assign patient to H6 → success
5. ✅ Close approval screen
6. ✅ Doctor Home Screen → shows Unit A, B, C, D, E, F, G, **H** ✅
7. ✅ Tap **Unit H** → shows 12 beds (H1-H12) with new patient in H6

---

## Files Modified

| File | Change |
|------|--------|
| `lib/features/doctor/doctor_home_screen.dart` | Added BedProvider import, fetch beds in initState, dynamic unit extraction |
| `lib/features/nurse/nurse_home_screen.dart` | Added BedProvider import, fetch beds in initState, dynamic unit extraction |
| `lib/features/admin/patient_form_screen.dart` | Already has `_addNewUnit()` that creates beds and refreshes |
| `lib/providers/bed_provider.dart` | Already has `createBed()` for POST /Bed/Create |

---

## Complete Unit Creation Flow

```
Super Admin Home
  ↓
Approve Patient Request
  ↓
Bed Selection Dialog shows (Unit A-G with available beds)
  ↓
Tap "(+) Add New Unit"
  ↓
_addNewUnit() creates H1-H12 via bedProvider.createBed() [×12]
  ↓
bedProvider.fetchAllBeds() refreshes all beds from /Bed/GetAll
  ↓
Dialog updates: shows Unit A-H with available beds
  ↓
Admin selects bed H6 and approves patient
  ↓
Patient assigned to Bed H6
  ↓
Doctor/Nurse home screen rebuild
  ↓
BedProvider.beds now includes H1-H12
  ↓
_buildUnitsView() extracts units: ['A','B','C','D','E','F','G','H']
  ↓
Unit H card appears in Doctor/Nurse screen ✅
  ↓
Doctor/Nurse tap Unit H
  ↓
beds_screen filters: beds.where((b) => b.bedNumber.startsWith('H'))
  ↓
Shows H1-H12, with patient info for H6 ✅
```

---

## Summary

✅ **Root cause:** Hardcoded unit lists in home screens  
✅ **Solution:** Dynamic extraction from `BedProvider.beds`  
✅ **Result:** Any new unit added automatically appears in home screens  
✅ **Patient assignment:** Works for any unit including new ones  
✅ **No breaking changes:** Fallback to defaults if no beds exist  
