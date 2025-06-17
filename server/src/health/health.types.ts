export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: Array<{
    name: string;
    status: 'up' | 'down';
    details: string | null;
  }>;
}
