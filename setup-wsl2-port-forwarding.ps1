# WSL2 Port Forwarding Script for T4G
# Run this in PowerShell as Administrator on Windows

Write-Host "Setting up WSL2 port forwarding for T4G..." -ForegroundColor Green

# Get WSL2 IP address
$wslIP = (wsl hostname -I).Trim()
Write-Host "WSL2 IP: $wslIP" -ForegroundColor Yellow

# Get Windows IP address (for mobile access)
$windowsIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" | Where-Object {$_.PrefixLength -eq 24}).IPAddress
if (-not $windowsIP) {
    $windowsIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet" | Where-Object {$_.PrefixLength -eq 24}).IPAddress
}
Write-Host "Windows IP: $windowsIP" -ForegroundColor Yellow

# Remove existing port forwarding rules (ignore errors)
Write-Host "Removing existing port forwarding rules..." -ForegroundColor Cyan
netsh interface portproxy delete v4tov4 listenport=4001 2>$null
netsh interface portproxy delete v4tov4 listenport=3002 2>$null

# Add port forwarding rules
Write-Host "Adding port forwarding rules..." -ForegroundColor Cyan
netsh interface portproxy add v4tov4 listenport=4001 listenaddress=0.0.0.0 connectport=4001 connectaddress=$wslIP
netsh interface portproxy add v4tov4 listenport=3002 listenaddress=0.0.0.0 connectport=3002 connectaddress=$wslIP

# Add Windows Firewall rules
Write-Host "Adding Windows Firewall rules..." -ForegroundColor Cyan
New-NetFirewallRule -DisplayName "T4G Frontend WSL2" -Direction Inbound -LocalPort 4001 -Protocol TCP -Action Allow 2>$null
New-NetFirewallRule -DisplayName "T4G Backend WSL2" -Direction Inbound -LocalPort 3002 -Protocol TCP -Action Allow 2>$null

# Show current port forwarding rules
Write-Host "`nCurrent port forwarding rules:" -ForegroundColor Green
netsh interface portproxy show all

Write-Host "`n=== MOBILE ACCESS INSTRUCTIONS ===" -ForegroundColor Green
Write-Host "Your mobile device should now be able to access:" -ForegroundColor White
Write-Host "Frontend: http://$windowsIP`:4001" -ForegroundColor Yellow
Write-Host "Backend:  http://$windowsIP`:3002" -ForegroundColor Yellow
Write-Host "`nMake sure your mobile device is connected to the same WiFi network as this Windows machine." -ForegroundColor White
