import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ScoringService } from './scoring.service';

@Module({
  imports: [UsersModule],
  providers: [ScoringService],
  exports: [ScoringService],
})
export class ScoringModule {}
