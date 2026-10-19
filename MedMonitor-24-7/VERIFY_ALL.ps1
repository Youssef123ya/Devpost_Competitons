# =========================================================================
# 🏥 MedMonitor System Verification Script
# =========================================================================
# This script verifies all components are working correctly

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "🏥 MedMonitor Production System Verification" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

# Colors
$success = "Green"
$error = "Red"
$warning = "Yellow"
$info = "Cyan"

# Check 1: Camera Service
Write-Host "[1/7] Checking Camera Service..." -ForegroundColor $info
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/debug" -UseBasicParsing -TimeoutSec 3
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "  ✓ Camera Service: RUNNING" -ForegroundColor $success
    Write-Host "    - Resolution: $($data.resolution)" -ForegroundColor White
    Write-Host "    - FPS: $($data.fps)" -ForegroundColor White
    Write-Host "    - Codec: $($data.codec)" -ForegroundColor White
    Write-Host "    - Status: $($data.status)" -ForegroundColor White
    
    # Verify resolution is 1920x1080
    if ($data.resolution -eq "1920x1080") {
        Write-Host "    ✅ Resolution: CORRECT (1920x1080)" -ForegroundColor $success
    } else {
        Write-Host "    ❌ Resolution: WRONG (expected 1920x1080, got $($data.resolution))" -ForegroundColor $error
    }
    
    # Verify FPS is 30
    if ($data.fps -eq "30") {
        Write-Host "    ✅ FPS: CORRECT (30)" -ForegroundColor $success
    } else {
        Write-Host "    ⚠️  FPS: $($data.fps)" -ForegroundColor $warning
    }
    
} catch {
    Write-Host "  ❌ Camera Service: NOT RESPONDING" -ForegroundColor $error
    Write-Host "     Make sure RUN_PRODUCTION.bat is running" -ForegroundColor $warning
}

Write-Host ""

# Check 2: Camera Stream
Write-Host "[2/7] Checking Camera Stream..." -ForegroundColor $info
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/stream" -UseBasicParsing -TimeoutSec 3 -MaximumRedirection 0 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200 -or $null -ne $response) {
        Write-Host "  ✓ Camera Stream: ACTIVE" -ForegroundColor $success
        Write-Host "    - Endpoint: http://localhost:8000/stream" -ForegroundColor White
    } else {
        Write-Host "  ⚠️  Camera Stream: CHECK BROWSER" -ForegroundColor $warning
    }
} catch {
    Write-Host "  ⚠️  Camera Stream: Unable to verify (may be streaming fine)" -ForegroundColor $warning
}

Write-Host ""

# Check 3: Vital Signs API
Write-Host "[3/7] Checking Vital Signs API..." -ForegroundColor $info
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/vital-signs/latest" -UseBasicParsing -TimeoutSec 3
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "  ✓ API Service: RUNNING" -ForegroundColor $success
    Write-Host "    - Status: $($data.status)" -ForegroundColor White
    Write-Host "    - Timestamp: $($data.timestamp)" -ForegroundColor White
    
} catch {
    Write-Host "  ❌ API Service: NOT RESPONDING" -ForegroundColor $error
    Write-Host "     Check if vital_signs_api.py is running" -ForegroundColor $warning
}

Write-Host ""

# Check 4: API Health
Write-Host "[4/7] Checking API Health..." -ForegroundColor $info
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/vital-signs/health" -UseBasicParsing -TimeoutSec 3
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "  ✓ API Health: $($data.status)" -ForegroundColor $success
    Write-Host "    - Data Fresh: $($data.data_fresh)" -ForegroundColor White
    Write-Host "    - Last Update: $($data.last_update)" -ForegroundColor White
    
    if ($data.data_fresh) {
        Write-Host "    ✅ Data is fresh (updated within 30 seconds)" -ForegroundColor $success
    } else {
        Write-Host "    ⚠️  Data may be stale (wait for next OCR extraction)" -ForegroundColor $warning
    }
    
} catch {
    Write-Host "  ⚠️  API Health: Unable to check" -ForegroundColor $warning
}

Write-Host ""

# Check 5: Vital Signs Data
Write-Host "[5/7] Checking Vital Signs Data..." -ForegroundColor $info
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/vital-signs/latest" -UseBasicParsing -TimeoutSec 3
    $data = $response.Content | ConvertFrom-Json
    $vitals = $data.vitals
    $confidence = $data.confidence
    
    Write-Host "  ✓ Vital Signs Status:" -ForegroundColor $success
    
    $extractedCount = 0
    if ($null -ne $vitals.heart_rate) { 
        Write-Host "    ✅ Heart Rate: $($vitals.heart_rate) bpm (Conf: $($confidence.heart_rate))" -ForegroundColor $success
        $extractedCount++
    } else { 
        Write-Host "    ⚠️  Heart Rate: NOT DETECTED" -ForegroundColor $warning
    }
    
    if ($null -ne $vitals.spo2) { 
        Write-Host "    ✅ SpO2: $($vitals.spo2)% (Conf: $($confidence.spo2))" -ForegroundColor $success
        $extractedCount++
    } else { 
        Write-Host "    ⚠️  SpO2: NOT DETECTED" -ForegroundColor $warning
    }
    
    if ($null -ne $vitals.blood_pressure) { 
        Write-Host "    ✅ Blood Pressure: $($vitals.blood_pressure) mmHg (Conf: $($confidence.blood_pressure))" -ForegroundColor $success
        $extractedCount++
    } else { 
        Write-Host "    ⚠️  Blood Pressure: NOT DETECTED" -ForegroundColor $warning
    }
    
    if ($null -ne $vitals.respiratory_rate) { 
        Write-Host "    ✅ Respiratory Rate: $($vitals.respiratory_rate) /min (Conf: $($confidence.respiratory_rate))" -ForegroundColor $success
        $extractedCount++
    } else { 
        Write-Host "    ⚠️  Respiratory Rate: NOT DETECTED" -ForegroundColor $warning
    }
    
    if ($null -ne $vitals.temperature) { 
        Write-Host "    ✅ Temperature: $($vitals.temperature)°C (Conf: $($confidence.temperature))" -ForegroundColor $success
        $extractedCount++
    } else { 
        Write-Host "    ⚠️  Temperature: NOT DETECTED" -ForegroundColor $warning
    }
    
    if ($null -ne $vitals.pulse) { 
        Write-Host "    ✅ Pulse: $($vitals.pulse) bpm (Conf: $($confidence.pulse))" -ForegroundColor $success
        $extractedCount++
    } else { 
        Write-Host "    ⚠️  Pulse: NOT DETECTED" -ForegroundColor $warning
    }
    
    if ($null -ne $vitals.etco2) { 
        Write-Host "    ✅ EtCO2: $($vitals.etco2) mmHg (Conf: $($confidence.etco2))" -ForegroundColor $success
        $extractedCount++
    } else { 
        Write-Host "    ⚠️  EtCO2: NOT DETECTED" -ForegroundColor $warning
    }
    
    Write-Host "    ─────────────────────────────────" -ForegroundColor Gray
    Write-Host "    Extracted: $extractedCount / 7 vital signs" -ForegroundColor White
    
} catch {
    Write-Host "  ⚠️  Vital Signs Data: Unable to check" -ForegroundColor $warning
}

Write-Host ""

# Check 6: Log Files
Write-Host "[6/7] Checking Log Files..." -ForegroundColor $info
$logFiles = @(
    "camera_service.log",
    "ocr_service.log",
    "vital_signs_api.log"
)

foreach ($file in $logFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length / 1KB
        Write-Host "  ✓ $file : $('{0:N2}' -f $size) KB" -ForegroundColor $success
    } else {
        Write-Host "  ⚠️  $file : Not found (services may not have run)" -ForegroundColor $warning
    }
}

Write-Host ""

# Check 7: Results File
Write-Host "[7/7] Checking Results File..." -ForegroundColor $info
if (Test-Path "vital_signs_latest.json") {
    $file = Get-Item "vital_signs_latest.json"
    Write-Host "  ✓ vital_signs_latest.json : Found" -ForegroundColor $success
    Write-Host "    - Size: $($file.Length) bytes" -ForegroundColor White
    Write-Host "    - Modified: $($file.LastWriteTime)" -ForegroundColor White
} else {
    Write-Host "  ⚠️  vital_signs_latest.json : Not found" -ForegroundColor $warning
}

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "✅ VERIFICATION COMPLETE" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  - If all services show ✓ or ✅: System is READY" -ForegroundColor $success
Write-Host "  - If any show ❌: Check RUN_PRODUCTION.bat is running" -ForegroundColor $warning
Write-Host "  - If vital signs show ⚠️ : Wait 30 seconds for OCR to extract" -ForegroundColor $info
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Access stream: http://localhost:8000/stream" -ForegroundColor White
Write-Host "  2. Get vitals: http://localhost:5000/vital-signs/latest" -ForegroundColor White
Write-Host "  3. Test from Flutter app with server IP" -ForegroundColor White
Write-Host ""
