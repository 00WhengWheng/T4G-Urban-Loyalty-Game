import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NfcController } from './nfcs.controller';
import { NfcService } from './nfcs.service';
import { NfcTag } from './nfc-tag.entity';
import { NfcScan } from './nfc-scan.entity';
import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';
import { UsersModule } from '../users/users.module';
import { ScoringModule } from '../scoring/scoring.module';
import { RedisModule } from '../common/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NfcTag, NfcScan, User, Tenant]),
    UsersModule,
    ScoringModule,
    RedisModule,
  ],
  controllers: [NfcController],
  providers: [NfcService],
  exports: [NfcService],
})
export class NfcsModule {}