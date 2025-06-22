#!/bin/bash

# NFC Testing Setup Script
# This script helps set up your environment for NFC testing on mobile devices

echo "🔧 T4G Urban Loyalty Game - NFC Testing Setup"
echo "================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to install dependencies
install_deps() {
    echo "📦 Installing dependencies..."
    
    # Check if pnpm is available
    if command -v pnpm &> /dev/null; then
        echo "Using pnpm..."
        pnpm install
    elif command -v npm &> /dev/null; then
        echo "Using npm..."
        npm install
    else
        echo "❌ Error: Neither npm nor pnpm found. Please install Node.js and npm/pnpm."
        exit 1
    fi
}

# Function to create SSL certificates for HTTPS
create_ssl_certs() {
    echo "🔐 Creating SSL certificates for HTTPS testing..."
    
    # Create certs directory
    mkdir -p certs
    
    # Generate SSL certificate for localhost
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout certs/key.pem \
        -out certs/cert.pem \
        -subj "/C=IT/ST=Italy/L=City/O=T4G/OU=Dev/CN=localhost"
    
    if [ $? -eq 0 ]; then
        echo "✅ SSL certificates created in ./certs/"
    else
        echo "❌ Error creating SSL certificates. Please install OpenSSL."
        echo "📱 Alternative: Use ngrok for HTTPS tunneling"
    fi
}

# Function to set up ngrok (alternative to SSL certs)
setup_ngrok() {
    echo "🌐 Setting up ngrok for HTTPS tunneling..."
    
    if command -v ngrok &> /dev/null; then
        echo "✅ ngrok is already installed"
    else
        echo "📥 Installing ngrok..."
        
        # Detect OS and install ngrok
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
            echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
            sudo apt update && sudo apt install ngrok
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            brew install ngrok/ngrok/ngrok
        else
            echo "Please install ngrok manually from https://ngrok.com/download"
        fi
    fi
}

# Function to create NFC test tags script
create_nfc_test_script() {
    echo "📱 Creating NFC test tag generation script..."
    
    cat > create_test_tags.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>T4G NFC Tag Writer</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 10px 0; }
        button { background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        input { width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>🏷️ T4G NFC Tag Writer</h1>
    <p>Use this tool to write test NFC tags for your Urban Loyalty Game.</p>
    
    <div class="container">
        <h3>📝 Write Custom Tag</h3>
        <input type="text" id="customTag" placeholder="Enter tag identifier (e.g., T4G_RESTAURANT_001)" value="T4G_TEST_001">
        <button onclick="writeCustomTag()">Write Custom Tag</button>
    </div>
    
    <div class="container">
        <h3>🎯 Quick Test Tags</h3>
        <button onclick="writeTestTag('T4G_BAR_CENTRAL_001')">Bar Central</button>
        <button onclick="writeTestTag('T4G_RESTAURANT_002')">Restaurant Roma</button>
        <button onclick="writeTestTag('T4G_COFFEE_003')">Coffee Shop</button>
        <button onclick="writeTestTag('T4G_GELATERIA_004')">Gelateria Luna</button>
    </div>
    
    <div class="container">
        <h3>🔍 Read NFC Tag</h3>
        <button onclick="readTag()">Read Tag</button>
        <div id="readResult"></div>
    </div>
    
    <div id="status"></div>
    
    <div class="container">
        <h3>ℹ️ Instructions</h3>
        <ol>
            <li>Open this page on an Android device with Chrome</li>
            <li>Enable NFC in device settings</li>
            <li>Choose a tag identifier and click "Write"</li>
            <li>Hold an NFC tag near your device when prompted</li>
            <li>Test scanning with your T4G app</li>
        </ol>
    </div>

    <script>
        let ndefReader;
        
        async function initNFC() {
            if ('NDEFReader' in window) {
                ndefReader = new NDEFReader();
                return true;
            } else {
                showStatus('❌ NFC not supported on this device/browser', 'error');
                return false;
            }
        }
        
        function showStatus(message, type = 'success') {
            const status = document.getElementById('status');
            status.innerHTML = `<div class="container ${type}">${message}</div>`;
        }
        
        async function writeCustomTag() {
            const tagValue = document.getElementById('customTag').value;
            if (!tagValue) {
                showStatus('❌ Please enter a tag identifier', 'error');
                return;
            }
            await writeTag(tagValue);
        }
        
        async function writeTestTag(identifier) {
            await writeTag(identifier);
        }
        
        async function writeTag(identifier) {
            if (!(await initNFC())) return;
            
            try {
                showStatus('📱 Hold an NFC tag near your device...');
                
                const message = {
                    records: [{
                        recordType: "text",
                        data: identifier
                    }]
                };
                
                await ndefReader.write(message);
                showStatus(`✅ Successfully wrote tag: ${identifier}`, 'success');
                
            } catch (error) {
                showStatus(`❌ Write error: ${error.message}`, 'error');
                console.error('NFC write error:', error);
            }
        }
        
        async function readTag() {
            if (!(await initNFC())) return;
            
            try {
                showStatus('📱 Hold an NFC tag near your device to read...');
                
                ndefReader.addEventListener('reading', ({ message, serialNumber }) => {
                    let content = 'Unknown format';
                    
                    for (const record of message.records) {
                        if (record.recordType === 'text') {
                            content = new TextDecoder().decode(record.data);
                            break;
                        } else if (record.recordType === 'url') {
                            content = new TextDecoder().decode(record.data);
                            break;
                        }
                    }
                    
                    const result = `
                        <h4>📖 Tag Read Successfully</h4>
                        <p><strong>Serial:</strong> ${serialNumber}</p>
                        <p><strong>Content:</strong> ${content}</p>
                        <p><strong>Records:</strong> ${message.records.length}</p>
                    `;
                    
                    document.getElementById('readResult').innerHTML = result;
                    showStatus('✅ Tag read successfully', 'success');
                });
                
                await ndefReader.scan();
                
            } catch (error) {
                showStatus(`❌ Read error: ${error.message}`, 'error');
                console.error('NFC read error:', error);
            }
        }
        
        // Initialize on page load
        document.addEventListener('DOMContentLoaded', initNFC);
    </script>
</body>
</html>
EOF

    echo "✅ Created create_test_tags.html - Open this file on your Android device to write test NFC tags"
}

# Function to display usage instructions
show_usage() {
    echo ""
    echo "🚀 Next Steps for NFC Testing:"
    echo "================================"
    echo ""
    echo "1. 📱 Test on Android Device:"
    echo "   - Use Android device with NFC enabled"
    echo "   - Open Chrome or Edge browser"
    echo "   - Enable NFC in device settings"
    echo ""
    echo "2. 🌐 Start HTTPS Server:"
    echo "   Option A - Using SSL certificates:"
    echo "   npx serve -s build --ssl-cert ./certs/cert.pem --ssl-key ./certs/key.pem"
    echo ""
    echo "   Option B - Using ngrok:"
    echo "   npm start (in one terminal)"
    echo "   ngrok http 3000 (in another terminal)"
    echo ""
    echo "3. 🏷️ Create Test NFC Tags:"
    echo "   - Open create_test_tags.html on your Android device"
    echo "   - Write test tags with identifiers like T4G_TEST_001"
    echo ""
    echo "4. 🧪 Test Your App:"
    echo "   - Navigate to /nfc-tester for comprehensive testing"
    echo "   - Use /scan for user-facing NFC scanning"
    echo ""
    echo "5. 📊 Monitor Results:"
    echo "   - Check browser console for debug info"
    echo "   - Monitor server logs for API calls"
    echo "   - Test error scenarios (rate limiting, distance, etc.)"
    echo ""
}

# Main execution
echo "Starting NFC testing setup..."

# Install dependencies
install_deps

# Create SSL certificates
create_ssl_certs

# Setup ngrok as alternative
setup_ngrok

# Create NFC test tag writer
create_nfc_test_script

# Show usage instructions
show_usage

echo ""
echo "✅ NFC testing setup complete!"
echo "📖 See docs/NFC_TESTING_GUIDE.md for detailed testing instructions"
