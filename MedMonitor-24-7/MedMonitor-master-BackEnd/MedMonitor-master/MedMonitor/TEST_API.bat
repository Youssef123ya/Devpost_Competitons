@echo off
REM AI Alert Prediction API - Testing Script
REM This script tests the API with different vital signs scenarios

echo.
echo ========================================
echo   AI Alert Prediction API - Test Suite
echo ========================================
echo.

setlocal enabledelayedexpansion

REM Set API URL
set API_URL=http://localhost:5140

echo Checking if API is running...
curl -s %API_URL%/AIAlert/Health >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: API server is not running!
    echo Please start the server with: RUN_API.bat
    pause
    exit /b 1
)

echo API is online! ✓
echo.

REM Test 1: Health Check
echo [TEST 1] Health Check
echo URL: GET %API_URL%/AIAlert/Health
curl -s %API_URL%/AIAlert/Health
echo.
echo.

REM Test 2: Normal Patient
echo [TEST 2] Normal Patient - All Vitals Normal
echo POST %API_URL%/AIAlert/Predict
curl -s -X POST "%API_URL%/AIAlert/Predict" ^
  -H "Content-Type: application/json" ^
  -d "{""heartRate"": 75, ""spO2"": 97.5, ""systolicBP"": 120, ""diastolicBP"": 76, ""temperature"": 37.1, ""fallDetected"": false}"
echo.
echo.

REM Test 3: Warning - Low Oxygen
echo [TEST 3] Warning - Low Oxygen Saturation
curl -s -X POST "%API_URL%/AIAlert/Predict" ^
  -H "Content-Type: application/json" ^
  -d "{""heartRate"": 88, ""spO2"": 92.0, ""systolicBP"": 125, ""diastolicBP"": 82, ""temperature"": 37.3, ""fallDetected"": false}"
echo.
echo.

REM Test 4: Warning - High Heart Rate
echo [TEST 4] Warning - Elevated Heart Rate
curl -s -X POST "%API_URL%/AIAlert/Predict" ^
  -H "Content-Type: application/json" ^
  -d "{""heartRate"": 125, ""spO2"": 98, ""systolicBP"": 120, ""diastolicBP"": 80, ""temperature"": 37.0, ""fallDetected"": false}"
echo.
echo.

REM Test 5: Critical - Severe Hypoxemia
echo [TEST 5] Critical - Severe Hypoxemia
curl -s -X POST "%API_URL%/AIAlert/Predict" ^
  -H "Content-Type: application/json" ^
  -d "{""heartRate"": 80, ""spO2"": 82.0, ""systolicBP"": 120, ""diastolicBP"": 80, ""temperature"": 37.0, ""fallDetected"": false}"
echo.
echo.

REM Test 6: Critical - Severe Tachycardia
echo [TEST 6] Critical - Severe Tachycardia
curl -s -X POST "%API_URL%/AIAlert/Predict" ^
  -H "Content-Type: application/json" ^
  -d "{""heartRate"": 155, ""spO2"": 98, ""systolicBP"": 120, ""diastolicBP"": 80, ""temperature"": 37.0, ""fallDetected"": false}"
echo.
echo.

REM Test 7: Critical - Multiple Issues
echo [TEST 7] Critical - Multiple Severe Conditions
curl -s -X POST "%API_URL%/AIAlert/Predict" ^
  -H "Content-Type: application/json" ^
  -d "{""heartRate"": 160, ""spO2"": 80, ""systolicBP"": 70, ""diastolicBP"": 45, ""temperature"": 40.5, ""fallDetected"": false}"
echo.
echo.

echo ========================================
echo   Tests Complete!
echo ========================================
echo.

pause
