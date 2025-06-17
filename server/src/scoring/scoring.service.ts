import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { IScoringService } from '../interfaces/scoring.interface';

@Injectable()
export class ScoringService implements IScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(private readonly usersService: UsersService) {}

  // Assegna punti per Quick Game
  async awardQuickGamePoints(userId: string, points: number) {
    this.logger.log(`Assegnazione di ${points} punti per Quick Game all'utente ${userId}`);
    return this.usersService.updatePoints(userId, points);
  }

  // Assegna punti per Social Share
  async awardSocialSharePoints(userId: string, points: number) {
    this.logger.log(`Assegnazione di ${points} punti per Social Share all'utente ${userId}`);
    return this.usersService.updatePoints(userId, points);
  }

  // Assegna punti per Winner Challenges
  async awardWinnerChallengePoints(userId: string, points: number) {
    this.logger.log(`Assegnazione di ${points} punti per Winner Challenges all'utente ${userId}`);
    return this.usersService.updatePoints(userId, points);
  }

  // Assegna punti per NFC Scan
  async awardNfcScanPoints(userId: string, points: number) {
    this.logger.log(`Assegnazione di ${points} punti per NFC Scan all'utente ${userId}`);
    return this.usersService.updatePoints(userId, points);
  }

  // Recupera la leaderboard
  async getLeaderboard(limit: number = 10, timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'all-time') {
    this.logger.log(`Recupero della leaderboard con limite ${limit} e intervallo ${timeframe}`);
    return this.usersService.getLeaderboard(limit, timeframe);
  }

  // Implementazione di awardPoints
  async awardPoints(userId: string, points: number, reason?: string) {
    this.logger.log(`Assegnazione di ${points} punti all'utente ${userId} per ${reason ?? 'nessuna ragione specificata'}`);
    return this.usersService.updatePoints(userId, points);
  }

  // Implementazione di calculateLevel
  calculateLevel(points: number): number {
    // Esempio semplice: 100 punti per livello
    return Math.floor(points / 100) + 1;
  }
}
