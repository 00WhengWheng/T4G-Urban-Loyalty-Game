import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        email: createUserDto.email.toLowerCase(),
        username: createUserDto.username,
        passwordHash: createUserDto.password_hash || '',
        firstName: createUserDto.first_name,
        lastName: createUserDto.last_name,
        avatarUrl: createUserDto.avatar_url,
        phone: createUserDto.phone,
        dateOfBirth: createUserDto.date_of_birth,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        totalPoints: true,
        level: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        phone: true,
        dateOfBirth: true,
        totalPoints: true,
        level: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ 
      where: { email: email.toLowerCase() } 
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({ 
      where: { username } 
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (!user) return null;
    
    return this.prisma.user.update({
      where: { id },
      data: {
        email: updateUserDto.email?.toLowerCase(),
        username: updateUserDto.username,
        passwordHash: updateUserDto.password_hash,
        firstName: updateUserDto.first_name,
        lastName: updateUserDto.last_name,
        avatarUrl: updateUserDto.avatar_url,
        phone: updateUserDto.phone,
        dateOfBirth: updateUserDto.date_of_birth,
      },
    });
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    if (!user) return null;
    
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async updatePoints(userId: string, points: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      const newTotalPoints = (user.totalPoints || 0) + points;
      
      // Update level based on points
      const newLevel = this.calculateLevel(newTotalPoints);
      
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          totalPoints: newTotalPoints,
          level: Math.max(newLevel, user.level),
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to update user points');
    }
  }

  async getLeaderboard(limit: number = 10, timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'all-time') {
    let where: any = { status: 'active' };

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
      where.updatedAt = { gte: date };
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        totalPoints: true,
        level: true,
      },
      orderBy: { totalPoints: 'desc' },
      take: limit,
    });
  }

  async getUserRanking(userId: string): Promise<{ rank: number; total: number }> {
    const user = await this.findById(userId);
    
    const higherRankedCount = await this.prisma.user.count({
      where: {
        totalPoints: { gt: user.totalPoints },
        status: 'active'
      }
    });

    const totalUsers = await this.prisma.user.count({
      where: { status: 'active' }
    });

    return {
      rank: higherRankedCount + 1,
      total: totalUsers
    };
  }

  async updateStatus(id: string, status: string) {
    const user = await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: { status }
    });
  }

  async updateProfile(id: string, profileData: Partial<UpdateUserDto>) {
    const user = await this.findById(id);
    
    // Only update allowed profile fields
    const updateData: any = {};
    
    if (profileData.first_name !== undefined) updateData.firstName = profileData.first_name;
    if (profileData.last_name !== undefined) updateData.lastName = profileData.last_name;
    if (profileData.avatar_url !== undefined) updateData.avatarUrl = profileData.avatar_url;
    if (profileData.phone !== undefined) updateData.phone = profileData.phone;
    if (profileData.date_of_birth !== undefined) updateData.dateOfBirth = profileData.date_of_birth;
    
    return this.prisma.user.update({
      where: { id },
      data: updateData
    });
  }

  async getUserStats(userId: string): Promise<any> {
    const user = await this.findById(userId);
    const ranking = await this.getUserRanking(userId);
    
    // Calculate points needed for next level
    const nextLevelPoints = this.getPointsForLevel(user.level + 1);
    const pointsToNextLevel = nextLevelPoints - user.totalPoints;

    return {
      currentPoints: user.totalPoints,
      currentLevel: user.level,
      pointsToNextLevel: Math.max(0, pointsToNextLevel),
      ranking: ranking.rank,
      totalUsers: ranking.total,
      percentile: Math.round(((ranking.total - ranking.rank + 1) / ranking.total) * 100)
    };
  }

  async search(query: string, options?: { status?: string; minLevel?: number; maxLevel?: number }) {
    let where: any = {};

    if (query) {
      where.OR = [
        { username: { contains: query, mode: 'insensitive' } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } }
      ];
    }

    if (options?.status) {
      where.status = options.status;
    } else {
      where.status = 'active';
    }

    if (options?.minLevel) {
      where.level = { ...where.level, gte: options.minLevel };
    }

    if (options?.maxLevel) {
      where.level = { ...where.level, lte: options.maxLevel };
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        totalPoints: true,
        level: true,
      },
      orderBy: { totalPoints: 'desc' },
      take: 50,
    });
  }

  async getActiveUsersCount(): Promise<number> {
    return this.prisma.user.count({ where: { status: 'active' } });
  }

  async getNewUsersCount(days: number = 7): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    return this.prisma.user.count({
      where: {
        createdAt: { gt: date },
        status: 'active'
      }
    });
  }

  async getLevelDistribution(): Promise<any[]> {
    // Use raw query since groupBy is causing issues
    return this.prisma.$queryRaw`
      SELECT level, COUNT(*) as count 
      FROM users 
      WHERE status = 'active' 
      GROUP BY level 
      ORDER BY level ASC
    `;
  }

  async getTopPointsEarners(days: number = 30, limit: number = 10) {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return this.prisma.user.findMany({
      where: {
        status: 'active',
        updatedAt: { gte: date }
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        totalPoints: true,
        level: true,
      },
      orderBy: { totalPoints: 'desc' },
      take: limit,
    });
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
