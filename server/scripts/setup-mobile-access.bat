@echo off
echo Setting up WSL2 port forwarding for T4G Mobile Access...
echo.

REM Get WSL2 IP address
for /f "tokens=2 delims=:" %%i in ('wsl hostname -I') do set WSL_IP=%%i
set WSL_IP=%WSL_IP: =%

echo WSL2 IP: %WSL_IP%
echo.

REM Remove existing port forwarding
echo Removing existing port forwarding...
netsh interface portproxy delete v4tov4 listenport=4000 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy delete v4tov4 listenport=3001 listenaddress=0.0.0.0 >nul 2>&1

REM Add new port forwarding
echo Adding port forwarding for port 4000...
netsh interface portproxy add v4tov4 listenport=4000 listenaddress=0.0.0.0 connectport=4000 connectaddress=%WSL_IP%

echo Adding port forwarding for port 3001...
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=%WSL_IP%

REM Add firewall rules
echo Adding firewall rules...
netsh advfirewall firewall delete rule name="T4G Port 4000" >nul 2>&1
netsh advfirewall firewall delete rule name="T4G Port 3001" >nul 2>&1
netsh advfirewall firewall add rule name="T4G Port 4000" dir=in action=allow protocol=TCP localport=4000
netsh advfirewall firewall add rule name="T4G Port 3001" dir=in action=allow protocol=TCP localport=3001

echo.
echo Setup complete!
echo.
echo Your mobile access URL should be:
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr "192.168"') do echo http://%%i:4000
echo.
echo Current port forwarding:
netsh interface portproxy show all
echo.
pause
