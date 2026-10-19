# API Endpoint Fix - Approval Flow

## Problem
When clicking "Approve" on the patient form screen, the app shows error:
```
Failed to approve. Check your connection.
```

The console shows:
```
DioClient Request: POST /admission-requests/4/respond - token present: true
API error (404): This exception was thrown because the response has a status code of 404
```

## Root Cause
The `respondToRequest()` method in `admission_provider.dart` was using the **wrong endpoint**:
- ❌ Used: `/admission-requests/$requestId/respond`
- ✅ Should use: `/AdmissionRequest/Approve` (for approval) or `/AdmissionRequest/Reject` (for rejection)

The backend doesn't have the `/admission-requests/{id}/respond` endpoint, resulting in 404 errors.

## Solution
Updated `respondToRequest()` method to use the correct backend endpoints:

### Before (Lines 236-271):
```dart
Future<bool> respondToRequest(String requestId, String status, String adminNote) async {
  try {
    final response = await DioClient.dio.post(
      '/admission-requests/$requestId/respond',  // ❌ WRONG ENDPOINT
      data: {
        'status': status,
        'adminNote': adminNote,
      },
    );
    // ... rest of code
  }
}
```

### After (Fixed):
```dart
Future<bool> respondToRequest(String requestId, String status, String adminNote) async {
  try {
    int id = int.tryParse(requestId) ?? 0;
    
    // Use the correct endpoint based on status
    String endpoint = (status == 'approved') 
      ? '/AdmissionRequest/Approve'      // ✅ CORRECT
      : '/AdmissionRequest/Reject';      // ✅ CORRECT
    
    final response = await DioClient.dio.post(
      endpoint,
      queryParameters: {'id': id},
    );
    // ... rest of code
  }
}
```

## Key Changes
1. **Endpoint**: `/admission-requests/$requestId/respond` → `/AdmissionRequest/Approve` or `/AdmissionRequest/Reject`
2. **Parameters**: Body data → Query parameters (`queryParameters: {'id': id}`)
3. **ID Handling**: String requestId safely converted to int

## Expected Behavior After Fix
✅ Click "Approve" → App calls `/AdmissionRequest/Approve` with request ID
✅ API returns 200 → Patient added to system
✅ Navigate to "Beds Monitoring Super Admin" screen
✅ No more "Failed to approve" error

## File Modified
- `lib/providers/admission_provider.dart` (Lines 235-271)

## Testing
1. Navigate to pending admission requests
2. Select a patient request
3. Click "Approve"
4. Should navigate to Beds Monitoring screen (not show error)

## Notes
- This fix aligns with other working API calls:
  - ✅ `POST /AdmissionRequest/Create` (works)
  - ✅ `GET /AdmissionRequest/GetPending` (works)
  - ✅ Now: `POST /AdmissionRequest/Approve` (fixed)
  - ✅ And: `POST /AdmissionRequest/Reject` (fixed)
