@echo off
REM MedMonitor Camera Service Startup
REM هذا الملف يقوم بتثبيت المكتبات اللازمة وتشغيل خدمة الكاميرا

setlocal enabledelayedexpansion

echo.
echo =====================================================
echo   MedMonitor Camera Service Setup
echo   خدمة الكاميرا - مراقبة المريض
echo =====================================================
echo.

REM Check Python installation
echo [1/4] جاري التحقق من Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ Python غير مثبت!
    echo الرجاء تثبيت Python 3.8+ من https://www.python.org
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo ✅ تم العثور على: %PYTHON_VERSION%

echo.
echo [2/4] جاري تثبيت المكتبات المطلوبة...
echo الرجاء الانتظار... قد تستغرق دقائق عديدة
echo.

REM Install requirements
pip install -r camera_requirements.txt
if errorlevel 1 (
    echo.
    echo ❌ فشل تثبيت المكتبات
    echo الرجاء التحقق من الاتصال بالإنترنت
    echo.
    pause
    exit /b 1
)

echo.
echo [3/4] جاري التحقق من الكاميرا...
python -c "import cv2; cap = cv2.VideoCapture(0); ret = cap.isOpened(); cap.release(); print('✅ الكاميرا جاهزة' if ret else '❌ لم يتم العثور على كاميرا')"
if errorlevel 1 (
    echo.
    echo ⚠️  تحذير: قد لا تكون الكاميرا متصلة
    echo ملاحظة: حاول توصيل الكاميرا ثم حاول مرة أخرى
    echo.
)

echo.
echo [4/4] جاري بدء خدمة الكاميرا...
echo.
echo =====================================================
echo   Camera Service Starting...
echo   الخادم سيكون متاحاً على:
echo   - Live Stream:  http://localhost:8000/stream
echo   - Snapshot:     http://localhost:8000/snapshot
echo   - Vital Signs:  http://localhost:8000/vitals
echo   - Health Check: http://localhost:8000/health
echo =====================================================
echo.
echo اضغط Ctrl+C لإيقاف الخدمة
echo.

REM Start the camera service
python camera_service.py

REM If script gets here, service was stopped
echo.
echo ✅ تم إيقاف الخدمة
echo.
pause
