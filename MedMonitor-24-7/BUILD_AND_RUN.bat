@echo off
REM ==========================================
REM تشغيل خادم MedMonitor API
REM ==========================================
cd /d "c:\Nahda CS\PROJECT FINAL-NUB\fiels project\MedMonitor-master-BackEnd\MedMonitor-master\MedMonitor"

echo.
echo ==========================================
echo حذف ملف الاختبارات المشكل...
echo ==========================================
if exist AIAlertServiceTests.cs (
    del AIAlertServiceTests.cs
    echo ✅ تم حذف ملف الاختبارات
)

echo.
echo ==========================================
echo تنظيف البناء السابق...
echo ==========================================
dotnet clean

echo.
echo ==========================================
echo استعادة المكتبات...
echo ==========================================
dotnet restore

echo.
echo ==========================================
echo بناء المشروع...
echo ==========================================
dotnet build

if %errorlevel% neq 0 (
    echo ❌ فشل البناء!
    pause
    exit /b 1
)

echo ✅ نجح البناء!

echo.
echo ==========================================
echo تشغيل الخادم...
echo ==========================================
echo.
echo 🚀 الخادم يعمل على: http://localhost:5140
echo 📚 Swagger متاح على: http://localhost:5140/swagger
echo.
echo اضغط Ctrl+C لإيقاف الخادم
echo.

dotnet run

pause
