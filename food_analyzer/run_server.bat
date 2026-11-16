@echo off
title FitVision AI - Food Recognition & Nutrition Analyzer API
echo ========================================================
echo   FitVision AI - Food Recognition & Nutrition Server
echo ========================================================
echo Starting API service on http://localhost:5050 ...
python server.py
if errorlevel 1 (
    echo Python not found on default PATH, trying user install...
    "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" server.py
)
pause
