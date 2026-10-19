# Quick API Test — Check Backend Response Directly

## 🚀 Test Backend WITHOUT Flutter

### Step 1: Get Your Bearer Token
If you don't have a token, you can get one by logging in first:

```bash
# Login to get token
curl -X POST "http://localhost:5140/Auth/Login" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "admin@hospital.com",
    "password": "your_password"
  }'

# Response will include:
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# }

# Save this token (copy from response)
TOKEN="paste_the_token_here"
```

---

### Step 2: Call Dashboard API

#### Using cURL (Recommended)

```bash
TOKEN="your-token-here"

curl -X GET "http://localhost:5140/Dashboard/Stats" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

#### Using PowerShell (Windows)

```powershell
$token = "your-token-here"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$response = Invoke-RestMethod -Uri "http://localhost:5140/Dashboard/Stats" `
    -Method GET `
    -Headers $headers

$response | ConvertTo-Json
```

---

### Step 3: Check Response

#### Expected Response (✅ CORRECT):
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

✅ Check for:
- ✅ Field names are camelCase: `availableBeds` NOT `AvailableBeds`
- ✅ `availableBeds` value is NOT 0 (should be 79 or similar)
- ✅ `totalUnits` = 7
- ✅ `bedsPerUnit` = 12
- ✅ `totalBeds` = 84
- ✅ Calculation: `availableBeds = totalBeds - occupiedBeds` → `79 = 84 - 5` ✅

---

#### Wrong Response 1 (❌ WRONG — PascalCase):
```json
{
  "TotalUnits": 7,
  "BedsPerUnit": 12,
  "TotalBeds": 84,
  "OccupiedBeds": 5,
  "AvailableBeds": 0,
  ...
}
```

**Problem:** Field names are PascalCase, not camelCase  
**Solution:** Check Program.cs line 52 has `JsonNamingPolicy.CamelCase`

---

#### Wrong Response 2 (❌ WRONG — availableBeds = 0):
```json
{
  "totalUnits": 7,
  "bedsPerUnit": 12,
  "totalBeds": 84,
  "occupiedBeds": 5,
  "availableBeds": 0,
  ...
}
```

**Problem:** availableBeds is still 0 (wrong calculation)  
**Solution:** 
- Check DashboardController.cs has: `int availableBeds = totalBeds - occupiedBeds;`
- Restart backend: `dotnet run`

---

#### Wrong Response 3 (❌ WRONG — wrapped in "data"):
```json
{
  "data": {
    "totalUnits": 7,
    "bedsPerUnit": 12,
    "totalBeds": 84,
    "occupiedBeds": 5,
    "availableBeds": 79,
    ...
  }
}
```

**Problem:** Response wrapped in data envelope  
**Solution:** Code should handle this, but check if `Ok(result)` is being returned directly

---

## 🔧 Using Postman (Visual Tool)

1. **Create New Request**
   - Type: GET
   - URL: `http://localhost:5140/Dashboard/Stats`

2. **Add Authorization**
   - Go to "Authorization" tab
   - Type: Bearer Token
   - Token: `paste_your_token_here`

3. **Send Request**
   - Click "Send"
   - Watch "Response" tab

4. **Check Response**
   - Status: 200 OK ✅
   - Body has `"availableBeds": 79` (not 0)
   - Field names are camelCase

---

## 📋 Testing Script

### Create file: test_api.sh

```bash
#!/bin/bash

# Step 1: Get token
echo "🔐 Getting authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:5140/Auth/Login" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "admin@hospital.com",
    "password": "YourPassword123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Got token: ${TOKEN:0:20}..."

# Step 2: Call Dashboard API
echo ""
echo "📊 Calling Dashboard/Stats..."
DASHBOARD=$(curl -s -X GET "http://localhost:5140/Dashboard/Stats" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$DASHBOARD" | jq '.'

# Step 3: Check key values
echo ""
echo "🔍 Checking values..."
AVAILABLE=$(echo "$DASHBOARD" | jq '.availableBeds')
OCCUPIED=$(echo "$DASHBOARD" | jq '.occupiedBeds')
TOTAL=$(echo "$DASHBOARD" | jq '.totalBeds')

echo "Occupied Beds: $OCCUPIED"
echo "Available Beds: $AVAILABLE"
echo "Total Beds: $TOTAL"

if [ "$AVAILABLE" = "0" ]; then
  echo "❌ ERROR: Available Beds is 0!"
else
  echo "✅ SUCCESS: Available Beds is $AVAILABLE"
fi

if [ "$((OCCUPIED + AVAILABLE))" = "$TOTAL" ]; then
  echo "✅ SUCCESS: Occupied ($OCCUPIED) + Available ($AVAILABLE) = Total ($TOTAL)"
else
  echo "❌ ERROR: Calculation wrong! $OCCUPIED + $AVAILABLE ≠ $TOTAL"
fi
```

### Run it:
```bash
chmod +x test_api.sh
./test_api.sh
```

---

## 🎯 What Should Happen

1. ✅ Get auth token successfully
2. ✅ Call Dashboard/Stats endpoint
3. ✅ Response status 200 OK
4. ✅ Response has all fields (totalUnits, bedsPerUnit, etc.)
5. ✅ availableBeds > 0 (NOT 0)
6. ✅ availableBeds + occupiedBeds = totalBeds (math checks out)
7. ✅ Field names are camelCase

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Token is invalid or expired → Re-login and get new token |
| 404 Not Found | API endpoint doesn't exist → Check /Dashboard/Stats route |
| 500 Internal Server Error | Backend error → Check backend console for error message |
| Response has `"AvailableBeds"` (PascalCase) | Program.cs missing JsonNamingPolicy.CamelCase → Add it and restart |
| `"availableBeds": 0` | DashboardController using old calculation → Update code and restart |
| Response wrapped in `"data"` object | Check if Ok(result) or returning wrapped response → Verify code |

---

## ✅ Success = 

```json
{
  "totalUnits": 7,
  "bedsPerUnit": 12,
  "totalBeds": 84,
  "occupiedBeds": 5,
  "availableBeds": 79,          ✅ NOT 0!
  ...
}
```

And calculation: `79 = 84 - 5` ✅
