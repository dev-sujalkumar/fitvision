@echo off
title FitVision AI - React Frontend
echo ========================================================
echo   FitVision AI - React Frontend
echo ========================================================
cd /d "%~dp0frontend"
set NODE_OPTIONS=--openssl-legacy-provider --max-old-space-size=8192
set GENERATE_SOURCEMAP=false
set BROWSER=none
if exist "C:\Program Files\nodejs\npm.cmd" (
    "C:\Program Files\nodejs\npm.cmd" start
) else (
    npm start
)
pause
