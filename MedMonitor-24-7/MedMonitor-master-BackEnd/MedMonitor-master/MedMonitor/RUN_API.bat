@echo off
echo.
echo ====================================
echo   AI Alert Prediction API Server
echo   Starting MedMonitor 24/7 Backend
echo ====================================
echo.

echo Building project...
dotnet build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo Running tests...
dotnet test

echo.
echo ====================================
echo   Starting API Server...
echo   URL: http://localhost:5140
echo   Swagger: http://localhost:5140/swagger
echo   Health: http://localhost:5140/AIAlert/Health
echo ====================================
echo.

dotnet run

pause
