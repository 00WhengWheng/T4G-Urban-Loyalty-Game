import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  private users: User[] = [];

  create(createUserDto: CreateUserDto): User {
    const newUser: User = {
      id: (Date.now()).toString(),
      email: createUserDto.email,
      username: createUserDto.username,
      password_hash: createUserDto.password_hash,
      first_name: createUserDto.first_name,
      last_name: createUserDto.last_name,
      avatar_url: createUserDto.avatar_url,
      phone: createUserDto.phone,
      date_of_birth: createUserDto.date_of_birth,
      total_points: createUserDto.total_points || 0,
      level: createUserDto.level || 1,
      status: createUserDto.status || 'active',
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  findAll(): User[] {
    return this.users;
  }

  findOne(id: string): User | undefined {
    return this.users.find(user => user.id === id);
  }

  update(id: string, updateUserDto: UpdateUserDto): User | null {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updateUserDto,
      updated_at: new Date(),
    };
    return this.users[userIndex];
  }

  remove(id: string): User | null {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    return this.users.splice(userIndex, 1)[0];
  }
}
