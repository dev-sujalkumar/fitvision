@echo off
title FitVision AI - PyTorch Food-101 Classifier API Server
echo ========================================================
echo   FitVision AI - PyTorch Food-101 Classifier Server
echo   Model: EfficientNet-B2 with Grad-CAM Visual Heatmaps
echo ========================================================
echo Starting PyTorch Food Classifier API on http://localhost:5050 ...
cd /d "%~dp0food_classifier"
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
