# Available Beds Fix — TESTING & VERIFICATION

## ✅ Quick Checklist: Is Available Beds Fixed?

| Check | Expected | Status |
|-------|----------|--------|
| Dashboard shows "Available Beds" ≠ 0 | Yes (should be 79 or similar) | ? |
| When patient approved, beds update | Yes (available decreases by 1) | ? |
| API returns `totalUnits`, `bedsPerUnit`, `totalBeds` | Yes | ? |
| Calculation: 84 - occupied = available | Yes | ? |

---

## 🔧 Step 1: Verify Backend Changes

### Check if BedConfiguration exists
```
Navigate to: MedMonitor/Core/Constants/BedConfiguration.cs
Expected: File should exist with BEDS_PER_UNIT=12, TOTAL_UNITS=7
Status: ✅ Created
```

### Check DashboardController imports
```csharp
// Should have:
using MedMonitor.Core.Constants;  // ✅ New import
using MedMonitor.Core.Dto;
```

---

## 📡 Step 2: Test API Response

### Option A: Using Swagger UI (if available)
```
1. Open: http://localhost:5000/swagger
2. Find: Dashboard → GET /Dashboard/Stats
3. Click "Try it out"
4. Click "Execute"

Expected Response (200 OK):
{
  "totalUnits": 7,        ✅ NEW
  "bedsPerUnit": 12,      ✅ NEW
  "totalBeds": 84,        ✅ NEW
  "occupiedBeds": 5,
  "availableBeds": 79,    ✅ SHOULD NOT BE 0!
  "totalPatients": 23,
  ...
}
```

### Option B: Using Postman / cURL
```bash
curl -X GET "http://localhost:5000/api/Dashboard/Stats" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return:
# {
#   "totalUnits": 7,
#   "bedsPerUnit": 12,
#   "totalBeds": 84,
#   "occupiedBeds": 5,
#   "availableBeds": 79
# }
```

### Option C: Using Flutter HTTP Debugger
```dart
// In your code after fetching:
final dashboardProvider = context.read<DashboardProvider>();
final stats = dashboardProvider.stats;

// Print in console:
print('Total Units: ${stats?.totalUnits}');
print('Beds Per Unit: ${stats?.bedsPerUnit}');
print('Total Beds: ${stats?.totalBeds}');
print('Occupied: ${stats?.occupiedBeds}');
print('Available: ${stats?.availableBeds}');

// Expected Output:
// Total Units: 7
// Beds Per Unit: 12
// Total Beds: 84
// Occupied: 5
// Available: 79  ✅
```

---

## 📱 Step 3: Test Flutter Dashboard UI

### Test 1: Dashboard Loads Correctly
```
1. Run Flutter app
2. Navigate to: Super Admin → Home Dashboard
3. Look for: "Available Beds" card

Expected:
✅ Shows a number (79, 80, etc.) — NOT 0
✅ Not blank or loading forever
✅ Updates when page refreshes
```

### Test 2: Pull to Refresh
```
1. On dashboard, pull down to refresh
2. Watch network request in DevTools

Expected:
✅ API call to /Dashboard/Stats succeeds
✅ availableBeds number updates if any changes
```

### Test 3: Verify Dynamic Update
```
1. On dashboard, note current "Available Beds" number
2. Open "Pending Admission Requests"
3. Approve a patient request
4. Return to dashboard (pull refresh)

Expected:
✅ "Occupied Beds" increased by 1
✅ "Available Beds" decreased by 1
✅ Total stays at 84: (Occupied + Available = 84)
```

---

## 🧮 Step 4: Verify Calculation Logic

### Check: Total Always = 84
```
Observation: Occupied + Available should always equal Total

Examples:
Scenario 1:
  Occupied: 5
  Available: 79
  Total: 84  ✅ Correct (5 + 79 = 84)

Scenario 2:
  Occupied: 10
  Available: 74
  Total: 84  ✅ Correct (10 + 74 = 84)

Scenario 3:
  Occupied: 23
  Available: 61
  Total: 84  ✅ Correct (23 + 61 = 84)
```

### Check: Code Calculation
```csharp
// In DashboardController.Stats():

int totalUnits = BedConfiguration.TOTAL_UNITS;        // = 7
int bedsPerUnit = BedConfiguration.BEDS_PER_UNIT;     // = 12
int totalBeds = BedConfiguration.TotalBeds;           // = 7 × 12 = 84 ✅

int occupiedBeds = await _context.Beds
    .CountAsync(b => (int)b.Status == 1);             // Count Occupied
    
int availableBeds = totalBeds - occupiedBeds;         // 84 - occupied ✅
```

---

## 🔄 Step 5: Test Future Scalability

### Simulate Adding Unit H

**Step 1: Update Configuration**
```csharp
// File: MedMonitor/Core/Constants/BedConfiguration.cs
public const int TOTAL_UNITS = 8;  // Changed from 7 to 8

// New calculation:
// TotalBeds = 8 × 12 = 96
```

**Step 2: Rebuild & Restart Backend**
```
1. Rebuild solution
2. Restart backend service
```

**Step 3: Test API Response**
```
GET /Dashboard/Stats

Expected:
{
  "totalUnits": 8,
  "bedsPerUnit": 12,
  "totalBeds": 96,          ✅ NEW: 96 instead of 84
  "occupiedBeds": 5,        (same as before)
  "availableBeds": 91       ✅ NEW: 96 - 5 = 91 instead of 79
}
```

**Step 4: Verify Flutter (no changes needed!)**
```
1. Refresh dashboard (no new build required)
2. Should show availableBeds: 91 automatically ✅

✅ NO Flutter code changes needed!
```

---

## ❌ Troubleshooting

### Problem: Available Beds still shows 0
**Solution:**
- [ ] Restart backend (must restart for config changes)
- [ ] Check DashboardController has new calculation code
- [ ] Verify BedConfiguration.cs was created
- [ ] Check API response includes new fields

### Problem: Available Beds > Total Beds (impossible!)
**Cause:** Likely an old API response format
**Solution:**
- [ ] Clear API response cache
- [ ] Hard restart Flutter app (kill and relaunch)
- [ ] Verify backend returns correct response format

### Problem: Calculation doesn't match
**Debug:**
```dart
// Add to super_admin_screen.dart temporary debug
print('Response: ${_dashboardStats?.toJson()}');
print('Calc check: ${_dashboardStats?.totalBeds} - ${_dashboardStats?.occupiedBeds} = ${_dashboardStats?.availableBeds}');
```

---

## ✅ Final Validation Checklist

- [ ] Backend: BedConfiguration.cs exists with TOTAL_UNITS=7, BEDS_PER_UNIT=12
- [ ] Backend: DashboardController uses new calculation
- [ ] Backend: DashboardStatsDto includes new fields
- [ ] API: GET /Dashboard/Stats returns new fields (totalUnits, bedsPerUnit, totalBeds)
- [ ] API: availableBeds = totalBeds - occupiedBeds ✅
- [ ] Flutter: DashboardStatsModel parses new fields
- [ ] Flutter: Dashboard displays availableBeds ≠ 0
- [ ] Flutter: Available beds update when patient approved/rejected
- [ ] Calculation: Occupied + Available always = Total (84)

---

## 📊 Expected API Response Format

```json
{
  "totalUnits": 7,
  "bedsPerUnit": 12,
  "totalBeds": 84,
  "occupiedBeds": 5,
  "availableBeds": 79,
  "totalPatients": 23,
  "totalDoctors": 3,
  "totalNurses": 1,
  "totalRequests": 25,
  "newbornsCount": 1,
  "childrenCount": 5,
  "teenagersCount": 1,
  "adultsCount": 14,
  "elderlyCount": 2
}
```

---

## 🎯 Success = 
✅ Available Beds ≠ 0  
✅ Dynamic calculation works  
✅ Scales to Unit H with just 1 line change  
