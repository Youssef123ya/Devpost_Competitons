# ✅ Two-Level OCR Recording System - COMPLETE FIX

## 📋 Overview

The system now has **two separate, independent jobs**:

### Job 1: Every 5 seconds → AI Alert ⚡
- Extract OCR reading from camera
- Send to AI model to check patient danger level
- If danger → backend sends alert to doctor & nurse
- **NO database save**

### Job 2: Every hour (at exact hour) → Database 💾
- At 1:00:00 AM → save current reading to DB
- At 2:00:00 AM → save current reading to DB
- At 3:00:00 AM → save current reading to DB
- ... up to 12 (noon)
- **One save per hour per patient**

---

## 🔧 Implementation Details

### Step 1: Python OCR (camera_ocr_complete.py)

#### Two-Timer Logic

```python
# Track last recorded hour per patient
last_db_hour = {}  # {patient_id: last_hour_saved}

def send_to_ai_alert(ocr_results, patient_id='default'):
    """
    JOB 1: Every 5 seconds → AI Alert
    Send current readings to AI model
    AI checks if patient is in danger
    If danger → backend sends alert
    Do NOT save to database
    """
    # Extract vital signs from OCR
    hr = validate_value('HR', ocr_results.get('HR', {}).get('value'))
    spo2 = validate_value('SpO2', ocr_results.get('SpO2', {}).get('value'))
    
    # Prepare AI alert payload
    payload = {
        'patientId': patient_id,
        'heartRate': hr,
        'spO2': spo2,
        # ... other vitals
    }
    
    # Send to AI endpoint
    backend_integration.send_to_ai_alert(payload)


def send_to_database_at_hour(ocr_results, patient_id='default'):
    """
    JOB 2: Every hour → Database
    Save at exact hour start (1:00, 2:00, 3:00, ... 12:00)
    Only save hours 1-12, not 0, 13-23
    One save per hour per patient
    """
    global last_db_hour
    
    now = datetime.now()
    current_hour = now.hour
    
    # Only save hours 1-12
    if not (1 <= current_hour <= 12):
        return False  # Skip hours 0, 13-23
    
    # Initialize if new patient
    if patient_id not in last_db_hour:
        last_db_hour[patient_id] = -1
    
    # Check if this hour is different from last saved
    if current_hour == last_db_hour[patient_id]:
        return False  # Already saved this hour
    
    # New hour started → save to database
    last_db_hour[patient_id] = current_hour
    
    # Extract vital signs
    hr = validate_value('HR', ocr_results.get('HR', {}).get('value'))
    spo2 = validate_value('SpO2', ocr_results.get('SpO2', {}).get('value'))
    # ...
    
    # Prepare database payload
    payload = {
        'patientId': patient_id,
        'heartRate': hr,
        'spO2': spo2,
        'recordedAt': datetime.utcnow().isoformat() + 'Z'
        # ... other vitals
    }
    
    # Send to backend database
    response = backend_integration.send_to_backend(payload)
    if response:
        print(f"[+] 💾 Hour {current_hour} recording saved to database")
    return response
```

#### OCR Loop Integration

```python
def capture_and_ocr():
    """Main OCR loop"""
    while True:
        # ... camera capture ...
        
        # OCR every 5 frames (~5 seconds at 30fps)
        if frame_count % 5 == 0:
            ocr_results = ocr_frame(frame)
            
            # Get patient ID
            patient_id = backend_integration.patient_id
            
            # ═══════════════════════════════
            # JOB 1: Every 5 seconds → AI
            # ═══════════════════════════════
            send_to_ai_alert(ocr_results, patient_id)
            
            # ═══════════════════════════════
            # JOB 2: Every hour → Database
            # ═══════════════════════════════
            send_to_database_at_hour(ocr_results, patient_id)
        
        frame_count += 1
        time.sleep(0.01)
```

---

### Step 2: Backend Integration (backend_integration.py)

#### New Method: send_to_ai_alert()

```python
def send_to_ai_alert(self, vital_signs: Dict) -> bool:
    """
    Send vital signs to AI Alert endpoint
    Endpoint: POST /AIAlert/Predict
    
    Called every 5 seconds
    AI checks if patient is in danger
    Backend sends alert if needed
    """
    try:
        # Ensure valid JWT token
        if not self.token:
            if not self.login():
                return False
        
        # Prepare payload
        payload = vital_signs.copy()
        if not payload.get('patientId'):
            payload['patientId'] = self.patient_id or 'default'
        
        # Send to AI endpoint
        response = requests.post(
            f"{self.backend_api_url}/AIAlert/Predict",
            json=payload,
            headers=self.headers,
            timeout=10
        )
        
        # Handle token expiration
        if response.status_code == 401:
            if self.login():
                # Retry with new token
                response = requests.post(
                    f"{self.backend_api_url}/AIAlert/Predict",
                    json=payload,
                    headers=self.headers,
                    timeout=10
                )
            else:
                return False
        
        # Check result
        if response.status_code in [200, 201, 202]:
            result = response.json()
            # Log if alert level detected
            if result.get('data', {}).get('alertLevel'):
                logger.warning(f"AI ALERT: Level={result['data']['alertLevel']}")
            return True
        return False
        
    except Exception as e:
        logger.warning(f"AI Alert error: {e}")
        return False
```

---

### Step 3: Backend C# (VitalSignService.cs) - ✅ Already Correct

The service already has **duplicate prevention**:

```csharp
public async Task<VitalSignDto> Add(VitalSignDto dto)
{
    // Calculate hour boundaries
    var hourStart = new DateTime(
        recordedAtUtc.Year,
        recordedAtUtc.Month,
        recordedAtUtc.Day,
        recordedAtUtc.Hour,
        0, 0, DateTimeKind.Utc);
    
    var hourEnd = hourStart.AddHours(1);
    
    // Check if record already exists this hour
    var exists = await _unitOfWork.VitalSign.AnyAsync(v =>
        v.PatientId == dto.PatientId &&
        v.RecordedAt >= hourStart &&
        v.RecordedAt < hourEnd);
    
    if (exists == true)
    {
        // Return existing record (no duplicate)
        var existing = await _unitOfWork.VitalSign.FindAsync(...);
        return _mapper.Map<VitalSignDto>(existing);
    }
    
    // New hour → save new record
    var entity = _mapper.Map<VitalSign>(dto);
    _unitOfWork.VitalSign.Add(entity);
    await _unitOfWork.SaveAsync();
    return _mapper.Map<VitalSignDto>(entity);
}
```

**What it does:**
1. Calculates hour boundaries (1:00-1:59, 2:00-2:59, etc.)
2. Checks if record exists in that hour
3. If yes → returns existing (no new entry)
4. If no → saves new record
5. Prevents duplicates automatically ✅

---

### Step 4: Flutter Display (vital_signs_screen.dart) - ✅ Already Correct

The Flutter screen already:
1. Uses **local time** for matching
2. Shows columns for hours **1-12 (1 AM to 12 PM)**
3. Handles timezone correctly

```dart
List<VitalRowData> _processData(List<VitalSignModel> allSigns) {
    // ... 
    
    // Convert to local time
    final local = record.recordedAt.toLocal();
    final recordHour = local.hour;
    
    // Only accept hours 1-12
    if (recordHour < 1 || recordHour > 12) {
        continue;
    }
    
    // Store by hour
    recordsByHour[recordHour] = record;
    
    // ...
    
    // Display columns for hours 1-12
    final hours = List.generate(12, (index) => index + 1);
    
    return [
        VitalRowData(
            label: 'HR',
            cells: hours.map((hour) {
                final record = recordsByHour[hour];
                // Display reading at that hour, or "—"
                return VitalCell(
                    time: '$hour AM',
                    value: record != null ? '${record.heartRate}' : '—',
                );
            }).toList(),
        ),
        // ... other vital signs
    ];
}
```

---

## 🧪 Expected Behavior

### Example: Record at 5:00 AM

```
Time: 5:00:00 AM
─────────────────────
OCR reads: HR=93, SpO2=72, NBP=120/80, ...

Job 1 (AI Alert):
  ✅ Sends to POST /AIAlert/Predict
  ✅ AI checks if patient is in danger
  ✅ Backend alerts doctor/nurse if needed
  ❌ Does NOT save to database

Job 2 (Database):
  ✅ Checks current_hour (5)
  ✅ Checks last_db_hour[patient_id] (-1 initially)
  ✅ New hour: 5 != -1 → save to DB
  ✅ Updates last_db_hour[patient_id] = 5
  ✅ Saves: HR=93, SpO2=72, NBP=120/80 at 5:00 AM

Database result:
  📊 VitalSigns table
     PatientId | Hour | HR | SpO2 | NBP      | RecordedAt
     ─────────────────────────────────────────────────────
     patient-1 |  5  | 93 | 72   | 120/80   | 5:00 AM
```

### Example: Record at 5:00:05 AM (5 seconds later)

```
Time: 5:00:05 AM
──────────────────────
OCR reads: HR=95, SpO2=71, NBP=121/81, ...

Job 1 (AI Alert):
  ✅ Sends to POST /AIAlert/Predict
  ✅ AI checks if patient is in danger
  ✅ Backend alerts if needed
  
Job 2 (Database):
  ✅ Checks current_hour (5)
  ✅ Checks last_db_hour[patient_id] (5)
  ✅ Same hour: 5 == 5 → skip DB save
  ✅ No new database entry

Result:
  🚫 NOT saved to database (already saved this hour)
```

### Example: Record at 6:00:00 AM

```
Time: 6:00:00 AM
──────────────────────
OCR reads: HR=88, SpO2=73, NBP=119/79, ...

Job 1 (AI Alert):
  ✅ Sends to POST /AIAlert/Predict
  
Job 2 (Database):
  ✅ Checks current_hour (6)
  ✅ Checks last_db_hour[patient_id] (5)
  ✅ New hour: 6 != 5 → save to DB
  ✅ Updates last_db_hour[patient_id] = 6
  ✅ Saves new record

Database result:
  📊 VitalSigns table
     PatientId | Hour | HR | SpO2 | NBP      | RecordedAt
     ─────────────────────────────────────────────────────
     patient-1 |  5  | 93 | 72   | 120/80   | 5:00 AM
     patient-1 |  6  | 88 | 73   | 119/79   | 6:00 AM  ← NEW
```

### Flutter Display

```
Hours:        1AM  2AM  3AM  4AM  5AM  6AM  7AM  8AM  ...
HR:          [ — ][ — ][ — ][ — ][ 93 ][ 88 ][ — ][ — ]
SpO2:        [ — ][ — ][ — ][ — ][ 72 ][ 73 ][ — ][ — ]
NBP:         [ — ][ — ][ — ][ — ][120][119 ][ — ][ — ]

✅ Shows HR=93 at 5 AM column
✅ Shows HR=88 at 6 AM column
✅ Empty dashes for hours with no data
```

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ OCR Loop (Every 5 seconds)                              │
│ capture_and_ocr() in camera_ocr_complete.py             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │ Extract vitals from OCR  │
        │ HR, SpO2, NBP, Temp...   │
        └──────────────────────────┘
                       │
                ┌──────┴──────┐
                │             │
                ▼             ▼
         ┌──────────────┐  ┌──────────────────┐
         │ JOB 1: AI    │  │ JOB 2: Database  │
         │ ALERT        │  │ at exact hour    │
         │              │  │                  │
         │ Every 5 sec  │  │ Once per hour    │
         │ Always send  │  │ 1:00, 2:00...    │
         └──────┬───────┘  └────────┬─────────┘
                │                   │
                ▼                   ▼
    ┌─────────────────────┐ ┌──────────────────────┐
    │ POST /AIAlert/      │ │ POST /VitalSign/     │
    │ Predict             │ │ Add                  │
    │                     │ │                      │
    │ Backend checks if   │ │ Backend checks:      │
    │ patient in danger   │ │ - Is this hour new?  │
    │                     │ │ - If yes → save      │
    │ If danger:          │ │ - If no → skip       │
    │ Send alert to       │ │                      │
    │ doctor/nurse        │ │ VitalSignService.Add │
    │                     │ │ has duplicate check  │
    └──────────┬──────────┘ └──────────┬───────────┘
               │                       │
               ▼                       ▼
        ┌─────────────┐        ┌──────────────┐
        │ Alert sent  │        │ Record saved │
        │ (if danger) │        │ in DB        │
        └─────────────┘        └──────────────┘
```

---

## 📝 Changes Summary

### Python (camera_ocr_complete.py)
- ✅ Added `last_db_hour` tracking per patient
- ✅ Replaced `send_vital_signs_to_backend()` with two functions:
  - `send_to_ai_alert()` - for AI predictions (every 5 sec)
  - `send_to_database_at_hour()` - for DB saves (hourly)
- ✅ Updated `capture_and_ocr()` loop to call both functions
- ✅ Only saves to DB at hours 1-12
- ✅ Prevents duplicate saves in same hour

### Python (backend_integration.py)
- ✅ Added `send_to_ai_alert()` method
- ✅ Sends to `POST /AIAlert/Predict` endpoint
- ✅ JWT token auto-refresh on 401
- ✅ Graceful error handling

### Backend C# (VitalSignService.cs)
- ✅ Already has duplicate prevention
- ✅ Checks hour boundaries
- ✅ Returns existing record if already saved
- ✅ No code changes needed

### Flutter (vital_signs_screen.dart)
- ✅ Already uses local time
- ✅ Already displays 1-12 hours (1 AM to 12 PM)
- ✅ Already handles timezone correctly
- ✅ No code changes needed

---

## 🧪 How to Test

### Test at Specific Times

```bash
# Method 1: Test with hardcoded time (for development)
# Modify camera_ocr_complete.py:
now = datetime(2026, 6, 10, 5, 0, 0)  # Set to 5:00 AM
current_hour = now.hour  # Returns 5

# Method 2: Wait for real hours
# Run system at exactly 5:00 AM, 6:00 AM, 7:00 AM, etc.
```

### Verify AI Alert

```bash
curl -X POST http://localhost:5140/AIAlert/Predict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "patientId": "your-patient-id",
    "heartRate": 120,
    "spO2": 80,
    "bloodPressure": 150,
    "temperature": 38.5,
    "etCO2": 35,
    "pulse": 120,
    "respiratoryRate": 22
  }'

# Response shows alert level (0-3) if danger detected
```

### Verify Database Save

```bash
# Check database at exact hour (e.g., 5:00:00 AM)
# Query VitalSigns table:
SELECT * FROM VitalSigns 
WHERE PatientId = 'your-patient-id' 
ORDER BY RecordedAt DESC;

# Should show one record per hour:
# 5:00 AM - HR=93
# 6:00 AM - HR=88
# 7:00 AM - HR=91
# etc.
```

### Verify Flutter Display

```
1. Open vital_signs_screen.dart
2. Navigate to patient vital signs
3. Should show:
   - Columns for 1 AM through 12 PM
   - Data filled only for hours with saved records
   - Local time (not UTC)
4. Check at different dates and times
```

---

## 🎯 Key Points

1. **Two Separate Systems**
   - AI Alert: Every 5 seconds (continuous)
   - Database: Once per hour (at exact hour)

2. **Duplicate Prevention**
   - Backend checks hour boundaries
   - Only saves if new hour
   - Returns existing if already saved

3. **Hours 1-12 Only**
   - Not 0 (midnight)
   - Not 13-23 (night hours)
   - 1 AM = hour 1
   - 12 PM = hour 12

4. **Timezone Correct**
   - Flutter uses local time
   - Python saves UTC
   - Backend converts on read
   - Display is local

5. **Patient-Specific Tracking**
   - `last_db_hour` dict tracks per patient
   - Multiple patients can be monitored
   - Each patient has independent hour tracking

---

## 📞 Support

If experiencing issues:

1. Check `last_db_hour` is tracking correctly
2. Verify hours are 1-12 (not 0, 13-23)
3. Check JWT token validity in headers
4. Verify database has hour boundaries
5. Test Flask/backend connectivity

