# تعليمات تشغيل التطبيق على الموبايل 📱

## ✅ التحديثات المطبقة

تم تحديث جميع الملفات للاتصال بالعنوان الجديد:

### 1. **Backend Configuration** ✅
- الـ Backend يستمع على: `http://192.168.1.4:5140`
- جميع الواجهات مفعّلة (استقبال من الموبايل)

### 2. **Flutter App (iOS & Android)** ✅
- تم تحديث `dio_client.dart`:
  - `_defaultBaseUrl = 'http://192.168.1.4:5140'`
  - `_androidEmulatorBaseUrl = 'http://192.168.1.4:5140'`
- تم تحديث `app_config.dart`:
  - `cameraServerIp = '192.168.1.4'`
  - `cameraApiPort = '5140'` (تم التصحيح من 5000)

### 3. **OCR Backend Integration** ✅
- تم تحديث `backend_integration.py` لتحميل backendUrl من config
- تم تحديث `ocr_config.json`:
  - `"backendUrl": "http://192.168.1.4:5140"`

---

## 🚀 خطوات التشغيل

### على الكمبيوتر:

**1. تأكد من توقف جميع العمليات:**
```bash
# أغلق أي نوافذ Terminal مفتوحة
# ثم افتح Terminal جديد
```

**2. ابدأ المشروع من جديد:**
```bash
# في مجلد الـ backend
cd "c:\PROJECTFINAL-NUB\fiels project\MedMonitor-master-BackEnd\MedMonitor-master\MedMonitor"
dotnet run
```

**3. في Terminal آخر، ابدأ OCR service:**
```bash
cd "c:\PROJECTFINAL-NUB\fiels project"
python camera_ocr_complete.py
```

### على الموبايل:

**المتطلبات:**
- ✅ الموبايل على نفس الشبكة Wi-Fi (192.168.1.x)
- ✅ Flutter app محدثة أو أعد بناؤها

**الخطوات:**
1. فتح Flutter app
2. تسجيل الدخول بحسابك
3. التطبيق سيتصل تلقائياً بـ `http://192.168.1.4:5140`

---

## 🔧 استكشاف الأخطاء

### إذا لم يستطع التطبيق الاتصال:

**1. تحقق من الاتصال بالشبكة:**
```bash
# على الموبايل: افتح Browser وجرّب:
http://192.168.1.4:5140/AIAlert/Health
# يجب أن ترى: {"status":"healthy",...}
```

**2. تحقق من جدار الحماية:**
- تأكد أن Windows Firewall يسمح بـ port 5140
- أو عطّل جدار الحماية مؤقتاً للاختبار

**3. أعد بناء Flutter app:**
```bash
cd "c:\PROJECTFINAL-NUB\fiels project\med_monitor\med_monitor"
flutter clean
flutter pub get
flutter run
```

---

## 📊 عناوين الخدمات

| الخدمة | الرابط | الجهاز |
|------|-------|------|
| Backend API | `http://192.168.1.4:5140` | PC + Mobile |
| OCR Service | `http://192.168.1.4:8000` | PC فقط |
| AI Alerts | `http://192.168.1.4:5140/AIAlert/Predict` | PC + Mobile |

---

## 🎯 الحالة الحالية

✅ **تم إصلاح:**
- Patient Name = **Maro Isaac** (بدلاً من Nurse One/Unknown)
- Patient ID = **22113355**
- Unit/Bed = **A1**
- JSON Property Casing (PatientId بدلاً من patientId)

✅ **مجهز للموبايل:**
- عنوان IP: 192.168.1.4
- جميع الـ URLs محدثة
- Backend يستمع على جميع الواجهات

---

**⚠️ ملاحظة مهمة:**
تأكد من أن الموبايل والكمبيوتر على نفس الشبكة Wi-Fi!
إذا غيرت الشبكة مجدداً، حدّث عنوان IP هنا.
