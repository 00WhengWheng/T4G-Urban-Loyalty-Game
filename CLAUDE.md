# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

T4G Urban Loyalty Game is a social gamification loyalty platform built with:
- **Backend**: NestJS with TypeScript, PostgreSQL, Redis, Bull queues
- **Frontend**: React with TypeScript, Vite, TailwindCSS, Zustand
- **Infrastructure**: Docker, Docker Compose, PNPM workspaces

## Architecture

### Backend Structure (NestJS)
- **Multi-tenant architecture** with tenant isolation
- **Core entities**: Users, Tenants, Challenges, Games, NFC Tags/Scans, Tokens, Shares
- **Authentication**: JWT-based with Passport strategies
- **Caching**: Redis for performance optimization
- **Background jobs**: Bull queues for async processing
- **Database**: PostgreSQL with TypeORM, migrations-based schema management
- **Real-time**: Socket.io integration for live updates

### Frontend Structure (React)
- **State management**: Zustand for auth, React Query for server state
- **Routing**: React Router with protected routes
- **UI**: Custom components with TailwindCSS, mobile-first responsive design
- **Forms**: React Hook Form with Zod validation
- **Location**: Geolocation API integration for NFC scanning
- **Error handling**: Error boundaries and toast notifications

### Key Business Logic
- **NFC Scanning**: Location-based token rewards through NFC tag interactions
- **Challenges**: Time-bound activities with participant tracking and rewards
- **Games**: Interactive experiences with attempt tracking and scoring
- **Scoring System**: Centralized point calculation and leaderboards
- **Social Sharing**: Social media integration with verification

## Development Commands

### Root Level (uses workspaces)
```bash
# Start both client and server in development
npm run dev

# Install all dependencies
npm run install:all

# Build both applications
npm run build

# Run tests for both
npm run test

# Lint both codebases
npm run lint

# Database migrations
npm run db:migrate
npm run db:generate
npm run db:revert
```

### Server Commands (from root or server/)
```bash
# Development with hot reload
npm run dev:server
cd server && npm run start:dev

# Build and production
npm run build:server
npm run start:server

# Testing
cd server && npm run test
cd server && npm run test:watch
cd server && npm run test:e2e

# Database operations
cd server && npm run migration:generate -- src/migrations/MigrationName
cd server && npm run migration:run
cd server && npm run migration:revert
cd server && npm run schema:sync  # Development only
```

### Client Commands (from root or client/)
```bash
# Development server
npm run dev:client
cd client && npm run dev

# Build and preview
npm run build:client
cd client && npm run build
cd client && npm run preview

# Testing
cd client && npm run test
cd client && npm run test:coverage

# Linting and formatting
cd client && npm run lint
cd client && npm run format
cd client && npm run type-check
```

### Docker Development
```bash
# Start full development environment
npm run docker:dev
docker-compose up

# Production deployment
npm run docker:prod
docker-compose -f docker-compose.prod.yml up

# Build images
npm run docker:build
```

## Database Management

### TypeORM Migrations
- **Always use migrations** in production - synchronize is disabled for safety
- **Migration workflow**:
  1. Modify entities
  2. Generate migration: `npm run db:generate -- src/migrations/DescriptiveName`
  3. Review generated migration code
  4. Run migration: `npm run db:migrate`
- **Entity location**: All entities are in their respective module folders
- **Data source**: Configured in `server/src/data-source.ts`

### Redis Usage
- **Cache**: Query results, session data (DB 0)
- **Job queues**: Background processing (DB 1)
- **Configuration**: Environment-based with fallback defaults

## Environment Configuration

### Required Environment Variables
**Server (.env in server/):**
```
DATABASE_URL=postgresql://user:password@localhost:5432/database
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
NODE_ENV=development|production
PORT=3001
```

**Client (.env in client/):**
```
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_NAME=T4G Social Game
```

## Code Standards

### Backend (NestJS)
- **Module structure**: Each feature has controller, service, module, entities, DTOs
- **Validation**: Use class-validator decorators on DTOs
- **Error handling**: Global exception filter in `filters/all-exception.filter.ts`
- **Authentication**: JWT guards protect routes, tenant context in requests
- **Database**: Use repository pattern, leverage TypeORM relations
- **Caching**: Cache expensive queries, use Redis for session data

### Frontend (React)
- **Components**: Organized by feature (dashboard, layout, ui) and pages
- **State**: Zustand for client state, React Query for server state
- **Styling**: TailwindCSS with custom utility classes
- **Forms**: React Hook Form with Zod schemas from `types/schemas.ts`
- **API**: Centralized in `services/api/`, uses axios with interceptors
- **Mobile**: Mobile-first responsive design with bottom navigation

## Testing Strategy

### Backend Testing
- **Unit tests**: Jest with NestJS testing utilities
- **E2E tests**: Supertest for API endpoint testing
- **Database**: Use test database, clean between tests
- **Mocking**: Mock external services (Redis, external APIs)

### Frontend Testing
- **Unit/Component**: Vitest with React Testing Library
- **Mocking**: MSW for API mocking
- **Coverage**: Configured for comprehensive coverage reporting

## Common Development Patterns

### Adding New Features
1. **Backend**: Create module with controller, service, entity, DTOs
2. **Database**: Generate and run migration for schema changes
3. **Frontend**: Add API client methods, create pages/components
4. **State**: Add Zustand stores or React Query hooks as needed
5. **Routes**: Add protected routes and navigation items

### NFC Integration
- **Tag creation**: Admin creates NFC tags with location data
- **Scanning**: Mobile clients scan tags, verify location, award tokens
- **Validation**: Server validates scan authenticity and proximity

### Multi-tenant Support
- **Isolation**: All queries filtered by tenant context
- **Middleware**: Tenant extraction from JWT or headers
- **Entities**: All entities include tenantId foreign key