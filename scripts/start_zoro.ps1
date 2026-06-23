$ErrorActionPreference = "SilentlyContinue"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Get-CimInstance Win32_Process |
  Where-Object {
    $_.CommandLine -like '*uvicorn laptop_backend.main:app*' -or
    $_.CommandLine -like '*vite*--host*0.0.0.0*--port*5173*'
  } |
  ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force
  }

Start-Sleep -Seconds 2

Start-Process -FilePath "$ProjectRoot\.venv\Scripts\python.exe" `
  -ArgumentList "-m","uvicorn","laptop_backend.main:app","--host","0.0.0.0","--port","8001" `
  -WorkingDirectory $ProjectRoot `
  -RedirectStandardOutput "$ProjectRoot\backend-out.log" `
  -RedirectStandardError "$ProjectRoot\backend-err.log" `
  -WindowStyle Hidden

Start-Process -FilePath "npm.cmd" `
  -ArgumentList "run","dev","--","--host","0.0.0.0","--port","5173" `
  -WorkingDirectory "$ProjectRoot\zoro_frontend" `
  -RedirectStandardOutput "$ProjectRoot\frontend-out.log" `
  -RedirectStandardError "$ProjectRoot\frontend-err.log" `
  -WindowStyle Hidden

Write-Host "Zoro backend:  http://127.0.0.1:8001"
Write-Host "Zoro dashboard: http://localhost:5173"
