# Flutter Notification Flow - Complete Debug Checklist

## Overview
This document guides you through debugging the complete notification flow:
```
Backend AI Prediction → Notification Creation → SignalR Send → Flutter Receive → UI Popup
```

---

## Step 0: Verify Backend Database Before Testing

Run this SQL query to check existing Notification records:

```sql
-- Open your database (MedMonitor DB)
SELECT TOP 10 
    Id, 
    NurseId, 
    Title, 
    TaskName, 
    PatientName, 
    Note, 
    IsRead, 
    CreatedAt
FROM Notifications
ORDER BY CreatedAt DESC;

-- Check if your doctor/nurse IDs exist in Users table:
SELECT TOP 5 Id, UserName, FullName, Role FROM Users WHERE Role = 2;  -- 2 = Doctor
SELECT TOP 5 Id, UserName, FullName, Role FROM Users WHERE Role = 1;  -- 1 = Nurse
```

**Record the User IDs from this query.**

---

## Step 1: Prepare the Flutter App

1. Rebuild the app:
```powershell
cd "c:\PROJECTFINAL-NUB\fiels project\med_monitor\med_monitor"
& "C:\PROJECTFINAL-NUB\flutter_windows_3.41.9-stable\flutter\bin\flutter.bat" clean
& "C:\PROJECTFINAL-NUB\flutter_windows_3.41.9-stable\flutter\bin\flutter.bat" pub get
```

2. Open VS Code Debug Console or Android Studio Logcat to capture logs.

---

## Step 2: Login and Capture Logs

### Expected Logs (🔴 = Critical, 🟢 = Success)

**Color codes:**
- 🟢 = Green (successful step)
- 🔴 = Red (error or issue)
- 🔵 = Blue (info from NotificationProvider)
- 🟡 = Yellow (info from screens)
- 🟣 = Purple (info from AuthProvider)

### Run these steps:

1. **Start Flutter app:**
   ```powershell
   & "C:\PROJECTFINAL-NUB\flutter_windows_3.41.9-stable\flutter\bin\flutter.bat" run -d edge
   ```

2. **Open the Debug Console** in your terminal/IDE.

3. **Login with a doctor account:**
   - Look for logs starting with `🟣 [AuthProvider]`
   
   You should see:
   ```
   🟣 [AuthProvider] Starting SignalR connection after login...
   🟣 [AuthProvider] Current user: <username>, ID: <user-id>
   🔴 [SignalR] startConnection() called
   🔴 [SignalR] Base URL: http://192.168.1.4:5140
   🔴 [SignalR] Token exists: true
   🔴 [SignalR] Full URL: http://192.168.1.4:5140/chatHub?access_token=eyJ...
   🔴 [SignalR] HubConnection created
   🔴 [SignalR] Event handler registered for ReceiveTaskNotification
   🔴 [SignalR] ✅ CONNECTED SUCCESSFULLY
   🔴 [SignalR] Connection state: Connected
   ```

   **🚨 If you DON'T see these logs, SignalR connection is not starting.**

4. **Check for NotificationProvider fetch:**
   ```
   🟣 [AuthProvider] Fetching initial notifications...
   🟣 [AuthProvider] UserId for fetch: <user-id>
   🔵 [NotificationProvider.fetchNotifications] Called with nurseId: <user-id>
   🔵 [NotificationProvider.fetchNotifications] Base URL: http://192.168.1.4:5140
   🔵 [NotificationProvider.fetchNotifications] Full endpoint: http://192.168.1.4:5140/api/Notification/GetByNurse?nurseId=<user-id>
   🔵 [NotificationProvider.fetchNotifications] Response status: 200
   🔵 [NotificationProvider.fetchNotifications] ✅ Fetched X notifications
   ```

   **🚨 If status is not 200, check the endpoint URL and backend API.**

5. **Navigate to Doctor Home Screen:**
   You should see:
   ```
   🟡 [DoctorHomeScreen.initState] DoctorHomeScreen initialized
   🟡 [DoctorHomeScreen.initState] Current doctor: <name>, ID: <id>
   🟡 [DoctorHomeScreen.initState] Calling fetchNotifications(<id>)...
   🟡 [DoctorHomeScreen.build] Rebuilding...
   🟡 [DoctorHomeScreen.build] Unread notifications: 0
   🟡 [DoctorHomeScreen.build] Total notifications: 0
   ```

---

## Step 3: Trigger AI Alert from OCR

**While the Flutter app is running and logged in:**

1. Run OCR command with patientId:
   ```bash
   curl -X POST "http://192.168.1.4:5140/AIAlert/Predict?patientId=12345&patientName=TestPatient" \
     -H "Content-Type: application/json" \
     -d '{"heartRate":150,"spo2":80,"systolic":160,"diastolic":100,"temperature":39}'
   ```

2. **Capture backend response:**
   Should see:
   ```
   ✅ Notification created with ID: XX
   ✅ Notification created with ID: XX
   📤 SignalR notification sent to nurse ...
   AI alert notifications created for X doctors
   ```

3. **SIMULTANEOUSLY watch Flutter logs for:**

   **Point A: SignalR Event Reception**
   ```
   🟣 [SignalR Event] ReceiveTaskNotification EVENT RECEIVED!
   🟣 [SignalR Event] Args length: 1
   🟣 [SignalR Event] Raw payload type: Map or String
   🟣 [SignalR Event] Parsed JSON: {...}
   🟣 [SignalR Event] ✅ Notification created: title=AI Alert - Critical
   ```
   
   **🚨 If you don't see "EVENT RECEIVED!", SignalR message did not reach Flutter.**

   **Point B: NotificationProvider Delivery**
   ```
   🟣 [SignalR Event] Getting NotificationProvider from context...
   🟣 [SignalR Event] ✅ NotificationProvider obtained
   🟣 [SignalR Event] Calling addNotification()...
   🔵 [NotificationProvider.addNotification] Called
   🔵 [NotificationProvider.addNotification] Title: AI Alert - Critical
   🔵 [NotificationProvider.addNotification] Current count before: 0
   🔵 [NotificationProvider.addNotification] Current count after: 1
   🔵 [NotificationProvider.addNotification] Calling notifyListeners()...
   🔵 [NotificationProvider.addNotification] ✅ notifyListeners() called
   ```

   **🚨 If this section doesn't appear, the notification didn't reach NotificationProvider.**

   **Point C: UI Rebuild**
   ```
   🟡 [DoctorHomeScreen.build] Rebuilding...
   🟡 [DoctorHomeScreen.build] Unread notifications: 1
   🟡 [DoctorHomeScreen.build] Total notifications: 1
   ```

   **🚨 If unread count doesn't increase, UI is not listening to provider.**

---

## Step 4: Debugging Points (If Chain Breaks)

### ❌ Break Point A: SignalR Event NOT Received

**Symptoms:** No "🟣 [SignalR Event] ReceiveTaskNotification EVENT RECEIVED!" log

**Check these:**

1. **Is SignalR connected?**
   - Look for `🔴 [SignalR] ✅ CONNECTED SUCCESSFULLY` after login
   - If missing, connection failed

2. **Is the token valid?**
   - Print the token in auth_provider after login:
     ```dart
     final token = await prefs.getString('auth_token');
     debugPrint('🟣 [AuthProvider] Saved token: ${token?.substring(0, 20)}...');
     ```

3. **Is the backend sending to the correct user ID?**
   - Backend logs should show: `SignalR notification sent to nurse <user-id>`
   - Make sure Flutter logged-in user ID matches this exactly
   - Check: `🟣 [AuthProvider] Current user: <username>, ID: <id>`

4. **Does ChatHub exist on backend?**
   - Verify `/chatHub` endpoint is mapped in Startup.cs or Program.cs
   - Check: `.MapHub<ChatHub>("/chatHub");`

5. **Check network connectivity:**
   - From emulator/device, try: `ping 192.168.1.4`
   - If unreachable, update base URL in signalr_service.dart

---

### ❌ Break Point B: SignalR Received but NotificationProvider NOT Called

**Symptoms:** 
- ✅ "🟣 [SignalR Event] ReceiveTaskNotification EVENT RECEIVED!"
- ❌ But "🔵 [NotificationProvider.addNotification] Called" never appears

**Check these:**

1. **Is DioClient.navigatorKey properly set?**
   - In main.dart:
     ```dart
     DioClient.navigatorKey = navigatorKey;
     ```
   - Verify it happens BEFORE the first screen is shown

2. **Can NotificationProvider be accessed from context?**
   - If you see: `🟣 [SignalR Event] Context from navigator key: false`
   - Then context is null, and provider cannot be accessed

3. **Verify NotificationProvider is in MultiProvider:**
   - In main.dart or MaterialApp setup:
     ```dart
     MultiProvider(
       providers: [
         ChangeNotifierProvider(create: (_) => AuthProvider()),
         ChangeNotifierProvider(create: (_) => NotificationProvider()),  // ← Must exist
         // ... other providers
       ],
       child: MyApp(),
     )
     ```

---

### ❌ Break Point C: NotificationProvider Called but UI NOT Rebuilt

**Symptoms:**
- ✅ "🔵 [NotificationProvider.addNotification] ✅ notifyListeners() called"
- ❌ But "🟡 [DoctorHomeScreen.build] Unread notifications: 1" never increases

**Check these:**

1. **Is DoctorHomeScreen listening to NotificationProvider?**
   - It should be using `Provider.of<NotificationProvider>(context)` in build()
   - Check the build method logs: `🟡 [DoctorHomeScreen.build] Unread notifications: X`

2. **Did the MultiProvider get set up correctly?**
   - NotificationProvider must be a ChangeNotifierProvider

3. **Is StatefulWidget using setState()?**
   - DoctorHomeScreen should rebuild when provider notifies

---

## Step 5: Database Verification

After triggering the alert, query the database:

```sql
SELECT TOP 5 
    Id, 
    NurseId, 
    Title, 
    TaskName, 
    PatientName, 
    Note, 
    IsRead, 
    CreatedAt
FROM Notifications
ORDER BY CreatedAt DESC;
```

**Verify:**
- [ ] New records exist
- [ ] NurseId matches your logged-in doctor's user ID
- [ ] TaskName = "AI Alert - Critical"
- [ ] PatientName = "TestPatient" (or whatever you sent)
- [ ] IsRead = 0 (false)
- [ ] CreatedAt is recent (within last minute)

**If records don't exist:**
- AIAlertController is not creating notifications
- Check backend logs for errors in CreateTaskNotificationAsync

---

## Step 6: SignalR User Mapping Verification

**Backend Log shows:**
```
SignalR notification sent to nurse 581d5fe5-0001-0000-0000-000000000000
```

**Flutter Log should show:**
```
🟣 [AuthProvider] Current user: DoctorName, ID: 581d5fe5-0001-0000-0000-000000000000
```

**If IDs don't match:**
- Backend is sending to wrong user ID
- Frontend is logged in as different user
- User ID claim in JWT token is different from backend's Clients.User(userId) mapping

---

## Summary of Log Colors

| Color | Source | Meaning |
|-------|--------|---------|
| 🔴 Red | SignalR Service | Connection state |
| 🟣 Purple | Auth Provider | Login & initialization |
| 🔵 Blue | NotificationProvider | Notification operations |
| 🟡 Yellow | DoctorHomeScreen / NurseHomeScreen | UI state |

---

## Next Steps

1. **Capture all logs from login to alert trigger**
2. **Identify which break point occurs (A, B, or C)**
3. **Run the corresponding debug checks**
4. **Report the exact point where chain breaks with logs**

