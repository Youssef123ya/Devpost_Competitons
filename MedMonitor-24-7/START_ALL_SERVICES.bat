@echo off
REM ============================================================
REM MedMonitor - Start All Services
REM ============================================================
REM This script starts:
REM 1. Camera Flask Service (localhost:8000)
REM 2. Vital Signs API Service (localhost:5000)
REM 3. OCR Extraction Service
REM ============================================================

cd /d "%~dp0"

echo.
echo ============================================================
echo 🏥 MedMonitor - Starting All Services
echo ============================================================
echo.

REM Check if venv exists
if not exist "venv" (
    echo ❌ Virtual environment not found!
    echo Creating venv...
    python -m venv venv
)

REM Activate venv
call venv\Scripts\activate.bat

REM Install/upgrade requirements
echo 📦 Installing/checking dependencies...
pip install -q --upgrade pip
pip install -q -r camera_requirements.txt 2>nul || echo ⚠️ camera_requirements.txt not found

echo.
echo ============================================================
echo 🎬 Starting Camera Service (Port 8000)...
echo ============================================================
echo.

REM Start Camera Service in new window
start "Camera Service" cmd /k "python camera_service_fixed.py"

timeout /t 3 /nobreak

echo.
echo ============================================================
echo 🔍 Starting OCR Extractor (Every 5 seconds)...
echo ============================================================
echo.

REM Start OCR Service in new window
start "OCR Extractor" cmd /k "python ocr_vital_signs_extractor.py"

timeout /t 3 /nobreak

echo.
echo ============================================================
echo 📊 Starting Vital Signs API (Port 5000)...
echo ============================================================
echo.

REM Start Vital Signs API in new window
start "Vital Signs API" cmd /k "python vital_signs_api.py"

echo.
echo ============================================================
echo ✅ All Services Started!
echo ============================================================
echo.
echo 🎥 Camera Stream:    http://localhost:8000/stream
echo 📸 Camera Snapshot:  http://localhost:8000/snapshot
echo 📊 Vital Signs API:  http://localhost:5000/vital-signs/latest
echo.
echo 💡 Tips:
echo   - Flutter app should connect to http://localhost:8000/stream
echo   - Check http://localhost:5000/vital-signs/health for OCR status
echo.
echo Press Ctrl+C in any window to stop that service
echo ============================================================
echo.

REM Keep main window open
pause
