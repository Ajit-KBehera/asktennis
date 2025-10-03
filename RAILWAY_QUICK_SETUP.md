# 🚀 Railway Quick Setup - PERPLEXITY_API_KEY

## 📋 **5-Minute Setup Guide**

### **Step 1: Get Perplexity API Key (2 minutes)**

1. **Go to Perplexity AI:**
   ```
   https://docs.perplexity.ai/getting-started/quickstart
   ```

2. **Sign up/Login and get API key:**
   - Create account or login
   - Go to API dashboard
   - Click "Create API Key"
   - Copy the key (starts with `pplx-...`)

### **Step 2: Add to Railway (2 minutes)**

1. **Open Railway Dashboard:**
   ```
   https://railway.app/dashboard
   ```

2. **Navigate to Variables:**
   - Click your AskTennis project
   - Click "Variables" tab (left sidebar)
   - OR: Settings → Variables

3. **Add the Variable:**
   ```
   Variable Name: PERPLEXITY_API_KEY
   Value: pplx-your-api-key-here
   ```

4. **Save and Deploy:**
   - Click "Add" or "Save"
   - Railway auto-redeploys
   - Wait 1-2 minutes

### **Step 3: Test (1 minute)**

1. **Check if it worked:**
   ```bash
   curl https://your-app.railway.app/api/test-perplexity
   ```

2. **Look for success message:**
   ```json
   {
     "status": "success",
     "message": "Perplexity AI connection successful"
   }
   ```

## 🎯 **That's It!**

Your AskTennis app now has:
- ✅ Real-time tennis data
- ✅ Current rankings
- ✅ Live tournament info
- ✅ Enhanced AI responses

## 🔍 **Troubleshooting**

**If it doesn't work:**
1. Check Railway logs for: `✅ Perplexity AI initialized successfully`
2. Verify API key format: `pplx-...`
3. Wait for redeploy (1-2 minutes)
4. Test with `/api/test-perplexity`

**Need help?** Check the full guide: `RAILWAY_ENV_SETUP.md`
