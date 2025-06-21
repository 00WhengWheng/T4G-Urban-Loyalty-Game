import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';

@Injectable()
export class ChallengesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // TENANT CHALLENGE MANAGEMENT
  async create(tenantId: string, createChallengeDto: CreateChallengeDto) {
    // Validazione date
    if (new Date(createChallengeDto.start_date) >= new Date(createChallengeDto.end_date)) {
      throw new BadRequestException('End date must be after start date');
    }

    return this.prisma.challenge.create({
      data: {
        tenantOwnerId: tenantId,
        title: createChallengeDto.title,
        description: createChallengeDto.description || '',
        challengeType: createChallengeDto.challenge_type,
        challengeCategory: createChallengeDto.challenge_category || '',
        localization: createChallengeDto.localization,
        startDate: new Date(createChallengeDto.start_date),
        endDate: new Date(createChallengeDto.end_date),
        maxParticipants: createChallengeDto.max_participants,
        entryFeePoints: createChallengeDto.entry_fee_points || 0,
        geofenceRadius: createChallengeDto.geofence_radius,
        rules: createChallengeDto.rules,
        status: createChallengeDto.status || 'draft',
      },
      include: {
        tenantOwner: {
          select: {
            businessName: true,
            city: true,
          }
        }
      }
    });
  }

  async findByTenant(tenantId: string) {
    return this.prisma.challenge.findMany({
      where: { tenantOwnerId: tenantId },
      include: {
        _count: {
          select: {
            challengeParticipants: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(challengeId: string, tenantId: string, status: string) {
    const challenge = await this.prisma.challenge.findFirst({
      where: { 
        id: challengeId, 
        tenantOwnerId: tenantId 
      },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    return this.prisma.challenge.update({
      where: { id: challengeId },
      data: { status }
    });
  }

  // USER CHALLENGE DISCOVERY & PARTICIPATION
  async findAll() {
    return this.prisma.challenge.findMany({
      where: { 
        status: 'active', 
        challengeType: 'open' 
      },
      include: {
        tenantOwner: {
          select: {
            businessName: true,
            city: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: {
        tenantOwner: {
          select: {
            businessName: true,
            city: true,
          }
        }
      },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    return challenge;
  }

  async joinChallenge(challengeId: string, userId: string) {
    const challenge = await this.findById(challengeId);

    // Validazioni
    if (challenge.status !== 'active') {
      throw new BadRequestException('Challenge is not active');
    }

    if (challenge.challengeType === 'close') {
      throw new ForbiddenException('This is a private challenge');
    }

    if (new Date() > new Date(challenge.endDate)) {
      throw new BadRequestException('Challenge has ended');
    }

    // Check se già partecipa
    const existingParticipant = await this.prisma.challengeParticipant.findFirst({
      where: { 
        challengeId: challengeId, 
        userId: userId 
      },
    });

    if (existingParticipant) {
      throw new BadRequestException('Already participating in this challenge');
    }

    // Check limite partecipanti
    if (challenge.maxParticipants) {
      const currentParticipants = await this.prisma.challengeParticipant.count({
        where: { challengeId: challengeId },
      });

      if (currentParticipants >= challenge.maxParticipants) {
        throw new BadRequestException('Challenge is full');
      }
    }

    // Crea partecipazione
    return this.prisma.challengeParticipant.create({
      data: {
        challengeId: challengeId,
        userId: userId,
      }
    });
  }

  async leaveChallenge(challengeId: string, userId: string) {
    const participant = await this.prisma.challengeParticipant.findFirst({
      where: { 
        challengeId: challengeId, 
        userId: userId 
      },
    });

    if (!participant) {
      throw new NotFoundException('Not participating in this challenge');
    }

    if (participant.completionStatus !== 'active') {
      throw new BadRequestException('Cannot leave completed/abandoned challenge');
    }

    return this.prisma.challengeParticipant.update({
      where: { id: participant.id },
      data: { completionStatus: 'abandoned' }
    });
  }

  // SCORING & LEADERBOARD
  async updateParticipantScore(challengeId: string, userId: string, pointsToAdd: number) {
    const participant = await this.prisma.challengeParticipant.findFirst({
      where: { 
        challengeId: challengeId, 
        userId: userId, 
        completionStatus: 'active' 
      },
    });

    if (!participant) {
      throw new NotFoundException('User not participating in active challenge');
    }

    return this.prisma.challengeParticipant.update({
      where: { id: participant.id },
      data: { 
        currentScore: {
          increment: pointsToAdd
        }
      }
    });
  }

  async getChallengeLeaderboard(challengeId: string, limit: number = 50) {
    return this.prisma.challengeParticipant.findMany({
      where: { 
        challengeId: challengeId,
        completionStatus: 'active'
      },
      select: {
        id: true,
        currentScore: true,
        completionStatus: true,
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { currentScore: 'desc' },
      take: limit
    });
  }

  async getUserChallenges(userId: string) {
    return this.prisma.challengeParticipant.findMany({
      where: { userId: userId },
      include: {
        challenge: {
          include: {
            tenantOwner: {
              select: {
                businessName: true,
                city: true,
              }
            }
          }
        }
      },
      orderBy: { joinedAt: 'desc' },
    });
  }

  // CHALLENGE COMPLETION
  async completeChallenge(challengeId: string, tenantId: string) {
    const challenge = await this.prisma.challenge.findFirst({
      where: { 
        id: challengeId, 
        tenantOwnerId: tenantId 
      },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    // Get all active participants ordered by score
    const participants = await this.prisma.challengeParticipant.findMany({
      where: { 
        challengeId: challengeId, 
        completionStatus: 'active' 
      },
      orderBy: { currentScore: 'desc' },
    });

    // Update participants with final ranking
    for (let i = 0; i < participants.length; i++) {
      await this.prisma.challengeParticipant.update({
        where: { id: participants[i].id },
        data: {
          finalRanking: i + 1,
          completionStatus: 'completed'
        }
      });
    }

    // Update challenge status
    return this.prisma.challenge.update({
      where: { id: challengeId },
      data: { status: 'completed' }
    });
  }
}