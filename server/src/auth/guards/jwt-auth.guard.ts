import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private configService: ConfigService,
    private reflector: Reflector,
  ) {
    super();
  }

canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
  if (process.env.NODE_ENV === 'production') {
    // Force strict authentication in production
    return super.canActivate(context);
  }

  // Safe development mode
  const isPublic = this.reflector.get('isPublic', context.getHandler());
  if (isPublic) return true;

  return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const isDevelopment = this.configService.get('NODE_ENV') === 'development';
    
    // Log authentication attempts in development
    if (isDevelopment) {
      this.logger.debug(`Auth attempt: ${user ? 'SUCCESS' : 'FAILED'}`);
      if (err || info) {
        this.logger.debug(`Auth error: ${err?.message || info?.message}`);
      }
    }

    // Standard passport error handling
    if (err || !user) {
      if (err) {
        this.logger.error(`Authentication error: ${err.message}`);
      }
      
      throw new UnauthorizedException(
        err?.message || 
        info?.message || 
        'Authentication failed'
      );
    }

    return user;
  }

  /**
* Bypass authentication in development mode
* Creates a mock user/tenant for testing purposes
*/
private bypassAuthInDevelopment(context: ExecutionContext): boolean {
 const request = context.switchToHttp().getRequest();
 const route = request.route?.path || request.url;
 
 // Check environment security
 if (this.configService.get('NODE_ENV') !== 'development') {
   return false;
 }
 
 // Get mock user from header or default
 const mockUserId = request.headers['x-mock-user-id'];
 const mockUserType = request.headers['x-mock-user-type'];
 
 const isTenantRoute = mockUserType === 'tenant' || route.includes('/tenant') || route.includes('/business');
 
 if (isTenantRoute) {
   request.user = {
     id: mockUserId || 'dev-tenant-id',
     userType: 'tenant',
     email: 'dev@tenant.local',
     business_name: 'Development Tenant',
     owner_name: 'Dev Owner',
     phone: '+39000000000',
     city: 'Development City',
     business_type: 'restaurant',
     latitude: 41.9028,
     longitude: 12.4964,
     status: 'active',
     tokenIat: Math.floor(Date.now() / 1000),
     ipAddress: request.ip || '127.0.0.1',
     userAgent: request.get('User-Agent') || 'development',
   };
 } else {
   request.user = {
     id: mockUserId || 'dev-user-id',
     userType: 'user',
     email: 'dev@user.local',
     username: 'devuser',
     first_name: 'Dev',
     last_name: 'User',
     phone: '+39000000000',
     total_points: 500,
     level: 3,
     status: 'active',
     tokenIat: Math.floor(Date.now() / 1000),
     ipAddress: request.ip || '127.0.0.1',
     userAgent: request.get('User-Agent') || 'development',
   };
 }

 return true;
}

  /**
   * Get token from request (cookie or Authorization header)
   */
  getRequest(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // Log token source in development
    if (this.configService.get('NODE_ENV') === 'development') {
      const authHeader = request.headers.authorization;
      const cookieToken = request.cookies?.auth_token;
      
      this.logger.debug('Token sources:', {
        hasAuthHeader: !!authHeader,
        hasCookie: !!cookieToken,
      });
    }
    
    return request;
  }
}

/**
 * Decorator to mark routes as public (no authentication required)
 */
import { SetMetadata } from '@nestjs/common';

export const Public = () => SetMetadata('isPublic', true);

/**
 * Decorator to require specific user types
 */
export const RequireUserType = (...userTypes: ('user' | 'tenant')[]) =>
  SetMetadata('userTypes', userTypes);

/**
 * Guard to check user type
 */
@Injectable()
export class UserTypeGuard {
  private readonly logger = new Logger(UserTypeGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredUserTypes = this.reflector.getAllAndOverride<('user' | 'tenant')[]>(
      'userTypes',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredUserTypes) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !requiredUserTypes.includes(user.userType)) {
      this.logger.warn(`Access denied: Required ${requiredUserTypes.join('|')}, got ${user?.userType}`);
      throw new UnauthorizedException(
        `Access denied. Required user type: ${requiredUserTypes.join(' or ')}`
      );
    }

    return true;
  }
}