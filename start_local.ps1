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

$port = if ($env:PORT) { $env:PORT } else { "3000" }
Write-Host "Starting AI Coworker on http://localhost:$port"
npm start
