# 🧪 Guide to Testing - Admin Admission Workflow

## 📋 Checklist الاختبار

### ✅ Test Case 1: عرض الطلبات المعلقة

**الخطوات:**
1. افتح التطبيق وسجل دخول كـ Super Admin
2. اذهب إلى `Pending Admission Requests`
3. انتظر تحميل البيانات

**التوقعات:**
- ✅ يجب أن ترى قائمة بـ Request Cards
- ✅ كل card يحتوي على:
  - اسم الدكتور (Dr. Name)
  - اسم المريض (Patient Name)
  - الوقت المنقضي (Time Sent X min ago)
- ✅ إذا لم تكن هناك طلبات → "No Pending Requests"

---

### ✅ Test Case 2: فتح تفاصيل الطلب

**الخطوات:**
1. من قائمة الطلبات، انقر على أي request card
2. يجب أن تنتقل إلى شاشة التفاصيل

**التوقعات:**
- ✅ الـ Header يعرض اسم الدكتور
- ✅ جميع الحقول الـ 8 مملوءة بالبيانات:
  - Name: [اسم المريض من الدكتور]
  - ID: [رقم الهوية]
  - Age: [العمر]
  - Gender: [ذكر/أنثى] مع Checkboxes
  - Height: [الطول]
  - Illness: [المرض/التشخيص]
  - Companion Phone: [رقم المرافق]
  - Nurse Name: [اسم الممرضة]
- ✅ جميع الحقول Read-Only (خلفية رمادية)
- ✅ زري Approve و Rejection موجودة

---

### ✅ Test Case 3: الموافقة على الطلب (Approve)

**الخطوات:**
1. من شاشة التفاصيل، انقر "APPROVE"
2. انتظر Loading

**التوقعات:**
- ✅ Loading Dialog يظهر
- ✅ بعد النجاح → انتقل تلقائياً إلى Beds Screen
- ✅ Header يعرض "Beds : X/5"

---

### ✅ Test Case 4: عرض السراير

**الخطوات:**
1. بعد الموافقة، يجب أن تكون في Beds Screen
2. شاهد قائمة السراير

**التوقعات:**
- ✅ إذا كانت السراير مشغولة:
  - Monitor Image في الأعلى (مع Heart Rate، O2، وغيره)
  - معلومات المريض تحت الصورة
- ✅ إذا كانت السراير فارغة:
  - **بدون مريض معتمد:** White Background + "No Patient added yet"
  - **مع مريض معتمد:** Yellow Border + "Click to add patient" + ➕ Icon

---

### ✅ Test Case 5: إضافة المريض إلى سرير فارغ

**الخطوات:**
1. من Beds Screen، انقر على سرير فارغ (Yellow Border)
2. يجب أن يكون هناك مريض معتمد من الخطوة السابقة

**التوقعات:**
- ✅ Snackbar يظهر:
  ```
  ✅ Patient 'Ahmed' added to Bed 4
  ```
- ✅ السرير يعود للحالة الطبيعية
- ✅ قد يظهر معلومات المريض في السرير (إذا تم ربط Backend)

---

### ✅ Test Case 6: تحديث الكاميرا (Camera Refresh)

**الخطوات:**
1. في Beds Screen، شاهد أي bed مشغول
2. راقب الموجات في Monitor Image

**التوقعات:**
- ✅ الموجات تتحرك بسلاسة
- ✅ كل 5 ثواني، Monitor يتحدث (تحريك الموجات)
- ✅ لا تتوقف الحركة

---

### ✅ Test Case 7: الرفض (Rejection)

**الخطوات:**
1. من شاشة التفاصيل، انقر "REJECTION"
2. انتظر Processing

**التوقعات:**
- ✅ طلب الـ Reject يُرسل للـ Backend
- ✅ بعد النجاح → العودة إلى قائمة الطلبات
- ✅ الطلب المرفوض لا يظهر في القائمة بعد الـ Refresh

---

## 🎯 Edge Cases للاختبار

### Case 1: طلب بدون مريض معتمد
- **التوقع:** لا يظهر Yellow Border على السراير
- **التصرف:** عدم السماح بالإضافة

### Case 2: جميع السراير مشغولة
- **التوقع:** جميع السراير تعرض معلومات مرضى
- **التصرف:** لا يوجد Yellow Border

### Case 3: طلب بدون جميع البيانات الـ 8
- **التوقع:** الحقول الناقصة تظهر فارغة
- **التصرف:** عدم إظهار أخطاء، فقط حقول فارغة

### Case 4: تأخر الـ Backend
- **التوقع:** Loading Dialog يستمر في الظهور
- **التصرف:** بعد Timeout → Error Snackbar

---

## 📊 Data to Prepare

للاختبار الكامل، تأكد من وجود:

### 1. في قاعدة البيانات:
```sql
-- طلب قيد الانتظار
INSERT INTO AdmissionRequests VALUES (
  1, 'Dr. Magdy Osama', 'Ahmed Mohamed', 
  '1234567890', 25, 'ذكر', 180, 
  'عدوى الصدر', '01000000000', 'فاطمة',
  GETDATE(), 'pending', NULL
);
```

### 2. معلومات سرير فارغ:
```sql
INSERT INTO Beds VALUES (
  4, 1, NULL, 0  -- Bed 4, Unit 1, No patient, Available
);
```

---

## 🔍 ملاحظات الـ Debugging

### إذا لم تظهر الطلبات:
1. تحقق من Network Tab في DevTools
2. تأكد من أن `/AdmissionRequest/GetPending` يرجع بيانات
3. تحقق من الـ Response format

### إذا لم ينتقل إلى Beds Screen:
1. تحقق من `approvePatientRequest()` في AdmissionProvider
2. تأكد من أن Request ID موجود
3. راجع Logs للـ Navigation Errors

### إذا لم يظهر Yellow Border على السراير:
1. تحقق من أن `approvedPatient` لا يساوي null
2. تحقق من حالة السرير (`bed['status']`)
3. تأكد من أن البيانات تصل بشكل صحيح

---

## 📱 Screenshots للتوثيق

بعد الاختبار الناجح، قم بأخذ:
1. صورة من Pending Requests Screen
2. صورة من Patient Details Screen (مع البيانات الـ 8)
3. صورة من Beds Screen (مع Yellow Border)
4. صورة من Beds Screen (مع سرير مشغول)

---

## ✅ Final Checklist

- [ ] جميع الطلبات تظهر بشكل ديناميكي
- [ ] البيانات الـ 8 تملأ الحقول تلقائياً
- [ ] Approve يأخذك إلى Beds Screen
- [ ] Yellow Border يظهر على السراير الفارغة
- [ ] Click على سرير يضيف المريض
- [ ] Snackbar يظهر بعد الإضافة
- [ ] الكاميرا تتحدث كل 5 ثواني
- [ ] Rejection يعود إلى القائمة
- [ ] لا توجد أخطاء في Console

---

**🎉 بعد نجاح جميع الاختبارات، النظام جاهز للعمل!**
