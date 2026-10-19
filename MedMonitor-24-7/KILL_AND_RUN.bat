@echo off
REM Kill ALL Python and Flask processes
echo.
echo ============================================================
echo 🛑 Killing ALL Python Processes
echo ============================================================
echo.

taskkill /F /IM python.exe 2>nul

echo ✅ All python processes killed
echo.

REM Wait
timeout /t 3

echo.
echo ============================================================
echo 🧹 Cleanup Complete
echo ============================================================
echo.

REM Now start fresh camera service
cd /d "%~dp0"

call venv\Scripts\activate.bat

echo.
echo ============================================================
echo 🎥 Starting FRESH Camera Service
echo ============================================================
echo.

python -c "from flask import Flask; app = Flask(__name__); @app.route('/'); def hello(): return 'OK'; app.run(host='0.0.0.0', port=8000, debug=False)"
