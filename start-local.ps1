# GridAgent Local Development Startup Script (PowerShell)
# This starts the agent server for local testing without E2B sandboxes
#
# Usage:
#   $env:ANTHROPIC_API_KEY = "sk-ant-your-key"
#   .\start-local.ps1
#
# The backend (in a separate terminal) does NOT need the API key in local mode:
#   $env:LOCAL_DEV = "true"
#   cd backend
#   python -m uvicorn main:app --reload --port 8000

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "GridAgent Local Development Mode" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check for ANTHROPIC_API_KEY (only needed here, not in backend)
if (-not $env:ANTHROPIC_API_KEY) {
    Write-Host "ERROR: ANTHROPIC_API_KEY environment variable not set!" -ForegroundColor Red
    Write-Host "Please set it with: `$env:ANTHROPIC_API_KEY='sk-ant-your-key-here'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Note: Only the agent server needs the API key." -ForegroundColor Gray
    Write-Host "      The backend does NOT need it in LOCAL_DEV mode." -ForegroundColor Gray
    exit 1
}

# Set local dev mode
$env:LOCAL_DEV = "true"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$dataDir = Join-Path $projectRoot "Data"
$userDir = Join-Path $projectRoot "local_user"

Write-Host "Configuration:" -ForegroundColor Green
Write-Host "  Data directory: $dataDir"
Write-Host "  User directory: $userDir"
Write-Host "  WebSocket: ws://localhost:8080"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Open another terminal and run the backend:" -ForegroundColor Gray
Write-Host "     `$env:LOCAL_DEV='true'; cd backend; python -m uvicorn main:app --reload" -ForegroundColor Gray
Write-Host "  2. Open another terminal and run the frontend:" -ForegroundColor Gray
Write-Host "     cd frontend; npm run dev" -ForegroundColor Gray
Write-Host ""

# Create local_user directory structure
New-Item -ItemType Directory -Force -Path (Join-Path $userDir "uploads") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $userDir "results") | Out-Null

Write-Host "Starting GridAgent Agent Server..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

Set-Location (Join-Path $projectRoot "e2b-template")
python gridagent_server.py
