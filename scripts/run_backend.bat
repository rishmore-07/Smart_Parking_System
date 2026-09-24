@echo off
echo ========================================================
echo Starting Smart Parking Finder Backend (FastAPI)...
echo ========================================================
cd /d "%~dp0..\backend"
venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause
