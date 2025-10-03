# 🔑 Railway Environment Variables Setup Guide

## 🎯 **How to Add PERPLEXITY_API_KEY in Railway**

### **Step 1: Get Your Perplexity API Key**

1. **Visit Perplexity AI API Portal:**
   - Go to: https://docs.perplexity.ai/getting-started/quickstart
   - Sign up or log in to your Perplexity AI account

2. **Create API Key:**
   - Navigate to your API dashboard
   - Click "Create API Key" or "Generate New Key"
   - Copy the generated API key (starts with `pplx-...`)
   - **Important**: Save this key securely - you won't see it again!

### **Step 2: Add Environment Variable in Railway**

#### **Method 1: Railway Dashboard (Recommended)**

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app/dashboard
   - Select your AskTennis project

2. **Navigate to Variables:**
   - Click on your project
   - Go to the "Variables" tab (usually in the left sidebar)
   - Or click on "Settings" → "Variables"

3. **Add New Variable:**
   - Click "New Variable" or "+" button
   - **Variable Name**: `PERPLEXITY_API_KEY`
   - **Value**: Paste your API key (e.g., `pplx-abc123def456...`)
   - Click "Add" or "Save"

#### **Method 2: Railway CLI (Alternative)**

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Link to Your Project:**
   ```bash
   railway link
   ```

4. **Set Environment Variable:**
   ```bash
   railway variables set PERPLEXITY_API_KEY=your_api_key_here
   ```

### **Step 3: Verify the Setup**

1. **Check Variables Tab:**
   - In Railway dashboard, go to Variables
   - You should see: `PERPLEXITY_API_KEY` = `pplx-...`

2. **Redeploy (if needed):**
   - Railway automatically redeploys when you add variables
   - Or manually trigger: "Deploy" button

3. **Check Logs:**
   - Go to "Deployments" tab
   - Click on latest deployment
   - Look for: `✅ Perplexity AI initialized successfully`

### **Step 4: Test the Integration**

#### **Test Perplexity AI Connection:**
```bash
curl https://your-app.railway.app/api/test-perplexity
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Perplexity AI connection successful",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### **Test Enhanced Tennis Query:**
```bash
curl -X POST https://your-app.railway.app/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Who won the latest Grand Slam tournament?"}'
```

## 🎾 **Enhanced Features You'll Get**

### **✅ With PERPLEXITY_API_KEY Configured:**

1. **Real-time Tennis Information:**
   - Current ATP/WTA rankings
   - Recent match results
   - Live tournament updates
   - Player news and updates

2. **Web Search Integration:**
   - Access to latest tennis data
   - Source citations for information
   - Factual accuracy with web verification
   - Current tournament standings

3. **Enhanced AI Responses:**
   - More accurate and up-to-date answers
   - Integration with live tennis data
   - Better context understanding
   - Real-time information processing

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **"Perplexity AI is not available" Error:**
   - Check if `PERPLEXITY_API_KEY` is set in Railway
   - Verify the API key is correct (starts with `pplx-`)
   - Check Railway logs for initialization messages

2. **API Key Not Working:**
   - Ensure you copied the full API key
   - Check for extra spaces or characters
   - Verify the key is active in Perplexity dashboard

3. **Still Getting Basic Features:**
   - Wait for Railway to redeploy (can take 1-2 minutes)
   - Check console logs for initialization messages
   - Test with `/api/test-perplexity` endpoint

### **Console Log Messages:**

**✅ Success:**
```
✅ Perplexity AI initialized successfully
```

**❌ Missing API Key:**
```
⚠️  PERPLEXITY_API_KEY not configured. Perplexity AI features will be disabled.
```

**❌ Invalid API Key:**
```
❌ Failed to initialize Perplexity AI: Invalid API key
```

## 🚀 **Quick Setup Checklist**

- [ ] Get Perplexity API key from https://docs.perplexity.ai/
- [ ] Go to Railway dashboard → Your project → Variables
- [ ] Add `PERPLEXITY_API_KEY` with your API key
- [ ] Wait for automatic redeploy
- [ ] Test with `/api/test-perplexity`
- [ ] Try enhanced tennis queries
- [ ] Check logs for success messages

## 💡 **Pro Tips**

1. **API Key Security:**
   - Never commit API keys to git
   - Use Railway's secure environment variables
   - Rotate keys periodically for security

2. **Cost Management:**
   - Perplexity AI has usage-based pricing
   - Monitor your API usage in their dashboard
   - Set up usage alerts if needed

3. **Performance:**
   - Enhanced features may have slightly higher response times
   - Web search adds 1-3 seconds to responses
   - Consider caching for frequently asked questions

## 🎯 **You're All Set!**

Once you add the `PERPLEXITY_API_KEY` environment variable in Railway:

- ✅ Your app will automatically redeploy
- ✅ Perplexity AI will initialize on startup
- ✅ Enhanced tennis features will be available
- ✅ Real-time web search will work
- ✅ You'll get more accurate, up-to-date responses

**Your AskTennis app will be supercharged with real-time tennis intelligence!** 🚀🎾
