# 🔍 DEBUGGING GUIDE - Trace the Bug in Real Time

## HOW TO SEE THE BUG HAPPEN

### Step 1: Database Before Approval
```sql
-- Check Beds before approval
SELECT Id, BedNumber, Status, PatientId FROM Beds WHERE Status = 0;

Result:
Id  | BedNumber | Status | PatientId
----|-----------|--------|----------
1   | A101      | 0      | NULL
2   | A102      | 0      | NULL
```

### Step 2: Create AdmissionRequest
```csharp
// Call the API with these values:
POST /AdmissionRequest/Create
{
  "patientName": "Ahmed Ali",
  "age": 35,
  "gender": "Male",
  "weight": 75,
  "height": 180,
  "illness": "COVID-19",
  "companionPhone": "+966501234567",
  "nurseName": "Fatima",
  "medicalHistory": "Hypertension",
  "diagnosis": "Suspected COVID"
  // ❌ NO PatientId provided!
}

// Response:
{
  "id": 5,  // ← AdmissionRequest ID = 5
  "patientName": "Ahmed Ali",
  "patientId": null,  // ← NULL! No user ID provided
  "status": "Pending"
}
```

### Step 3: Database - AdmissionRequest Created
```sql
SELECT Id, PatientId, PatientName, Status FROM AdmissionRequests 
WHERE Id = 5;

Result:
Id | PatientId | PatientName | Status
----|-----------|-------------|--------
5  | NULL      | Ahmed Ali   | Pending
```

### Step 4: Approve the Request
```csharp
// Super Admin clicks Approve
POST /AdmissionRequest/Approve/5

// Server executes:
var entity = await _unitOfWork.AdmissionRequest.FindAsync(x => x.Id == 5);
// entity.Id = 5
// entity.PatientId = null  ← NULL!

entity.Status = RequestStatusEnum.Approved;

var availableBed = await _unitOfWork.Bed.FindAsync(x => x.Status == BedStatusEnum.Available);
// availableBed = Bed with Id=1, BedNumber="A101"

// ❌ THE BUG HAPPENS HERE:
availableBed.PatientId = entity.PatientId ?? entity.Id.ToString();
//                         null              ?? "5".ToString()
//                         = "5"  ← WRONG! This is NOT a user ID!

availableBed.Status = BedStatusEnum.Occupied;
availableBed.AssignedDate = DateTime.UtcNow;

_unitOfWork.Bed.Update(availableBed);
await _unitOfWork.SaveAsync();
```

### Step 5: Database After Approval
```sql
SELECT Id, BedNumber, Status, PatientId FROM Beds WHERE Id = 1;

Result:
Id | BedNumber | Status | PatientId
----|-----------|--------|----------
1  | A101      | 1      | "5"  ← ❌ WRONG! Should be a User ID!

-- What's in AspNetUsers table?
SELECT Id FROM AspNetUsers WHERE Id = '5';
Result: (empty - no user with ID "5")

-- Real user IDs look like:
SELECT Id FROM AspNetUsers;
Result:
Id (examples)
550e8400-e29b-41d4-a716-446655440000
6a0b5d8c-7e4f-41a3-9d8c-2f5e1a9c8d7b
```

### Step 6: API Response
```csharp
// GET /Bed/GetAll
GET /Bed/GetAll

// Server does:
var criteria = new ListCriteriaDto<Bed>()
    .AddNewInclude(RelatedObjectEnum.User);  // Include patient data

var beds = await _unitOfWork.Bed.ListAsync(criteria);
// beds[0].PatientId = "5"
// beds[0].Patient = ???

// Try to find user with ID "5"
var patient = _dbContext.Users.FirstOrDefault(u => u.Id == "5");
// Result: null (no user with ID "5")

// AutoMapper tries to map:
bedDto.Patient = _mapper.Map<UserDto>(null);  // = null

// Response:
[
  {
    "id": 1,
    "bedNumber": "A101",
    "status": 1,
    "patientId": "5",  // ← Invalid ID
    "patient": null,   // ← NULL because user "5" doesn't exist
    "assignedDate": "2026-06-03T10:30:00Z"
  }
]
```

### Step 7: Flutter Receives null
```dart
// BedProvider.fetchAllBeds()
final response = await _dio.get('/Bed/GetAll');

// response.data[0]:
{
  "id": 1,
  "bedNumber": "A101",
  "status": 1,
  "patientId": "5",
  "patient": null,  // ❌ NULL!
  "assignedDate": "2026-06-03T10:30:00Z"
}

// Maps to Bed object:
Bed(
  id: 1,
  bedNumber: "A101",
  status: 1,
  patientId: "5",
  patient: null,  // ❌ NO PATIENT DATA
)

// Debug print:
debugPrint('Bed ${bed.bedNumber}: Status=${bed.status}, PatientId=${bed.patientId}');
// Output: "Bed A101: Status=1, PatientId=5"
// ✅ PatientId shows but patient is null!
```

### Step 8: UI Shows Nothing
```dart
// In BedsMonitoringScreenEnhanced
if (bed.isOccupied && bed.patientId != null) {
  // Build card with patient info
  Text(bed.patient?.fullName ?? 'Unknown')  // ← bed.patient is NULL!
  // Shows: "Unknown" ❌
}
```

---

## HOW THE FIX WORKS

### Fixed Step 4: Approve with Correct PatientId

```csharp
// Get the admission request
var entity = await _unitOfWork.AdmissionRequest.FindAsync(x => x.Id == 5);

// ✅ FIX: Ensure PatientId is set to a REAL user ID
if (string.IsNullOrEmpty(entity.PatientId))
{
    // Try to find the user by email or other identifier
    // Assuming patients have user accounts created beforehand
    var user = await _unitOfWork.User.FindAsync(x => 
        x.Email == "ahmed.ali@hospital.com");
    
    if (user != null)
    {
        entity.PatientId = user.Id;
        // Now entity.PatientId = "550e8400-e29b-41d4-a716-446655440000"
    }
}

entity.Status = RequestStatusEnum.Approved;
_unitOfWork.AdmissionRequest.Update(entity);

// ✅ NOW save with CORRECT user ID
var availableBed = await _unitOfWork.Bed.FindAsync(x => x.Status == BedStatusEnum.Available);

if (availableBed != null)
{
    // ✅ This is now a REAL user ID
    availableBed.PatientId = entity.PatientId;  // "550e8400-..."
    availableBed.Status = BedStatusEnum.Occupied;
    availableBed.AssignedDate = DateTime.UtcNow;
    
    _unitOfWork.Bed.Update(availableBed);
}

await _unitOfWork.SaveAsync();
```

### Fixed Step 5: Database After Approval
```sql
SELECT Id, BedNumber, Status, PatientId FROM Beds WHERE Id = 1;

Result:
Id | BedNumber | Status | PatientId
----|-----------|--------|-----------------------------------
1  | A101      | 1      | "550e8400-e29b-41d4-a716-446655440000"  ✅ CORRECT!

-- Check that user exists:
SELECT Id, FullName, Email FROM AspNetUsers 
WHERE Id = '550e8400-e29b-41d4-a716-446655440000';

Result:
Id                                  | FullName   | Email
------------------------------------|------------|---------------------------
550e8400-e29b-41d4-a716-446655440000 | Ahmed Ali | ahmed.ali@hospital.com ✅
```

### Fixed Step 6: API Response
```
GET /Bed/GetAll

[
  {
    "id": 1,
    "bedNumber": "A101",
    "status": 1,
    "patientId": "550e8400-e29b-41d4-a716-446655440000",  ✅ REAL ID
    "patient": {  ✅ NOW POPULATED!
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "fullName": "Ahmed Ali",
      "email": "ahmed.ali@hospital.com",
      "phoneNumber": "+966501234567",
      "isActive": true,
      "gender": 1,
      "dateOfBirth": "1990-05-15T00:00:00Z"
    },
    "assignedDate": "2026-06-03T10:30:00Z"
  }
]
```

### Fixed Step 7: Flutter Receives Data
```dart
Bed(
  id: 1,
  bedNumber: "A101",
  status: 1,
  patientId: "550e8400-e29b-41d4-a716-446655440000",
  patient: User(
    id: "550e8400-e29b-41d4-a716-446655440000",
    fullName: "Ahmed Ali",
    email: "ahmed.ali@hospital.com",
  ),  ✅ NOW HAS PATIENT!
)

// Debug print:
debugPrint('Bed ${bed.bedNumber}: Status=${bed.status}, PatientId=${bed.patientId}');
// Output: "Bed A101: Status=1, PatientId=550e8400-e29b-41d4-a716-446655440000" ✅
```

### Fixed Step 8: UI Shows Patient
```dart
if (bed.isOccupied && bed.patientId != null) {
  Text(bed.patient?.fullName ?? 'Unknown')
  // Shows: "Ahmed Ali" ✅
}
```

---

## 🔎 HOW TO VERIFY IN YOUR SYSTEM

### Test in SQL Server
```sql
-- 1. Check what PatientId values are currently in Beds
SELECT Id, BedNumber, PatientId FROM Beds WHERE PatientId IS NOT NULL;

-- 2. For each PatientId, check if it's a valid user
SELECT Id, BedNumber, PatientId FROM Beds b
LEFT JOIN AspNetUsers u ON b.PatientId = u.Id
WHERE b.PatientId IS NOT NULL
AND u.Id IS NULL;  -- These are INVALID PatientIds!

-- Expected: Should return 0 rows after fix
-- Current: Probably returns rows with PatientId like "1", "2", "3", etc.
```

### Test in API
```bash
curl http://localhost:5140/Bed/GetAll -H "Authorization: Bearer YOUR_TOKEN"

# Look for:
# ✅ patientId has UUID format (not number)
# ✅ patient object is NOT null
# ✅ patient.fullName is populated
```

### Test in Flutter Console
```
// Run Flutter app
flutter run

// Look for debug prints:
✅ Bed A101: Status=1, PatientId=550e8400-e29b-41d4-a716-446655440000
✅ Successfully loaded 10 beds

// Open bed card - should show patient name, not "Unknown"
```

---

## ⚠️ KEY INSIGHT

The system currently works like this:

```
AdmissionRequest (name-based)
    ↓ (no user link)
Bed.PatientId = AdmissionRequest.Id (WRONG!)
    ↓
Invalid user ID in database
    ↓
User lookup fails
    ↓
No patient data in API
    ↓
UI shows nothing
```

**It should work like:**

```
AdmissionRequest (has PatientId)
    ↓ (linked to real user)
Bed.PatientId = User.Id (CORRECT!)
    ↓
Valid user ID in database
    ↓
User lookup succeeds
    ↓
Patient data in API
    ↓
UI shows patient name
```

The fix is ensuring that AdmissionRequest.PatientId is set to a real User.Id before approval.
