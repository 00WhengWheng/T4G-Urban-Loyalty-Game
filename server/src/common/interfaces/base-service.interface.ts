import { IPaginationOptions } from "./pagination.interface";
import { IPaginatedResult } from "./pagination.interface";
import { IServiceContext } from "./service-context.interface";

export interface IBaseService<T, CreateDto, UpdateDto> {
  create(data: CreateDto, context?: IServiceContext): Promise<T>;
  findById(id: string, context?: IServiceContext): Promise<T>;
  findAll(filters?: any, pagination?: IPaginationOptions, context?: IServiceContext): Promise<IPaginatedResult<T>>;
  update(id: string, data: UpdateDto, context?: IServiceContext): Promise<T>;
  delete(id: string, context?: IServiceContext): Promise<void>;
}