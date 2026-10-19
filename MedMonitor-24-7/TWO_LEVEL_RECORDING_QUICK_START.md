# ⚡ QUICK START - Two-Level Recording System

## What Changed?

### The Problem
- OCR system was mixing AI alerts with database saves
- Unclear when data gets saved to database
- Potential duplicate saves in same hour

### The Solution
**Two separate, independent jobs:**
1. **JOB 1:** Every 5 seconds → Send to AI (continuous)
2. **JOB 2:** Every hour → Save to database (once per hour)

---

## How It Works

### Every 5 Seconds (Job 1)
```
Camera captures frame
    ↓
OCR extracts vitals: HR=93, SpO2=72, ...
    ↓
send_to_ai_alert()
    ↓
POST /AIAlert/Predict
    ↓
AI checks if patient is in danger
    ↓
IF danger → backend sends alert to doctor
NO database save
```

### At Exact Hour (Job 2)
```
Time: 5:00:00 AM (exactly when hour starts)
    ↓
send_to_database_at_hour()
    ↓
Check: hour (5) != last_saved_hour (1) ?
    ↓
YES → save to database (first time this hour)
NO → skip (already saved this hour)
    ↓
POST /VitalSign/Add
    ↓
Backend checks if record exists for this hour
    ↓
If exists → return existing
If new → save new record
```

---

## Code Files

### 1. camera_ocr_complete.py
```python
# Global tracking
last_db_hour = {}  # {patient_id: last_hour_saved}

# Two functions
def send_to_ai_alert(ocr_results, patient_id):
    # Send to AI every 5 seconds
    backend_integration.send_to_ai_alert(payload)

def send_to_database_at_hour(ocr_results, patient_id):
    # Save to DB once per hour (hours 1-12)
    if 1 <= current_hour <= 12:
        if current_hour != last_db_hour[patient_id]:
            backend_integration.send_to_backend(payload)

# In OCR loop:
send_to_ai_alert(ocr_results, patient_id)
send_to_database_at_hour(ocr_results, patient_id)
```

### 2. backend_integration.py
```python
def send_to_ai_alert(vital_signs):
    # POST /AIAlert/Predict
    # Called every 5 seconds by camera_ocr_complete.py

def send_to_backend(vital_signs):
    # POST /VitalSign/Add
    # Called once per hour by camera_ocr_complete.py
    # (Already existed, not changed)
```

### 3. Backend (VitalSignService.cs)
```csharp
public async Task<VitalSignDto> Add(VitalSignDto dto)
{
    // Check if record already exists for this hour
    // If exists → return existing
    // If new → save new
}
```
**No changes needed - duplicate prevention already works!**

### 4. Flutter (vital_signs_screen.dart)
```dart
// Uses local time to match records to hours
final local = record.recordedAt.toLocal();
final recordHour = local.hour;  // 1-12

// Displays 12 columns for hours 1-12
final hours = List.generate(12, (index) => index + 1);
```
**No changes needed - timezone handling already correct!**

---

## Testing

### Test Job 1 (AI Alert - Every 5 seconds)
```bash
# Check logs for message every 5 seconds:
tail -f camera_ocr.log | grep "AI Alert"

# Or test endpoint directly:
curl -X POST http://localhost:5140/AIAlert/Predict \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "patientId": "patient-1",
    "heartRate": 120,
    "spO2": 80,
    ...
  }'
```

### Test Job 2 (Database - Every Hour)
```bash
# Wait for exact hour start (1:00 AM, 2:00 AM, etc.)
# Check database:
SELECT * FROM VitalSigns 
WHERE PatientId = 'patient-1' 
ORDER BY RecordedAt DESC 
LIMIT 5;

# Should show:
# RecordedAt    HR   SpO2  
# 5:00 AM      93   72
# 6:00 AM      88   73
# 7:00 AM      91   74

# One record per hour only!
```

### Test Flutter Display
```
1. Open app
2. Go to Vital Signs screen
3. See columns: 1AM, 2AM, 3AM, ... 12PM
4. Data appears only at hours with saved records
5. Time matches local timezone
```

---

## Key Details

### Hours
- **Saved hours:** 1-12 (1 AM to 12 PM)
- **Skipped hours:** 0 (midnight), 13-23 (afternoon/evening)
- Why? Business requirement - only ICU rounds 1AM-12PM

### Duplicate Prevention
**Python side:**
- Track `last_db_hour[patient_id]`
- Skip if hour hasn't changed

**Backend side:**
- Check hour boundaries in database
- Return existing if found
- Save new if not found

**Double protection = zero duplicates!**

### Patient ID
- Loaded from `ocr_config.json`
- Falls back to first occupied bed
- Each patient tracked independently

---

## Common Issues

### Issue: Database shows duplicates
**Solution:**
1. Check VitalSignService.Add() is being called
2. Verify backend has hour-boundary check
3. Check last_db_hour is initializing correctly

### Issue: AI alerts not sending
**Solution:**
1. Verify JWT token is valid
2. Check /AIAlert/Predict endpoint exists
3. Check network connectivity
4. Verify patient_id is correct

### Issue: Flutter shows no data
**Solution:**
1. Verify records were saved at hour boundaries
2. Check timezone settings (should use local)
3. Verify patient_id matches between systems
4. Check database has records

### Issue: Wrong hours displayed
**Solution:**
1. Verify hours 1-12 range check in code
2. Check Flutter uses local time (toLocal())
3. Verify database records have correct timestamps
4. Check timezone conversion on backend

---

## Files Updated

```
✅ camera_ocr_complete.py
   - Added last_db_hour tracking
   - Added send_to_ai_alert() function
   - Added send_to_database_at_hour() function
   - Updated OCR loop

✅ backend_integration.py
   - Added send_to_ai_alert() method

ℹ️  VitalSignService.cs
    - No changes (already has duplicate prevention)

ℹ️  vital_signs_screen.dart
    - No changes (already uses local time)
```

---

## Verification Checklist

- [ ] camera_ocr_complete.py has both functions
- [ ] backend_integration.py has send_to_ai_alert()
- [ ] OCR loop calls both functions
- [ ] Log shows AI alert every 5 seconds
- [ ] Log shows DB save once per hour
- [ ] Database shows one record per hour
- [ ] Flutter shows 12 columns (1 AM - 12 PM)
- [ ] Data appears at correct hour columns
- [ ] No duplicate records in database

---

## Support

**Questions?** Check:
1. `TWO_LEVEL_RECORDING_SYSTEM_COMPLETE.md` - Full explanation
2. `TWO_LEVEL_RECORDING_CODE_CHANGES.md` - Exact code changes
3. Logs in `camera_ocr.log` - See what's happening
4. Database directly - Count records per hour

