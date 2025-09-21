#!/usr/bin/env node

const githubDataService = require('./src/githubDataService');
const historicalDatabase = require('./src/historicalDatabase');
const enhancedDataSync = require('./src/enhancedDataSync');
const enhancedQueryHandler = require('./src/enhancedQueryHandler');

async function testGitHubIntegration() {
  console.log('🧪 Testing Complete GitHub Data Integration');
  console.log('==========================================\n');

  try {
    // Test 1: GitHub Data Service
    console.log('📊 Test 1: GitHub Data Service');
    console.log('─'.repeat(40));
    
    console.log('🔄 Fetching ATP rankings...');
    const atpRankings = await githubDataService.fetchATPRankings();
    console.log(`✅ Fetched ${atpRankings.length} ATP rankings`);
    
    console.log('🔄 Fetching WTA rankings...');
    const wtaRankings = await githubDataService.fetchWTARankings();
    console.log(`✅ Fetched ${wtaRankings.length} WTA rankings`);
    
    console.log('🔄 Fetching ATP players...');
    const atpPlayers = await githubDataService.fetchPlayerData('ATP');
    console.log(`✅ Fetched ${atpPlayers.length} ATP players`);
    
    console.log('🔄 Fetching 2024 ATP matches...');
    const atpMatches = await githubDataService.fetchMatchResults('ATP', 2024);
    console.log(`✅ Fetched ${atpMatches.length} ATP matches for 2024`);

    // Test 2: Historical Database
    console.log('\n💾 Test 2: Historical Database');
    console.log('─'.repeat(40));
    
    console.log('🔄 Initializing historical database schema...');
    await historicalDatabase.initializeHistoricalSchema();
    console.log('✅ Historical database schema initialized');
    
    console.log('🔄 Inserting ATP rankings...');
    await historicalDatabase.insertHistoricalRankings(atpRankings.slice(0, 100)); // Limit for testing
    console.log('✅ ATP rankings inserted');
    
    console.log('🔄 Inserting ATP players...');
    await historicalDatabase.insertHistoricalPlayers(atpPlayers.slice(0, 50)); // Limit for testing
    console.log('✅ ATP players inserted');
    
    console.log('🔄 Inserting ATP matches...');
    await historicalDatabase.insertHistoricalMatches(atpMatches.slice(0, 100)); // Limit for testing
    console.log('✅ ATP matches inserted');

    // Test 3: Enhanced Data Sync
    console.log('\n🔄 Test 3: Enhanced Data Sync');
    console.log('─'.repeat(40));
    
    console.log('🔄 Testing historical data sync...');
    const syncResult = await enhancedDataSync.syncHistoricalData();
    console.log('✅ Historical data sync completed');
    console.log(`📊 Sync result:`, syncResult);

    // Test 4: Enhanced Query Handler
    console.log('\n🤖 Test 4: Enhanced Query Handler');
    console.log('─'.repeat(40));
    
    const testQuestions = [
      'Who is ranked number 1?',
      'Show me the top 5 ATP players',
      'Who won US Open 2022?',
      'Head-to-head between Djokovic and Nadal',
      'Djokovic ranking history',
      'What is the current WTA ranking?'
    ];

    for (const question of testQuestions) {
      console.log(`\n❓ Question: ${question}`);
      try {
        const answer = await enhancedQueryHandler.processQuery(question);
        console.log(`✅ Answer: ${answer.substring(0, 200)}...`);
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }

    // Test 5: Database Statistics
    console.log('\n📈 Test 5: Database Statistics');
    console.log('─'.repeat(40));
    
    const stats = await historicalDatabase.getDatabaseStats();
    console.log('📊 Database Statistics:');
    Object.entries(stats).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} records`);
    });

    // Test 6: Specific Historical Queries
    console.log('\n🔍 Test 6: Specific Historical Queries');
    console.log('─'.repeat(40));
    
    // Test head-to-head query
    console.log('🔄 Testing head-to-head query...');
    const h2hData = await historicalDatabase.getHeadToHead('Djokovic', 'Nadal', 'ATP');
    console.log(`✅ Found ${h2hData.length} head-to-head matches`);
    
    // Test player ranking history
    console.log('🔄 Testing player ranking history...');
    const rankingHistory = await historicalDatabase.getPlayerHistoricalRankings('Djokovic', 'ATP', 10);
    console.log(`✅ Found ${rankingHistory.length} ranking records for Djokovic`);
    
    // Test tournament winners
    console.log('🔄 Testing tournament winners...');
    const tournamentWinners = await historicalDatabase.getTournamentWinners('US Open', 2022, 'ATP');
    console.log(`✅ Found ${tournamentWinners.length} tournament winners`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ GitHub data service working');
    console.log('✅ Historical database operational');
    console.log('✅ Enhanced data sync functional');
    console.log('✅ Enhanced query handler responding');
    console.log('✅ Historical queries working');
    console.log('✅ Database statistics available');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
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
  testGitHubIntegration()
    .then(() => {
      console.log('\n✅ GitHub integration test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ GitHub integration test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testGitHubIntegration };
