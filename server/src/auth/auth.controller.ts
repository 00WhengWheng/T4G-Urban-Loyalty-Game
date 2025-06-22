import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  Get,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { CreateTenantDto } from '../tenants/dto/create-tenant.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto, ErrorResponseDto } from './dto/response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ============================================================================
  // USER AUTHENTICATION ENDPOINTS
  // ============================================================================

  @Post('user/register')
  @ApiOperation({ 
    summary: 'Register a new user',
    description: 'Creates a new user account with email and password. The user will need to verify their email before logging in.'
  })
  @ApiBody({ type: CreateUserDto, description: 'User registration data' })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered',
    type: LoginResponseDto
  })
  @ApiResponse({ 
    status: 409, 
    description: 'User already exists',
    type: ErrorResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid registration data',
    type: ErrorResponseDto
  })
  async registerUser(
    @Body() createUserDto: CreateUserDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const metadata = {
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
    };

    const result = await this.authService.registerUser(createUserDto, metadata);

    // Set secure HTTP-only cookie
    this.setAuthCookie(res, result.access_token);
    
    return {
      success: true,
      message: 'User registered successfully',
      user: result.user,
      token_type: result.token_type,
    };
  }

  @Post('user/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async loginUser(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const metadata = {
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
    };

    const result = await this.authService.loginUser(
      loginDto.email,
      loginDto.password,
      metadata,
    );

    // Set secure HTTP-only cookie
    this.setAuthCookie(res, result.access_token);
    
    return {
      success: true,
      message: 'Login successful',
      user: result.user,
      token_type: result.token_type,
    };
  }

  // ============================================================================
  // TENANT AUTHENTICATION ENDPOINTS
  // ============================================================================

  @Post('tenant/register')
  @ApiOperation({ summary: 'Register a new tenant/business' })
  @ApiResponse({ status: 201, description: 'Tenant successfully registered' })
  @ApiResponse({ status: 409, description: 'Tenant already exists' })
  @ApiResponse({ status: 400, description: 'Invalid registration data' })
  async registerTenant(
    @Body() createTenantDto: CreateTenantDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const metadata = {
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
    };

    const result = await this.authService.registerTenant(createTenantDto, metadata);

    // Set secure HTTP-only cookie
    this.setAuthCookie(res, result.access_token);
    
    return {
      success: true,
      message: 'Tenant registered successfully',
      tenant: result.tenant,
      token_type: result.token_type,
    };
  }

  @Post('tenant/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login tenant/business' })
  @ApiResponse({ status: 200, description: 'Tenant successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async loginTenant(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const metadata = {
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
    };

    const result = await this.authService.loginTenant(
      loginDto.email,
      loginDto.password,
      metadata,
    );

    // Set secure HTTP-only cookie
    this.setAuthCookie(res, result.access_token);
    
    return {
      success: true,
      message: 'Login successful',
      tenant: result.tenant,
      token_type: result.token_type,
    };
  }

  // ============================================================================
  // SESSION MANAGEMENT ENDPOINTS
  // ============================================================================

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user/tenant' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Extract user/tenant info and token issued time from JWT payload
    const userId = req.user.id;
    const userType = req.user.userType;
    const tokenIat = req.user.tokenIat;

    // Blacklist token server-side
    await this.authService.logout(userId, tokenIat, userType);

    // Clear HTTP-only cookie
    this.clearAuthCookie(res);
    
    return {
      success: true,
      message: 'Logout successful',
    };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, description: 'Successfully logged out from all devices' })
  async logoutAll(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.id;
    const userType = req.user.userType;

    // Blacklist all user tokens
    await this.authService.logoutAllDevices(userId, userType);

    // Clear HTTP-only cookie
    this.clearAuthCookie(res);
    
    return {
      success: true,
      message: 'Logged out from all devices',
    };
  }

  // ============================================================================
  // PROFILE & SESSION INFO ENDPOINTS
  // ============================================================================

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user/tenant profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async getProfile(@Req() req: any) {
    const userType = req.user.userType;
    const userId = req.user.id;

    if (userType === 'user') {
      return {
        userType: 'user',
        profile: {
          id: req.user.id,
          email: req.user.email,
          username: req.user.username,
          first_name: req.user.first_name,
          last_name: req.user.last_name,
          total_points: req.user.total_points,
          level: req.user.level,
          status: req.user.status,
        },
      };
    } else if (userType === 'tenant') {
      return {
        userType: 'tenant',
        profile: {
          id: req.user.id,
          business_name: req.user.business_name,
          email: req.user.email,
          owner_name: req.user.owner_name,
          city: req.user.city,
          business_type: req.user.business_type,
          status: req.user.status,
        },
      };
    }

    throw new UnauthorizedException('Invalid user type');
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active sessions' })
  @ApiResponse({ status: 200, description: 'Active sessions retrieved' })
  async getActiveSessions(@Req() req: any) {
    const userId = req.user.id;
    
    // Get active sessions from JWT service
    const sessions = await this.authService.getActiveSessions(userId);
    
    return {
      success: true,
      sessions,
      current_session: {
        ip: req.user.ipAddress,
        userAgent: req.user.userAgent,
        loginTime: new Date(req.user.tokenIat * 1000),
      },
    };
  }

  // ============================================================================
  // PASSWORD RESET ENDPOINTS (Future Implementation)
  // ============================================================================

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async forgotPassword(@Body('email') email: string) {
    // TODO: Implement password reset functionality
    throw new BadRequestException('Password reset not implemented yet');
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password successfully reset' })
  async resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    // TODO: Implement password reset functionality
    throw new BadRequestException('Password reset not implemented yet');
  }

  // ============================================================================
  // ACCOUNT VERIFICATION ENDPOINTS (Future Implementation)
  // ============================================================================

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  async verifyEmail(@Body('token') token: string) {
    // TODO: Implement email verification
    throw new BadRequestException('Email verification not implemented yet');
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  async resendVerification(@Req() req: any) {
    // TODO: Implement email verification resend
    throw new BadRequestException('Email verification not implemented yet');
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Set secure HTTP-only authentication cookie
   */
  private setAuthCookie(res: Response, token: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    // Detect if request is from ngrok or external (not localhost)
    // In production, always use secure/none; in dev, check referer/origin
    let sameSite: 'lax' | 'strict' | 'none' = 'lax';
    let secure = isProduction;
    const allowedNone = [
      '.ngrok.io',
      '.ngrok-free.app',
    ];
    // Check referer or origin header for ngrok
    const reqOrigin = res.req?.headers['origin'] || res.req?.headers['referer'] || '';
    if (
      isProduction ||
      allowedNone.some((d) => reqOrigin && reqOrigin.includes(d))
    ) {
      sameSite = 'none';
      secure = true;
    }
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure,
      sameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
      domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
    });
  }

  /**
   * Clear authentication cookie
   */
  private clearAuthCookie(res: Response): void {
    const isProduction = process.env.NODE_ENV === 'production';
    let sameSite: 'lax' | 'strict' | 'none' = 'lax';
    let secure = isProduction;
    const allowedNone = [
      '.ngrok.io',
      '.ngrok-free.app',
    ];
    const reqOrigin = res.req?.headers['origin'] || res.req?.headers['referer'] || '';
    if (
      isProduction ||
      allowedNone.some((d) => reqOrigin && reqOrigin.includes(d))
    ) {
      sameSite = 'none';
      secure = true;
    }
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
    });
  }
}