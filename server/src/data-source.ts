import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config();

// Entities
import { User } from './users/entities/user.entity/user.entity';
import { Tenant } from './tenants/entities/tenant.entity/tenant.entity';
import { Challenge } from './challenges/entities/challenge.entity/challenge.entity';
import { ChallengeParticipant } from './challenges/entities/challenge.entity/challenge-participant.entity';
import { NfcTag } from './nfcs/entities/nfc.entity/nfc-tag.entity';
import { NfcScan } from './nfcs/entities/nfc.entity/nfc-scan.entity';
import { Token } from './tokens/entities/token.entity/token.entity';
import { TokenClaim } from './tokens/entities/token.entity/token-claim.entity';
import { Game } from './games/entities/game.entity/game.entity';
import { GameAttempt } from './games/entities/game.entity/game-attempt.entity';
import { Share } from './shares/entities/share.entity/share.entity';

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  
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
  synchronize: false, // Always false for safety
  dropSchema: false,
  
  // Logging
  logging: isDevelopment ? ['query', 'error', 'warn', 'info', 'log'] : ['error'],
  logger: 'advanced-console',
  
  // SSL Configuration
  ssl: isProduction ? {
    rejectUnauthorized: false,
    ca: process.env.DATABASE_CA_CERT,
  } : false,

  // Connection pool settings
  extra: {
    max: isProduction ? 20 : 10, // Max connections in pool
    min: 2, // Min connections in pool
    acquireTimeoutMillis: 30000, // 30 seconds
    idleTimeoutMillis: 30000, // 30 seconds
    connectionTimeoutMillis: 10000, // 10 seconds
    
    // Production optimizations
    ...(isProduction && {
      statement_timeout: 60000, // 1 minute
      query_timeout: 60000,
      connectionTimeoutMillis: 5000,
    }),
  },

  // Cache settings
  cache: {
    duration: isDevelopment ? 30000 : 300000, // 30s dev, 5min prod
    type: 'redis',
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
    },
  },
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
      }
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

// Export default for CLI tools
export default AppDataSource;