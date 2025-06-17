import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(
    @Inject('default_IORedisModuleConnectionToken')
    private readonly redis: Redis,
  ) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string): Promise<'OK'> {
    return this.redis.set(key, value);
  }

  async setex(key: string, ttl: number, value: string): Promise<'OK'> {
    return this.redis.setex(key, ttl, value);
  }

  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }

  async ping(): Promise<boolean> {
    const result = await this.redis.ping();
    return result === 'PONG';
  }
}
