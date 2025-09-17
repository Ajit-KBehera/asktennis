# Railway Deployment Checklist

## ✅ Completed Steps
- [x] Created `railway-deployment-test` branch
- [x] Added Railway configuration files (`railway.json`, `Procfile`)
- [x] Updated `package.json` for production deployment
- [x] Configured database to use Railway's `DATABASE_URL`
- [x] Added production static file serving for React app
- [x] Created comprehensive deployment guide
- [x] Committed and pushed changes to GitHub

## 🚀 Next Steps (Manual Actions Required)

### 1. Create Railway Account & Project
- [ ] Sign up at [railway.app](https://railway.app)
- [ ] Create new project from GitHub repo
- [ ] Select `railway-deployment-test` branch

### 2. Add Database Services
- [ ] Add PostgreSQL database service
- [ ] Add Redis cache service
- [ ] Note down connection details

### 3. Configure Environment Variables
Set these in Railway dashboard:
- [ ] `NODE_ENV=production`
- [ ] `GROQ_API_KEY=your_actual_groq_api_key`
- [ ] `JWT_SECRET=your_secure_jwt_secret`
- [ ] Optional: `SPORTRADAR_API_KEY`, `SPORTSDATAIO_API_KEY`

### 4. Deploy & Test
- [ ] Monitor deployment logs
- [ ] Test health endpoint: `/api/health`
- [ ] Test Groq API: `/api/test-groq`
- [ ] Test frontend functionality

### 5. Cleanup (if needed)
- [ ] Delete Railway project if deployment fails
- [ ] Delete `railway-deployment-test` branch
- [ ] Start over with new approach

## 📋 Environment Variables Reference

### Required:
```
NODE_ENV=production
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET=your_jwt_secret_here
```

### Auto-provided by Railway:
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
PORT=5000
```

### Optional:
```
SPORTRADAR_API_KEY=your_sportradar_api_key
SPORTSDATAIO_API_KEY=your_sportsdataio_api_key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

## 🔗 Useful Links
- [Railway Dashboard](https://railway.app/dashboard)
- [Railway Documentation](https://docs.railway.app)
- [Your GitHub Repository](https://github.com/Ajit-KBehera/asktennis)
- [Railway Deployment Guide](./RAILWAY_DEPLOYMENT.md)
