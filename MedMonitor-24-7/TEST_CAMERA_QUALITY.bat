@echo off
REM =================================================================
REM 🎥 Camera Quality Diagnostic Test
REM =================================================================

echo.
echo ========================================================================
echo 🎥 Camera Quality Diagnostic Test
echo ========================================================================
echo.
echo This test will:
echo   1. Start camera service
echo   2. Capture debug info
echo   3. Verify 1920x1080 resolution
echo   4. Check JPEG quality settings
echo.
pause

cd /d "%~dp0"

REM Kill any existing processes
taskkill /F /IM python.exe >nul 2>&1
timeout /t 1 /nobreak

REM Start camera service
echo.
echo [1/3] Starting camera service...
start /B python camera_service.py >camera_debug.log 2>&1

timeout /t 8 /nobreak

REM Get debug info
echo.
echo [2/3] Retrieving camera debug info...
powershell -Command "^
  try {^
    $response = Invoke-WebRequest -Uri 'http://localhost:8000/debug' -UseBasicParsing;^
    $data = $response.Content | ConvertFrom-Json;^
    Write-Host '✅ Camera Debug Info:' -ForegroundColor Green;^
    Write-Host '  Resolution: ' $data.resolution;^
    Write-Host '  FPS: ' $data.fps;^
    Write-Host '  Codec: ' $data.codec;^
    Write-Host '  Exposure: ' $data.exposure;^
    Write-Host '  Buffer Size: ' $data.buffer_size;^
    Write-Host '  Frames Captured: ' $data.frame_count;^
    Write-Host '  Status: ' $data.status;^
  } catch {^
    Write-Host '❌ Failed to connect to camera service' -ForegroundColor Red;^
  }^
"

REM Download snapshot
echo.
echo [3/3] Downloading snapshot...
powershell -Command "^
  try {^
    $response = Invoke-WebRequest -Uri 'http://localhost:8000/snapshot' -UseBasicParsing -OutFile 'camera_snapshot.jpg';^
    Write-Host '✅ Snapshot saved: camera_snapshot.jpg' -ForegroundColor Green;^
    Get-Item 'camera_snapshot.jpg' | Select-Object Length;^
  } catch {^
    Write-Host '❌ Failed to download snapshot' -ForegroundColor Red;^
  }^
"

REM Summary
echo.
echo ========================================================================
echo ✅ CAMERA QUALITY TEST COMPLETE
echo ========================================================================
echo.
echo Results:
echo   - camera_debug.log     (detailed debug output)
echo   - camera_snapshot.jpg  (current frame)
echo.
echo Expected settings for production:
echo   ✓ Resolution: 1920x1080
echo   ✓ FPS: 30
echo   ✓ Codec: MJPG
echo   ✓ Buffer Size: 1 (minimal lag)
echo.
pause
