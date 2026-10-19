@echo off
REM ==========================================
REM اختبار AI Alert API
REM ==========================================
echo.
echo ==========================================
echo 🧪 اختبار AI Alert Prediction API
echo ==========================================
echo.

REM تحقق من أن الخادم يعمل
echo التحقق من الاتصال بالخادم...
timeout /t 2 /nobreak

REM اختبار 1: Health Check
echo.
echo ✅ اختبار 1: Health Check
echo POST http://localhost:5140/AIAlert/Health
curl -X GET "http://localhost:5140/AIAlert/Health" -H "Content-Type: application/json"

REM اختبار 2: حالة عادية
echo.
echo.
echo ✅ اختبار 2: حالة عادية (Normal)
echo POST http://localhost:5140/AIAlert/Predict
curl -X POST "http://localhost:5140/AIAlert/Predict" ^
  -H "Content-Type: application/json" ^
  -d "{\"heartRate\": 75, \"spO2\": 98, \"systolicBP\": 120, \"diastolicBP\": 80, \"temperature\": 37.0}"

REM اختبار 3: حالة تحذير
echo.
echo.
echo ✅ اختبار 3: حالة تحذير (Warning)
echo POST http://localhost:5140/AIAlert/Predict
curl -X POST "http://localhost:5140/AIAlert/Predict" ^
  -H "Content-Type: application/json" ^
  -d "{\"heartRate\": 110, \"spO2\": 92, \"systolicBP\": 140, \"diastolicBP\": 90, \"temperature\": 38.5}"

REM اختبار 4: حالة حرجة
echo.
echo.
echo ✅ اختبار 4: حالة حرجة (Critical)
echo POST http://localhost:5140/AIAlert/Predict
curl -X POST "http://localhost:5140/AIAlert/Predict" ^
  -H "Content-Type: application/json" ^
  -d "{\"heartRate\": 150, \"spO2\": 82, \"systolicBP\": 70, \"diastolicBP\": 50, \"temperature\": 40.0}"

REM اختبار 5: سقوط مكتشف
echo.
echo.
echo ✅ اختبار 5: سقوط مكتشف مع بيانات حرجة (Fall Detected)
echo POST http://localhost:5140/AIAlert/Predict
curl -X POST "http://localhost:5140/AIAlert/Predict" ^
  -H "Content-Type: application/json" ^
  -d "{\"heartRate\": 130, \"spO2\": 88, \"systolicBP\": 100, \"diastolicBP\": 70, \"temperature\": 37.5, \"fallDetected\": true}"

echo.
echo.
echo ==========================================
echo ✅ اكتملت الاختبارات!
echo ==========================================
echo.
pause
