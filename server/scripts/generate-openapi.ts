import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';

async function generateOpenAPI() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('T4G Social Game API')
    .setDescription('Piattaforma di social gamification loyalty - API Documentation')
    .setVersion('1.0')
    .addTag('auth', 'Authentication and authorization endpoints')
    .addTag('users', 'User management and profile operations')
    .addTag('tenants', 'Business and organization management')
    .addTag('challenges', 'Challenge creation and participation')
    .addTag('games', 'Game mechanics and leaderboards')
    .addTag('nfc', 'NFC tag management and scanning')
    .addTag('tokens', 'Reward tokens and loyalty points')
    .addTag('shares', 'Social sharing and engagement')
    .addBearerAuth()
    .addCookieAuth('auth_token')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    deepScanRoutes: true,
  });

  // Generate OpenAPI JSON
  const outputPath = join(__dirname, '../docs/openapi.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2));
  
  console.log(`✅ OpenAPI specification generated at: ${outputPath}`);
  
  // Generate OpenAPI YAML (optional)
  const yaml = require('js-yaml');
  const yamlPath = join(__dirname, '../docs/openapi.yaml');
  writeFileSync(yamlPath, yaml.dump(document));
  
  console.log(`✅ OpenAPI YAML generated at: ${yamlPath}`);

  await app.close();
}

generateOpenAPI().catch(console.error);
