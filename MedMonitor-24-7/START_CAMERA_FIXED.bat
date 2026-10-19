@echo off
REM Kill process on port 8000

echo.
echo ============================================================
echo 🛑 Stopping Process on Port 8000
echo ============================================================
echo.

netstat -ano | findstr :8000

if %errorlevel% == 0 (
    echo.
    echo Found process on port 8000. Stopping it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
        echo Killing PID %%a
        taskkill /PID %%a /F
    )
    echo ✅ Stopped
    timeout /t 2
) else (
    echo Port 8000 is free
)

echo.
echo ============================================================
echo 🎥 Starting Camera Service
echo ============================================================
echo.

cd /d "%~dp0"

REM Activate venv
call venv\Scripts\activate.bat

REM Start camera service
python camera_service_fixed.py

pause
