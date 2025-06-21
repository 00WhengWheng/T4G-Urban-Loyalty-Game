import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(createTenantDto: CreateTenantDto) {
    return this.prisma.tenant.create({
      data: {
        businessName: createTenantDto.business_name,
        ownerName: createTenantDto.owner_name,
        email: createTenantDto.email.toLowerCase(),
        passwordHash: createTenantDto.password_hash || '',
        phone: createTenantDto.phone,
        address: createTenantDto.address,
        city: createTenantDto.city,
        postalCode: createTenantDto.postal_code,
        latitude: createTenantDto.latitude,
        longitude: createTenantDto.longitude,
        businessType: createTenantDto.business_type,
        logoUrl: createTenantDto.logo_url,
        description: createTenantDto.description,
        website: createTenantDto.website,
        instagram: createTenantDto.instagram,
        facebook: createTenantDto.facebook,
        status: createTenantDto.status || 'pending',
      }
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ 
      where: { id } 
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ 
      where: { id } 
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async findByEmail(email: string) {
    return this.prisma.tenant.findUnique({ 
      where: { email: email.toLowerCase() } 
    });
  }

  async findByCity(city: string) {
    return this.prisma.tenant.findMany({
      where: { city },
      orderBy: { businessName: 'asc' },
    });
  }

  async findByBusinessType(businessType: string) {
    return this.prisma.tenant.findMany({
      where: { businessType },
      orderBy: { businessName: 'asc' },
    });
  }

  async findActiveNearby(latitude: number, longitude: number, radiusKm: number = 10) {
    // Using raw query for Haversine formula distance calculation
    return this.prisma.$queryRaw`
      SELECT * FROM tenants 
      WHERE status = 'active'
      AND (6371 * acos(cos(radians(${latitude})) * cos(radians(latitude::float)) * cos(radians(longitude::float) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(latitude::float)))) <= ${radiusKm}
      ORDER BY (6371 * acos(cos(radians(${latitude})) * cos(radians(latitude::float)) * cos(radians(longitude::float) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(latitude::float))))
    `;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    const tenant = await this.findOne(id);
    
    // Validate coordinates if provided
    if (updateTenantDto.latitude !== undefined && updateTenantDto.longitude !== undefined) {
      if (!this.isValidCoordinate(updateTenantDto.latitude, updateTenantDto.longitude)) {
        throw new BadRequestException('Invalid coordinates provided');
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: {
        businessName: updateTenantDto.business_name,
        ownerName: updateTenantDto.owner_name,
        email: updateTenantDto.email?.toLowerCase(),
        phone: updateTenantDto.phone,
        address: updateTenantDto.address,
        city: updateTenantDto.city,
        postalCode: updateTenantDto.postal_code,
        latitude: updateTenantDto.latitude,
        longitude: updateTenantDto.longitude,
        businessType: updateTenantDto.business_type,
        logoUrl: updateTenantDto.logo_url,
        description: updateTenantDto.description,
        website: updateTenantDto.website,
        instagram: updateTenantDto.instagram,
        facebook: updateTenantDto.facebook,
        status: updateTenantDto.status,
      }
    });
  }

  async updateStatus(id: string, status: string) {
    const tenant = await this.findOne(id);
    return this.prisma.tenant.update({
      where: { id },
      data: { status }
    });
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);
    await this.prisma.tenant.delete({
      where: { id }
    });
  }

  async softDelete(id: string) {
    const tenant = await this.findOne(id);
    return this.prisma.tenant.update({
      where: { id },
      data: { status: 'inactive' }
    });
  }

  async getStats(): Promise<any> {
    const [total, active, pending, inactive] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: 'active' } }),
      this.prisma.tenant.count({ where: { status: 'pending' } }),
      this.prisma.tenant.count({ where: { status: 'inactive' } }),
    ]);

    const businessTypes = await this.prisma.$queryRaw`
      SELECT business_type as type, COUNT(*) as count 
      FROM tenants 
      WHERE status = 'active' 
      GROUP BY business_type
    `;

    const cities = await this.prisma.$queryRaw`
      SELECT city, COUNT(*) as count 
      FROM tenants 
      WHERE status = 'active' 
      GROUP BY city 
      ORDER BY count DESC 
      LIMIT 10
    `;

    return {
      total,
      active,
      pending,
      inactive,
      businessTypes,
      topCities: cities,
    };
  }

  async search(query: string, options?: { city?: string; businessType?: string; status?: string }) {
    const whereConditions: any = {};

    if (query) {
      whereConditions.OR = [
        { businessName: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { ownerName: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (options?.city) {
      whereConditions.city = options.city;
    }

    if (options?.businessType) {
      whereConditions.businessType = options.businessType;
    }

    if (options?.status) {
      whereConditions.status = options.status;
    }

    return this.prisma.tenant.findMany({
      where: whereConditions,
      orderBy: { businessName: 'asc' },
      take: 50,
    });
  }

  async getBusinessTypes(): Promise<string[]> {
    const result = await this.prisma.$queryRaw<Array<{type: string}>>`
      SELECT DISTINCT business_type as type 
      FROM tenants 
      WHERE business_type IS NOT NULL 
      AND status = 'active'
    `;

    return result.map(r => r.type).filter(Boolean);
  }

  async getCities(): Promise<string[]> {
    const result = await this.prisma.$queryRaw<Array<{city: string}>>`
      SELECT DISTINCT city 
      FROM tenants 
      WHERE city IS NOT NULL 
      AND status = 'active' 
      ORDER BY city ASC
    `;

    return result.map(r => r.city).filter(Boolean);
  }

  async validateBusinessData(data: Partial<CreateTenantDto>): Promise<boolean> {
    // Validate required fields
    if (!data.business_name || !data.email) {
      throw new BadRequestException('Business name and email are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new BadRequestException('Invalid email format');
    }

    // Validate coordinates
    if (data.latitude !== undefined && data.longitude !== undefined) {
      if (!this.isValidCoordinate(data.latitude, data.longitude)) {
        throw new BadRequestException('Invalid coordinates provided');
      }
    }

    // Check for duplicate email
    if (data.email) {
      const existingTenant = await this.findByEmail(data.email);
      if (existingTenant) {
        throw new BadRequestException('Email already exists');
      }
    }

    return true;
  }

  private isValidCoordinate(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }
}