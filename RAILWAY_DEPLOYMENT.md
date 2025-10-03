# 🚀 Railway Deployment Guide for AskTennis

## ✅ **Perplexity AI Integration Ready**

Your AskTennis application is now ready for Railway deployment with optional Perplexity AI integration.

## 🔧 **Environment Variables Setup**

### **Required Environment Variables:**

1. **Database Configuration:**
   ```bash
   DATABASE_URL=postgresql://username:password@host:port/database
   ```

2. **Server Configuration:**
   ```bash
   PORT=5000
   NODE_ENV=production
   ```

### **Optional Environment Variables:**

3. **Perplexity AI (Optional - for enhanced features):**
   ```bash
   PERPLEXITY_API_KEY=your_perplexity_api_key_here
   ```

4. **Sports Data APIs (Optional - for live data):**
   ```bash
   SPORTRADAR_API_KEY=your_sportradar_api_key_here
   SPORTSDATAIO_API_KEY=your_sportsdataio_api_key_here
   ```

## 🚀 **Railway Deployment Steps**

### **1. Connect Repository**
- Connect your GitHub repository to Railway
- Select the `Grounded-LLM-Perplexity-AI-Testing` branch

### **2. Configure Environment Variables**
In Railway dashboard:
1. Go to your project settings
2. Navigate to "Variables" tab
3. Add the following variables:

**Required:**
- `DATABASE_URL` - Your PostgreSQL connection string
- `NODE_ENV` - Set to `production`
- `PORT` - Railway will set this automatically

**Optional (for enhanced features):**
- `PERPLEXITY_API_KEY` - Get from [Perplexity AI](https://docs.perplexity.ai/getting-started/quickstart)
- `SPORTRADAR_API_KEY` - For live tennis data
- `SPORTSDATAIO_API_KEY` - For additional sports data

### **3. Deploy**
- Railway will automatically deploy when you push to the branch
- The application will start successfully even without optional API keys

## 🎾 **Application Features**

### **✅ Always Available:**
- Tennis statistics database queries
- CSV data processing
- Basic tennis information
- REST API endpoints

### **✅ With PERPLEXITY_API_KEY:**
- Real-time web search for tennis information
- Current rankings and results
- Enhanced AI-powered responses
- Live tennis news integration

### **✅ With Sports API Keys:**
- Live tournament data
- Real-time match results
- Current player rankings
- Tournament schedules

## 🔍 **Testing Your Deployment**

### **1. Basic Health Check:**
```bash
curl https://your-app.railway.app/api/health
```

### **2. Test Perplexity AI (if configured):**
```bash
curl https://your-app.railway.app/api/test-perplexity
```

### **3. Test Tennis Query:**
```bash
curl -X POST https://your-app.railway.app/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Who are the top 5 ATP players?"}'
```

## 📊 **Monitoring**

### **Console Logs:**
- ✅ `Perplexity AI initialized successfully` - API key configured
- ⚠️ `PERPLEXITY_API_KEY not configured` - Using basic features only
- ✅ `Database connected successfully` - Database working
- ⚠️ `Sportsradar API key not configured` - Live data disabled

### **Error Handling:**
- Application gracefully handles missing API keys
- Clear error messages for configuration issues
- Fallback to basic features when advanced APIs unavailable

## 🎯 **Next Steps**

1. **Deploy to Railway** - Your app is ready!
2. **Configure API Keys** - Add optional keys for enhanced features
3. **Test Endpoints** - Verify all functionality works
4. **Monitor Logs** - Check console for any issues

## 🚀 **Status: READY FOR DEPLOYMENT**

Your AskTennis application is now fully configured for Railway deployment with:
- ✅ Graceful error handling
- ✅ Optional Perplexity AI integration
- ✅ Database connectivity
- ✅ CSV data processing
- ✅ REST API endpoints

**Deploy with confidence!** 🎾
