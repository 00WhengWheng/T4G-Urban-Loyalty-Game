# =============================================================================
# BACKEND ECS SERVICE
# =============================================================================

resource "aws_ecs_task_definition" "backend" {
  family                   = "${local.name_prefix}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_task_cpu
  memory                   = var.ecs_task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "backend"
      image = "ghcr.io/yourusername/t4g-urban-loyalty-game-server:latest"
      
      essential = true
      
      portMappings = [
        {
          containerPort = var.app_port
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = var.environment },
        { name = "PORT", value = tostring(var.app_port) },
        { name = "API_PREFIX", value = "v1" },
        { name = "POSTGRES_HOST", value = aws_db_instance.postgres.address },
        { name = "POSTGRES_PORT", value = tostring(aws_db_instance.postgres.port) },
        { name = "POSTGRES_USERNAME", value = aws_db_instance.postgres.username },
        { name = "POSTGRES_DATABASE", value = aws_db_instance.postgres.db_name },
        { name = "REDIS_HOST", value = aws_elasticache_replication_group.redis.primary_endpoint_address },
        { name = "REDIS_PORT", value = "6379" },
        { name = "CORS_ORIGIN", value = var.certificate_arn != "" ? "https://${var.domain_name}" : "http://${aws_lb.main.dns_name}" }
      ]

      secrets = [
        {
          name      = "POSTGRES_PASSWORD"
          valueFrom = aws_secretsmanager_secret.database_password.arn
        },
        {
          name      = "JWT_SECRET"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:JWT_SECRET::"
        },
        {
          name      = "JWT_REFRESH_SECRET"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:JWT_REFRESH_SECRET::"
        },
        {
          name      = "COOKIE_SECRET"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:COOKIE_SECRET::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.app_port}/api/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = local.common_tags
}

resource "aws_ecs_service" "backend" {
  name            = "${local.name_prefix}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.desired_capacity
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = var.app_port
  }

  depends_on = [aws_lb_listener.https, aws_lb_listener.http_direct]

  tags = local.common_tags
}

# =============================================================================
# FRONTEND ECS SERVICE
# =============================================================================

resource "aws_ecs_task_definition" "frontend" {
  family                   = "${local.name_prefix}-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "frontend"
      image = "ghcr.io/yourusername/t4g-urban-loyalty-game-client:latest"
      
      essential = true
      
      portMappings = [
        {
          containerPort = var.frontend_port
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "VITE_API_BASE_URL", value = var.certificate_arn != "" ? "https://${var.domain_name}/api" : "http://${aws_lb.main.dns_name}/api" },
        { name = "VITE_APP_NAME", value = "T4G Social Game" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "frontend"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.frontend_port}/ || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 30
      }
    }
  ])

  tags = local.common_tags
}

resource "aws_ecs_service" "frontend" {
  name            = "${local.name_prefix}-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = var.desired_capacity
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = var.frontend_port
  }

  depends_on = [aws_lb_listener.https, aws_lb_listener.http_direct]

  tags = local.common_tags
}
