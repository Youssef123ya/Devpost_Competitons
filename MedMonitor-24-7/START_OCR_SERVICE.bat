@echo off
title OCR Service - استخراج الأرقام
cd /d "c:\Nahda CS\PROJECT FINAL-NUB\fiels project"

echo.
echo ===============================================
echo    OCR Service - Vital Signs Extraction
echo ===============================================
echo.

REM تفعيل virtualenv
call venv\Scripts\activate.bat

REM تشغيل الخدمة
python ocr_service.py

pause
