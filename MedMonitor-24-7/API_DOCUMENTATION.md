# MedMonitor API - توثيق كامل للـ Backend

## 🚀 معلومات الخادم

| المعلومة | القيمة |
|---------|--------|
| **Base URL** | `http://localhost:5140/api` |
| **Framework** | ASP.NET Core |
| **Database** | In-Memory (Dev) / SQL Server (Prod) |
| **Authentication** | JWT Bearer Token |
| **CORS** | Enabled for Flutter app |
| **Port** | 5140 |

---

## 🔐 Authentication

### 1. Login - تسجيل الدخول

**Endpoint**: `POST /api/login`

**Request Body**:
```json
{
  "userName": "doctor_username",
  "password": "password123"
}
```

**Response (Success - 200)**:
```json
{
  "statusCode": 200,
  "data": {
    "id": "user-id-guid",
    "fullName": "Dr. Magdy Osama",
    "userName": "doctor_username",
    "email": "doctor@medmonitor.com",
    "phoneNumber": "01023456789",
    "role": 2,
    "imageUrl": "/Images/User/UserProfile.jpg",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "gender": 1,
    "dateOfBirth": "1980-01-01",
    "specialization": "Cardiologist",
    "tockenAgora": "agora-token",
    "tockenUserAgoraChat": "agora-chat-token"
  },
  "message": "Success"
}
```

**Error (401)**:
```json
{
  "statusCode": 401,
  "message": "Incorrect username or password"
}
```

**Flutter Implementation**:
```dart
Future<bool> login(String username, String password) async {
  try {
    final response = await Dio().post(
      'http://localhost:5140/api/login',
      data: LoginDto(userName: username, password: password),
    );
    
    if (response.statusCode == 200) {
      final userWithToken = UserWithTokenDto.fromJson(response.data['data']);
      _currentUser = userWithToken.user;
      _token = userWithToken.token;
      return true;
    }
    return false;
  } catch (e) {
    print('Login error: $e');
    return false;
  }
}
```

---

### 2. Register - التسجيل

**Endpoint**: `POST /api/login/Register`

**Request Body**:
```json
{
  "fullName": "Nurse Aya",
  "userName": "nurse_aya",
  "email": "nurse@medmonitor.com",
  "phoneNumber": "01111111111",
  "password": "password123",
  "role": 3,
  "gender": 2,
  "dateOfBirth": "1990-03-20"
}
```

**Response (Success - 200)**:
```json
{
  "statusCode": 200,
  "data": {
    "id": "new-user-id",
    "fullName": "Nurse Aya",
    "userName": "nurse_aya",
    "email": "nurse@medmonitor.com",
    "phoneNumber": "01111111111",
    "role": 3,
    "gender": 2,
    "imageUrl": "/Images/User/UserProfile.jpg",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "dateOfBirth": "1990-03-20"
  },
  "message": "User registered successfully"
}
```

**Error Cases**:
- `409 - Conflict`: Username already exists
- `409 - Conflict`: Email already exists
- `409 - Conflict`: Phone Number already exists

**Flutter Implementation**:
```dart
Future<bool> register({
  required String username,
  required String email,
  required String phone,
  required String password,
  required int role, // 2=Doctor, 3=Nurse
  required int gender,
}) async {
  try {
    final response = await Dio().post(
      'http://localhost:5140/api/login/Register',
      data: {
        'fullName': username,
        'userName': username,
        'email': email,
        'phoneNumber': phone,
        'password': password,
        'role': role,
        'gender': gender,
        'dateOfBirth': DateTime.now().toString(),
      },
    );
    
    if (response.statusCode == 200) {
      return true;
    }
    return false;
  } catch (e) {
    print('Register error: $e');
    return false;
  }
}
```

---

### 3. Forgot Password - نسيت كلمة المرور

#### 3.1 Request OTP by Email
**Endpoint**: `POST /api/login/ForgetPasswordByEmail`

**Query Parameters**:
```
email=user@medmonitor.com
```

**Response (Success - 200)**:
```json
{
  "statusCode": 200,
  "data": {
    "email": "user@medmonitor.com",
    "otb": 123456,
    "userId": "user-id"
  }
}
```

#### 3.2 Request OTP by Phone
**Endpoint**: `POST /api/login/ForgetPasswordByPhoneNumber`

**Query Parameters**:
```
phoneNumber=01023456789
```

---

## 👥 User Management

### 4. Get Current User Profile

**Endpoint**: `GET /api/users/profile`

**Headers**:
```
Authorization: Bearer {token}
```

**Response (Success - 200)**:
```json
{
  "statusCode": 200,
  "data": {
    "id": "user-id",
    "fullName": "Dr. Magdy Osama",
    "userName": "doctor_username",
    "email": "doctor@medmonitor.com",
    "phoneNumber": "01023456789",
    "role": 2,
    "gender": 1,
    "imageUrl": "/Images/doctor_username/profile.jpg",
    "dateOfBirth": "1980-01-01",
    "specialization": "Cardiologist",
    "isActive": true
  }
}
```

---

### 5. Update User Profile

**Endpoint**: `PUT /api/users/{userId}`

**Headers**:
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data**:
```
fullName: "Dr. Magdy Updated"
email: "newemail@medmonitor.com"
phoneNumber: "01123456789"
dateOfBirth: "1980-01-01"
gender: 1
specialization: "Cardiologist (Updated)"
image: [File] (optional - profile image)
```

**Response (Success - 200)**:
```json
{
  "statusCode": 200,
  "data": {
    "id": "user-id",
    "fullName": "Dr. Magdy Updated",
    "email": "newemail@medmonitor.com",
    "imageUrl": "/Images/doctor_username/profile.jpg"
  }
}
```

---

### 6. Change Password

**Endpoint**: `POST /api/users/change-password`

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "userId": "user-id",
  "oldPassword": "currentPassword",
  "newPassword": "newPassword123"
}
```

**Response (Success - 200)**:
```json
{
  "statusCode": 200,
  "message": "Password changed successfully"
}
```

---

## 📊 Dashboard

### 7. Get Dashboard Statistics

**Endpoint**: `GET /api/dashboard/statistics`

**Headers**:
```
Authorization: Bearer {token}
```

**Response (Success - 200)**:
```json
{
  "statusCode": 200,
  "data": {
    "occupiedBeds": 15,
    "availableBeds": 20,
    "totalPatients": 45,
    "totalDoctors": 8,
    "totalNurses": 12,
    "totalRequests": 5
  }
}
```

**Flutter Implementation**:
```dart
Future<DashboardStats?> getDashboardStats() async {
  try {
    final response = await Dio().get(
      'http://localhost:5140/api/dashboard/statistics',
      options: Options(
        headers: {'Authorization': 'Bearer $token'},
      ),
    );
    
    if (response.statusCode == 200) {
      return DashboardStatsDto.fromJson(response.data['data']);
    }
  } catch (e) {
    print('Dashboard error: $e');
  }
  return null;
}
```

---

## 🛏️ Beds Management

### 8. Get All Beds

**Endpoint**: `GET /api/beds`

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters** (Optional):
```
pageNumber=1
pageSize=10
```

**Response (Success - 200)**:
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "bed-1",
      "bedNumber": "101",
      "floor": 1,
      "wing": "A",
      "isOccupied": true,
      "occupiedBy": "patient-id",
      "isAvailable": false,
      "createdAt": "2024-05-19T10:30:00"
    },
    {
      "id": "bed-2",
      "bedNumber": "102",
      "floor": 1,
      "wing": "A",
      "isOccupied": false,
      "isAvailable": true,
      "createdAt": "2024-05-19T10:30:00"
    }
  ]
}
```

---

## 👨‍⚕️ Admissions

### 9. Get Admission Requests

**Endpoint**: `GET /api/admissionrequest/doctor-requests/{doctorId}`

**Headers**:
```
Authorization: Bearer {token}
```

**Response (Success - 200)**:
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "admission-1",
      "doctorId": "doctor-id",
      "doctorName": "Dr. Magdy",
      "patientName": "Ahmed Hassan",
      "age": "45",
      "gender": "Male",
      "height": "175cm",
      "phone": "01023456789",
      "illness": "Heart Disease",
      "companionPhone": "01123456789",
      "nurseName": "Nurse Aya",
      "status": "Pending",
      "timeSent": "2024-05-19T10:30:00",
      "createdAt": "2024-05-19T10:30:00"
    }
  ]
}
```

### 10. Create Admission Request

**Endpoint**: `POST /api/admissionrequest`

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "doctorId": "doctor-id",
  "patientName": "Ahmed Hassan",
  "age": "45",
  "gender": "Male",
  "height": "175cm",
  "phone": "01023456789",
  "illness": "Heart Disease",
  "companionPhone": "01123456789",
  "bedId": "bed-1",
  "nurseName": "Nurse Aya",
  "status": "Pending"
}
```

**Response (Success - 201)**:
```json
{
  "statusCode": 201,
  "data": {
    "id": "new-admission-id",
    "status": "Pending",
    "createdAt": "2024-05-19T10:30:00"
  }
}
```

---

## 📋 Tasks

### 11. Get Tasks

**Endpoint**: `GET /api/task`

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters** (Optional):
```
pageNumber=1
pageSize=10
doctorId=doctor-id (optional)
nurseId=nurse-id (optional)
```

**Response (Success - 200)**:
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "task-1",
      "title": "Monitor Patient Vitals",
      "description": "Check patient vital signs every 2 hours",
      "doctorId": "doctor-id",
      "doctorName": "Dr. Magdy",
      "nurseId": "nurse-id",
      "nurseName": "Nurse Aya",
      "status": "In Progress",
      "priority": "High",
      "dueDate": "2024-05-20T10:00:00",
      "createdAt": "2024-05-19T09:00:00"
    }
  ]
}
```

### 12. Create Task

**Endpoint**: `POST /api/task`

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "title": "Monitor Patient Vitals",
  "description": "Check patient vital signs every 2 hours",
  "doctorId": "doctor-id",
  "nurseId": "nurse-id",
  "priority": "High",
  "dueDate": "2024-05-20T10:00:00"
}
```

---

## 📈 Vital Signs

### 13. Get Vital Signs

**Endpoint**: `GET /api/vitalsign`

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters** (Optional):
```
patientId=patient-id
pageNumber=1
pageSize=10
```

**Response (Success - 200)**:
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "vital-1",
      "patientId": "patient-id",
      "temperature": "37.5",
      "heartRate": "72",
      "bloodPressure": "120/80",
      "respiratoryRate": "16",
      "oxygenSaturation": "98%",
      "recordedAt": "2024-05-19T10:30:00"
    }
  ]
}
```

### 14. Add Vital Signs

**Endpoint**: `POST /api/vitalsign`

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "patientId": "patient-id",
  "temperature": "37.5",
  "heartRate": "72",
  "bloodPressure": "120/80",
  "respiratoryRate": "16",
  "oxygenSaturation": "98%"
}
```

---

## 🔑 Role-Based Access

| Role | Role ID | Endpoints |
|------|---------|-----------|
| **Admin** | 1 | Dashboard, Users, All Beds, All Admissions |
| **Doctor** | 2 | Profile, Create Tasks, View Own Tasks, Admissions |
| **Nurse** | 3 | Profile, View Assigned Tasks, Record Vital Signs |

---

## 🛡️ Error Codes

| Code | Message | HTTP Status |
|------|---------|-------------|
| 400 | Bad Request | 400 |
| 401 | Unauthorized | 401 |
| 403 | Forbidden | 403 |
| 404 | Not Found | 404 |
| 409 | Conflict (Duplicate) | 409 |
| 500 | Internal Server Error | 500 |

---

## 📝 Data Models

### UserRole Enum
```
1 = Admin (Super Admin)
2 = Doctor
3 = Nurse
```

### Gender Enum
```
1 = Male
2 = Female
3 = Other
```

### Task Status
```
Pending
In Progress
Completed
Cancelled
```

### Admission Status
```
Pending
Approved
Rejected
Completed
```

---

## 🔗 CORS Configuration

أضف هذا في `Program.cs`:

```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.WithOrigins("*")
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

app.UseCors();
```

---

## 🧪 Test Endpoints

استخدم **Postman** أو **Thunder Client** لاختبار الـ API:

1. **Create account** → Register endpoint
2. **Login** → Get token
3. **Add Authorization header** → Use token in all protected endpoints
4. **Test different roles** → Admin, Doctor, Nurse

---

## 🚨 Important Notes

✅ Keep JWT token safe
✅ Include token in all requests (except Login/Register)
✅ Token expires after 24 hours (configure as needed)
✅ Always validate input on frontend before sending
✅ Use HTTPS in production
✅ Store token securely in Flutter (use flutter_secure_storage)

---

Generated on: May 19, 2026
