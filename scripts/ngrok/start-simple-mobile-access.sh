#!/bin/bash

# T4G Urban Loyalty Game - Simple Mobile Access (No Auth Required)
# This script starts a single ngrok tunnel for the frontend

echo "🚀 Starting T4G Simple Mobile Access (Frontend Only)..."
echo ""

# Check if Docker services are running
echo "📋 Checking Docker services..."
CONTAINERS_RUNNING=$(docker ps --filter "name=t4g-client-dev" --format "{{.Names}}" | wc -l)

if [ $CONTAINERS_RUNNING -eq 0 ]; then
    echo "❌ T4G client container not found running!"
    echo "Please start your Docker services first:"
    echo "   docker compose up -d"
    exit 1
fi

echo "✅ T4G client container is running"
echo ""

# Check if port 4001 is accessible
echo "🔍 Testing local frontend..."
if curl -s -f http://localhost:4001 > /dev/null; then
    echo "✅ Frontend is accessible at http://localhost:4001"
else
    echo "❌ Frontend not accessible. Please check if containers are running properly."
    exit 1
fi

echo ""
echo "🌐 Starting ngrok tunnel for frontend..."
echo ""
echo "📱 Your app will be available at the HTTPS URL shown below"
echo "🔧 ngrok web interface: http://localhost:4040"
echo ""
echo "⚠️  Important: Use the HTTPS URL on mobile devices for full functionality!"
echo "💡 For NFC testing, HTTPS is required!"
echo ""
echo "🛑 Press Ctrl+C to stop the tunnel"
echo ""

# Start ngrok for just the frontend
ngrok http 4001
