const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const tennisQueryHandler = require('./src/queryHandler');
const database = require('./src/database');
const cache = require('./src/cache');
const dataSync = require('./src/dataSync');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.post('/api/query', async (req, res) => {
  try {
    console.log('=== QUERY ENDPOINT CALLED ===');
    console.log('Request body:', req.body);
    const { question, userId } = req.body;
    console.log('Question:', question);
    
    if (!question || question.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Please provide a valid question' 
      });
    }

    // Check cache first (but skip for ranking queries to ensure fresh data)
    const lowerQuestion = question.toLowerCase().trim();
    const isRankingQuery = lowerQuestion.includes('ranking') || lowerQuestion.includes('rank') || 
                          lowerQuestion.includes('#1') || lowerQuestion.includes('current');
    
    let cachedResult = null;
    if (!isRankingQuery) {
      const cacheKey = `query:${lowerQuestion}`;
      cachedResult = await cache.get(cacheKey);
      
      if (cachedResult) {
        return res.json({
          question,
          answer: cachedResult.answer,
          data: cachedResult.data,
          cached: true,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Process the query
    console.log('About to call tennisQueryHandler.processQuery');
    const result = await tennisQueryHandler.processQuery(question, userId);
    console.log('Result from processQuery:', result);
    
    // Cache the result for 1 hour (but not for ranking queries)
    if (!isRankingQuery) {
      const cacheKey = `query:${lowerQuestion}`;
      await cache.set(cacheKey, {
        answer: result.answer,
        data: result.data
      }, 3600);
    }

    res.json({
      question,
      answer: result.answer,
      data: result.data,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Query processing error:', error);
    res.status(500).json({ 
      error: 'Sorry, I encountered an error processing your question. Please try again.' 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Cache management endpoints
app.post('/api/cache/clear', async (req, res) => {
  try {
    await cache.flush();
    res.json({ 
      success: true, 
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

app.get('/api/cache/stats', async (req, res) => {
  try {
    const stats = await cache.getStats();
    res.json({ 
      success: true, 
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get cache stats',
      message: error.message
    });
  }
});

// Simple health check for Railway
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Debug endpoint to check environment variables
app.get('/api/debug', (req, res) => {
  res.json({
    hasGroqKey: !!process.env.GROQ_API_KEY,
    keyPrefix: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 10) + '...' : 'undefined',
    isPlaceholder: process.env.GROQ_API_KEY === 'your_groq_api_key_here',
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('GROQ'))
  });
});

// Clear cache endpoint
app.post('/api/clear-cache', async (req, res) => {
  try {
    await cache.flush();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Test endpoint to verify server is running updated code
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is running updated code',
    timestamp: new Date().toISOString(),
    hasGroqKey: !!process.env.GROQ_API_KEY
  });
});

// Data sync endpoints
app.get('/api/sync/status', (req, res) => {
  try {
    const status = dataSync.getSyncStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/sync/force', async (req, res) => {
  try {
    console.log('🔄 Force sync requested via API');
    const result = await dataSync.forceSync();
    res.json(result);
  } catch (error) {
    console.error('Force sync failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/sync/test', async (req, res) => {
  try {
    const sportsradar = require('./src/sportsradar');
    if (!sportsradar.isConfigured()) {
      return res.json({
        success: false,
        error: 'Sportsradar API key not configured',
        configured: false
      });
    }

    // Test API connection
    const testData = await sportsradar.getATPRankings();
    res.json({
      success: true,
      configured: true,
      testData: testData ? testData.slice(0, 3) : null, // Return first 3 rankings as test
      message: 'Sportsradar API connection successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      configured: true
    });
  }
});

// Debug endpoint to check build files
app.get('/api/debug-build', (req, res) => {
  const fs = require('fs');
  const buildPath = path.join(__dirname, 'client/build');
  const indexPath = path.join(buildPath, 'index.html');
  const staticPath = path.join(buildPath, 'static');
  
  try {
    const buildExists = fs.existsSync(buildPath);
    const indexExists = fs.existsSync(indexPath);
    const staticExists = fs.existsSync(staticPath);
    const buildContents = buildExists ? fs.readdirSync(buildPath) : [];
    const staticContents = staticExists ? fs.readdirSync(staticPath) : [];
    
    res.json({
      buildPath,
      buildExists,
      indexExists,
      staticExists,
      buildContents,
      staticContents,
      nodeEnv: process.env.NODE_ENV
    });
  } catch (error) {
    res.json({
      error: error.message,
      buildPath,
      nodeEnv: process.env.NODE_ENV
    });
  }
});

// Test endpoint to serve JS file directly
app.get('/api/test-js', (req, res) => {
  const fs = require('fs');
  const jsPath = path.join(__dirname, 'client/build/static/js/main.11060174.js');
  
  try {
    if (fs.existsSync(jsPath)) {
      res.setHeader('Content-Type', 'application/javascript');
      res.send(fs.readFileSync(jsPath, 'utf8'));
    } else {
      res.status(404).json({ error: 'JS file not found', path: jsPath });
    }
  } catch (error) {
    res.status(500).json({ error: error.message, path: jsPath });
  }
});

// Test Groq API key directly
app.get('/api/test-groq', async (req, res) => {
  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
    
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: "Say 'Groq API is working' if you can read this."
        }
      ],
      max_tokens: 10
    });
    
    res.json({ 
      success: true,
      message: 'Groq API is working!',
      response: response.choices[0].message.content
    });
  } catch (error) {
    res.json({ 
      success: false,
      error: error.message,
      code: error.code,
      status: error.status
    });
  }
});

// WebSocket connection for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!' 
  });
});

// Serve static files from React build in production (AFTER API routes)
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, 'client/build');
  const indexPath = path.join(buildPath, 'index.html');
  
  // Check if build files exist
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    console.log('Serving static files from:', buildPath);
    
    // Serve static files with explicit path handling
    app.use('/static', express.static(path.join(buildPath, 'static')));
    app.use(express.static(buildPath));
    
    // Catch-all handler: send back React's index.html file for SPA routing
    app.get('*', (req, res) => {
      console.log('Catch-all route triggered for:', req.url);
      res.sendFile(indexPath);
    });
  } else {
    console.log('⚠️  Build files not found, serving API-only mode');
    
    // Fallback: serve a simple HTML page
    app.get('*', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>AskTennis API</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 600px; margin: 0 auto; }
            .status { color: #28a745; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎾 AskTennis API</h1>
            <p class="status">✅ API is running successfully!</p>
            <p>Client build files are not available. This is normal during deployment.</p>
            <p>API endpoints are available at <code>/api/*</code></p>
            <p>Health check: <a href="/health">/health</a></p>
          </div>
        </body>
        </html>
      `);
    });
  }
} else {
  // 404 handler for development
  app.use('*', (req, res) => {
    res.status(404).json({ 
      error: 'Endpoint not found' 
    });
  });
}

const PORT = process.env.PORT || 5000;

// Initialize database and cache connections
async function initialize() {
  try {
    await database.connect();
    await cache.connect();
    console.log('Database and cache connections established');
    
    // Start auto-sync if Sportsradar is configured (non-blocking)
    if (dataSync.isSportsradarAvailable()) {
      console.log('🔄 Starting automatic data synchronization...');
      // Don't await this - let it run in background
      dataSync.startAutoSync().catch(error => {
        console.error('Auto-sync failed (non-critical):', error.message);
      });
    } else {
      console.log('⚠️  Sportsradar not configured - using static data only');
    }
  } catch (error) {
    console.error('Failed to initialize connections:', error);
    // Don't exit - continue with limited functionality
    console.log('⚠️  Continuing with limited functionality...');
  }
}

// Start server
server.listen(PORT, () => {
  console.log(`🎾 AskTennis server running on port ${PORT}`);
  initialize();
});

module.exports = { app, io };
