# AttendanceAI Development Startup Script
# Usage: .\scripts\dev.ps1

$Host.UI.RawUI.WindowTitle = "AttendanceAI Dev Environment"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   AttendanceAI Development Server     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$ROOT_DIR = Split-Path -Parent $PSScriptRoot
$BACKEND_DIR = Join-Path $ROOT_DIR "FastAPI"
$FRONTEND_DIR = Join-Path $ROOT_DIR "frontend\my-app"
$BACKEND_PORT = 8000
$FRONTEND_PORT = 3000

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $connection
}

# Function to print status
function Write-Status {
    param([string]$Service, [string]$Status, [string]$Color)
    $icon = if ($Status -eq "Running") { "[OK]" } else { "[--]" }
    Write-Host "  $icon " -NoNewline -ForegroundColor $Color
    Write-Host "$Service" -NoNewline
    Write-Host " - $Status" -ForegroundColor $Color
}

Write-Host "Starting services..." -ForegroundColor Yellow
Write-Host ""

# Start Backend (FastAPI)
Write-Host "1. Starting Backend (FastAPI)..." -ForegroundColor White
$backendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    if (Test-Path "venv\Scripts\Activate.ps1") {
        & "venv\Scripts\Activate.ps1"
    }
    python main.py
} -ArgumentList $BACKEND_DIR

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend (Vite)
Write-Host "2. Starting Frontend (Vite)..." -ForegroundColor White
$frontendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev
} -ArgumentList $FRONTEND_DIR

# Wait for services to initialize
Write-Host ""
Write-Host "Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check status
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           SERVICE STATUS              " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Backend
$backendRunning = Test-Port -Port $BACKEND_PORT
if ($backendRunning) {
    Write-Status "Backend API" "Running on http://localhost:$BACKEND_PORT" "Green"
} else {
    Write-Status "Backend API" "Starting..." "Yellow"
}

# Check Frontend
$frontendRunning = Test-Port -Port $FRONTEND_PORT
if ($frontendRunning) {
    Write-Status "Frontend" "Running on http://localhost:$FRONTEND_PORT" "Green"
} else {
    Write-Status "Frontend" "Starting..." "Yellow"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "            QUICK ACCESS               " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend:    " -NoNewline; Write-Host "http://localhost:$FRONTEND_PORT" -ForegroundColor Blue
Write-Host "  Backend API: " -NoNewline; Write-Host "http://localhost:$BACKEND_PORT" -ForegroundColor Blue
Write-Host "  API Docs:    " -NoNewline; Write-Host "http://localhost:$BACKEND_PORT/docs" -ForegroundColor Blue
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           TEST ACCOUNTS               " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Student: " -NoNewline; Write-Host "student@test.com" -ForegroundColor Yellow
Write-Host "  Mentor:  " -NoNewline; Write-Host "mentor@test.com" -ForegroundColor Yellow
Write-Host "  Admin:   " -NoNewline; Write-Host "admin@test.com" -ForegroundColor Yellow
Write-Host "  Password:" -NoNewline; Write-Host " any password (demo mode)" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Red
Write-Host ""

# Keep script running and show logs
try {
    while ($true) {
        # Check if jobs are still running
        $backendState = (Get-Job -Id $backendJob.Id).State
        $frontendState = (Get-Job -Id $frontendJob.Id).State
        
        if ($backendState -eq "Failed" -or $frontendState -eq "Failed") {
            Write-Host "A service has failed. Check logs above." -ForegroundColor Red
            break
        }
        
        Start-Sleep -Seconds 2
    }
}
finally {
    Write-Host ""
    Write-Host "Stopping services..." -ForegroundColor Yellow
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job -Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $frontendJob -ErrorAction SilentlyContinue
    Write-Host "All services stopped." -ForegroundColor Green
}
