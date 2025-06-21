import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateGameDto } from './dto/create-game.dto';
import { ScoringService } from '../scoring/scoring.service';

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private usersService: UsersService,
    private scoringService: ScoringService,
  ) {}

  // TENANT GAME MANAGEMENT
  async createGame(tenantId: string, createGameDto: CreateGameDto) {
    return this.prisma.game.create({
      data: {
        tenantId,
        gameName: createGameDto.title,
        gameDescription: createGameDto.description,
        gameType: createGameDto.game_type,
        difficultyLevel: createGameDto.difficulty_level || 1,
        pointsPerCompletion: createGameDto.points_per_completion || 10,
        maxAttemptsPerUser: createGameDto.max_attempts_per_user || 3,
        timeLimitSeconds: createGameDto.time_limit_seconds,
        gameData: createGameDto.game_data,
        isActive: createGameDto.is_active ?? true,
      },
      include: {
        tenant: {
          select: {
            id: true,
            businessName: true,
            city: true,
          }
        }
      }
    });
  }

  async getTenantGames(tenantId: string) {
    return this.prisma.game.findMany({
      where: { tenantId },
      include: {
        tenant: {
          select: {
            businessName: true,
            city: true,
          }
        },
        _count: {
          select: {
            gameAttempts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateGame(gameId: string, tenantId: string, updateData: any) {
    // Verify game belongs to tenant
    const game = await this.prisma.game.findFirst({
      where: {
        id: gameId,
        tenantId
      }
    });

    if (!game) {
      throw new NotFoundException('Game not found or access denied');
    }

    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        gameName: updateData.title,
        gameDescription: updateData.description,
        difficultyLevel: updateData.difficulty_level,
        pointsPerCompletion: updateData.points_per_completion,
        maxAttemptsPerUser: updateData.max_attempts_per_user,
        timeLimitSeconds: updateData.time_limit_seconds,
        gameData: updateData.game_data,
        isActive: updateData.is_active,
      }
    });
  }

  async deleteGame(gameId: string, tenantId: string) {
    const game = await this.prisma.game.findFirst({
      where: {
        id: gameId,
        tenantId
      }
    });

    if (!game) {
      throw new NotFoundException('Game not found or access denied');
    }

    return this.prisma.game.delete({
      where: { id: gameId }
    });
  }

  async getGameStats(gameId: string, tenantId: string) {
    const game = await this.prisma.game.findFirst({
      where: {
        id: gameId,
        tenantId
      }
    });

    if (!game) {
      throw new NotFoundException('Game not found or access denied');
    }

    const [totalAttempts, completedAttempts, averageScore] = await Promise.all([
      this.prisma.gameAttempt.count({
        where: { gameId }
      }),
      this.prisma.gameAttempt.count({
        where: { gameId, completed: true }
      }),
      this.prisma.gameAttempt.aggregate({
        where: { gameId, completed: true },
        _avg: { score: true }
      })
    ]);

    const topScores = await this.prisma.gameAttempt.findMany({
      where: { gameId, completed: true },
      include: {
        user: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { score: 'desc' },
      take: 10
    });

    return {
      game,
      stats: {
        totalAttempts,
        completedAttempts,
        averageScore: averageScore._avg.score || 0,
        completionRate: totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0,
      },
      topScores
    };
  }

  // USER GAME INTERACTION
  async getUserGames(userId?: string) {
    const where: any = { isActive: true };
    
    return this.prisma.game.findMany({
      where,
      include: {
        tenant: {
          select: {
            businessName: true,
            city: true,
            logoUrl: true,
          }
        },
        gameAttempts: userId ? {
          where: { userId },
          select: {
            id: true,
            score: true,
            completed: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        } : false
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getGameById(gameId: string, userId?: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: {
        tenant: {
          select: {
            businessName: true,
            city: true,
            logoUrl: true,
          }
        }
      }
    });

    if (!game || !game.isActive) {
      throw new NotFoundException('Game not found');
    }

    let userAttempts: any[] = [];
    if (userId) {
      userAttempts = await this.prisma.gameAttempt.findMany({
        where: {
          gameId,
          userId
        },
        orderBy: { createdAt: 'desc' },
        take: game.maxAttemptsPerUser
      });
    }

    return {
      ...game,
      userAttempts
    };
  }

  async startGameAttempt(gameId: string, userId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!game || !game.isActive) {
      throw new NotFoundException('Game not found or inactive');
    }

    // Check if user has exceeded max attempts
    const attemptCount = await this.prisma.gameAttempt.count({
      where: {
        gameId,
        userId
      }
    });

    if (attemptCount >= game.maxAttemptsPerUser) {
      throw new BadRequestException('Maximum attempts exceeded');
    }

    // Create new attempt
    const attempt = await this.prisma.gameAttempt.create({
      data: {
        gameId,
        userId,
        score: 0,
        pointsEarned: 0,
        completed: false,
      }
    });

    return {
      attemptId: attempt.id,
      game,
      timeLimit: game.timeLimitSeconds
    };
  }

  async submitGameResult(attemptId: string, userId: string, gameData: any) {
    const attempt = await this.prisma.gameAttempt.findUnique({
      where: { id: attemptId },
      include: { game: true }
    });

    if (!attempt || attempt.userId !== userId) {
      throw new NotFoundException('Game attempt not found');
    }

    if (attempt.completed) {
      throw new BadRequestException('Game attempt already completed');
    }

    // Calculate score based on game type
    const { score, completed } = this.calculateGameScore(attempt.game, gameData);
    
    // Calculate points earned
    let pointsEarned = 0;
    if (completed) {
      pointsEarned = attempt.game.pointsPerCompletion;
      
      // Award points to user
      await this.scoringService.awardQuickGamePoints(userId, pointsEarned);
    }

    // Update attempt
    const updatedAttempt = await this.prisma.gameAttempt.update({
      where: { id: attemptId },
      data: {
        score,
        completed,
        pointsEarned,
        attemptData: gameData,
      },
      include: {
        game: {
          include: {
            tenant: {
              select: {
                businessName: true,
              }
            }
          }
        }
      }
    });

    return {
      attempt: updatedAttempt,
      pointsEarned,
      message: completed ? 'Game completed successfully!' : 'Game attempt recorded'
    };
  }

  async getUserGameHistory(userId: string, limit: number = 20) {
    return this.prisma.gameAttempt.findMany({
      where: { userId },
      include: {
        game: {
          include: {
            tenant: {
              select: {
                businessName: true,
                city: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  async getGameLeaderboard(gameId: string, limit: number = 10) {
    const topAttempts = await this.prisma.gameAttempt.findMany({
      where: {
        gameId,
        completed: true
      },
      include: {
        user: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          }
        }
      },
      orderBy: { score: 'desc' },
      take: limit
    });

    return topAttempts.map((attempt, index) => ({
      rank: index + 1,
      ...attempt
    }));
  }

  private calculateGameScore(game: any, gameData: any): { score: number; completed: boolean } {
    switch (game.gameType) {
      case 'quiz':
        return this.calculateQuizScore(game, gameData);
      case 'memory':
        return this.calculateMemoryScore(game, gameData);
      case 'reaction':
        return this.calculateReactionScore(game, gameData);
      default:
        return { score: 0, completed: false };
    }
  }

  private calculateQuizScore(game: any, gameData: any): { score: number; completed: boolean } {
    const { answers } = gameData;
    const questions = game.gameData?.questions || [];
    
    if (!answers || answers.length !== questions.length) {
      return { score: 0, completed: false };
    }

    let correctAnswers = 0;
    answers.forEach((answer: number, index: number) => {
      if (answer === questions[index]?.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / questions.length) * 100);
    const completed = score >= 60; // 60% threshold

    return { score, completed };
  }

  private calculateMemoryScore(game: any, gameData: any): { score: number; completed: boolean } {
    const { sequence, userSequence, timeSpent } = gameData;
    
    if (!sequence || !userSequence) {
      return { score: 0, completed: false };
    }

    const correctMatches = sequence.filter((item: any, index: number) => 
      userSequence[index] === item
    ).length;

    const accuracy = (correctMatches / sequence.length) * 100;
    const timeBonus = Math.max(0, 100 - (timeSpent / 1000)); // Time bonus
    const score = Math.round(accuracy + (timeBonus * 0.1));
    const completed = correctMatches === sequence.length;

    return { score: Math.min(100, score), completed };
  }

  private calculateReactionScore(game: any, gameData: any): { score: number; completed: boolean } {
    const { reactionTimes, attempts } = gameData;
    
    if (!reactionTimes || reactionTimes.length === 0) {
      return { score: 0, completed: false };
    }

    const averageTime = reactionTimes.reduce((sum: number, time: number) => sum + time, 0) / reactionTimes.length;
    const validAttempts = reactionTimes.filter((time: number) => time < 1000 && time > 100); // Valid reaction times
    
    // Score based on average reaction time (lower is better)
    const score = Math.max(0, Math.round(100 - (averageTime / 10)));
    const completed = validAttempts.length >= 5; // At least 5 valid attempts

    return { score: Math.min(100, score), completed };
  }
}