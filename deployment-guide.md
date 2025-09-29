# AskTennis Enhanced Architecture - Deployment Guide

## 🚀 Production Deployment Steps

### Step 1: Environment Configuration

Create a `.env` file in your project root with the following configuration:

```bash
# Production Environment Configuration
PORT=5000
NODE_ENV=production
CLIENT_URL=http://localhost:3000

# Database Configuration for Docker
DATABASE_URL=postgresql://postgres:postgres@db:5432/asktennis_local?sslmode=disable
DB_HOST=db
DB_PORT=5432
DB_NAME=asktennis_local
DB_USER=postgres
DB_PASSWORD=postgres

# Docker Environment Detection
DOCKER_ENV=true

# Groq Configuration (REQUIRED - Get your API key from https://console.groq.com/)
GROQ_API_KEY=your_actual_groq_api_key_here

# External API Keys (Optional - for live data)
SPORTRADAR_API_KEY=your_sportradar_api_key_here
SPORTSDATAIO_API_KEY=your_sportsdataio_api_key_here

# Security
JWT_SECRET=your_secure_jwt_secret_here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### Step 2: Get Required API Keys

#### Groq API Key (Required)
1. Visit [https://console.groq.com/](https://console.groq.com/)
2. Sign up for a free account
3. Generate an API key
4. Replace `your_actual_groq_api_key_here` in your `.env` file

#### Sportsradar API Key (Optional)
1. Visit [https://sportsdata.io/](https://sportsdata.io/) or [https://sportradar.com/](https://sportradar.com/)
2. Sign up for an account
3. Get your API key for tennis data
4. Replace `your_sportradar_api_key_here` in your `.env` file

### Step 3: Docker Deployment

#### Option A: Using Docker Compose (Recommended)

```bash
# Start the services
docker-compose -f docker-compose.local.yml up -d

# Check service status
docker-compose -f docker-compose.local.yml ps

# View logs
docker-compose -f docker-compose.local.yml logs -f
```

#### Option B: Manual Docker Deployment

```bash
# Build the application image
docker build -f Dockerfile.local -t asktennis-app .

# Start PostgreSQL database
docker run -d \
  --name asktennis-db \
  -e POSTGRES_DB=asktennis_local \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine

# Start the application
docker run -d \
  --name asktennis-app \
  --link asktennis-db:db \
  -p 5000:5000 \
  --env-file .env \
  asktennis-app
```

### Step 4: Verify Deployment

#### Health Check
```bash
curl http://localhost:5000/api/health
```

#### System Status
```bash
curl http://localhost:5000/api/status
```

#### Database Status
```bash
curl http://localhost:5000/api/database/status
```

#### Test Query
```bash
curl -X POST http://localhost:5000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Who won Wimbledon 2023?"}'
```

### Step 5: Monitoring Setup

#### Health Monitoring
- **Health Endpoint**: `GET /api/health`
- **System Status**: `GET /api/status`
- **Database Status**: `GET /api/database/status`

#### Performance Monitoring
- **Cache Statistics**: Included in health endpoint
- **Database Pool Stats**: Included in database status
- **System Metrics**: Memory usage, uptime, etc.

#### Log Monitoring
```bash
# View application logs
docker-compose -f docker-compose.local.yml logs -f app

# View database logs
docker-compose -f docker-compose.local.yml logs -f db
```

### Step 6: Production Optimizations

#### Database Optimization
- Connection pooling is already configured
- Health monitoring with automatic reconnection
- Query optimization with slow query detection

#### Caching Strategy
- Query result caching (10 minutes TTL)
- Repository-level caching
- Service-level caching for intent recognition

#### Security
- Rate limiting configured
- Input validation
- SQL injection prevention with parameterized queries

### Step 7: Scaling Considerations

#### Horizontal Scaling
- Stateless application design
- Database connection pooling
- Load balancer ready

#### Vertical Scaling
- Memory usage monitoring
- CPU usage monitoring
- Database connection pool tuning

### Step 8: Troubleshooting

#### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database status
   curl http://localhost:5000/api/database/status
   
   # Check Docker logs
   docker-compose -f docker-compose.local.yml logs db
   ```

2. **Groq API Issues**
   ```bash
   # Test Groq API
   curl http://localhost:5000/api/test-groq
   ```

3. **Application Not Starting**
   ```bash
   # Check application logs
   docker-compose -f docker-compose.local.yml logs app
   ```

#### Performance Issues

1. **Slow Queries**
   - Check database status endpoint
   - Monitor slow query logs
   - Optimize database indexes

2. **High Memory Usage**
   - Check system status endpoint
   - Monitor cache statistics
   - Clear caches if needed: `POST /api/cache/clear`

### Step 9: Maintenance

#### Regular Maintenance
- Monitor health endpoints
- Check database performance
- Clear caches periodically
- Update API keys as needed

#### Backup Strategy
- Database backups
- Environment configuration backup
- Application logs backup

### Step 10: Production Checklist

- [ ] Environment variables configured
- [ ] API keys set up
- [ ] Docker services running
- [ ] Health checks passing
- [ ] Database connected
- [ ] Query processing working
- [ ] Monitoring set up
- [ ] Security configured
- [ ] Performance optimized
- [ ] Backup strategy in place

## 🎯 Success Metrics

Your deployment is successful when:
- All health checks return "healthy"
- Database connection is stable
- Query processing works correctly
- API endpoints respond quickly
- System metrics are within normal ranges

## 📞 Support

If you encounter issues:
1. Check the health endpoints
2. Review Docker logs
3. Verify environment configuration
4. Test individual components
5. Use the provided troubleshooting guide
