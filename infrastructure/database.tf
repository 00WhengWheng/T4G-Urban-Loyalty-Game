# =============================================================================
# RDS POSTGRESQL DATABASE
# =============================================================================

# Random password for database
resource "random_password" "database_password" {
  length  = 32
  special = true
}

# Store database password in AWS Secrets Manager
resource "aws_secretsmanager_secret" "database_password" {
  name        = "${local.name_prefix}-database-password"
  description = "Database password for T4G application"

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "database_password" {
  secret_id     = aws_secretsmanager_secret.database_password.id
  secret_string = random_password.database_password.result
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = module.vpc.private_subnets

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "postgres" {
  identifier                = "${local.name_prefix}-postgres"
  engine                    = "postgres"
  engine_version            = "15.4"
  instance_class            = var.database_instance_class
  allocated_storage         = var.database_allocated_storage
  max_allocated_storage     = 100
  storage_type              = "gp2"
  storage_encrypted         = true

  db_name  = "t4g_database"
  username = var.database_username
  password = random_password.database_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = var.environment == "production" ? 7 : 1
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  skip_final_snapshot       = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${local.name_prefix}-final-snapshot" : null

  # Enhanced monitoring
  monitoring_interval = var.environment == "production" ? 60 : 0
  monitoring_role_arn = var.environment == "production" ? aws_iam_role.rds_monitoring[0].arn : null

  # Performance Insights
  performance_insights_enabled = var.environment == "production"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-postgres"
  })
}

# RDS Monitoring Role (for production only)
resource "aws_iam_role" "rds_monitoring" {
  count = var.environment == "production" ? 1 : 0
  name  = "${local.name_prefix}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count      = var.environment == "production" ? 1 : 0
  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# =============================================================================
# ELASTICACHE REDIS
# =============================================================================

# Redis Subnet Group
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.name_prefix}-redis-subnet-group"
  subnet_ids = module.vpc.private_subnets

  tags = local.common_tags
}

# Redis Cluster
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${local.name_prefix}-redis"
  description                = "Redis cache for T4G application"

  node_type            = "cache.t3.micro"
  port                 = 6379
  parameter_group_name = "default.redis7"

  num_cache_clusters = var.environment == "production" ? 2 : 1

  subnet_group_name  = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  tags = local.common_tags
}
