@echo off
REM GridAgent Local Development Startup Script
REM This starts the agent server for local testing without E2B sandboxes
REM
REM Usage:
REM   set ANTHROPIC_API_KEY=sk-ant-your-key
REM   start-local.bat
REM
REM The backend (in a separate terminal) does NOT need the API key:
REM   set LOCAL_DEV=true
REM   cd backend
REM   python -m uvicorn main:app --reload --port 8000

echo ============================================
echo GridAgent Local Development Mode
echo ============================================
echo.

REM Check for ANTHROPIC_API_KEY (only needed here, not in backend)
if "%ANTHROPIC_API_KEY%"=="" (
    echo ERROR: ANTHROPIC_API_KEY environment variable not set!
    echo Please set it with: set ANTHROPIC_API_KEY=sk-ant-your-key-here
    echo.
    echo Note: Only the agent server needs the API key.
    echo       The backend does NOT need it in LOCAL_DEV mode.
    exit /b 1
)

REM Set local dev mode
set LOCAL_DEV=true

echo Configuration:
echo   Data directory: %~dp0Data
echo   User directory: %~dp0local_user
echo   WebSocket: ws://localhost:8080
echo.
echo Next steps:
echo   1. Open another terminal and run the backend:
echo      set LOCAL_DEV=true ^& cd backend ^& python -m uvicorn main:app --reload
echo   2. Open another terminal and run the frontend:
echo      cd frontend ^& npm run dev
echo.

REM Create local_user directory if it doesn't exist
if not exist "%~dp0local_user" mkdir "%~dp0local_user"
if not exist "%~dp0local_user\uploads" mkdir "%~dp0local_user\uploads"
if not exist "%~dp0local_user\results" mkdir "%~dp0local_user\results"

echo Starting GridAgent Agent Server...
echo Press Ctrl+C to stop
echo.

cd /d "%~dp0e2b-template"
python gridagent_server.py
