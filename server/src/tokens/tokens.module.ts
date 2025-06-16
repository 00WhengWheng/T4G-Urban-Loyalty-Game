import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokensService } from './tokens.service';
import { TokensController } from './tokens.controller';
import { Token } from './token.entity';
import { TokenClaim } from './token-claim.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Token, TokenClaim])],
  controllers: [TokensController],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
