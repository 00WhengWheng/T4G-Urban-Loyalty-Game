import { Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NfcScan } from './nfc-scan.entity';
import { NfcTag } from './nfc-tag.entity';
import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';
import { ScoringService } from '../scoring/scoring.service';

import { CreateNfcTagDto } from './dto/create-nfc-tag.dto';
import { CreateNfcScanDto } from './dto/create-nfc-scan.dto';

export interface ScanResult {
  success: boolean;
  points_awarded: number;
  nfc_tag: NfcTag;
  scan_id: string;
}

interface PaginatedNFCTags {
  nfcTags: NfcTag[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class NfcService {
 private readonly logger = new Logger(NfcService.name);

 constructor(
   @InjectRepository(NfcScan) private nfcScanRepository: Repository<NfcScan>,
   @InjectRepository(NfcTag) private nfcTagRepository: Repository<NfcTag>,
   @InjectRepository(User) private userRepository: Repository<User>,
   @InjectRepository(Tenant) private tenantRepository: Repository<Tenant>,
   @Inject('default_IORedisModuleConnectionToken') private redis: Redis,
   private scoringService: ScoringService,
   private eventEmitter: EventEmitter2,
 ) {}

 async createNFCTag(tenantId: string, createNFCDto: CreateNfcTagDto): Promise<NfcTag> {
   const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
   if (!tenant) throw new NotFoundException('Tenant not found');

   const nfcTag = this.nfcTagRepository.create({
     ...createNFCDto,
     tenant,
     is_active: true,
   });

   return await this.nfcTagRepository.save(nfcTag);
 }

 async scanNFC(userId: string, scanData: CreateNfcScanDto): Promise<ScanResult> {
   const { tag_identifier, user_latitude, user_longitude } = scanData;

   // Validazione coordinate
   if (!this.isValidCoordinate(user_latitude, user_longitude)) {
     throw new BadRequestException('Invalid coordinates');
   }

   // Rate limiting avanzato
   await this.advancedRateLimit(userId, tag_identifier, scanData.ip_address);

   // Trova NFC tag
   const nfcTag = await this.nfcTagRepository.findOne({
     where: { tag_identifier, is_active: true },
     relations: ['tenant'],
   });

   if (!nfcTag) {
     throw new NotFoundException('NFC tag not found or inactive');
   }

   // Controllo cooldown
   await this.checkCooldown(userId, tag_identifier);

   // Registra scan
   const scan = await this.createScan(userId, nfcTag, scanData);

   // Assegna punti
   const points = nfcTag.points_per_scan || 10;
   await this.scoringService.awardNfcScanPoints(userId, points);

   // Imposta cooldown
   await this.setCooldown(userId, tag_identifier);

   // Emetti evento
   this.eventEmitter.emit('nfc.scanned', {
     userId, nfcTagId: nfcTag.id, points
   });

   return {
     success: true,
     points_awarded: points,
     nfc_tag: nfcTag,
     scan_id: scan.id,
   };
 }

 async getNFCTagsByTenant(tenantId: string, page: number = 1, limit: number = 20): Promise<PaginatedNFCTags> {
   const [nfcTags, total] = await this.nfcTagRepository.findAndCount({
     where: { tenant: { id: tenantId } },
     relations: ['tenant'],
     skip: (page - 1) * limit,
     take: limit,
     order: { created_at: 'DESC' },
   });

   return { nfcTags, total, page, limit, totalPages: Math.ceil(total / limit) };
 }

 // Methods expected by controller
 async scanNfcTag(userId: string, scanData: CreateNfcScanDto): Promise<ScanResult> {
   return this.scanNFC(userId, scanData);
 }

 async getUserScanHistory(userId: string, limit: number = 50) {
   const scans = await this.nfcScanRepository.find({
     where: { user: { id: userId } },
     relations: ['nfc_tag', 'tenant'],
     order: { scan_timestamp: 'DESC' },
     take: limit,
   });

   return { scans, total: scans.length };
 }

 async createNfcTag(tenantId: string, createTagDto: CreateNfcTagDto): Promise<NfcTag> {
   return this.createNFCTag(tenantId, createTagDto);
 }

 async getTenantTags(tenantId: string) {
   const tags = await this.nfcTagRepository.find({
     where: { tenant: { id: tenantId } },
     relations: ['tenant'],
     order: { created_at: 'DESC' },
   });

   return { tags };
 }

 async updateNfcTag(tagId: string, tenantId: string, updateData: Partial<CreateNfcTagDto>): Promise<NfcTag> {
   const tag = await this.nfcTagRepository.findOne({
     where: { id: tagId, tenant: { id: tenantId } },
     relations: ['tenant'],
   });

   if (!tag) {
     throw new NotFoundException('NFC tag not found');
   }

   Object.assign(tag, updateData);
   return await this.nfcTagRepository.save(tag);
 }

 async deleteNfcTag(tagId: string, tenantId: string): Promise<void> {
   const tag = await this.nfcTagRepository.findOne({
     where: { id: tagId, tenant: { id: tenantId } },
   });

   if (!tag) {
     throw new NotFoundException('NFC tag not found');
   }

   await this.nfcTagRepository.remove(tag);
 }

 async getTenantScanStats(tenantId: string, days: number = 30) {
   const startDate = new Date();
   startDate.setDate(startDate.getDate() - days);

   const scans = await this.nfcScanRepository
     .createQueryBuilder('scan')
     .innerJoin('scan.nfc_tag', 'tag')
     .where('tag.tenant_id = :tenantId', { tenantId })
     .andWhere('scan.scan_timestamp >= :startDate', { startDate })
     .getCount();

   const totalPoints = await this.nfcScanRepository
     .createQueryBuilder('scan')
     .innerJoin('scan.nfc_tag', 'tag')
     .where('tag.tenant_id = :tenantId', { tenantId })
     .andWhere('scan.scan_timestamp >= :startDate', { startDate })
     .select('SUM(scan.points_earned)', 'total')
     .getRawOne();

   return {
     total_scans: scans,
     total_points_awarded: parseInt(totalPoints.total) || 0,
     period_days: days,
   };
 }

 async getTagScanCount(tagId: string) {
   const count = await this.nfcScanRepository.count({
     where: { nfc_tag: { id: tagId } },
   });

   return { scan_count: count };
 }

 private async advancedRateLimit(userId: string, tagId: string, ip?: string): Promise<void> {
   const userKey = `nfc:limit:user:${userId}`;
   const tagKey = `nfc:limit:tag:${tagId}`;
   
   const promises = [
     this.redis.get(userKey),
     this.redis.get(tagKey)
   ];
   
   let ipKey: string | null = null;
   if (ip) {
     ipKey = `nfc:limit:ip:${ip}`;
     promises.push(this.redis.get(ipKey));
   }

   const results = await Promise.all(promises);
   const [userCount, tagCount, ipCount] = results;

   if (parseInt(userCount || '0') >= 50) throw new ForbiddenException('User daily limit');
   if (parseInt(tagCount || '0') >= 1000) throw new ForbiddenException('Tag overloaded');
   if (ip && parseInt(ipCount || '0') >= 200) throw new ForbiddenException('IP rate limit');

   const updatePromises = [
     this.redis.incr(userKey), this.redis.expire(userKey, 86400),
     this.redis.incr(tagKey), this.redis.expire(tagKey, 86400)
   ];
   
   if (ip && ipKey) {
     updatePromises.push(this.redis.incr(ipKey), this.redis.expire(ipKey, 86400));
   }
   
   await Promise.all(updatePromises);
 }

 private async checkCooldown(userId: string, tagId: string): Promise<void> {
   const cooldownKey = `nfc:cooldown:${userId}:${tagId}`;
   const cooldown = await this.redis.get(cooldownKey);

   if (cooldown) {
     const remaining = Math.ceil((parseInt(cooldown) - Date.now()) / 1000);
     throw new ForbiddenException(`Cooldown active. ${remaining}s remaining`);
   }
 }

 private async setCooldown(userId: string, tagId: string): Promise<void> {
   const cooldownKey = `nfc:cooldown:${userId}:${tagId}`;
   const duration = 300; // 5 minuti
   await this.redis.setex(cooldownKey, duration, (Date.now() + duration * 1000).toString());
 }

 private async createScan(userId: string, nfcTag: NfcTag, scanData: CreateNfcScanDto): Promise<NfcScan> {
   const user = await this.userRepository.findOne({ where: { id: userId } });
   if (!user) throw new NotFoundException('User not found');

   const scan = this.nfcScanRepository.create({
     user,
     nfc_tag: nfcTag,
     tenant: nfcTag.tenant,
     points_earned: nfcTag.points_per_scan,
     user_latitude: scanData.user_latitude,
     user_longitude: scanData.user_longitude,
     is_valid: true,
     ip_address: scanData.ip_address,
     device_info: scanData.device_info,
   });

   return await this.nfcScanRepository.save(scan);
 }

 private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
   const R = 6371000;
   const dLat = this.deg2rad(lat2 - lat1);
   const dLon = this.deg2rad(lon2 - lon1);
   const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
             Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
             Math.sin(dLon / 2) * Math.sin(dLon / 2);
   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
   return R * c;
 }

 private deg2rad(deg: number): number {
   return deg * (Math.PI / 180);
 }

 private isValidCoordinate(lat: number, lng: number): boolean {
   return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 &&
          !isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng);
 }
}