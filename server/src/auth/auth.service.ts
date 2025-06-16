import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { EnhancedJwtService } from './strategies/jwt.strategy';
import { RedisService } from '../common/redis.module';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { CreateTenantDto } from '../tenants/dto/create-tenant.dto';

interface LoginAttempt {
  email: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  userType: 'user' | 'tenant';
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private enhancedJwtService: EnhancedJwtService,
    private configService: ConfigService,
    private usersService: UsersService,
    private tenantsService: TenantsService,
    private redisService: RedisService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ============================================================================
  // USER AUTHENTICATION
  // ============================================================================

  async registerUser(createUserDto: CreateUserDto, metadata?: { ip: string; userAgent: string }) {
    // Development bypass
    if (this.configService.get('NODE_ENV') === 'development') {
      this.logger.warn('⚠️ [DEV] User registration bypass enabled');
      return this.createDevUserResponse(createUserDto);
    }

    // Validation: ensure password is provided for registration
    if (!createUserDto.password) {
      throw new BadRequestException('Password is required for registration');
    }

    // Check for existing user
    const existingUser = await this.usersService.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const existingUsername = await this.usersService.findByUsername(createUserDto.username);
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    // Validate password strength
    this.validatePasswordStrength(createUserDto.password);

    // Hash password
    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    // Prepare data for database - replace password with password_hash
    const userDataForDB: CreateUserDto = {
      ...createUserDto,
      password_hash: hashedPassword,
      password: undefined, // Remove plain password
      email: createUserDto.email.toLowerCase().trim(),
      username: createUserDto.username.trim(),
      first_name: createUserDto.first_name?.trim(),
      last_name: createUserDto.last_name?.trim(),
      phone: createUserDto.phone?.trim(),
    };

    try {
      // Create user
      const user = await this.usersService.create(userDataForDB);
      
      // Generate tokens
      const tokens = await this.generateTokens(user.id, 'user');
      
      // Log successful registration
      await this.logAuthEvent({
        email: user.email,
        ip: metadata?.ip || 'unknown',
        userAgent: metadata?.userAgent || 'unknown',
        timestamp: new Date(),
        success: true,
        userType: 'user',
      });

      // Emit registration event
      this.eventEmitter.emit('user.registered', {
        userId: user.id,
        email: user.email,
        metadata,
      });

      return { 
        user: this.sanitizeUser(user), 
        ...tokens 
      };
    } catch (error) {
      this.logger.error('User registration failed:', error);
      throw new BadRequestException('Registration failed');
    }
  }

  async loginUser(email: string, password: string, metadata?: { ip: string; userAgent: string }) {
    const cleanEmail = email.toLowerCase().trim();

    // Development bypass
    if (this.configService.get('NODE_ENV') === 'development') {
      this.logger.warn('🧪 [DEV] User login bypass enabled');
      return this.createDevUserResponse({ email: cleanEmail } as CreateUserDto);
    }

    // Rate limiting check
    await this.checkRateLimit(cleanEmail, 'user', metadata?.ip);

    try {
      // Find user
      const user = await this.usersService.findByEmail(cleanEmail);
      if (!user || user.status !== 'active') {
        await this.logFailedLogin(cleanEmail, 'user', metadata);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        await this.logFailedLogin(cleanEmail, 'user', metadata);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Clear failed login attempts
      await this.clearFailedAttempts(cleanEmail, 'user');

      // Generate tokens
      const tokens = await this.generateTokens(user.id, 'user');

      // Log successful login
      await this.logAuthEvent({
        email: user.email,
        ip: metadata?.ip || 'unknown',
        userAgent: metadata?.userAgent || 'unknown',
        timestamp: new Date(),
        success: true,
        userType: 'user',
      });

      // Emit login event
      this.eventEmitter.emit('user.login', {
        userId: user.id,
        email: user.email,
        metadata,
      });

      return { 
        user: this.sanitizeUser(user), 
        ...tokens 
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('User login failed:', error);
      throw new UnauthorizedException('Login failed');
    }
  }

  // ============================================================================
  // TENANT AUTHENTICATION
  // ============================================================================

  async registerTenant(createTenantDto: CreateTenantDto, metadata?: { ip: string; userAgent: string }) {
    // Development bypass
    if (this.configService.get('NODE_ENV') === 'development') {
      this.logger.warn('⚠️ [DEV] Tenant registration bypass enabled');
      return this.createDevTenantResponse(createTenantDto);
    }

    // Validation: ensure password is provided for registration
    if (!createTenantDto.password) {
      throw new BadRequestException('Password is required for registration');
    }

    // Check for existing tenant
    const existingTenant = await this.tenantsService.findByEmail(createTenantDto.email);
    if (existingTenant) {
      throw new ConflictException('Tenant with this email already exists');
    }

    // Validate password strength
    this.validatePasswordStrength(createTenantDto.password);

    // Validate coordinates
    if (!this.isValidCoordinate(createTenantDto.latitude, createTenantDto.longitude)) {
      throw new BadRequestException('Invalid coordinates provided');
    }

    // Hash password
    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const hashedPassword = await bcrypt.hash(createTenantDto.password, saltRounds);

    // Prepare data for database - replace password with password_hash
    const tenantDataForDB: CreateTenantDto = {
      ...createTenantDto,
      password_hash: hashedPassword,
      password: undefined, // Remove plain password
      business_name: createTenantDto.business_name.trim(),
      email: createTenantDto.email.toLowerCase().trim(),
      owner_name: createTenantDto.owner_name?.trim(),
      phone: createTenantDto.phone?.trim(),
      address: createTenantDto.address?.trim(),
      city: createTenantDto.city?.trim(),
      postal_code: createTenantDto.postal_code?.trim(),
      business_type: createTenantDto.business_type?.trim(),
      description: createTenantDto.description?.trim(),
      website: createTenantDto.website?.trim(),
      instagram: createTenantDto.instagram?.trim(),
      facebook: createTenantDto.facebook?.trim(),
    };

    try {
      // Create tenant
      const tenant = await this.tenantsService.create(tenantDataForDB);
      
      // Generate tokens
      const tokens = await this.generateTokens(tenant.id, 'tenant');
      
      // Log successful registration
      await this.logAuthEvent({
        email: tenant.email,
        ip: metadata?.ip || 'unknown',
        userAgent: metadata?.userAgent || 'unknown',
        timestamp: new Date(),
        success: true,
        userType: 'tenant',
      });

      // Emit registration event
      this.eventEmitter.emit('tenant.registered', {
        tenantId: tenant.id,
        email: tenant.email,
        businessName: tenant.business_name,
        metadata,
      });

      return { 
        tenant: this.sanitizeTenant(tenant), 
        ...tokens 
      };
    } catch (error) {
      this.logger.error('Tenant registration failed:', error);
      throw new BadRequestException('Registration failed');
    }
  }

  async loginTenant(email: string, password: string, metadata?: { ip: string; userAgent: string }) {
    const cleanEmail = email.toLowerCase().trim();

    // Development bypass
    if (this.configService.get('NODE_ENV') === 'development') {
      this.logger.warn('🧪 [DEV] Tenant login bypass enabled');
      return this.createDevTenantResponse({ email: cleanEmail } as CreateTenantDto);
    }

    // Rate limiting check
    await this.checkRateLimit(cleanEmail, 'tenant', metadata?.ip);

    try {
      // Find tenant
      const tenant = await this.tenantsService.findByEmail(cleanEmail);
      if (!tenant || tenant.status !== 'active') {
        await this.logFailedLogin(cleanEmail, 'tenant', metadata);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, tenant.password_hash);
      if (!isPasswordValid) {
        await this.logFailedLogin(cleanEmail, 'tenant', metadata);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Clear failed login attempts
      await this.clearFailedAttempts(cleanEmail, 'tenant');

      // Generate tokens
      const tokens = await this.generateTokens(tenant.id, 'tenant');

      // Log successful login
      await this.logAuthEvent({
        email: tenant.email,
        ip: metadata?.ip || 'unknown',
        userAgent: metadata?.userAgent || 'unknown',
        timestamp: new Date(),
        success: true,
        userType: 'tenant',
      });

      // Emit login event
      this.eventEmitter.emit('tenant.login', {
        tenantId: tenant.id,
        email: tenant.email,
        businessName: tenant.business_name,
        metadata,
      });

      return { 
        tenant: this.sanitizeTenant(tenant), 
        ...tokens 
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Tenant login failed:', error);
      throw new UnauthorizedException('Login failed');
    }
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  async logout(userId: string, tokenIat: number, userType: 'user' | 'tenant') {
    try {
      // Blacklist the current token
      await this.enhancedJwtService.blacklistToken(userId, tokenIat);

      // Emit logout event
      this.eventEmitter.emit(`${userType}.logout`, {
        [`${userType}Id`]: userId,
        tokenIat,
        timestamp: new Date(),
      });

      return { message: 'Logout successful' };
    } catch (error) {
      this.logger.error('Logout failed:', error);
      throw new BadRequestException('Logout failed');
    }
  }

  async logoutAllDevices(userId: string, userType: 'user' | 'tenant') {
    try {
      // Blacklist all user tokens
      const count = await this.enhancedJwtService.blacklistAllUserTokens(userId, userType);

      // Emit logout all event
      this.eventEmitter.emit(`${userType}.logout-all`, {
        [`${userType}Id`]: userId,
        tokensInvalidated: count,
        timestamp: new Date(),
      });

      return { 
        message: 'Logged out from all devices',
        tokensInvalidated: count
      };
    } catch (error) {
      this.logger.error('Logout all devices failed:', error);
      throw new BadRequestException('Logout all devices failed');
    }
  }

  async getActiveSessions(userId: string): Promise<any[]> {
    try {
      // Get active sessions from JWT service
      const sessions = await this.enhancedJwtService.getActiveSessions(userId);
      
      // Format sessions for response
      return sessions.map(session => ({
        issuedAt: session.issuedAt,
        expiresAt: session.expiresAt,
        userAgent: session.userAgent || 'Unknown',
        ipAddress: session.ipAddress || 'Unknown',
        type: session.type
      }));
    } catch (error) {
      this.logger.error('Get active sessions failed:', error);
      return [];
    }
  }

  // ============================================================================
  // SECURITY & VALIDATION METHODS
  // ============================================================================

  private async generateTokens(id: string, type: 'user' | 'tenant') {
    const accessToken = await this.enhancedJwtService.generateToken(id, type);
    return {
      access_token: accessToken,
      token_type: 'Bearer',
    };
  }

  private validatePasswordStrength(password: string) {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const strengthScore = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    if (strengthScore < 3) {
      throw new BadRequestException(
        'Password must contain at least 3 of: uppercase letters, lowercase letters, numbers, special characters'
      );
    }
  }

  private isValidCoordinate(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  // ============================================================================
  // RATE LIMITING & SECURITY
  // ============================================================================

  private async checkRateLimit(email: string, type: 'user' | 'tenant', ip?: string) {
    const emailKey = `login_attempts:${type}:${email}`;
    const ipKey = ip ? `login_attempts:ip:${ip}` : null;
    
    const emailAttempts = await this.redisService.get(emailKey);
    const ipAttempts = ipKey ? await this.redisService.get(ipKey) : '0';
    
    if (parseInt(emailAttempts || '0') >= 5) {
      throw new UnauthorizedException('Too many login attempts. Please try again later.');
    }
    
    if (parseInt(ipAttempts || '0') >= 20) {
      throw new UnauthorizedException('Too many login attempts from this IP. Please try again later.');
    }
  }

  private async logFailedLogin(email: string, type: 'user' | 'tenant', metadata?: { ip: string; userAgent: string }) {
    const emailKey = `login_attempts:${type}:${email}`;
    const ipKey = metadata?.ip ? `login_attempts:ip:${metadata.ip}` : null;
    
    // Increment counters
    await this.redisService.incr(emailKey);
    await this.redisService.expire(emailKey, 900); // 15 minutes
    
    if (ipKey) {
      await this.redisService.incr(ipKey);
      await this.redisService.expire(ipKey, 900); // 15 minutes
    }

    // Log the event
    await this.logAuthEvent({
      email,
      ip: metadata?.ip || 'unknown',
      userAgent: metadata?.userAgent || 'unknown',
      timestamp: new Date(),
      success: false,
      userType: type,
    });
  }

  private async clearFailedAttempts(email: string, type: 'user' | 'tenant') {
    const emailKey = `login_attempts:${type}:${email}`;
    await this.redisService.del(emailKey);
  }

  private async logAuthEvent(event: LoginAttempt) {
    const logKey = `auth_log:${event.userType}:${event.email}:${Date.now()}`;
    await this.redisService.setJson(logKey, event, 86400); // 24 hours
  }

  // ============================================================================
  // DEVELOPMENT HELPERS
  // ============================================================================

  private createDevUserResponse(createUserDto: Partial<CreateUserDto>) {
    return {
      user: {
        id: 'dev-user-id',
        email: createUserDto.email,
        username: createUserDto.username || 'devuser',
        first_name: createUserDto.first_name || 'Dev',
        last_name: createUserDto.last_name || 'User',
        phone: createUserDto.phone || '+39000000000',
        total_points: 500,
        level: 3,
        status: 'active',
      },
      ...this.generateFakeToken('dev-user-id', 'user'),
    };
  }

  private createDevTenantResponse(createTenantDto: Partial<CreateTenantDto>) {
    return {
      tenant: {
        id: 'dev-tenant-id',
        email: createTenantDto.email,
        business_name: createTenantDto.business_name || 'DevTenant',
        owner_name: createTenantDto.owner_name || 'Dev Owner',
        phone: createTenantDto.phone || '+39000000000',
        city: createTenantDto.city || 'Rome',
        business_type: createTenantDto.business_type || 'restaurant',
        latitude: createTenantDto.latitude || 41.9028,
        longitude: createTenantDto.longitude || 12.4964,
        status: 'active',
      },
      ...this.generateFakeToken('dev-tenant-id', 'tenant'),
    };
  }

  private generateFakeToken(id: string, type: 'user' | 'tenant') {
    // Only for development
    return {
      access_token: `dev-token-${type}-${id}`,
      token_type: 'Bearer',
    };
  }

  // ============================================================================
  // DATA SANITIZATION
  // ============================================================================

  private sanitizeUser(user: any) {
    const { password_hash, ...result } = user;
    return result;
  }

  private sanitizeTenant(tenant: any) {
    const { password_hash, ...result } = tenant;
    return result;
  }
}