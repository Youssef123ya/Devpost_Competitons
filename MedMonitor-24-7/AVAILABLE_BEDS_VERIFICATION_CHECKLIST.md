# Available Beds Debug — Complete Verification Checklist

## ✅ STEP 1: Verify Backend Files Are Updated

### Check 1: BedConfiguration.cs Exists
```bash
File: MedMonitor/Core/Constants/BedConfiguration.cs

Expected Content:
- BEDS_PER_UNIT = 12
- TOTAL_UNITS = 7
- TotalBeds property returns: TOTAL_UNITS * BEDS_PER_UNIT
```

**Verify:**
```
Open the file in VS Code
✅ Does file exist?
✅ Does it have the right values?
```

---

### Check 2: DashboardController.cs Has New Logic
```bash
File: MedMonitor/Controllers/DashboardController.cs

Expected:
- Uses BedConfiguration.TOTAL_UNITS
- Imports: using MedMonitor.Core.Constants;
- Calculation: int availableBeds = totalBeds - occupiedBeds;
- Returns: new DashboardStatsDto { TotalUnits, BedsPerUnit, TotalBeds, OccupiedBeds, AvailableBeds, ... }
```

**Verify:**
```
Search for: "BedConfiguration"
✅ Found in file?
✅ Calculation correct?
```

---

### Check 3: DashboardStatsDto.cs Has New Fields
```bash
File: MedMonitor/Core/Dto/DashboardStatsDto.cs

Expected Properties:
- public int TotalUnits { get; set; }
- public int BedsPerUnit { get; set; }
- public int TotalBeds { get; set; }
- public int OccupiedBeds { get; set; }
- public int AvailableBeds { get; set; }
```

**Verify:**
```
Open the file
✅ All 5 properties present?
✅ Public get/set for each?
```

---

### Check 4: Program.cs Has JsonNamingPolicy
```bash
File: MedMonitor/Program.cs (around line 52)

Expected:
.AddJsonOptions(x => {
    x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    x.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;  // ✅
});
```

**Verify:**
```
Search for: "JsonNamingPolicy.CamelCase"
✅ Found?
✅ This converts PascalCase properties to camelCase in JSON
```

---

## ✅ STEP 2: Restart Backend

### Kill Old Process
```bash
# In the backend terminal, press: Ctrl+C
# This stops the old backend instance
```

### Restart Backend
```bash
cd MedMonitor-master-BackEnd/MedMonitor-master
dotnet run

# Should output:
# info: Microsoft.Hosting.Lifetime[14]
#       Now listening on: http://localhost:5140
#       Application started. Press Ctrl+C to shut down.
```

**Verify:**
```
✅ Backend started successfully?
✅ Listening on port 5140?
✅ No errors in console?
```

---

## ✅ STEP 3: Verify Flutter Files Are Updated

### Check 1: dashboard_stats_model.dart Has New Fields
```bash
File: med_monitor/lib/models/dashboard_stats_model.dart

Expected:
- final int totalUnits;
- final int bedsPerUnit;
- final int totalBeds;
- fromJson() reads: json['totalUnits'] ?? json['TotalUnits']
- fromJson() reads: json['availableBeds'] ?? json['AvailableBeds']
```

**Verify:**
```
✅ All fields present?
✅ fromJson() handles both camelCase and PascalCase?
```

---

### Check 2: api_service.dart Has Debug Logs
```bash
File: med_monitor/lib/services/api_service.dart

Expected in getDashboardStats():
- debugPrint('📡 Dashboard Stats Raw Response: ${response.data}');
- debugPrint('📡 availableBeds value: ${payload['availableBeds']}');
- debugPrint('✅ Parsed Model - availableBeds: ${model.availableBeds}');
```

**Verify:**
```
✅ Debug prints added?
```

---

### Check 3: dashboard_provider.dart Has Debug Logs
```bash
File: med_monitor/lib/providers/dashboard_provider.dart

Expected in fetchStats():
- debugPrint('📊 DashboardProvider - Fetched Stats:');
- debugPrint('   - availableBeds: ${stats.availableBeds}');
```

**Verify:**
```
✅ Debug prints added?
```

---

### Check 4: super_admin_screen.dart Has Debug Logs
```bash
File: med_monitor/lib/features/admin/super_admin_screen.dart

Expected in _fetchDashboardData():
- debugPrint('🎨 SuperAdminScreen - Setting UI with stats:');
- debugPrint('   - availableBeds: ${stats.availableBeds}');
```

**Verify:**
```
✅ Debug prints added?
```

---

## ✅ STEP 4: Run Flutter with Verbose Logs

### Terminal Commands
```bash
# Terminal 1: Backend
cd MedMonitor-master-BackEnd/MedMonitor-master
dotnet run

# Terminal 2: Flutter (in a NEW terminal)
cd med_monitor
flutter run -v

# The -v flag shows ALL debug output including debugPrint()
```

---

## ✅ STEP 5: Capture and Analyze Logs

### Look for This Sequence in Console Output

```
1️⃣ API Response Received:
📡 Dashboard Stats Raw Response: {totalUnits: 7, bedsPerUnit: 12, ...}
📡 availableBeds value: 79

2️⃣ Model Parsed:
✅ Parsed Model - availableBeds: 79, occupiedBeds: 5, totalBeds: 84

3️⃣ Provider Updated:
📊 DashboardProvider - Fetched Stats:
   - availableBeds: 79

4️⃣ UI Set:
🎨 SuperAdminScreen - Setting UI with stats:
   - availableBeds: 79
🎨 SuperAdminScreen - _currentStats set:
   [1] Available Beds: 79

5️⃣ Result in UI:
Available Beds: 79 ✅ (NOT 0!)
```

---

## 🚨 If You Still See availableBeds = 0

### Reason 1: Backend NOT Restarted
**Solution:**
```
1. Kill backend (Ctrl+C)
2. Run: dotnet run
3. Wait for: "Now listening on: http://localhost:5140"
4. Refresh Flutter app
```

---

### Reason 2: Flutter App Cached Old Code
**Solution:**
```bash
# Option A: Clean rebuild
flutter clean
flutter pub get
flutter run -v

# Option B: Hard refresh
# Hot reload doesn't pick up model changes
# Use Ctrl+Shift+R (or cmd+shift+r on Mac) to restart app
```

---

### Reason 3: API Response Still Wrong
**Solution:**
```
1. Check DashboardController.cs
2. Verify: int availableBeds = totalBeds - occupiedBeds;
3. Restart backend
4. Test directly:
   curl -X GET "http://localhost:5140/Dashboard/Stats" \
        -H "Authorization: Bearer {TOKEN}"
```

---

### Reason 4: JSON Field Name Mismatch
**Solution:**
1. Check Program.cs has `JsonNamingPolicy.CamelCase`
2. Verify API returns `"availableBeds"` NOT `"AvailableBeds"`
3. Check Flutter model reads both: `json['availableBeds'] ?? json['AvailableBeds']`

---

## 🔍 Manual API Test

### Using cURL
```bash
TOKEN="your-bearer-token-here"

curl -X GET "http://localhost:5140/Dashboard/Stats" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Should return:
# {
#   "totalUnits": 7,
#   "bedsPerUnit": 12,
#   "totalBeds": 84,
#   "occupiedBeds": 5,
#   "availableBeds": 79,
#   ...
# }
```

### Using Postman
```
1. New → GET Request
2. URL: http://localhost:5140/Dashboard/Stats
3. Headers:
   Authorization: Bearer {token}
4. Send
5. Look at Response tab
6. Verify: "availableBeds": 79
```

---

## ✅ Final Checklist

- [ ] Backend restarted (dotnet run)
- [ ] All 4 backend files updated and saved
- [ ] All 4 Flutter files updated and saved
- [ ] Flutter app running with verbose (-v)
- [ ] Can see "📡 Dashboard Stats Raw Response" in console
- [ ] Response has "availableBeds": 79 (not 0, not null)
- [ ] Can see "✅ Parsed Model" log
- [ ] Can see "🎨 SuperAdminScreen" logs
- [ ] Dashboard UI shows "Available Beds: 79" ✅

---

## 📝 Copy This If Logs Show availableBeds = 0

```
Available Beds is showing 0. Here's the console output:

[PASTE YOUR CONSOLE OUTPUT HERE]

Expected:
✅ availableBeds value: 79
✅ _currentStats[1]: Available Beds: 79

Actual:
❌ availableBeds value: 0
❌ _currentStats[1]: Available Beds: 0
```

---

## 🎯 If This Still Doesn't Work

Provide:
1. Full console output from running `flutter run -v`
2. Backend console output showing app started
3. Screenshot of "Available Beds" in UI
4. Confirmation that you restarted backend after code changes

Then I can pinpoint the exact issue! 🔍
