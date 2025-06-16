import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengesService } from './challenges.service';
import { ChallengesController } from './challenges.controller';
import { Challenge } from './challenge.entity';
import { ChallengeParticipant } from './challenge-participant.entity'; // ✅ IMPORT AGGIUNTO

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Challenge,
      ChallengeParticipant, // ✅ ENTITY AGGIUNTA
    ])
  ],
  controllers: [ChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}