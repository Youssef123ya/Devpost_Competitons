@echo off
REM ======================================================================
REM ULTRA QUALITY TESTING & DIAGNOSTICS
REM ======================================================================

cd /d "c:\Nahda CS\PROJECT FINAL-NUB\fiels project"

cls
echo.
echo ======================================================================
echo            🔬 ULTRA QUALITY TESTING & DIAGNOSTICS
echo ======================================================================
echo.
echo هذه الأداة ستساعد في تحديد مشاكل الجودة الحقيقية
echo.

:menu
cls
echo.
echo ======================================================================
echo                         🔧 DIAGNOSTIC MENU
echo ======================================================================
echo.
echo 1. 🎥 Start Improved Camera (with ULTRA enhancements)
echo 2. 🔍 Test ULTRA Quality Enhancement
echo 3. 📊 Show Debug Images (from last test)
echo 4. 📸 Compare Original vs Enhanced
echo 5. 🧪 Full OCR Test (with advanced preprocessing)
echo 6. 🎯 Save Diagnostic Report
echo 0. Exit
echo.
echo ======================================================================
echo.

set /p choice="Choose option [0-6]: "

if "%choice%"=="1" (
    echo.
    echo 🎥 Starting IMPROVED camera service...
    echo.
    call venv\Scripts\activate.bat
    python camera_hd.py
    goto menu
)

if "%choice%"=="2" (
    echo.
    echo 🔬 Testing ULTRA quality enhancement...
    echo.
    echo Make sure camera is running!
    echo.
    timeout /t 2 /nobreak
    call venv\Scripts\activate.bat
    python ultra_quality_tester.py
    echo.
    echo ✅ Done! Check ultra_quality_debug/ folder for images
    echo.
    pause
    goto menu
)

if "%choice%"=="3" (
    echo.
    echo 📊 Debug images from ultra_quality_debug/:
    echo.
    dir /b ultra_quality_debug\ 2>nul | more
    echo.
    echo (Open these images with Windows Image Viewer)
    echo.
    pause
    goto menu
)

if "%choice%"=="4" (
    echo.
    echo 📸 Comparing Original vs Enhanced...
    echo.
    echo This will show before/after of image enhancement
    echo.
    call venv\Scripts\activate.bat
    python -c "
from ultra_quality_tester import *
import cv2
import os

e = UltraQualityEnhancer()
frame = e.get_enhanced_snapshot()
if frame is not None:
    enhanced = e.apply_extreme_enhancement(frame)
    h, w = frame.shape[:2]
    
    # Create side-by-side comparison
    comparison = np.hstack([
        cv2.resize(frame, (640, 480)),
        cv2.resize(enhanced, (640, 480))
    ])
    
    cv2.imwrite('comparison.jpg', comparison)
    print('✅ Saved comparison.jpg (1280x480)')
    print('   Left: Original | Right: Enhanced')
else:
    print('❌ Camera not available')
"
    pause
    goto menu
)

if "%choice%"=="5" (
    echo.
    echo 🧪 Running full OCR test with advanced preprocessing...
    echo.
    call venv\Scripts\activate.bat
    python ocr_optimized.py
    goto menu
)

if "%choice%"=="6" (
    echo.
    echo 🎯 Generating diagnostic report...
    echo.
    (
        echo ======================================================================
        echo                   DIAGNOSTIC REPORT
        echo ======================================================================
        echo Date: %date% %time%
        echo.
        echo CAMERA INFORMATION:
        echo.
    ) > diagnostic_report.txt
    
    call venv\Scripts\activate.bat
    python detect_camera_quick.py >> diagnostic_report.txt 2>&1
    
    echo. >> diagnostic_report.txt
    echo. >> diagnostic_report.txt
    echo FILES CREATED: >> diagnostic_report.txt
    dir /b ultra_quality_debug\ 2>nul >> diagnostic_report.txt
    
    echo. >> diagnostic_report.txt
    echo ====================================================================== >> diagnostic_report.txt
    
    echo ✅ Report saved to: diagnostic_report.txt
    echo.
    type diagnostic_report.txt
    echo.
    pause
    goto menu
)

if "%choice%"=="0" (
    echo.
    echo 👋 Goodbye!
    echo.
    exit /b
)

echo.
echo Invalid option! Try again.
echo.
pause
goto menu
