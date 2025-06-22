export interface IServiceContext {
  userId?: string;
  tenantId?: string;
  userType?: 'user' | 'tenant';
  permissions?: string[];
  metadata?: Record<string, any>;
}