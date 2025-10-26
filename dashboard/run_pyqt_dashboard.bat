@echo off
echo ================================================
echo    Impulse Guard - PyQt6 Dashboard Launcher
echo ================================================
echo.
echo Starting modern PyQt6 dashboard...
echo.

cd /d "%~dp0"
python dashboard_pyqt.py

if errorlevel 1 (
    echo.
    echo ERROR: Failed to start dashboard
    echo Please ensure PyQt6 is installed: pip install PyQt6 PyQt6-Charts
    echo.
    pause
)
