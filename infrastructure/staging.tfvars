# Staging Environment Configuration
environment = "staging"
aws_region  = "eu-west-1"

# Domain (use ALB DNS if no custom domain)
domain_name = "staging.t4g-game.com"
# Leave empty if no SSL certificate
certificate_arn = ""

# VPC Configuration
vpc_cidr = "10.0.0.0/16"
availability_zones = ["eu-west-1a", "eu-west-1b"]

# Database Configuration
database_instance_class     = "db.t3.micro"
database_allocated_storage  = 20

# ECS Configuration
ecs_task_cpu    = 512
ecs_task_memory = 1024

# Scaling Configuration
min_capacity     = 1
max_capacity     = 3
desired_capacity = 1
