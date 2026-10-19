@echo off
REM ============================================================
REM MedMonitor - Integration Verification Script
REM ============================================================
REM Tests all components and verifies the integration is working
REM ============================================================

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ============================================================
echo 🔍 MedMonitor - Camera Integration Verification
echo ============================================================
echo.

REM Color codes for output
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "RESET=[0m"

REM Test results
set "TESTS_PASSED=0"
set "TESTS_FAILED=0"

REM ============================================================
echo Phase 1: Checking Python & Virtual Environment
echo ============================================================
echo.

if not exist venv (
    echo ❌ Virtual environment NOT found!
    echo Creating venv...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -q -r camera_requirements.txt
    set /A TESTS_FAILED+=1
) else (
    echo ✅ Virtual environment exists
    set /A TESTS_PASSED+=1
)

call venv\Scripts\activate.bat

echo.
echo ============================================================
echo Phase 2: Checking Python Files
echo ============================================================
echo.

set "FILES=simple_camera_service.py ocr_vital_signs_extractor.py vital_signs_api.py"

for %%f in (%FILES%) do (
    if exist "%%f" (
        echo ✅ %%f exists
        set /A TESTS_PASSED+=1
    ) else (
        echo ❌ %%f NOT FOUND!
        set /A TESTS_FAILED+=1
    )
)

echo.
echo ============================================================
echo Phase 3: Checking Flutter Files
echo ============================================================
echo.

set "DART_FILES=med_monitor\med_monitor\lib\providers\camera_provider.dart med_monitor\med_monitor\lib\providers\vital_signs_camera_provider.dart med_monitor\med_monitor\lib\widgets\camera_with_vitals_widget.dart"

for %%f in (%DART_FILES%) do (
    if exist "%%f" (
        echo ✅ %%f exists
        set /A TESTS_PASSED+=1
    ) else (
        echo ❌ %%f NOT FOUND!
        set /A TESTS_FAILED+=1
    )
)

echo.
echo ============================================================
echo Phase 4: Checking Python Dependencies
echo ============================================================
echo.

python -c "import cv2; print('✅ opencv-python OK')" 2>nul || (
    echo ❌ opencv-python NOT installed
    set /A TESTS_FAILED+=1
)

python -c "import flask; print('✅ flask OK')" 2>nul || (
    echo ❌ flask NOT installed
    set /A TESTS_FAILED+=1
)

python -c "import easyocr; print('✅ easyocr OK')" 2>nul || (
    echo ❌ easyocr NOT installed
    set /A TESTS_FAILED+=1
)

python -c "import requests; print('✅ requests OK')" 2>nul || (
    echo ❌ requests NOT installed
    set /A TESTS_FAILED+=1
)

if %TESTS_FAILED% EQU 0 (
    set /A TESTS_PASSED+=4
)

echo.
echo ============================================================
echo Phase 5: Checking Port Availability
echo ============================================================
echo.

netstat -ano | findstr :8000 >nul
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  Port 8000 is already in use
    set /A TESTS_FAILED+=1
) else (
    echo ✅ Port 8000 is available
    set /A TESTS_PASSED+=1
)

netstat -ano | findstr :5000 >nul
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  Port 5000 is already in use
    set /A TESTS_FAILED+=1
) else (
    echo ✅ Port 5000 is available
    set /A TESTS_PASSED+=1
)

echo.
echo ============================================================
echo Phase 6: Configuration Files
echo ============================================================
echo.

if exist camera_index.txt (
    set /p CAMERA_INDEX=<camera_index.txt
    echo ✅ camera_index.txt exists (value: !CAMERA_INDEX!)
    set /A TESTS_PASSED+=1
) else (
    echo ⚠️  camera_index.txt NOT found, will be created at runtime
)

if exist camera_requirements.txt (
    echo ✅ camera_requirements.txt exists
    set /A TESTS_PASSED+=1
) else (
    echo ❌ camera_requirements.txt NOT found!
    set /A TESTS_FAILED+=1
)

echo.
echo ============================================================
echo Phase 7: Camera Detection
echo ============================================================
echo.

if exist find_usb_camera.py (
    echo 📸 Attempting to detect USB camera...
    echo Please wait (may take 10-15 seconds)...
    echo.
    python find_usb_camera.py 2>nul | findstr "Camera 1" >nul
    if !ERRORLEVEL! EQU 0 (
        echo ✅ USB Camera (Index 1) detected!
        set /A TESTS_PASSED+=1
    ) else (
        echo ⚠️  Could not verify USB camera
        echo (Run manually if needed: python find_usb_camera.py)
    )
) else (
    echo ⚠️  find_usb_camera.py not found (optional)
)

echo.
echo ============================================================
echo 📊 VERIFICATION SUMMARY
echo ============================================================
echo.
echo ✅ Tests Passed: %TESTS_PASSED%
echo ❌ Tests Failed: %TESTS_FAILED%
echo.

if %TESTS_FAILED% EQU 0 (
    echo ============================================================
    echo ✅ ALL CHECKS PASSED!
    echo ============================================================
    echo.
    echo System is ready for camera integration testing!
    echo.
    echo Next steps:
    echo 1. Run: START_ALL_SERVICES.bat
    echo 2. Wait 5 seconds for all services to start
    echo 3. Visit: http://localhost:8000/stream (browser test)
    echo 4. Build and run Flutter app
    echo 5. Navigate to bed/patient screens to see live camera
    echo.
) else (
    echo ============================================================
    echo ❌ SOME CHECKS FAILED
    echo ============================================================
    echo.
    echo Please fix the issues above and run verification again.
    echo.
    echo Common fixes:
    echo - Install missing Python packages: pip install -r camera_requirements.txt
    echo - Create camera_index.txt with content: 1
    echo - Kill processes using ports 8000/5000: netstat -ano ^| findstr :8000
    echo.
)

echo.
pause
