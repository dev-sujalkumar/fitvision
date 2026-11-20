@echo off
title FitVision AI Studio - Full Stack Launcher
cls

echo =====================================================================
echo           FITVISION AI STUDIO - HYBRID VISION & NUTRITION
echo =====================================================================
echo.
echo   [Architecture Overview]
echo   - Backend Server : Port 5050 (YOLOv8m 256 Classes + VLM Fallback)
echo   - React UI       : Port 3000 (Food Vision Studio & Live Camera)
echo.
echo =====================================================================

:: Check Python availability
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found on your system PATH!
    echo Please install Python 3.10+ and ensure it is added to PATH.
    pause
    exit /b 1
)

:: Check Node.js / npm availability
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js / npm is not found on your system PATH!
    echo Please install Node.js and ensure npm is added to PATH.
    pause
    exit /b 1
)

echo [1/3] Starting Hybrid AI Backend Server on Port 5050...
start "FitVision AI Backend (Port 5050)" /min cmd /c "cd /d "%~dp0food_analyzer" && python server.py"

echo     Waiting for backend initialization...
timeout /t 3 /nobreak >nul

echo [2/3] Launching Web Browser at http://localhost:3000/food-analyzer ...
start http://localhost:3000/food-analyzer

echo [3/3] Starting React Frontend on Port 3000...
echo.
echo =====================================================================
echo   Application is now running!
echo   - Frontend: http://localhost:3000/food-analyzer
echo   - Backend API: http://localhost:5050/api/health
echo.
echo   Press Ctrl+C in this window when you wish to stop the frontend.
echo =====================================================================
echo.

cd /d "%~dp0frontend"
set NODE_OPTIONS=--openssl-legacy-provider --max-old-space-size=8192
set BROWSER=none
npm start
