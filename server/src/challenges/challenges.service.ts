import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from './challenge.entity';
import { ChallengeParticipant } from './challenge-participant.entity';
import { CreateChallengeDto } from './dto/create-challenge.dto';

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge)
    private challengeRepository: Repository<Challenge>,
    @InjectRepository(ChallengeParticipant)
    private participantRepository: Repository<ChallengeParticipant>,
  ) {}

  // TENANT CHALLENGE MANAGEMENT
  async create(tenantId: string, createChallengeDto: CreateChallengeDto): Promise<Challenge> {
    // Validazione date
    if (new Date(createChallengeDto.start_date) >= new Date(createChallengeDto.end_date)) {
      throw new BadRequestException('End date must be after start date');
    }

    const challenge = this.challengeRepository.create({
      ...createChallengeDto,
      tenant_owner_id: tenantId,
    });
    return this.challengeRepository.save(challenge);
  }

  async findByTenant(tenantId: string): Promise<Challenge[]> {
    return this.challengeRepository.find({
      where: { tenant_owner_id: tenantId },
      order: { created_at: 'DESC' },
    });
  }

  async updateStatus(challengeId: string, tenantId: string, status: string): Promise<Challenge> {
    const challenge = await this.challengeRepository.findOne({
      where: { id: challengeId, tenant_owner_id: tenantId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    challenge.status = status;
    return this.challengeRepository.save(challenge);
  }

  // USER CHALLENGE DISCOVERY & PARTICIPATION
  async findAll(): Promise<Challenge[]> {
    return this.challengeRepository.find({
      where: { status: 'active', challenge_type: 'open' },
      relations: ['tenant_owner'],
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<Challenge> {
    const challenge = await this.challengeRepository.findOne({
      where: { id },
      relations: ['tenant_owner'],
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

    if (challenge.challenge_type === 'close') {
      throw new ForbiddenException('This is a private challenge');
    }

    if (new Date() > new Date(challenge.end_date)) {
      throw new BadRequestException('Challenge has ended');
    }

    // Check se già partecipa
    const existingParticipant = await this.participantRepository.findOne({
      where: { challenge_id: challengeId, user_id: userId },
    });

    if (existingParticipant) {
      throw new BadRequestException('Already participating in this challenge');
    }

    // Check limite partecipanti
    if (challenge.max_participants) {
      const currentParticipants = await this.participantRepository.count({
        where: { challenge_id: challengeId },
      });

      if (currentParticipants >= challenge.max_participants) {
        throw new BadRequestException('Challenge is full');
      }
    }

    // Crea partecipazione
    const participant = this.participantRepository.create({
      challenge_id: challengeId,
      user_id: userId,
    });

    return this.participantRepository.save(participant);
  }

  async leaveChallenge(challengeId: string, userId: string) {
    const participant = await this.participantRepository.findOne({
      where: { challenge_id: challengeId, user_id: userId },
    });

    if (!participant) {
      throw new NotFoundException('Not participating in this challenge');
    }

    if (participant.completion_status !== 'active') {
      throw new BadRequestException('Cannot leave completed/abandoned challenge');
    }

    participant.completion_status = 'abandoned';
    return this.participantRepository.save(participant);
  }

  // SCORING & LEADERBOARD
  async updateParticipantScore(challengeId: string, userId: string, pointsToAdd: number) {
    const participant = await this.participantRepository.findOne({
      where: { challenge_id: challengeId, user_id: userId, completion_status: 'active' },
    });

    if (!participant) {
      throw new NotFoundException('User not participating in active challenge');
    }

    participant.current_score += pointsToAdd;
    return this.participantRepository.save(participant);
  }

  async getChallengeLeaderboard(challengeId: string, limit: number = 50) {
    return this.participantRepository.find({
      where: { challenge_id: challengeId },
      relations: ['user'],
      order: { current_score: 'DESC' },
      take: limit,
    });
  }

  async getUserChallenges(userId: string) {
    return this.participantRepository.find({
      where: { user_id: userId },
      relations: ['challenge', 'challenge.tenant_owner'],
      order: { joined_at: 'DESC' },
    });
  }

  // CHALLENGE COMPLETION
  async completeChallenge(challengeId: string, tenantId: string) {
    const challenge = await this.challengeRepository.findOne({
      where: { id: challengeId, tenant_owner_id: tenantId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    // Calcola ranking finale
    const participants = await this.participantRepository.find({
      where: { challenge_id: challengeId, completion_status: 'active' },
      order: { current_score: 'DESC' },
    });

    // Assegna final_ranking
    for (let i = 0; i < participants.length; i++) {
      participants[i].final_ranking = i + 1;
      participants[i].completion_status = 'completed';
    }

    await this.participantRepository.save(participants);

    // Aggiorna status challenge
    challenge.status = 'completed';
    return this.challengeRepository.save(challenge);
  }
}