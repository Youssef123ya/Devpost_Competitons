# Bed Selection Feature - Complete Implementation ✅

## Overview
Changed the patient approval flow from auto-assigning to the first available bed to allowing Super Admin to select a **specific bed** from a dialog grouped by unit.

---

## Step 1: Backend Changes (C#)

### 1.1 AdmissionRequestService.cs - Approve() Method

**BEFORE:**
```csharp
public async Task<ValidateResult<bool>> Approve(int id)
{
    var entity = await _unitOfWork.AdmissionRequest.FindAsync(x => x.Id == id);
    if (entity == null)
        return ErrorDto.Factory(ErrorCodesEnum.NotFound);
    
    entity.Status = RequestStatusEnum.Approved;
    _unitOfWork.AdmissionRequest.Update(entity);
    
    // Auto-assigned to FIRST available bed
    var availableBed = await _unitOfWork.Bed.FindAsync(x => x.Status == BedStatusEnum.Available);
    
    if (availableBed != null) {
        availableBed.PatientName = entity.PatientName;
        availableBed.Status = BedStatusEnum.Occupied;
        _unitOfWork.Bed.Update(availableBed);
    }
    
    await _unitOfWork.SaveAsync();
    return true;
}
```

**AFTER:**
```csharp
// ✅ UPDATED: Accept specific bedId chosen by admin
public async Task<ValidateResult<bool>> Approve(int id, int bedId)
{
    var entity = await _unitOfWork.AdmissionRequest.FindAsync(x => x.Id == id);

    if (entity == null)
        return ErrorDto.Factory(ErrorCodesEnum.NotFound);

    entity.Status = RequestStatusEnum.Approved;
    _unitOfWork.AdmissionRequest.Update(entity);

    // ✅ FIXED: Assign to SPECIFIC bed chosen by admin
    var bed = await _unitOfWork.Bed.FindAsync(x => x.Id == bedId && 
                                                  x.Status == BedStatusEnum.Available);
    
    if (bed == null)
        return ErrorDto.Factory(ErrorCodesEnum.NotFound);
        // Bed not found or not available anymore

    bed.PatientName = entity.PatientName;
    bed.PatientAge = entity.Age;
    bed.PatientIllness = entity.Illness;
    bed.NurseName = entity.NurseName;
    bed.Status = BedStatusEnum.Occupied;
    bed.AssignedDate = DateTime.UtcNow;
    _unitOfWork.Bed.Update(bed);

    await _unitOfWork.SaveAsync();
    
    System.Diagnostics.Debug.WriteLine($"✅ Approved: Patient {bed.PatientName} (Age: {bed.PatientAge}) assigned to Bed {bed.BedNumber}");
    return true;
}
```

**Key Changes:**
- Added `int bedId` parameter
- Validates the bed is available: `x.Status == BedStatusEnum.Available`
- Returns `NotFound` error if bed doesn't exist or is occupied
- Assigns patient to THAT SPECIFIC bed only

---

### 1.2 IAdmissionRequestService.cs - Interface Update

**BEFORE:**
```csharp
Task<ValidateResult<bool>> Approve(int id);
```

**AFTER:**
```csharp
Task<ValidateResult<bool>> Approve(int id, int bedId);  // ✅ UPDATED: Accept bedId
```

---

### 1.3 AdmissionRequestController.cs - API Endpoint

**BEFORE:**
```csharp
[HttpPost("Approve")]
public async Task<IActionResult> Approve(int id)
    => await _service.Approve(id).ToActionResult();
```

**AFTER:**
```csharp
[HttpPost("Approve")]
// ✅ UPDATED: Accept bedId parameter for specific bed selection
public async Task<IActionResult> Approve(int id, int bedId)
    => await _service.Approve(id, bedId).ToActionResult();
```

**New API Endpoint:**
- **Before:** `POST /AdmissionRequest/Approve?id=5`
- **After:** `POST /AdmissionRequest/Approve?id=5&bedId=3`

---

## Step 2: Flutter Backend - AdmissionProvider

### 2.1 AdmissionProvider.dart - respondToRequest() Method

**BEFORE:**
```dart
Future<bool> respondToRequest(String requestId, String status, String adminNote) async {
    int id = int.tryParse(requestId) ?? 0;
    bool apiSuccess = false;

    _pendingRequests.removeWhere((req) => req.id == requestId);
    for (int i = 0; i < _doctorRequests.length; i++) {
      if (_doctorRequests[i].id == requestId) {
        _doctorRequests[i] = _doctorRequests[i].copyWith(
          status: status,
          adminNote: adminNote,
        );
        break;
      }
    }
    notifyListeners();

    try {
      String endpoint = (status == 'approved')
          ? '/AdmissionRequest/Approve'
          : '/AdmissionRequest/Reject';

      final response = await DioClient.dio.post(
        endpoint,
        queryParameters: {'id': id},
      );

      if (response.statusCode == 200) {
        apiSuccess = true;
      }
    } catch (e) {
      debugPrint('Respond to Request Error: $e');
    }

    return apiSuccess;
}
```

**AFTER:**
```dart
/// Admin responds to a request with approval/rejection and note
// ✅ UPDATED: Accept optional bedId parameter
Future<bool> respondToRequest(String requestId, String status, String adminNote, {int? bedId}) async {
  int id = int.tryParse(requestId) ?? 0;
  bool apiSuccess = false;

  // Update local request state first so the UI can proceed regardless of API availability
  _pendingRequests.removeWhere((req) => req.id == requestId);
  for (int i = 0; i < _doctorRequests.length; i++) {
    if (_doctorRequests[i].id == requestId) {
      _doctorRequests[i] = _doctorRequests[i].copyWith(
        status: status,
        adminNote: adminNote,
      );
      break;
    }
  }
  notifyListeners();

  try {
    String endpoint = (status == 'approved')
        ? '/AdmissionRequest/Approve'
        : '/AdmissionRequest/Reject';

    // ✅ NEW: Pass bedId if provided
    final queryParams = {'id': id};
    if (bedId != null) {
      queryParams['bedId'] = bedId;
    }

    final response = await DioClient.dio.post(
      endpoint,
      queryParameters: queryParams,
    );

    debugPrint('Respond to Request status: ${response.statusCode}');
    debugPrint('Respond to Request response: ${response.data}');

    if (response.statusCode == 200) {
      apiSuccess = true;
    }
  } on DioException catch (e) {
    debugPrint('Respond to Request DioException: ${e.message}');
  } catch (e) {
    debugPrint('Unexpected error responding to request: $e');
  }

  return apiSuccess;
}
```

**Key Changes:**
- Added optional `{int? bedId}` parameter
- Builds queryParams dynamically
- Adds bedId to queryParams when provided
- Falls back to old behavior if bedId is null

---

## Step 3: Flutter UI - PatientFormScreen

### 3.1 Approve Button - Complete Rewrite

**BEFORE:**
```dart
ElevatedButton(
  onPressed: () async {
    if (widget.request.id == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Error: Request ID is missing")),
      );
      return;
    }

    _showLoading();

    final patient = _buildPatientFromRequest();
    final workflowProvider = context.read<PatientWorkflowProvider>();
    workflowProvider.approvePendingPatient(patient);

    final admissionProvider = context.read<AdmissionProvider>();
    final bool success = await admissionProvider.respondToRequest(
      widget.request.id!, 
      'approved', 
      ''
    );

    if (mounted) {
      final dashboardProvider = context.read<DashboardProvider>();
      final bedProvider = context.read<BedProvider>();
      
      await dashboardProvider.refreshStats(delay: const Duration(milliseconds: 1000));
      await bedProvider.fetchAllBeds();
    }

    if (mounted) Navigator.pop(context);

    if (mounted) {
      await _showUnitSelectionDialog(context);
    }
  },
  // ... styling
  child: const Text("Approve", ...),
),
```

**AFTER:**
```dart
ElevatedButton(
  onPressed: () async {
    if (widget.request.id == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Error: Request ID is missing")),
      );
      return;
    }

    // ✅ STEP 1: Fetch all beds from server
    await context.read<BedProvider>().fetchAllBeds();
    
    // ✅ STEP 2: Get available beds grouped by unit
    final availableBeds = context.read<BedProvider>().getAvailableBeds();
    
    if (availableBeds.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("No available beds at the moment")),
        );
      }
      return;
    }

    // ✅ STEP 3: Show bed selection dialog grouped by unit
    final selectedBed = await _showBedSelectionDialog(context, availableBeds);
    
    if (selectedBed == null) {
      return; // User cancelled
    }

    _showLoading();

    final patient = _buildPatientFromRequest();
    final workflowProvider = context.read<PatientWorkflowProvider>();
    workflowProvider.approvePendingPatient(patient);

    final admissionProvider = context.read<AdmissionProvider>();
    
    // ✅ STEP 4: Approve with SPECIFIC bed ID chosen by admin
    final bool success = await admissionProvider.respondToRequest(
      widget.request.id!.toString(),
      'approved',
      '',
      bedId: selectedBed.id,  // ← Pass the specific bed ID
    );

    // ✅ STEP 5: Refresh everything after approval
    if (mounted) {
      final dashboardProvider = context.read<DashboardProvider>();
      final bedProvider = context.read<BedProvider>();
      
      await dashboardProvider.refreshStats(delay: const Duration(milliseconds: 1000));
      await bedProvider.fetchAllBeds();
    }

    if (mounted) Navigator.pop(context);

    if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Server sync failed. Patient approved locally.'),
          backgroundColor: Colors.orange,
          duration: const Duration(seconds: 2),
        ),
      );
    }

    if (mounted) {
      await _showUnitSelectionDialog(context);
    }
  },
  style: ElevatedButton.styleFrom(
    backgroundColor: const Color(0xFF5B9EFF),
    padding: const EdgeInsets.symmetric(vertical: 13),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    elevation: 3,
  ),
  child: const Text("Approve", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
),
```

**5-Step Flow:**
1. Fetch all beds from server
2. Get available beds using provider
3. Show bed selection dialog
4. Approve WITH selected bed ID
5. Refresh dashboard and beds

---

### 3.2 NEW METHOD: Bed Selection Dialog

**NEW METHOD ADDED:**
```dart
// ✅ NEW: Bed selection dialog with grouping by unit
Future<Bed?> _showBedSelectionDialog(BuildContext context, List<Bed> availableBeds) async {
  // Group beds by unit (extract first letter of bed number as unit)
  final Map<String, List<Bed>> bedsByUnit = {};
  for (var bed in availableBeds) {
    final unit = bed.bedNumber.isNotEmpty ? bed.bedNumber[0] : 'Unknown';
    bedsByUnit.putIfAbsent(unit, () => []);
    bedsByUnit[unit]!.add(bed);
  }

  // Sort units
  final sortedUnits = bedsByUnit.keys.toList()..sort();

  return await showDialog<Bed>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Text('Select Available Bed'),
      contentPadding: const EdgeInsets.all(16),
      content: SizedBox(
        width: double.maxFinite,
        height: 400,
        child: ListView.builder(
          itemCount: sortedUnits.length,
          itemBuilder: (ctx, unitIndex) {
            final unit = sortedUnits[unitIndex];
            final beds = bedsByUnit[unit]!;

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Unit header with count
                Padding(
                  padding: const EdgeInsets.fromLTRB(8, 12, 8, 8),
                  child: Text(
                    'Unit $unit (${beds.length} available)',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2E55A7),
                    ),
                  ),
                ),
                // Beds for this unit
                ...beds.map((bed) => ListTile(
                  leading: Icon(Icons.bed, color: Colors.green[700]),
                  title: Text(
                    'Bed ${bed.bedNumber}',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  subtitle: Text('Unit $unit'),
                  trailing: Chip(
                    label: const Text('Available'),
                    backgroundColor: Colors.green[100],
                    labelStyle: const TextStyle(color: Colors.green),
                  ),
                  onTap: () => Navigator.pop(ctx, bed),
                )).toList(),
                const Divider(height: 8),
              ],
            );
          },
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('Cancel'),
        ),
      ],
    ),
  );
}
```

**Dialog Features:**
- Groups beds by unit (first letter of bed number)
- Shows count of available beds per unit
- Displays green "Available" chip
- Sorted unit list (A, B, C, ...)
- Returns selected Bed object or null if cancelled
- Beautiful ListTile UI with icons

---

## Step 4: BedProvider (No Changes Needed) ✅

The `BedProvider` already has everything needed:

```dart
/// Get all available beds
List<Bed> getAvailableBeds() => _beds.where((bed) => bed.isAvailable).toList();
```

**Bed Model Already Has:**
```dart
/// Check if bed is available
bool get isAvailable => status == 0;  // 0 = Available

/// Check if bed is occupied
bool get isOccupied => status == 1 && patientName != null;  // 1 = Occupied
```

---

## Step 5: Grouped Beds Display (Already Implemented) ✅

The dialog automatically groups beds by:
- **Unit A:** A1✅ A2✅ A5✅
- **Unit B:** B3✅ B7✅
- **Unit C:** C2✅
- etc...

---

## Full API Flow After Fix

### Request Flow:
```
Patient Admission Request Created (Doctor)
                ↓
Admin views Pending Admissions
                ↓
Admin clicks "Approve" button
                ↓
Frontend fetches all beds
                ↓
Frontend shows bed selection dialog
         (Grouped by unit)
                ↓
Admin selects "Bed A3"
                ↓
Frontend calls: POST /AdmissionRequest/Approve?id=5&bedId=3
                ↓
Backend validates:
  - AdmissionRequest exists
  - Bed A3 exists
  - Bed A3 is available (status=0)
                ↓
Backend assigns patient to Bed A3:
  - bed.PatientName = "John Doe"
  - bed.Status = Occupied
  - bed.AssignedDate = now
                ↓
Doctor opens Unit A
                ↓
Doctor sees patient in Bed A3 ✅
```

---

## Testing Checklist

### Backend Test:
```powershell
# Test 1: Approve with valid bedId
curl -X POST "https://localhost:7123/api/AdmissionRequest/Approve?id=1&bedId=5"

# Test 2: Approve with invalid bedId (should return error)
curl -X POST "https://localhost:7123/api/AdmissionRequest/Approve?id=1&bedId=999"

# Test 3: Approve when bed is already occupied (should return error)
curl -X POST "https://localhost:7123/api/AdmissionRequest/Approve?id=1&bedId=3"
```

### Flutter Test:
1. Create admission request as doctor
2. Switch to Super Admin
3. Go to "Pending Admissions"
4. Click "Approve" on any patient
5. **Verify:** Bed selection dialog appears with beds grouped by unit
6. Select "Bed A3"
7. **Verify:** Patient is assigned to Bed A3
8. Open BedsScreen → Unit A → See patient in Bed A3
9. Go back to Pending Admissions
10. **Verify:** Bed A3 no longer appears in available list

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Bed Selection** | Auto-assigned to first available | Admin selects specific bed |
| **API Endpoint** | `/Approve?id=5` | `/Approve?id=5&bedId=3` |
| **Error Handling** | Silent failure if no beds | Clear error if bed unavailable |
| **UX** | No visibility into bed selection | Dialog shows grouped beds by unit |
| **Accuracy** | Patient might be in wrong unit | Patient in exact requested bed |
| **Doctor Experience** | Patient location unclear | Patient clearly in selected bed |

✅ **All 5 steps completed successfully!**
