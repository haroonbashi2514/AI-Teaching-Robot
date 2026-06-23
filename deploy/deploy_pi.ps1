param(
    [string]$PiHost = "zoro2026.local",
    [string]$PiUser = "pi",
    [string]$RemoteDir = "/home/pi/zoro2026",
    [string]$LaptopWsBase = ""
)

$ErrorActionPreference = "Stop"

Write-Host "Creating remote directory on $PiUser@$PiHost..."
ssh "$PiUser@$PiHost" "mkdir -p $RemoteDir"

Write-Host "Copying robot backend files..."
scp -r `
    requirements-pi.txt `
    .env.example `
    pi_agent `
    deploy/zoro2026-agent.service `
    deploy/zoro2026-body.service `
    "$PiUser@$PiHost`:$RemoteDir/"

if (-not $LaptopWsBase) {
    $wifiIp = Get-NetIPConfiguration |
        Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq "Up" } |
        Select-Object -ExpandProperty IPv4Address |
        Select-Object -First 1 |
        Select-Object -ExpandProperty IPAddress
    if (-not $wifiIp) {
        throw "Could not auto-detect laptop IPv4 address. Re-run with -LaptopWsBase ws://YOUR_LAPTOP_IP:8001"
    }
    $LaptopWsBase = "ws://$wifiIp`:8001"
}

Write-Host "Installing Pi dependencies and service..."
ssh "$PiUser@$PiHost" @"
cd $RemoteDir
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements-pi.txt
cp -n .env.example .env
sudo cp zoro2026-agent.service /etc/systemd/system/zoro2026-agent.service
sed 's#ws://YOUR_LAPTOP_IP:8001#$LaptopWsBase#g' zoro2026-body.service > /tmp/zoro2026-body.service
sudo cp /tmp/zoro2026-body.service /etc/systemd/system/zoro2026-body.service
sudo systemctl daemon-reload
sudo systemctl enable zoro2026-agent.service
sudo systemctl enable zoro2026-body.service
sudo systemctl restart zoro2026-agent.service
sudo systemctl restart zoro2026-body.service
sudo systemctl status zoro2026-agent.service --no-pager
sudo systemctl status zoro2026-body.service --no-pager
"@

Write-Host "Done. Test from laptop: http://$PiHost`:8000/health"
Write-Host "Body stream target: $LaptopWsBase"
