import { Injectable } from '@nestjs/common';
import { RedisService } from '../common/redis.service';

@Injectable()
export class CacheService {
  private readonly TTL = {
    LEADERBOARD: 300, // 5 minuti
    USER_PROFILE: 900, // 15 minuti
    CHALLENGES: 600, // 10 minuti
    STATIC_DATA: 3600 // 1 ora
  };

  constructor(private readonly redis: RedisService) {}

  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl: number
  ): Promise<T> {
    const cached = await this.redis.get(key);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    const data = await fetcher();
    await this.redis.setex(key, ttl, JSON.stringify(data));
    
    return data;
  }
}