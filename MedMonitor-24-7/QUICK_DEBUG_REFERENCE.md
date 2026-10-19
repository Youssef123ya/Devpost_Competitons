# 🔍 Flutter Notification Debug - Quick Reference

## What to Do

### 1️⃣ Before Testing

```sql
-- Open database and run this to get your user ID:
SELECT TOP 5 Id, UserName FROM Users WHERE Role = 2;  -- Doctors
```

**Copy the doctor ID you'll login with.**

---

### 2️⃣ Start Flutter App

```powershell
cd "c:\PROJECTFINAL-NUB\fiels project\med_monitor\med_monitor"
& "C:\PROJECTFINAL-NUB\flutter_windows_3.41.9-stable\flutter\bin\flutter.bat" run -d edge
```

**Keep the Debug Console/Terminal visible.**

---

### 3️⃣ Login with Doctor Account

Watch for these logs:

✅ **EXPECTED AFTER LOGIN:**
```
🟣 [AuthProvider] Starting SignalR connection after login...
🔴 [SignalR] startConnection() called
🔴 [SignalR] Base URL: http://192.168.1.4:5140
🔴 [SignalR] Token exists: true
🔴 [SignalR] ✅ CONNECTED SUCCESSFULLY
🔴 [SignalR] Connection state: Connected
```

❌ **IF YOU DON'T SEE THESE:**
- SignalR connection is failing
- Check: Is backend running? Is URL correct? Is IP reachable?

---

### 4️⃣ Navigate to Doctor Home Screen

✅ **EXPECTED:**
```
🟡 [DoctorHomeScreen.initState] DoctorHomeScreen initialized
🟡 [DoctorHomeScreen.initState] Current doctor: DoctorName, ID: <YOUR_ID>
🟡 [DoctorHomeScreen.build] Unread notifications: 0
```

---

### 5️⃣ Trigger AI Alert (from OCR)

**Run this command:**
```bash
curl -X POST "http://192.168.1.4:5140/AIAlert/Predict?patientId=12345&patientName=Ahmed" \
  -H "Content-Type: application/json" \
  -d '{"heartRate":150,"spo2":80,"systolic":160,"diastolic":100,"temperature":39}'
```

**Keep Flutter debug window open while running this.**

---

### 6️⃣ Watch for SignalR Event (CHECK IMMEDIATELY)

✅ **EXPECTED WITHIN 1-2 SECONDS:**
```
🟣 [SignalR Event] ReceiveTaskNotification EVENT RECEIVED!
🟣 [SignalR Event] Args length: 1
🟣 [SignalR Event] Parsed JSON: {...}
🟣 [SignalR Event] ✅ Notification created: title=AI Alert - Critical
```

❌ **IF NOT SEEN:**
- **Break Point A**: SignalR message did not reach Flutter
- Check backend logs: Is message being sent?
- Check user ID mapping in backend vs Flutter

---

### 7️⃣ Watch for Notification Added to Provider

✅ **EXPECTED NEXT:**
```
🔵 [NotificationProvider.addNotification] Called
🔵 [NotificationProvider.addNotification] Title: AI Alert - Critical
🔵 [NotificationProvider.addNotification] Current count before: 0
🔵 [NotificationProvider.addNotification] Current count after: 1
🔵 [NotificationProvider.addNotification] ✅ notifyListeners() called
```

❌ **IF NOT SEEN:**
- **Break Point B**: SignalR event received but not delivered to NotificationProvider
- Check: Can context access provider?

---

### 8️⃣ Watch for UI Rebuild

✅ **EXPECTED LAST:**
```
🟡 [DoctorHomeScreen.build] Rebuilding...
🟡 [DoctorHomeScreen.build] Unread notifications: 1
🟡 [DoctorHomeScreen.build] Total notifications: 1
```

❌ **IF UNREAD COUNT STAYS 0:**
- **Break Point C**: UI not listening to provider changes
- Check: NotificationProvider in MultiProvider? Consumer set up?

---

### 9️⃣ Verify Database

Run this SQL query:
```sql
SELECT TOP 5 Id, NurseId, Title, PatientName, IsRead, CreatedAt
FROM Notifications
ORDER BY CreatedAt DESC;
```

✅ **EXPECTED:**
- New record exists
- NurseId = your doctor ID from step 1
- Title = "AI Alert - Critical"
- PatientName = "Ahmed"
- IsRead = 0

---

## 🚨 Break Point Reference

| Break Point | Symptom | Cause |
|-------------|---------|-------|
| **A** | No "EVENT RECEIVED!" log | SignalR hub not sending, or message lost in transit |
| **B** | Event received but NotificationProvider not called | Context null, provider not in MultiProvider, or error in delivery |
| **C** | Provider called but UI not rebuilt | UI not listening, or MultiProvider not set up |

---

## 📋 Log Color Meanings

- 🔴 **Red** = SignalR Service
- 🟣 **Purple** = Auth Provider  
- 🔵 **Blue** = NotificationProvider
- 🟡 **Yellow** = Screen (DoctorHomeScreen / NurseHomeScreen)

---

## ✨ Summary

The notification flow has **3 critical points**:

1. ✅ **Backend → SignalR**: Does server send message to Hub?
2. ✅ **SignalR → Provider**: Does Flutter receive event?
3. ✅ **Provider → UI**: Does UI rebuild when provider changes?

**Use the logs to identify EXACTLY which point breaks.**

Once you identify the break point, check the detailed debugging guide:
[FLUTTER_NOTIFICATION_DEBUG_CHECKLIST.md](FLUTTER_NOTIFICATION_DEBUG_CHECKLIST.md)

