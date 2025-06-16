import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import helmet from 'helmet';
import * as morgan from 'morgan';
import * as responseTime from 'response-time';
import * as winston from 'winston';
import { WinstonModule } from 'nest-winston';
import * as promClient from 'prom-client';
import { AllExceptionsFilter } from './filters/all-exeption.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
  });

  // Prometheus metrics
  const collectDefaultMetrics = promClient.collectDefaultMetrics;
  collectDefaultMetrics();
  app.use('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
  });

  // Get configuration service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3001;
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const corsOrigin = configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000';

  // Security middleware
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // Compression middleware
  app.use(compression());

  // Cookie parser
  app.use(cookieParser(configService.get<string>('COOKIE_SECRET')));

  // Logging middleware
  app.use(morgan('combined'));

  // Response time monitoring
  app.use(responseTime());

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['/health', '/'],
  });

  // CORS Configuration
  app.enableCors({
    origin: nodeEnv === 'production' 
      ? [corsOrigin] 
      : [
          'http://localhost:3000',
          'http://localhost:3001', 
          'http://127.0.0.1:3000',
          /\.ngrok\.io$/,
          /\.ngrok-free\.app$/,
        ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept', 
      'X-Requested-With',
      'X-Forwarded-For',
      'X-Real-IP',
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: nodeEnv === 'production',
    }),
  );

  // Error handling filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger Documentation (only in development)
  if (nodeEnv === 'development' && configService.get<boolean>('ENABLE_SWAGGER')) {
    const config = new DocumentBuilder()
      .setTitle('T4G Social Game API')
      .setDescription('Piattaforma di social gamification loyalty - API Documentation')
      .setVersion('1.0')
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('tenants', 'Business management')
      .addTag('challenges', 'Challenge system')
      .addTag('games', 'Game system')
      .addTag('nfc', 'NFC tag management')
      .addTag('tokens', 'Reward system')
      .addTag('shares', 'Social sharing')
      .addBearerAuth()
      .addCookieAuth('auth_token')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  // Health check endpoint
  app.use('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: nodeEnv,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  });

  // Root endpoint
  app.use('/', (req, res) => {
    if (req.url === '/') {
      res.status(200).json({
        message: 'T4G Social Game API',
        version: '1.0.0',
        documentation: nodeEnv === 'development' ? '/api/docs' : null,
        health: '/health',
      });
    }
  });

  // Start server
  await app.listen(port, '0.0.0.0');

  // Startup logs
  const serverUrl = `http://localhost:${port}`;
  const dbUrl = configService.get('DATABASE_URL');
  const redisHost = configService.get('REDIS_HOST');
  const jwtSecret = configService.get('JWT_SECRET');

  console.log('\n🚀 T4G Backend Server Started Successfully!');
  console.log('==========================================');
  console.log(`📍 Server URL: ${serverUrl}`);
  console.log(`📦 Environment: ${nodeEnv}`);
  console.log(`📊 Database: ${dbUrl ? '✅ Connected' : '❌ Not configured'}`);
  console.log(`🔄 Redis: ${redisHost ? '✅ Connected' : '❌ Not configured'}`);
  console.log(`🔑 JWT Secret: ${jwtSecret ? '✅ Configured' : '❌ Missing'}`);
  
  if (nodeEnv === 'development') {
    console.log(`📚 API Docs: ${serverUrl}/api/docs`);
    console.log(`💚 Health Check: ${serverUrl}/health`);
  }
  
  console.log('==========================================\n');
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

bootstrap().catch((error) => {
  console.error('❌ Error starting T4G Backend:', error);
  process.exit(1);
});