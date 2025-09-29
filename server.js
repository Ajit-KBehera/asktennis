const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const { tennisQueryHandler, getHealthStatus, getDatabaseStatus, clearCaches, getSystemStats } = require('./src/queryHandler');
const databaseConnection = require('./src/database/connection');
const csvDataLoader = require('./src/csvDataLoader');

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
    const { question, query, userId } = req.body;
    const actualQuestion = question || query;
    console.log('Question:', actualQuestion);
    
    if (!actualQuestion || actualQuestion.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Please provide a valid question' 
      });
    }


    // Process the query
    console.log('About to call tennisQueryHandler.processQuery');
    const result = await tennisQueryHandler.processQuery(actualQuestion, userId);
    console.log('Result from processQuery:', result);
    

    res.json({
      question: actualQuestion,
      answer: result,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Query processing error:', error);
    res.status(500).json({ 
      error: 'Sorry, I encountered an error processing your question. Please try again.' 
    });
  }
});

// Enhanced health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const healthStatus = await getHealthStatus();
    res.json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
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


// Test endpoint to verify server is running updated code
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is running updated code',
    timestamp: new Date().toISOString(),
    hasGroqKey: !!process.env.GROQ_API_KEY
  });
});

// CSV data loading endpoints
app.get('/api/data/status', (req, res) => {
  try {
    const status = csvDataLoader.getStatus();
    res.json({
      success: true,
      message: 'CSV data loading system active',
      dataSource: 'local_csv',
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/data/load', async (req, res) => {
  try {
    console.log('🔄 CSV data loading requested via API');
    const result = await csvDataLoader.loadAllData();
    res.json({
      success: true,
      message: 'CSV data loading completed',
      dataSource: 'local_csv',
      ...result
    });
  } catch (error) {
    console.error('CSV data loading failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/data/test', async (req, res) => {
  try {
    // Test database connection and data availability
    const dbStatus = await getDatabaseStatus();
    res.json({
      success: true,
      configured: true,
      database: dbStatus,
      message: 'Local CSV data system active'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      configured: false
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

// Enhanced system status endpoint
app.get('/api/status', async (req, res) => {
  try {
    const systemStats = await getSystemStats();
    res.json(systemStats);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Load sample data endpoint
app.post('/api/data/load-sample', async (req, res) => {
  try {
    console.log('📝 Loading sample data...');
    await csvDataLoader.createSampleData();
    res.json({
      success: true,
      message: 'Sample data created successfully',
      dataSource: 'sample_csv'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create sample data',
      error: error.message
    });
  }
});

// Database status endpoint
app.get('/api/database/status', async (req, res) => {
  try {
    const dbStatus = await getDatabaseStatus();
    res.json(dbStatus);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Clear caches endpoint
app.post('/api/cache/clear', async (req, res) => {
  try {
    const result = await clearCaches();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
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

// Serve static files from React build (both production and development)
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

const PORT = process.env.PORT || 5000;

// Initialize database connection and query handler
async function initialize() {
  try {
    // Initialize the enhanced query handler (includes database connection)
    await tennisQueryHandler.initialize();
    console.log('✅ Enhanced query handler initialized');
    
    // Initialize CSV data loading system
    console.log('📊 CSV data loading system ready');
    
    // Create sample data if none exists
    if (!csvDataLoader.hasCSVData()) {
      console.log('📝 Creating sample CSV data...');
      await csvDataLoader.createSampleData();
    }
    
    // Check if CSV data is available but don't auto-load
    if (csvDataLoader.hasCSVData()) {
      console.log('📁 Complete tennis dataset available (1.05GB)');
      console.log('⚠️  Auto-loading disabled due to memory constraints');
      console.log('💡 Use /api/data/load endpoint to load data manually');
      console.log('💡 Or use /api/data/load-sample to load sample data first');
    }
    
    console.log('✅ Local database with CSV data active');
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
