import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Redis } from 'ioredis';
import { createTestApp } from '../utils/test-setup';
import { createMockScanData } from '../utils/mock-data';

describe('NFC Integration', () => {
  let app: INestApplication;
  let redis: Redis;
  
  beforeAll(async () => {
    app = await createTestApp();
    redis = app.get('REDIS_SERVICE');
  });
  
  it('should prevent duplicate scans within cooldown', async () => {
    const scanData = createMockScanData();
    
    await request(app.getHttpServer())
      .post('/nfc/scan')
      .send(scanData)
      .expect(200);
      
    await request(app.getHttpServer())
      .post('/nfc/scan')
      .send(scanData)
      .expect(403);
  });
});