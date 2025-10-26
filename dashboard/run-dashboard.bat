@echo off
echo.
echo ================================================
echo    Impulse Guard - Modern Dashboard Launcher
echo ================================================
echo.
echo Starting Python HTTP server...
echo.

cd /d "%~dp0"

python serve.py

if errorlevel 1 (
    echo.
    echo ERROR: Failed to start server
    echo Make sure Python is installed
    echo.
    pause
)
