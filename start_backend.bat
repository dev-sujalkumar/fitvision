@echo off
title FitVision AI - Hybrid AI Food Recognition Server
echo ========================================================
echo   FitVision AI - Hybrid AI Food Recognition Server
echo   Primary: YOLOv8m (256 UEC-FOOD Classes)
echo   Fallback: Vision-Language Model (Gemini / Moondream)
echo ========================================================
echo Starting Hybrid Food Recognition Server on http://localhost:5050 ...
cd /d "%~dp0food_analyzer"
python server.py
if errorlevel 1 (
    echo Python failed or not found on PATH, checking local installations...
    if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
        "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" server.py
    ) else if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" (
        "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" server.py
    )
)
pause
