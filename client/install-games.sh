#!/bin/bash

# T4G Phaser.js Games Installation Script

echo "🎮 Installing Phaser.js Games for T4G Urban Loyalty Game..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: This script must be run from the client directory"
    echo "Please run: cd client && bash install-games.sh"
    exit 1
fi

# Install Phaser.js dependency
echo "📦 Installing Phaser.js..."
pnpm add phaser@^3.80.1

if [ $? -eq 0 ]; then
    echo "✅ Phaser.js installed successfully!"
else
    echo "❌ Failed to install Phaser.js"
    exit 1
fi

# Check if games directory exists
if [ -d "src/games" ]; then
    echo "✅ Games directory already exists"
else
    echo "❌ Games directory not found - please ensure you've pulled the latest code"
    exit 1
fi

# Check if public games directory exists
if [ -d "public/games" ]; then
    echo "✅ Public games directory exists"
else
    echo "❌ Public games directory not found"
    exit 1
fi

echo ""
echo "🎯 Installation complete! You can now:"
echo "1. Run 'pnpm run dev' to start the development server"
echo "2. Navigate to '/mini-games' in the app"
echo "3. Start playing urban mini-games!"
echo ""
echo "📚 For more information, see PHASER_INTEGRATION.md"
echo ""
echo "🎮 Happy gaming!"
