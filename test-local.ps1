# GridAgent Local Testing Script
# Run this script to test all components locally

param(
    [switch]$TestsOnly,      # Run only pytest, don't start servers
    [switch]$ServersOnly,    # Start servers only, don't run tests
    [switch]$Frontend,       # Include frontend dev server
    [switch]$Help
)

if ($Help) {
    Write-Host @"

GridAgent Local Testing Script
==============================

Usage: .\test-local.ps1 [options]

Options:
  -TestsOnly     Run pytest only, don't start servers
  -ServersOnly   Start servers only, skip tests
  -Frontend      Also start frontend dev server
  -Help          Show this help message

Examples:
  .\test-local.ps1              # Run tests then start backend + agent
  .\test-local.ps1 -TestsOnly   # Run tests only
  .\test-local.ps1 -ServersOnly # Start servers without running tests
  .\test-local.ps1 -Frontend    # Full stack including frontend

Requirements:
  - Python 3.11+ with pip
  - Node.js 18+ with npm (for frontend)
  - ANTHROPIC_API_KEY environment variable (for agent)

"@
    exit 0
}

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   GridAgent Local Testing" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check for ANTHROPIC_API_KEY
if (-not $env:ANTHROPIC_API_KEY) {
    Write-Host "[WARNING] ANTHROPIC_API_KEY not set - Agent will not work" -ForegroundColor Yellow
}

# --- Run Tests ---
if (-not $ServersOnly) {
    Write-Host "[1/4] Running Backend Tests..." -ForegroundColor Green

    Push-Location "$ProjectRoot\backend"
    try {
        # Install dev dependencies if needed
        if (-not (Test-Path ".\venv")) {
            Write-Host "Creating virtual environment..." -ForegroundColor Gray
            python -m venv venv
        }

        # Activate venv and install deps
        & .\venv\Scripts\Activate.ps1
        pip install -q -r requirements-dev.txt

        # Run pytest
        $env:LOCAL_DEV = "true"
        pytest tests/ -v --tb=short

        if ($LASTEXITCODE -ne 0) {
            Write-Host "`n[FAILED] Backend tests failed!" -ForegroundColor Red
            exit 1
        }
        Write-Host "[PASSED] All backend tests passed!`n" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}

if ($TestsOnly) {
    Write-Host "`nTests complete. Use -ServersOnly or no flags to start servers." -ForegroundColor Cyan
    exit 0
}

# --- Start Servers ---
Write-Host "[2/4] Starting Backend (LOCAL_DEV mode)..." -ForegroundColor Green

$backendJob = Start-Job -ScriptBlock {
    param($root)
    Set-Location "$root\backend"
    $env:LOCAL_DEV = "true"
    $env:LOG_FORMAT = "text"  # Human readable logs
    & .\venv\Scripts\python.exe -m uvicorn main:app --port 8000 --reload
} -ArgumentList $ProjectRoot

Write-Host "  Backend starting on http://localhost:8000" -ForegroundColor Gray

Write-Host "[3/4] Starting Agent Server (LOCAL_DEV mode)..." -ForegroundColor Green

$agentJob = Start-Job -ScriptBlock {
    param($root)
    Set-Location "$root\e2b-template"
    $env:LOCAL_DEV = "true"
    python gridagent_server.py
} -ArgumentList $ProjectRoot

Write-Host "  Agent starting on ws://localhost:8080" -ForegroundColor Gray

if ($Frontend) {
    Write-Host "[4/4] Starting Frontend..." -ForegroundColor Green

    $frontendJob = Start-Job -ScriptBlock {
        param($root)
        Set-Location "$root\frontend"
        npm run dev
    } -ArgumentList $ProjectRoot

    Write-Host "  Frontend starting on http://localhost:3000" -ForegroundColor Gray
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Servers Running (Ctrl+C to stop)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host @"

Endpoints:
  - Backend:  http://localhost:8000
  - Health:   http://localhost:8000/health
  - Docs:     http://localhost:8000/docs
  - Agent:    ws://localhost:8080
"@

if ($Frontend) {
    Write-Host "  - Frontend: http://localhost:3000"
}

Write-Host @"

Test Commands:
  curl http://localhost:8000/health
  curl -X POST http://localhost:8000/api/start-session -H "Authorization: Bearer test"

WebSocket Test (install wscat first: npm i -g wscat):
  wscat -c ws://localhost:8080

Press Ctrl+C to stop all servers...
"@

# Wait for Ctrl+C
try {
    while ($true) {
        Start-Sleep -Seconds 5

        # Check if jobs are still running
        $backendState = (Get-Job -Id $backendJob.Id).State
        $agentState = (Get-Job -Id $agentJob.Id).State

        if ($backendState -eq "Failed") {
            Write-Host "`n[ERROR] Backend crashed:" -ForegroundColor Red
            Receive-Job -Id $backendJob.Id
        }
        if ($agentState -eq "Failed") {
            Write-Host "`n[ERROR] Agent crashed:" -ForegroundColor Red
            Receive-Job -Id $agentJob.Id
        }
    }
}
finally {
    Write-Host "`nStopping servers..." -ForegroundColor Yellow
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job -Job $agentJob -ErrorAction SilentlyContinue
    if ($Frontend) {
        Stop-Job -Job $frontendJob -ErrorAction SilentlyContinue
    }
    Remove-Job -Job $backendJob, $agentJob -Force -ErrorAction SilentlyContinue
    if ($Frontend) {
        Remove-Job -Job $frontendJob -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Servers stopped." -ForegroundColor Green
}
