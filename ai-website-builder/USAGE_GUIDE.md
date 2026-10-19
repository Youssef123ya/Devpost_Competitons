# نموذج الاستخدام - Background Image Update Feature

## 🚀 البدء السريع

### الخطوة 1: الذهاب إلى صفحة المعاينة
```
URL: http://localhost:8000/hero/{heroId}/generate
```

استبدل `{heroId}` برقم الـ Hero الفعلي (مثلاً: 1, 2, 3)

### الخطوة 2: البحث عن قسم Background Image
في الـ Sidebar على اليسار، اسحب لأسفل حتى تجد قسم "Background Image"

### الخطوة 3: اختيار الصورة
- **إذا كانت هناك صورة موجودة**: 
  - اضغط على الصورة أو الزر "Change Image"
- **إذا لم تكن هناك صورة**:
  - اضغط على منطقة التحميل

### الخطوة 4: اختر الصورة من جهازك
- اختر صورة بصيغة JPEG, PNG, GIF, أو WebP
- يجب أن تكون أصغر من 5 MB

### الخطوة 5: الانتظار والتحديث الفوري
- ستشاهد مؤشر تحميل
- بعد الانتهاء، الصورة ستظهر مباشرة في:
  - الـ Sidebar (معاينة صغيرة)
  - خلفية Hero في المعاينة الحية

---

## 📸 السيناريوهات المختلفة

### السيناريو 1: إضافة صورة لأول مرة

**الحالة الأولية**: لا توجد صورة

```
┌─────────────────────────────────────────────┐
│  Background Image Section                   │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │  📥                                 │   │
│  │                                     │   │
│  │  Click to upload image              │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**الخطوات**:
1. اضغط على منطقة التحميل
2. اختر صورة
3. مؤشر التحميل يظهر
4. الصورة تُحفظ وتظهر مباشرة

---

### السيناريو 2: تغيير الصورة الموجودة

**الحالة الأولية**: يوجد صورة

```
┌─────────────────────────────────────────────┐
│  Background Image Section                   │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │  [صورة]                            │   │
│  │  (عند المرور: زر "Change Image")    │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**الخطوات**:
1. مرر الماوس على الصورة
2. اضغط على "Change Image"
3. اختر صورة جديدة
4. الصورة القديمة تُحذف تلقائياً
5. الصورة الجديدة تظهر مباشرة

---

## 💾 البيانات المحفوظة

عند رفع الصورة، يتم حفظ:

### في قاعدة البيانات (جدول heroes):
```
background_image: "heroes/heroXXXXXXXXXXXXX.jpg"
```

### في نظام التخزين:
```
storage/app/public/heroes/heroXXXXXXXXXXXXX.jpg
```

### في المعاينة الحية:
- خلفية البطل تُحدث فوراً
- صورة المعاينة في الـ Sidebar تُحدث فوراً

---

## 🔍 معلومات API

### الـ Request

```http
POST /hero/{heroId}/update-background-image HTTP/1.1
Host: localhost:8000
Content-Type: multipart/form-data
X-CSRF-TOKEN: your_csrf_token

background_image: <file>
```

### الـ Response (نجاح)

```json
{
  "success": true,
  "message": "Background image updated successfully",
  "image_url": "/storage/heroes/heroXXXXXXXX.jpg",
  "image_path": "heroes/heroXXXXXXXX.jpg"
}
```

### الـ Response (خطأ)

```json
{
  "success": false,
  "message": "Failed to update background image: The uploaded file is invalid"
}
```

---

## ⚙️ الإعدادات والمتطلبات

| الإعداد | القيمة | الملاحظات |
|--------|--------|---------|
| **صيغ الملفات** | jpeg, png, gif, webp | محدد في الـ Validation |
| **الحد الأقصى للحجم** | 5120 KB (5 MB) | قابل للتعديل في Controller |
| **مجلد التخزين** | `storage/app/public/heroes/` | متاح للعامة |
| **الأمان** | CSRF Token + Auth | مطلوب للرفع |
| **التحديث** | فوري (Live) | دون تحديث الصفحة |

---

## 🛡️ الأمان والتحقق

### التحقق من الملف:
```php
'background_image' => 'required|image|mimes:jpeg,png,gif,webp|max:5120'
```

✅ يتحقق من:
- وجود الملف
- كون الملف صورة حقيقية (MIME type)
- الصيغ المسموحة
- حجم الملف

### التحقق من المستخدم:
- ✅ يجب أن يكون مسجل الدخول (middleware auth)
- ✅ يجب أن يكون Hero موجود (findOrFail)
- ✅ رسالة CSRF Token (prevention)

---

## 🐛 معالجة الأخطاء

### الخطأ: "The uploaded file is invalid"
**السبب**: ملف غير صورة أو صيغة غير مدعومة

**الحل**: اختر صورة من صيغ JPEG, PNG, GIF, أو WebP

### الخطأ: "The uploaded file is too large"
**السبب**: حجم الصورة أكبر من 5 MB

**الحل**: قلل حجم الصورة (استخدم أدوات التحرير مثل Photoshop أو Paint)

### الخطأ: "Error uploading image"
**السبب**: مشكلة في الاتصال أو الخادم

**الحل**: 
- تأكد من الاتصال بالإنترنت
- تحقق من أن الخادم يعمل
- ابدأ بصورة أصغر

---

## 📝 أمثلة واستخدامات

### مثال 1: تحديث صورة بطل التسويق

```
Hero ID: 5
الصورة الحالية: marketing-bg.jpg
الصورة الجديدة: summer-campaign.jpg

النتيجة:
✅ الصورة القديمة تُحذف
✅ الصورة الجديدة تُحفظ في heroes/hero5.jpg
✅ المعاينة تُحدث فوراً
✅ قاعدة البيانات تُحدث
```

### مثال 2: تغيير صورة متعددة مرات

```
المرة الأولى: upload hero-v1.jpg
│
└─ تُحفظ في heroes/hero1.jpg
│
النتيجة: المعاينة تُحدث

المرة الثانية: upload hero-v2.jpg
│
├─ hero-v1.jpg تُحذف
└─ hero-v2.jpg تُحفظ في heroes/hero1.jpg
│
النتيجة: المعاينة تُحدث مجدداً
```

---

## 📊 الإحصائيات والمراقبة

### تتبع الرفع:
```bash
# عرض السجلات
tail -f storage/logs/laravel.log | grep "background_image"

# النتيجة المتوقعة:
# [2024-01-20] Updating background image for hero...
# [2024-01-20] New background image uploaded...
# [2024-01-20] Background image updated successfully...
```

### فحص الملفات:
```bash
# عرض الصور المخزنة
ls -la storage/app/public/heroes/

# النتيجة المتوقعة:
# hero1.jpg
# hero2.png
# hero3.gif
```

---

## 🎓 الخطوات المتقدمة

### إذا كنت مطوراً:

#### اختبار الـ API مباشرة:
```bash
curl -X POST "http://localhost:8000/hero/5/update-background-image" \
  -F "background_image=@~/Downloads/image.jpg" \
  -H "X-CSRF-TOKEN: your_csrf_token"
```

#### اختبار في JavaScript:
```javascript
// في Browser Console
const input = document.getElementById('backgroundImageInput');
const event = new Event('change', { bubbles: true });
input.dispatchEvent(event);
```

#### تفعيل Debug Mode:
```bash
APP_DEBUG=true php artisan serve
# الآن سيظهر معلومات أكثر في الأخطاء
```

---

## 📖 المراجع والملفات الإضافية

- **التوثيق الكامل**: [UPDATE_BACKGROUND_IMAGE.md](./UPDATE_BACKGROUND_IMAGE.md)
- **دليل الاختبار**: [TESTING_BACKGROUND_IMAGE.md](./TESTING_BACKGROUND_IMAGE.md)
- **ملخص التغييرات**: [CHANGES_SUMMARY.md](./CHANGES_SUMMARY.md)

---

## ✨ الدعم والأسئلة الشائعة

**س: هل يمكن رفع أكثر من صورة واحدة؟**
ج: حالياً نعم، لكن يتم حفظ صورة واحدة فقط لكل Hero (الأخيرة تحل محل السابقة)

**س: هل يمكن استرجاع الصورة المحذوفة؟**
ج: لا، عند رفع صورة جديدة تُحذف الصورة القديمة نهائياً

**س: كم الوقت المتوقع للرفع؟**
ج: عادة أقل من ثانية (حسب حجم الصورة وسرعة الاتصال)

**س: هل آمن لرفع صور خاصة؟**
ج: الصور تُخزن في مجلد عام (public)، لذا تجنب الصور السرية جداً
