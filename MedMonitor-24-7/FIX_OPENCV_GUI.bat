@echo off
REM Fix OpenCV installation

echo.
echo ========================================
echo 🔧 Fixing OpenCV Installation
echo ========================================
echo.

REM Activate venv
call venv\Scripts\activate.bat

echo 1️⃣  Uninstalling opencv-python-headless...
pip uninstall opencv-python-headless -y

echo.
echo 2️⃣  Uninstalling any opencv-python...
pip uninstall opencv-python -y

echo.
echo 3️⃣  Installing opencv-python (GUI version)...
pip install opencv-python==4.13.0.92

echo.
echo 4️⃣  Testing GUI support...
python -c "import cv2; import numpy as np; img=np.zeros((300,300,3),dtype=np.uint8); cv2.imshow('test',img); cv2.waitKey(1000); cv2.destroyAllWindows(); print('✅ GUI working!')"

if errorlevel 1 (
    echo ❌ GUI test failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ OpenCV GUI Fixed!
echo ========================================
echo.
echo Now run:
echo   python roi_calibration_tool.py
echo.

pause
