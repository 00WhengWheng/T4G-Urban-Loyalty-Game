import { Repository } from 'typeorm';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class BaseRepository<T extends Record<string, any>> {
  constructor(protected repository: Repository<T>) {}

  async findWithPagination(
    page: number,
    limit: number,
    filters?: any
  ): Promise<PaginatedResult<T>> {
    const [items, total] = await this.repository.findAndCount({
      where: filters,
      skip: (page - 1) * limit,
      take: limit,
      relations: this.getDefaultRelations(),
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  protected abstract getDefaultRelations(): string[];
}