@echo off
cd /d "C:\Users\jagan\OneDrive\Desktop\projectcv\fitvision\frontend"
set NODE_OPTIONS=--openssl-legacy-provider --max-old-space-size=8192
set GENERATE_SOURCEMAP=false
set BROWSER=none
"C:\Program Files\nodejs\npm.cmd" start
