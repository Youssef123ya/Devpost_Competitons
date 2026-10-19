@echo off
title ULTIMATE CAMERA SERVICE - Medical Monitor OCR
cd /d "c:\Nahda CS\PROJECT FINAL-NUB\fiels project"

echo.
echo ===============================================================
echo   ULTIMATE CAMERA SERVICE - High Quality USB Webcam
echo ===============================================================
echo.
echo Features:
echo   - DirectShow backend (Windows)
echo   - MJPG codec (professional quality)
echo   - Manual exposure & white balance
echo   - Light processing (CLAHE + sharpen)
echo   - 1920x1080 @ 30fps
echo   - 98%% JPEG quality
echo   - OCR-optimized pipeline
echo.

REM Activate virtualenv
call venv\Scripts\activate.bat

REM Run the service
echo Starting service...
echo.
python ultimate_camera_service.py

pause
