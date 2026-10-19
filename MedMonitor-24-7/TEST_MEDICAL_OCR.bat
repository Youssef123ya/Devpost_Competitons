@echo off
REM 🧪 Test Medical OCR System

echo.
echo ========================================
echo 🧪 Medical OCR System - Test Suite
echo ========================================
echo.

REM Activate venv
call venv\Scripts\activate.bat

echo.
echo TEST 1: Check if roi_config.json exists
echo ========================================
if exist roi_config.json (
    echo ✅ roi_config.json found
    type roi_config.json
) else (
    echo ❌ roi_config.json not found!
    echo Run: python roi_calibration_tool.py
    exit /b 1
)

echo.
echo TEST 2: Test camera streaming
echo ========================================
echo Attempting to fetch snapshot...
powershell -Command "try { $response = Invoke-WebRequest 'http://localhost:8000/snapshot' -TimeoutSec 5; Write-Host '✅ Camera stream OK (port 8000)' } catch { Write-Host '❌ Camera stream FAILED - ensure stream_and_snapshot.py is running' }"

echo.
echo TEST 3: Test API server
echo ========================================
echo Attempting to fetch vital signs...
powershell -Command "try { $response = Invoke-WebRequest 'http://localhost:5000/vital-signs/latest' -TimeoutSec 5; Write-Host '✅ API server OK (port 5000)'; $content = $response.Content | ConvertFrom-Json; Write-Host ($content | ConvertTo-Json -Depth 5) } catch { Write-Host '❌ API server FAILED - ensure vital_signs_api_advanced.py is running' }"

echo.
echo TEST 4: Extract individual vital signs
echo ========================================
echo.
echo Heart Rate:
powershell -Command "Invoke-WebRequest 'http://localhost:5000/vital-signs/hr' | Select-Object -ExpandProperty Content"

echo.
echo SpO2:
powershell -Command "Invoke-WebRequest 'http://localhost:5000/vital-signs/spo2' | Select-Object -ExpandProperty Content"

echo.
echo TEST 5: View latest extraction results
echo ========================================
if exist vital_signs_latest.json (
    echo ✅ Found vital_signs_latest.json
    type vital_signs_latest.json
) else (
    echo ⚠️  No vital_signs_latest.json yet (OCR hasn't run)
)

echo.
echo ========================================
echo Test Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Verify camera stream works (TEST 2)
echo 2. Verify API responds (TEST 3)
echo 3. Run: python ocr_medical_advanced.py
echo 4. Wait 5 seconds for first extraction
echo 5. Re-run this test
echo.

pause
