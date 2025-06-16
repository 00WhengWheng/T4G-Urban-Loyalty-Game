import { Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NfcScan } from '../nfcs/nfc-scan.entity';
import { NfcTag } from '../nfcs/nfc-tag.entity';
import { NFCDetection } from '../entities/nfc-detection.entity';
import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';
import { ScoringService } from '../scoring/scoring.service';

@Injectable()
export class NFCsService {
 private readonly logger = new Logger(NFCsService.name);

 constructor(
   @InjectRepository(NfcScan) private nfcRepository: Repository<NfcScan>,
   @InjectRepository(NfcTag) private nfcTagRepository: Repository<NfcTag>,
   @InjectRepository(NFCDetection) private nfcDetectionRepository: Repository<NFCDetection>,
   @InjectRepository(User) private userRepository: Repository<User>,
   @InjectRepository(Tenant) private tenantRepository: Repository<Tenant>,
   @Inject('REDIS_SERVICE') private redis: Redis,
   private scoringService: ScoringService,
   private eventEmitter: EventEmitter2,
 ) {}

 async createNFC(tenantId: string, createNFCDto: any): Promise<NFC> {
   const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
   if (!tenant) throw new NotFoundException('Tenant not found');

   const nfc = this.nfcRepository.create({
     ...createNFCDto,
     tenant,
     status: 'active',
   });

   return await this.nfcRepository.save(nfc);
 }

 async scanNFC(userId: string, scanData: any): Promise<any> {
   const { tag_id, latitude, longitude } = scanData;

   // Validazione coordinate
   if (!this.isValidCoordinate(latitude, longitude)) {
     throw new BadRequestException('Invalid coordinates');
   }

   // Rate limiting avanzato
   await this.advancedRateLimit(userId, tag_id, scanData.ip_address);

   // Trova NFC tag
   const nfcTag = await this.nfcTagRepository.findOne({
     where: { tag_id, status: 'active' },
     relations: ['nfc', 'nfc.tenant'],
   });

   if (!nfcTag || nfcTag.nfc.status !== 'active') {
     throw new NotFoundException('NFC not found or inactive');
   }

   // Controllo distanza
   const distance = this.calculateDistance(
     latitude, longitude,
     nfcTag.nfc.latitude, nfcTag.nfc.longitude
   );

   if (distance > nfcTag.nfc.detection_radius) {
     throw new ForbiddenException('Too far from NFC location');
   }

   // Controllo cooldown
   await this.checkCooldown(userId, tag_id);

   // Registra detection
   const detection = await this.createDetection(userId, nfcTag.nfc, scanData);

   // Assegna punti
   const points = nfcTag.nfc.points_awarded || 10;
   await this.scoringService.awardPoints(userId, points, 'nfc_scan');

   // Imposta cooldown
   await this.setCooldown(userId, tag_id);

   // Emetti evento
   this.eventEmitter.emit('nfc.scanned', {
     userId, nfcId: nfcTag.nfc.id, points
   });

   return {
     success: true,
     points_awarded: points,
     nfc: nfcTag.nfc,
     detection_id: detection.id,
   };
 }

 async getNFCsByTenant(tenantId: string, page: number = 1, limit: number = 20) {
   const [nfcs, total] = await this.nfcRepository.findAndCount({
     where: { tenant: { id: tenantId } },
     relations: ['tenant'],
     skip: (page - 1) * limit,
     take: limit,
     order: { created_at: 'DESC' },
   });

   return { nfcs, total, page, limit, totalPages: Math.ceil(total / limit) };
 }

 private async advancedRateLimit(userId: string, tagId: string, ip: string): Promise<void> {
   const userKey = `nfc:limit:user:${userId}`;
   const tagKey = `nfc:limit:tag:${tagId}`;
   const ipKey = `nfc:limit:ip:${ip}`;

   const [userCount, tagCount, ipCount] = await Promise.all([
     this.redis.get(userKey),
     this.redis.get(tagKey),
     this.redis.get(ipKey)
   ]);

   if (parseInt(userCount || '0') >= 50) throw new ForbiddenException('User daily limit');
   if (parseInt(tagCount || '0') >= 1000) throw new ForbiddenException('Tag overloaded');
   if (parseInt(ipCount || '0') >= 200) throw new ForbiddenException('IP rate limit');

   await Promise.all([
     this.redis.incr(userKey), this.redis.expire(userKey, 86400),
     this.redis.incr(tagKey), this.redis.expire(tagKey, 86400),
     this.redis.incr(ipKey), this.redis.expire(ipKey, 86400)
   ]);
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

 private async createDetection(userId: string, nfc: NFC, scanData: any): Promise<NFCDetection> {
   const user = await this.userRepository.findOne({ where: { id: userId } });
   if (!user) throw new NotFoundException('User not found');

   const detection = this.nfcDetectionRepository.create({
     nfc, user,
     latitude: scanData.latitude,
     longitude: scanData.longitude,
     distance: this.calculateDistance(
       scanData.latitude, scanData.longitude,
       nfc.latitude, nfc.longitude
     ),
     detected_at: new Date(),
     ip_address: scanData.ip_address,
     user_agent: scanData.user_agent,
   });

   return await this.nfcDetectionRepository.save(detection);
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