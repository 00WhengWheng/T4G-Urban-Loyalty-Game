import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Share } from './share.entity';
import { UsersService } from '../users/users.service';
import { CreateShareDto } from './dto/create-share.dto';
import { ScoringService } from '../scoring/scoring.service';

@Injectable()
export class SharesService {
  constructor(
    @InjectRepository(Share)
    private shareRepository: Repository<Share>,
    private usersService: UsersService,
    private scoringService: ScoringService, // Aggiunto ScoringService
  ) {}

  // USER SHARE CREATION
  async createShare(userId: string, createShareDto: CreateShareDto): Promise<any> {
    // Verifica rate limiting (max 3 share al giorno per piattaforma)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayShares = await this.shareRepository.count({
      where: {
        user_id: userId,
        platform: createShareDto.platform,
        shared_at: MoreThanOrEqual(today),
      },
    });

    if (todayShares >= 3) {
      throw new BadRequestException(`Maximum 3 shares per day on ${createShareDto.platform}`);
    }

    // Calcola punti basati su piattaforma e tipo
    const pointsEarned = this.calculateSharePoints(createShareDto.platform, createShareDto.share_type);

    // Crea share record
    const share = this.shareRepository.create({
      ...createShareDto,
      user_id: userId,
      points_earned: pointsEarned,
    });

    const savedShare = await this.shareRepository.save(share);

    // Aggiorna punti utente tramite ScoringService
    await this.scoringService.awardSocialSharePoints(userId, pointsEarned);

    return {
      success: true,
      share_id: savedShare.id,
      points_earned: pointsEarned,
      message: `You earned ${pointsEarned} points for sharing on ${createShareDto.platform}!`,
    };
  }

  async getUserShares(userId: string, limit: number = 50): Promise<Share[]> {
    return this.shareRepository.find({
      where: { user_id: userId },
      relations: ['challenge', 'tenant'],
      order: { shared_at: 'DESC' },
      take: limit,
    });
  }

  async getSharesByPlatform(platform: string, limit: number = 50): Promise<Share[]> {
    return this.shareRepository.find({
      where: { platform, verification_status: 'verified' },
      relations: ['user', 'challenge', 'tenant'],
      order: { shared_at: 'DESC' },
      take: limit,
    });
  }

  // TENANT SHARE ANALYTICS
  async getTenantShareStats(tenantId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.shareRepository
      .createQueryBuilder('share')
      .select([
        'share.platform',
        'COUNT(*) as total_shares',
        'COUNT(DISTINCT share.user_id) as unique_users',
        'SUM(share.points_earned) as total_points_awarded'
      ])
      .where('share.tenant_id = :tenantId', { tenantId })
      .andWhere('share.shared_at >= :startDate', { startDate })
      .andWhere('share.verification_status = :status', { status: 'verified' })
      .groupBy('share.platform')
      .orderBy('total_shares', 'DESC')
      .getRawMany();
  }

  async getChallengeShareStats(challengeId: string) {
    return this.shareRepository
      .createQueryBuilder('share')
      .select([
        'share.platform',
        'share.share_type',
        'COUNT(*) as count',
        'SUM(share.points_earned) as total_points'
      ])
      .where('share.challenge_id = :challengeId', { challengeId })
      .andWhere('share.verification_status = :status', { status: 'verified' })
      .groupBy('share.platform, share.share_type')
      .orderBy('count', 'DESC')
      .getRawMany();
  }

  // ADMIN VERIFICATION
  async updateShareVerification(shareId: string, status: string, reason?: string): Promise<Share> {
    const share = await this.shareRepository.findOne({
      where: { id: shareId },
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    const oldStatus = share.verification_status;
    share.verification_status = status;

    const updatedShare = await this.shareRepository.save(share);

    // Se share viene rifiutata, sottrai punti
    if (oldStatus === 'verified' && status === 'rejected') {
      await this.usersService.updatePoints(share.user_id, -share.points_earned);
    }

    // Se share viene approvata dopo essere stata pending, aggiungi punti
    if (oldStatus === 'pending' && status === 'verified') {
      await this.usersService.updatePoints(share.user_id, share.points_earned);
    }

    return updatedShare;
  }

  async getPendingShares(limit: number = 50): Promise<Share[]> {
    return this.shareRepository.find({
      where: { verification_status: 'pending' },
      relations: ['user', 'challenge', 'tenant'],
      order: { shared_at: 'ASC' },
      take: limit,
    });
  }

  // TRENDING & ANALYTICS
  async getTrendingShares(platform?: string, hours: number = 24): Promise<Share[]> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    const queryBuilder = this.shareRepository
      .createQueryBuilder('share')
      .leftJoinAndSelect('share.user', 'user')
      .leftJoinAndSelect('share.challenge', 'challenge')
      .leftJoinAndSelect('share.tenant', 'tenant')
      .where('share.shared_at >= :startDate', { startDate })
      .andWhere('share.verification_status = :status', { status: 'verified' });

    if (platform) {
      queryBuilder.andWhere('share.platform = :platform', { platform });
    }

    return queryBuilder
      .orderBy('share.shared_at', 'DESC')
      .take(50)
      .getMany();
  }

  async getShareLeaderboard(period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<any[]> {
    let startDate = new Date();
    
    switch (period) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    return this.shareRepository
      .createQueryBuilder('share')
      .leftJoin('share.user', 'user')
      .select([
        'user.id as user_id',
        'user.username as username',
        'COUNT(*) as total_shares',
        'SUM(share.points_earned) as total_points'
      ])
      .where('share.shared_at >= :startDate', { startDate })
      .andWhere('share.verification_status = :status', { status: 'verified' })
      .groupBy('user.id, user.username')
      .orderBy('total_shares', 'DESC')
      .addOrderBy('total_points', 'DESC')
      .take(50)
      .getRawMany();
  }

  // UTILITIES
  private calculateSharePoints(platform: string, shareType: string): number {
    const basePoints = {
      instagram: { story: 5, post: 10, tag: 3 },
      facebook: { story: 4, post: 8, tag: 2 },
      tiktok: { story: 6, post: 12, tag: 4 },
      whatsapp: { story: 3, post: 6, tag: 2 },
    };

    return basePoints[platform]?.[shareType] || 5;
  }

  async getDailyShareCount(userId: string, platform: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.shareRepository.count({
      where: {
        user_id: userId,
        platform,
        shared_at: MoreThanOrEqual(today),
      },
    });
  }
}