import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from './game.entity';
import { GameAttempt } from './game-attempt.entity';
import { UsersService } from '../users/users.service';
import { CreateGameDto } from './dto/create-game.dto';
import { ScoringService } from '../scoring/scoring.service';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(GameAttempt)
    private gameAttemptRepository: Repository<GameAttempt>,
    private usersService: UsersService,
    private scoringService: ScoringService, // Aggiunto ScoringService
  ) {}

  // TENANT GAME MANAGEMENT
  async createGame(tenantId: string, createGameDto: CreateGameDto): Promise<Game> {
    const game = this.gameRepository.create({
      ...createGameDto,
      tenant_id: tenantId,
    });
    return this.gameRepository.save(game);
  }

  async getTenantGames(tenantId: string): Promise<Game[]> {
    return this.gameRepository.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });
  }

  async updateGame(gameId: string, tenantId: string, updateData: any): Promise<Game> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId, tenant_id: tenantId },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    Object.assign(game, updateData);
    return this.gameRepository.save(game);
  }

  async deactivateGame(gameId: string, tenantId: string): Promise<Game> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId, tenant_id: tenantId },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    game.is_active = false;
    return this.gameRepository.save(game);
  }

  // USER GAME DISCOVERY & PLAY
  async getAvailableGames(userId: string): Promise<Game[]> {
    return this.gameRepository.find({
      where: { is_active: true },
      relations: ['tenant'],
      order: { created_at: 'DESC' },
    });
  }

  async getGameById(gameId: string): Promise<Game> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId, is_active: true },
      relations: ['tenant'],
    });

    if (!game) {
      throw new NotFoundException('Game not found or inactive');
    }

    return game;
  }

  async playGame(userId: string, gameId: string, gameAnswers: any): Promise<any> {
    const game = await this.getGameById(gameId);
    const user = await this.usersService.findById(userId);

    // Verifica tentativi rimanenti
    const userAttempts = await this.gameAttemptRepository.count({
      where: { user_id: userId, game_id: gameId },
    });

    if (userAttempts >= game.max_attempts_per_user) {
      throw new BadRequestException('Maximum attempts reached for this game');
    }

    // Calcola punteggio basato sul tipo di gioco
    const result = this.calculateScore(game, gameAnswers);

    // Crea attempt record
    const attempt = this.gameAttemptRepository.create({
      user_id: userId,
      game_id: gameId,
      challenge_id: game.challenge_id,
      score: result.score,
      max_score: result.maxScore,
      completion_percentage: (result.score / result.maxScore) * 100,
      time_taken_seconds: gameAnswers.timeTaken || 0,
      attempt_data: gameAnswers,
      points_earned: result.pointsEarned,
    });

    const savedAttempt = await this.gameAttemptRepository.save(attempt);

    // Aggiorna punti utente tramite ScoringService
    if (result.pointsEarned > 0) {
      await this.scoringService.awardQuickGamePoints(userId, result.pointsEarned);
    }

    return {
      success: true,
      score: result.score,
      max_score: result.maxScore,
      completion_percentage: savedAttempt.completion_percentage,
      points_earned: result.pointsEarned,
      attempts_remaining: game.max_attempts_per_user - (userAttempts + 1),
      message: this.getResultMessage(result.score, result.maxScore),
    };
  }

  async getUserGameAttempts(userId: string, gameId?: string): Promise<GameAttempt[]> {
    const whereCondition: any = { user_id: userId };
    if (gameId) {
      whereCondition.game_id = gameId;
    }

    return this.gameAttemptRepository.find({
      where: whereCondition,
      relations: ['game', 'game.tenant'],
      order: { completed_at: 'DESC' },
    });
  }

  // LEADERBOARD & STATS
  async getGameLeaderboard(gameId: string, limit: number = 50): Promise<GameAttempt[]> {
    return this.gameAttemptRepository.find({
      where: { game_id: gameId },
      relations: ['user'],
      order: { score: 'DESC', completed_at: 'ASC' },
      take: limit,
    });
  }

  async getGameStats(gameId: string, tenantId: string) {
    const game = await this.gameRepository.findOne({
      where: { id: gameId, tenant_id: tenantId },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const totalAttempts = await this.gameAttemptRepository.count({
      where: { game_id: gameId },
    });

    const uniquePlayers = await this.gameAttemptRepository
      .createQueryBuilder('attempt')
      .select('COUNT(DISTINCT attempt.user_id)', 'count')
      .where('attempt.game_id = :gameId', { gameId })
      .getRawOne();

    const avgScore = await this.gameAttemptRepository
      .createQueryBuilder('attempt')
      .select('AVG(attempt.score)', 'avg')
      .where('attempt.game_id = :gameId', { gameId })
      .getRawOne();

    return {
      game_title: game.title,
      total_attempts: totalAttempts,
      unique_players: parseInt(uniquePlayers.count) || 0,
      average_score: parseFloat(avgScore.avg) || 0,
      game_type: game.game_type,
      difficulty_level: game.difficulty_level,
    };
  }

  // UTILITIES
  private calculateScore(game: Game, answers: any): { score: number; maxScore: number; pointsEarned: number } {
    switch (game.game_type) {
      case 'quiz':
        return this.calculateQuizScore(game, answers);
      case 'ability':
        return this.calculateAbilityScore(game, answers);
      case 'memory':
        return this.calculateMemoryScore(game, answers);
      default:
        return { score: 0, maxScore: 100, pointsEarned: 0 };
    }
  }

  private calculateQuizScore(game: Game, answers: any): { score: number; maxScore: number; pointsEarned: number } {
    const questions = game.game_data.questions || [];
    const userAnswers = answers.answers || [];
    
    let correctAnswers = 0;
    questions.forEach((question: any, index: number) => {
      if (userAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = correctAnswers;
    const maxScore = questions.length;
    const percentage = (score / maxScore) * 100;
    
    // Punti basati su percentuale di successo
    let pointsEarned = 0;
    if (percentage >= 80) pointsEarned = game.points_per_completion;
    else if (percentage >= 60) pointsEarned = Math.floor(game.points_per_completion * 0.7);
    else if (percentage >= 40) pointsEarned = Math.floor(game.points_per_completion * 0.5);

    return { score, maxScore, pointsEarned };
  }

  private calculateAbilityScore(game: Game, answers: any): { score: number; maxScore: number; pointsEarned: number } {
    // Logic per ability games (reaction time, precision, etc.)
    const score = answers.finalScore || 0;
    const maxScore = game.game_data.maxPossibleScore || 100;
    const pointsEarned = score >= (maxScore * 0.6) ? game.points_per_completion : 0;

    return { score, maxScore, pointsEarned };
  }

  private calculateMemoryScore(game: Game, answers: any): { score: number; maxScore: number; pointsEarned: number } {
    // Logic per memory games
    const score = answers.correctSequences || 0;
    const maxScore = game.game_data.totalSequences || 10;
    const pointsEarned = score >= (maxScore * 0.7) ? game.points_per_completion : 0;

    return { score, maxScore, pointsEarned };
  }

  private getResultMessage(score: number, maxScore: number): string {
    const percentage = (score / maxScore) * 100;
    
    if (percentage >= 90) return "Excellent! Perfect performance!";
    if (percentage >= 80) return "Great job! Well done!";
    if (percentage >= 60) return "Good effort! Keep improving!";
    if (percentage >= 40) return "Not bad! Try again for better results!";
    return "Keep practicing! You'll get better!";
  }
}