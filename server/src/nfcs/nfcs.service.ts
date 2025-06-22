import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis.module';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseService } from '../common/services/base.service';
import { ServiceConfig } from '../common/decorators/service.decorator';
import { CreateNfcScanDto } from './dto/create-nfc-scan.dto';
import { CreateNfcTagDto } from './dto/create-nfc-tag.dto';
import { UpdateNfcTagDto } from './dto/update-nfc-tag.dto';
import { NfcScan } from './nfc-scan.entity';
import { NfcTag} from './nfc-tag.entity';
import { IServiceContext } from '../common/interfaces/service-context.interface';
import { ScoringService } from '../scoring/scoring.service';
import { GeolocationService } from '../common/services/geolocation.service';

@Injectable()
@ServiceConfig({
  cacheable: true,
  cacheTTL: 300,
  requiresAuth: true,
  rateLimit: { ttl: 60000, limit: 10 }
})
export class NfcService extends BaseService<NfcTag, CreateNfcTagDto, UpdateNfcTagDto> {
  // Type assertion to help TypeScript understand the generated Prisma models
  private get db() {
    return this.prisma as any;
  }

  constructor(
    protected readonly prisma: PrismaService,
    redis: RedisService,
    eventEmitter: EventEmitter2,
    private readonly scoringService: ScoringService,
    private readonly geolocationService: GeolocationService,
  ) {
    super(prisma, redis, eventEmitter);
  }

  // BaseService implementation
  getModelName(): string {
    return 'nfcTag';
  }

  getIncludeOptions(): any {
    return {
      tenant: {
        select: {
          id: true,
          businessName: true,
          city: true,
          latitude: true,
          longitude: true,
        }
      },
      _count: {
        select: {
          nfcScans: true
        }
      }
    };
  }

  async validateCreate(data: CreateNfcTagDto, context?: IServiceContext): Promise<void> {
    // Check if tag identifier already exists
    const existingTag = await this.db.nfcTag.findUnique({
      where: { tagIdentifier: data.tag_identifier }
    });

    if (existingTag) {
      throw new BadRequestException('NFC tag with this identifier already exists');
    }

    // Validate coordinates
    if (data.latitude && data.longitude) {
      if (!this.geolocationService.isValidCoordinate(data.latitude, data.longitude)) {
        throw new BadRequestException('Invalid coordinates provided');
      }
    }

    // Check tenant permissions
    if (context?.tenantId && context.userType !== 'tenant') {
      throw new ForbiddenException('Only tenants can create NFC tags');
    }
  }

  async validateUpdate(id: string, data: UpdateNfcTagDto, context?: IServiceContext): Promise<void> {
    const tag = await this.findById(id);
    
    // Check ownership
    if (context?.tenantId && tag.tenant_id !== context.tenantId) {
      throw new ForbiddenException('Cannot update NFC tag that does not belong to you');
    }

    // Validate coordinates if provided
    if (data.latitude && data.longitude) {
      if (!this.geolocationService.isValidCoordinate(data.latitude, data.longitude)) {
        throw new BadRequestException('Invalid coordinates provided');
      }
    }
  }

  transformToEntity(data: any): NfcTag {
    return {
      id: data.id,
      tenant_id: data.tenantId,
      tag_identifier: data.tagIdentifier,
      tag_name: data.tagName || data.tagLocation,
      location_description: data.tagLocation,
      is_active: data.isActive,
      max_scans_per_user_per_day: data.maxDailyScans,
      points_per_scan: data.pointsPerScan,
      created_at: data.createdAt,
      tenant: data.tenant,
    } as NfcTag;
  }

  // NFC-specific methods
  async scanNfcTag(userId: string, scanDto: CreateNfcScanDto, context?: IServiceContext): Promise<ScanResult> {
    this.logger.log(`NFC scan attempt: ${scanDto.tag_identifier} by user ${userId}`);

    // Find NFC tag
    const nfcTag = await this.db.nfcTag.findUnique({
      where: { tagIdentifier: scanDto.tag_identifier },
      include: this.getIncludeOptions()
    });

    if (!nfcTag || !nfcTag.isActive) {
      throw new BadRequestException('NFC tag not found or inactive');
    }

    // Validate scan eligibility
    await this.validateScanEligibility(userId, nfcTag, scanDto);

    // Perform the scan in a transaction
    const scan = await this.performScan(userId, nfcTag, scanDto);

    // Emit events and update caches
    await this.postScanProcessing(scan, nfcTag, userId);

    return {
      success: true,
      points_awarded: nfcTag.pointsPerScan,
      nfc_tag: {
        id: nfcTag.id,
        tag_identifier: nfcTag.tagIdentifier,
        location: nfcTag.tagLocation,
        tenant: nfcTag.tenant,
      },
      scan_id: scan.id,
      message: `Successfully scanned! You earned ${nfcTag.pointsPerScan} points.`,
    };
  }

  private async validateScanEligibility(userId: string, nfcTag: any, scanDto: CreateNfcScanDto): Promise<void> {
    // Check location proximity
    if (scanDto.scan_location?.latitude && scanDto.scan_location?.longitude && 
        nfcTag.latitude && nfcTag.longitude) {
      const distance = this.geolocationService.calculateDistance(
        { latitude: Number(nfcTag.latitude), longitude: Number(nfcTag.longitude) },
        { latitude: scanDto.scan_location.latitude, longitude: scanDto.scan_location.longitude }
      );

      if (distance > nfcTag.scanRadius) {
        throw new BadRequestException(
          `You must be within ${nfcTag.scanRadius}m of the NFC tag to scan it. Current distance: ${Math.round(distance)}m`
        );
      }
    }

    // Check daily scan limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyScans = await this.db.nfcScan.count({
      where: {
        nfcTagId: nfcTag.id,
        userId,
        scanTime: { gte: today },
      },
    });

    if (dailyScans >= nfcTag.maxDailyScans) {
      throw new BadRequestException(`Maximum ${nfcTag.maxDailyScans} scans per day reached for this tag`);
    }

    // Check total scan limit
    const totalScans = await this.db.nfcScan.count({
      where: { nfcTagId: nfcTag.id, userId },
    });

    if (totalScans >= nfcTag.maxTotalScans) {
      throw new BadRequestException(`Maximum ${nfcTag.maxTotalScans} total scans reached for this tag`);
    }

    // Check rate limiting
    const rateLimitKey = `nfc_scan_rate:${userId}:${nfcTag.id}`;
    const lastScan = await this.redis.get(rateLimitKey);
    
    if (lastScan) {
      throw new BadRequestException('Please wait before scanning this tag again');
    }
  }

  private async performScan(userId: string, nfcTag: any, scanDto: CreateNfcScanDto): Promise<any> {
    return this.db.$transaction(async (tx: any) => {
      // Create scan record
      const scanRecord = await tx.nfcScan.create({
        data: {
          nfcTagId: nfcTag.id,
          userId,
          pointsEarned: nfcTag.pointsPerScan,
          scanLocation: scanDto.scan_location as any,
        },
        include: {
          nfcTag: { include: { tenant: true } },
          user: { select: { id: true, username: true, totalPoints: true } }
        }
      });

      // Award points to user
      await this.scoringService.awardPoints(userId, nfcTag.pointsPerScan, `NFC scan: ${nfcTag.tagIdentifier}`);

      return scanRecord;
    });
  }

  private async postScanProcessing(scan: any, nfcTag: any, userId: string): Promise<void> {
    // Set rate limit (5 seconds)
    const rateLimitKey = `nfc_scan_rate:${userId}:${nfcTag.id}`;
    await this.redis.set(rateLimitKey, Date.now().toString(), 5);

    // Emit events
    this.eventEmitter.emit('nfc.scanned', {
      scanId: scan.id,
      userId,
      tagId: nfcTag.id,
      tenantId: nfcTag.tenantId,
      pointsEarned: nfcTag.pointsPerScan,
    });

    // Update cached statistics
    await this.updateCachedStats(nfcTag.id, nfcTag.tenantId);
  }

  async getTenantNfcTags(tenantId: string, pagination?: any, context?: IServiceContext): Promise<any> {
    const serviceContext: IServiceContext = { ...context, tenantId };
    return this.findAll({ tenantId }, pagination, serviceContext);
  }

  async getNfcTagStats(tagId: string, tenantId: string): Promise<any> {
    const cacheKey = `nfc_stats:${tagId}`;
    const cached = await this.redis.getJson(cacheKey);
    
    if (cached) {
      return cached;
    }

    const tag = await this.db.nfcTag.findFirst({
      where: { id: tagId, tenantId }
    });

    if (!tag) {
      throw new BadRequestException('NFC tag not found');
    }

    const [totalScans, uniqueUsers, todayScans, totalPoints] = await Promise.all([
      this.db.nfcScan.count({ where: { nfcTagId: tagId } }),
      this.db.nfcScan.findMany({
        where: { nfcTagId: tagId },
        distinct: ['userId'],
        select: { userId: true }
      }),
      this.db.nfcScan.count({
        where: {
          nfcTagId: tagId,
          scanTime: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      }),
      this.db.nfcScan.aggregate({
        where: { nfcTagId: tagId },
        _sum: { pointsEarned: true }
      })
    ]);

    const stats = {
      tag,
      stats: {
        totalScans,
        uniqueUsers: uniqueUsers.length,
        todayScans,
        totalPointsAwarded: totalPoints._sum.pointsEarned || 0,
        averagePointsPerScan: totalScans > 0 ? (totalPoints._sum.pointsEarned || 0) / totalScans : 0,
      }
    };

    // Cache for 5 minutes
    await this.redis.setJson(cacheKey, stats, 300);
    return stats;
  }

  private async updateCachedStats(tagId: string, tenantId: string): Promise<void> {
    // Clear specific cache
    await this.redis.del(`nfc_stats:${tagId}`);
    
    // Update aggregated stats
    const totalScansKey = `tenant_nfc_scans:${tenantId}`;
    await this.redis.incr(totalScansKey);
    await this.redis.expire(totalScansKey, 86400); // 24 hours
  }

  async getUserScanHistory(userId: string, limit: number = 50): Promise<any[]> {
    return this.db.nfcScan.findMany({
      where: { userId },
      include: {
        nfcTag: {
          include: {
            tenant: {
              select: { id: true, businessName: true, city: true }
            }
          }
        }
      },
      orderBy: { scanTime: 'desc' },
      take: limit,
    });
  }

  async getPopularNfcTags(limit: number = 10): Promise<any[]> {
    const cacheKey = `popular_nfc_tags:${limit}`;
    const cached = await this.redis.getJson(cacheKey);
    
    if (cached && Array.isArray(cached)) {
      return cached;
    }

    const tags = await this.db.nfcTag.findMany({
      where: { isActive: true },
      include: {
        tenant: { select: { businessName: true, city: true } },
        _count: { select: { nfcScans: true } }
      },
      orderBy: { nfcScans: { _count: 'desc' } },
      take: limit,
    });

    await this.redis.setJson(cacheKey, tags, 600); // 10 minutes
    return tags;
  }

  // Bulk operations for performance
  async bulkUpdateTagStatus(tagIds: string[], tenantId: string, isActive: boolean): Promise<void> {
    await this.db.nfcTag.updateMany({
      where: {
        id: { in: tagIds },
        tenantId
      },
      data: { isActive }
    });

    // Clear caches
    for (const tagId of tagIds) {
      await this.redis.del(`nfc_tag:${tagId}`);
      await this.redis.del(`nfc_stats:${tagId}`);
    }
  }

  async getTenantDashboardStats(tenantId: string): Promise<any> {
    const cacheKey = `tenant_nfc_dashboard:${tenantId}`;
    const cached = await this.redis.getJson(cacheKey);
    
    if (cached) {
      return cached;
    }

    const [totalTags, activeTags, totalScans, last7DaysScans] = await Promise.all([
      this.db.nfcTag.count({ where: { tenantId } }),
      this.db.nfcTag.count({ where: { tenantId, isActive: true } }),
      this.db.nfcScan.count({ where: { nfcTag: { tenantId } } }),
      this.db.nfcScan.count({
        where: {
          nfcTag: { tenantId },
          scanTime: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      })
    ]);

    const dashboardStats = {
      totalTags,
      activeTags,
      inactiveTags: totalTags - activeTags,
      totalScans,
      last7DaysScans,
      averageScansPerDay: last7DaysScans / 7,
    };

    await this.redis.setJson(cacheKey, dashboardStats, 300); // 5 minutes
    return dashboardStats;
  }

  async getTenantNfcStats(tenantId: string): Promise<any> {
    // Alias for getTenantDashboardStats for controller compatibility
    return this.getTenantDashboardStats(tenantId);
  }
}

// Interfaces for type safety
export interface ScanResult {
  success: boolean;
  points_awarded: number;
  nfc_tag: {
    id: string;
    tag_identifier: string;
    location?: string;
    tenant: any;
  };
  scan_id: string;
  message: string;
}