import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Redis } from 'ioredis';
import { createTestApp } from '../utils/test-setup';
import { createMockScanData } from '../utils/mock-data';

describe('NFC Integration Tests', () => {
  let app: INestApplication;
  let redis: Redis;
  let authToken: string;
  let testTagId: string;
  
  beforeAll(async () => {
    app = await createTestApp();
    redis = app.get('REDIS_SERVICE');
    
    // Create test user and get auth token
    const userResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        username: 'nfctestuser',
        email: 'nfctest@example.com',
        password: 'password123'
      });
    
    authToken = userResponse.body.token;
    
    // Create test NFC tag
    const tagResponse = await request(app.getHttpServer())
      .post('/api/v1/nfc/tags')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        tag_identifier: 'TEST_NFC_001',
        tag_location: 'Test Location',
        latitude: 40.7589,
        longitude: -73.9851,
        points_per_scan: 15,
        max_daily_scans: 5,
        max_total_scans: 100,
        scan_radius: 100,
        is_active: true
      });
    
    testTagId = tagResponse.body.id;
  });
  
  afterEach(async () => {
    // Clear Redis cache between tests
    await redis.flushall();
  });
  
  afterAll(async () => {
    await app.close();
  });

  describe('NFC Scanning', () => {
    it('should successfully scan a valid NFC tag', async () => {
      const scanData = {
        tag_identifier: 'TEST_NFC_001',
        user_latitude: 40.7589,
        user_longitude: -73.9851,
        scan_location: {
          latitude: 40.7589,
          longitude: -73.9851,
          accuracy: 10,
          timestamp: new Date().toISOString()
        },
        device_info: {
          userAgent: 'Mozilla/5.0 (Android)',
          platform: 'Android',
          appVersion: '1.0.0'
        }
      };
      
      const response = await request(app.getHttpServer())
        .post('/api/v1/nfc/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scanData)
        .expect(200);
        
      expect(response.body).toMatchObject({
        success: true,
        points_awarded: 15,
        nfc_tag: {
          tag_identifier: 'TEST_NFC_001'
        }
      });
      
      expect(response.body.scan_id).toBeDefined();
      expect(response.body.message).toContain('Successfully scanned');
    });

    it('should prevent duplicate scans within cooldown period', async () => {
      const scanData = createMockScanData();
      
      // First scan should succeed
      await request(app.getHttpServer())
        .post('/api/v1/nfc/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scanData)
        .expect(200);
        
      // Second immediate scan should be rate limited
      await request(app.getHttpServer())
        .post('/api/v1/nfc/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scanData)
        .expect(400);
    });

    it('should reject scans outside radius', async () => {
      const scanData = {
        tag_identifier: 'TEST_NFC_001',
        user_latitude: 40.7500, // Far from tag location
        user_longitude: -73.9900,
        scan_location: {
          latitude: 40.7500,
          longitude: -73.9900,
          accuracy: 10,
          timestamp: new Date().toISOString()
        }
      };
      
      const response = await request(app.getHttpServer())
        .post('/api/v1/nfc/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scanData)
        .expect(400);
        
      expect(response.body.message).toContain('within');
    });

    it('should enforce daily scan limits', async () => {
      const scanData = {
        tag_identifier: 'TEST_NFC_001',
        user_latitude: 40.7589,
        user_longitude: -73.9851
      };
      
      // Scan up to the daily limit (5 times)
      for (let i = 0; i < 5; i++) {
        // Wait for rate limit to clear
        await new Promise(resolve => setTimeout(resolve, 6000));
        
        await request(app.getHttpServer())
          .post('/api/v1/nfc/scan')
          .set('Authorization', `Bearer ${authToken}`)
          .send(scanData)
          .expect(200);
      }
      
      // 6th scan should be rejected
      await new Promise(resolve => setTimeout(resolve, 6000));
      const response = await request(app.getHttpServer())
        .post('/api/v1/nfc/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scanData)
        .expect(400);
        
      expect(response.body.message).toContain('Maximum');
    });

    it('should reject invalid tag identifiers', async () => {
      const scanData = {
        tag_identifier: 'INVALID_TAG_999',
        user_latitude: 40.7589,
        user_longitude: -73.9851
      };
      
      const response = await request(app.getHttpServer())
        .post('/api/v1/nfc/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scanData)
        .expect(400);
        
      expect(response.body.message).toContain('not found');
    });

    it('should handle missing location data gracefully', async () => {
      const scanData = {
        tag_identifier: 'TEST_NFC_001'
        // No location data provided
      };
      
      // Should still work if location validation is disabled or optional
      const response = await request(app.getHttpServer())
        .post('/api/v1/nfc/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scanData);
        
      // Could be either success or error depending on business rules
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('NFC Tag Management', () => {
    it('should create new NFC tag', async () => {
      const tagData = {
        tag_identifier: 'TEST_NFC_002',
        tag_location: 'Test Restaurant',
        latitude: 40.7600,
        longitude: -73.9800,
        points_per_scan: 20,
        max_daily_scans: 3,
        max_total_scans: 50,
        scan_radius: 150,
        is_active: true
      };
      
      const response = await request(app.getHttpServer())
        .post('/api/v1/nfc/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tagData)
        .expect(201);
        
      expect(response.body.tag_identifier).toBe('TEST_NFC_002');
      expect(response.body.points_per_scan).toBe(20);
    });

    it('should prevent duplicate tag identifiers', async () => {
      const tagData = {
        tag_identifier: 'TEST_NFC_001', // Already exists
        tag_location: 'Duplicate Test',
        points_per_scan: 10,
        max_daily_scans: 1,
        max_total_scans: 10,
        scan_radius: 50
      };
      
      await request(app.getHttpServer())
        .post('/api/v1/nfc/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tagData)
        .expect(400);
    });

    it('should get tag statistics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/nfc/tags/${testTagId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
        
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.totalScans).toBeGreaterThanOrEqual(0);
    });
  });

  describe('NFC Analytics', () => {
    it('should get scan history', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/nfc/scan-history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
        
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get popular tags', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/nfc/popular')
        .expect(200);
        
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed scan data', async () => {
      const invalidData = {
        tag_identifier: '', // Empty identifier
        user_latitude: 'invalid', // Invalid latitude
        user_longitude: null
      };
      
      await request(app.getHttpServer())
        .post('/api/v1/nfc/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should require authentication for protected endpoints', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/nfc/scan')
        .send(createMockScanData())
        .expect(401);
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent scan attempts', async () => {
      const scanData = {
        tag_identifier: 'TEST_NFC_001',
        user_latitude: 40.7589,
        user_longitude: -73.9851
      };
      
      // Make multiple concurrent requests
      const promises = Array(5).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/api/v1/nfc/scan')
          .set('Authorization', `Bearer ${authToken}`)
          .send(scanData)
      );
      
      const responses = await Promise.all(promises);
      
      // Only one should succeed due to rate limiting
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses).toHaveLength(1);
    });
  });
});