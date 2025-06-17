import { Injectable } from '@nestjs/common';
import * as promClient from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
  });

  private readonly httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.5, 1, 2.5, 5, 10],
  });

  constructor() {
    promClient.collectDefaultMetrics();
  }

  recordHttpRequest(method: string, route: string, status: number, duration: number) {
    this.httpRequestsTotal.inc({ method, route, status: status.toString() });
    this.httpRequestDuration.observe({ method, route, status: status.toString() }, duration);
  }

  async getMetrics(): Promise<string> {
    return promClient.register.metrics();
  }
}