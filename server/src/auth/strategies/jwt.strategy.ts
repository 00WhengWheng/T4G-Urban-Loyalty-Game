import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { TenantsService } from '../../tenants/tenants.service';
import { RedisService } from '../../common/redis.module';

interface JwtPayload {
  sub: string;
  type: 'user' | 'tenant';
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private tenantsService: TenantsService,
    private redisService: RedisService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Extract from Authorization header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Extract from cookies
        (request: Request) => {
          return request?.cookies?.auth_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true, // Pass request to validate method
    });
  }

  async validate(request: Request, payload: JwtPayload) {
    try {
      const { sub: id, type, iat } = payload;

      // Check if token is blacklisted (for logout functionality)
      const tokenKey = `blacklisted_token:${id}:${iat}`;
      const isBlacklisted = await this.redisService.exists(tokenKey);
      
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been invalidated');
      }

      // Validate user/tenant based on type
      if (type === 'user') {
        const user = await this.usersService.findById(id);
        if (!user || user.status !== 'active') {
          throw new UnauthorizedException('User not found or inactive');
        }

        // Store last activity
        await this.redisService.set(
          `user_activity:${id}`, 
          new Date().toISOString(), 
          3600 // 1 hour TTL
        );

        return { 
          ...user, 
          userType: 'user',
          tokenIat: iat,
          ipAddress: request.ip,
          userAgent: request.get('User-Agent'),
        };
      }
      
      if (type === 'tenant') {
        const tenant = await this.tenantsService.findById(id);
        if (!tenant || tenant.status !== 'active') {
          throw new UnauthorizedException('Tenant not found or inactive');
        }

        // Store last activity
        await this.redisService.set(
          `tenant_activity:${id}`, 
          new Date().toISOString(), 
          3600 // 1 hour TTL
        );

        return { 
          ...tenant, 
          userType: 'tenant',
          tokenIat: iat,
          ipAddress: request.ip,
          userAgent: request.get('User-Agent'),
        };
      }
      
      throw new UnauthorizedException('Invalid token type');
      
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      console.error('JWT validation error:', error);
      throw new UnauthorizedException('Token validation failed');
    }
  }
}

// Extended JWT service with Redis blacklisting
import { Injectable as InjectableService } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@InjectableService()
export class EnhancedJwtService {
  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
    private configService: ConfigService,
  ) {}

  // Generate token with additional metadata
  async generateToken(userId: string, type: 'user' | 'tenant', additionalClaims?: Record<string, any>) {
    const payload = {
      sub: userId,
      type,
      iat: Math.floor(Date.now() / 1000),
      ...additionalClaims,
    };

    const token = await this.jwtService.signAsync(payload);
    
    // Store token metadata in Redis for tracking
    const tokenKey = `active_token:${userId}:${payload.iat}`;
    await this.redisService.setJson(tokenKey, {
      userId,
      type,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    }, 7 * 24 * 60 * 60); // 7 days TTL

    return token;
  }

  // Blacklist token (for logout)
  async blacklistToken(userId: string, tokenIat: number) {
    const tokenKey = `blacklisted_token:${userId}:${tokenIat}`;
    const expiresIn = this.configService.get('JWT_EXPIRES_IN', '7d');
    
    // Calculate TTL based on token expiration
    const ttlSeconds = this.parseDuration(expiresIn);
    
    await this.redisService.set(tokenKey, 'blacklisted', ttlSeconds);
    
    // Remove from active tokens
    const activeTokenKey = `active_token:${userId}:${tokenIat}`;
    await this.redisService.del(activeTokenKey);
  }

  // Blacklist all user tokens (for security purposes)
  async blacklistAllUserTokens(userId: string, type: 'user' | 'tenant') {
    const pattern = `active_token:${userId}:*`;
    const keys = await this.redisService.deletePattern(pattern);
    
    // Add to global blacklist with user ID and timestamp
    const globalBlacklistKey = `global_blacklist:${type}:${userId}`;
    await this.redisService.set(
      globalBlacklistKey, 
      new Date().toISOString(), 
      7 * 24 * 60 * 60 // 7 days
    );
    
    console.log(`Blacklisted ${keys} tokens for ${type} ${userId}`);
    return keys;
  }

  // Get active sessions for user
  async getActiveSessions(userId: string): Promise<any[]> {
    try {
      const pattern = `active_token:${userId}:*`;
      const redis = this.redisService['redis']; // Access underlying Redis instance
      const keys = await redis.keys(pattern);
      
      const sessions = [];
      for (const key of keys) {
        const sessionData = await this.redisService.getJson(key);
        if (sessionData) {
          sessions.push(sessionData);
        }
      }
      
      return sessions;
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return [];
    }
  }

  // Parse duration string to seconds
  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60; // Default 7 days
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 7 * 24 * 60 * 60;
    }
  }
}