@echo off
REM Simple script to run all services for MedMonitor

cd /d "c:\Nahda CS\PROJECT FINAL-NUB\fiels project"

echo Starting services...

REM Check if venv exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate venv
call venv\Scripts\activate.bat

REM Install packages if needed
echo Checking packages...
pip install -q opencv-python flask easyocr torch requests 2>nul

REM Start Camera Service in new window
echo.
echo ==== STARTING CAMERA SERVICE (Port 8000) ====
echo.
start "Camera Service" python simple_camera_service.py

REM Wait a bit
timeout /t 3

REM Start OCR Extractor in new window
echo.
echo ==== STARTING OCR EXTRACTOR ====
echo.
start "OCR Extractor" python ocr_vital_signs_extractor.py

REM Wait a bit
timeout /t 3

REM Start Vital Signs API in new window
echo.
echo ==== STARTING VITAL SIGNS API (Port 5000) ====
echo.
start "Vital Signs API" python vital_signs_api.py

echo.
echo ============================================================
echo ALL SERVICES STARTED!
echo.
echo Visit these URLs to test:
echo - Camera: http://localhost:8000/stream
echo - API: http://localhost:5000/vital-signs/latest
echo.
echo Services running in separate windows. Check them for errors.
echo ============================================================
echo.

pause
