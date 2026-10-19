# 🔌 شرح الـ API و Controllers - كيفية استخدام قاعدة البيانات

---

## 📡 Main Controllers

### 1. **LoginController** - تسجيل الدخول

```csharp
POST /LoginContoller/loginUser
{
  "userName": "ahmed123",
  "password": "pass123"
}

RESPONSE:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "userName": "ahmed123",
    "fullName": "أحمد علي",
    "role": 2,  // Doctor
    "imageUrl": "https://..."
  }
}
```

---

### 2. **DashboardController** - لوحة التحكم

```csharp
GET /Dashboard/Stats

RESPONSE:
{
  "occupiedBeds": 5,
  "availableBeds": 7,
  "totalPatients": 12,
  "totalDoctors": 3,
  "totalNurses": 5,
  "totalRequests": 15,
  "newbornsCount": 2,
  "childrenCount": 1,
  "teenagersCount": 1,
  "adultsCount": 5,
  "elderlyCount": 3
}
```

**الاستخدام:**
- السوبر أدمن يفتح Dashboard
- يرى إحصائيات السراير والمرضى في الوقت الفعلي

---

### 3. **BedController** - إدارة السراير

#### أ. جلب جميع السراير
```csharp
GET /Bed/GetAll

RESPONSE:
[
  {
    "id": 1,
    "bedNumber": "101",
    "status": 0,  // Available
    "patientId": null,
    "assignedDate": null
  },
  {
    "id": 2,
    "bedNumber": "102",
    "status": 1,  // Occupied
    "patientId": "patient-890",
    "assignedDate": "2026-06-02T10:30:00Z"
  }
]
```

#### ب. تسكين مريض على سرير
```csharp
POST /Bed/AssignPatient
{
  "bedId": 1,
  "patientId": "patient-123"
}

BACKEND يفعل:
bed.PatientId = "patient-123"
bed.Status = 1  // Occupied ✅ (تم إصلاحه)
bed.AssignedDate = DateTime.UtcNow
SaveAsync()

RESPONSE:
{
  "success": true,
  "message": "Patient assigned successfully"
}
```

#### ج. إخلاء سرير (تسريح المريض)
```csharp
POST /Bed/RemovePatient
{
  "bedId": 2
}

BACKEND يفعل:
bed.PatientId = null
bed.Status = 0  // Available ✅ (تم إصلاحه)
bed.AssignedDate = null
SaveAsync()

RESPONSE:
{
  "success": true,
  "message": "Patient removed successfully"
}
```

---

### 4. **AdmissionRequestController** - طلبات الدخول

#### أ. الدكتور يرسل طلب دخول
```csharp
POST /AdmissionRequest/Create
{
  "patientName": "أحمد محمد",
  "age": 45,
  "gender": "Male",
  "weight": 85,
  "height": 175,
  "illness": "حمى عالية",
  "companionPhone": "0123456789",
  "nurseName": "فاطمة",
  "medicalHistory": "لا يوجد",
  "diagnosis": "التهاب حاد"
}

BACKEND يفعل:
request.Status = Pending  // ← جديد
request.DoctorId = "doctor-id-from-token"
request.CreatedAt = DateTime.UtcNow
SaveAsync()

RESPONSE:
{
  "id": 15,
  "status": "Pending",
  "createdAt": "2026-06-02T10:15:00Z"
}
```

#### ب. جلب الطلبات المعلقة (للسوبر أدمن)
```csharp
GET /AdmissionRequest/GetPending

RESPONSE:
[
  {
    "id": 15,
    "doctorId": "doc-123",
    "doctorName": "د. علي",
    "patientName": "أحمد محمد",
    "age": 45,
    "illness": "حمى عالية",
    "status": "Pending",
    "createdAt": "2026-06-02T10:15:00Z"
  }
]
```

#### ج. السوبر أدمن يعتمد الطلب
```csharp
PUT /AdmissionRequest/Approve/{requestId}

BACKEND يفعل:
request.Status = Approved  // 1 → 2
SaveAsync()

RESPONSE:
{
  "success": true,
  "message": "Request approved"
}
```

#### د. السوبر أدمن يرفض الطلب
```csharp
PUT /AdmissionRequest/Reject/{requestId}

BACKEND يفعل:
request.Status = Rejected  // 1 → 3
SaveAsync()

RESPONSE:
{
  "success": true,
  "message": "Request rejected"
}
```

---

### 5. **TaskController** - المهام

#### أ. الدكتور ينشئ مهمة
```csharp
POST /Task/Create
{
  "title": "إعطاء دواء",
  "notes": "دواء الضغط مرتين يومياً",
  "startTime": "2026-06-02T10:00:00Z",
  "endTime": "2026-06-02T12:00:00Z",
  "nurseId": "nurse-45",
  "patientId": "patient-890"
}

BACKEND يفعل:
task.Status = New
task.DoctorId = "from-token"
SaveAsync()

RESPONSE:
{
  "id": 1,
  "status": "New"
}
```

#### ب. الممرضة تبدأ المهمة
```csharp
PUT /Task/UpdateStatus/{taskId}
{
  "status": "InProgress"
}

BACKEND يفعل:
task.Status = TaskStatusEnum.InProgress
SaveAsync()

RESPONSE:
{
  "success": true
}
```

#### ج. جلب مهام الممرضة
```csharp
GET /Task/GetMyTasks

RESPONSE:
[
  {
    "id": 1,
    "title": "إعطاء دواء",
    "status": "InProgress",
    "patientName": "أحمد علي",
    "startTime": "2026-06-02T10:00:00Z"
  }
]
```

---

### 6. **VitalSignsController** - العلامات الحيوية

#### أ. الممرضة تسجل العلامات الحيوية
```csharp
POST /VitalSigns/Record
{
  "patientId": "patient-890",
  "temperature": 37.5,
  "heartRate": 78,
  "bloodPressure": 120
}

BACKEND يفعل:
vitalSign.PatientId = "patient-890"
vitalSign.Temperature = 37.5
vitalSign.HeartRate = 78
vitalSign.BloodPressure = 120
vitalSign.RecordedAt = DateTime.UtcNow
SaveAsync()

RESPONSE:
{
  "id": 1,
  "recordedAt": "2026-06-02T10:30:00Z"
}
```

#### ب. جلب سجل المريض (آخر 24 ساعة)
```csharp
GET /VitalSigns/GetByPatient/{patientId}?days=1

RESPONSE:
[
  {
    "id": 1,
    "temperature": 37.5,
    "heartRate": 78,
    "bloodPressure": 120,
    "recordedAt": "2026-06-02T10:30:00Z"
  },
  {
    "id": 2,
    "temperature": 37.2,
    "heartRate": 75,
    "bloodPressure": 118,
    "recordedAt": "2026-06-02T12:30:00Z"
  }
]
```

---

### 7. **AttachmentController** - المرفقات

#### أ. رفع ملف
```csharp
POST /Attachment/Upload
Form Data:
- file: [binary file]
- type: "Report"  // Report, Scan, Analysis, Other
- addBy: "doc-123"

BACKEND يفعل:
attachment.UserId = "from-token"
attachment.AttachUrl = "save-file-path"
attachment.Type = AttachmentTypeEnum.Report
attachment.UploadedDate = DateTime.UtcNow
SaveAsync()

RESPONSE:
{
  "id": 1,
  "attachUrl": "/uploads/report-123.pdf",
  "uploadedDate": "2026-06-02T10:00:00Z"
}
```

#### ب. جلب مرفقات المستخدم
```csharp
GET /Attachment/GetByUser

RESPONSE:
[
  {
    "id": 1,
    "attachUrl": "/uploads/report-123.pdf",
    "type": "Report",
    "uploadedDate": "2026-06-02T10:00:00Z",
    "addBy": "doc-123"
  }
]
```

---

## 📱 تدفق كامل: من البداية للنهاية

```
════════════════════════════════════════════════════════════════

1️⃣ DOCTOR SIDE
───────────────────────────────────────────────────────────────
① الدكتور يفتح تطبيقه → Login

② POST /LoginContoller/loginUser
   Response: token + user info

③ الدكتور يملأ بيانات المريض
   POST /AdmissionRequest/Create
   Database: AdmissionRequest(Status=Pending)

④ الدكتور يرى قائمة المهام
   GET /Task/GetMyTasks
   Response: Tasks assigned to him


════════════════════════════════════════════════════════════════

2️⃣ SUPER ADMIN SIDE
───────────────────────────────────────────────────────────────
① السوبر أدمن يفتح Dashboard
   GET /Dashboard/Stats
   Response: OccupiedBeds=5, AvailableBeds=7, ...

② يفتح قائمة طلبات الدخول المعلقة
   GET /AdmissionRequest/GetPending
   Response: List of Pending requests

③ يختار طلب ويراجع البيانات
   (Flutter يعرض AdmissionRequest بيانات)

④ يضغط APPROVE
   PUT /AdmissionRequest/Approve/{requestId}
   Database: Status = Approved (1 → 2)

⑤ ينتقل إلى Beds Screen تلقائياً
   (يرى السراير الفارغة)

⑥ يضغط على سرير فارغ
   POST /Bed/AssignPatient
   Database:
   - Bed.Status = 1 (Occupied) ✅
   - Bed.PatientId = "patient-123" ✅
   - Bed.AssignedDate = now

⑦ يرجع للـ Dashboard
   didPopNext() triggers:
   GET /Dashboard/Stats
   Response: OccupiedBeds=6 (updated! ✅)


════════════════════════════════════════════════════════════════

3️⃣ NURSE SIDE
───────────────────────────────────────────────────────────────
① الممرضة تفتح تطبيقها → تسجيل الدخول

② تفتح قائمة المهام المسندة لها
   GET /Task/GetMyTasks
   Response: List of tasks

③ تبدأ مهمة
   PUT /Task/UpdateStatus/{taskId}
   Database: Task.Status = InProgress

④ تقيس العلامات الحيوية للمريض
   POST /VitalSigns/Record
   Database: VitalSign record added

⑤ تنتهي من المهمة
   PUT /Task/UpdateStatus/{taskId}
   Database: Task.Status = Completed

⑥ ترفع تقرير طبي
   POST /Attachment/Upload
   Database: Attachment record added


════════════════════════════════════════════════════════════════
```

---

## 🔄 العلاقات والتدفق

```
Doctor Creates Request
         ↓
AdmissionRequest.Status = Pending
         ↓
SuperAdmin Reviews
         ↓
     ┌──────┴──────┐
     ↓             ↓
  APPROVE      REJECT
     ↓             ↓
 Status=2      Status=3
     ↓
SuperAdmin Assigns Bed
     ↓
Bed.Status = 1 (Occupied)
Bed.PatientId = patientId
     ↓
Doctor Creates Tasks
     ↓
Nurse Executes Tasks
     ↓
Nurse Records VitalSigns
     ↓
Nurse Uploads Reports/Scans
     ↓
SuperAdmin Removes Patient
     ↓
Bed.Status = 0 (Available)
Bed.PatientId = null
```

---

## 🔐 Authorization Levels

```
SuperAdmin (Role=1):
  - GET /Dashboard/Stats ✓
  - GET /AdmissionRequest/GetPending ✓
  - PUT /AdmissionRequest/Approve ✓
  - POST /Bed/AssignPatient ✓
  - POST /Bed/RemovePatient ✓
  - GET /Bed/GetAll ✓

Doctor (Role=2):
  - POST /AdmissionRequest/Create ✓
  - POST /Task/Create ✓
  - GET /Task/GetMyTasks ✓
  - POST /Attachment/Upload ✓

Nurse (Role=3):
  - GET /Task/GetMyTasks ✓
  - PUT /Task/UpdateStatus ✓
  - POST /VitalSigns/Record ✓
  - GET /VitalSigns/GetByPatient ✓
  - POST /Attachment/Upload ✓

Patient (Role=4):
  - GET /VitalSigns/GetByPatient ✓
  - GET /Attachment/GetByUser ✓
```

---

## 🧪 أمثلة Curl للاختبار

### تسجيل الدخول
```bash
curl -X POST "http://localhost:5140/LoginContoller/loginUser" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "doctor1",
    "password": "password123"
  }'
```

### جلب الإحصائيات
```bash
curl -X GET "http://localhost:5140/Dashboard/Stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### تسكين مريض
```bash
curl -X POST "http://localhost:5140/Bed/AssignPatient" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "bedId": 1,
    "patientId": "patient-123"
  }'
```

### إخلاء سرير
```bash
curl -X POST "http://localhost:5140/Bed/RemovePatient" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "bedId": 1
  }'
```

### إنشاء طلب دخول (من الدكتور)
```bash
curl -X POST "http://localhost:5140/AdmissionRequest/Create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "patientName": "أحمد محمد",
    "age": 45,
    "gender": "Male",
    "weight": 85,
    "height": 175,
    "illness": "حمى عالية",
    "companionPhone": "0123456789",
    "nurseName": "فاطمة"
  }'
```

### تسجيل العلامات الحيوية
```bash
curl -X POST "http://localhost:5140/VitalSigns/Record" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "patientId": "patient-890",
    "temperature": 37.5,
    "heartRate": 78,
    "bloodPressure": 120
  }'
```

---

## 📝 الخلاصة

```
Database ← Controllers ← API Endpoints ← Flutter App
```

كل API endpoint يتعامل مع عملية محددة على قاعدة البيانات:
- ✅ استخراج البيانات (GET)
- ✅ إضافة بيانات جديدة (POST)
- ✅ تحديث البيانات (PUT)
- ✅ حذف البيانات (DELETE)

والـ Authorization يحمي كل endpoint من الوصول غير المصرح! 🔐
