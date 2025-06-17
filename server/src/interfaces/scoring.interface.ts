import { User } from '../users/user.entity';

export interface IScoringService {
  awardPoints(userId: string, points: number, source: string): Promise<User>;
  calculateLevel(points: number): number;
}