@echo off
chcp 65001 >nul
cls

echo ====================================
echo   AI Alert Prediction API Server
echo   MedMonitor 24/7 Backend
echo ====================================
echo.

REM Get the directory where this batch file is located
set SCRIPT_DIR=%~dp0

echo Current Directory: %SCRIPT_DIR%
echo.

REM Change to the script directory
pushd %SCRIPT_DIR%

echo.
echo Building project...
echo.

REM Build the project
call dotnet build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Build failed!
    echo.
    pause
    popd
    exit /b 1
)

echo.
echo ====================================
echo   Starting API Server...
echo   URL: http://localhost:5140
echo   Swagger: http://localhost:5140/swagger
echo   Health: http://localhost:5140/AIAlert/Health
echo ====================================
echo.

REM Run the server
call dotnet run

popd
pause
