import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Controllers & Services
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// Strategies & Guards
import { JwtStrategy, EnhancedJwtService } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// Related Modules
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { RedisModule, RedisService } from '../common/redis.module';

@Module({
  imports: [
    // Passport configuration
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
      session: false,
    }),

    // JWT configuration with environment-based settings
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN', '7d');
        
        if (!secret) {
          throw new Error('JWT_SECRET must be defined in environment variables');
        }

        return {
          secret,
          signOptions: {
            expiresIn,
            issuer: 't4g-urban-loyalty-game',
            audience: ['t4g-users', 't4g-tenants'],
          },
          verifyOptions: {
            issuer: 't4g-urban-loyalty-game',
            audience: ['t4g-users', 't4g-tenants'],
          },
        };
      },
      inject: [ConfigService],
    }),

    
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [{
          ttl: configService.get<number>('AUTH_THROTTLE_TTL', 300),
          limit: configService.get<number>('AUTH_THROTTLE_LIMIT', 10),
        }],
        skipIf: () => process.env.NODE_ENV === 'development',
      }),
      inject: [ConfigService],
    }),

    // Event system for auth events
    EventEmitterModule,

    // Redis for session management and rate limiting
    RedisModule,

    // User and Tenant modules for profile access
    UsersModule,
    TenantsModule,
  ],

  controllers: [AuthController],

  providers: [
    // Core auth services
    AuthService,
    EnhancedJwtService,
    
    // Passport strategy
    JwtStrategy,
    
    // Guards
    JwtAuthGuard,

    // Redis service injection
    {
      provide: 'REDIS_SERVICE',
      useExisting: RedisService,
    },
  ],

  exports: [
    // Export auth services for use in other modules
    AuthService,
    EnhancedJwtService,
    JwtAuthGuard,
    PassportModule,
    JwtModule,
  ],
})
export class AuthModule {
  constructor(private configService: ConfigService) {
    const nodeEnv = this.configService.get('NODE_ENV');
    const jwtSecret = this.configService.get('JWT_SECRET');
    const developmentMode = nodeEnv === 'development';
    
    console.log('🔐 Auth Module initialized');
    console.log(`📦 Environment: ${nodeEnv}`);
    console.log(`🔑 JWT Secret: ${jwtSecret ? '✅ Configured' : '❌ Missing'}`);
    console.log(`🚧 Development Mode: ${developmentMode ? '✅ Enabled (Auth bypassed)' : '❌ Disabled'}`);
    
    if (developmentMode) {
      console.log('⚠️  [DEV] Authentication bypass is ENABLED for development');
      console.log('⚠️  [DEV] This should NEVER be enabled in production');
    }
  }
}