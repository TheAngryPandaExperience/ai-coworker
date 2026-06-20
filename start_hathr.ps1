$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is not installed or not on PATH. Install Node.js LTS and restart the terminal."
}

if (-not (Test-Path "node_modules")) {
  Write-Host "Installing dependencies..."
  npm install
}

if (-not (Test-Path "node_modules/playwright")) {
  Write-Host "Installing Playwright browser (first run only)..."
  npx playwright install chrome
}

$port = if ($env:HATHR_PORT) { $env:HATHR_PORT } else { "3001" }
Write-Host "Starting Hathr Front-Door Coworker on http://localhost:$port"
Write-Host "Press Ctrl+Shift+S in the panel to open the login browser."
node src/hathr/cli.js
