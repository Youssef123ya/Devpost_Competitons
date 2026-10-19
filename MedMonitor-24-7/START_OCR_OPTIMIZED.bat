@echo off
cd /d "c:\Nahda CS\PROJECT FINAL-NUB\fiels project"
title Optimized Medical OCR Service

echo ========================================
echo Starting Optimized OCR Service
echo ========================================
echo.

call venv\Scripts\activate.bat
python ocr_optimized.py

pause
