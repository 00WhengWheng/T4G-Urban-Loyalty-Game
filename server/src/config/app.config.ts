import { config } from 'dotenv';

config(); // Load environment variables from .env file

export const appConfig = () => ({
  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: true,
      ca: process.env.DATABASE_CA_CERT,
    } : false,
    pool: {
      min: process.env.NODE_ENV === 'production' ? 2 : 1,
      max: process.env.NODE_ENV === 'production' ? 20 : 5,
    },
    devOptions: process.env.NODE_ENV !== 'production' ? {
      logging: true,
      synchronize: true, // Auto-create tables in dev
    } : {},
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    ttl: 300,
    keyPrefix: 't4g:'
  },
  security: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiration: process.env.JWT_EXPIRES_IN || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    rateLimiting: {
      auth: { ttl: 300000, limit: 10 },
      nfc: { ttl: 60000, limit: 5 }
    }
  }
});