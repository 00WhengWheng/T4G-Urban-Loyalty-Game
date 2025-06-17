import { Module, Global, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RedisModule as IoRedisModule, RedisModuleOptions } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

// Redis Service for custom operations
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class RedisService {
  constructor(
    @Inject('default_IORedisModuleConnectionToken')
    private readonly redis: Redis,
  ) {}

  // Cache operations
  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, value);
      } else {
        await this.redis.set(key, value);
      }
      return true;
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  // Rate limiting operations
  async incr(key: string): Promise<number> {
    try {
      return await this.redis.incr(key);
    } catch (error) {
      console.error(`Redis INCR error for key ${key}:`, error);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, seconds);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  // JSON operations
  async setJson(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(value);
      return await this.set(key, jsonString, ttlSeconds);
    } catch (error) {
      console.error(`Redis SET JSON error for key ${key}:`, error);
      return false;
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const jsonString = await this.get(key);
      if (!jsonString) return null;
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error(`Redis GET JSON error for key ${key}:`, error);
      return null;
    }
  }

  // List operations for leaderboards
  async zadd(key: string, score: number, member: string): Promise<boolean> {
    try {
      await this.redis.zadd(key, score, member);
      return true;
    } catch (error) {
      console.error(`Redis ZADD error for key ${key}:`, error);
      return false;
    }
  }

  async zrevrange(key: string, start: number, stop: number, withScores: boolean = false): Promise<string[]> {
    try {
      if (withScores) {
        return await this.redis.zrevrange(key, start, stop, 'WITHSCORES');
      }
      return await this.redis.zrevrange(key, start, stop);
    } catch (error) {
      console.error(`Redis ZREVRANGE error for key ${key}:`, error);
      return [];
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis PING error:', error);
      return false;
    }
  }

  // Get Redis info
  async info(): Promise<any> {
    try {
      const info = await this.redis.info();
      return info;
    } catch (error) {
      console.error('Redis INFO error:', error);
      return null;
    }
  }

  // Clear cache by pattern
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      await this.redis.del(...keys);
      return keys.length;
    } catch (error) {
      console.error(`Redis DELETE PATTERN error for pattern ${pattern}:`, error);
      return 0;
    }
  }
}

@Global()
@Module({
  imports: [
    IoRedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): RedisModuleOptions => ({
        type: 'single',
        options: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB', 0),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Additional Redis setup if needed
    console.log('🔧 Redis module initialized');
  }

  async onModuleDestroy() {
    // Cleanup Redis connections
    console.log('🔧 Redis module destroyed');
  }
}