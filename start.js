#!/usr/bin/env node

/**
 * Simple startup script for Railway deployment
 */

console.log('🚀 Starting AskTennis application...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', process.env.PORT || 5000);

// Check if we're in production and need to build the client
if (process.env.NODE_ENV === 'production') {
  console.log('📦 Building client for production...');
  const { execSync } = require('child_process');
  
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Client build completed');
  } catch (error) {
    console.error('❌ Client build failed:', error.message);
    console.log('⚠️  Continuing without client build...');
  }
}

// Start the server
console.log('🎾 Starting server...');
require('./server.js');
