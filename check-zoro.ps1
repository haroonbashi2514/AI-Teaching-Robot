$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
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

Write-Host "Laptop backend:"
Invoke-RestMethod "http://127.0.0.1:8001/status" | ConvertTo-Json -Depth 5

Write-Host ""
Write-Host "Pi services and hardware on ${PiHost}:"
if ($PiPassword) {
  plink -ssh -batch `
    -hostkey "SHA256:qnA0hC0HMg1MdWo4JMMdi98LEJt1KRAffx4UTrtq3oA" `
    -pw $PiPassword `
    "$PiUser@$PiHost" `
    "systemctl is-active zoro2026-agent.service zoro2026-body.service face.service; curl -s http://127.0.0.1:8000/health; echo; lsusb; echo '--- mic'; arecord -l; echo '--- video'; v4l2-ctl --list-devices | sed -n '/USB PHY/,+4p'"
} else {
  Write-Warning "ZORO_PI_PASSWORD is not set; skipping Pi SSH hardware check."
}
