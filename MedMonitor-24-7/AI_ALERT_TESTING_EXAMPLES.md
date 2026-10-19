# API Testing Examples - cURL & Postman

## 🌐 Base URL
```
http://localhost:5140
```

## 🔑 Authentication
All requests (except Health) require Bearer token in Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

---

## 📝 cURL Examples

### 1. Health Check (No Auth Required)
```bash
curl -X GET "http://localhost:5140/AIAlert/Health" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "AI Alert Prediction Service",
  "version": "1.0.0",
  "timestamp": "2024-05-19T21:15:30.123456Z"
}
```

---

### 2. Predict - Normal Patient
```bash
curl -X POST "http://localhost:5140/AIAlert/Predict" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "heartRate": 75,
    "spO2": 97.5,
    "systolicBP": 120,
    "diastolicBP": 76,
    "temperature": 37.1,
    "fallDetected": false
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "alertLevel": "Normal",
    "confidence": 95.0,
    "reason": "All vital signs are within normal range.",
    "predictionTime": "2024-05-19T21:16:45.123456Z"
  }
}
```

---

### 3. Predict - Warning Alert (Mild Hypoxemia)
```bash
curl -X POST "http://localhost:5140/AIAlert/Predict" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "heartRate": 88,
    "spO2": 92.0,
    "systolicBP": 125,
    "diastolicBP": 82,
    "temperature": 37.3,
    "fallDetected": false
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "alertLevel": "Warning",
    "confidence": 88.0,
    "reason": "Mild oxygen saturation concern: SpO2 92% (Optimal: 95-100%).",
    "predictionTime": "2024-05-19T21:17:10.123456Z"
  }
}
```

---

### 4. Predict - Warning Alert (Elevated Heart Rate)
```bash
curl -X POST "http://localhost:5140/AIAlert/Predict" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "heartRate": 125,
    "spO2": 98,
    "systolicBP": 120,
    "diastolicBP": 80,
    "temperature": 37.0,
    "fallDetected": false
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "alertLevel": "Warning",
    "confidence": 85.0,
    "reason": "Elevated heart rate: 125 bpm (Normal: 60-100 bpm).",
    "predictionTime": "2024-05-19T21:17:35.123456Z"
  }
}
```

---

### 5. Predict - Warning Alert (High Fever)
```bash
curl -X POST "http://localhost:5140/AIAlert/Predict" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "heartRate": 80,
    "spO2": 98,
    "systolicBP": 120,
    "diastolicBP": 80,
    "temperature": 38.8,
    "fallDetected": false
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "alertLevel": "Warning",
    "confidence": 80.0,
    "reason": "Elevated temperature: 38.8°C (Normal: 36.5-37.5°C).",
    "predictionTime": "2024-05-19T21:18:00.123456Z"
  }
}
```

---

### 6. Predict - Critical Alert (Severe Hypoxemia)
```bash
curl -X POST "http://localhost:5140/AIAlert/Predict" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "heartRate": 80,
    "spO2": 82.0,
    "systolicBP": 120,
    "diastolicBP": 80,
    "temperature": 37.0,
    "fallDetected": false
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "alertLevel": "Critical",
    "confidence": 98.5,
    "reason": "Critical hypoxemia detected: SpO2 82% (Normal: 95-100%).",
    "predictionTime": "2024-05-19T21:18:25.123456Z"
  }
}
```

---

### 7. Predict - Critical Alert (Severe Tachycardia)
```bash
curl -X POST "http://localhost:5140/AIAlert/Predict" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "heartRate": 155,
    "spO2": 98,
    "systolicBP": 120,
    "diastolicBP": 80,
    "temperature": 37.0,
    "fallDetected": false
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "alertLevel": "Critical",
    "confidence": 97.0,
    "reason": "Severe tachycardia detected: Heart Rate 155 bpm (Normal: 60-100 bpm).",
    "predictionTime": "2024-05-19T21:18:50.123456Z"
  }
}
```

---

### 8. Predict - Critical Alert (Multiple Conditions)
```bash
curl -X POST "http://localhost:5140/AIAlert/Predict" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "heartRate": 160,
    "spO2": 80,
    "systolicBP": 70,
    "diastolicBP": 45,
    "temperature": 40.5,
    "fallDetected": false
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "alertLevel": "Critical",
    "confidence": 98.0,
    "reason": "Critical hypoxemia detected: SpO2 80% (Normal: 95-100%). Severe tachycardia detected: Heart Rate 160 bpm (Normal: 60-100 bpm). Severe hypotension detected: Systolic BP 70 mmHg (Normal: 90-120 mmHg). High fever detected: Temperature 40.5°C (Critical: >39.5°C).",
    "predictionTime": "2024-05-19T21:19:15.123456Z"
  }
}
```

---

### 9. Predict - Critical Alert (Fall + Abnormal Vitals)
```bash
curl -X POST "http://localhost:5140/AIAlert/Predict" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "heartRate": 135,
    "spO2": 88.5,
    "systolicBP": 110,
    "diastolicBP": 75,
    "temperature": 37.5,
    "fallDetected": true
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "alertLevel": "Critical",
    "confidence": 94.5,
    "reason": "Mild oxygen saturation concern: SpO2 88.5% (Optimal: 95-100%). Patient fall detected with abnormal vital response.",
    "predictionTime": "2024-05-19T21:19:40.123456Z"
  }
}
```

---

### 10. Predict - Warning Alert (Fall + Normal Vitals)
```bash
curl -X POST "http://localhost:5140/AIAlert/Predict" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "heartRate": 85,
    "spO2": 96,
    "systolicBP": 120,
    "diastolicBP": 80,
    "temperature": 37.0,
    "fallDetected": true
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "alertLevel": "Warning",
    "confidence": 75.0,
    "reason": "Patient fall detected. Monitor closely for delayed symptoms.",
    "predictionTime": "2024-05-19T21:20:05.123456Z"
  }
}
```

---

### 11. Invalid Request - Missing Required Field
```bash
curl -X POST "http://localhost:5140/AIAlert/Predict" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "heartRate": 75,
    "spO2": 98,
    "diastolicBP": 76,
    "temperature": 37.1
  }'
```

**Expected Response (400):**
```json
{
  "message": "Invalid vital signs data",
  "errors": [
    "SystolicBP is required"
  ]
}
```

---

### 12. Invalid Request - Out of Range
```bash
curl -X POST "http://localhost:5140/AIAlert/Predict" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "heartRate": 75,
    "spO2": 150,
    "systolicBP": 120,
    "diastolicBP": 76,
    "temperature": 37.1
  }'
```

**Expected Response (400):**
```json
{
  "message": "Invalid vital signs data",
  "errors": [
    "SpO2 must be between 0 and 100"
  ]
}
```

---

### 13. Unauthorized Request (Missing Token)
```bash
curl -X POST "http://localhost:5140/AIAlert/Predict" \
  -H "Content-Type: application/json" \
  -d '{
    "heartRate": 75,
    "spO2": 98,
    "systolicBP": 120,
    "diastolicBP": 76,
    "temperature": 37.1
  }'
```

**Expected Response (401):**
```json
{
  "message": "Unauthorized"
}
```

---

## 📮 Postman Collection

### Import Instructions
1. Open Postman
2. Click "Import"
3. Select "Raw Text"
4. Paste the collection below
5. Click "Import"

### Postman Collection JSON
```json
{
  "info": {
    "_postman_id": "ai-alert-api",
    "name": "AI Alert Prediction API",
    "description": "MedMonitor 24/7 - AI Alert Prediction API Collection",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/AIAlert/Health",
          "host": ["{{baseUrl}}"],
          "path": ["AIAlert", "Health"]
        }
      }
    },
    {
      "name": "Predict - Normal",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"heartRate\": 75, \"spO2\": 97.5, \"systolicBP\": 120, \"diastolicBP\": 76, \"temperature\": 37.1, \"fallDetected\": false}"
        },
        "url": {
          "raw": "{{baseUrl}}/AIAlert/Predict",
          "host": ["{{baseUrl}}"],
          "path": ["AIAlert", "Predict"]
        }
      }
    },
    {
      "name": "Predict - Warning (Low O2)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"heartRate\": 88, \"spO2\": 92.0, \"systolicBP\": 125, \"diastolicBP\": 82, \"temperature\": 37.3, \"fallDetected\": false}"
        },
        "url": {
          "raw": "{{baseUrl}}/AIAlert/Predict",
          "host": ["{{baseUrl}}"],
          "path": ["AIAlert", "Predict"]
        }
      }
    },
    {
      "name": "Predict - Critical (Severe Hypoxemia)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"heartRate\": 80, \"spO2\": 82.0, \"systolicBP\": 120, \"diastolicBP\": 80, \"temperature\": 37.0, \"fallDetected\": false}"
        },
        "url": {
          "raw": "{{baseUrl}}/AIAlert/Predict",
          "host": ["{{baseUrl}}"],
          "path": ["AIAlert", "Predict"]
        }
      }
    },
    {
      "name": "Predict - Critical (Multiple Issues)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"heartRate\": 160, \"spO2\": 80, \"systolicBP\": 70, \"diastolicBP\": 45, \"temperature\": 40.5, \"fallDetected\": false}"
        },
        "url": {
          "raw": "{{baseUrl}}/AIAlert/Predict",
          "host": ["{{baseUrl}}"],
          "path": ["AIAlert", "Predict"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5140"
    },
    {
      "key": "token",
      "value": "YOUR_JWT_TOKEN_HERE"
    }
  ]
}
```

### Setup Postman Variables
1. Go to "Manage Environments" (gear icon)
2. Create new environment "MedMonitor"
3. Add variables:
   - `baseUrl` = `http://localhost:5140`
   - `token` = Your JWT token from login endpoint

---

## 🧪 Testing Workflow

### Step 1: Get Health Status
```
GET /AIAlert/Health
```
Should return 200 with "healthy" status

### Step 2: Login & Get Token
```
POST /Login
```
Use existing auth endpoint to get JWT token

### Step 3: Test Normal Case
```
POST /AIAlert/Predict
```
With normal vital signs

### Step 4: Test Warning Cases
```
POST /AIAlert/Predict
```
With warning vital signs

### Step 5: Test Critical Cases
```
POST /AIAlert/Predict
```
With critical vital signs

### Step 6: Test Invalid Cases
```
POST /AIAlert/Predict
```
With invalid data

---

## 💡 Tips

1. **Set Bearer Token:** After login, copy the token to `token` variable
2. **Change Base URL:** If running on different server, update `baseUrl` variable
3. **Use Pre-request Scripts:** Add token refresh logic if needed
4. **Save Responses:** Use Postman tests to validate responses automatically
5. **Export Results:** Share collection with team for collaborative testing

---

## 📊 Quick Reference

| Alert Level | Condition | Confidence |
|------------|-----------|-----------|
| **CRITICAL** | SpO2 < 85 | 98.5% |
| **CRITICAL** | HR > 140 | 97.0% |
| **CRITICAL** | Systolic < 80 | 98.0% |
| **CRITICAL** | Temp > 39.5 | 96.5% |
| **WARNING** | SpO2 85-94 | 88.0% |
| **WARNING** | HR 100-140 | 85.0% |
| **WARNING** | Temp 37.8-39.5 | 80.0% |
| **NORMAL** | All normal | 95.0% |

---

## ✅ Success Criteria

- ✅ Health endpoint returns 200
- ✅ Normal case returns Alert: Normal
- ✅ Warning cases return Alert: Warning
- ✅ Critical cases return Alert: Critical
- ✅ Invalid requests return 400
- ✅ Unauthorized requests return 401
- ✅ All responses include confidence & reason

---

## 🐛 Troubleshooting

### 401 Unauthorized
- Missing Bearer token in header
- Token expired
- Invalid token format

**Solution:** Get new token from login endpoint

### 400 Bad Request
- Vital signs out of range
- Missing required field
- Invalid JSON format

**Solution:** Check error message and validate input data

### 500 Internal Error
- Server error
- Unexpected exception

**Solution:** Check server logs and contact support

---

Enjoy testing the AI Alert Prediction API! 🎉
