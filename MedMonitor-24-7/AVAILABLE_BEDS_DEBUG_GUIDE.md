# Available Beds Debug Guide — Console Output Analysis

## 🔍 How to Capture Debug Logs

### Step 1: Run Flutter with Console Output
```bash
# In your Flutter terminal, run:
flutter run -v

# The -v flag shows verbose output including all debugPrint() statements
```

### Step 2: Look for These Debug Logs in Console

```
📡 Dashboard Stats Raw Response: ...
📡 Response Type: ...
📡 Payload after unwrap: ...
📡 availableBeds value: ...
📡 Parsed Model - availableBeds: ...
📊 DashboardProvider - Fetched Stats:
   - availableBeds: ...
🎨 SuperAdminScreen - Setting UI with stats:
   - availableBeds: ...
```

---

## 📋 What Each Log Means

### API Service Logs
```
📡 Dashboard Stats Raw Response: {map of data from API}
   ↓
📡 Response Type: _InternalLinkedHashMap (or Map<String,dynamic>)
   ↓
📡 Payload after unwrap: {actual stats object}
   ↓
📡 availableBeds value: 79  ✅ (should NOT be 0)
📡 totalUnits value: 7
📡 occupiedBeds value: 5
   ↓
✅ Parsed Model - availableBeds: 79  ✅
```

### Provider Logs
```
📊 DashboardProvider - Fetched Stats:
   - totalUnits: 7     ✅
   - bedsPerUnit: 12   ✅
   - totalBeds: 84     ✅
   - occupiedBeds: 5   ✅
   - availableBeds: 79 ✅
   - totalPatients: 23 ✅
✅ DashboardProvider - Stats updated successfully
```

### UI Logs
```
🎨 SuperAdminScreen - Setting UI with stats:
   - availableBeds: 79     ✅
   - occupiedBeds: 5
   - totalBeds: 84
   - totalUnits: 7
🎨 SuperAdminScreen - _currentStats set:
   [0] Occupied Beds: 5
   [1] Available Beds: 79  ✅ This should display in UI!
   [2] Total Patients: 23
   ...
```

---

## 🐛 Common Issues & What They Look Like

### Issue 1: availableBeds is still 0

**In Logs:**
```
📡 availableBeds value: 0
   ↓
✅ Parsed Model - availableBeds: 0
   ↓
🎨 SuperAdminScreen - Setting UI with stats:
   - availableBeds: 0  ❌
```

**Solution:**
- Check backend DashboardController.cs
- Verify calculation: `int availableBeds = totalBeds - occupiedBeds;`
- Restart backend service

### Issue 2: API response is null

**In Logs:**
```
📡 Dashboard Stats Raw Response: null
❌ Dashboard Stats Error: null exception
```

**Solution:**
- Check auth token is valid
- Verify backend is running on http://localhost:5140
- Check API endpoint /Dashboard/Stats exists

### Issue 3: Response has wrapper object

**In Logs:**
```
📡 Payload after unwrap: { "data": { "availableBeds": 79 } }
📡 Found "data" wrapper, unwrapping...
📡 availableBeds value: 79  ✅
```

**Solution:**
- Code should handle this automatically
- If it shows availableBeds is 79 after unwrapping, it's working

### Issue 4: Field name mismatch

**In Logs:**
```
📡 Payload keys: [AvailableBeds, OccupiedBeds, ...]  (PascalCase!)
📡 availableBeds value: null  ❌ (trying to read camelCase)
   ↓
✅ Parsed Model - availableBeds: 84  ⚠️ (using default value)
```

**Solution:**
- Check Program.cs line 52:
  ```csharp
  x.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
  ```
- Must be set to convert to camelCase

---

## 🔧 Step-by-Step Debug Process

### 1️⃣ Check API Directly (Using Postman or Browser)

**URL:**
```
GET http://localhost:5140/Dashboard/Stats
Header: Authorization: Bearer {your_token}
```

**What to Look For:**
```json
{
  "totalUnits": 7,
  "bedsPerUnit": 12,
  "totalBeds": 84,
  "occupiedBeds": 5,
  "availableBeds": 79,
  "totalPatients": 23,
  ...
}
```

**Check:**
- ✅ Field names are camelCase (`availableBeds`, NOT `AvailableBeds`)
- ✅ `availableBeds` value is NOT 0
- ✅ Status code is 200

---

### 2️⃣ Run Flutter App with Logs

```bash
# Terminal 1: Start backend
cd MedMonitor-master-BackEnd/MedMonitor-master
dotnet run

# Terminal 2: Run Flutter
cd med_monitor
flutter run -v
```

**Watch for in Terminal 2 output:**
```
📡 Dashboard Stats Raw Response: ...
🎨 SuperAdminScreen - Setting UI with stats:
   - availableBeds: ...
```

---

### 3️⃣ Analyze the Logs

**Good Output:**
```
📡 Dashboard Stats Raw Response: {totalUnits: 7, bedsPerUnit: 12, totalBeds: 84, occupiedBeds: 5, availableBeds: 79, ...}
📡 Response Type: _InternalLinkedHashMap<String, dynamic>
📡 Payload keys: [totalUnits, bedsPerUnit, totalBeds, occupiedBeds, availableBeds, totalPatients, ...]
📡 availableBeds value: 79
✅ Parsed Model - availableBeds: 79, occupiedBeds: 5, totalBeds: 84
📊 DashboardProvider - Fetched Stats:
   - availableBeds: 79
🎨 SuperAdminScreen - Setting UI with stats:
   - availableBeds: 79
🎨 SuperAdminScreen - _currentStats set:
   [1] Available Beds: 79
```

**Expected Result in UI:**
```
Available Beds: 79 ✅
```

---

## 📞 If Something is Wrong

### availableBeds = 0 (Still Broken)

**Likely Cause:** Backend not restarted after changes

**Fix:**
```bash
# Kill backend (Ctrl+C in terminal)
# Navigate to backend folder
cd MedMonitor-master-BackEnd/MedMonitor-master

# Restart backend
dotnet run
```

### availableBeds = 84 (Using Default Value)

**Likely Cause:** Field name mismatch or JSON parsing error

**Debug:**
- Check backend is sending camelCase:
  ```csharp
  // Program.cs line 52 should have:
  x.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
  ```
- Check Flutter model fromJson() is reading correct field:
  ```dart
  availableBeds: parseInt(json['availableBeds'] ?? json['AvailableBeds'] ?? 84),
  ```

### availableBeds = null

**Likely Cause:** API parsing failed

**Check:**
- Is the response wrapped in a `data` object?
- Are field names correct?
- Look for: `📡 Payload keys: ...` in logs to see actual field names

---

## 🎯 Success Checklist

- [ ] Backend running (`dotnet run`)
- [ ] Flutter running with verbose logs (`flutter run -v`)
- [ ] Can see `📡 Dashboard Stats Raw Response` in console
- [ ] Response has `"availableBeds": 79` (or similar non-zero number)
- [ ] See `🎨 SuperAdminScreen - _currentStats set:`
- [ ] `[1] Available Beds: 79` in the list
- [ ] Dashboard UI shows `Available Beds: 79` ✅ (not 0)

---

## 📝 Copy-Paste: Expected Console Output

```
Launching lib/main.dart on emulator-5554 in debug mode...
...
I/flutter (15234): 📡 Dashboard Stats Raw Response: {totalUnits: 7, bedsPerUnit: 12, totalBeds: 84, occupiedBeds: 5, availableBeds: 79, totalPatients: 23, totalDoctors: 3, totalNurses: 1, totalRequests: 25, newbornsCount: 1, childrenCount: 5, teenagersCount: 1, adultsCount: 14, elderlyCount: 2}
I/flutter (15234): 📡 Response Type: _InternalLinkedHashMap<String, dynamic>
I/flutter (15234): 📡 Payload after unwrap: {totalUnits: 7, bedsPerUnit: 12, totalBeds: 84, occupiedBeds: 5, availableBeds: 79, totalPatients: 23, totalDoctors: 3, totalNurses: 1, totalRequests: 25, newbornsCount: 1, childrenCount: 5, teenagersCount: 1, adultsCount: 14, elderlyCount: 2}
I/flutter (15234): 📡 Payload keys: [totalUnits, bedsPerUnit, totalBeds, occupiedBeds, availableBeds, totalPatients, totalDoctors, totalNurses, totalRequests, newbornsCount, childrenCount, teenagersCount, adultsCount, elderlyCount]
I/flutter (15234): 📡 availableBeds value: 79
I/flutter (15234): ✅ Parsed Model - availableBeds: 79, occupiedBeds: 5, totalBeds: 84
I/flutter (15234): 📊 DashboardProvider - Fetched Stats:
I/flutter (15234):    - totalUnits: 7
I/flutter (15234):    - bedsPerUnit: 12
I/flutter (15234):    - totalBeds: 84
I/flutter (15234):    - occupiedBeds: 5
I/flutter (15234):    - availableBeds: 79
I/flutter (15234):    - totalPatients: 23
I/flutter (15234): ✅ DashboardProvider - Stats updated successfully
I/flutter (15234): 🎨 SuperAdminScreen - Setting UI with stats:
I/flutter (15234):    - availableBeds: 79
I/flutter (15234):    - occupiedBeds: 5
I/flutter (15234):    - totalBeds: 84
I/flutter (15234):    - totalUnits: 7
I/flutter (15234): 🎨 SuperAdminScreen - _currentStats set:
I/flutter (15234):    [0] Occupied Beds: 5
I/flutter (15234):    [1] Available Beds: 79
I/flutter (15234):    [2] Total Patients: 23
I/flutter (15234):    [3] Total Doctors: 3
I/flutter (15234):    [4] Total Nurses: 1
I/flutter (15234):    [5] Total Requests: 25

(Then UI should show: Available Beds: 79 ✅)
```

---

## 🚀 Next Steps

1. Run app with debug logs
2. Post console output here
3. I'll analyze and find the issue
4. Apply the fix
5. Test again

Good luck! 🔍
