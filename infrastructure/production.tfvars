# Production Environment Configuration
environment = "production"
aws_region  = "eu-west-1"

# Domain Configuration
domain_name = "t4g-game.com"
# Add your ACM certificate ARN here
certificate_arn = "arn:aws:acm:eu-west-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"

# VPC Configuration
vpc_cidr = "10.0.0.0/16"
availability_zones = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]

# Database Configuration
database_instance_class     = "db.t3.small"
database_allocated_storage  = 100

# ECS Configuration
ecs_task_cpu    = 1024
ecs_task_memory = 2048

# Scaling Configuration
min_capacity     = 2
max_capacity     = 10
desired_capacity = 3
