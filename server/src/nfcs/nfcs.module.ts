import { Module } from '@nestjs/common';
import { NfcController } from './nfcs.controller';
import { NfcService } from './nfcs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ScoringModule } from '../scoring/scoring.module';
import { RedisModule } from '../common/redis.module';
import { GeolocationService } from '../common/services/geolocation.service';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    TenantsModule,
    ScoringModule,
    RedisModule,
  ],
  controllers: [NfcController],
  providers: [NfcService, GeolocationService],
  exports: [NfcService],
})
export class NfcsModule {}