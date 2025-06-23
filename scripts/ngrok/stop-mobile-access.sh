#!/bin/bash

# T4G Urban Loyalty Game - Stop Mobile Access Script
# This script stops all ngrok tunnels

echo "🛑 Stopping T4G Mobile Access..."

# Kill all ngrok processes
NGROK_PIDS=$(pgrep ngrok)

if [ -z "$NGROK_PIDS" ]; then
    echo "✅ No ngrok processes found running"
else
    echo "🔄 Stopping ngrok processes..."
    killall ngrok 2>/dev/null || true
    sleep 2
    echo "✅ ngrok tunnels stopped"
fi

echo ""
echo "📱 Mobile access is now disabled"
echo "🔧 To restart mobile access, run: ./start-mobile-access.sh"
