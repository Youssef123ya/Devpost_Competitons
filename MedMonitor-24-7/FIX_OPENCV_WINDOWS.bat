@echo off
REM Fix OpenCV GUI on Windows - Alternative solution

echo.
echo ========================================
echo 🔧 Fixing OpenCV GUI on Windows
echo ========================================
echo.

call venv\Scripts\activate.bat

echo Step 1: Removing current OpenCV
echo ========================================
pip uninstall opencv-python -y 2>nul
pip uninstall opencv-contrib-python -y 2>nul
pip uninstall opencv-python-headless -y 2>nul

echo.
echo Step 2: Installing opencv-contrib-python (better Windows support)
echo ========================================
pip install opencv-contrib-python==4.13.0.92 --quiet

echo.
echo Step 3: Installing matplotlib (GUI fallback)
echo ========================================
pip install matplotlib --quiet

echo.
echo Step 3: Testing OpenCV GUI
echo ========================================

python -c "import cv2; print(f'OpenCV {cv2.__version__} with GUI support'); cv2.imshow('test', cv2.imread('temp_snapshot.jpg')); cv2.waitKey(100); cv2.destroyAllWindows(); print('✅ GUI Test Passed!')" 2>nul

if errorlevel 1 (
    echo ⚠️  cv2.imshow may not work, will use matplotlib instead
)

echo.
echo Step 4: Testing matplotlib
echo ========================================

python -c "import matplotlib.pyplot as plt; print('✅ Matplotlib ready')" 2>nul

echo.
echo ========================================
echo ✅ Installation Complete!
echo ========================================
echo.
echo Now run: python roi_calibration_tool_advanced.py
echo.

pause
