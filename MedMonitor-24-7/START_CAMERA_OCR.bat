@echo off
title Camera + OCR Service - استخراج الأرقام
cd /d "c:\Nahda CS\PROJECT FINAL-NUB\fiels project"

echo.
echo ===============================================
echo   Camera + OCR Complete System
echo ===============================================
echo.

REM تفعيل virtualenv
call venv\Scripts\activate.bat

REM تشغيل النظام الكامل
python camera_ocr_complete.py

pause
