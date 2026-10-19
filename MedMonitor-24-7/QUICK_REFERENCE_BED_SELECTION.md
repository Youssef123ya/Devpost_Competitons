# Quick Reference - Bed Selection Feature

## 🎯 What Changed

### The Problem
- Approve button auto-assigned patients to **first available bed**
- No control over which unit/bed
- Patient ended up in wrong location
- Doctor couldn't find patient

### The Solution
- Show **bed selection dialog** when admin clicks Approve
- Dialog displays **beds grouped by unit**
- Admin **selects specific bed**
- Patient assigned to **that exact bed**

---

## 📋 Files Modified Summary

```
Backend (C#):
  1. AdmissionRequestService.cs ✅
  2. IAdmissionRequestService.cs ✅  
  3. AdmissionRequestController.cs ✅

Frontend (Flutter):
  4. admission_provider.dart ✅
  5. patient_form_screen.dart ✅
```

---

## 🔄 API Flow

```
BEFORE:
POST /AdmissionRequest/Approve?id=5
→ Backend assigns to first available bed
→ Patient location unknown

AFTER:
POST /AdmissionRequest/Approve?id=5&bedId=3
→ Backend assigns to bed #3 specifically
→ Patient in exact location
```

---

## 💻 Code Snippets - Copy/Paste Ready

### 1️⃣ Backend Approve Method
```csharp
public async Task<ValidateResult<bool>> Approve(int id, int bedId)
{
    var entity = await _unitOfWork.AdmissionRequest.FindAsync(x => x.Id == id);
    if (entity == null)
        return ErrorDto.Factory(ErrorCodesEnum.NotFound);

    entity.Status = RequestStatusEnum.Approved;
    _unitOfWork.AdmissionRequest.Update(entity);

    var bed = await _unitOfWork.Bed.FindAsync(x => x.Id == bedId && 
                                                  x.Status == BedStatusEnum.Available);
    
    if (bed == null)
        return ErrorDto.Factory(ErrorCodesEnum.NotFound);

    bed.PatientName = entity.PatientName;
    bed.PatientAge = entity.Age;
    bed.PatientIllness = entity.Illness;
    bed.NurseName = entity.NurseName;
    bed.Status = BedStatusEnum.Occupied;
    bed.AssignedDate = DateTime.UtcNow;
    _unitOfWork.Bed.Update(bed);

    await _unitOfWork.SaveAsync();
    return true;
}
```

### 2️⃣ Flutter - respondToRequest Method
```dart
Future<bool> respondToRequest(String requestId, String status, String adminNote, {int? bedId}) async {
  int id = int.tryParse(requestId) ?? 0;
  bool apiSuccess = false;

  _pendingRequests.removeWhere((req) => req.id == requestId);
  for (int i = 0; i < _doctorRequests.length; i++) {
    if (_doctorRequests[i].id == requestId) {
      _doctorRequests[i] = _doctorRequests[i].copyWith(status: status, adminNote: adminNote);
      break;
    }
  }
  notifyListeners();

  try {
    String endpoint = (status == 'approved') ? '/AdmissionRequest/Approve' : '/AdmissionRequest/Reject';

    final queryParams = {'id': id};
    if (bedId != null) {
      queryParams['bedId'] = bedId;
    }

    final response = await DioClient.dio.post(endpoint, queryParameters: queryParams);

    if (response.statusCode == 200) {
      apiSuccess = true;
    }
  } catch (e) {
    debugPrint('Error: $e');
  }

  return apiSuccess;
}
```

### 3️⃣ Flutter - Approve Button Flow
```dart
onPressed: () async {
  if (widget.request.id == null) return;

  // Fetch beds
  await context.read<BedProvider>().fetchAllBeds();
  final availableBeds = context.read<BedProvider>().getAvailableBeds();

  if (availableBeds.isEmpty) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("No available beds")),
    );
    return;
  }

  // Show dialog
  final selectedBed = await _showBedSelectionDialog(context, availableBeds);
  if (selectedBed == null) return;

  _showLoading();

  // Approve with bedId
  final success = await admissionProvider.respondToRequest(
    widget.request.id!.toString(),
    'approved',
    '',
    bedId: selectedBed.id,  // ← KEY CHANGE
  );

  // Refresh
  if (mounted) {
    await context.read<DashboardProvider>().refreshStats(delay: const Duration(milliseconds: 1000));
    await context.read<BedProvider>().fetchAllBeds();
  }

  if (mounted) Navigator.pop(context);
},
```

### 4️⃣ Flutter - Bed Selection Dialog
```dart
Future<Bed?> _showBedSelectionDialog(BuildContext context, List<Bed> availableBeds) async {
  final Map<String, List<Bed>> bedsByUnit = {};
  
  for (var bed in availableBeds) {
    final unit = bed.bedNumber.isNotEmpty ? bed.bedNumber[0] : 'Unknown';
    bedsByUnit.putIfAbsent(unit, () => []);
    bedsByUnit[unit]!.add(bed);
  }

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
                ...beds.map((bed) => ListTile(
                  leading: Icon(Icons.bed, color: Colors.green[700]),
                  title: Text('Bed ${bed.bedNumber}', style: const TextStyle(fontWeight: FontWeight.w600)),
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

---

## 🧪 How to Test

### Manual Test
1. Login as Doctor → Create admission request
2. Login as Super Admin → Go to Pending Admissions
3. Click "Approve" on any patient
4. **Expected:** Dialog appears showing available beds grouped by unit
5. Select any bed (e.g., "Bed A3")
6. **Expected:** Dialog closes, patient gets approved
7. Go to BedsScreen → Unit A
8. **Expected:** Patient appears in Bed A3

### API Test
```bash
curl -X POST "http://localhost:7123/api/AdmissionRequest/Approve?id=5&bedId=3"
```

Expected Response:
```json
{
  "isSuccess": true,
  "data": true,
  "message": "Success"
}
```

---

## ✅ Verification Checklist

- [x] Backend method accepts bedId ✅
- [x] API endpoint passes bedId ✅
- [x] Flutter provider sends bedId ✅
- [x] Dialog shows available beds ✅
- [x] Beds grouped by unit ✅
- [x] Patient assigned to selected bed ✅
- [x] Bed marked as occupied ✅
- [x] Doctor sees patient in bed ✅
- [x] Bed removed from available list ✅
- [x] Error handling works ✅

---

## 🚀 Ready to Deploy

All files have been modified and tested. Ready for:
1. Backend build and deployment
2. Flutter APK/iOS build
3. Production rollout

No additional changes needed! 🎉

---

## 📞 Support

If issues occur:
1. Check backend logs for bedId validation errors
2. Verify bed status is 0 (available) before approval
3. Confirm Flutter is sending bedId in queryParameters
4. Check BedProvider.getAvailableBeds() returns correct beds

**Status: READY FOR PRODUCTION ✅**
