# اختبار ميزة تحديث صورة الخلفية

## قائمة الاختبار (Testing Checklist)

### 1. اختبار الواجهة الأمامية (UI Testing)
- [ ] التوجه إلى صفحة المعاينة: `http://localhost:8000/hero/{heroId}/generate`
- [ ] البحث عن قسم "Background Image" في الـ Sidebar
- [ ] التحقق من ظهور الصورة الحالية (إن وجدت)
- [ ] التحقق من وجود زر "Change Image" عند المرور على الصورة
- [ ] التحقق من وجود منطقة تحميل واضحة (Upload area)

### 2. اختبار رفع الصورة (Upload Testing)
- [ ] اختيار صورة من الجهاز
- [ ] التحقق من ظهور مؤشر التحميل (spinner)
- [ ] التحقق من ظهور الصورة الجديدة في الـ Preview مباشرة
- [ ] التحقق من ظهور إشعار النجاح "Background image updated!"

### 3. اختبار تغيير الصورة (Change Image Testing)
- [ ] رفع صورة أولى
- [ ] رفع صورة ثانية
- [ ] التحقق من حذف الصورة الأولى
- [ ] التحقق من حفظ الصورة الثانية بشكل صحيح

### 4. اختبار المعاينة الفورية (Live Preview Testing)
- [ ] بعد رفع الصورة، يجب أن تظهر مباشرة في:
  - [ ] الصورة الصغيرة في الـ Sidebar
  - [ ] خلفية المعاينة (Preview background)
  - [ ] يجب أن تكون بحجم cover وفي المركز

### 5. اختبار الأخطاء (Error Testing)
- [ ] محاولة رفع ملف غير صورة (مثل PDF)
  - النتيجة المتوقعة: رسالة خطأ
- [ ] محاولة رفع صورة كبيرة جداً (> 5MB)
  - النتيجة المتوقعة: رسالة خطأ
- [ ] محاولة الرفع بدون اتصال إنترنت
  - النتيجة المتوقعة: رسالة خطأ في الشبكة

### 6. اختبار قاعدة البيانات (Database Testing)
- [ ] فتح قاعدة البيانات
- [ ] التحقق من تحديث حقل `background_image` في جدول `heroes`
- [ ] التحقق من وجود الصورة في مجلد `storage/app/public/heroes/`

### 7. اختبار الأمان (Security Testing)
- [ ] التحقق من أن الـ CSRF Token مرسل بشكل صحيح
- [ ] محاولة الوصول لـ Endpoint بدون تسجيل دخول
  - النتيجة المتوقعة: إعادة توجيه لصفحة تسجيل الدخول
- [ ] محاولة تحديث صورة hero تابعة لمستخدم آخر
  - النتيجة المتوقعة: رسالة خطأ 404

## الأوامر المفيدة للاختبار

### اختبار في الـ Browser Console
```javascript
// التحقق من وجود دالة handleBackgroundImageChange
typeof handleBackgroundImageChange // يجب أن يكون "function"

// محاكاة الاختيار التلقائي للملف
const input = document.getElementById('backgroundImageInput');
console.log(input); // يجب أن يكون موجود

// التحقق من CSRF Token
const token = document.querySelector('meta[name="csrf-token"]').content;
console.log(token); // يجب أن يظهر التوكن
```

### اختبار الـ API مباشرة
```bash
# استخدام curl لاختبار الـ Endpoint
curl -X POST "http://localhost:8000/hero/1/update-background-image" \
  -F "background_image=@/path/to/image.jpg" \
  -H "X-CSRF-TOKEN: your_csrf_token"
```

### فحص السجلات (Logs)
```bash
# عرض آخر 50 سطر من السجلات
tail -50 storage/logs/laravel.log

# البحث عن رسائل التحديث
grep "background_image" storage/logs/laravel.log
grep "Updating background image" storage/logs/laravel.log
```

## الملفات التي تم اختبارها

- [x] `app/Http/Controllers/HeroController.php` - لا توجد أخطاء صيغية
- [x] `routes/web.php` - لا توجد أخطاء صيغية
- [x] `resources/views/hero/preview.blade.php` - تعديل ناجح

## النتائج المتوقعة

### عند الرفع الناجح (Success Response)
```json
{
  "success": true,
  "message": "Background image updated successfully",
  "image_url": "/storage/heroes/heroXXXXXXXX.jpg",
  "image_path": "heroes/heroXXXXXXXX.jpg"
}
```

### عند الخطأ (Error Response)
```json
{
  "success": false,
  "message": "Failed to update background image: error details"
}
```

## ملاحظات مهمة

1. **التحديث الفوري**: الصورة تظهر فوراً في المعاينة دون الحاجة لتحديث الصفحة
2. **الحذف التلقائي**: الصورة القديمة تُحذف تلقائياً من التخزين
3. **التخزين الآمن**: الصور تُخزن في `public/storage/heroes/` بأسماء آمنة
4. **المصادقة المطلوبة**: المستخدم يجب أن يكون مسجل الدخول

## الدعم والمساعدة

في حالة حدوث مشاكل:
1. تحقق من السجلات في `storage/logs/laravel.log`
2. تأكد من وجود الـ CSRF Token في الـ HTML
3. تأكد من أن صلاحيات المجلد `storage/app/public/` صحيحة
4. تأكد من أن الـ Symlink موجود: `php artisan storage:link`
