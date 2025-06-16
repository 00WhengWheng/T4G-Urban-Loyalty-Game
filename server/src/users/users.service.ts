import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'email', 'username', 'first_name', 'last_name', 'total_points', 'level', 'status', 'created_at'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ 
      where: { id },
      select: ['id', 'email', 'username', 'first_name', 'last_name', 'avatar_url', 'phone', 'date_of_birth', 'total_points', 'level', 'status', 'created_at', 'updated_at']
    });
    return user === null ? undefined : user;
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email: email.toLowerCase() } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    const user = await this.findOne(id);
    if (!user) return null;
    
    Object.assign(user, updateUserDto);
    user.updated_at = new Date();
    
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<User | null> {
    const user = await this.findOne(id);
    if (!user) return null;
    
    return this.userRepository.remove(user);
  }

  async updatePoints(userId: string, points: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      user.total_points = (user.total_points || 0) + points;
      
      // Update level based on points
      const newLevel = this.calculateLevel(user.total_points);
      if (newLevel > user.level) {
        user.level = newLevel;
      }
      
      user.updated_at = new Date();
      return await this.userRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update user points');
    }
  }

  async getLeaderboard(limit: number = 10, timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'all-time'): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.first_name', 'user.last_name', 'user.avatar_url', 'user.total_points', 'user.level'])
      .where('user.status = :status', { status: 'active' })
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
      queryBuilder.andWhere('user.updated_at >= :date', { date });
    }

    return queryBuilder.getMany();
  }

  async getUserRanking(userId: string): Promise<{ rank: number; total: number }> {
    const user = await this.findById(userId);
    
    const higherRankedCount = await this.userRepository.count({
      where: {
        total_points: MoreThan(user.total_points),
        status: 'active'
      }
    });

    const totalUsers = await this.userRepository.count({
      where: { status: 'active' }
    });

    return {
      rank: higherRankedCount + 1,
      total: totalUsers
    };
  }

  async updateStatus(id: string, status: string): Promise<User> {
    const user = await this.findById(id);
    user.status = status;
    user.updated_at = new Date();
    return this.userRepository.save(user);
  }

  async updateProfile(id: string, profileData: Partial<UpdateUserDto>): Promise<User> {
    const user = await this.findById(id);
    
    // Only update allowed profile fields
    const allowedFields = ['first_name', 'last_name', 'avatar_url', 'phone', 'date_of_birth'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (profileData[field] !== undefined) {
        updateData[field] = profileData[field];
      }
    });

    Object.assign(user, updateData);
    user.updated_at = new Date();
    
    return this.userRepository.save(user);
  }

  async getUserStats(userId: string): Promise<any> {
    const user = await this.findById(userId);
    const ranking = await this.getUserRanking(userId);
    
    // Calculate points needed for next level
    const nextLevelPoints = this.getPointsForLevel(user.level + 1);
    const pointsToNextLevel = nextLevelPoints - user.total_points;

    return {
      currentPoints: user.total_points,
      currentLevel: user.level,
      pointsToNextLevel: Math.max(0, pointsToNextLevel),
      ranking: ranking.rank,
      totalUsers: ranking.total,
      percentile: Math.round(((ranking.total - ranking.rank + 1) / ranking.total) * 100)
    };
  }

  async search(query: string, options?: { status?: string; minLevel?: number; maxLevel?: number }): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.first_name', 'user.last_name', 'user.avatar_url', 'user.total_points', 'user.level']);

    if (query) {
      queryBuilder.where(
        'LOWER(user.username) LIKE LOWER(:query) OR LOWER(user.first_name) LIKE LOWER(:query) OR LOWER(user.last_name) LIKE LOWER(:query)',
        { query: `%${query}%` }
      );
    }

    if (options?.status) {
      queryBuilder.andWhere('user.status = :status', { status: options.status });
    } else {
      queryBuilder.andWhere('user.status = :status', { status: 'active' });
    }

    if (options?.minLevel) {
      queryBuilder.andWhere('user.level >= :minLevel', { minLevel: options.minLevel });
    }

    if (options?.maxLevel) {
      queryBuilder.andWhere('user.level <= :maxLevel', { maxLevel: options.maxLevel });
    }

    return queryBuilder
      .orderBy('user.total_points', 'DESC')
      .limit(50)
      .getMany();
  }

  async getActiveUsersCount(): Promise<number> {
    return this.userRepository.count({ where: { status: 'active' } });
  }

  async getNewUsersCount(days: number = 7): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    return this.userRepository.count({
      where: {
        created_at: MoreThan(date),
        status: 'active'
      }
    });
  }

  async getLevelDistribution(): Promise<any[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .select('user.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .where('user.status = :status', { status: 'active' })
      .groupBy('user.level')
      .orderBy('user.level', 'ASC')
      .getRawMany();
  }

  async getTopPointsEarners(days: number = 30, limit: number = 10): Promise<User[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.first_name', 'user.last_name', 'user.avatar_url', 'user.total_points', 'user.level'])
      .where('user.status = :status', { status: 'active' })
      .andWhere('user.updated_at >= :date', { date })
      .orderBy('user.total_points', 'DESC')
      .limit(limit)
      .getMany();
  }

  async validateUserData(data: Partial<CreateUserDto>): Promise<boolean> {
    // Validate required fields
    if (!data.email || !data.username) {
      throw new Error('Email and username are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Invalid email format');
    }

    // Validate username length
    if (data.username.length < 3 || data.username.length > 30) {
      throw new Error('Username must be between 3 and 30 characters');
    }

    // Check for duplicate email
    if (data.email) {
      const existingUser = await this.findByEmail(data.email);
      if (existingUser) {
        throw new Error('Email already exists');
      }
    }

    // Check for duplicate username
    if (data.username) {
      const existingUser = await this.findByUsername(data.username);
      if (existingUser) {
        throw new Error('Username already exists');
      }
    }

    return true;
  }

  private calculateLevel(points: number): number {
    // Level calculation: every 500 points = 1 level
    return Math.floor(points / 500) + 1;
  }

  private getPointsForLevel(level: number): number {
    // Points required for a specific level
    return (level - 1) * 500;
  }
}