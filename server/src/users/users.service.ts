import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  private users: User[] = [];

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

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

  // Metodo per aggiornare i punti utente
  async updatePoints(userId: string, points: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      user.total_points = (user.total_points || 0) + points;
      return await this.userRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update user points');
    }
  }

  // Metodo per recuperare la leaderboard
  async getLeaderboard(limit: number = 10, timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'all-time') {
    const query = this.userRepository.createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.total_points'])
      .orderBy('user.total_points', 'DESC')
      .limit(limit);

    if (timeframe !== 'all-time') {
      const date = new Date();
      if (timeframe === 'daily') {
        date.setHours(0, 0, 0, 0);
      } else if (timeframe === 'weekly') {
        const day = date.getDay();
        date.setDate(date.getDate() - day);
        date.setHours(0, 0, 0, 0);
      } else if (timeframe === 'monthly') {
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
      }
      query.andWhere('user.updated_at >= :date', { date });
    }

    return query.getMany();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
