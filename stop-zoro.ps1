$ErrorActionPreference = "SilentlyContinue"

for ($pass = 0; $pass -lt 3; $pass++) {
  Get-CimInstance Win32_Process | Where-Object {
    $_.ProcessId -ne $PID -and $_.Name -in @("python.exe", "node.exe", "cmd.exe") -and (
      $_.CommandLine -match "laptop_backend.main:app" -or
      $_.CommandLine -match "zoro_frontend.*vite" -or
      $_.CommandLine -match "node_modules.*vite" -or
      $_.CommandLine -match "npm-cli.js.*run dev" -or
      $_.CommandLine -match "vite --host"
    )
  } | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force
  }
  Start-Sleep -Milliseconds 500
}

Write-Host "Stopped Zoro laptop backend/frontend processes."
