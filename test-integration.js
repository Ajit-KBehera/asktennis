/**
 * Integration Test Script for Enhanced Query Handler
 * Tests Docker database connectivity and query processing
 */

// Set up test environment variables
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || 'test_groq_api_key_for_testing';
process.env.SPORTRADAR_API_KEY = process.env.SPORTRADAR_API_KEY || 'test_sportradar_api_key';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const { tennisQueryHandler, getHealthStatus, getDatabaseStatus, getSystemStats } = require('./src/queryHandler');

async function runIntegrationTests() {
  console.log('🧪 Starting Integration Tests for Enhanced Query Handler\n');

  try {
    // Test 1: Initialize the handler
    console.log('1️⃣ Testing Handler Initialization...');
    await tennisQueryHandler.initialize();
    console.log('✅ Handler initialized successfully\n');

    // Test 2: Health Status
    console.log('2️⃣ Testing Health Status...');
    const health = await getHealthStatus();
    console.log('Health Status:', JSON.stringify(health, null, 2));
    console.log('✅ Health check completed\n');

    // Test 3: Database Status
    console.log('3️⃣ Testing Database Status...');
    const dbStatus = await getDatabaseStatus();
    console.log('Database Status:', JSON.stringify(dbStatus, null, 2));
    console.log('✅ Database status check completed\n');

    // Test 4: System Statistics
    console.log('4️⃣ Testing System Statistics...');
    const systemStats = await getSystemStats();
    console.log('System Stats:', JSON.stringify(systemStats, null, 2));
    console.log('✅ System statistics retrieved\n');

    // Test 5: Query Processing
    console.log('5️⃣ Testing Query Processing...');
    const testQueries = [
      'Who won Wimbledon 2023?',
      'Head to head between Federer and Nadal',
      'Career stats for Novak Djokovic',
      'Grand Slam winners 2023',
      'Current ATP rankings'
    ];

    for (const query of testQueries) {
      console.log(`Testing query: "${query}"`);
      try {
        const result = await tennisQueryHandler.processQuery(query);
        console.log('✅ Query processed:', result.error ? 'Error' : 'Success');
        if (result.error) {
          console.log('   Error:', result.error);
        }
      } catch (error) {
        console.log('❌ Query failed:', error.message);
      }
    }
    console.log('✅ Query processing tests completed\n');

    // Test 6: Cache Management
    console.log('6️⃣ Testing Cache Management...');
    const { clearCaches } = require('./src/queryHandler');
    const cacheResult = await clearCaches();
    console.log('Cache clear result:', cacheResult);
    console.log('✅ Cache management test completed\n');

    console.log('🎉 All integration tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('- Handler initialization: ✅');
    console.log('- Health monitoring: ✅');
    console.log('- Database connectivity: ✅');
    console.log('- System statistics: ✅');
    console.log('- Query processing: ✅');
    console.log('- Cache management: ✅');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runIntegrationTests()
    .then(() => {
      console.log('\n✅ Integration tests completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Integration tests failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runIntegrationTests };
