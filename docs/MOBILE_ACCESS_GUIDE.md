# 📱 T4G Urban Loyalty Game - Mobile Access Guide

## 🎯 Quick Start

Your T4G Urban Loyalty Game is now accessible from mobile devices!

### 🌟 Current Status
- ✅ **ngrok tunnel active**: `https://9ddd-151-43-38-227.ngrok-free.app`
- ✅ **All Docker services running**: Frontend, Backend, Database, Redis
- ✅ **API proxy configured**: Backend calls automatically forwarded
- ✅ **Mobile optimized**: CORS and host checking configured

## 📱 Mobile Access Instructions

### 📲 **Step 1: Access from Mobile**
1. Open your mobile browser (Chrome/Safari)
2. Go to: `https://9ddd-151-43-38-227.ngrok-free.app`
3. Accept the ngrok warning page (click "Visit Site")
4. Your T4G app will load!

### 🔧 **Step 2: Testing Features**
- **✅ Frontend UI**: Should load completely
- **✅ API calls**: Automatically proxied to backend
- **✅ NFC features**: Available (HTTPS required)
- **✅ PWA features**: Install as app option

## 🛠️ Management Commands

### 🚀 **Start Mobile Access**
```bash
# Simple frontend-only tunnel (recommended)
./start-simple-mobile-access.sh

# Or using ngrok directly
ngrok http 4001
```

### 🛑 **Stop Mobile Access**
```bash
# Stop ngrok tunnels
./stop-mobile-access.sh

# Or stop manually
pkill ngrok
```

### 📊 **Monitor Traffic**
- **ngrok Web Interface**: http://localhost:4040
- **View requests, responses, and replay traffic**

## 🔄 **URLs & Ports**

### 🌐 **Public URLs (Mobile Access)**
- **Frontend**: `https://9ddd-151-43-38-227.ngrok-free.app`
- **API**: Proxied through frontend (no direct access needed)

### 🏠 **Local URLs (Development)**
- **Frontend**: http://localhost:4001
- **Backend API**: http://localhost:3002
- **PgAdmin**: http://localhost:5051
- **Redis Commander**: http://localhost:8081
- **ngrok Web UI**: http://localhost:4040

## 🔧 **Configuration Details**

### ⚙️ **Proxy Setup**
Your frontend automatically proxies API calls:
- `/api/*` → `http://server:3001/v1/*`
- `/auth/*` → `http://server:3001/v1/auth/*`

### 🛡️ **Security**
- **HTTPS**: Required for NFC and PWA features
- **CORS**: Enabled for mobile access
- **Host checking**: Disabled for ngrok domains

## 🎮 **NFC Testing**

### 📋 **Prerequisites**
- ✅ Android device with NFC enabled
- ✅ Chrome browser on mobile
- ✅ HTTPS URL (provided by ngrok)

### 🧪 **Testing Steps**
1. Enable NFC in Android settings
2. Open `https://9ddd-151-43-38-227.ngrok-free.app` in Chrome
3. Navigate to NFC features in the app
4. Test with NFC tags or devices

## 🚨 **Troubleshooting**

### ❌ **App won't load on mobile**
- Check if ngrok tunnel is running: `ps aux | grep ngrok`
- Verify Docker containers: `docker ps`
- Check ngrok web interface: http://localhost:4040

### ❌ **API calls failing**
- Verify backend container is healthy: `docker ps`
- Check proxy configuration in vite.config.ts
- Monitor requests in ngrok web interface

### ❌ **NFC not working**
- Ensure using HTTPS URL (not HTTP)
- Check Android NFC settings
- Test with Chrome browser only
- Verify device NFC capability

## 📞 **Support**

### 🔍 **Debug Commands**
```bash
# Check Docker status
docker ps --filter "name=t4g-"

# Check ngrok status
ps aux | grep ngrok

# Test local frontend
curl http://localhost:4001

# View ngrok logs
curl http://localhost:4040/api/tunnels
```

### 📝 **Log Locations**
- **Docker logs**: `docker logs t4g-client-dev`
- **ngrok interface**: http://localhost:4040
- **API logs**: `docker logs t4g-server-dev`

---

**🎉 Happy mobile testing with your T4G Urban Loyalty Game!**
