import { Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { ScoringService } from '../scoring/scoring.service';
import { CreateNfcTagDto } from './dto/create-nfc-tag.dto';
import { CreateNfcScanDto } from './dto/create-nfc-scan.dto';

export interface ScanResult {
  success: boolean;
  points_awarded: number;
  nfc_tag: any;
  scan_id: string;
  message: string;
}

export interface PaginatedNFCTags {
  nfcTags: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class NfcService {
  private readonly logger = new Logger(NfcService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    @Inject('default_IORedisModuleConnectionToken') private redis: Redis,
    private scoringService: ScoringService,
    private eventEmitter: EventEmitter2,
  ) {}

  // TENANT NFC TAG MANAGEMENT
  async createNFCTag(tenantId: string, createNFCDto: CreateNfcTagDto) {
    // Validate tenant exists
    const tenant = await this.tenantsService.findById(tenantId);

    // Check if tag identifier already exists
    const existingTag = await this.prisma.nfcTag.findUnique({
      where: { tagIdentifier: createNFCDto.tag_identifier }
    });

    if (existingTag) {
      throw new BadRequestException('NFC tag with this identifier already exists');
    }

    // Validate coordinates if provided
    if (createNFCDto.latitude && createNFCDto.longitude) {
      if (!this.isValidCoordinate(createNFCDto.latitude, createNFCDto.longitude)) {
        throw new BadRequestException('Invalid coordinates provided');
      }
    }

    const nfcTag = await this.prisma.nfcTag.create({
      data: {
        tenantId,
        tagIdentifier: createNFCDto.tag_identifier,
        tagLocation: createNFCDto.tag_location,
        latitude: createNFCDto.latitude,
        longitude: createNFCDto.longitude,
        pointsPerScan: createNFCDto.points_per_scan,
        maxDailyScans: createNFCDto.max_daily_scans,
        maxTotalScans: createNFCDto.max_total_scans,
        scanRadius: createNFCDto.scan_radius,
        isActive: createNFCDto.is_active ?? true,
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

    this.logger.log(`NFC tag created: ${nfcTag.tagIdentifier} for tenant ${tenantId}`);

    // Emit event
    this.eventEmitter.emit('nfc.tag.created', {
      tagId: nfcTag.id,
      tenantId,
      tagIdentifier: nfcTag.tagIdentifier,
    });

    return nfcTag;
  }

  async getTenantNFCTags(tenantId: string, page: number = 1, limit: number = 20): Promise<PaginatedNFCTags> {
    const tenant = await this.tenantsService.findById(tenantId);

    const skip = (page - 1) * limit;

    const [nfcTags, total] = await Promise.all([
      this.prisma.nfcTag.findMany({
        where: { tenantId },
        include: {
          _count: {
            select: {
              nfcScans: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.nfcTag.count({
        where: { tenantId }
      })
    ]);

    return {
      nfcTags,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateNFCTag(tagId: string, tenantId: string, updateData: Partial<CreateNfcTagDto>) {
    // Verify tag belongs to tenant
    const tag = await this.prisma.nfcTag.findFirst({
      where: { id: tagId, tenantId }
    });

    if (!tag) {
      throw new NotFoundException('NFC tag not found');
    }

    // Validate coordinates if provided
    if (updateData.latitude && updateData.longitude) {
      if (!this.isValidCoordinate(updateData.latitude, updateData.longitude)) {
        throw new BadRequestException('Invalid coordinates provided');
      }
    }

    return this.prisma.nfcTag.update({
      where: { id: tagId },
      data: {
        tagLocation: updateData.tag_location,
        latitude: updateData.latitude,
        longitude: updateData.longitude,
        pointsPerScan: updateData.points_per_scan,
        maxDailyScans: updateData.max_daily_scans,
        maxTotalScans: updateData.max_total_scans,
        scanRadius: updateData.scan_radius,
        isActive: updateData.is_active,
      }
    });
  }

  async deleteNFCTag(tagId: string, tenantId: string) {
    // Verify tag belongs to tenant
    const tag = await this.prisma.nfcTag.findFirst({
      where: { id: tagId, tenantId }
    });

    if (!tag) {
      throw new NotFoundException('NFC tag not found');
    }

    // Check if tag has scans (optional: prevent deletion if it has scan history)
    const scanCount = await this.prisma.nfcScan.count({
      where: { nfcTagId: tagId }
    });

    if (scanCount > 0) {
      // Soft delete - just deactivate
      return this.prisma.nfcTag.update({
        where: { id: tagId },
        data: { isActive: false }
      });
    }

    // Hard delete if no scans
    return this.prisma.nfcTag.delete({
      where: { id: tagId }
    });
  }

  // USER NFC SCANNING
  async scanNFCTag(userId: string, scanDto: CreateNfcScanDto): Promise<ScanResult> {
    this.logger.log(`NFC scan attempt: ${scanDto.tag_identifier} by user ${userId}`);

    // Find NFC tag
    const nfcTag = await this.prisma.nfcTag.findUnique({
      where: { tagIdentifier: scanDto.tag_identifier },
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

    if (!nfcTag || !nfcTag.isActive) {
      throw new NotFoundException('NFC tag not found or inactive');
    }

    // Validate user
    const user = await this.usersService.findById(userId);

    // Check location proximity if coordinates are provided
    if (scanDto.scan_location?.latitude && scanDto.scan_location?.longitude && 
        nfcTag.latitude && nfcTag.longitude) {
      const distance = this.calculateDistance(
        Number(nfcTag.latitude),
        Number(nfcTag.longitude),
        scanDto.scan_location.latitude,
        scanDto.scan_location.longitude
      );

      if (distance > nfcTag.scanRadius) {
        throw new BadRequestException(`You must be within ${nfcTag.scanRadius}m of the NFC tag to scan it`);
      }
    }

    // Check daily scan limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyScans = await this.prisma.nfcScan.count({
      where: {
        nfcTagId: nfcTag.id,
        userId,
        scanTime: {
          gte: today,
        },
      },
    });

    if (dailyScans >= nfcTag.maxDailyScans) {
      throw new BadRequestException(`Maximum ${nfcTag.maxDailyScans} scans per day reached for this tag`);
    }

    // Check total scan limit
    const totalScans = await this.prisma.nfcScan.count({
      where: {
        nfcTagId: nfcTag.id,
        userId,
      },
    });

    if (totalScans >= nfcTag.maxTotalScans) {
      throw new BadRequestException(`Maximum ${nfcTag.maxTotalScans} total scans reached for this tag`);
    }

    // Check rate limiting (prevent rapid scanning)
    const rateLimitKey = `nfc_scan_rate:${userId}:${nfcTag.id}`;
    const lastScan = await this.redis.get(rateLimitKey);
    
    if (lastScan) {
      throw new BadRequestException('Please wait before scanning this tag again');
    }

    // Perform the scan in a transaction
    const scan = await this.prisma.$transaction(async (tx) => {
      // Create scan record
      const scanRecord = await tx.nfcScan.create({
        data: {
          nfcTagId: nfcTag.id,
          userId,
          pointsEarned: nfcTag.pointsPerScan,
          scanLocation: scanDto.scan_location as any,
        },
        include: {
          nfcTag: {
            include: {
              tenant: true
            }
          },
          user: {
            select: {
              id: true,
              username: true,
              totalPoints: true,
            }
          }
        }
      });

      // Award points to user
      await this.scoringService.awardPoints(userId, nfcTag.pointsPerScan, `NFC scan: ${nfcTag.tagIdentifier}`);

      return scanRecord;
    });

    // Set rate limit (5 seconds)
    await this.redis.setex(rateLimitKey, 5, Date.now().toString());

    // Emit events
    this.eventEmitter.emit('nfc.scanned', {
      scanId: scan.id,
      userId,
      tagId: nfcTag.id,
      tenantId: nfcTag.tenantId,
      pointsEarned: nfcTag.pointsPerScan,
    });

    this.logger.log(`NFC scan successful: ${scan.id}, ${nfcTag.pointsPerScan} points awarded`);

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

  async getUserScanHistory(userId: string, limit: number = 50) {
    return this.prisma.nfcScan.findMany({
      where: { userId },
      include: {
        nfcTag: {
          include: {
            tenant: {
              select: {
                id: true,
                businessName: true,
                city: true,
              }
            }
          }
        }
      },
      orderBy: { scanTime: 'desc' },
      take: limit,
    });
  }

  async getNFCTagStats(tagId: string, tenantId: string) {
    // Verify tag belongs to tenant
    const tag = await this.prisma.nfcTag.findFirst({
      where: { id: tagId, tenantId }
    });

    if (!tag) {
      throw new NotFoundException('NFC tag not found');
    }

    const [totalScans, uniqueUsers, todayScans, totalPoints] = await Promise.all([
      this.prisma.nfcScan.count({
        where: { nfcTagId: tagId }
      }),
      this.prisma.nfcScan.findMany({
        where: { nfcTagId: tagId },
        distinct: ['userId'],
        select: { userId: true }
      }),
      this.prisma.nfcScan.count({
        where: {
          nfcTagId: tagId,
          scanTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      this.prisma.nfcScan.aggregate({
        where: { nfcTagId: tagId },
        _sum: { pointsEarned: true }
      })
    ]);

    return {
      tag,
      stats: {
        totalScans,
        uniqueUsers: uniqueUsers.length,
        todayScans,
        totalPointsAwarded: totalPoints._sum.pointsEarned || 0,
        averagePointsPerScan: totalScans > 0 ? (totalPoints._sum.pointsEarned || 0) / totalScans : 0,
      }
    };
  }

  // UTILITY METHODS
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  private isValidCoordinate(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  async getTenantNFCStats(tenantId: string) {
    const tenant = await this.tenantsService.findById(tenantId);

    const [totalTags, activeTags, totalScans, totalPoints] = await Promise.all([
      this.prisma.nfcTag.count({
        where: { tenantId }
      }),
      this.prisma.nfcTag.count({
        where: { tenantId, isActive: true }
      }),
      this.prisma.nfcScan.count({
        where: {
          nfcTag: { tenantId }
        }
      }),
      this.prisma.nfcScan.aggregate({
        where: {
          nfcTag: { tenantId }
        },
        _sum: { pointsEarned: true }
      })
    ]);

    return {
      totalTags,
      activeTags,
      totalScans,
      totalPointsAwarded: totalPoints._sum.pointsEarned || 0,
    };
  }

  async getPopularNFCTags(limit: number = 10) {
    return this.prisma.nfcTag.findMany({
      include: {
        tenant: {
          select: {
            businessName: true,
            city: true,
          }
        },
        _count: {
          select: {
            nfcScans: true
          }
        }
      },
      orderBy: {
        nfcScans: {
          _count: 'desc'
        }
      },
      take: limit,
    });
  }
}