@echo off
echo ==========================================
echo       Starting HIPS Platform
echo ==========================================
echo.

:: Start the Flask API server in a new command window
echo [*] Starting Python backend API server...
start "HIPS Backend API" cmd /k "python api.py"

:: Wait 2 seconds for the server to spin up
timeout /t 2 /nobreak > nul

:: Open the GitHub Pages app in the default browser
echo [*] Opening HIPS Platform frontend...
start https://srinath64312.github.io/Hybrid-intelligent-planning-system/

echo.
echo ==========================================
echo HIPS Platform is now running! 
echo Keep the backend terminal window open while using the app.
echo ==========================================
echo.
pause
