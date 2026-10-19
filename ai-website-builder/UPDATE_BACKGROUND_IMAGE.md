# تحديث صورة الخلفية - Background Image Update Feature

## 📋 الميزات المضافة

تم إضافة ميزة جديدة تتيح للمستخدم تغيير صورة خلفية البطل (Hero) مباشرة من المعاينة (Preview) مع ظهور التحديث فوراً.

## 📁 الملفات المعدلة

### 1. **HeroController.php** - إضافة Method جديدة
```php
public function updateBackgroundImage(Request $request, $id)
```
- **الموقع**: `app/Http/Controllers/HeroController.php`
- **الوظيفة**:
  - استقبال صورة جديدة
  - حذف الصورة القديمة من التخزين
  - تحميل الصورة الجديدة في مجلد `heroes`
  - حفظ المسار في قاعدة البيانات
  - إرجاع رابط الصورة الجديد بصيغة JSON

### 2. **web.php** - إضافة Route جديد
```php
Route::post('{id}/update-background-image', [HeroController::class, 'updateBackgroundImage'])->name('updateBackgroundImage');
```
- **الموقع**: `routes/web.php`
- **الـ Route**: `POST /hero/{id}/update-background-image`
- **الاسم**: `hero.updateBackgroundImage`

### 3. **preview.blade.php** - إضافة UI وJavaScript
- **الموقع**: `resources/views/hero/preview.blade.php`
- **الإضافات**:
  - قسم جديد "Background Image" في الـ Sidebar Controls
  - عرض معاينة الصورة الحالية
  - زر تفاعلي لتغيير الصورة (Change Image)
  - مؤشر رفع الصورة (upload indicator)
  - دالة JavaScript `handleBackgroundImageChange()` لمعالجة الرفع

## 🚀 كيفية الاستخدام

1. **الذهاب إلى صفحة المعاينة**: `hero/{id}/generate`

2. **في الـ Sidebar Controls**:
   - ابحث عن قسم "Background Image" (أسفل "Typography & Layout")
   - إذا كانت هناك صورة موجودة:
     - اضغط على الصورة أو على "Change Image"
     - اختر صورة جديدة
   - إذا لم تكن هناك صورة:
     - اضغط على منطقة التحميل (Upload area)
     - اختر صورة

3. **التحديث الفوري**:
   - الصورة تُرفع وتظهر مباشرة في المعاينة
   - يتم حفظ الصورة في قاعدة البيانات تلقائياً
   - الصورة القديمة تُحذف تلقائياً من التخزين

## 📊 المتطلبات

- صيغ الصور المدعومة: `jpeg, png, gif, webp`
- الحد الأقصى لحجم الصورة: 5120 KB (~5 MB)
- مجلد التخزين: `storage/app/public/heroes/`

## ✅ الاستجابات

### النجاح (200)
```json
{
  "success": true,
  "message": "Background image updated successfully",
  "image_url": "/storage/heroes/filename.jpg",
  "image_path": "heroes/filename.jpg"
}
```

### خطأ (500)
```json
{
  "success": false,
  "message": "Failed to update background image: error message"
}
```

## 🔄 سير العملية

```
المستخدم يختار صورة
         ↓
JavaScript: handleBackgroundImageChange()
         ↓
FormData + CSRF Token
         ↓
POST /hero/{id}/update-background-image
         ↓
HeroController::updateBackgroundImage()
  - حذف الصورة القديمة
  - حفظ الصورة الجديدة
  - تحديث قاعدة البيانات
         ↓
JSON Response مع image_url
         ↓
JavaScript: تحديث الصورة في المعاينة فوراً
         ↓
إظهار إشعار نجاح
```

## 🔒 الأمان

- التحقق من صيغة الصورة (MIME type)
- التحقق من حجم الملف
- استخدام CSRF Token
- مصادقة المستخدم (middleware auth)
- التحقق من وجود الـ Hero وملكيته للمستخدم

## 📝 ملاحظات

- الصورة القديمة تُحذف تلقائياً عند تحميل صورة جديدة
- يمكن تحديث الصورة عدة مرات دون قيود
- التحديث يحدث فوراً في الـ Preview دون الحاجة لتحديث الصفحة
- الصور تُخزن في `public/storage/heroes/` (متاح للعامة)
