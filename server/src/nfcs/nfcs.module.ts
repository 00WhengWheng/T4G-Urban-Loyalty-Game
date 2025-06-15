import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NfcController } from './nfcs.controller';
import { NfcService } from './nfcs.service';
import { NfcTag } from './nfc-tag.entity';
import { NfcScan } from './nfc-scan.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NfcTag, NfcScan]),
    UsersModule,
  ],
  controllers: [NfcController],
  providers: [NfcService],
  exports: [NfcService],
})
export class NfcsModule {}