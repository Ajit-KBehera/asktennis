#!/usr/bin/env node

/**
 * Deployment test script
 * Run with: node deploy-test.js
 */

require('dotenv').config();

async function testDeployment() {
  console.log('🧪 Testing Deployment Configuration');
  console.log('=====================================');

  // Test 1: Environment Variables
  console.log('\n1️⃣  Testing Environment Variables...');
  const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'REDIS_URL'
  ];

  const optionalEnvVars = [
    'GROQ_API_KEY',
    'SPORTRADAR_API_KEY',
    'SPORTSDATAIO_API_KEY'
  ];

  let envIssues = 0;

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar}: Set`);
    } else {
      console.log(`   ❌ ${envVar}: Missing (REQUIRED)`);
      envIssues++;
    }
  }

  for (const envVar of optionalEnvVars) {
    if (process.env[envVar] && process.env[envVar] !== `your_${envVar.toLowerCase()}_here`) {
      console.log(`   ✅ ${envVar}: Set`);
    } else {
      console.log(`   ⚠️  ${envVar}: Not configured (optional)`);
    }
  }

  if (envIssues > 0) {
    console.log(`\n❌ ${envIssues} required environment variables missing`);
    return false;
  }

  // Test 2: Dependencies
  console.log('\n2️⃣  Testing Dependencies...');
  try {
    require('express');
    require('pg');
    require('redis');
    require('groq-sdk');
    console.log('   ✅ All dependencies available');
  } catch (error) {
    console.log(`   ❌ Missing dependency: ${error.message}`);
    return false;
  }

  // Test 3: Database Connection
  console.log('\n3️⃣  Testing Database Connection...');
  try {
    const database = require('./src/database');
    await database.connect();
    console.log('   ✅ Database connection successful');
    await database.close();
  } catch (error) {
    console.log(`   ❌ Database connection failed: ${error.message}`);
    return false;
  }

  // Test 4: Cache Connection
  console.log('\n4️⃣  Testing Cache Connection...');
  try {
    const cache = require('./src/cache');
    await cache.connect();
    console.log('   ✅ Cache connection successful');
    await cache.close();
  } catch (error) {
    console.log(`   ❌ Cache connection failed: ${error.message}`);
    return false;
  }

  // Test 5: Server Startup
  console.log('\n5️⃣  Testing Server Startup...');
  try {
    const { app } = require('./server');
    console.log('   ✅ Server module loads successfully');
  } catch (error) {
    console.log(`   ❌ Server startup failed: ${error.message}`);
    return false;
  }

  console.log('\n🎉 All deployment tests passed!');
  console.log('\n📋 Deployment Checklist:');
  console.log('   ✅ Environment variables configured');
  console.log('   ✅ Dependencies installed');
  console.log('   ✅ Database connection working');
  console.log('   ✅ Cache connection working');
  console.log('   ✅ Server module loads');

  return true;
}

// Run the test
testDeployment().then(success => {
  if (success) {
    console.log('\n🚀 Ready for deployment!');
    process.exit(0);
  } else {
    console.log('\n❌ Deployment test failed. Please fix the issues above.');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 Test failed with error:', error.message);
  process.exit(1);
});
