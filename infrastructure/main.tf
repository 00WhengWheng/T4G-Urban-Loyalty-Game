# =============================================================================
# T4G URBAN LOYALTY GAME - AWS INFRASTRUCTURE
# =============================================================================

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Uncomment and configure for remote state
  # backend "s3" {
  #   bucket = "t4g-terraform-state"
  #   key    = "infrastructure/terraform.tfstate"
  #   region = "eu-west-1"
  # }
}

# =============================================================================
# PROVIDER CONFIGURATION
# =============================================================================

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "T4G-Urban-Loyalty-Game"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "T4G-Team"
    }
  }
}

# =============================================================================
# DATA SOURCES
# =============================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# =============================================================================
# LOCALS
# =============================================================================

locals {
  name_prefix = "t4g-${var.environment}"
  
  common_tags = {
    Project     = "T4G-Urban-Loyalty-Game"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
