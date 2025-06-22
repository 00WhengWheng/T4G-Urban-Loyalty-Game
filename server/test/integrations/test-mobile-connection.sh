#!/bin/bash

# Mobile Connection Test Script for T4G Urban Loyalty Game
echo "=== T4G Mobile Connection Test ==="
echo "Testing connectivity to T4G frontend..."
echo ""

# Get host IP
HOST_IP="172.23.46.109"
FRONTEND_PORT="4001"
BACKEND_PORT="3002"

echo "Host IP: $HOST_IP"
echo "Frontend Port: $FRONTEND_PORT"
echo "Backend Port: $BACKEND_PORT"
echo ""

echo "=== Testing Frontend (Port $FRONTEND_PORT) ==="
if curl -s -I "http://$HOST_IP:$FRONTEND_PORT" > /dev/null; then
    echo "✅ Frontend is accessible from host machine"
    echo "📱 Try accessing: http://$HOST_IP:$FRONTEND_PORT from your mobile browser"
else
    echo "❌ Frontend is NOT accessible from host machine"
fi

echo ""
echo "=== Testing Backend (Port $BACKEND_PORT) ==="
if curl -s -I "http://$HOST_IP:$BACKEND_PORT" > /dev/null; then
    echo "✅ Backend is accessible from host machine"
    echo "📱 API endpoint: http://$HOST_IP:$BACKEND_PORT"
else
    echo "❌ Backend is NOT accessible from host machine"
fi

echo ""
echo "=== Network Configuration ==="
echo "Docker services status:"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== Firewall Status ==="
echo "UFW Status:"
sudo ufw status | grep -E "(4001|3002)"

echo ""
echo "=== Port Binding Verification ==="
echo "Listening ports:"
sudo netstat -tlnp | grep -E ":(4001|3002)"

echo ""
echo "=== Mobile Testing Instructions ==="
echo "1. Connect your mobile device to the SAME WiFi network as this machine"
echo "2. Open your mobile browser"
echo "3. Navigate to: http://$HOST_IP:$FRONTEND_PORT"
echo "4. The T4G Urban Loyalty Game should load"
echo ""
echo "If it still doesn't work, check:"
echo "- Router settings (client isolation might be enabled)"
echo "- Mobile device firewall/security apps"
echo "- Try using a different mobile browser"
echo "- Try connecting via mobile hotspot to test if it's a router issue"

echo ""
echo "=== Alternative Test Methods ==="
echo "From your mobile device, try these URLs:"
echo "- Frontend: http://$HOST_IP:$FRONTEND_PORT"
echo "- Backend Health: http://$HOST_IP:$BACKEND_PORT/health"
echo "- Redis Commander: http://$HOST_IP:8081"
