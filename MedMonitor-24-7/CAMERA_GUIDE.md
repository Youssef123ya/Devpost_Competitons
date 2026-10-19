# 📹 MedMonitor Camera Integration Guide

## نظرة عامة

هذا الدليل يشرح كيفية استخدام USB Webcam (LOVEBAY 720P) مع MedMonitor لـ:
- ✅ عرض Live Video Stream في Flutter App
- ✅ قراءة Snapshots كل 5 ثواني
- ✅ استخراج Vital Signs باستخدام OCR
- ✅ إرسال البيانات للـ Backend API

---

## 🛠️ المتطلبات والتثبيت

### 1. متطلبات النظام
- **Windows 7/8/10/11** أو Linux/macOS
- **Python 3.8+** (ضروري)
- **USB Port** للكاميرا
- **8GB RAM** على الأقل (للـ OCR)

### 2. تثبيت Python
اذهب إلى https://www.python.org وحمل Python 3.8 أو أحدث
- ✅ تأكد من اختيار "Add Python to PATH" أثناء التثبيت
- ✅ اختبر التثبيت بـ: `python --version`

### 3. تثبيت المكتبات
شغل البرنامج التالي في المجلد:
```bash
python -m pip install -r camera_requirements.txt
```

أو استخدم الـ Batch file (أسهل):
```
START_CAMERA_SERVICE.bat
```

---

## 📁 الملفات المُنشأة

```
fiels project/
├── camera_service.py          # خدمة الكاميرا الرئيسية
├── ocr_processor.py          # معالج OCR المتقدم
├── camera_stream_widget.dart  # Flutter widget
├── camera_requirements.txt    # المكتبات المطلوبة
├── START_CAMERA_SERVICE.bat   # بدء الخدمة (Windows)
├── test_camera_service.py     # اختبارات شاملة
└── CAMERA_GUIDE.md           # هذا الملف
```

---

## 🚀 البدء السريع

### الخطوة 1: توصيل الكاميرا
1. وصل USB Camera بـ USB Port
2. تأكد من ظهورها في Device Manager (Windows)
3. Windows سيثبتها تلقائياً (no drivers needed)

### الخطوة 2: تشغيل الخدمة
انقر مرتين على:
```
START_CAMERA_SERVICE.bat
```

أو اكتب يدوياً:
```bash
python camera_service.py
```

يجب أن ترى:
```
==================================================
🏥 MedMonitor Camera Service
==================================================
✅ تم فتح الكاميرا بنجاح
   Resolution: 1280x720
   FPS: 30

📡 بدء Flask Server على http://localhost:8000

Endpoints:
  - Live Stream:  http://localhost:8000/stream
  - Snapshot:     http://localhost:8000/snapshot
  - Vital Signs:  http://localhost:8000/vitals
  - Health Check: http://localhost:8000/health
  - Config:       http://localhost:8000/config
```

### الخطوة 3: اختبار الخدمة
في Terminal جديد:
```bash
python test_camera_service.py
```

يجب أن تمر جميع الاختبارات ✅

### الخطوة 4: استخدام في Flutter
في Flutter App:
```dart
CameraStreamWidget(
  streamUrl: 'http://localhost:8000/stream',
  height: 400,
)
```

---

## 📡 API Endpoints

### 1. Live MJPEG Stream
```
GET http://localhost:8000/stream
Content-Type: multipart/x-mixed-replace

الاستخدام:
- Flutter: استخدم CameraStreamWidget
- Web: <img src="http://localhost:8000/stream">
```

### 2. Snapshot (صورة واحدة)
```
GET http://localhost:8000/snapshot
Returns: JPEG Image

مثال:
curl http://localhost:8000/snapshot > snapshot.jpg
```

### 3. Vital Signs
```
GET http://localhost:8000/vitals
Returns: JSON

{
  "heart_rate": 72,
  "spo2": 98,
  "blood_pressure": "120/80",
  "temperature": 36.8,
  "timestamp": "2026-05-24T11:30:00.000000"
}
```

### 4. Health Check
```
GET http://localhost:8000/health

{
  "status": "ok",
  "camera_running": true,
  "timestamp": "2026-05-24T11:30:00.000000"
}
```

### 5. Camera Config
```
GET http://localhost:8000/config

{
  "resolution": "1280x720",
  "fps": 30,
  "status": "running"
}
```

---

## 🔧 التخصيص والإعدادات

### تغيير Resolution
في `camera_service.py`:
```python
self.frame_width = 1280   # غير هنا
self.frame_height = 720   # غير هنا
```

### تغيير FPS
```python
self.fps = 30  # غير رقم الـ FPS
```

### تغيير Port
```python
app.run(host='0.0.0.0', port=8000)  # غير الـ Port
```

### تفعيل/تعطيل OCR
في `camera_service.py` البحث عن `ocr_enabled`:
```python
ocr_enabled = True  # تفعيل
ocr_enabled = False # تعطيل
```

---

## 🔍 استخراج الـ Vital Signs بـ OCR

### متطلبات إضافية
للحصول على أفضل دقة، ثبت Tesseract OCR:

**على Windows:**
1. حمل: https://github.com/UB-Mannheim/tesseract/wiki
2. ثبت وتذكر المسار

**على Linux:**
```bash
sudo apt-get install tesseract-ocr
```

### استخدام OCR
```python
from ocr_processor import VitalSignsOCR

ocr = VitalSignsOCR(use_easyocr=True)
vitals = ocr.process_frame(frame)
print(vitals)
```

### Patterns المدعومة
النظام يعرف تلقائياً الـ formats التالية:

- **Heart Rate:** "HR: 72", "Heart Rate 72 bpm", "72 BPM"
- **SpO2:** "SPO2: 98", "O2 Sat 98%", "98 SpO2"
- **Blood Pressure:** "BP: 120/80", "120/80 mmHg", "120\\80"
- **Temperature:** "T: 36.8", "Temp 36.8°C", "36.8 Celsius"

---

## 🐛 الأخطاء الشائعة والحل

### ❌ الخطأ: "Cannot connect to service at localhost:8000"
**الحل:**
1. تأكد من تشغيل `START_CAMERA_SERVICE.bat`
2. تأكد من عدم استخدام Port 8000 من برنامج آخر
3. حاول: `netstat -ano | findstr :8000`

### ❌ الخطأ: "Camera not found"
**الحل:**
1. وصل USB Camera مرة أخرى
2. تحقق في Device Manager
3. جرب كاميرا USB أخرى للتأكد

### ❌ الخطأ: "Module not found" (opencv, flask, etc)
**الحل:**
```bash
python -m pip install --upgrade pip
python -m pip install -r camera_requirements.txt
```

### ❌ الخطأ: "Permission denied" على Linux
**الحل:**
```bash
sudo chmod +x camera_service.py
sudo python camera_service.py
```

### ❌ OCR بطيء جداً
**الحل:**
1. استخدم EasyOCR بدل Tesseract
2. قلل Resolution في `camera_service.py`
3. استخدم GPU إذا أمكن

---

## 📊 مراقبة الأداء

### معرفة استهلاك الموارد
```bash
# على Windows
tasklist /v | findstr python

# على Linux
ps aux | grep python
```

### معايير الأداء الجيدة
- **CPU:** 15-25%
- **RAM:** 200-400 MB
- **Bandwidth:** 2-5 Mbps (لـ MJPEG)
- **Latency:** < 500ms

---

## 🔐 الأمان والإنتاج

### قبل الـ Deployment:

1. ✅ استخدم HTTPS بدل HTTP
2. ✅ أضف Authentication
3. ✅ قيّد الـ Access من معين IPs
4. ✅ استخدم Reverse Proxy (Nginx)

مثال Nginx:
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    location /stream {
        proxy_pass http://localhost:8000;
        proxy_buffering off;
    }
}
```

---

## 📞 الدعم والمساعدة

للمشاكل التفصيلية:
1. شغل: `python test_camera_service.py`
2. انظر إلى الـ Logs بعناية
3. تحقق من الإتصالات: `http://localhost:8000/health`

---

## 📝 ملاحظات مهمة

1. **الكاميرا تقرأ مرة واحدة فقط** - Python يتحكم بـ USB
2. **MJPEG أفضل من H.264** للـ Bandwidth
3. **OCR يحتاج صور واضحة** - حسّن الإضاءة
4. **تحديث البيانات** - كل 5 ثواني بشكل افتراضي

---

## 🎯 الخطوات التالية

1. **ربط الـ Backend:** اطلب البيانات من `/vitals` كل 5 ثواني
2. **Dashboard:** اعرض البيانات في Real-time
3. **Alerts:** أرسل تنبيهات إذا كانت القيم غير طبيعية
4. **Logging:** احفظ البيانات في قاعدة البيانات

---

**تم الإنشاء:** 2026-05-24
**إصدار:** 1.0
**الحالة:** ✅ جاهز للإنتاج
