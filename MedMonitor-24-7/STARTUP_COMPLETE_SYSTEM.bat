@echo off
REM ============================================================
REM MedMonitor - Complete System Startup
REM ============================================================
chcp 65001 > nul
cd /d "c:\Nahda CS\PROJECT FINAL-NUB\fiels project"

echo.
echo ============================================================
echo 🏥 MedMonitor - Complete System Startup
echo ============================================================
echo.

REM Activate Python venv
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo Creating Python virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
)

REM Install Python packages
echo Installing Python packages...
pip install -q opencv-python flask requests easyocr 2>nul

REM Detect camera
echo.
echo ============================================================
echo 🔍 Step 1: Detecting USB Camera
echo ============================================================
echo.
python detect_camera_quick.py

echo.
echo ============================================================
echo 🎥 Step 2: Starting Camera Flask Service (Port 8000)
echo ============================================================
echo.
echo Opening new window for Camera Service...
start "Camera Service - Port 8000" cmd /k python simple_camera_service.py

timeout /t 5

echo.
echo ============================================================
echo 🔍 Step 3: Starting OCR Extractor (Every 5 seconds)
echo ============================================================
echo.
echo Opening new window for OCR Extractor...
start "OCR Extractor" cmd /k python ocr_vital_signs_extractor.py

timeout /t 5

echo.
echo ============================================================
echo 📊 Step 4: Starting Vital Signs API (Port 5000)
echo ============================================================
echo.
echo Opening new window for API Service...
start "Vital Signs API - Port 5000" cmd /k python vital_signs_api.py

echo.
echo ============================================================
echo ✅ ALL SERVICES STARTED!
echo ============================================================
echo.
echo 📌 Open these URLs in your browser to test:
echo.
echo   🎥 Camera Stream:
echo      http://localhost:8000/stream
echo.
echo   📸 Single Snapshot:
echo      http://localhost:8000/snapshot
echo.
echo   ❤️ Vital Signs (JSON):
echo      http://localhost:5000/vital-signs/latest
echo.
echo   🩺 Health Status:
echo      http://localhost:5000/vital-signs/health
echo.
echo 💡 Services are running in separate windows.
echo    Check them for any errors or messages.
echo.
echo 📋 Backend (.NET) is running on:
echo    http://localhost:5140
echo.
echo ============================================================
echo Ready for Flutter App! 🚀
echo ============================================================
echo.

pause
