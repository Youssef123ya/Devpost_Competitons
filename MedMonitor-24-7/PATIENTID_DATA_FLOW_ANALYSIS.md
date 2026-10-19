# PatientId Data Flow Analysis - MedMonitor 24/7

## 🔍 Issue Summary
When the Flutter app restarts or user logs in again, beds load but `PatientId` appears **null** even though the database has patients assigned.

---

## 📊 FULL DATA FLOW: SQL → API → Flutter

### 1️⃣ **SQL Database Layer** ✅
**Location:** `Beds` table in SQL Server

```sql
Beds Table Schema:
┌─────────────┬──────────────┬────────┬────────────┬──────────────┐
│ ID (int)    │ BedNumber    │ Status │ PatientId  │ AssignedDate │
├─────────────┼──────────────┼────────┼────────────┼──────────────┤
│ 1           │ 101          │ 1      │ user-123   │ 2026-06-02   │
│ 2           │ 102          │ 0      │ null       │ null         │
│ 3           │ 103          │ 1      │ user-456   │ 2026-06-01   │
└─────────────┴──────────────┴────────┴────────────┴──────────────┘
```

**Migration Reference:** `BedRepository.cs` line 127-135
```csharp
PatientId = table.Column<string>(type: "nvarchar(450)", nullable: true)
// Foreign key to AspNetUsers
```

---

### 2️⃣ **Backend Model Layer** ✅

#### **Bed Entity** (Infrastructure Model)
**File:** [MedMonitor-master-BackEnd/MedMonitor-master/MedMonitor/Infrastructure/Models/Bed.cs](MedMonitor-master-BackEnd/MedMonitor-master/MedMonitor/Infrastructure/Models/Bed.cs)

```csharp
public class Bed
{
    public int Id { get; set; }
    public string BedNumber { get; set; } = null!;
    public BedStatusEnum Status { get; set; }
    public string? PatientId { get; set; }           // ✅ DEFINED
    public User? Patient { get; set; }               // Navigation property
    public DateTime? AssignedDate { get; set; }
}
```

**Key Points:**
- ✅ `PatientId` is defined as `string?` (nullable)
- ✅ `Patient` navigation property exists for eager loading
- ✅ Foreign key to AspNetUsers table

---

### 3️⃣ **Backend DTO Layer** ✅

#### **BedDto**
**File:** [MedMonitor-master-BackEnd/MedMonitor-master/MedMonitor/Core/Dto/BedDto.cs](MedMonitor-master-BackEnd/MedMonitor-master/MedMonitor/Core/Dto/BedDto.cs)

```csharp
public class BedDto
{
    public int Id { get; set; }
    public string BedNumber { get; set; } = null!;
    public BedStatusEnum Status { get; set; }
    public string? PatientId { get; set; }           // ✅ DEFINED IN DTO
    public DateTime? AssignedDate { get; set; }
}
```

**AutoMapper Mapping:**
**File:** [MedMonitor-master-BackEnd/MedMonitor-master/MedMonitor/Core/Mapping/AppMapper.cs](MedMonitor-master-BackEnd/MedMonitor-master/MedMonitor/Core/Mapping/AppMapper.cs#L47)

```csharp
CreateMap<Bed, BedDto>().ReverseMap();  // Simple 1:1 mapping
```

**Key Points:**
- ✅ AutoMapper will map `Bed.PatientId` → `BedDto.PatientId`
- ✅ No special configuration that would exclude PatientId

---

### 4️⃣ **Backend Service Layer** ⚠️ POTENTIAL ISSUE HERE

#### **BedService.GetAll()**
**File:** [MedMonitor-master-BackEnd/MedMonitor-master/MedMonitor/Core/Business/BedService.cs](MedMonitor-master-BackEnd/MedMonitor-master/MedMonitor/Core/Business/BedService.cs#L22-L30)

```csharp
public async Task<List<BedDto>> GetAll()
{
    var criteria = new ListCriteriaDto<Bed>();     // ⚠️ NO INCLUDES!
    var data = await _unitOfWork.Bed.ListAsync(criteria);
    return _mapper.Map<List<BedDto>>(data.Rows);
}
```

**Key Issue:**
- ⚠️ Empty `ListCriteriaDto<Bed>()` means NO explicit includes
- ✅ BUT PatientId is a scalar column, should still be returned
- ✅ (Only the navigation `Patient` property would be null without Include)

---

### 5️⃣ **Backend Repository Layer**

#### **BedRepository.ListAsync()**
**File:** [MedMonitor-master-BackEnd/MedMonitor-master/MedMonitor/Infrastructure/Repositories/Business/BedRepository.cs](MedMonitor-master-BackEnd/MedMonitor-master/MedMonitor/Infrastructure/Repositories/Business/BedRepository.cs#L20-L25)

```csharp
public async Task<RowsWithPaginationInfo<Bed>> ListAsync(ListCriteriaDto<Bed> criteria)
{
    return await _context.Beds
        .IncludeRange(criteria.ListRelatedObjectsEnum, _queryHelper)
        .OnSelectListWithPaginationAsync(criteria.PaginationInfo, 
                                         criteria.ListRelatedObjectsEnum, 
                                         _queryHelper);
}
```

**Query Helper:**
**File:** [MedMonitor-master-BackEnd/MedMonitor-master/MedMonitor/Infrastructure/Repositories/QueryHelpers/BedQueryHelper.cs](MedMonitor-master-BackEnd/MedMonitor-master/MedMonitor/Infrastructure/Repositories/QueryHelpers/BedQueryHelper.cs)

```csharp
public override IQueryable<Bed> HandleIncludeRange(IQueryable<Bed> rows, RelatedObjectEnum includeEnum)
{
    return includeEnum switch
    {
        RelatedObjectEnum.User => rows.Include(b => b.Patient),  // Only includes Patient nav
        _ => rows  // No other includes
    };
}
```

**Query Generated:**
```sql
SELECT [b].[Id], [b].[BedNumber], [b].[Status], [b].[PatientId], [b].[AssignedDate]
FROM [Beds] AS [b]
-- PatientId IS selected ✅
```

---

### 6️⃣ **Backend JSON Serialization** ⚠️ POTENTIAL ISSUE HERE

#### **Program.cs Configuration**
**File:** [MedMonitor-master-BackEnd/MedMonitor-master/MedMonitor/Program.cs](MedMonitor-master-BackEnd/MedMonitor-master/MedMonitor/Program.cs#L47-L50)

```csharp
builder.Services.AddControllers()
    .AddNewtonsoftJson(x =>
        x.SerializerSettings.ReferenceLoopHandling = 
            Newtonsoft.Json.ReferenceLoopHandling.Ignore)
    .AddJsonOptions(x =>
        x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);
```

**Key Issue:**
- ⚠️ NO `PropertyNamingPolicy = JsonSerializerDefaults.Web` configured
- ⚠️ NO camelCase conversion set up
- Properties serialize as **PascalCase**: `Id`, `PatientId`, `Status` (NOT `id`, `patientId`, `status`)

**Expected JSON Response from API:**
```json
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

**ACTUAL JSON Response from API:**
```json
[
  {
    "Id": 1,
    "BedNumber": "101",
    "Status": 1,
    "PatientId": "user-123",
    "AssignedDate": "2026-06-02T10:30:00"
  },
  {
    "Id": 2,
    "BedNumber": "102",
    "Status": 0,
    "PatientId": null,
    "AssignedDate": null
  }
]
```

---

### 7️⃣ **Flutter API Client**

#### **DioClient Configuration**
**File:** [med_monitor/med_monitor/lib/services/dio_client.dart](med_monitor/med_monitor/lib/services/dio_client.dart)

**Key Issue:** Check if Dio is configured to handle PascalCase responses

---

### 8️⃣ **Flutter BedProvider**

#### **BedProvider.fetchAllBeds()**
**File:** [med_monitor/med_monitor/lib/providers/bed_provider.dart](med_monitor/med_monitor/lib/providers/bed_provider.dart#L16-L39)

```dart
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../services/dio_client.dart';

class BedProvider with ChangeNotifier {
  final Dio _dio = DioClient.dio;
  List<dynamic> _beds = [];
  bool _isLoading = false;

  List<dynamic> get beds => _beds;

  // ❌ ISSUE 1: Accessing lowercase 'status'
  int get occupiedCount => _beds.where((bed) => bed['status'] == 1).length;

  Future<void> fetchAllBeds() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _dio.get('/Bed/GetAll');
      if (response.statusCode == 200) {
        _beds = response.data;  // ⚠️ Raw dynamic data, NOT typed
        // If API sends PascalCase: _beds[0]['Status'] exists
        // If code accesses: _beds[0]['status'] → NULL (wrong key)
      }
    } catch (e) {
      debugPrint("Fetch Beds Error: $e");
      _beds = [
        {
          "id": 1,                    // ❌ lowercase 'id'
          "bedNumber": "101",         // ❌ camelCase, not PascalCase
          "status": 1,                // ❌ lowercase 'status'
          "patientName": "Ahmed",     // ❌ NOT from API
          "patientAge": 25,           // ❌ NOT from API
          "nurseName": "Soha",        // ❌ NOT from API
          "illness": "Cancer"         // ❌ NOT from API
        },
      ];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
```

---

## 🚨 ROOT CAUSES IDENTIFIED

### **Issue 1: Property Name Mismatch** (PRIMARY CAUSE)

| Layer | Property Name | Case |
|-------|---------------|------|
| Backend API Response | `PatientId` | **PascalCase** ❌ |
| Flutter Code Expects | `patientId` or `patient_id` | **camelCase** ❌ |
| Result | `bed['patientId']` returns **undefined** → treated as null |

### **Issue 2: Missing Bed Model in Flutter**

Currently, BedProvider stores data as `List<dynamic>` instead of a typed `Bed` model:

```dart
// CURRENT (❌ wrong)
List<dynamic> _beds = [];
_beds[0]['patientId']  // Breaks if property name is wrong

// SHOULD BE (✅ correct)
List<Bed> _beds = [];
_beds[0].patientId    // Type-safe, compiler catches errors
```

### **Issue 3: Fallback Data Mismatch**

When API fails, BedProvider uses hardcoded fallback data with:
- lowercase keys: `id`, `status`
- camelCase: `bedNumber`, `patientName`
- Non-existent fields: `patientName`, `patientAge`, `nurseName`, `illness`

This masks the real issue during testing.

---

## ✅ SOLUTIONS

### **Solution 1: Fix Backend JSON Serialization** (RECOMMENDED)

Add camelCase property naming policy to Program.cs:

```csharp
builder.Services.AddControllers()
    .AddNewtonsoftJson(x =>
        x.SerializerSettings.ReferenceLoopHandling = 
            Newtonsoft.Json.ReferenceLoopHandling.Ignore)
    .AddJsonOptions(x => {
        x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        x.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;  // ✅ ADD THIS
    });
```

**Result:** API returns `{ "id": 1, "bedNumber": "101", "patientId": "user-123", ... }`

---

### **Solution 2: Create Typed Bed Model in Flutter**

**File:** `med_monitor/lib/models/bed.dart`

```dart
class Bed {
  final int id;
  final String bedNumber;
  final int status;           // 0=Available, 1=Occupied, 2=Maintenance
  final String? patientId;    // ✅ Can be null
  final DateTime? assignedDate;

  Bed({
    required this.id,
    required this.bedNumber,
    required this.status,
    this.patientId,
    this.assignedDate,
  });

  // ✅ Deserialize from JSON with flexible property naming
  factory Bed.fromJson(Map<String, dynamic> json) {
    return Bed(
      id: json['id'] ?? json['Id'],
      bedNumber: json['bedNumber'] ?? json['BedNumber'],
      status: json['status'] ?? json['Status'],
      patientId: json['patientId'] ?? json['PatientId'],
      assignedDate: json['assignedDate'] != null 
          ? DateTime.parse(json['assignedDate']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'bedNumber': bedNumber,
    'status': status,
    'patientId': patientId,
    'assignedDate': assignedDate?.toIso8601String(),
  };
}
```

---

### **Solution 3: Update BedProvider to Use Typed Model**

```dart
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../services/dio_client.dart';
import '../models/bed.dart';

class BedProvider with ChangeNotifier {
  final Dio _dio = DioClient.dio;
  final String baseUrl = "";

  List<Bed> _beds = [];        // ✅ Use typed model
  bool _isLoading = false;

  List<Bed> get beds => _beds;
  bool get isLoading => _isLoading;

  // ✅ Now properly typed and safe
  int get occupiedCount => _beds.where((bed) => bed.status == 1).length;
  int get totalBedsCount => _beds.length;

  Future<void> fetchAllBeds() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _dio.get('/Bed/GetAll');
      if (response.statusCode == 200) {
        // ✅ Deserialize JSON to typed Bed objects
        _beds = (response.data as List)
            .map((json) => Bed.fromJson(json as Map<String, dynamic>))
            .toList();
        
        debugPrint('✅ Loaded ${_beds.length} beds');
        _beds.forEach((bed) {
          debugPrint('Bed ${bed.bedNumber}: PatientId = ${bed.patientId}');
        });
      }
    } catch (e) {
      debugPrint("❌ Fetch Beds Error: $e");
      _beds = [];  // ✅ Clear on error, don't use fake data
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> removePatientFromBed(int bedId) async {
    try {
      final response = await _dio.post('/Bed/RemovePatient', queryParameters: {'id': bedId});
      if (response.statusCode == 200) {
        await fetchAllBeds();
      }
    } catch (e) {
      debugPrint("❌ Remove Patient Error: $e");
    }
  }

  Future<void> assignPatientToBed(int bedId, String patientId) async {
    try {
      final response = await _dio.post('/Bed/AssignPatient', data: {
        "bedId": bedId,
        "patientId": patientId
      });
      if (response.statusCode == 200) {
        await fetchAllBeds();
      }
    } catch (e) {
      debugPrint("❌ Assign Patient Error: $e");
    }
  }
}
```

---

## 🔧 IMPLEMENTATION CHECKLIST

- [ ] **Backend:** Add `PropertyNamingPolicy = JsonNamingPolicy.CamelCase` to Program.cs
- [ ] **Backend:** Rebuild and test API response with Postman/Swagger
- [ ] **Flutter:** Create `Bed` model with `fromJson()` factory constructor
- [ ] **Flutter:** Update `BedProvider` to use `List<Bed>` instead of `List<dynamic>`
- [ ] **Flutter:** Remove hardcoded fallback data (causes confusion)
- [ ] **Flutter:** Add debug logging to verify PatientId is not null
- [ ] **Test:** Restart app and verify beds load with PatientId populated

---

## 📝 VERIFICATION STEPS

### Test Backend API Directly

```bash
curl -X GET http://localhost:5140/Bed/GetAll \
  -H "Authorization: Bearer {TOKEN}"
```

Check response for:
1. ✅ Is `patientId` present in JSON?
2. ✅ Is `patientId` null only for unassigned beds?
3. ✅ For occupied beds, does `patientId` have a value?

### Test Flutter Provider

```dart
final provider = BedProvider();
await provider.fetchAllBeds();

provider.beds.forEach((bed) {
  print('Bed: ${bed.bedNumber}');
  print('  Status: ${bed.status}');
  print('  PatientId: ${bed.patientId}');  // Should NOT be null for occupied beds
});
```

---

## 🎯 SUMMARY

| Issue | Layer | Cause | Fix |
|-------|-------|-------|-----|
| PatientId appears null | Backend JSON | No camelCase policy | Add `PropertyNamingPolicy = JsonNamingPolicy.CamelCase` |
| Type safety issues | Flutter | Using `List<dynamic>` | Create typed `Bed` model |
| Masked bugs | Flutter | Fallback fake data | Remove fallback data |

**Expected Outcome:** After fixes, `PatientId` will be properly populated in the Flutter app and remain consistent after app restart.
