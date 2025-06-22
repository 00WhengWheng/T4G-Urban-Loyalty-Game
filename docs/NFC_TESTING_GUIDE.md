# NFC Testing Guide for Urban Loyalty Game

## Overview
This guide covers comprehensive testing approaches for NFC functionality on mobile devices.

## 1. Web NFC API Testing (Primary Method)

### Requirements
- **Device**: Android phone with NFC capability
- **Browser**: Chrome 89+ or Edge 89+
- **Connection**: HTTPS (required by Web NFC API)
- **NFC Tags**: Physical tags with NDEF records

### Setup Steps

#### A. Prepare Your Environment
```bash
# 1. Build and serve with HTTPS
npm run build
npx serve -s build --ssl-cert ./certs/cert.pem --ssl-key ./certs/key.pem

# 2. Alternative: Use ngrok for HTTPS tunneling
npx ngrok http 3000
```

#### B. Enable NFC on Android
1. Settings → Connected devices → NFC
2. Enable "NFC" and "Android Beam" (if available)
3. Ensure device is unlocked when testing

#### C. Test NFC Tags
Create test tags with different NDEF record types:

**Text Record:**
```javascript
const message = {
  records: [{
    recordType: "text",
    data: "T4G_BAR_CENTRAL_001"
  }]
};
```

**URL Record:**
```javascript
const message = {
  records: [{
    recordType: "url",
    data: "https://yourdomain.com/scan?tag=T4G_BAR_CENTRAL_001"
  }]
};
```

## 2. Testing Approaches

### A. Manual Testing Checklist

#### ✅ Device Compatibility
- [ ] Android device with NFC
- [ ] Chrome/Edge browser
- [ ] NFC enabled in settings
- [ ] HTTPS connection verified

#### ✅ Functionality Testing
- [ ] NFC detection works
- [ ] Tag reading is successful
- [ ] Backend API receives scan data
- [ ] Points are awarded correctly
- [ ] Rate limiting functions
- [ ] Location validation works
- [ ] Error handling displays properly

#### ✅ User Experience Testing
- [ ] Clear permission requests
- [ ] Loading states are visible
- [ ] Success/error feedback
- [ ] Scan history updates
- [ ] Multiple scans work
- [ ] Recovery from errors

### B. Automated Testing

#### Unit Tests for NFC Service
```typescript
// Test rate limiting
it('should prevent rapid consecutive scans', async () => {
  const scanData = createMockScanData();
  
  await request(app.getHttpServer())
    .post('/api/v1/nfc/scan')
    .send(scanData)
    .expect(200);
    
  await request(app.getHttpServer())
    .post('/api/v1/nfc/scan')
    .send(scanData)
    .expect(400); // Rate limited
});

// Test location validation
it('should reject scans outside radius', async () => {
  const scanData = {
    tag_identifier: 'TEST_TAG',
    user_latitude: 40.7589,
    user_longitude: -73.9851 // Far from tag location
  };
  
  await request(app.getHttpServer())
    .post('/api/v1/nfc/scan')
    .send(scanData)
    .expect(400);
});
```

## 3. Physical Testing Setup

### A. Create Test NFC Tags

#### Required Materials
- **NFC Tags**: NTAG213/215/216 recommended
- **NFC App**: "NFC Tools" or "TagWriter" for Android
- **Content**: Your app's tag identifiers

#### Tag Configuration
1. **Format**: NDEF format
2. **Record Type**: Text or URL
3. **Content Examples**:
   - `T4G_RESTAURANT_001`
   - `T4G_BAR_DOWNTOWN_005`
   - `T4G_COFFEE_SHOP_012`

### B. Test Scenarios

#### Scenario 1: First-time Scan
```typescript
Expected: {
  success: true,
  points_earned: 15,
  daily_scans: 1,
  max_daily_scans: 5
}
```

#### Scenario 2: Daily Limit Reached
```typescript
Expected: {
  success: false,
  message: "Maximum 5 scans per day reached",
  next_scan_available: "2024-01-02T00:00:00Z"
}
```

#### Scenario 3: Location Too Far
```typescript
Expected: {
  success: false,
  message: "You must be within 100m of the merchant",
  current_distance: 250,
  required_distance: 100
}
```

## 4. Debugging and Troubleshooting

### A. Common Issues

#### "NDEFReader is not defined"
- **Cause**: Browser doesn't support Web NFC API
- **Solution**: Test on Android Chrome 89+

#### "NotAllowedError: NFC permission denied"
- **Cause**: User denied NFC permissions
- **Solution**: Clear site data and retry

#### "NotSupportedError: NFC is not supported"
- **Cause**: Device lacks NFC hardware
- **Solution**: Test on NFC-enabled device

#### "SecurityError: HTTPS required"
- **Cause**: Not served over HTTPS
- **Solution**: Use HTTPS or localhost

### B. Debug Tools

#### Browser DevTools
```javascript
// Check NFC API availability
console.log('NDEFReader available:', 'NDEFReader' in window);

// Monitor NFC events
const reader = new NDEFReader();
reader.addEventListener('reading', event => {
  console.log('NFC Reading:', event);
});
```

#### Server Logs
```typescript
// Enable detailed NFC logging
this.logger.log(`NFC scan attempt: ${scanDto.tag_identifier} by user ${userId}`);
this.logger.debug(`Location validation: ${distance}m from tag`);
this.logger.debug(`Rate limit check: ${rateLimitKey}`);
```

## 5. Performance Testing

### A. Load Testing
- Multiple concurrent scans
- Database performance under load
- Redis cache efficiency
- API response times

### B. Mobile Performance
- Battery usage during NFC scanning
- Memory consumption
- UI responsiveness
- Network request optimization

## 6. Production Deployment Checklist

### A. Infrastructure
- [ ] HTTPS certificate configured
- [ ] CDN for static assets
- [ ] Database connection pooling
- [ ] Redis cache configured
- [ ] Monitoring and logging

### B. Security
- [ ] Rate limiting configured
- [ ] Input validation in place
- [ ] SQL injection prevention
- [ ] CORS properly configured
- [ ] Authentication tokens secured

### C. User Experience
- [ ] Progressive Web App (PWA) features
- [ ] Offline fallback handling
- [ ] Clear error messages
- [ ] Loading states
- [ ] Success feedback

## 7. Alternative Testing Methods

### A. NFC Simulation (Development)
```typescript
// Mock NFC reader for development
class MockNDEFReader {
  async scan() {
    return Promise.resolve();
  }
  
  addEventListener(event: string, callback: Function) {
    // Simulate NFC tag detection after delay
    setTimeout(() => {
      callback({
        message: {
          records: [{
            recordType: 'text',
            data: new TextEncoder().encode('T4G_TEST_TAG_001')
          }]
        },
        serialNumber: 'MOCK_SERIAL_123456'
      });
    }, 2000);
  }
}
```

### B. QR Code Fallback
- Include QR codes as backup scanning method
- Same backend validation logic
- Cross-platform compatibility

### C. Testing on iOS (Limitations)
- Web NFC API not available on iOS
- Core NFC requires native app
- Consider hybrid app approach for iOS support

## 8. Metrics and Analytics

### A. Track Success Rates
- Successful vs failed scans
- Device/browser compatibility
- Error type distribution
- User retention after scan failures

### B. Performance Metrics
- Scan completion time
- API response times
- Cache hit rates
- Database query performance

## 9. User Acceptance Testing

### A. Test Groups
- Different Android devices
- Various Chrome versions
- Different NFC tag types
- Real-world environments

### B. Feedback Collection
- In-app feedback forms
- Error reporting
- User surveys
- Analytics data

## Conclusion

This comprehensive testing approach ensures your NFC functionality works reliably across different devices and scenarios. Focus on the Web NFC API as your primary testing method, but include fallbacks and robust error handling for the best user experience.
