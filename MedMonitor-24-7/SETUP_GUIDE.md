# 🏥 Medical Monitor OCR System - CORRECTED SETUP

## ✅ النظام الصحيح والنظيف

### الملفات النشطة (ACTIVE):
```
Terminal 1: python stream_and_snapshot.py
  - USB Camera on port 8000
  - Takes snapshots every 5 seconds
  - Saves: snapshot_YYYYMMDD_HHMMSS_#.jpg

Terminal 2: python ocr_medical_monitor.py
  - Monitors for new snapshots
  - Processes with EasyOCR
  - Saves: vital_signs_latest.json

Terminal 3: python vital_signs_api_advanced.py
  - REST API on port 5000
  - Serves vital signs data to Flutter app
```

## ✅ تشغيل النظام

### Step 1: شغل USB Camera
```powershell
cd "c:/Nahda CS/PROJECT FINAL-NUB/fiels project"
python stream_and_snapshot.py
```
Expected output:
```
[+] USB camera initialized
[*] Streaming on port 8000
[*] Taking snapshots every 5 seconds
```

### Step 2: شغل OCR Processor
```powershell
cd "c:/Nahda CS/PROJECT FINAL-NUB/fiels project"
python ocr_medical_monitor.py
```
Expected output:
```
[+] EasyOCR initialized
[*] Monitoring for new snapshots...
[*] Processing: snapshot_20260602_203000_1.jpg
[+] Extracted vital signs:
    HR         = 126                (Conf: 0.99)
    SpO2       = 100                (Conf: 0.85)
    ...
[+] Saved: vital_signs_latest.json
```

### Step 3: شغل API Server
```powershell
cd "c:/Nahda CS/PROJECT FINAL-NUB/fiels project"
python vital_signs_api_advanced.py
```
Expected output:
```
GET /health                    → Health check
GET /vital-signs/latest        → All vital signs
Running on http://127.0.0.1:5000
```

## 🔧 المشاكل اللي تم تصحيحها

### 1. Bug في camera_ocr_complete.py (السطر 196)
**المشكلة:** كانت تحول القيم الفارغة إلى "0" بدل None
```python
# ❌ OLD (WRONG):
'value': text if text else "0",

# ✅ NEW (CORRECT):
'value': text if text else None,
```

### 2. Hardcoded Camera في camera_ocr_complete.py
**المشكلة:** كانت تفتح كاميرا اللابتوب بدل USB
```python
# ❌ OLD:
cap = cv2.VideoCapture(1)  # Opens laptop camera

# ✅ NEW:
cap = cv2.VideoCapture('http://localhost:8000/stream')  # Uses USB from stream_and_snapshot.py
```

### 3. Missing roi_config.json
**الحل:** تم إنشاء roi_config.json من ROI coordinates في ocr_system_final.py

## 📊 ملف vital_signs_latest.json

```json
{
  "timestamp": "2026-06-02T20:22:57.878394",
  "vitals": {
    "HR": "126",
    "SpO2": "100",
    "etCO2": "56",
    "Pulse": "126",
    "RR": "16",
    "Temp": "36.2"
  },
  "confidence": {
    "HR": 0.9961744895677288,
    "SpO2": 0.5145230813515259,
    ...
  }
}
```

## 🗑️ ملفات يمكن حذفها (OLD FILES)

هذه الملفات قديمة وممكن حذفها بأمان:
```
ultimate_camera_service.py      (18.9K) - Old version
camera_hd.py                    (11.7K) - Unused
camera_service_fixed.py         (5.4K)  - Old version
camera_tuner.py                 (4.8K)  - Diagnostic
camera_simple.py                (3.7K)  - Experimental
camera_simple_new.py            (3.7K)  - Experimental
diagnose_camera.py              (2.9K)  - Diagnostic
detect_camera.py                (2.2K)  - Diagnostic
detect_camera_quick.py          (543B)  - Stub
check_camera_specs.py           (2.8K)  - Diagnostic
find_usb_camera.py              (2.0K)  - Diagnostic
test_camera_service.py          (9.5K)  - Old testing
test_ocr_detailed.py            (10.4K) - Debug (keep for reference)
```

## ✅ Tesseract Alternative (Optional)

إذا كنت عايز تجرب Tesseract بدل EasyOCR:
```powershell
python test_ocr_system.py
```
هذا بيستخدم `pytesseract` للمقارنة.

## 🐛 Troubleshooting

### If you get 0 values:
1. Check ROI coordinates in roi_config.json match your monitor position
2. Verify camera is in focus and well-lit
3. Check snapshots are being created: `dir snapshot_*.jpg`
4. Try adjusting color thresholds in preprocess_roi() function

### If stream_and_snapshot.py doesn't start:
```powershell
$env:CAMERA_INDEX=0
python stream_and_snapshot.py
```

### If ocr_medical_monitor.py crashes:
```powershell
pip install easyocr
pip install -U torch torchvision
python ocr_medical_monitor.py
```

## 📝 Summary

النظام الآن:
- ✅ يأخذ snapshots من USB camera كل 5 ثواني
- ✅ يعالج الصور بـ EasyOCR
- ✅ يحفظ النتائج في vital_signs_latest.json
- ✅ يخدم البيانات عبر REST API على port 5000
- ✅ يعطي قيم صحيحة بدل "0"

شغّل في 3 terminals منفصلين وسيعمل كل شيء! ✨
