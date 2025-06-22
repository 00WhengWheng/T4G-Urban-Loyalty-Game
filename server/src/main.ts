import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, RequestMethod } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
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
import { AllExceptionsFilter } from './exceptions/all-exeption.filter';
import { appConfig } from './config/app.config';

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

  // Load configuration
  ConfigModule.forRoot({
    isGlobal: true,
    load: [appConfig],
  });

  // Prometheus metrics - handled by controller now

  // Get configuration service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3001;
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const corsOrigin = configService.get<string>('CORS_ORIGIN') || 'http://localhost:4000';

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

  // No global prefix - use explicit prefixes in controllers

  // CORS Configuration
  app.enableCors({
    origin: (origin, callback) => {
      // Allow localhost, LAN IPs, and ngrok for dev
      if (!origin) return callback(null, true);
      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('http://192.168.178.71:') || // Explicit Windows IP
        origin.match(/^http:\/\/(192|10|172)\./) || // Allow LAN IPs
        origin.match(/\.ngrok\./) ||
        origin.match(/\.ngrok-free\./)
      ) {
        return callback(null, true);
      }
      console.log('CORS rejected origin:', origin);
      callback(new Error('Not allowed by CORS'));
    },
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

  // Print LAN IP for mobile testing
  const os = await import('os');
  const nets = os.networkInterfaces();
  let lanIp = 'localhost';
  
  // For WSL2, get the Windows host IP for mobile access
  try {
    const { execSync } = await import('child_process');
    const windowsHostIp = execSync("ip route show default | awk '{print $3}'", { encoding: 'utf8' }).trim();
    if (windowsHostIp && windowsHostIp !== '0.0.0.0') {
      lanIp = windowsHostIp;
    }
  } catch (error) {
    console.log('Could not detect Windows host IP, falling back to interface detection');
  }
  
  // Fallback: Prioritize eth0 interface over Docker bridges
  if (lanIp === 'localhost') {
    for (const name of Object.keys(nets)) {
      if (name === 'eth0') {
        for (const net of nets[name] || []) {
          if (net.family === 'IPv4' && !net.internal) {
            lanIp = net.address;
            break;
          }
        }
        break;
      }
    }
  }
  
  // Final fallback to any non-internal IPv4 if eth0 not found
  if (lanIp === 'localhost') {
    for (const name of Object.keys(nets)) {
      if (!name.startsWith('docker') && !name.startsWith('br-')) {
        for (const net of nets[name] || []) {
          if (net.family === 'IPv4' && !net.internal) {
            lanIp = net.address;
            break;
          }
        }
        if (lanIp !== 'localhost') break;
      }
    }
  }
  
  const serverUrl = `http://${lanIp}:${port}`;

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

  // Swagger Documentation (always enabled in development)
  if (nodeEnv === 'development') {
    const config = new DocumentBuilder()
      .setTitle('T4G Social Game API')
      .setDescription(`
        ## T4G Social Gamification Loyalty Platform API

        This API provides comprehensive endpoints for a social gamification loyalty platform.
        
        ### Authentication
        - JWT tokens for API access
        - Cookie-based refresh tokens
        - Role-based access control
        
        ### Main Features
        - User and business management
        - Challenge and game systems
        - NFC tag integration
        - Reward and token system
        - Social sharing capabilities
        
        ### Rate Limiting
        API endpoints are rate-limited to ensure fair usage.
        
        ### Support
        For technical support, contact: support@t4g-game.com
      `)
      .setVersion('1.0')
      .setContact('T4G Development Team', 'https://t4g-game.com', 'dev@t4g-game.com')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addServer('http://localhost:3001/v1', 'Development Server')
      .addServer('https://api.t4g-game.com/v1', 'Production Server')
      .addTag('auth', 'Authentication and authorization endpoints')
      .addTag('users', 'User management and profile operations')
      .addTag('tenants', 'Business and organization management')
      .addTag('challenges', 'Challenge creation and participation')
      .addTag('games', 'Game mechanics and leaderboards')
      .addTag('nfc', 'NFC tag management and scanning')
      .addTag('tokens', 'Reward tokens and loyalty points')
      .addTag('shares', 'Social sharing and engagement')
      .addTag('health', 'System health and monitoring')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      })
      .addCookieAuth('auth_token', {
        type: 'apiKey',
        in: 'cookie',
        name: 'auth_token',
        description: 'Refresh token stored in httpOnly cookie'
      })
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
      deepScanRoutes: true,
    });
    
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayOperationId: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        docExpansion: 'list',
        filter: true,
        showRequestHeaders: true,
        tryItOutEnabled: true,
      },
      customSiteTitle: 'T4G API Documentation',
      customfavIcon: '/favicon.ico',
      customJs: [
        'https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js',
        'https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js',
      ],
      customCssUrl: [
        'https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css',
      ],
    });

    console.log(`📚 Swagger documentation available at: http://localhost:${port}/api/docs`);
  }

  // Health check endpoint - handled by controller now

  // Root endpoint - handled by controller now

  // Start server
  await app.listen(port, '0.0.0.0');

  // Startup logs
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
    console.log(`💚 Health Check: ${serverUrl}/v1/health`);
    console.log(`📱 LAN URL for mobile: ${serverUrl}`);
    console.log(`🔧 WSL2 Setup: Run these commands in Windows PowerShell as Administrator:`);
    console.log(`   netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=${lanIp === '172.23.32.1' ? '172.23.46.109' : lanIp}`);
    console.log(`   netsh interface portproxy add v4tov4 listenport=4000 listenaddress=0.0.0.0 connectport=4000 connectaddress=${lanIp === '172.23.32.1' ? '172.23.46.109' : lanIp}`);
  }
  
  console.log('==========================================\n');

  // Verify Prisma connection
  try {
    const { PrismaService } = await import('./prisma/prisma.service');
    const prismaService = app.get(PrismaService);
    // Test the connection with a simple query
    await (prismaService as any).$queryRaw`SELECT 1`;
    console.log('📊 Prisma database connection established successfully');
  } catch (error) {
    console.error('❌ Prisma database connection failed:', error.message);
  }
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