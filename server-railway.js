#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Import services
const enhancedQueryHandler = require('./src/enhancedQueryHandler');
const enhancedDataSync = require('./src/enhancedDataSync');
const { fixRailwayDatabase } = require('./fix-railway-database');
const { cleanupDatabase } = require('./railway-data-processor');

const app = express();
const PORT = process.env.PORT || 3000;

// Railway-specific middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 
    ['https://asktennis.railway.app', 'https://*.railway.app'] : 
    true,
  credentials: true
}));

// Rate limiting for Railway
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

if (process.env.ENABLE_RATE_LIMITING !== 'false') {
  app.use('/api/', limiter);
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'client/build')));

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    railway: {
      environment: process.env.RAILWAY_ENVIRONMENT,
      gitCommit: process.env.RAILWAY_GIT_COMMIT_SHA,
      gitBranch: process.env.RAILWAY_GIT_BRANCH
    }
  });
});

// API Routes
app.post('/api/query', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    console.log(`🎾 Query received: ${question}`);
    
    const answer = await enhancedQueryHandler.handleQuery(question);
    
    res.json({
      question,
      answer,
      timestamp: new Date().toISOString(),
      source: 'enhanced_query_handler'
    });
    
  } catch (error) {
    console.error('❌ Query error:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Data sync endpoint
app.post('/api/sync', async (req, res) => {
  try {
    console.log('🔄 Manual data sync requested');
    
    const syncResult = await enhancedDataSync.syncAllData();
    
    res.json({
      message: 'Data sync completed',
      result: syncResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Sync error:', error.message);
    res.status(500).json({ 
      error: 'Sync failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Data sync failed'
    });
  }
});

// Database fix endpoint (Railway specific)
app.post('/api/fix-database', async (req, res) => {
  try {
    console.log('🔧 Database fix requested');
    
    await fixRailwayDatabase();
    await cleanupDatabase();
    
    res.json({
      message: 'Database fixed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Database fix error:', error.message);
    res.status(500).json({ 
      error: 'Database fix failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Database fix failed'
    });
  }
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting AskTennis server for Railway...');
    
    // Fix database schema on startup
    console.log('🔧 Fixing database schema...');
    await fixRailwayDatabase();
    
    // Clean up database
    console.log('🧹 Cleaning up database...');
    await cleanupDatabase();
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🎾 AskTennis server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🚂 Railway: ${process.env.RAILWAY_ENVIRONMENT || 'local'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
