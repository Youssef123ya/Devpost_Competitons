@echo off
REM 🏥 Start Complete Medical OCR System

echo.
echo ========================================
echo 🏥 MedMonitor - Complete System Startup
echo ========================================
echo.

REM Check if venv exists
if not exist "venv\" (
    echo ❌ Virtual environment not found!
    echo Run: python -m venv venv
    echo Then: venv\Scripts\activate
    pause
    exit /b 1
)

REM Activate venv
call venv\Scripts\activate.bat

echo ✅ Virtual environment activated

REM Check required packages
python -c "import cv2; import easyocr; import flask; import requests" 2>nul
if errorlevel 1 (
    echo ❌ Missing packages! Installing...
    pip install opencv-python easyocr flask requests
)

REM Create required directories
if not exist "logs\" mkdir logs

echo.
echo ========================================
echo 🎯 System Components
echo ========================================
echo.
echo 1. Camera Stream (port 8000)
echo    python stream_and_snapshot.py
echo.
echo 2. OCR Extraction (terminal output)
echo    python ocr_medical_advanced.py
echo.
echo 3. Flask API (port 5000)
echo    python vital_signs_api_advanced.py
echo.
echo 4. ROI Calibration Tool (GUI)
echo    python roi_calibration_tool.py
echo.
echo ========================================
echo.
echo Start each in separate terminal windows:
echo.
echo Terminal 1: python stream_and_snapshot.py
echo Terminal 2: python ocr_medical_advanced.py
echo Terminal 3: python vital_signs_api_advanced.py
echo.
echo Then run calibration:
echo Terminal 4: python roi_calibration_tool.py
echo.
echo ========================================
echo.
echo Test endpoints:
echo.
echo curl http://localhost:5000/vital-signs/latest
echo curl http://localhost:5000/vital-signs/all
echo curl http://localhost:8000/snapshot -o snapshot.jpg
echo.
echo ========================================
echo.

pause
