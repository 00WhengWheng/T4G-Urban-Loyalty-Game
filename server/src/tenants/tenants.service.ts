import { Injectable } from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Tenant } from './tenant.entity';

@Injectable()
export class TenantsService {
  private tenants: Tenant[] = [];

  create(createTenantDto: CreateTenantDto): Tenant {
    const newTenant: Tenant = {
      id: (Date.now()).toString(),
      business_name: createTenantDto.business_name,
      owner_name: createTenantDto.owner_name,
      email: createTenantDto.email,
      password_hash: createTenantDto.password_hash,
      phone: createTenantDto.phone,
      address: createTenantDto.address,
      city: createTenantDto.city,
      postal_code: createTenantDto.postal_code,
      latitude: createTenantDto.latitude,
      longitude: createTenantDto.longitude,
      business_type: createTenantDto.business_type,
      logo_url: createTenantDto.logo_url,
      description: createTenantDto.description,
      website: createTenantDto.website,
      instagram: createTenantDto.instagram,
      facebook: createTenantDto.facebook,
      status: createTenantDto.status || 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.tenants.push(newTenant);
    return newTenant;
  }

  findAll(): Tenant[] {
    return this.tenants;
  }

  findOne(id: string): Tenant | undefined {
    return this.tenants.find(tenant => tenant.id === id);
  }

  update(id: string, updateTenantDto: UpdateTenantDto): Tenant | null {
    const tenantIndex = this.tenants.findIndex(tenant => tenant.id === id);
    if (tenantIndex === -1) return null;
    this.tenants[tenantIndex] = {
      ...this.tenants[tenantIndex],
      ...updateTenantDto,
      updated_at: new Date(),
    };
    return this.tenants[tenantIndex];
  }

  remove(id: string): Tenant | null {
    const tenantIndex = this.tenants.findIndex(tenant => tenant.id === id);
    if (tenantIndex === -1) return null;
    return this.tenants.splice(tenantIndex, 1)[0];
  }
}
