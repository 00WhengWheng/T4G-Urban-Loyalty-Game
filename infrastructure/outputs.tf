# =============================================================================
# OUTPUTS
# =============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnets
}

# =============================================================================
# DATABASE OUTPUTS
# =============================================================================

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "database_port" {
  description = "RDS instance port"
  value       = aws_db_instance.postgres.port
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

# =============================================================================
# APPLICATION OUTPUTS
# =============================================================================

output "load_balancer_dns" {
  description = "Load balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "Load balancer hosted zone ID"
  value       = aws_lb.main.zone_id
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "backend_service_name" {
  description = "Backend ECS service name"
  value       = aws_ecs_service.backend.name
}

output "frontend_service_name" {
  description = "Frontend ECS service name"
  value       = aws_ecs_service.frontend.name
}

# =============================================================================
# SECURITY OUTPUTS
# =============================================================================

output "database_password_secret_arn" {
  description = "ARN of the secret containing database password"
  value       = aws_secretsmanager_secret.database_password.arn
  sensitive   = true
}

output "app_secrets_arn" {
  description = "ARN of the secret containing application secrets"
  value       = aws_secretsmanager_secret.app_secrets.arn
  sensitive   = true
}

# =============================================================================
# URL OUTPUTS
# =============================================================================

output "application_url" {
  description = "Application URL"
  value       = var.certificate_arn != "" ? "https://${var.domain_name}" : "http://${aws_lb.main.dns_name}"
}

output "api_url" {
  description = "API URL"
  value       = var.certificate_arn != "" ? "https://${var.domain_name}/api" : "http://${aws_lb.main.dns_name}/api"
}
