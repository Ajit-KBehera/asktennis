# AskTennis Enhanced Architecture

## Overview

This document describes the comprehensive overhaul of the AskTennis query handler for Docker database integration. The new architecture provides robust, scalable, and maintainable code with proper separation of concerns.

## Architecture Components

### 1. Configuration Layer (`src/config/`)

#### `database.js`
- **Purpose**: Environment-aware database configuration
- **Features**:
  - Automatic Docker environment detection
  - Connection string generation
  - SSL configuration handling
  - Environment-specific settings

```javascript
// Detects Docker environment automatically
const config = new DatabaseConfig();
const isDocker = config.isDocker; // true in Docker, false locally
```

### 2. Database Layer (`src/database/`)

#### `connection.js`
- **Purpose**: Enhanced database connection management
- **Features**:
  - Connection pooling with Docker optimization
  - Automatic reconnection logic
  - Health monitoring
  - Performance metrics
  - Graceful error handling

```javascript
// Automatic connection with health monitoring
await databaseConnection.connect();
const result = await databaseConnection.query('SELECT * FROM players');
```

### 3. Repository Layer (`src/repositories/`)

#### `tennisRepository.js`
- **Purpose**: Data access abstraction
- **Features**:
  - Cached query results
  - Optimized SQL queries
  - Error handling
  - Performance monitoring

```javascript
// Clean data access interface
const winner = await tennisRepository.getTournamentWinner('Wimbledon', 2023);
const h2h = await tennisRepository.getHeadToHead('Federer', 'Nadal');
```

### 4. Service Layer (`src/services/`)

#### `queryService.js`
- **Purpose**: Business logic and query processing
- **Features**:
  - Intent recognition using Groq AI
  - Query routing
  - Response formatting
  - Error handling

```javascript
// Intelligent query processing
const result = await queryService.processQuery('Who won Wimbledon 2023?');
```

### 5. Handler Layer (`src/queryHandler.js`)

#### Enhanced Query Handler
- **Purpose**: Main interface and orchestration
- **Features**:
  - Initialization management
  - Health monitoring
  - System statistics
  - Graceful shutdown

## Docker Integration

### Environment Detection

The system automatically detects Docker environments through multiple indicators:

```javascript
// Automatic detection
const isDocker = (
  process.env.DATABASE_URL ||
  process.env.DB_HOST === 'db' ||
  process.env.NODE_ENV === 'production' ||
  process.env.DOCKER_ENV === 'true'
);
```

### Connection Configuration

#### Local Development
```javascript
{
  host: 'localhost',
  port: 5432,
  database: 'asktennis',
  user: 'postgres',
  password: 'password'
}
```

#### Docker Environment
```javascript
{
  host: 'db',  // Docker service name
  port: 5432,
  database: 'asktennis_local',
  user: 'postgres',
  password: 'postgres',
  ssl: false
}
```

## API Endpoints

### Enhanced Health Checks

#### `/api/health`
- Comprehensive system health
- Database connection status
- Cache statistics
- Performance metrics

#### `/api/status`
- System statistics
- Memory usage
- Database pool status
- Cache performance

#### `/api/database/status`
- Database connection details
- Pool statistics
- Reconnection attempts
- Environment information

### Cache Management

#### `POST /api/cache/clear`
- Clear all caches
- Reset query cache
- Repository cache cleanup

## Error Handling

### Connection Recovery

```javascript
// Automatic reconnection with exponential backoff
if (databaseConfig.isDocker && this.reconnectAttempts < this.maxReconnectAttempts) {
  await this.scheduleReconnect();
}
```

### Health Monitoring

```javascript
// Continuous health checks
setInterval(async () => {
  try {
    await this.testConnection();
  } catch (error) {
    // Attempt reconnection
  }
}, 30000);
```

## Performance Optimizations

### Connection Pooling

- **Max Connections**: 20 (Docker optimized)
- **Idle Timeout**: 30 seconds
- **Connection Timeout**: 10 seconds
- **Acquire Timeout**: 10 seconds

### Caching Strategy

- **Query Cache**: 10 minutes TTL
- **Repository Cache**: Per-query caching
- **Service Cache**: Intent recognition caching

### Query Optimization

- **Slow Query Detection**: Logs queries > 1 second
- **Parameterized Queries**: SQL injection prevention
- **Index Optimization**: Database-specific indexes

## Deployment

### Docker Compose

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: asktennis_local
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"

  app:
    build: .
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/asktennis_local
      DOCKER_ENV: true
```

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:pass@host:port/db
GROQ_API_KEY=your_groq_api_key

# Optional
SPORTRADAR_API_KEY=your_sportradar_key
DOCKER_ENV=true
LOG_LEVEL=info
```

## Monitoring

### Health Checks

```javascript
// System health
const health = await getHealthStatus();
// Returns: database status, cache stats, system info
```

### Performance Metrics

```javascript
// System statistics
const stats = await getSystemStats();
// Returns: memory usage, database pool, cache performance
```

## Migration Guide

### From Old Architecture

1. **Replace imports**:
   ```javascript
   // Old
   const { tennisQueryHandler } = require('./src/queryHandler');
   
   // New
   const { tennisQueryHandler, getHealthStatus } = require('./src/queryHandler');
   ```

2. **Update initialization**:
   ```javascript
   // Old
   await database.connect();
   
   // New
   await tennisQueryHandler.initialize();
   ```

3. **Add health endpoints**:
   ```javascript
   app.get('/api/health', async (req, res) => {
     const health = await getHealthStatus();
     res.json(health);
   });
   ```

## Benefits

### 1. **Docker-First Design**
- Automatic environment detection
- Optimized connection pooling
- Container-aware configuration

### 2. **Robust Error Handling**
- Automatic reconnection
- Health monitoring
- Graceful degradation

### 3. **Performance Optimized**
- Connection pooling
- Query caching
- Slow query detection

### 4. **Maintainable Architecture**
- Separation of concerns
- Clean interfaces
- Comprehensive logging

### 5. **Production Ready**
- Health checks
- Monitoring endpoints
- Graceful shutdown

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check Docker network connectivity
   - Verify environment variables
   - Check database service status

2. **Slow Queries**
   - Monitor `/api/status` endpoint
   - Check database indexes
   - Review query patterns

3. **Cache Issues**
   - Use `/api/cache/clear` endpoint
   - Check cache statistics
   - Monitor memory usage

### Debug Endpoints

- `/api/health` - System health
- `/api/status` - Performance metrics
- `/api/database/status` - Database details
- `/api/cache/clear` - Clear caches

## Future Enhancements

1. **Database Sharding**: Support for multiple database instances
2. **Query Analytics**: Advanced query performance tracking
3. **Auto-scaling**: Dynamic connection pool sizing
4. **Circuit Breaker**: Advanced failure handling
5. **Metrics Export**: Prometheus/Grafana integration
