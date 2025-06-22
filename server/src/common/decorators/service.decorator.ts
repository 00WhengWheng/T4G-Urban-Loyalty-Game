import { SetMetadata } from '@nestjs/common';

export const SERVICE_METADATA = 'service_metadata';

export interface ServiceMetadata {
  cacheable?: boolean;
  cacheTTL?: number;
  requiresAuth?: boolean;
  permissions?: string[];
  rateLimit?: {
    ttl: number;
    limit: number;
  };
}

export const ServiceConfig = (metadata: ServiceMetadata) => 
  SetMetadata(SERVICE_METADATA, metadata);