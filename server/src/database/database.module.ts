import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isDevelopment = configService.get<string>('NODE_ENV') === 'development';
        const sslConfig = isDevelopment
          ? { rejectUnauthorized: false } // Bypass in dev
          : { rejectUnauthorized: true }; // Secure in prod

        if (isDevelopment) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Accept self-signed certs
          console.log('⚠️  [DEV] NODE_TLS_REJECT_UNAUTHORIZED set to 0 to accept self-signed certificates');
        }

        return {
          type: 'postgres',
          url: configService.get<string>('DATABASE_URL'),
          ssl: sslConfig,
          synchronize: isDevelopment,
          logging: isDevelopment ? ['query', 'error'] : ['error'],
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule], // Export TypeOrmModule to make DataSource available
})
export class DatabaseModule {
  constructor() {
    console.log('📊 DatabaseModule initialized');
  }
}
