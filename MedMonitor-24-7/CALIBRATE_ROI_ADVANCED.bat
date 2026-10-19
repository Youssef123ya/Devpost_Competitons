@echo off
REM Advanced ROI Calibration with OpenCV Fix

echo.
echo ========================================
echo 🎯 Advanced ROI Calibration System
echo ========================================
echo.

REM Check if venv exists
if not exist "venv\" (
    echo ❌ Virtual environment not found!
    echo Creating venv...
    python -m venv venv
)

REM Activate venv
call venv\Scripts\activate.bat

echo.
echo Step 1: Checking OpenCV Installation
echo ========================================
echo.

REM Check current OpenCV
python -c "import cv2; print(f'✅ OpenCV {cv2.__version__} installed')" 2>nul
if errorlevel 1 (
    echo ⚠️  OpenCV not found, installing...
)

echo.
echo Step 2: Fixing OpenCV (removing headless version)
echo ========================================
echo.

echo Uninstalling conflicting versions...
pip uninstall opencv-python-headless -y 2>nul
pip uninstall opencv-python -y 2>nul

echo Installing GUI-enabled OpenCV...
pip install opencv-python==4.13.0.92 --quiet

echo.
echo Step 3: Testing GUI Support
echo ========================================
echo.

python -c "import cv2; import numpy as np; img=np.zeros((300,300,3),dtype=np.uint8); cv2.imshow('test',img); cv2.waitKey(1000); cv2.destroyAllWindows(); print('✅ GUI Test Passed!')" 2>nul

if errorlevel 1 (
    echo ❌ GUI test failed!
    echo Try installing: pip install opencv-python
    pause
    exit /b 1
)

echo.
echo Step 4: Creating debug directory
echo ========================================
echo.

if not exist "debug_rois" (
    mkdir debug_rois
    echo ✅ Created debug_rois directory
) else (
    echo ✅ debug_rois directory exists
)

echo.
echo Step 5: Launching Advanced Calibration Tool
echo ========================================
echo.
echo Make sure camera stream is running:
echo   python stream_and_snapshot.py
echo.
echo Keyboard Controls:
echo   🖱️  Drag mouse to select ROI
echo   SPACE = skip vital sign
echo   't' = test OCR on selection
echo   'p' = preview ROI
echo   's' = save and exit
echo   'q' = cancel
echo.

pause

python roi_calibration_tool_advanced.py

echo.
echo ========================================
if exist "roi_config.json" (
    echo ✅ Calibration Complete!
    echo.
    echo roi_config.json created with coordinates:
    type roi_config.json
    echo.
    echo Next steps:
    echo   Terminal 2: python ocr_medical_advanced.py
    echo   Terminal 3: python vital_signs_api_advanced.py
    echo   Terminal 4: python test_ocr_system.py
) else (
    echo ⚠️  Calibration cancelled (no roi_config.json)
)
echo ========================================
echo.

pause
