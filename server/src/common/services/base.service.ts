import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis.module';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IPaginationOptions, IPaginatedResult } from '../interfaces/pagination.interface';
import { IServiceContext } from '../interfaces/service-context.interface';
import { IBaseService } from '../interfaces/base-service.interface';

@Injectable()
export abstract class BaseService<T, CreateDto, UpdateDto> implements IBaseService<T, CreateDto, UpdateDto> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly redis: RedisService,
    protected readonly eventEmitter: EventEmitter2,
  ) {}

  // Abstract methods that must be implemented by child services
  abstract getModelName(): string;
  abstract getIncludeOptions(): any;
  abstract validateCreate(data: CreateDto, context?: IServiceContext): Promise<void>;
  abstract validateUpdate(id: string, data: UpdateDto, context?: IServiceContext): Promise<void>;
  abstract transformToEntity(data: any): T;

  async create(data: CreateDto, context?: IServiceContext): Promise<T> {
    this.logger.log(`Creating ${this.getModelName()}`);
    
    await this.validateCreate(data, context);
    
    const result = await this.prisma[this.getModelName()].create({
      data: this.transformCreateData(data, context),
      include: this.getIncludeOptions(),
    });

    // Emit creation event
    this.eventEmitter.emit(`${this.getModelName()}.created`, {
      entity: result,
      context,
      timestamp: new Date(),
    });

    // Clear related caches
    await this.clearCache(`${this.getModelName()}:*`);

    return this.transformToEntity(result);
  }

  async findById(id: string, context?: IServiceContext): Promise<T> {
    const cacheKey = `${this.getModelName()}:${id}`;
    
    // Try cache first
    const cached = await this.redis.getJson<T>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      return cached;
    }

    const entity = await this.prisma[this.getModelName()].findUnique({
      where: { id },
      include: this.getIncludeOptions(),
    });

    if (!entity) {
      throw new NotFoundException(`${this.getModelName()} not found`);
    }

    const transformed = this.transformToEntity(entity);
    
    // Cache the result
    await this.redis.setJson(cacheKey, transformed, 300); // 5 minutes TTL
    
    return transformed;
  }

  async findAll(filters?: any, pagination?: IPaginationOptions, context?: IServiceContext): Promise<IPaginatedResult<T>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = pagination || {};
    
    const skip = (page - 1) * limit;
    const whereClause = this.buildWhereClause(filters, context);

    const [data, total] = await Promise.all([
      this.prisma[this.getModelName()].findMany({
        where: whereClause,
        include: this.getIncludeOptions(),
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder.toLowerCase() },
      }),
      this.prisma[this.getModelName()].count({ where: whereClause }),
    ]);

    const transformedData = data.map(item => this.transformToEntity(item));
    
    return {
      data: transformedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  async update(id: string, data: UpdateDto, context?: IServiceContext): Promise<T> {
    this.logger.log(`Updating ${this.getModelName()} ${id}`);
    
    await this.validateUpdate(id, data, context);
    
    const result = await this.prisma[this.getModelName()].update({
      where: { id },
      data: this.transformUpdateData(data, context),
      include: this.getIncludeOptions(),
    });

    // Emit update event
    this.eventEmitter.emit(`${this.getModelName()}.updated`, {
      entity: result,
      context,
      timestamp: new Date(),
    });

    // Clear caches
    await this.clearCache(`${this.getModelName()}:${id}`);
    await this.clearCache(`${this.getModelName()}:*`);

    return this.transformToEntity(result);
  }

  async delete(id: string, context?: IServiceContext): Promise<void> {
    this.logger.log(`Deleting ${this.getModelName()} ${id}`);
    
    const entity = await this.findById(id, context);
    
    await this.prisma[this.getModelName()].delete({
      where: { id },
    });

    // Emit deletion event
    this.eventEmitter.emit(`${this.getModelName()}.deleted`, {
      entity,
      context,
      timestamp: new Date(),
    });

    // Clear caches
    await this.clearCache(`${this.getModelName()}:${id}`);
    await this.clearCache(`${this.getModelName()}:*`);
  }

  // Helper methods
  protected transformCreateData(data: CreateDto, context?: IServiceContext): any {
    const transformed = { ...data } as any;
    
    if (context?.tenantId) {
      transformed.tenantId = context.tenantId;
    }
    
    if (context?.userId) {
      transformed.createdBy = context.userId;
    }
    
    return transformed;
  }

  protected transformUpdateData(data: UpdateDto, context?: IServiceContext): any {
    const transformed = { ...data } as any;
    
    if (context?.userId) {
      transformed.updatedBy = context.userId;
    }
    
    return transformed;
  }

  protected buildWhereClause(filters?: any, context?: IServiceContext): any {
    let where = { ...filters };
    
    // Apply tenant filtering if context provided
    if (context?.tenantId) {
      where.tenantId = context.tenantId;
    }
    
    return where;
  }

  protected async clearCache(pattern: string): Promise<void> {
    try {
      await this.redis.deletePattern(pattern);
    } catch (error) {
      this.logger.warn(`Failed to clear cache pattern ${pattern}:`, error);
    }
  }

  // Validation helpers
  protected validatePagination(pagination?: IPaginationOptions): void {
    if (!pagination) return;
    
    if (pagination.page < 1) {
      throw new Error('Page must be >= 1');
    }
    
    if (pagination.limit < 1 || pagination.limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
  }

  protected async checkPermissions(context: IServiceContext, requiredPermissions: string[]): Promise<void> {
    if (!context.permissions) {
      throw new Error('No permissions in context');
    }
    
    const hasPermission = requiredPermissions.every(permission => 
      context.permissions?.includes(permission)
    );
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }
  }
}