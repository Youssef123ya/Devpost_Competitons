# MedMonitor API - دليل الإعداد والتشغيل

## 📋 المتطلبات الأساسية

- **Visual Studio 2022** أو **Visual Studio Code**
- **.NET 7** أو أحدث
- **SQL Server** (اختياري - للـ Production)
- **Postman** أو **Thunder Client** (للاختبار)
- **Flutter SDK** (للاختبار مع الـ App)

---

## 🚀 خطوات البدء السريعة

### 1️⃣ فتح المشروع

```bash
cd "c:\Nahda CS\PROJECT FINAL-NUB\fiels project\MedMonitor-master-BackEnd\MedMonitor-master"
```

---

### 2️⃣ استعادة المكتبات (NuGet Packages)

في **Visual Studio**:
- اضغط `Ctrl + Shift + P` → اختر `NuGet Package Manager`
- أو استخدم Command Line:

```bash
dotnet restore
```

---

### 3️⃣ بناء المشروع (Build)

```bash
dotnet build
```

✅ تأكد من عدم وجود أخطاء في البناء

---

### 4️⃣ تشغيل الخادم

```bash
dotnet run
```

أو في **Visual Studio**:
- اضغط `F5` أو `Ctrl + F5`

**النتيجة المتوقعة**:
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5140
```

---

## 🔧 Configuration - الإعدادات

### ملف `appsettings.json`

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  },
  "ConnectionStrings": {
    "SqlServerConnection": "Data Source=.;Initial Catalog=MedMonitor;Integrated Security=True;"
  },
  "AllowedHosts": "*",
  "Jwt": {
    "Key": "VERY_SECURED_SECRET_JWT_TOKEN_KEY",
    "Issuer": "https://medmonitor.com",
    "Audience": "medmonitor-app"
  },
  "Twilio": {
    "AccountSID": "YOUR_TWILIO_SID",
    "AuthToken": "YOUR_TWILIO_TOKEN",
    "TwilioPhoneNumber": "+14847722729"
  }
}
```

### ملف `appsettings.Development.json`

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

---

## 🗄️ قاعدة البيانات

### خيار 1: In-Memory Database (للتطوير - الافتراضي)

المشروع يستخدم في-الذاكرة بشكل افتراضي في بيئة التطوير:

```csharp
// في Program.cs
if (builder.Environment.IsDevelopment())
{
    option.UseInMemoryDatabase("MedMonitorDev");
}
```

✅ **لا تحتاج إلى SQL Server**
⚠️ **البيانات تُفقد عند إيقاف الخادم**

---

### خيار 2: SQL Server (للـ Production)

1. **إنشاء قاعدة البيانات**:

```sql
CREATE DATABASE MedMonitor;
```

2. **تحديث Connection String**:

```json
"SqlServerConnection": "Server=YOUR_SERVER;Database=MedMonitor;User Id=sa;Password=YOUR_PASSWORD;"
```

3. **تشغيل Migrations**:

```bash
dotnet ef database update
```

---

## 🧪 اختبار API

### الطريقة 1: استخدام Postman

#### أ. تسجيل دخول (Login)

```
POST http://localhost:5140/api/login
Content-Type: application/json

{
  "userName": "admin",
  "password": "password123"
}
```

**Response**:
```json
{
  "statusCode": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "id": "user-id",
    "fullName": "Admin User",
    "role": 1
  }
}
```

#### ب. استخدام التوكن في الطلبات التالية

1. نسخ التوكن من الـ Response
2. في الطلب التالي، أضف Header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### ج. اختبار الـ Dashboard

```
GET http://localhost:5140/api/dashboard/Stats
Authorization: Bearer {token}
```

---

### الطريقة 2: استخدام Thunder Client (VS Code Extension)

1. افتح VS Code
2. اضغط `Cmd + Shift + P` → ابحث عن "Thunder Client"
3. انسخ الـ Request:

```http
### Login
POST http://localhost:5140/api/login
Content-Type: application/json

{
  "userName": "admin",
  "password": "password123"
}

###
```

---

### الطريقة 3: استخدام Flutter App

في التطبيق:

```dart
// في ApiService
const String baseUrl = 'http://localhost:5140/api';

// أو إذا كنت تستخدم emulator
const String baseUrl = 'http://10.0.2.2:5140/api';
```

---

## 🔌 اختبار Swagger (API Documentation)

1. شغّل المشروع
2. افتح في المتصفح:

```
http://localhost:5140/swagger/index.html
```

✅ ستظهر جميع الـ Endpoints بشكل تفاعلي

---

## 🌐 CORS - السماح للـ Flutter App

تأكد من إضافة CORS في `Program.cs`:

```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.WithOrigins(
                "http://localhost:3000",
                "http://localhost:5140",
                "http://10.0.2.2:5140"  // لـ Android Emulator
            )
           .AllowAnyMethod()
           .AllowAnyHeader()
           .AllowCredentials();
    });
});

app.UseCors();
```

---

## 📝 Database Seed - بيانات أولية

أضف بيانات اختبار في `Program.cs`:

```csharp
// بعد app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    
    // ستُنشأ البيانات تلقائياً عند أول تشغيل
    // أضف هنا البيانات الأولية إذا لزم الأمر
}
```

---

## 🛠️ استكشاف الأخطاء

### خطأ: "Unable to resolve service"

**السبب**: مشكلة في Dependency Injection

**الحل**:
```csharp
// تأكد من تسجيل الخدمات في Program.cs
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUsersService, UsersService>();
```

---

### خطأ: "Connection string not found"

**السبب**: المشروع يبحث عن SQL Server

**الحل**: تأكد من أن البيئة تُعتبر Development:

```bash
set ASPNETCORE_ENVIRONMENT=Development
dotnet run
```

---

### خطأ: "Token validation failed"

**السبب**: JWT Key غير متطابق

**الحل**: تأكد من أن `Jwt:Key` متطابق في جميع الأماكن

---

## 🚨 مشاكل شائعة

### مشكلة: الـ API غير متوفر من Flutter

**الحل**:
- تأكد من أن الخادم يعمل
- استخدم IP صحيح:
  - **على الجهاز**: `http://localhost:5140`
  - **على Android Emulator**: `http://10.0.2.2:5140`
  - **على Physical Device**: `http://192.168.X.X:5140`

### مشكلة: CORS Error

**الحل**: أضف الأصل في CORS:

```csharp
.WithOrigins("*")  // أو حدد الـ URL بدقة
```

### مشكلة: بيانات لا تحفظ بعد إيقاف الخادم

**الحل**: هذا طبيعي مع In-Memory Database. انتقل إلى SQL Server للإنتاج.

---

## 📊 Database Migrations

### إنشاء Migration جديد

```bash
dotnet ef migrations add MigrationName
```

### تطبيق Migrations

```bash
dotnet ef database update
```

### حذف آخر Migration

```bash
dotnet ef migrations remove
```

---

## 🔑 بيانات تجريبية للاختبار

### بيانات الدخول الافتراضية

```
Username: admin
Password: password123
Role: 1 (Admin/Super Admin)
```

---

## 📱 ربط مع Flutter App

### في `lib/services/api_service.dart`

```dart
class ApiService {
  static const String baseUrl = 'http://localhost:5140/api';
  // أو
  static const String baseUrl = 'http://10.0.2.2:5140/api'; // Emulator
  
  static Future<Response> login(String username, String password) async {
    try {
      return await Dio().post(
        '$baseUrl/login',
        data: {
          'userName': username,
          'password': password,
        },
      );
    } catch (e) {
      print('API Error: $e');
      rethrow;
    }
  }
}
```

---

## ✅ Checklist للبدء

- [ ] تثبيت .NET 7+
- [ ] فتح المشروع في Visual Studio
- [ ] تشغيل `dotnet restore`
- [ ] بناء المشروع بدون أخطاء
- [ ] تشغيل الخادم (`F5`)
- [ ] اختبار على `http://localhost:5140`
- [ ] اختبار Swagger
- [ ] اختبار من Postman
- [ ] ربط مع Flutter App
- [ ] اختبار جميع الـ Endpoints

---

## 🔗 مراجع مفيدة

- [ASP.NET Core Documentation](https://learn.microsoft.com/en-us/aspnet/core/)
- [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/)
- [JWT Authentication](https://jwt.io/)

---

**تم الإعداد في**: May 19, 2026
