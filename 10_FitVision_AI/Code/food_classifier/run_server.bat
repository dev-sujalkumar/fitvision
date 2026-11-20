@echo off
title FitVision AI - PyTorch Food-101 Classifier API Server
echo ========================================================
echo   FitVision AI - PyTorch Food Classifier Server
echo   Model: EfficientNet-B2 with Grad-CAM Visual Heatmaps
echo ========================================================
echo Starting Food Classifier API service on http://localhost:5050 ...
python server.py
if errorlevel 1 (
    echo Python not found on default PATH, trying user install...
    "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" server.py
)
pause
