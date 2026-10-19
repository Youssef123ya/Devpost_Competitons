# MedMonitor - Architecture Diagram

## 🏗️ البنية المعمارية الكاملة

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MedMonitor System                            │
└─────────────────────────────────────────────────────────────────────┘

                     ┌──────────────────────┐
                     │   Flutter App        │
                     │   (Mobile Client)    │
                     └──────────┬───────────┘
                                │
                                │ HTTP/HTTPS
                                │ (Dio)
                                │
                ┌───────────────────────────────────┐
                │   CORS Middleware                 │
                └───────────────────────────────────┘
                                │
                ┌───────────────────────────────────────────┐
                │      ASP.NET Core API                      │
                │      (Running on Port 5140)                │
                │                                            │
                │  ┌──────────────────────────────────────┐ │
                │  │    JWT Authentication               │ │
                │  │    - Login                           │ │
                │  │    - Register                        │ │
                │  │    - Password Reset                  │ │
                │  └──────────────────────────────────────┘ │
                │                                            │
                │  ┌──────────────────────────────────────┐ │
                │  │    Controllers (9)                   │ │
                │  │    - LoginController                 │ │
                │  │    - UsersController                 │ │
                │  │    - DashboardController             │ │
                │  │    - BedsController                  │ │
                │  │    - TaskController                  │ │
                │  │    - AdmissionRequestController      │ │
                │  │    - VitalSignController             │ │
                │  │    - AgoraManagementController       │ │
                │  │    - AttachmentsController           │ │
                │  └──────────────────────────────────────┘ │
                │                                            │
                │  ┌──────────────────────────────────────┐ │
                │  │    Business Logic Layer              │ │
                │  │    - AuthService                     │ │
                │  │    - UsersService                    │ │
                │  │    - BedService                      │ │
                │  │    - TaskService                     │ │
                │  │    - VitalSignService                │ │
                │  │    - AdmissionRequestService         │ │
                │  └──────────────────────────────────────┘ │
                │                                            │
                │  ┌──────────────────────────────────────┐ │
                │  │    Data Access Layer (EF Core)       │ │
                │  │    - DbContext                       │ │
                │  │    - Repositories                    │ │
                │  │    - Unit of Work Pattern            │ │
                │  └──────────────────────────────────────┘ │
                │                                            │
                └───────────────────┬───────────────────────┘
                                    │
                        ┌───────────┴────────────┐
                        │                        │
        ┌───────────────────────────┐  ┌────────────────────────┐
        │   In-Memory Database      │  │   SQL Server           │
        │   (Development)           │  │   (Production)         │
        │                           │  │                        │
        │  ┌─────────────────────┐ │  │ ┌──────────────────────┤
        │  │ - Users             │ │  │ │ - Users              │
        │  │ - Tasks             │ │  │ │ - Tasks              │
        │  │ - Beds              │ │  │ │ - Beds               │
        │  │ - Admissions        │ │  │ │ - Admissions         │
        │  │ - VitalSigns        │ │  │ │ - VitalSigns         │
        │  │ - Attachments       │ │  │ │ - Attachments        │
        │  └─────────────────────┘ │  │ └──────────────────────┤
        │                           │  │                        │
        └───────────────────────────┘  └────────────────────────┘
```

---

## 📲 Flutter App Architecture

```
┌───────────────────────────────────────────────────────┐
│              Flutter Application Layer                 │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Presentation Layer (UI Screens)                 │ │
│  │                                                   │ │
│  │  ├─ Authentication                               │ │
│  │  │  ├─ LoginScreen                               │ │
│  │  │  ├─ RegisterScreen                            │ │
│  │  │  └─ ForgotPasswordScreen                       │ │
│  │  │                                                │ │
│  │  ├─ Admin Features                               │ │
│  │  │  ├─ SuperAdminScreen (Dashboard)              │ │
│  │  │  ├─ AdminSettingsScreen                       │ │
│  │  │  ├─ AdminHelpScreen                           │ │
│  │  │  └─ PendingAdmissionScreen                    │ │
│  │  │                                                │ │
│  │  ├─ Doctor Features                              │ │
│  │  │  ├─ DoctorHomeScreen                          │ │
│  │  │  ├─ PatientDetailsScreen                      │ │
│  │  │  ├─ AdmissionStatusScreen                     │ │
│  │  │  ├─ CreateTasksScreen                         │ │
│  │  │  └─ PatientReportsScreen                      │ │
│  │  │                                                │ │
│  │  └─ Nurse Features                               │ │
│  │     ├─ NurseHomeScreen                           │ │
│  │     ├─ NurseTasksScreen                          │ │
│  │     ├─ VitalSignsScreen                          │ │
│  │     └─ PatientStatusScreen                       │ │
│  │                                                   │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  State Management Layer (Provider)                │ │
│  │                                                   │ │
│  │  ├─ AuthProvider                                 │ │
│  │  ├─ DoctorProvider                               │ │
│  │  ├─ NurseProvider                                │ │
│  │  ├─ BedProvider                                  │ │
│  │  ├─ TaskProvider                                 │ │
│  │  ├─ VitalSignProvider                            │ │
│  │  └─ NotificationProvider                         │ │
│  │                                                   │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Services Layer                                   │ │
│  │                                                   │ │
│  │  ├─ ApiService (HTTP Client - Dio)               │ │
│  │  │  ├─ login()                                    │ │
│  │  │  ├─ register()                                 │ │
│  │  │  ├─ getDashboardStats()                        │ │
│  │  │  ├─ getBeds()                                  │ │
│  │  │  ├─ getAdmissionRequests()                     │ │
│  │  │  ├─ getTasks()                                 │ │
│  │  │  └─ getVitalSigns()                            │ │
│  │  │                                                │ │
│  │  ├─ StorageService (Secure Storage)               │ │
│  │  │  ├─ saveToken()                                │ │
│  │  │  ├─ getToken()                                 │ │
│  │  │  └─ clearToken()                               │ │
│  │  │                                                │ │
│  │  └─ NotificationService                           │ │
│  │     └─ showNotification()                          │ │
│  │                                                   │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Models Layer                                     │ │
│  │                                                   │ │
│  │  ├─ UserModel                                    │ │
│  │  ├─ AdmissionRequestModel                        │ │
│  │  ├─ TaskModel                                    │ │
│  │  ├─ VitalSignModel                               │ │
│  │  ├─ BedModel                                     │ │
│  │  └─ DashboardStatsModel                          │ │
│  │                                                   │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
└───────────────────────────────────────────────────────┘
```

---

## 🔄 Authentication Flow

```
User Interaction
    │
    ├─→ Open App
    │     │
    │     └─→ Check if Logged In (Secure Storage)
    │           │
    │           ├─ Yes → Redirect to Home Screen
    │           └─ No  → Show Login Screen
    │
    ├─→ New User?
    │     │
    │     └─→ Click "Sign up"
    │           │
    │           └─→ RegisterScreen
    │                 │
    │                 ├─ Fill Form
    │                 ├─ Select Role (Doctor/Nurse)
    │                 └─ Send to API: POST /register
    │                       │
    │                       ├─ Success → ✅ Account Created
    │                       │             Redirect to Login
    │                       │
    │                       └─ Error → ❌ Show Error Message
    │
    └─→ Enter Credentials
          │
          └─→ Click "Sign in"
                │
                └─→ Send to API: POST /login
                      │
                      ├─ Success → ✅ Receive JWT Token
                      │             Store Token (Secure)
                      │             Redirect to Home Screen
                      │             (Based on Role)
                      │
                      │             If role == 1 → Admin Home
                      │             If role == 2 → Doctor Home
                      │             If role == 3 → Nurse Home
                      │
                      └─ Error → ❌ "Invalid credentials"
```

---

## 📊 Data Flow for Dashboard

```
Admin Opens App
    │
    ├─ Logged In? → Check Token
    │
    ├─ Go to Home → MainScreen
    │
    ├─ Fetch Data → API Request with JWT Token
    │
    ├─ GET /api/dashboard/Stats
    │
    └─ Response (JSON)
        │
        ├─ occupiedBeds: 15
        ├─ availableBeds: 20
        ├─ totalPatients: 45
        ├─ totalDoctors: 8
        ├─ totalNurses: 12
        └─ totalRequests: 5
            │
            └─ Parse & Store in Provider
                │
                └─ Update UI Widgets
                    │
                    └─ Display Dashboard Cards
                        │
                        ├─ Occupied Beds: 15
                        ├─ Available Beds: 20
                        ├─ Total Patients: 45
                        ├─ Total Doctors: 8
                        ├─ Total Nurses: 12
                        └─ Total Requests: 5
```

---

## 🔐 Role-Based Access Control

```
User Logs In
    │
    └─ Check Role
        │
        ├─ Role == 1 (Admin)
        │   │
        │   ├─ Access: Dashboard, Users, Beds, All Admissions
        │   ├─ Can See: Settings, Help, Logout
        │   └─ Permissions: Create, Read, Update, Delete (All)
        │
        ├─ Role == 2 (Doctor)
        │   │
        │   ├─ Access: Dashboard, Create Admissions, Create Tasks
        │   ├─ Can See: Own Patients, Own Tasks
        │   └─ Permissions: Create, Read, Update (Own only)
        │
        └─ Role == 3 (Nurse)
            │
            ├─ Access: Assigned Tasks, Patient Status
            ├─ Can See: Vital Signs, Task Details
            └─ Permissions: Read, Update (Assigned only)
```

---

## 📡 API Request/Response Cycle

```
┌─────────────────────────────────────────┐
│   Flutter App (ApiService.dart)         │
│                                         │
│  const baseUrl = 'http://localhost...'  │
│  Dio instance ready                     │
│                                         │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────────────────┐
        │  Create HTTP Request │
        │  - Method: POST/GET  │
        │  - Headers (JWT)     │
        │  - Body (JSON)       │
        └──────────────────────┘
                   │
        ┌──────────────────────┐
        │  Send Over Network   │
        │  (HTTP/HTTPS)        │
        └──────────────────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │   Backend API        │
        │ (ASP.NET Core)       │
        │                      │
        │ 1. Receive Request   │
        │ 2. Validate JWT      │
        │ 3. Process Logic     │
        │ 4. Query Database    │
        │ 5. Prepare Response  │
        └──────────────────────┘
                   │
        ┌──────────────────────┐
        │  Return HTTP Response│
        │  - Status Code       │
        │  - Headers           │
        │  - Body (JSON)       │
        └──────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────┐
│   Flutter App (ApiService.dart)          │
│                                          │
│  1. Parse Response                       │
│  2. Map to DTO Models                    │
│  3. Update Provider State                │
│  4. Notify Listeners                     │
│  5. Rebuild UI                           │
│                                          │
│  Result: ✅ Data Displayed on Screen    │
└──────────────────────────────────────────┘
```

---

## 🗄️ Database Schema Overview

```
┌─────────────────────────────────────────┐
│          Users Table                     │
├─────────────────────────────────────────┤
│ Id (PK)                                  │
│ UserName                                 │
│ Email                                    │
│ PhoneNumber                              │
│ FullName                                 │
│ Password (Hashed)                        │
│ Role (Admin=1, Doctor=2, Nurse=3)        │
│ Gender                                   │
│ DateOfBirth                              │
│ ImageUrl                                 │
│ Specialization (Doctor only)             │
│ IsActive                                 │
│ TockenAgora                              │
│ TockenUserAgoraChat                      │
└─────────────────────────────────────────┘
        │        │        │
        │        │        └─ Tasks
        │        │           (Doctor → Nurse)
        │        │
        │        └─ Admissions
        │            (Doctor creates)
        │
        └─ VitalSigns
            (Nurse records)

┌─────────────────────────────────────────┐
│          Beds Table                      │
├─────────────────────────────────────────┤
│ Id (PK)                                  │
│ BedNumber                                │
│ Floor                                    │
│ Wing                                     │
│ Status (Available/Occupied)              │
│ OccupiedBy (FK to Users - Patient)       │
│ CreatedAt                                │
└─────────────────────────────────────────┘
        │
        └─ Referenced in AdmissionRequests

┌─────────────────────────────────────────┐
│    AdmissionRequests Table               │
├─────────────────────────────────────────┤
│ Id (PK)                                  │
│ DoctorId (FK)                            │
│ BedId (FK)                               │
│ PatientName                              │
│ Age, Gender, Height                      │
│ Phone, Illness                           │
│ CompanionPhone, NurseName                │
│ Status (Pending/Approved/Rejected)       │
│ CreatedAt, UpdatedAt                     │
└─────────────────────────────────────────┘
```

---

## 🎯 Deployment Architecture

```
Development Environment
    │
    ├─ Backend
    │   └─ dotnet run
    │       └─ localhost:5140
    │           └─ In-Memory Database
    │
    └─ Frontend
        └─ flutter run
            └─ http://10.0.2.2:5140 (Android Emulator)


Production Environment
    │
    ├─ Backend
    │   ├─ Host: Azure / AWS / On-Premise
    │   ├─ Port: 5140 (or any)
    │   ├─ Database: SQL Server
    │   ├─ SSL/TLS: Enabled
    │   └─ CORS: Configured
    │
    └─ Frontend
        ├─ Host: Google Play / App Store
        ├─ API BaseUrl: https://api.medmonitor.com
        ├─ Token Storage: Flutter Secure Storage
        └─ HTTPS: Required
```

---

**تم الإعداد في**: May 19, 2026

**آخر تحديث**: May 19, 2026
