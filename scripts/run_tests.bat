@echo off
echo ========================================================
echo Running Smart Parking Finder Test Suite (pytest)...
echo ========================================================
cd /d "%~dp0..\backend"
venv\Scripts\pytest.exe -v
pause
