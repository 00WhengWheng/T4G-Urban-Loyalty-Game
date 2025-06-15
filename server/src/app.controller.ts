import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth(): { status: string } {
    return this.appService.getHealth();
  }

  @Get('info')
  getAppInfo(): { name: string; version: string; environment: string } {
    return this.appService.getAppInfo();
  }
}