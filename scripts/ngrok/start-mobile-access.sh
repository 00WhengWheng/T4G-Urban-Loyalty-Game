#!/bin/bash

# T4G Urban Loyalty Game - Mobile Access Setup Script
# This script starts ngrok tunnels to expose your local development environment to mobile devices

echo "🚀 Starting T4G Urban Loyalty Game Mobile Access..."
echo ""

# Check if Docker services are running
echo "📋 Checking Docker services..."
CONTAINERS_RUNNING=$(docker ps --filter "name=t4g-" --format "{{.Names}}" | wc -l)

if [ $CONTAINERS_RUNNING -eq 0 ]; then
    echo "❌ No T4G containers found running!"
    echo "Please start your Docker services first:"
    echo "   docker compose up -d"
    exit 1
fi

echo "✅ Found $CONTAINERS_RUNNING T4G containers running"
echo ""

# Show running containers
echo "📦 Running T4G services:"
docker ps --filter "name=t4g-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Start ngrok with config file
echo "🌐 Starting ngrok tunnels..."
echo ""
echo "📱 Your app will be available at the HTTPS URLs shown below"
echo "🔧 ngrok web interface: http://localhost:4040"
echo ""
echo "⚠️  Important: Use the HTTPS URLs on mobile devices for full functionality!"
echo ""

# Start ngrok with the configuration file
ngrok start --all --config=ngrok.yml
