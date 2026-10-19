# 🚀 نظام الكاميرا عالي الجودة - دليل التثبيت والتشغيل

## 📋 ملخص التحسينات

تم إنشاء نظام محسّن بالكامل لاستخراج العلامات الحيوية من شاشة المراقب الطبي:

### ✅ الملفات المنشأة:

1. **camera_hd.py** (8.2 KB)
   - خدمة Flask لبث الكاميرا
   - تحسينات أجهزية متقدمة
   - معالجة صور متقدمة

2. **ocr_optimized.py** (10.5 KB)
   - استخراج العلامات الحيوية الذكي
   - استخراج ROI منفصل لكل قيمة
   - تحقق من صحة القيم

3. **roi_calibrator.py** (9.7 KB)
   - أداة معايرة تلقائية
   - تحليل تخطيط الشاشة
   - توليد خريطة ROI مثالية

4. **START_CAMERA_HD.bat**
   - مشغل سريع لخدمة الكاميرا

5. **START_OCR_OPTIMIZED.bat**
   - مشغل سريع لخدمة OCR

---

## 🎯 خطوات التشغيل الكاملة

### المرحلة الأولى: التحضير

```bash
# تأكد أنك في المجلد الصحيح
cd "c:\Nahda CS\PROJECT FINAL-NUB\fiels project"
```

### المرحلة الثانية: تشغيل خدمة الكاميرا

**افتح Terminal/Command Prompt جديد:**

```batch
START_CAMERA_HD.bat
```

**انتظر:**
```
📹 Opening camera with HIGH QUALITY settings...
✅ Camera opened!

🔧 Setting resolution to 1920x1080...
   Resolution: 1920x1080
🔧 Setting MJPEG codec...
🔧 Optimizing exposure settings...
✅ All camera settings configured!

⏳ Warming up camera (reading 30 frames)...
✅ Camera ready!

======================================================================
🚀 Flask Server Ready!
======================================================================

📺 STREAMS:
  🔴 RAW:      http://localhost:8000/stream
  🟢 ENHANCED: http://localhost:8000/stream-enhanced

📸 SNAPSHOTS:
  🔴 RAW:      http://localhost:8000/snapshot
  🟢 ENHANCED: http://localhost:8000/snapshot-enhanced
```

**دع نافذة الكاميرا مفتوحة!**

---

### المرحلة الثالثة: اختبار جودة الكاميرا

**افتح متصفح (Chrome, Edge, Firefox):**

```
http://localhost:8000/stream-enhanced
```

**تحقق من:**
- ✅ الأرقام واضحة جداً
- ✅ تباين عالي (أبيض على أسود)
- ✅ لا توجد ضبابية
- ✅ لا يوجد توهج أو حرقان
- ✅ الصورة حادة

**إذا كانت الجودة سيئة:**

توقف الكاميرا واضبط الإضاءة أو زاوية الكاميرا، ثم أعد التشغيل.

---

### المرحلة الرابعة: معايرة ROI (اختياري لكن موصى به)

**افتح Terminal جديد:**

```bash
cd "c:\Nahda CS\PROJECT FINAL-NUB\fiels project"

# تأكد من تفعيل البيئة الافتراضية
venv\Scripts\activate.bat

# شغّل معايرة ROI
python roi_calibrator.py
```

**سيخرج:**
```
📊 ROI CALIBRATION - ANALYZING MONITOR LAYOUT

✅ Camera frame: 1920x1080

✅ Found 24 potential digit regions

📍 Detected regions by row:

   Row 1: 3 regions
   Row 2: 5 regions
   ...

🎯 SUGGESTED ROI MAP:

roi_map = {
    'hr': (1440, 100, 1920, 350),
    'spo2': (1440, 250, 1920, 450),
    ...
}

✅ Visualization saved to: roi_calibration/roi_layout.jpg
✅ Config saved to: roi_calibration/optimal_roi_config.json
```

**ستجد في `roi_calibration/` مجلد:**
- `roi_layout.jpg` - خريطة ROI مع الألوان
- `roi_*.jpg` - عينات من كل منطقة
- `optimal_roi_config.json` - الإحداثيات المثالية

**انسخ الإحداثيات من `optimal_roi_config.json` و احفظها للخطوة التالية!**

---

### المرحلة الخامسة: ضبط ROI (إذا لزم الأمر)

إذا لم تكن النتائج دقيقة، اضبط الإحداثيات:

**فتح `ocr_optimized.py`:**
- اذهب إلى السطر 115
- استبدل `roi_map` بالإحداثيات من `optimal_roi_config.json`
- احفظ الملف

---

### المرحلة السادسة: تشغيل خدمة OCR

**افتح Terminal جديد آخر:**

```batch
START_OCR_OPTIMIZED.bat
```

**ستشاهد:**
```
======================================================================
🏥 OPTIMIZED MEDICAL MONITOR OCR
======================================================================
Using enhanced camera feed + ROI extraction + upscaling
Extracting every 5 seconds... Press Ctrl+C to stop

[Iteration #1] 16:49:25
----------------------------------------------------------------------

✅ VITAL SIGNS EXTRACTED:

   ❤️  Heart Rate: 127 bpm
   🫁 SpO2: 100 %
   💉 Blood Pressure: 138/83 
   🌬️  Respiratory Rate: 16 
   🌡️  Temperature: 102.8 °C
   💓 Pulse: 126 bpm
   💨 etCO2: 61 

✅ Saved to vital_signs_latest.json

⏳ Waiting 5 seconds...
```

---

## 📊 الملفات الناتجة

### 1. `vital_signs_latest.json`
يُحدّث كل 5 ثوان:

```json
{
  "heart_rate": 127,
  "spo2": 100,
  "blood_pressure": "138/83",
  "respiratory_rate": 16,
  "temperature": 102.8,
  "pulse": 126,
  "etco2": 61,
  "timestamp": "2025-05-25T16:49:25.020976"
}
```

### 2. `ocr_debug_images/` (اختياري)
عند تفعيل `debug=True`:
- `roi_hr_*.jpg` - منطقة ضربات القلب
- `roi_spo2_*.jpg` - منطقة تشبع الأكسجين
- إلخ...

### 3. `roi_calibration/` (عند تشغيل المعايرة)
- `roi_layout.jpg` - خريطة الأماكن
- `roi_*_sample.jpg` - عينات المناطق
- `optimal_roi_config.json` - الإحداثيات

---

## 🔧 اختبار سريع

للتحقق من أن كل شيء يعمل:

```bash
# اختبر الاستيراد
python -c "import cv2; import numpy as np; import easyocr; print('✅ OK')"

# اختبر الكاميرا
python detect_camera_quick.py

# اختبر OCR
python -c "import easyocr; print('✅ OCR Ready')"
```

---

## 🐛 استكشاف الأخطاء

| المشكلة | الحل |
|--------|-----|
| **Port 8000 مشغول** | `taskkill /IM python.exe /F` |
| **No camera found** | اختبر `detect_camera_quick.py` |
| **جودة الصورة سيئة** | اضبط التعريض والإضاءة |
| **القيم null** | أعد تشغيل الكاميرا |
| **القيم خاطئة** | شغّل `roi_calibrator.py` |
| **بطء العملية** | تحقق من استخدام CPU |

---

## 🎨 التخصيص المتقدم

### تحسين صورة الكاميرا:

في `camera_hd.py` السطور 61-66:

```python
cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 0.25)
cap.set(cv2.CAP_PROP_EXPOSURE, -6)        # [-15 إلى 0] - جرب -8 أو -10
cap.set(cv2.CAP_PROP_BRIGHTNESS, 30)      # [0 إلى 100]
cap.set(cv2.CAP_PROP_CONTRAST, 90)        # [0 إلى 100]
cap.set(cv2.CAP_PROP_SATURATION, 70)      # [0 إلى 100]
```

### تحسين OCR:

في `ocr_optimized.py` السطور 140-160:

```python
# زيادة التكبير
image_upscaled = self.upscale_image(image, scale=3)  # من 2 إلى 3

# تقليل حد الثقة
if confidence > 0.3:  # من 0.4 إلى 0.3
```

---

## 📈 مؤشرات الأداء الجيد

✅ **كاميرا:**
- دقة 1920x1080 فعلية
- 30 FPS
- بدون تأخير مرئي
- صورة حادة

✅ **OCR:**
- استخراج كل 5 ثوان
- جميع القيم السبع ممتلئة
- ثقة > 0.4
- قيم معقولة

✅ **JSON:**
- يُحدّث كل 5 ثوان
- timestamp صحيح
- نطاقات القيم منطقية

---

## 🎯 الأهداف النهائية

الهدف الأساسي: استخراج هذه القيم بدقة ✅

```
HR = 127 bpm
SpO2 = 100%
etCO2 = 61
Pulse = 126 bpm
RR = 16
Temp = 102.8°C
BP = 138/83
```

---

## 💡 نصائح مهمة

1. **اترك خدمة الكاميرا تعمل** - هذه هي الأساس
2. **افتح المتصفح على المحسّن** - للتحقق من الجودة البصرية
3. **جرّب المعايرة** - توفر إحداثيات أفضل للشاشة الخاصة بك
4. **تفعيل Debug** - عند محاولة استكشاف الأخطاء
5. **اختبر كل 5 ثوان** - انتظر 3-4 دورات قبل الحكم

---

## 📞 الدعم السريع

**لا شيء يظهر:**
```
taskkill /IM python.exe /F
START_CAMERA_HD.bat
```

**جودة سيئة:**
- اضبط زاوية الكاميرا
- قلل الإضاءة المحيطة
- اختبر تعريض مختلف (-8, -10, -12)

**قيم خاطئة:**
```
python roi_calibrator.py
# انسخ الإحداثيات الجديدة إلى ocr_optimized.py
```

---

## ✅ الخطوات السريعة (TL;DR)

```bash
# 1. شغّل الكاميرا
START_CAMERA_HD.bat

# 2. (في Terminal جديد) اختبر الجودة
http://localhost:8000/stream-enhanced

# 3. (اختياري) عايّر ROI
venv\Scripts\activate.bat && python roi_calibrator.py

# 4. (في Terminal آخر) شغّل OCR
START_OCR_OPTIMIZED.bat

# 5. اشاهد النتائج
type vital_signs_latest.json
```

**تم! النظام جاهز للاستخدام مع التطبيق** 🎉
