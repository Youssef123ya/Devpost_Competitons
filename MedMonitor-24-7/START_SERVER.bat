@echo off
REM ==========================================
REM تشغيل خادم MedMonitor - AI Alert API
REM ==========================================
chcp 65001 >nul
color 0A

cd /d "c:\Nahda CS\PROJECT FINAL-NUB\fiels project\MedMonitor-master-BackEnd\MedMonitor-master\MedMonitor"

echo.
echo ==========================================
echo 🔧 تنظيف البناء السابق...
echo ==========================================
dotnet clean >nul 2>&1
echo ✅ تم التنظيف

echo.
echo ==========================================
echo 📦 استعادة المكتبات...
echo ==========================================
dotnet restore
if %errorlevel% neq 0 (
    echo ❌ فشلت استعادة المكتبات
    pause
    exit /b 1
)
echo ✅ تمت استعادة المكتبات

echo.
echo ==========================================
echo 🔨 بناء المشروع...
echo ==========================================
dotnet build
if %errorlevel% neq 0 (
    echo ❌ فشل البناء!
    pause
    exit /b 1
)
echo ✅ نجح البناء

echo.
echo ==========================================
echo 🚀 تشغيل الخادم...
echo ==========================================
echo.
echo ✨ الخادم يعمل على: http://localhost:5140
echo 📚 Swagger متاح على: http://localhost:5140/swagger
echo 🧪 اختبر من هنا: http://localhost:5140/AIAlert/Health
echo.
echo ⏸️  اضغط Ctrl+C لإيقاف الخادم
echo.

dotnet run
