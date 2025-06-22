import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: 'string'
  })
  accessToken: string;

  @ApiProperty({
    description: 'User information',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'uuid-v4-string' },
      email: { type: 'string', example: 'user@example.com' },
      firstName: { type: 'string', example: 'John' },
      lastName: { type: 'string', example: 'Doe' }
    }
  })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };

  @ApiProperty({
    description: 'Refresh token (sent as httpOnly cookie)',
    example: 'refresh_token_string',
    type: 'string',
    required: false
  })
  refreshToken?: string;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
    type: 'number'
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Invalid credentials',
    type: 'string'
  })
  message: string;

  @ApiProperty({
    description: 'Detailed error information',
    example: ['Email is required', 'Password must be at least 6 characters'],
    type: 'array',
    items: { type: 'string' },
    required: false
  })
  error?: string[];

  @ApiProperty({
    description: 'Request timestamp',
    example: '2025-06-23T10:30:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  timestamp: string;

  @ApiProperty({
    description: 'Request path',
    example: '/auth/user/login',
    type: 'string'
  })
  path: string;
}
