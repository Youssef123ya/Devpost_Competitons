@echo off
cd /d "c:\Nahda CS\PROJECT FINAL-NUB\fiels project"
title Camera HD Service

echo ========================================
echo Starting High-Quality Camera Service
echo ========================================
echo.

call venv\Scripts\activate.bat
python camera_hd.py

pause
