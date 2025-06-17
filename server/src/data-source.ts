import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { appConfig as loadAppConfig } from './config/app.config';

// Load environment variables
config();

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

const appConfig = loadAppConfig();

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: appConfig.database.url,
  ssl: appConfig.database.ssl,

  // Entities
  entities: [
    User,
    Tenant,
    Challenge,
    ChallengeParticipant,
    NfcTag,
    NfcScan,
    Token,
    TokenClaim,
    Game,
    GameAttempt,
    Share,
  ],

  // Migrations
  migrations: [
    join(__dirname, 'migrations', '*{.ts,.js}')
  ],
  migrationsTableName: 'typeorm_migrations',
  migrationsRun: false, // Run manually for safety

  // Development settings
  synchronize: appConfig.database.devOptions.synchronize,
  dropSchema: false,
  
  // Logging
  logging: appConfig.database.devOptions.logging ? ['query', 'error', 'warn', 'info', 'log'] : ['error'],
  logger: 'advanced-console',
  
  // Connection pool settings
  extra: appConfig.database.pool,
};

// Create and export the data source
export const AppDataSource = new DataSource(dataSourceOptions);

// Initialize connection
export const initializeDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('📊 Database connection established successfully');
      
      if (isDevelopment) {
        console.log(`🔗 Connected to: ${AppDataSource.options.type} database`);
        console.log(`📋 Entities loaded: ${AppDataSource.entityMetadatas.length}`);
        console.log(`🔄 Migrations: ${AppDataSource.migrations.length} available`);

        // Accept self-signed certificates in development
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        console.log('⚠️  [DEV] NODE_TLS_REJECT_UNAUTHORIZED set to 0 to accept self-signed certificates');

        // Explicitly set rejectUnauthorized: false in SSL configuration
        if (appConfig.database.ssl && typeof appConfig.database.ssl === 'object') {
          appConfig.database.ssl.rejectUnauthorized = false;
          console.log('⚠️  [DEV] SSL rejectUnauthorized set to false for self-signed certificates');
        }
      }

      // Log database configuration
      console.log('🔧 Database Configuration:', {
        url: appConfig.database.url,
        ssl: appConfig.database.ssl,
        pool: appConfig.database.pool,
      });
      console.log('🔧 SSL Configuration:', appConfig.database.ssl);
      console.log('🔧 NODE_TLS_REJECT_UNAUTHORIZED:', process.env.NODE_TLS_REJECT_UNAUTHORIZED);
    }
    return AppDataSource;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Graceful shutdown
export const closeDatabase = async () => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('📊 Database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};
