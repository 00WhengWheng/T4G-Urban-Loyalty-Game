import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot(): { message: string; version: string; environment: string; health: string } {
    return {
      message: 'T4G Social Game API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      health: '/health',
    };
  }

  @Get('info')
  getAppInfo(): { name: string; version: string; environment: string; health: string; api: string } {
    const info = this.appService.getAppInfo();
    return {
      ...info,
      health: '/health',
      api: '/api/v1',
    };
  }
}