#!/bin/bash

# T4G Urban Loyalty Game - ngrok Authentication Setup
# This script helps you set up ngrok authentication

echo "🔐 T4G Urban Loyalty Game - ngrok Authentication Setup"
echo ""
echo "To use ngrok, you need to create a free account and get an auth token."
echo ""
echo "📝 Step 1: Create a free ngrok account"
echo "   👉 Go to: https://dashboard.ngrok.com/signup"
echo ""
echo "🔑 Step 2: Get your auth token"
echo "   👉 Go to: https://dashboard.ngrok.com/get-started/your-authtoken"
echo "   👉 Copy the token from the dashboard"
echo ""
echo "💾 Step 3: Configure your auth token"
echo "   Run this command with your token:"
echo "   👉 ngrok config add-authtoken YOUR_TOKEN_HERE"
echo ""
echo "🚀 Step 4: Start mobile access"
echo "   After setting up the token, run:"
echo "   👉 ./start-mobile-access.sh"
echo ""
echo "📱 What you'll get:"
echo "   ✅ Public HTTPS URLs for your T4G app"
echo "   ✅ Mobile device access"
echo "   ✅ NFC testing capability"
echo "   ✅ Real device testing"
echo ""
echo "🆓 Note: ngrok free tier gives you:"
echo "   • 1 concurrent tunnel"
echo "   • Random subdomains"
echo "   • HTTPS/HTTP support"
echo "   • 40 connections/minute"
echo ""

# Check if user wants to open the signup page
read -p "Would you like to open the ngrok signup page now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 Opening ngrok signup page..."
    if command -v xdg-open > /dev/null; then
        xdg-open "https://dashboard.ngrok.com/signup"
    elif command -v open > /dev/null; then
        open "https://dashboard.ngrok.com/signup"
    else
        echo "Please manually open: https://dashboard.ngrok.com/signup"
    fi
fi
