# 📊 شرح شامل لقاعدة البيانات - MedMonitor

---

## 🗂️ جداول قاعدة البيانات الرئيسية

قاعدة البيانات تحتوي على **6 جداول رئيسية + جداول Identity من ASP.NET**:

```
┌─────────────────────────────────────────────────────────┐
│                   قاعدة البيانات                        │
├─────────────────────────────────────────────────────────┤
│ 1. Users (+ AspNetRoles, AspNetUserRoles, etc)         │
│ 2. Beds                                                │
│ 3. AdmissionRequests                                   │
│ 4. Tasks                                               │
│ 5. VitalSigns                                          │
│ 6. Attachments                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 👥 جدول 1: Users (المستخدمين)

### وصف الجدول
يحتفظ بجميع مستخدمي النظام: سوبر أدمن، دكاترة، ممرضين، ومرضى.

### الحقول الأساسية

| الحقل | النوع | الوصف |
|--------|--------|--------|
| **Id** | string | معرف فريد للمستخدم (GUID) |
| **UserName** | string | اسم المستخدم لتسجيل الدخول |
| **Email** | string | البريد الإلكتروني |
| **PhoneNumber** | string | رقم الهاتف |
| **PasswordHash** | string | كلمة المرور (مشفرة) |
| **FullName** | string | الاسم الكامل |
| **DateOfBirth** | DateTime | تاريخ الميلاد |
| **Gender** | GenderEnum | النوع (ذكر/أنثى) |
| **ImageUrl** | string | رابط الصورة الشخصية |
| **IsActive** | bool | هل المستخدم نشط (true) |
| **Role** | UserRoleEnum | دور المستخدم |

### الحقول الإضافية

#### للدكاترة:
| الحقل | النوع | الوصف |
|--------|--------|--------|
| **Specialization** | string | التخصص الطبي (مثل: جراحة، أطفال) |

#### للـ Agora (نظام الفيديو):
| الحقل | النوع | الوصف |
|--------|--------|--------|
| **TockenAgora** | string | توكن اتصالات الفيديو |
| **TockenUserAgoraChat** | string | توكن الدردشة |
| **InCall** | bool | هل المستخدم حالياً في مكالمة فيديو |

#### للتحقق من الهوية:
| الحقل | النوع | الوصف |
|--------|--------|--------|
| **ResetOtp** | string | رمز OTP لإعادة تعيين كلمة المرور |
| **OtpExpiry** | DateTime | موعد انتهاء صلاحية الـ OTP |

### العلاقات المرتبطة
```
User ← 1:Many → Attachments
User ← 1:Many → Tasks (كـ Doctor)
User ← 1:Many → Tasks (كـ Nurse)
User ← 1:Many → AdmissionRequests (كـ Doctor)
User ← 1:Many → VitalSigns
```

---

## 🛏️ جدول 2: Beds (السراير)

### وصف الجدول
يحتفظ بمعلومات جميع السراير المتاحة في المستشفى.

### الحقول

| الحقل | النوع | الوصف | مثال |
|--------|--------|--------|--------|
| **Id** | int | معرف السرير | 1, 2, 3 |
| **BedNumber** | string | رقم السرير | "101", "A-5" |
| **Status** | BedStatusEnum | حالة السرير | Available (0), Occupied (1), Maintenance (2) |
| **PatientId** | string? | معرف المريض المسكن | "user-123" (null إذا فارغ) |
| **AssignedDate** | DateTime? | تاريخ تسكين المريض | 2026-06-02 10:30:00 |

### حالات السرير (BedStatusEnum)

```
Available = 0      → سرير فارغ جاهز
Occupied = 1       → سرير مشغول بمريض
Maintenance = 2    → سرير تحت الصيانة
```

### العلاقات
```
Bed ← Many:1 → User (PatientId → User.Id)
```

### مثال على البيانات
```
ID | BedNumber | Status | PatientId      | AssignedDate
1  | 101       | 1      | "user-123"     | 2026-06-02 10:30:00
2  | 102       | 0      | null           | null
3  | 103       | 2      | null           | null
4  | 104       | 1      | "user-456"     | 2026-06-01 15:45:00
```

---

## 📋 جدول 3: AdmissionRequests (طلبات الدخول)

### وصف الجدول
يحتفظ بطلبات دخول المرضى الجدد (من الدكتور للسوبر أدمن).

### الحقول

| الحقل | النوع | الوصف |
|--------|--------|--------|
| **Id** | int | معرف الطلب |
| **DoctorId** | string | معرف الدكتور الذي أرسل الطلب |
| **PatientName** | string | اسم المريض |
| **PatientId** | string? | معرف المريض (إذا كان موجود) |
| **Age** | int | عمر المريض بالسنوات |
| **Gender** | string? | النوع (Male/Female) |
| **Weight** | int? | الوزن بالكيلوجرام |
| **Height** | int? | الطول بالسنتيمتر |
| **Illness** | string? | المرض/الشكوى |
| **CompanionPhone** | string? | رقم هاتف المرافق |
| **NurseName** | string? | اسم الممرضة المسؤولة |
| **MedicalHistory** | string? | السجل الطبي |
| **Diagnosis** | string? | التشخيص الأولي |
| **CreatedAt** | DateTime | تاريخ إنشاء الطلب |
| **Status** | RequestStatusEnum | حالة الطلب |

### حالات الطلب (RequestStatusEnum)

```
Pending = 1   → طلب معلق (لم يُراجع بعد)
Approved = 2  → طلب معتمد (سوبر أدمن وافق)
Rejected = 3  → طلب مرفوض (سوبر أدمن رفضه)
```

### تدفق الطلب
```
1. الدكتور يملأ البيانات → Status = Pending ✓
2. السوبر أدمن يراجع → يضغط Approve/Reject
3. إذا Approve → Status = Approved ✓
4. المريض يذهب لـ Beds Screen
5. السوبر أدمن يختار سرير → المريض يُسكن
```

### مثال على البيانات
```
Id | DoctorId   | PatientName | Age | Status   | CreatedAt
1  | "doc-123"  | "أحمد علي"   | 45  | Approved | 2026-06-02 09:00:00
2  | "doc-456"  | "فاطمة محمد" | 28  | Pending  | 2026-06-02 10:15:00
3  | "doc-789"  | "عمر خالد"   | 35  | Rejected | 2026-06-02 08:30:00
```

---

## ✓ جدول 4: Tasks (المهام)

### وصف الجدول
يحتفظ بالمهام الموزعة من الدكاترة على الممرضات.

### الحقول

| الحقل | النوع | الوصف |
|--------|--------|--------|
| **Id** | int | معرف المهمة |
| **Title** | string | عنوان المهمة (مثل: "إعطاء دواء") |
| **Notes** | string? | ملاحظات إضافية |
| **StartTime** | DateTime | وقت بدء المهمة |
| **EndTime** | DateTime | وقت انتهاء المهمة |
| **Status** | TaskStatusEnum | حالة المهمة |
| **DoctorId** | string | معرف الدكتور |
| **NurseId** | string | معرف الممرضة |
| **PatientId** | string? | معرف المريض (اختياري) |

### حالات المهمة (TaskStatusEnum)

```
New = 1        → مهمة جديدة (لم تُبدأ)
InProgress = 2 → جاري العمل عليها
Completed = 3  → مكتملة
Cancelled = 4  → ملغاة
```

### مثال
```
Id | Title            | Status       | DoctorId   | NurseId    | PatientId
1  | "إعطاء دواء"      | InProgress   | "doc-123"  | "nurse-45" | "pat-890"
2  | "فحص ضغط الدم"   | Completed    | "doc-123"  | "nurse-45" | "pat-890"
3  | "تغيير الملابس"   | New          | "doc-456"  | "nurse-67" | "pat-123"
```

---

## 💊 جدول 5: VitalSigns (العلامات الحيوية)

### وصف الجدول
يحتفظ بسجلات العلامات الحيوية للمرضى (درجة الحرارة، ضغط الدم، نبضات القلب).

### الحقول

| الحقل | النوع | الوصف |
|--------|--------|--------|
| **Id** | int | معرف السجل |
| **PatientId** | string | معرف المريض |
| **Temperature** | float | درجة الحرارة (°C) |
| **HeartRate** | int | نبضات القلب (نبضة/دقيقة) |
| **BloodPressure** | int | ضغط الدم (ملم زئبق) |
| **RecordedAt** | DateTime | تاريخ ووقت التسجيل |

### مثال
```
Id | PatientId  | Temperature | HeartRate | BloodPressure | RecordedAt
1  | "pat-890"  | 37.5        | 78        | 120           | 2026-06-02 10:30:00
2  | "pat-890"  | 37.2        | 75        | 118           | 2026-06-02 12:30:00
3  | "pat-123"  | 38.1        | 82        | 125           | 2026-06-02 11:00:00
```

---

## 📎 جدول 6: Attachments (المرفقات)

### وصف الجدول
يحتفظ بالملفات والصور المرفقة بحسابات المستخدمين (تقارير، صور أشعات، إلخ).

### الحقول

| الحقل | النوع | الوصف |
|--------|--------|--------|
| **Id** | int | معرف المرفق |
| **UserId** | string | معرف المستخدم |
| **UploadedDate** | DateTime | تاريخ الرفع |
| **AttachUrl** | string | رابط الملف |
| **AddBy** | string? | من أضاف الملف |
| **Type** | AttachmentTypeEnum | نوع المرفق |

### أنواع المرفقات (AttachmentTypeEnum)

```
Report = 1     → تقرير
Scan = 2       → صورة أشعة
Analysis = 3   → تحليل
Other = 4      → أخرى
```

### مثال
```
Id | UserId     | Type   | AttachUrl                           | AddBy      | UploadedDate
1  | "pat-890"  | Report | "/uploads/report-123.pdf"          | "doc-123"  | 2026-06-02 10:00:00
2  | "pat-890"  | Scan   | "/uploads/xray-456.jpg"            | "nurse-45" | 2026-06-02 11:00:00
3  | "pat-123"  | Analysis| "/uploads/lab-789.xlsx"           | "doc-456"  | 2026-06-02 09:30:00
```

---

## 👤 أدوار المستخدمين (UserRoleEnum)

```
SuperAdmin = 1  → مسؤول النظام (يعتمد المرضى على السراير)
Doctor = 2      → الطبيب (يرسل طلبات دخول)
Nurse = 3       → الممرضة (تنفذ المهام)
Patient = 4     → المريض (يُسكن على سرير)
```

---

## 🔗 العلاقات بين الجداول

### رسم العلاقات
```
┌─────────────────────────────────────────────────────────┐
│                        Users                           │
│  (SuperAdmin, Doctor, Nurse, Patient)                  │
└─────────────┬───────────────────────┬──────────────────┘
              │                       │
              │ 1:Many                │ 1:Many
              │                       │
      ┌───────▼─────────┐    ┌────────▼──────────┐
      │ AdmissionRequests│    │ Attachments      │
      │ (Pending/Appr.) │    │ (Reports, Scans) │
      └─────────────────┘    └──────────────────┘
              │
              │ (Doctor يرسل طلب)
              │
      ┌───────▼──────────────┐
      │ Beds                 │
      │ (Available/Occupied) │
      │ PatientId → User.Id  │
      └──────────────────────┘


      ┌──────────────┐      ┌──────────────┐
      │ Tasks        │      │ VitalSigns   │
      │ Doctor+Nurse │      │ Patient      │
      │ +Patient     │      │ (Heart, Bp)  │
      └──────────────┘      └──────────────┘
```

---

## 📊 العمليات الرئيسية على قاعدة البيانات

### 1. تسجيل دخول مريض جديد
```
① Doctor: ينشئ AdmissionRequest (Status = Pending)
② SuperAdmin: يراجع الطلب ويضغط Approve
   → Status يتغير من Pending → Approved
③ SuperAdmin: يختار سرير فارغ
   → Bed.Status = 1 (Occupied)
   → Bed.PatientId = "patient-id"
   → Bed.AssignedDate = DateTime.Now
```

### 2. تعيين مهمة للممرضة
```
① Doctor: ينشئ Task
   → Task.DoctorId = "doctor-id"
   → Task.NurseId = "nurse-id"
   → Task.Status = New
② Nurse: تبدأ المهمة
   → Task.Status = InProgress
③ Nurse: تنتهي من المهمة
   → Task.Status = Completed
```

### 3. تسجيل العلامات الحيوية
```
① Nurse: تقيس العلامات الحيوية
② تُضيف سجل جديد في VitalSigns:
   → Temperature = 37.5
   → HeartRate = 78
   → BloodPressure = 120
   → RecordedAt = DateTime.Now
```

### 4. تسريح مريض من السرير
```
① SuperAdmin: يضغط "Remove Patient"
② Backend يحدث:
   → Bed.Status = 0 (Available)
   → Bed.PatientId = null
   → Bed.AssignedDate = null
```

---

## 📈 إحصائيات لوحة التحكم (Dashboard)

```csharp
// الـ DashboardController يحسب الإحصائيات من القاعدة:

OccupiedBeds = Beds.Count(b => b.Status == 1)
AvailableBeds = Beds.Count(b => b.Status == 0)
TotalPatients = AdmissionRequests.Count(r => r.Status == 2) // Approved only
TotalDoctors = Users.Count(u => u.Role == 2)  // Doctor role
TotalNurses = Users.Count(u => u.Role == 3)   // Nurse role
TotalRequests = AdmissionRequests.Count()
```

---

## 🔐 الحماية والقيود

### Foreign Key Constraints
```csharp
// إذا حذفنا Doctor:
AdmissionRequest.DoctorId → OnDelete: Cascade
→ جميع طلباته تُحذف

// إذا حذفنا User:
Bed.PatientId → OnDelete: SetNull
→ الـ PatientId يُصبح null (السرير يبقى فقط يصير فارغ)

Task.PatientId → OnDelete: SetNull
→ المهمة تبقى لكن بدون مريض
```

---

## 💾 ملاحظات مهمة

### Primary Keys
- **Users**: Id (GUID string) - من ASP.NET Identity
- **Beds**: Id (int) - Auto-increment
- **AdmissionRequests**: Id (int) - Auto-increment
- **Tasks**: Id (int) - Auto-increment
- **VitalSigns**: Id (int) - Auto-increment
- **Attachments**: Id (int) - Auto-increment

### Default Values
```
User.IsActive = true
User.InCall = false
AdmissionRequest.Status = Pending
AdmissionRequest.CreatedAt = DateTime.UtcNow
Task.Status = New
VitalSign.RecordedAt = DateTime.UtcNow
Attachment.UploadedDate = DateTime.UtcNow
```

### Nullable Fields
- PatientId في Bed (null = فارغ)
- PatientId في Task (null = بدون مريض)
- Gender, Weight, Height, Illness إلخ في AdmissionRequest

---

## 🧪 أمثلة Queries شائعة

### 1. جلب جميع السراير الفارغة
```csharp
var availableBeds = dbContext.Beds
    .Where(b => b.Status == BedStatusEnum.Available)
    .ToList();
```

### 2. جلب طلبات المرضى المعلقة
```csharp
var pendingRequests = dbContext.AdmissionRequests
    .Where(r => r.Status == RequestStatusEnum.Pending)
    .Include(r => r.Doctor)
    .ToList();
```

### 3. جلب مهام الممرضة الجارية
```csharp
var nurseActiveTasks = dbContext.Tasks
    .Where(t => t.NurseId == nurseId && t.Status == TaskStatusEnum.InProgress)
    .ToList();
```

### 4. جلب العلامات الحيوية لمريض معين (آخر 24 ساعة)
```csharp
var vitalSigns = dbContext.VitalSigns
    .Where(v => v.PatientId == patientId 
        && v.RecordedAt >= DateTime.UtcNow.AddDays(-1))
    .OrderByDescending(v => v.RecordedAt)
    .ToList();
```

### 5. جلب إحصائيات قسم معين
```csharp
var stats = new {
    OccupiedBeds = dbContext.Beds.Count(b => b.Status == 1),
    AvailableBeds = dbContext.Beds.Count(b => b.Status == 0),
    TotalPatients = dbContext.AdmissionRequests
        .Count(r => r.Status == RequestStatusEnum.Approved),
};
```

---

## 📝 الخلاصة

**قاعدة البيانات تخدم:**
- ✅ إدارة المستخدمين (سوبر أدمن، دكاترة، ممرضات، مرضى)
- ✅ إدارة السراير والتسكين
- ✅ طلبات دخول المرضى الجدد
- ✅ تعيين المهام للممرضات
- ✅ تسجيل العلامات الحيوية
- ✅ إدارة المرفقات والملفات

كل هذا يتم من خلال **6 جداول فقط** مع علاقات قوية وحماية جيدة! 🎯
