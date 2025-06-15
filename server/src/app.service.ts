import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHealth(): { status: string } {
    return { status: 'ok' };
  }

  getAppInfo(): { name: string; version: string; environment: string } {
    return {
      name: 'T4G Urban Loyalty Game',
      version: '1.0.0',
      environment: this.configService.get('NODE_ENV', 'development'),
    };
  }
}