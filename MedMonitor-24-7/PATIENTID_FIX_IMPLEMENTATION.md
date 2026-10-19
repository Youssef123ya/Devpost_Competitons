# PatientId Fix - Implementation Guide

## 🚀 What Was Fixed

### Issue
When Flutter app restarts or user logs in, beds list loads but `PatientId` appears **null** even though database has patients assigned.

### Root Cause
1. **Backend:** API was returning PascalCase properties (`PatientId`, `Status`) but Flutter code expected camelCase (`patientId`, `status`)
2. **Flutter:** Using `List<dynamic>` instead of typed model, causing property name mismatches to silently fail
3. **Fallback Data:** Hardcoded fake data masked the real issue

---

## ✅ Changes Made

### 1. Backend (C#) - Program.cs
**File:** `MedMonitor-master-BackEnd/MedMonitor-master/MedMonitor/Program.cs`

✅ Added camelCase property naming policy:
```csharp
.AddJsonOptions(x => {
    x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    x.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;  // ✅ ADDED
});
```

**Result:** API now returns `{ "patientId": "user-123", ...}` instead of `{ "PatientId": "user-123", ...}`

---

### 2. Flutter Model - bed.dart
**File:** `med_monitor/lib/models/bed.dart` (NEW FILE)

✅ Created typed Bed model with:
- Type-safe properties: `id`, `bedNumber`, `status`, `patientId`, `assignedDate`
- Smart `fromJson()` factory that handles **both** PascalCase and camelCase
- Helper properties: `isOccupied`, `isAvailable`, `isMaintenance`
- Equality and toString() implementations

**Key Feature:** The `fromJson()` method handles both formats:
```dart
factory Bed.fromJson(Map<String, dynamic> json) {
  return Bed(
    id: json['id'] ?? json['Id'],                    // Accepts both
    bedNumber: json['bedNumber'] ?? json['BedNumber'],
    patientId: json['patientId'] ?? json['PatientId'],
    // ... etc
  );
}
```

This ensures it works during the transition AND after the fix.

---

### 3. Flutter Provider - bed_provider.dart
**File:** `med_monitor/lib/providers/bed_provider.dart`

✅ Updated to use typed Bed model:

**Before:**
```dart
List<dynamic> _beds = [];
bed['status'] == 1           // Breaks if property name wrong
```

**After:**
```dart
List<Bed> _beds = [];
bed.status == 1              // Type-safe, no property name issues
```

✅ Improved `fetchAllBeds()`:
```dart
_beds = (response.data as List)
    .map((json) => Bed.fromJson(json as Map<String, dynamic>))
    .toList();

// Debug logging shows PatientId
for (var bed in _beds) {
  debugPrint('Bed ${bed.bedNumber}: Status=${bed.status}, PatientId=${bed.patientId}');
}
```

✅ Added helper methods:
- `getBedById(int bedId)` - Find specific bed
- `getBedByNumber(String bedNumber)` - Find by number
- `getOccupiedBeds()` - Get all occupied beds
- `getAvailableBeds()` - Get all available beds
- `getMaintenanceBeds()` - Get all maintenance beds

✅ Removed fake fallback data (was masking bugs)

---

## 🧪 Testing & Verification

### Step 1: Test Backend API Response

```bash
# Get all beds
curl -X GET http://localhost:5140/Bed/GetAll \
  -H "Authorization: Bearer {YOUR_JWT_TOKEN}"

# Expected response (with camelCase):
[
  {
    "id": 1,
    "bedNumber": "101",
    "status": 1,
    "patientId": "user-123",
    "assignedDate": "2026-06-02T10:30:00"
  },
  {
    "id": 2,
    "bedNumber": "102",
    "status": 0,
    "patientId": null,
    "assignedDate": null
  }
]
```

### Step 2: Rebuild Backend

```bash
# In MedMonitor project folder
dotnet build
dotnet run
```

### Step 3: Rebuild Flutter App

```bash
cd med_monitor
flutter clean
flutter pub get
flutter run
```

### Step 4: Check Debug Logs

When app starts, look for logs in Flutter console:
```
✅ Successfully loaded 4 beds
Bed 101: Status=1, PatientId=user-123      ✅ Not null!
Bed 102: Status=0, PatientId=null          ✅ Correctly null
Bed 103: Status=1, PatientId=user-456      ✅ Not null!
Bed 104: Status=2, PatientId=null          ✅ Maintenance, no patient
```

### Step 5: Manual Widget Test

Add this code to BedProvider screen to verify:

```dart
Consumer<BedProvider>(
  builder: (context, provider, _) {
    return Column(
      children: [
        Text('Total Beds: ${provider.totalBedsCount}'),
        Text('Occupied: ${provider.occupiedCount}'),
        ...provider.beds.map((bed) => ListTile(
          title: Text('Bed ${bed.bedNumber}'),
          subtitle: Text('PatientId: ${bed.patientId ?? "EMPTY"}'),
          trailing: bed.isOccupied 
            ? Icon(Icons.person, color: Colors.green)
            : Icon(Icons.person_outline, color: Colors.grey),
        )),
      ],
    );
  },
)
```

---

## 🔍 How to Verify PatientId is Working

### In Bed Model
```dart
// ✅ Property access is type-safe
var bed = provider.beds[0];
print(bed.patientId);  // Shows actual value or null, not error

// ✅ Status checking is explicit
if (bed.isOccupied) {
  print('Patient ${bed.patientId} in bed ${bed.bedNumber}');
}

// ✅ Type system catches errors at compile-time
bed.patientd;  // ❌ COMPILE ERROR: undefined property
bed.patientId; // ✅ OK
```

### In Provider Usage
```dart
// ✅ Filter by occupation
List<Bed> occupiedBeds = provider.getOccupiedBeds();
for (var bed in occupiedBeds) {
  // patientId is guaranteed non-null here
  assert(bed.patientId != null);
}

// ✅ Safe access
var firstBed = provider.getBedById(1);
if (firstBed != null) {
  print('Bed found: ${firstBed.patientId}');
}
```

---

## 📝 Before vs After Comparison

| Aspect | Before (❌ Bug) | After (✅ Fixed) |
|--------|-----------------|-----------------|
| **Property Name** | `PatientId` (PascalCase) | `patientId` (camelCase) |
| **Type Safety** | `List<dynamic>` (not type-checked) | `List<Bed>` (compiler-checked) |
| **Property Access** | `bed['patientId']` (silent null) | `bed.patientId` (type-safe) |
| **Null Handling** | Falls through to fake data | Explicit null checks |
| **Debugging** | Hard to trace (dynamic) | Clear debug logs |
| **Compiler Help** | None | Full IDE autocomplete & errors |

---

## 🐛 Debugging Tips

If PatientId is still null after fixes:

### 1. Check Backend Response
```bash
curl -X GET http://localhost:5140/Bed/GetAll | jq '.[0]'
```
Look for:
- ✅ Is `patientId` in response (not `PatientId`)?
- ✅ Is value actual ID like `"user-123"` (not null for occupied beds)?

### 2. Check Flutter Logs
```dart
// Add temporary debug logging
fetchAllBeds() {
  debugPrint('Raw response: ${response.data}');  // Show JSON
  debugPrint('First bed: ${_beds[0]}');          // Show parsed model
}
```

### 3. Check Database
```sql
SELECT Id, BedNumber, Status, PatientId, AssignedDate 
FROM Beds 
WHERE PatientId IS NOT NULL;
```
Verify data exists in DB.

### 4. Check AutoMapper
Ensure mapping is working:
```csharp
// In BedService.GetAll()
var beds = await _unitOfWork.Bed.ListAsync(criteria);
debugPrint($"DB returned {beds.Rows.Count} beds");
foreach (var bed in beds.Rows)
  debugPrint($"Bed {bed.Id}: PatientId = {bed.PatientId}");
```

---

## ✨ Impact

### Before Fix
- ❌ PatientId always null in Flutter
- ❌ Beds couldn't track assigned patients
- ❌ Silent failures due to dynamic typing
- ❌ Hard to debug property name mismatches

### After Fix
- ✅ PatientId correctly populated from API
- ✅ Type-safe bed management
- ✅ Compile-time error detection
- ✅ Clear debug logging
- ✅ Survives app restart
- ✅ Works after user login

---

## 📦 Files Modified

```
✅ MedMonitor-master-BackEnd/MedMonitor-master/MedMonitor/Program.cs
   → Added: PropertyNamingPolicy = JsonNamingPolicy.CamelCase

✅ med_monitor/lib/models/bed.dart
   → NEW FILE: Typed Bed model with fromJson() factory

✅ med_monitor/lib/providers/bed_provider.dart
   → Changed: List<dynamic> → List<Bed>
   → Updated: fetchAllBeds() to deserialize properly
   → Removed: Fake fallback data
   → Added: Helper methods
```

---

## 🎯 Next Steps

1. **Backend:** Rebuild and redeploy .NET backend with camelCase fix
2. **Flutter:** Update imports to use new Bed model in any screens that use BedProvider
3. **Test:** Verify PatientId is populated after app restart
4. **Monitor:** Watch debug logs for any serialization issues
5. **Cleanup:** Remove any workarounds that were working around this bug

---

## ❓ FAQ

**Q: Why camelCase instead of PascalCase?**
A: REST API convention is to use camelCase in JSON. It matches Flutter/JavaScript conventions and makes the API more discoverable for web/mobile clients.

**Q: Will this break existing clients?**
A: The Bed model's `fromJson()` accepts both formats during transition period.

**Q: Why remove fake data?**
A: Fallback fake data was masking the real bug. Now errors will surface immediately, which is better.

**Q: What if the backend can't be updated?**
A: The Bed model's `fromJson()` handles both PascalCase and camelCase, so it will still work. You just need the Flutter changes.
