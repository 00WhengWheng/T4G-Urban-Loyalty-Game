# Complete ngrok Setup Guide for NFC Testing

## What is ngrok?
ngrok creates a secure tunnel from a public URL to your local development server, providing the HTTPS connection required for Web NFC API testing.

## Step 1: Install ngrok

### Option A: Download from website
1. Go to https://ngrok.com/download
2. Create a free account
3. Download ngrok for your OS
4. Extract and move to PATH

### Option B: Install via package manager

**Linux (Ubuntu/Debian):**
```bash
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

**macOS (Homebrew):**
```bash
brew install ngrok/ngrok/ngrok
```

**Windows (Chocolatey):**
```bash
choco install ngrok
```

## Step 2: Get Your Auth Token
1. Sign up at https://ngrok.com
2. Go to https://dashboard.ngrok.com/get-started/your-authtoken
3. Copy your authtoken
4. Run: `ngrok config add-authtoken YOUR_TOKEN_HERE`

## Step 3: Start Your Local Development Server

**For your React client:**
```bash
# Navigate to client directory
cd /home/fdm/T4G-Urban-Loyalty-Game/client

# Start development server
npm start
# This typically runs on http://localhost:3000
```

**For your NestJS server (if needed):**
```bash
# Navigate to server directory
cd /home/fdm/T4G-Urban-Loyalty-Game/server

# Start development server
npm run start:dev
# This typically runs on http://localhost:3001
```

## Step 4: Create ngrok Tunnel

**Basic tunnel (HTTP + HTTPS):**
```bash
ngrok http 3000
```

**Custom subdomain (requires paid plan):**
```bash
ngrok http 3000 --subdomain=my-t4g-app
```

**Multiple tunnels (create ngrok.yml config):**
```bash
# Create ngrok.yml in your project root
ngrok start --all
```

## Step 5: Use the HTTPS URL

After running ngrok, you'll see output like:
```
Session Status                online
Account                       your-email@example.com
Version                       3.3.0
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    http://abc123.ngrok.io -> http://localhost:3000
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000
```

**Use the HTTPS URL:** `https://abc123.ngrok.io`

## Step 6: Test NFC on Your Mobile Device

1. **Enable NFC** on your Android device
   - Settings → Connected devices → NFC
   - Toggle ON

2. **Open Chrome browser** on your Android device

3. **Navigate to your ngrok HTTPS URL**
   - Example: `https://abc123.ngrok.io`

4. **Go to NFC tester page**
   - Navigate to: `https://abc123.ngrok.io/nfc-tester`

5. **Test NFC functionality**
   - Grant permissions when prompted
   - Try scanning/writing NFC tags

## Troubleshooting ngrok

### Common Issues:

**1. "ngrok: command not found"**
```bash
# Check if ngrok is in PATH
which ngrok

# If not found, add to PATH or use full path
export PATH=$PATH:/path/to/ngrok
```

**2. "Your account is limited to 1 online ngrok agent session"**
- Kill existing ngrok processes:
```bash
pkill ngrok
# Then restart ngrok
```

**3. "Invalid Host header"**
- Add to your package.json scripts:
```json
{
  "scripts": {
    "start": "DANGEROUSLY_DISABLE_HOST_CHECK=true react-scripts start"
  }
}
```

**4. Tunnel not accessible**
- Check firewall settings
- Ensure local server is actually running
- Try different port: `ngrok http 3001`

## Advanced ngrok Configuration

### Create ngrok.yml for multiple services:

```yaml
version: "2"
authtoken: YOUR_TOKEN_HERE
tunnels:
  client:
    proto: http
    addr: 3000
    subdomain: t4g-client
  server:
    proto: http
    addr: 3001
    subdomain: t4g-api
  nfc-tester:
    proto: http
    addr: 3000
    subdomain: t4g-nfc-test
```

### Run with config:
```bash
ngrok start --all
```

## Quick Commands for Your Project

**1. Start everything for NFC testing:**
```bash
# Terminal 1: Start React client
cd /home/fdm/T4G-Urban-Loyalty-Game/client
npm start

# Terminal 2: Start ngrok tunnel
ngrok http 3000

# Terminal 3: Start server (if needed)
cd /home/fdm/T4G-Urban-Loyalty-Game/server
npm run start:dev
```

**2. One-line setup:**
```bash
# Start client and ngrok in background
cd /home/fdm/T4G-Urban-Loyalty-Game/client && npm start & sleep 10 && ngrok http 3000
```

## Testing Workflow

1. **Start services** (client + optionally server)
2. **Run ngrok** to create HTTPS tunnel
3. **Copy HTTPS URL** from ngrok output
4. **Open on Android device** in Chrome
5. **Navigate to `/nfc-tester`** for comprehensive testing
6. **Test NFC functionality** with real tags

## Monitor Traffic

- **ngrok Web Interface:** http://127.0.0.1:4040
- View all HTTP requests/responses
- Inspect headers and payload
- Debug API calls in real-time

## Security Notes

- **Free ngrok URLs are random** and change each restart
- **Don't use in production** - for development only
- **URLs are publicly accessible** - anyone can access
- **Paid plans** offer custom domains and authentication

## Example Complete Session

```bash
# 1. Start your React app
cd /home/fdm/T4G-Urban-Loyalty-Game/client
npm start
# ✅ App running on http://localhost:3000

# 2. In new terminal, start ngrok
ngrok http 3000
# ✅ Tunnel created: https://abc123.ngrok.io

# 3. Open on Android phone
# Go to: https://abc123.ngrok.io/nfc-tester

# 4. Test NFC features
# Grant permissions, scan tags, etc.
```

That's it! Your local development server is now accessible via HTTPS for NFC testing on mobile devices.
