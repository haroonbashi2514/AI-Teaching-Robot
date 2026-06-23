$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Start-CleanBackgroundProcess {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(Mandatory = $true)][string]$Arguments,
    [Parameter(Mandatory = $true)][string]$WorkingDirectory,
    [Parameter(Mandatory = $true)][string]$StdoutPath,
    [Parameter(Mandatory = $true)][string]$StderrPath
  )

  $cmdPath = $env:ComSpec
  if (-not $cmdPath) {
    $cmdPath = "$env:SystemRoot\System32\cmd.exe"
  }
  if (-not (Test-Path $cmdPath)) {
    $cmdPath = "C:\Windows\System32\cmd.exe"
  }
  $env:PYTHONPATH = $Root
  $env:ZORO_PROJECT_ROOT = $Root
  $launch = "start `"`" /min /d `"$WorkingDirectory`" cmd /c `"`"`"$Command`" $Arguments 1>`"$StdoutPath`" 2>`"$StderrPath`"`"`""
  & $cmdPath /c $launch
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to start $Command"
  }
}

$EnvPath = "$Root\.env"
$PiHost = $env:ZORO_PI_HOST
if (-not $PiHost -and (Test-Path $EnvPath)) {
  $PiBaseLine = Get-Content $EnvPath | Where-Object { $_ -match "^PI_BASE_URL=" } | Select-Object -First 1
  if ($PiBaseLine -match "^PI_BASE_URL=http://([^:/]+)") {
    $PiHost = $Matches[1]
  }
}
if (-not $PiHost) {
  $PiHost = "10.230.185.231"
}
$PiUser = if ($env:ZORO_PI_USER) { $env:ZORO_PI_USER } else { "zoro2026" }
$PiPassword = $env:ZORO_PI_PASSWORD

if (Test-Path $EnvPath) {
  $EnvText = Get-Content $EnvPath
  $EnvText = $EnvText | ForEach-Object {
    if ($_ -match "^PI_BASE_URL=") { "PI_BASE_URL=http://$PiHost`:8000" } else { $_ }
  }
  $Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllLines($EnvPath, [string[]]$EnvText, $Utf8NoBom)
}

Write-Host "Stopping old laptop processes..."
& "$Root\stop-zoro.ps1"

if ($PiPassword) {
  Write-Host "Restarting Raspberry Pi services on $PiHost..."
  plink -ssh -batch `
    -hostkey "SHA256:qnA0hC0HMg1MdWo4JMMdi98LEJt1KRAffx4UTrtq3oA" `
    -pw $PiPassword `
    "$PiUser@$PiHost" `
    "printf '%s\n' '$PiPassword' | sudo -S systemctl restart zoro2026-agent.service zoro2026-body.service face.service && systemctl is-active zoro2026-agent.service zoro2026-body.service face.service"
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Pi SSH restart did not answer this time. The Pi services are enabled at boot; continuing laptop startup."
  }
} else {
  Write-Warning "ZORO_PI_PASSWORD is not set; skipping Pi SSH restart and starting laptop services only."
}

Write-Host "Starting laptop backend..."
Start-CleanBackgroundProcess `
  -Command "$Root\.venv\Scripts\python.exe" `
  -Arguments "-m uvicorn laptop_backend.main:app --host 0.0.0.0 --port 8001" `
  -WorkingDirectory $Root `
  -StdoutPath "$Root\backend-out.log" `
  -StderrPath "$Root\backend-err.log"

Write-Host "Starting frontend dashboard..."
Start-CleanBackgroundProcess `
  -Command "npm.cmd" `
  -Arguments "run dev -- --host 0.0.0.0 --port 5173" `
  -WorkingDirectory "$Root\zoro_frontend" `
  -StdoutPath "$Root\frontend-out.log" `
  -StderrPath "$Root\frontend-err.log"

Write-Host "Waiting for services..."
$backendReady = $false
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 2
  try {
    Invoke-RestMethod "http://127.0.0.1:8001/status" -TimeoutSec 3 | Out-Null
    $backendReady = $true
    break
  } catch {
    Write-Host "Backend warming up..."
  }
}

if (-not $backendReady) {
  Write-Error "Backend did not become ready. Check backend-err.log."
  exit 1
}

Write-Host "Backend status:"
Invoke-RestMethod "http://127.0.0.1:8001/status" | ConvertTo-Json -Depth 5

Write-Host ""
Write-Host "Dashboard: http://127.0.0.1:5173"
