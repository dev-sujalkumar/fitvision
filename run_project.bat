@echo off
title FitVision AI Studio Launcher
echo ========================================================
echo        FitVision AI Studio - Full Stack Launcher
echo ========================================================
echo.
echo [1/2] Starting PyTorch Food-101 Classifier API on port 5050...
start "FitVision PyTorch Backend (Port 5050)" cmd /k "cd /d "%~dp0food_classifier" && python server.py"

echo [2/2] Starting React Frontend on port 3000...
start "FitVision React Frontend (Port 3000)" cmd /k "cd /d "%~dp0frontend" && set NODE_OPTIONS=--openssl-legacy-provider --max-old-space-size=8192 && npm start"

echo.
echo Both services launched in separate windows:
echo   - Backend API: http://localhost:5050
echo   - React UI:    http://localhost:3000
echo.
timeout /t 5
