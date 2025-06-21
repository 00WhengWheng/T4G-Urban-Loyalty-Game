import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateShareDto } from './dto/create-share.dto';
import { ScoringService } from '../scoring/scoring.service';

@Injectable()
export class SharesService {
  constructor(
    private readonly prisma: PrismaService,
    private usersService: UsersService,
    private scoringService: ScoringService,
  ) {}

  // USER SHARE CREATION
  async createShare(userId: string, createShareDto: CreateShareDto): Promise<any> {
    // Verifica rate limiting (max 3 share al giorno per piattaforma)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayShares = await this.prisma.share.count({
      where: {
        userId,
        platform: createShareDto.platform,
        sharedAt: {
          gte: today,
        },
      },
    });

    if (todayShares >= 3) {
      throw new BadRequestException(`Maximum 3 shares per day on ${createShareDto.platform}`);
    }

    // Calcola punti basati su piattaforma e tipo
    const pointsEarned = this.calculateSharePoints(createShareDto.platform, createShareDto.share_type);

    // Crea share record
    const share = await this.prisma.share.create({
      data: {
        userId,
        shareType: createShareDto.share_type,
        platform: createShareDto.platform,
        contentData: createShareDto.content_data,
        pointsEarned,
      }
    });

    // Aggiorna punti utente tramite ScoringService
    await this.scoringService.awardSocialSharePoints(userId, pointsEarned);

    return {
      success: true,
      share_id: share.id,
      points_earned: pointsEarned,
      message: `You earned ${pointsEarned} points for sharing on ${createShareDto.platform}!`,
    };
  }

  async getUserShares(userId: string, limit: number = 50) {
    return this.prisma.share.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { sharedAt: 'desc' },
      take: limit,
    });
  }

  async getSharesByPlatform(platform: string, limit: number = 50) {
    return this.prisma.share.findMany({
      where: { platform },
      include: {
        user: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { sharedAt: 'desc' },
      take: limit,
    });
  }

  // TENANT SHARE ANALYTICS
  async getTenantShareStats(tenantId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.prisma.$queryRaw`
      SELECT 
        platform,
        COUNT(*) as total_shares,
        COUNT(DISTINCT user_id) as unique_users,
        SUM(points_earned) as total_points_awarded
      FROM shares 
      WHERE shared_at >= ${startDate}
      GROUP BY platform
      ORDER BY total_shares DESC
    `;
  }

  async getChallengeShareStats(challengeId: string) {
    return this.prisma.$queryRaw`
      SELECT 
        platform,
        COUNT(*) as shares_count,
        AVG(points_earned) as avg_points
      FROM shares 
      GROUP BY platform
      ORDER BY shares_count DESC
    `;
  }

  // UTILITIES
  private calculateSharePoints(platform: string, shareType: string): number {
    const platformMultipliers = {
      'instagram': 20,
      'facebook': 15,
      'twitter': 15,
      'tiktok': 25,
      'linkedin': 10,
      'whatsapp': 5,
    };

    const typeMultipliers = {
      'story': 1.0,
      'post': 1.5,
      'reel': 2.0,
      'live': 3.0,
    };

    const basePlatformPoints = platformMultipliers[platform] || 10;
    const typeMultiplier = typeMultipliers[shareType] || 1.0;

    return Math.round(basePlatformPoints * typeMultiplier);
  }

  async getShareStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalShares, uniqueUsersData, totalPointsData] = await Promise.all([
      this.prisma.share.count({
        where: {
          sharedAt: {
            gte: startDate,
          },
        },
      }),
      this.prisma.share.findMany({
        where: {
          sharedAt: {
            gte: startDate,
          },
        },
        distinct: ['userId'],
        select: { userId: true },
      }),
      this.prisma.share.aggregate({
        where: {
          sharedAt: {
            gte: startDate,
          },
        },
        _sum: {
          pointsEarned: true,
        },
      }),
    ]);

    const totalPoints = totalPointsData._sum.pointsEarned || 0;
    const uniqueUsers = uniqueUsersData.length;

    return {
      totalShares,
      uniqueUsers,
      totalPoints,
      averagePointsPerShare: totalShares > 0 ? totalPoints / totalShares : 0,
    };
  }

  async getPopularPlatforms(limit: number = 5) {
    return this.prisma.$queryRaw`
      SELECT 
        platform,
        COUNT(*) as share_count,
        AVG(points_earned) as avg_points
      FROM shares 
      WHERE shared_at >= (CURRENT_DATE - INTERVAL '30 days')
      GROUP BY platform 
      ORDER BY share_count DESC 
      LIMIT ${limit}
    `;
  }

  async getDailyShareCount(userId: string, platform: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.prisma.share.count({
      where: {
        userId,
        platform,
        sharedAt: {
          gte: today,
        },
      },
    });
  }
}