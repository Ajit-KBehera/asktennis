# 🛠️ AskTennis Scripts

This directory contains utility scripts for deployment, maintenance, and development tasks.

## 📁 Scripts Overview

### **`deploy-test.js`** - Deployment Validation Script
**Purpose**: Pre-deployment validation and environment checks

**What it tests:**
- ✅ Environment variables configuration
- ✅ Dependencies availability
- ✅ Database connectivity
- ✅ Cache connection
- ✅ Server module loading

**Usage:**
```bash
node scripts/deploy-test.js
```

**When to use:**
- Before deploying to Railway
- After environment changes
- Troubleshooting deployment issues
- CI/CD pipeline validation

### **`deploy.sh`** - Deployment Script
**Purpose**: Automated deployment commands

**Usage:**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## 🚀 Deployment Workflow

1. **Run deployment test**: `node scripts/deploy-test.js`
2. **Fix any issues** reported by the test
3. **Deploy to Railway**: Push to main branch
4. **Verify deployment**: Check Railway logs

## 🔧 Development Scripts

These scripts help with:
- **Environment validation** before deployment
- **Dependency checking** 
- **Service connectivity** testing
- **Deployment automation**

## 📋 Script Categories

- **Deployment**: Pre-deployment validation and automation
- **Maintenance**: Database seeding, data sync
- **Development**: Local setup and testing
