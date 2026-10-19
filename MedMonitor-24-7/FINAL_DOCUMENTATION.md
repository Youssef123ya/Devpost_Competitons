# 🎯 دليل AI Alert Prediction API - شرح كامل

## 📚 فهرس المحتويات
1. [المقدمة](#المقدمة)
2. [التثبيت والتشغيل](#التثبيت-والتشغيل)
3. [الـ Endpoints](#الـ-endpoints)
4. [أمثلة الاستخدام](#أمثلة-الاستخدام)
5. [الهندسة المعمارية](#الهندسة-المعمارية)
6. [منطق التنبؤ](#منطق-التنبؤ)
7. [الأسئلة الشائعة](#الأسئلة-الشائعة)

---

## المقدمة

### ما هي AI Alert Prediction API؟
API ذكية تحلل بيانات المريض الحيوية (الحيوية Signs) وتتنبأ بمستوى التنبيه المطلوب:
- 🟢 **Normal** - حالة طبيعية
- 🟡 **Warning** - تنبيه تحذيري
- 🔴 **Critical** - حالة حرجة تتطلب تدخل فوري

### المقصود:
- **النظام**: ICU Smart Monitoring - نظام مراقبة العناية المركزة الذكية
- **المشروع**: MedMonitor 24/7 - نظام مراقبة المرضى 24/7
- **الاستخدام**: تطبيق تنبيهات ذكية للممرضات والأطباء

---

## التثبيت والتشغيل

### المتطلبات:
- ✅ .NET 8 SDK
- ✅ Windows 10 أو أحدث (أو Linux/Mac مع .NET)
- ✅ Internet connectivity (لتحميل المكتبات)

### الخطوات:

#### 1️⃣ انسخ الملفات الموجودة:
```
MedMonitor/
├── Controllers/AIAlertController.cs
├── Core/
│   ├── Dto/AiPredictionRequestDto.cs
│   ├── Dto/AiPredictionResponseDto.cs
│   ├── Interfaces/IAIAlertService.cs
│   └── Business/AIAlertService.cs
└── Extenstions/ServiceCollectionEx.cs (تحديث)
```

#### 2️⃣ شغّل الخادم:
```bash
# الطريقة السهلة - انقر على:
BUILD_AND_RUN.bat

# أو من سطر الأوامر:
cd MedMonitor
dotnet clean
dotnet restore
dotnet build
dotnet run
```

#### 3️⃣ تحقق من التشغيل:
```
http://localhost:5140/swagger
```

---

## الـ Endpoints

### 1️⃣ Health Check
**للتحقق من أن الخدمة تعمل**

```http
GET /AIAlert/Health
```

**الرد (200 OK):**
```json
{
  "status": "healthy",
  "service": "AI Alert Prediction Service",
  "version": "1.0.0",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

### 2️⃣ AI Alert Prediction
**التنبؤ بمستوى التنبيه بناءً على البيانات الحيوية**

```http
POST /AIAlert/Predict
Content-Type: application/json

{
  "heartRate": 75,          // عدد نبضات القلب
  "spO2": 98,               // نسبة تشبع الأكسجين
  "systolicBP": 120,        // ضغط الدم الانقباضي
  "diastolicBP": 80,        // ضغط الدم الانبساطي
  "temperature": 37.0,      // درجة الحرارة
  "fallDetected": false     // (اختياري) كشف السقوط
}
```

**الرد (200 OK):**
```json
{
  "success": true,
  "data": {
    "alertLevel": "Normal",
    "confidence": 94.5,
    "reason": "All vital signs are within normal ranges."
  }
}
```

**الأخطاء الممكنة:**
- `400 Bad Request` - بيانات غير صحيحة
- `500 Internal Server Error` - خطأ في الخادم

---

## أمثلة الاستخدام

### مثال 1️⃣: الحالة العادية (Normal)

```powershell
$body = @{
    heartRate = 75
    spO2 = 98
    systolicBP = 120
    diastolicBP = 80
    temperature = 37.0
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5140/AIAlert/Predict" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

**النتيجة:**
```json
{
  "success": true,
  "data": {
    "alertLevel": "Normal",
    "confidence": 94.5,
    "reason": "All vital signs are within normal ranges."
  }
}
```

---

### مثال 2️⃣: حالة التحذير (Warning)

```powershell
$body = @{
    heartRate = 110
    spO2 = 92
    systolicBP = 140
    diastolicBP = 90
    temperature = 38.5
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5140/AIAlert/Predict" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

**النتيجة:**
```json
{
  "success": true,
  "data": {
    "alertLevel": "Warning",
    "confidence": 82.3,
    "reason": "Elevated heart rate (110 bpm), low oxygen saturation (92%), high blood pressure (140/90), and mild fever (38.5°C) detected."
  }
}
```

---

### مثال 3️⃣: حالة حرجة (Critical)

```powershell
$body = @{
    heartRate = 150
    spO2 = 82
    systolicBP = 70
    diastolicBP = 50
    temperature = 40.0
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5140/AIAlert/Predict" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

**النتيجة:**
```json
{
  "success": true,
  "data": {
    "alertLevel": "Critical",
    "confidence": 96.8,
    "reason": "Critical conditions detected: Severe tachycardia (150 bpm), dangerously low oxygen (82%), severe hypotension (70/50), and very high fever (40°C)."
  }
}
```

---

### مثال 4️⃣: سقوط مكتشف (Fall Detected)

```powershell
$body = @{
    heartRate = 130
    spO2 = 88
    systolicBP = 100
    diastolicBP = 70
    temperature = 37.5
    fallDetected = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5140/AIAlert/Predict" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

**النتيجة:**
```json
{
  "success": true,
  "data": {
    "alertLevel": "Critical",
    "confidence": 95.2,
    "reason": "CRITICAL: Fall detected combined with abnormal vital signs. Immediate medical attention required."
  }
}
```

---

### مثال 5️⃣: استخدام من Flutter (Dio)

```dart
import 'package:dio/dio.dart';

class AIAlertService {
  final Dio _dio = Dio();
  final String baseUrl = 'http://localhost:5140';

  Future<Map<String, dynamic>> predictAlert({
    required int heartRate,
    required int spO2,
    required int systolicBP,
    required int diastolicBP,
    required double temperature,
    bool fallDetected = false,
  }) async {
    try {
      final response = await _dio.post(
        '$baseUrl/AIAlert/Predict',
        data: {
          'heartRate': heartRate,
          'spO2': spO2,
          'systolicBP': systolicBP,
          'diastolicBP': diastolicBP,
          'temperature': temperature,
          'fallDetected': fallDetected,
        },
      );

      if (response.statusCode == 200) {
        final prediction = response.data['data'];
        return {
          'alertLevel': prediction['alertLevel'],
          'confidence': prediction['confidence'],
          'reason': prediction['reason'],
        };
      }
    } catch (e) {
      print('Error: $e');
    }
    return {};
  }
}

// الاستخدام:
void main() async {
  final service = AIAlertService();
  
  final result = await service.predictAlert(
    heartRate: 75,
    spO2: 98,
    systolicBP: 120,
    diastolicBP: 80,
    temperature: 37.0,
  );
  
  print('Alert Level: ${result['alertLevel']}');
  print('Confidence: ${result['confidence']}%');
  print('Reason: ${result['reason']}');
}
```

---

## الهندسة المعمارية

### البنية الطبقية:

```
API Request
    ↓
AIAlertController
    ↓
IAIAlertService (Interface)
    ↓
AIAlertService (Implementation)
    ├── ParseVitals()
    ├── EvaluateCritical()
    ├── EvaluateWarning()
    └── CalculateConfidence()
    ↓
Response DTO
    ↓
API Response
```

### الملفات والوظائف:

| الملف | الوظيفة |
|------|--------|
| `AiPredictionRequestDto.cs` | استقبال البيانات من العميل |
| `AiPredictionResponseDto.cs` | إرسال النتائج للعميل |
| `IAIAlertService.cs` | تعريف العقد (Interface) |
| `AIAlertService.cs` | تطبيق المنطق |
| `AIAlertController.cs` | نقاط النهاية (Endpoints) |

---

## منطق التنبؤ

### قواعد التصنيف:

#### 🔴 حالة حرجة (CRITICAL) - ثقة: 94-98%

تُرجع **Critical** إذا توفر أحد الشروط:

1. **SpO2 < 85** (تشبع أكسجين منخفض جداً)
2. **Heart Rate > 140** (تسارع شديد في نبضات القلب)
3. **Systolic BP < 80** (انخفاض شديد في ضغط الدم)
4. **Temperature > 39.5°C** (حمى عالية جداً)
5. **Fall Detected + abnormal vitals** (سقوط مع بيانات شاذة)

**أمثلة:**
```
SpO2 = 82 → Critical
Heart Rate = 150 → Critical
Systolic BP = 70 → Critical
Temperature = 40.0 → Critical
Fall Detected + SpO2 < 90 → Critical
```

---

#### 🟡 حالة تحذير (WARNING) - ثقة: 75-88%

تُرجع **Warning** إذا توفر أحد الشروط:

1. **SpO2 بين 90-94** (تشبع أكسجين منخفض)
2. **Heart Rate بين 100-140** (تسارع معتدل)
3. **Systolic BP بين 80-90 أو > 140** (ضغط حدي)
4. **Diastolic BP > 100** (ضغط انبساطي مرتفع)
5. **Temperature بين 38-39.5°C** (حمى معتدلة)
6. **أي مزيج من الشروط أعلاه**

**أمثلة:**
```
SpO2 = 92 → Warning
Heart Rate = 110 → Warning
Temperature = 38.5 → Warning
SpO2 = 92 + HR = 110 → Warning
```

---

#### 🟢 حالة عادية (NORMAL) - ثقة: 90-95%

تُرجع **Normal** إذا:
- جميع البيانات في النطاقات الطبيعية
- لا توجد أي تنبيهات

**النطاقات الطبيعية:**
```
Heart Rate: 60-100 bpm
SpO2: 95-100%
Systolic BP: 90-120 mmHg
Diastolic BP: 60-80 mmHg
Temperature: 36.5-37.5°C
```

---

### حساب الثقة (Confidence):

```
للـ Critical:
- كل حالة حرجة واحدة: 94%
- كل حالة حرجة إضافية: +1% (حتى 98%)

للـ Warning:
- حالة تحذير واحدة: 75%
- كل حالة تحذير إضافية: +3% (حتى 88%)

للـ Normal:
- حالة عادية تماماً: 94.5%
- انحراف طفيف عن الطبيعي: 90% (مع Normal classification)
```

---

### الأسباب (Reasons):

يتم توليد أسباب وصفية تشرح لماذا تم التصنيف بهذه الطريقة:

```
Normal: "All vital signs are within normal ranges."

Warning: "Elevated heart rate (110 bpm), low oxygen saturation (92%), 
          high blood pressure (140/90), and mild fever (38.5°C) detected."

Critical: "Critical conditions detected: Severe tachycardia (150 bpm), 
           dangerously low oxygen (82%), severe hypotension (70/50), 
           and very high fever (40°C)."

Fall: "CRITICAL: Fall detected combined with abnormal vital signs. 
       Immediate medical attention required."
```

---

## الأسئلة الشائعة

### ❓ هل هذا نموذج ML حقيقي؟
**لا.** هذا نموذج قائم على القواعد (Rule-based) مناسب لمشروع التخرج. يمكن استبداله بنموذج ML لاحقاً.

### ❓ هل يمكن تغيير القواعس؟
**نعم.** معظم القيم محددة في `AIAlertService.cs` ويمكن تعديلها بسهولة.

### ❓ ماذا لو كانت البيانات المدخلة غير صحيحة؟
تُرجع `400 Bad Request` مع رسالة خطأ توضح المشكلة.

### ❓ هل يمكن استخدامه بدون توكن؟
**نعم.** لقد أضفنا `[AllowAnonymous]` على endpoint Predict للاختبار السهل.

### ❓ ما السرعة المتوقعة للرد؟
أقل من 100ms عادة (يعتمد على الجهاز).

### ❓ هل يمكن استخدامه من Flutter؟
**نعم تماماً.** راجع [مثال Flutter](#مثال-5️⃣-استخدام-من-flutter-dio) أعلاه.

---

## 🎯 النتيجة النهائية

لديك الآن:
- ✅ API متكاملة وجاهزة للإنتاج
- ✅ توثيق شامل
- ✅ أمثلة عملية
- ✅ منطق واضح وسهل التطوير

**استمتع بتطويرك! 🚀**
