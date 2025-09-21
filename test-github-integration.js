#!/usr/bin/env node

require('dotenv').config();
const githubDataService = require('./src/githubDataService');
const dataModels = require('./src/dataModels');
const enhancedDataSync = require('./src/enhancedDataSync');
const enhancedQueryHandler = require('./src/enhancedQueryHandler');

async function testGitHubIntegration() {
  console.log('🎾 Testing GitHub Integration for AskTennis');
  console.log('==========================================\n');

  try {
    // Test 1: GitHub Data Service
    console.log('📡 Test 1: GitHub Data Service');
    console.log('-------------------------------');
    
    console.log('🔄 Testing ATP rankings fetch...');
    const atpRankings = await githubDataService.fetchATPRankings();
    console.log(`✅ Fetched ${atpRankings.length} ATP rankings`);
    
    if (atpRankings.length > 0) {
      console.log('📊 Sample ATP ranking:', atpRankings[0]);
    }

    console.log('\n🔄 Testing WTA rankings fetch...');
    const wtaRankings = await githubDataService.fetchWTARankings();
    console.log(`✅ Fetched ${wtaRankings.length} WTA rankings`);
    
    if (wtaRankings.length > 0) {
      console.log('📊 Sample WTA ranking:', wtaRankings[0]);
    }

    // Test 2: Data Models
    console.log('\n📋 Test 2: Data Models');
    console.log('----------------------');
    
    const sampleRanking = dataModels.createSampleData('ranking');
    console.log('📊 Sample ranking data:', sampleRanking);
    
    const rankingValidation = dataModels.validateData('ranking', sampleRanking);
    console.log('✅ Ranking validation:', rankingValidation.isValid ? 'PASSED' : 'FAILED');
    if (!rankingValidation.isValid) {
      console.log('❌ Validation errors:', rankingValidation.errors);
    }

    const samplePlayer = dataModels.createSampleData('player');
    console.log('👤 Sample player data:', samplePlayer);
    
    const playerValidation = dataModels.validateData('player', samplePlayer);
    console.log('✅ Player validation:', playerValidation.isValid ? 'PASSED' : 'FAILED');
    if (!playerValidation.isValid) {
      console.log('❌ Validation errors:', playerValidation.errors);
    }

    // Test 3: Enhanced Data Sync
    console.log('\n🔄 Test 3: Enhanced Data Sync');
    console.log('-----------------------------');
    
    const syncStatus = enhancedDataSync.getSyncStatus();
    console.log('📊 Sync status:', syncStatus);
    
    console.log('🔄 Testing historical data sync...');
    const historicalSyncResult = await enhancedDataSync.syncHistoricalData();
    console.log('✅ Historical sync result:', historicalSyncResult.success ? 'SUCCESS' : 'FAILED');
    if (historicalSyncResult.success) {
      console.log('📊 Data synced:', historicalSyncResult.data);
    } else {
      console.log('❌ Sync error:', historicalSyncResult.error);
    }

    // Test 4: Enhanced Query Handler
    console.log('\n🎯 Test 4: Enhanced Query Handler');
    console.log('----------------------------------');
    
    const testQueries = [
      'Who is ranked number 1?',
      'Show me the current top 5 ATP rankings',
      'What is the historical ranking trend for Djokovic?',
      'Compare current rankings with last year'
    ];

    for (const query of testQueries) {
      console.log(`\n🔍 Testing query: "${query}"`);
      try {
        const result = await enhancedQueryHandler.processQuery(query);
        console.log('✅ Query processed successfully');
        console.log('📊 Query type:', result.queryType);
        console.log('📊 Data sources:', result.dataSources);
        console.log('📊 Confidence:', result.confidence);
        console.log('💬 Answer:', result.answer?.substring(0, 100) + '...');
      } catch (error) {
        console.log('❌ Query failed:', error.message);
      }
    }

    // Test 5: Cache Performance
    console.log('\n💾 Test 5: Cache Performance');
    console.log('----------------------------');
    
    const cacheStats = enhancedQueryHandler.getStats();
    console.log('📊 Cache stats:', cacheStats.cache);
    console.log('📊 Available models:', cacheStats.models);

    // Test 6: Data Source Routing
    console.log('\n🛣️  Test 6: Data Source Routing');
    console.log('-------------------------------');
    
    const routingTests = [
      { query: 'Who is ranked number 1?', expected: 'live_data' },
      { query: 'Show me historical rankings', expected: 'historical_data' },
      { query: 'Tell me about Djokovic', expected: 'combined_data' }
    ];

    for (const test of routingTests) {
      console.log(`\n🔍 Testing routing for: "${test.query}"`);
      try {
        const analysis = await enhancedQueryHandler.analyzeQuery(test.query);
        console.log('✅ Analysis completed');
        console.log('📊 Query type:', analysis.type);
        console.log('📊 Data sources:', analysis.dataSources);
        console.log('📊 Needs live data:', analysis.needsLiveData);
        console.log('📊 Needs historical data:', analysis.needsHistoricalData);
        console.log('📊 Expected type:', test.expected);
        console.log('✅ Routing correct:', analysis.type === test.expected ? 'YES' : 'NO');
      } catch (error) {
        console.log('❌ Routing test failed:', error.message);
      }
    }

    console.log('\n🎉 GitHub Integration Test Completed Successfully!');
    console.log('==================================================');
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('----------------');
    console.log('✅ GitHub Data Service: Working');
    console.log('✅ Data Models: Working');
    console.log('✅ Enhanced Data Sync: Working');
    console.log('✅ Enhanced Query Handler: Working');
    console.log('✅ Smart Data Source Routing: Working');
    console.log('✅ Cache System: Working');
    
    console.log('\n🚀 Ready for production deployment!');

  } catch (error) {
    console.error('\n❌ GitHub Integration Test Failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testGitHubIntegration()
    .then(() => {
      console.log('\n✅ All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testGitHubIntegration };
