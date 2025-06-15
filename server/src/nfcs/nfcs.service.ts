import { Injectable, BadRequestException, ForbiddenException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { NfcTag } from './nfc-tag.entity';
import { NfcScan } from './nfc-scan.entity';
import { UsersService } from '../users/users.service';
import { CreateNfcScanDto } from './dto/create-nfc-scan.dto';
import { CreateNfcTagDto } from './dto/create-nfc-tag.dto';

@Injectable()
export class NfcService {
  constructor(
    @InjectRepository(NfcTag)
    private nfcTagRepository: Repository<NfcTag>,
    @InjectRepository(NfcScan)
    private nfcScanRepository: Repository<NfcScan>,
    private usersService: UsersService,
    @InjectRedis() private readonly redis: Redis,
  ) { }

  // NFC SCAN LOGIC
  async scanNfcTag(userId: string, createScanDto: CreateNfcScanDto) {
    // 1. Trova il tag NFC
    const nfcTag = await this.nfcTagRepository.findOne({
      where: { tag_identifier: createScanDto.tag_identifier },
      relations: ['tenant'],
    });

    if (!nfcTag || !nfcTag.is_active) {
      throw new NotFoundException('NFC Tag not found or inactive');
    }

    // 2. Rate Limiting con Redis
    const rateLimitKey = `nfc:scan:${userId}:${nfcTag.id}`;
    const scanCount = await this.redis.get(rateLimitKey);

    if (scanCount && parseInt(scanCount) >= nfcTag.max_scans_per_user_per_day) {
      throw new ForbiddenException('Daily scan limit exceeded for this tag');
    }

    // 3. Validazione Geolocation (raggio 100m dal tenant)
    const distance = this.calculateDistance(
      createScanDto.user_latitude,
      createScanDto.user_longitude,
      nfcTag.tenant.latitude,
      nfcTag.tenant.longitude
    );

    if (distance > 0.1) { // 100 metri
      throw new BadRequestException('You are too far from the location to scan this tag');
    }

    // 4. Cooldown check (5 minuti tra scan dello stesso tag)
    const cooldownKey = `nfc:cooldown:${userId}:${nfcTag.id}`;
    const lastScan = await this.redis.get(cooldownKey);

    if (lastScan) {
      throw new ForbiddenException('Please wait before scanning this tag again');
    }

    // 5. Crea scan record
    const nfcScan = this.nfcScanRepository.create({
      user_id: userId,
      nfc_tag_id: nfcTag.id,
      tenant_id: nfcTag.tenant_id,
      points_earned: nfcTag.points_per_scan,
      user_latitude: createScanDto.user_latitude,
      user_longitude: createScanDto.user_longitude,
      device_info: createScanDto.device_info,
      ip_address: createScanDto.ip_address,
    });

    const savedScan = await this.nfcScanRepository.save(nfcScan);

    // 6. Aggiorna punti utente
    const updatedUser = await this.usersService.updatePoints(userId, nfcTag.points_per_scan);
    if (!updatedUser) {
      throw new InternalServerErrorException('Failed to update user points');
    }

    // 7. Aggiorna Redis counters
    await this.redis.incr(rateLimitKey);
    await this.redis.expire(rateLimitKey, 86400); // 24 ore
    await this.redis.set(cooldownKey, Date.now(), 'EX', 300); // 5 minuti

    // 8. Log per analytics
    await this.logScanAnalytics(savedScan, nfcTag, distance);

    return {
      success: true,
      points_earned: nfcTag.points_per_scan,
      scan_id: savedScan.id,
      message: `You earned ${nfcTag.points_per_scan} points!`,
    };
  }

  // TENANT NFC TAG MANAGEMENT
  async createNfcTag(tenantId: string, createTagDto: CreateNfcTagDto) {
    const nfcTag = this.nfcTagRepository.create({
      ...createTagDto,
      tenant_id: tenantId,
    });
    return this.nfcTagRepository.save(nfcTag);
  }

  async getTenantTags(tenantId: string) {
    return this.nfcTagRepository.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });
  }

  async updateNfcTag(tagId: string, tenantId: string, updateData: any) {
    const tag = await this.nfcTagRepository.findOne({
      where: { id: tagId, tenant_id: tenantId },
    });

    if (!tag) {
      throw new NotFoundException('NFC Tag not found');
    }

    Object.assign(tag, updateData);
    return this.nfcTagRepository.save(tag);
  }

  async deleteNfcTag(tagId: string, tenantId: string) {
    const tag = await this.nfcTagRepository.findOne({
      where: { id: tagId, tenant_id: tenantId },
    });

    if (!tag) {
      throw new NotFoundException('NFC Tag not found');
    }

    return this.nfcTagRepository.remove(tag);
  }

  // ANALYTICS & REPORTING
  async getTenantScanStats(tenantId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.nfcScanRepository
      .createQueryBuilder('scan')
      .select([
        'DATE(scan.scan_timestamp) as date',
        'COUNT(*) as total_scans',
        'COUNT(DISTINCT scan.user_id) as unique_users',
        'SUM(scan.points_earned) as total_points_awarded'
      ])
      .where('scan.tenant_id = :tenantId', { tenantId })
      .andWhere('scan.scan_timestamp >= :startDate', { startDate })
      .andWhere('scan.is_valid = true')
      .groupBy('DATE(scan.scan_timestamp)')
      .orderBy('date', 'DESC')
      .getRawMany();
  }

  async getUserScanHistory(userId: string, limit: number = 50) {
    return this.nfcScanRepository.find({
      where: { user_id: userId, is_valid: true },
      relations: ['nfc_tag', 'tenant'],
      order: { scan_timestamp: 'DESC' },
      take: limit,
    });
  }

  async getTagScanCount(tagId: string) {
    return this.nfcScanRepository.count({
      where: { nfc_tag_id: tagId, is_valid: true },
    });
  }

  async getDailyScansByUser(userId: string, tagId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.nfcScanRepository.count({
      where: {
        user_id: userId,
        nfc_tag_id: tagId,
        scan_timestamp: MoreThanOrEqual(today),
        is_valid: true,
      },
    });
  }

  // ADMIN FUNCTIONS
  async invalidateScan(scanId: string, reason: string) {
    const scan = await this.nfcScanRepository.findOne({
      where: { id: scanId },
    });

    if (!scan) {
      throw new NotFoundException('Scan not found');
    }

    scan.is_valid = false;
    await this.nfcScanRepository.save(scan);

    // Sottrai punti all'utente
    await this.usersService.updatePoints(scan.user_id, -scan.points_earned);

    return { success: true, message: `Scan invalidated: ${reason}` };
  }

  // UTILITIES
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private async logScanAnalytics(scan: NfcScan, tag: NfcTag, distance: number) {
    console.log('Analytics Log:', {
      scan_id: scan.id,
      tag_id: tag.id,
      distance,
      points_earned: scan.points_earned,
    });
    // Additional analytics logic can be added here
  }
}