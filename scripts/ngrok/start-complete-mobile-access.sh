#!/bin/bash

# T4G Urban Loyalty Game - Complete Mobile Access Setup
# This script starts ngrok tunnels for both frontend and backend

echo "🚀 Starting T4G Complete Mobile Access..."
echo ""

# Check if Docker services are running
echo "📋 Checking Docker services..."
CLIENT_RUNNING=$(docker ps --filter "name=t4g-client-dev" --format "{{.Names}}" | wc -l)
SERVER_RUNNING=$(docker ps --filter "name=t4g-server-dev" --format "{{.Names}}" | wc -l)

if [ $CLIENT_RUNNING -eq 0 ] || [ $SERVER_RUNNING -eq 0 ]; then
    echo "❌ Required T4G containers not running!"
    echo "Please start your Docker services first:"
    echo "   docker compose up -d"
    exit 1
fi

echo "✅ T4G client and server containers are running"
echo ""

# Kill any existing ngrok processes
pkill ngrok 2>/dev/null || true
sleep 2

echo "🌐 Starting ngrok tunnels..."
echo ""

# Start ngrok for backend in background
echo "📡 Starting backend API tunnel..."
ngrok http 3002 --log=stdout > /tmp/ngrok-api.log 2>&1 &
API_PID=$!

# Wait a moment for the first tunnel to start
sleep 3

# Start ngrok for frontend
echo "📱 Starting frontend tunnel..."
echo ""
echo "⚠️  Important:"
echo "   🔗 Frontend will be available at the HTTPS URL shown below"
echo "   🔧 Backend API will be tunneled separately"
echo "   🌐 ngrok web interface: http://localhost:4040"
echo ""
echo "💡 For mobile testing:"
echo "   📱 Use the frontend HTTPS URL"
echo "   🔄 API calls will be proxied through the frontend"
echo ""
echo "🛑 Press Ctrl+C to stop all tunnels"
echo ""

# Trap to clean up background process
trap 'echo ""; echo "🛑 Stopping all tunnels..."; kill $API_PID 2>/dev/null; exit' INT

# Start frontend tunnel (this will run in foreground)
ngrok http 4001
