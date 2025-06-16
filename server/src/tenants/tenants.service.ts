import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Tenant } from './tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const tenant = this.tenantRepository.create(createTenantDto);
    return this.tenantRepository.save(tenant);
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async findByEmail(email: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({ where: { email: email.toLowerCase() } });
  }

  async findByCity(city: string): Promise<Tenant[]> {
    return this.tenantRepository.find({
      where: { city },
      order: { business_name: 'ASC' },
    });
  }

  async findByBusinessType(businessType: string): Promise<Tenant[]> {
    return this.tenantRepository.find({
      where: { business_type: businessType },
      order: { business_name: 'ASC' },
    });
  }

  async findActiveNearby(latitude: number, longitude: number, radiusKm: number = 10): Promise<Tenant[]> {
    // Using Haversine formula for distance calculation
    return this.tenantRepository
      .createQueryBuilder('tenant')
      .where('tenant.status = :status', { status: 'active' })
      .andWhere(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(tenant.latitude)) * cos(radians(tenant.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(tenant.latitude)))) <= :radius`,
        { lat: latitude, lng: longitude, radius: radiusKm }
      )
      .orderBy(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(tenant.latitude)) * cos(radians(tenant.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(tenant.latitude))))`,
        'ASC'
      )
      .setParameters({ lat: latitude, lng: longitude })
      .getMany();
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);
    
    // Validate coordinates if provided
    if (updateTenantDto.latitude !== undefined && updateTenantDto.longitude !== undefined) {
      if (!this.isValidCoordinate(updateTenantDto.latitude, updateTenantDto.longitude)) {
        throw new BadRequestException('Invalid coordinates provided');
      }
    }

    Object.assign(tenant, updateTenantDto);
    tenant.updated_at = new Date();
    
    return this.tenantRepository.save(tenant);
  }

  async updateStatus(id: string, status: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.status = status;
    tenant.updated_at = new Date();
    return this.tenantRepository.save(tenant);
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);
    await this.tenantRepository.remove(tenant);
  }

  async softDelete(id: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.status = 'inactive';
    tenant.updated_at = new Date();
    return this.tenantRepository.save(tenant);
  }

  async getStats(): Promise<any> {
    const total = await this.tenantRepository.count();
    const active = await this.tenantRepository.count({ where: { status: 'active' } });
    const pending = await this.tenantRepository.count({ where: { status: 'pending' } });
    const inactive = await this.tenantRepository.count({ where: { status: 'inactive' } });

    const businessTypes = await this.tenantRepository
      .createQueryBuilder('tenant')
      .select('tenant.business_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('tenant.status = :status', { status: 'active' })
      .groupBy('tenant.business_type')
      .getRawMany();

    const cities = await this.tenantRepository
      .createQueryBuilder('tenant')
      .select('tenant.city', 'city')
      .addSelect('COUNT(*)', 'count')
      .where('tenant.status = :status', { status: 'active' })
      .groupBy('tenant.city')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      total,
      active,
      pending,
      inactive,
      businessTypes,
      topCities: cities,
    };
  }

  async search(query: string, options?: { city?: string; businessType?: string; status?: string }): Promise<Tenant[]> {
    const queryBuilder = this.tenantRepository.createQueryBuilder('tenant');

    if (query) {
      queryBuilder.where(
        'LOWER(tenant.business_name) LIKE LOWER(:query) OR LOWER(tenant.description) LIKE LOWER(:query) OR LOWER(tenant.owner_name) LIKE LOWER(:query)',
        { query: `%${query}%` }
      );
    }

    if (options?.city) {
      queryBuilder.andWhere('LOWER(tenant.city) = LOWER(:city)', { city: options.city });
    }

    if (options?.businessType) {
      queryBuilder.andWhere('tenant.business_type = :businessType', { businessType: options.businessType });
    }

    if (options?.status) {
      queryBuilder.andWhere('tenant.status = :status', { status: options.status });
    } else {
      queryBuilder.andWhere('tenant.status = :status', { status: 'active' });
    }

    return queryBuilder
      .orderBy('tenant.business_name', 'ASC')
      .limit(50)
      .getMany();
  }

  async getBusinessTypes(): Promise<string[]> {
    const result = await this.tenantRepository
      .createQueryBuilder('tenant')
      .select('DISTINCT tenant.business_type', 'type')
      .where('tenant.business_type IS NOT NULL')
      .andWhere('tenant.status = :status', { status: 'active' })
      .getRawMany();

    return result.map(r => r.type).filter(Boolean);
  }

  async getCities(): Promise<string[]> {
    const result = await this.tenantRepository
      .createQueryBuilder('tenant')
      .select('DISTINCT tenant.city', 'city')
      .where('tenant.city IS NOT NULL')
      .andWhere('tenant.status = :status', { status: 'active' })
      .orderBy('tenant.city', 'ASC')
      .getRawMany();

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