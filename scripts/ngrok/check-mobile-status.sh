#!/bin/bash

# T4G Urban Loyalty Game - Mobile Access Status Check

echo "📱 T4G Mobile Access Status Check"
echo "================================="
echo ""

# Check Docker services
echo "🐳 Docker Services:"
DOCKER_SERVICES=$(docker ps --filter "name=t4g-" --format "table {{.Names}}\t{{.Status}}" | tail -n +2)
if [ -z "$DOCKER_SERVICES" ]; then
    echo "   ❌ No T4G services running"
    echo "   💡 Run: docker compose up -d"
else
    echo "$DOCKER_SERVICES" | while read line; do
        if [[ $line == *"healthy"* ]] || [[ $line == *"Up"* ]]; then
            echo "   ✅ $line"
        else
            echo "   ⚠️  $line"
        fi
    done
fi
echo ""

# Check ngrok
echo "🌐 ngrok Status:"
NGROK_PROCESSES=$(pgrep ngrok | wc -l)
if [ $NGROK_PROCESSES -eq 0 ]; then
    echo "   ❌ ngrok not running"
    echo "   💡 Run: ./start-simple-mobile-access.sh"
else
    echo "   ✅ ngrok running ($NGROK_PROCESSES process(es))"
    
    # Try to get tunnel info
    if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
        echo "   🔗 Tunnel URLs:"
        curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[] | "      " + .public_url + " -> " + .config.addr' 2>/dev/null || echo "      📊 View at: http://localhost:4040"
    fi
fi
echo ""

# Check local services
echo "🏠 Local Service Status:"
services=(
    "Frontend:4001"
    "Backend:3002"
    "PgAdmin:5051"
    "Redis UI:8081"
)

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    if curl -s -f http://localhost:$port > /dev/null 2>&1; then
        echo "   ✅ $name (localhost:$port)"
    else
        echo "   ❌ $name (localhost:$port)"
    fi
done
echo ""

# Mobile access summary
echo "📱 Mobile Access Summary:"
if [ $NGROK_PROCESSES -gt 0 ] && [ ! -z "$DOCKER_SERVICES" ]; then
    echo "   🎉 Ready for mobile testing!"
    echo "   📲 Check ngrok web interface: http://localhost:4040"
    echo "   🔧 Use HTTPS URL from ngrok on your mobile device"
else
    echo "   ⚠️  Not ready for mobile access"
    if [ $NGROK_PROCESSES -eq 0 ]; then
        echo "   💡 Start ngrok: ./start-simple-mobile-access.sh"
    fi
    if [ -z "$DOCKER_SERVICES" ]; then
        echo "   💡 Start services: docker compose up -d"
    fi
fi
