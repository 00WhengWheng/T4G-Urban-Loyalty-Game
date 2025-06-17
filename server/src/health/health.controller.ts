import { Controller, Get } from '@nestjs/common';
import { HealthStatus } from './health.types';

@Controller('health')
export class HealthController {
  @Get()
  async getHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalServices()
    ]);

    return {
      status: checks.every(check => check.status === 'fulfilled') ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: checks.map((check, index) => ({
        name: ['database', 'redis', 'external'][index],
        status: check.status === 'fulfilled' ? 'up' : 'down',
        details: check.status === 'rejected' ? check.reason : null
      }))
    };
  }

  private async checkDatabase(): Promise<void> {
    // Simulate a database health check
    return Promise.resolve();
  }

  private async checkRedis(): Promise<void> {
    // Simulate a Redis health check
    return Promise.resolve();
  }

  private async checkExternalServices(): Promise<void> {
    // Simulate an external services health check
    return Promise.resolve();
  }
}