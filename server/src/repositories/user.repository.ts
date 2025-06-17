import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(@InjectRepository(User) repository: Repository<User>) {
    super(repository);
  }

  protected getDefaultRelations(): string[] {
    return ['profile', 'roles']; // Esempio di relazioni predefinite
  }
}
