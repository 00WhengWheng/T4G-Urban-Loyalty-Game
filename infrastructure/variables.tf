# =============================================================================
# VARIABLES
# =============================================================================

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be staging or production."
  }
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "certificate_arn" {
  description = "ACM Certificate ARN for HTTPS"
  type        = string
  default     = ""
}

# =============================================================================
# VPC VARIABLES
# =============================================================================

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
}

# =============================================================================
# DATABASE VARIABLES
# =============================================================================

variable "database_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "database_allocated_storage" {
  description = "RDS allocated storage"
  type        = number
  default     = 20
}

variable "database_username" {
  description = "Database master username"
  type        = string
  default     = "t4g_admin"
}

# =============================================================================
# ECS VARIABLES
# =============================================================================

variable "ecs_task_cpu" {
  description = "CPU units for ECS tasks"
  type        = number
  default     = 512
}

variable "ecs_task_memory" {
  description = "Memory for ECS tasks"
  type        = number
  default     = 1024
}

variable "app_port" {
  description = "Port exposed by the docker image to redirect traffic to"
  type        = number
  default     = 3001
}

variable "frontend_port" {
  description = "Port for frontend service"
  type        = number
  default     = 80
}

# =============================================================================
# SCALING VARIABLES
# =============================================================================

variable "min_capacity" {
  description = "Minimum number of instances"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of instances"
  type        = number
  default     = 10
}

variable "desired_capacity" {
  description = "Desired number of instances"
  type        = number
  default     = 2
}
