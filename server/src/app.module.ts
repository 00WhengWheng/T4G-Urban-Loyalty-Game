import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import * as redisStore from 'cache-manager-redis-store';

// Controllers
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Core Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { ChallengesModule } from './challenges/challenges.module';
import { GamesModule } from './games/games.module';
import { NfcsModule } from './nfcs/nfcs.module';
import { TokensModule } from './tokens/tokens.module';
import { SharesModule } from './shares/shares.module';
import { ScoringModule } from './scoring/scoring.module';
import { DatabaseModule } from './database/database.module';

// Entities
import { User } from './users/user.entity';
import { Tenant } from './tenants/tenant.entity';
import { Challenge } from './challenges/challenge.entity';
import { ChallengeParticipant } from './challenges/challenge-participant.entity';
import { NfcTag } from './nfcs/nfc-tag.entity';
import { NfcScan } from './nfcs/nfc-scan.entity';
import { Token } from './tokens/token.entity';
import { TokenClaim } from './tokens/token-claim.entity';
import { Game } from './games/game.entity';
import { GameAttempt } from './games/game-attempt.entity';
import { Share } from './shares/share.entity';

// Configuration validation schema
import * as Joi from 'joi';

const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  DATABASE_URL: Joi.string().required(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),
});

@Module({
  imports: [
    // Configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),

    // Redis Cache Configuration - FIX
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        store: redisStore as any,
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        password: configService.get('REDIS_PASSWORD'),
        db: configService.get('REDIS_DB', 0),
        ttl: 300,
        max: 1000,
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),

    // Rate Limiting - FIX
    ThrottlerModule.forRootAsync({
    imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: configService.get<number>('THROTTLE_TTL', 60000), // milliseconds
            limit: configService.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
      inject: [ConfigService],
    }),

    // Event System
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Background Jobs
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 1), // Different DB for jobs
        },
      }),
      inject: [ConfigService],
    }),

    // Task Scheduling
    ScheduleModule.forRoot(),

    // Application Modules
    AuthModule,
    UsersModule,
    TenantsModule,
    ChallengesModule,
    GamesModule,
    NfcsModule,
    TokensModule,
    SharesModule,
    ScoringModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private configService: ConfigService) {
    // Log important configuration on startup
    const nodeEnv = this.configService.get('NODE_ENV');
    const port = this.configService.get('PORT');
    
    console.log(`🔧 App Module initialized in ${nodeEnv} mode on port ${port}`);
  }
}