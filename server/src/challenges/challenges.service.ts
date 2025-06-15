import { Injectable } from '@nestjs/common';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { Challenge } from './challenge.entity';

@Injectable()
export class ChallengesService {
  private challenges: Challenge[] = [];

  create(createChallengeDto: CreateChallengeDto): Challenge {
    const newChallenge: Challenge = {
      id: (Date.now()).toString(),
      ...createChallengeDto,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.challenges.push(newChallenge);
    return newChallenge;
  }

  findAll(): Challenge[] {
    return this.challenges;
  }

  findOne(id: string): Challenge | undefined {
    return this.challenges.find(challenge => challenge.id === id);
  }

  update(id: string, updateChallengeDto: UpdateChallengeDto): Challenge | null {
    const challengeIndex = this.challenges.findIndex(challenge => challenge.id === id);
    if (challengeIndex === -1) return null;
    this.challenges[challengeIndex] = {
      ...this.challenges[challengeIndex],
      ...updateChallengeDto,
      updated_at: new Date(),
    };
    return this.challenges[challengeIndex];
  }

  remove(id: string): Challenge | null {
    const challengeIndex = this.challenges.findIndex(challenge => challenge.id === id);
    if (challengeIndex === -1) return null;
    return this.challenges.splice(challengeIndex, 1)[0];
  }
}
