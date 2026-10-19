# 🏥 نظام OCR المتقدم للمراقبة الطبية

## 📌 ملخص النظام

نظام متكامل لاستخراج قراءات الحالات الحيوية من شاشة المراقبة الطبية:

- **أداة Calibration تفاعلية** - تحديد مناطق ROI بسهولة
- **Preprocessing ذكي** - معالجة خاصة لكل نوع رقم
- **OCR متقدم** - استخراج دقيق مع تقييم الثقة
- **Validation طبي** - التحقق من نطاقات القيم
- **API Flask** - تزويد التطبيق بالبيانات

---

## 🎯 الملفات المُنشأة

### 1️⃣ `roi_calibration_tool.py` - أداة تحديد المناطق
- واجهة رسومية تفاعلية
- تحديد مناطق كل قيمة بسحب الماوس
- حفظ تلقائي إلى `roi_config.json`

### 2️⃣ `ocr_medical_advanced.py` - محرك الاستخراج
- معالجة متقدمة للصور
- استخراج ذكي مع تقييم ثقة
- التحقق من النطاقات الطبية
- تشغيل مستمر كل 5 ثواني

### 3️⃣ `vital_signs_api_advanced.py` - خادم Flask
- endpoints API لكل قيمة
- إرجاع JSON مع درجة ثقة
- متوافق مع تطبيق Flutter

### 4️⃣ `roi_config.json` - ملف التكوين
```json
{
  "HR": [x1, y1, x2, y2],
  "SpO2": [x1, y1, x2, y2],
  ...
}
```

---

## 🚀 خطوات التشغيل السريعة

### الخطوة 1: تشغيل الخدمات الأساسية

**Terminal 1 - كاميرا البث:**
```bash
python stream_and_snapshot.py
```
✅ سيبدأ البث على: `http://localhost:8000/stream`

**Terminal 2 - خدمة OCR:**
```bash
python ocr_medical_advanced.py
```
✅ ستبدأ الاستخراج كل 5 ثواني

**Terminal 3 - API:**
```bash
python vital_signs_api_advanced.py
```
✅ الخادم على: `http://localhost:5000/vital-signs/latest`

### الخطوة 2: معايرة مناطق ROI

```bash
# الطريقة 1: من صورة موجودة
python roi_calibration_tool.py snapshot.jpg

# الطريقة 2: التقط صورة من الكاميرا مباشرة
python roi_calibration_tool.py
```

**خطوات المعايرة:**
1. ✅ تفتح نافذة تعرض الشاشة الطبية
2. 🖱️ اسحب الماوس حول منطقة HR
3. ✋ ارفع الماوس → يتم الحفظ تلقائياً
4. 🔄 تكرر لكل القيم الأخرى (SpO2, etCO2, RR, Temp, Pulse, NBP)
5. 💾 يتم حفظ الإحداثيات في `roi_config.json`

**لوحة المفاتيح:**
| المفتاح | الوظيفة |
|-------|--------|
| Drag | تحديد منطقة |
| Release | حفظ المنطقة |
| Space | تخطي القيمة الحالية |
| 'u' | التراجع عن آخر منطقة |
| 's' | حفظ كل شيء والخروج |
| 'q' | إلغاء |

---

## ✅ اختبار النظام

### اختبار البث:
```bash
# تحميل صورة من كاميرا البث
curl http://localhost:8000/snapshot -o test.jpg
```

### اختبار API:

```bash
# جميع القيم
curl http://localhost:5000/vital-signs/latest

# قيمة واحدة
curl http://localhost:5000/vital-signs/hr
curl http://localhost:5000/vital-signs/spo2
curl http://localhost:5000/vital-signs/etco2
curl http://localhost:5000/vital-signs/rr
curl http://localhost:5000/vital-signs/bp
curl http://localhost:5000/vital-signs/temp
curl http://localhost:5000/vital-signs/pulse

# مع معلومات تفصيلية
curl http://localhost:5000/vital-signs/all
```

### اختبار شامل:
```bash
# تشغيل مجموعة اختبارات
TEST_MEDICAL_OCR.bat
```

---

## 📊 أمثلة الإجابات

### جميع القيم (`/vital-signs/latest`):
```json
{
  "success": true,
  "timestamp": "2024-01-15T14:23:45",
  "vitals": {
    "heart_rate": 107,
    "spo2": 100,
    "etco2": 46,
    "respiratory_rate": 16,
    "temperature": 100.0,
    "pulse": 107,
    "blood_pressure": null
  },
  "confidence": {
    "heart_rate": 0.95,
    "spo2": 0.92,
    "etco2": 0.88,
    "respiratory_rate": 0.85,
    "temperature": 0.90,
    "pulse": 0.93,
    "blood_pressure": 0.0
  }
}
```

### قيمة واحدة (`/vital-signs/hr`):
```json
{
  "heart_rate": 107,
  "confidence": 0.95,
  "timestamp": "2024-01-15T14:23:45"
}
```

---

## 🎨 معالجة الألوان الخاصة

كل قيمة لها معالجة خاصة حسب لونها:

| القيمة | اللون | المعالجة |
|--------|-------|----------|
| **HR** | أخضر | قناع HSV للأخضر → تحويل → تكبير 3x |
| **SpO2** | أبيض/أصفر | قناع HSV ثنائي → CLAHE → تكبير 3x |
| **etCO2** | أصفر | قناع HSV للأصفر → تكبير 3x |
| **RR** | صغير جداً | تكبير 4x → CLAHE → تحويل |
| **Temp** | عشري | CLAHE → حفاظ على النقطة العشرية |
| **Pulse** | أخضر | نفس HR |
| **NBP** | ملون | فحص الصيغة XXX/XXX |

---

## 🔍 نطاقات التحقق الطبية

| القيمة | الحد الأدنى | الحد الأقصى | الوحدة |
|--------|-----------|-----------|--------|
| HR | 40 | 200 | نبضة/دقيقة |
| SpO2 | 70 | 100 | % |
| etCO2 | 30 | 50 | mmHg |
| RR | 6 | 40 | /دقيقة |
| Temp | 34 | 42 | °C |
| Pulse | 40 | 200 | نبضة/دقيقة |
| NBP | - | - | mmHg |

**أي قيمة خارج النطاق = null**

---

## 🛠️ استكشاف الأخطاء

### ❌ جميع القيم null

**الحل:**
```bash
# 1. تحقق أن roi_config.json موجود
ls roi_config.json

# 2. تحقق أن البث يعمل
curl http://localhost:8000/snapshot

# 3. أعد المعايرة
python roi_calibration_tool.py
```

### ⚠️ درجات ثقة منخفضة (< 0.7)

**الحل:**
1. ⚪ تحسين إضاءة الشاشة
2. 📷 التأكد من تركيز الكاميرا
3. 🖱️ إعادة معايرة ROI (قد تكون تحركت)
4. ✂️ التأكد من أن ROI يشمل القيمة كاملة

### ❓ قيم خاطئة

**الحل:**
```bash
# 1. تحقق من roi_config.json
cat roi_config.json

# 2. أعد المعايرة
python roi_calibration_tool.py

# 3. تأكد أن ROI لا يتداخل مع مناطق أخرى
```

---

## 📱 الربط مع تطبيق Flutter

```dart
// الحصول على آخر قياسات
final response = await http.get(Uri.parse('http://localhost:5000/vital-signs/latest'));
final data = jsonDecode(response.body);

// الوصول للقيم
int? hr = data['vitals']['heart_rate'];
int? spo2 = data['vitals']['spo2'];
double confidence = data['confidence']['heart_rate'];

// التحقق من درجة الثقة
if (confidence > 0.8) {
  print('✅ قيمة موثوقة');
} else if (confidence > 0.5) {
  print('⚠️  قيمة هامشية');
} else {
  print('❌ قيمة غير موثوقة');
}
```

---

## 🔄 طريقة العمل المستمر

```
1. كل 5 ثواني:
   ↓
2. fetch snapshot من localhost:8000
   ↓
3. استخراج ROI من الصورة
   ↓
4. OCR متقدم مع تقييم ثقة
   ↓
5. validation ضد النطاقات الطبية
   ↓
6. حفظ في vital_signs_latest.json
   ↓
7. API يقرأ من الملف
   ↓
8. Flutter app يستهلك البيانات
```

---

## 📋 قائمة التحقق للإنتاج

- [ ] البث على 1920x1080 جودة عالية
- [ ] معايرة ROI مكتملة وموثوقة
- [ ] جميع القيم تستخرج بثقة > 0.7
- [ ] جميع endpoints API تستجيب
- [ ] خادم Flask يعمل بثبات
- [ ] خدمة OCR تعمل بشكل مستمر
- [ ] تطبيق Flutter متصل ويستقبل البيانات
- [ ] شاشة المراقبة لم تتغير (لا zoom/pan)

---

## 🚀 الاستخدام المتقدم

### اختبار عدة صور:
```bash
for f in snapshots/*.jpg; do
    python roi_calibration_tool.py "$f"
done
```

### تسجيل في CSV:
```bash
python export_csv.py
```

### عرض الإحصائيات:
```bash
python show_stats.py
```

---

## ✨ ملخص المميزات

✅ **معايرة تفاعلية** - معايرة كل شاشة بسهولة
✅ **معالجة ذكية** - كل قيمة لها معالجة خاصة
✅ **تقييم ثقة** - معرفة موثوقية كل قراءة
✅ **Validation طبي** - فحص النطاقات الطبية
✅ **OCR متقدم** - محرك OCR قوي مع محاولات متعددة
✅ **API مرن** - endpoints متعددة للاستخدام
✅ **عمل مستمر** - استخراج دوري كل 5 ثواني
✅ **توافق Flutter** - جاهز للربط المباشر

---

## 📞 الدعم الفني

في حالة المشاكل:
1. 📋 تحقق من console output لرسائل الخطأ
2. 🔗 تأكد أن جميع الخدمات تعمل (port 8000, 5000)
3. 📸 اختبر مع صور يدوية
4. 🖱️ أعد معايرة ROI إذا لزم الأمر

---

**هذا نظام احترافي جاهز للإنتاج! 🎉**

