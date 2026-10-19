# Available Beds Still 0? — Action Plan

## 🎯 Your Issue
✅ I made all the fixes  
❌ Dashboard still shows Available Beds: 0  

---

## 🔍 Diagnosis

Available Beds showing 0 likely means:

**Scenario A** (Most Likely): Backend NOT Restarted
- Old code still running
- Not using new BedConfiguration calculation
- API returns old/wrong value

**Scenario B**: JSON Field Name Mismatch
- Backend sends `"AvailableBeds"` (PascalCase) instead of `"availableBeds"` (camelCase)
- Flutter can't find the field
- Uses default value (84 or 0)

**Scenario C**: Response Wrapped
- Backend returns `{ "data": { ... } }` instead of direct object
- Flutter parsing fails

**Scenario D**: Flutter Not Reading New Code
- Flutter using cached old model
- Needs clean rebuild or hard refresh

---

## ✅ FIX IT IN 3 STEPS

### STEP 1: Test Backend API Directly (2 minutes)

**Why:** Eliminate Flutter from diagnosis. Test backend only.

```bash
# Windows PowerShell OR Mac/Linux Terminal

# Replace with your actual token
TOKEN="your-bearer-token-from-login"

# Test the API
curl -X GET "http://localhost:5140/Dashboard/Stats" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "totalUnits": 7,
  "bedsPerUnit": 12,
  "totalBeds": 84,
  "occupiedBeds": 5,
  "availableBeds": 79,
  ...
}
```

**What to Check:**
- ✅ Status: 200 OK?
- ✅ Has `"availableBeds": 79` (not 0)?
- ✅ Field names are lowercase (`availableBeds`, NOT `AvailableBeds`)?

**If YES** ✅ → Go to STEP 2  
**If NO** ❌ → Backend issue, fix here first

---

### If Backend API Returns Wrong Values

**Problem 1: availableBeds = 0**
```bash
# Kill backend
Ctrl+C

# Fix DashboardController.cs
# Verify: int availableBeds = totalBeds - occupiedBeds;

# Restart backend
dotnet run

# Test again with curl
```

**Problem 2: Field names are PascalCase (`AvailableBeds`)**
```bash
# Check Program.cs line ~52
# Must have:
x.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;

# If missing, add it and restart backend
```

**Problem 3: Response wrapped in `"data": {...}`**
```
This is OK - Flutter code handles it.
Don't worry about this unless other issues.
```

---

### STEP 2: Clean Flutter and Rebuild (3 minutes)

**Why:** Clear stale code from Flutter cache

```bash
cd med_monitor

# Clean build cache
flutter clean
flutter pub get

# Rebuild app
flutter run -v

# -v shows all debug logs including debugPrint()
```

---

### STEP 3: Check Console Output (2 minutes)

**When Flutter app starts, watch for these logs:**

```
✅ SUCCESS CASE:
📡 Dashboard Stats Raw Response: {totalUnits: 7, ..., availableBeds: 79}
📡 availableBeds value: 79
✅ Parsed Model - availableBeds: 79
📊 DashboardProvider - availableBeds: 79
🎨 SuperAdminScreen - availableBeds: 79
[1] Available Beds: 79

↓ Result in UI:
Available Beds: 79 ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ FAILURE CASE:
📡 availableBeds value: 0  (or null, or wrong)
🎨 SuperAdminScreen - availableBeds: 0
[1] Available Beds: 0

↓ Result in UI:
Available Beds: 0 ❌
```

---

## 📋 Complete Debug Workflow

```
1. Backend running? 
   → dotnet run
   
2. Test API with curl?
   → Does availableBeds = 79?
   
   NO → Fix backend code
        - Check DashboardController.cs
        - Check BedConfiguration.cs exists
        - Check Program.cs has JsonNamingPolicy.CamelCase
        - Restart: dotnet run
        
   YES → Continue
   
3. Flutter clean rebuild?
   → flutter clean && flutter pub get && flutter run -v
   
4. Check console logs?
   → Look for: 📡, ✅, 📊, 🎨 debug markers
   
   availableBeds = 0 → Step 1 issue (backend)
   availableBeds = 79 in logs, but 0 in UI → Model parsing issue
   Can't find logs → Flutter not logging, rebuild needed
```

---

## 🎯 Most Likely Fix

**If backend API returns correct value (79) but UI shows 0:**

```bash
# Option 1: Hard refresh Flutter
# Press: R (restart) in Flutter console
# Or: Ctrl+C and flutter run -v

# Option 2: Full rebuild
flutter clean
flutter pub get
flutter run -v

# Option 3: Check DashboardStatsModel.fromJson()
# Verify it reads: json['availableBeds'] ?? json['AvailableBeds']
```

---

## 🚨 If Still Stuck

Provide:

1. **Backend API test result**
   ```bash
   curl -X GET "http://localhost:5140/Dashboard/Stats" \
     -H "Authorization: Bearer TOKEN"
   
   [PASTE FULL RESPONSE HERE]
   ```

2. **Flutter console output** (from `flutter run -v`)
   ```
   [PASTE 50+ LINES HERE]
   
   Look for lines with: 📡, ✅, 📊, 🎨
   ```

3. **Screenshot of UI**
   - What does "Available Beds" show?

4. **Confirmation**
   - Did you restart backend after code changes?
   - Did you flutter clean?
   - Which step are you on?

Then I can pinpoint exact issue! 🔍

---

## 📚 Reference Documents

| Document | Purpose |
|----------|---------|
| `AVAILABLE_BEDS_VERIFICATION_CHECKLIST.md` | Verify all files updated |
| `AVAILABLE_BEDS_DEBUG_GUIDE.md` | Understand debug logs |
| `QUICK_API_TEST.md` | Test backend without Flutter |
| `AVAILABLE_BEDS_IMPLEMENTATION_SUMMARY.md` | Overview of changes |

---

## ✅ Final Checklist

Before giving up:

- [ ] Backend restarted (`dotnet run`) ✅
- [ ] API test shows `"availableBeds": 79` ✅
- [ ] Flutter clean + rebuild (`flutter clean && flutter pub get`) ✅
- [ ] Running with verbose (`flutter run -v`) ✅
- [ ] Can see debug logs (📡, 📊, 🎨) in console ✅
- [ ] Screenshot shows "Available Beds: 79" ✅

---

## 💡 Pro Tips

1. **Keep backend terminal visible** — See if any errors on restart
2. **Watch for 404 errors** — Backend might not have /Dashboard/Stats route
3. **Check auth token** — 401 Unauthorized means token invalid
4. **Use `jq` for JSON formatting** — `curl ... | jq .` makes it readable
5. **Don't cache values** — Make sure app fetches fresh data each time

---

## 🎯 Expected Final Result

```
Dashboard shows:
✅ Occupied Beds: 5
✅ Available Beds: 79  (NOT 0!)
✅ Total Patients: 23
✅ Total Doctors: 3
✅ Total Nurses: 1
✅ Total Requests: 25

Math check: 5 + 79 = 84 ✓
```

Good luck! 🚀
