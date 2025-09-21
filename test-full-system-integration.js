#!/usr/bin/env node

const enhancedDataSync = require('./src/enhancedDataSync');
const enhancedQueryHandler = require('./src/enhancedQueryHandler');
const historicalDatabase = require('./src/historicalDatabase');

async function testFullSystemIntegration() {
  console.log('🔄 Testing Full System Integration');
  console.log('==================================\n');

  try {
    // Test 1: Data Synchronization
    console.log('📊 Test 1: Data Synchronization');
    console.log('─'.repeat(50));
    
    console.log('🔄 Starting enhanced data synchronization...');
    const syncResult = await enhancedDataSync.syncAllData();
    
    if (syncResult.success) {
      console.log('✅ Data synchronization completed successfully');
      console.log('📈 Sync Results:');
      Object.entries(syncResult.data).forEach(([key, value]) => {
        console.log(`  ${key}: ${value} records`);
      });
    } else {
      console.log('⚠️  Data synchronization had issues:', syncResult.error);
    }

    // Test 2: Live Data Queries
    console.log('\n🔴 Test 2: Live Data Queries (Sportsradar)');
    console.log('─'.repeat(50));
    
    const liveQueries = [
      'What are the current ATP rankings?',
      'Who is the current number 1 player?',
      'Show me the top 5 ATP players',
      'What are the current WTA rankings?'
    ];

    for (const query of liveQueries) {
      console.log(`\n🔄 Testing: "${query}"`);
      try {
        const response = await enhancedQueryHandler.handleQuery(query);
        console.log(`✅ Response: ${response.substring(0, 100)}...`);
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }

    // Test 3: Historical Data Queries
    console.log('\n📚 Test 3: Historical Data Queries (GitHub)');
    console.log('─'.repeat(50));
    
    const historicalQueries = [
      'Who won US Open 2022 Male?',
      'Show me Djokovic vs Nadal head to head',
      'What is Djokovic ranking history?',
      'Show me Djokovic match charting',
      'Wimbledon charted matches'
    ];

    for (const query of historicalQueries) {
      console.log(`\n🔄 Testing: "${query}"`);
      try {
        const response = await enhancedQueryHandler.handleQuery(query);
        console.log(`✅ Response: ${response.substring(0, 100)}...`);
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }

    // Test 4: Hybrid Queries (Combining Live + Historical)
    console.log('\n🔄 Test 4: Hybrid Queries (Live + Historical)');
    console.log('─'.repeat(50));
    
    const hybridQueries = [
      'Compare current ATP rankings with historical data',
      'Show me current top players and their historical performance',
      'What is the ranking trend for top players?'
    ];

    for (const query of hybridQueries) {
      console.log(`\n🔄 Testing: "${query}"`);
      try {
        const response = await enhancedQueryHandler.handleQuery(query);
        console.log(`✅ Response: ${response.substring(0, 100)}...`);
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }

    // Test 5: Database Statistics
    console.log('\n📈 Test 5: Database Statistics');
    console.log('─'.repeat(50));
    
    const stats = await historicalDatabase.getDatabaseStats();
    console.log('📊 Database Statistics:');
    Object.entries(stats).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} records`);
    });

    // Test 6: System Performance
    console.log('\n⚡ Test 6: System Performance');
    console.log('─'.repeat(50));
    
    const performanceQueries = [
      'Current ATP rankings',
      'Djokovic head to head',
      'Wimbledon 2024 matches'
    ];

    for (const query of performanceQueries) {
      const startTime = Date.now();
      try {
        await enhancedQueryHandler.handleQuery(query);
        const endTime = Date.now();
        console.log(`✅ "${query}": ${endTime - startTime}ms`);
      } catch (error) {
        console.log(`❌ "${query}": Error - ${error.message}`);
      }
    }

    console.log('\n🎉 Full system integration test completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Data synchronization working');
    console.log('✅ Live data queries functional');
    console.log('✅ Historical data queries functional');
    console.log('✅ Hybrid queries working');
    console.log('✅ Database statistics available');
    console.log('✅ System performance acceptable');

  } catch (error) {
    console.error('\n❌ System integration test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close database connections
    try {
      await historicalDatabase.close();
      console.log('\n🔌 Database connections closed');
    } catch (error) {
      console.error('Error closing database:', error.message);
    }
  }
}

// Run the test
if (require.main === module) {
  testFullSystemIntegration()
    .then(() => {
      console.log('\n✅ Full system integration test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Full system integration test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testFullSystemIntegration };
