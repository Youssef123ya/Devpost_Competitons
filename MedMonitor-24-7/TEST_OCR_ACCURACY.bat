@echo off
REM =================================================================
REM 🔍 OCR Vital Signs Extraction Test
REM =================================================================

echo.
echo ========================================================================
echo 🔍 OCR Vital Signs Extraction Test
echo ========================================================================
echo.
echo This test will:
echo   1. Start camera service
echo   2. Start OCR extraction
echo   3. Monitor vital signs extraction
echo   4. Verify API response
echo.
pause

cd /d "%~dp0"

REM Kill any existing processes
taskkill /F /IM python.exe >nul 2>&1
timeout /t 1 /nobreak

REM Start camera service
echo.
echo [1/4] Starting camera service...
start /B "Camera Service" python camera_service.py >camera_service.log 2>&1

timeout /t 6 /nobreak

REM Start OCR service
echo.
echo [2/4] Starting OCR extraction...
start /B "OCR Service" python ocr_vital_signs_extractor.py >ocr_service.log 2>&1

timeout /t 8 /nobreak

REM Start Vital Signs API
echo.
echo [3/4] Starting Vital Signs API...
start /B "Vital Signs API" python vital_signs_api.py >vital_signs_api.log 2>&1

timeout /t 2 /nobreak

REM Test API response
echo.
echo [4/4] Testing API response...
powershell -Command "^
  try {^
    Write-Host '📊 Testing /vital-signs/latest endpoint...' -ForegroundColor Cyan;^
    $response = Invoke-WebRequest -Uri 'http://localhost:5000/vital-signs/latest' -UseBasicParsing;^
    $data = $response.Content | ConvertFrom-Json;^
    Write-Host '';^
    Write-Host '✅ API Response:' -ForegroundColor Green;^
    Write-Host '  Status: ' $data.status;^
    Write-Host '  Timestamp: ' $data.timestamp;^
    Write-Host '';^
    Write-Host '📋 Vital Signs:' -ForegroundColor Yellow;^
    Write-Host '  Heart Rate: ' $data.vitals.heart_rate;^
    Write-Host '  SpO2: ' $data.vitals.spo2;^
    Write-Host '  Blood Pressure: ' $data.vitals.blood_pressure;^
    Write-Host '  Respiratory Rate: ' $data.vitals.respiratory_rate;^
    Write-Host '  Temperature: ' $data.vitals.temperature;^
    Write-Host '  Pulse: ' $data.vitals.pulse;^
    Write-Host '  EtCO2: ' $data.vitals.etco2;^
  } catch {^
    Write-Host '❌ API test failed: ' $_.Exception.Message -ForegroundColor Red;^
  }^
"

REM Summary
echo.
echo ========================================================================
echo ✅ OCR EXTRACTION TEST COMPLETE
echo ========================================================================
echo.
echo Log files:
echo   - camera_service.log    (camera debug output)
echo   - ocr_service.log       (OCR extraction output)
echo   - vital_signs_api.log   (API output)
echo.
echo JSON Output:
echo   - vital_signs_latest.json (latest results)
echo.
echo Services running:
echo   Camera Service: http://localhost:8000/stream
echo   Vital Signs API: http://localhost:5000/vital-signs/latest
echo.
pause
