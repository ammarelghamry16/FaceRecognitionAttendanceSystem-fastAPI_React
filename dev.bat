@echo off
setlocal enabledelayedexpansion
title AttendanceAI Dev Environment
color 0B

echo.
echo ========================================
echo    AttendanceAI Development Server
echo ========================================
echo.

:: Check command argument
if "%1"=="status" goto :status
if "%1"=="stop" goto :stop
if "%1"=="help" goto :help

:: Start all services
echo Starting all services...
echo.

:: Check prerequisites
echo [SETUP] Checking prerequisites...

:: Check Python venv
if exist "FastAPI\venv\Scripts\python.exe" (
    echo   [OK] Python virtual environment found
) else (
    echo   [!!] Python venv not found. Run: cd FastAPI ^&^& python -m venv venv
    echo   [!!] Then: pip install -r requirements.txt
)

:: Check Node modules
if exist "frontend\my-app\node_modules" (
    echo   [OK] Node modules found
) else (
    echo   [!!] Node modules not found. Run: cd frontend\my-app ^&^& npm install
)

echo.

:: Start Backend in new window
echo [1/2] Starting Backend (FastAPI on port 8000)...
start "AttendanceAI Backend" cmd /k "cd FastAPI && call venv\Scripts\activate.bat && python main.py"

:: Wait for backend
timeout /t 3 /nobreak > nul

:: Start Frontend in new window
echo [2/2] Starting Frontend (Vite on port 3000)...
start "AttendanceAI Frontend" cmd /k "cd frontend\my-app && npm run dev"

:: Wait for services to initialize
echo.
echo Waiting for services to initialize...
timeout /t 5 /nobreak > nul

:: Show status
goto :status

:status
echo.
echo ========================================
echo           SERVICE STATUS
echo ========================================
echo.

:: Check Frontend (port 3000)
netstat -an | find "3000" | find "LISTENING" > nul 2>&1
if %errorlevel%==0 (
    echo   [OK] Frontend ^(Vite^)         - Running on http://localhost:3000
    set FRONTEND_OK=1
) else (
    echo   [--] Frontend ^(Vite^)         - Not Running
    set FRONTEND_OK=0
)

:: Check Backend (port 8000)
netstat -an | find "8000" | find "LISTENING" > nul 2>&1
if %errorlevel%==0 (
    echo   [OK] Backend API ^(FastAPI^)   - Running on http://localhost:8000
    set BACKEND_OK=1
) else (
    echo   [--] Backend API ^(FastAPI^)   - Not Running
    set BACKEND_OK=0
)

:: Check PostgreSQL (port 5432) - local only
netstat -an | find "5432" | find "LISTENING" > nul 2>&1
if %errorlevel%==0 (
    echo   [OK] PostgreSQL ^(Local^)      - Running on port 5432
) else (
    echo   [--] PostgreSQL ^(Local^)      - Not Running ^(using Supabase cloud^)
)

:: Check Redis (port 6379)
netstat -an | find "6379" | find "LISTENING" > nul 2>&1
if %errorlevel%==0 (
    echo   [OK] Redis Cache             - Running on port 6379
) else (
    echo   [--] Redis Cache             - Not Running ^(optional^)
)

echo.
echo ========================================
echo            SETUP STATUS
echo ========================================
echo.

:: Check Python venv
if exist "FastAPI\venv\Scripts\python.exe" (
    echo   [OK] Python Virtual Env      - Installed
) else (
    echo   [!!] Python Virtual Env      - Not Installed
)

:: Check Node modules
if exist "frontend\my-app\node_modules" (
    echo   [OK] Node Modules            - Installed
) else (
    echo   [!!] Node Modules            - Not Installed
)

:: Check .env
if exist "FastAPI\.env" (
    echo   [OK] Environment Config      - Found
) else (
    echo   [!!] Environment Config      - Not Found
)

echo.
echo ========================================
echo             ACCESS URLS
echo ========================================
echo.
echo   Frontend:     http://localhost:3000
echo   Backend API:  http://localhost:8000
echo   API Docs:     http://localhost:8000/docs
echo   WebSocket:    ws://localhost:8000/api/notifications/ws/{user_id}
echo.
echo ========================================
echo            TEST ACCOUNTS
echo ========================================
echo.
echo   Student:  student@test.com
echo   Mentor:   mentor@test.com
echo   Admin:    admin@test.com
echo   Password: any password ^(demo mode^)
echo.
echo ========================================
echo              SUMMARY
echo ========================================
echo.

if "%FRONTEND_OK%"=="1" if "%BACKEND_OK%"=="1" (
    echo   [OK] All required services are running!
) else (
    echo   [!!] Some services are not running
    echo.
    echo   To start all services, run: dev.bat
)

echo.
echo ========================================
echo.
echo Commands:
echo   dev.bat          - Start all services
echo   dev.bat status   - Check service status
echo   dev.bat stop     - Stop all services
echo   dev.bat help     - Show this help
echo.
goto :end

:stop
echo.
echo Stopping services...
echo.
:: Kill processes on ports
for /f "tokens=5" %%a in ('netstat -ano ^| find "3000" ^| find "LISTENING"') do (
    echo Stopping Frontend ^(PID: %%a^)...
    taskkill /PID %%a /F > nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| find "8000" ^| find "LISTENING"') do (
    echo Stopping Backend ^(PID: %%a^)...
    taskkill /PID %%a /F > nul 2>&1
)
echo.
echo All services stopped.
goto :end

:help
echo.
echo AttendanceAI Development Script
echo.
echo Usage: dev.bat [command]
echo.
echo Commands:
echo   ^(none^)    Start all services ^(frontend + backend^)
echo   status    Check status of all services
echo   stop      Stop all running services
echo   help      Show this help message
echo.
echo Services:
echo   - Frontend ^(Vite^) on port 3000
echo   - Backend ^(FastAPI^) on port 8000
echo   - PostgreSQL ^(Supabase cloud or local^)
echo   - Redis ^(optional, for caching^)
echo.
goto :end

:end
endlocal
