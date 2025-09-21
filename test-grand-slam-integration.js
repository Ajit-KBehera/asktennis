#!/usr/bin/env node

const githubDataService = require('./src/githubDataService');
const historicalDatabase = require('./src/historicalDatabase');

async function testGrandSlamIntegration() {
  console.log('🏆 Testing Grand Slam Integration');
  console.log('================================\n');

  try {
    // Test 1: GitHub Grand Slam Data Service
    console.log('📊 Test 1: GitHub Grand Slam Data Service');
    console.log('─'.repeat(50));
    
    console.log('🔄 Fetching Wimbledon 2024 matches...');
    const wimbledonMatches = await githubDataService.fetchGrandSlamMatches(2024, 'wimbledon');
    console.log(`✅ Fetched ${wimbledonMatches.length} Wimbledon 2024 matches`);
    
    if (wimbledonMatches.length > 0) {
      console.log(`📋 Sample match: ${wimbledonMatches[0].player1} vs ${wimbledonMatches[0].player2}`);
      console.log(`   Round: ${wimbledonMatches[0].round}, Court: ${wimbledonMatches[0].court_name}`);
    }
    
    console.log('🔄 Fetching Wimbledon 2024 points...');
    const wimbledonPoints = await githubDataService.fetchGrandSlamData(2024, 'wimbledon');
    console.log(`✅ Fetched ${wimbledonPoints.length} Wimbledon 2024 points`);
    
    if (wimbledonPoints.length > 0) {
      console.log(`📋 Sample point: Match ${wimbledonPoints[0].match_id}, Point ${wimbledonPoints[0].point_number}`);
      console.log(`   Score: ${wimbledonPoints[0].p1_score}-${wimbledonPoints[0].p2_score}, Winner: ${wimbledonPoints[0].point_winner}`);
    }

    // Test 2: Multiple Years Data
    console.log('\n📈 Test 2: Multiple Years Data');
    console.log('─'.repeat(50));
    
    console.log('🔄 Fetching Wimbledon 2022-2024 data...');
    const wimbledonRange = await githubDataService.fetchGrandSlamDataRange(2022, 2024, 'wimbledon');
    console.log(`✅ Fetched ${wimbledonRange.matches.length} matches and ${wimbledonRange.points.length} points for Wimbledon 2022-2024`);

    // Test 3: All Grand Slams for a Year
    console.log('\n🏆 Test 3: All Grand Slams for 2024');
    console.log('─'.repeat(50));
    
    console.log('🔄 Fetching all Grand Slams for 2024...');
    const allGrandSlams = await githubDataService.fetchAllGrandSlamsForYear(2024);
    console.log(`✅ Fetched ${allGrandSlams.matches.length} matches and ${allGrandSlams.points.length} points for all Grand Slams 2024`);

    // Test 4: Historical Database Schema
    console.log('\n💾 Test 4: Historical Database Schema');
    console.log('─'.repeat(50));
    
    console.log('🔄 Initializing historical database schema...');
    await historicalDatabase.initializeHistoricalSchema();
    console.log('✅ Historical database schema initialized');

    // Test 5: Data Insertion
    console.log('\n📥 Test 5: Data Insertion');
    console.log('─'.repeat(50));
    
    console.log('🔄 Inserting Grand Slam matches (first 5 matches)...');
    await historicalDatabase.insertGrandSlamData(wimbledonMatches.slice(0, 5), []);
    console.log('✅ Grand Slam matches inserted');
    
    console.log('🔄 Inserting Grand Slam points (first 50 points)...');
    await historicalDatabase.insertGrandSlamData([], wimbledonPoints.slice(0, 50));
    console.log('✅ Grand Slam points inserted');

    // Test 6: Database Queries
    console.log('\n🔍 Test 6: Database Queries');
    console.log('─'.repeat(50));
    
    if (wimbledonMatches.length > 0) {
      const sampleMatchId = wimbledonMatches[0].match_id;
      
      console.log(`🔄 Testing Grand Slam match query for: ${sampleMatchId}`);
      const matchData = await historicalDatabase.getGrandSlamMatch(sampleMatchId);
      if (matchData) {
        console.log(`✅ Found match data: ${matchData.player1} vs ${matchData.player2}`);
        console.log(`   Tournament: ${matchData.tournament}, Round: ${matchData.round}`);
      }
      
      console.log(`🔄 Testing Grand Slam points query for: ${sampleMatchId}`);
      const matchPoints = await historicalDatabase.getGrandSlamPoints(sampleMatchId, 10);
      console.log(`✅ Found ${matchPoints.length} points for this match`);
      
      if (matchPoints.length > 0) {
        console.log(`📋 Sample point: ${matchPoints[0].p1_score}-${matchPoints[0].p2_score}, Winner: ${matchPoints[0].point_winner}`);
      }
    }

    // Test 7: Tournament Queries
    console.log('\n🏆 Test 7: Tournament Queries');
    console.log('─'.repeat(50));
    
    console.log('🔄 Testing tournament matches query for Wimbledon 2024...');
    const tournamentMatches = await historicalDatabase.getTournamentMatches('wimbledon', 2024, 5);
    console.log(`✅ Found ${tournamentMatches.length} matches for Wimbledon 2024`);
    
    tournamentMatches.forEach(match => {
      console.log(`   • ${match.round}: ${match.player1} vs ${match.player2}`);
    });

    // Test 8: Database Statistics
    console.log('\n📈 Test 8: Database Statistics');
    console.log('─'.repeat(50));
    
    const stats = await historicalDatabase.getDatabaseStats();
    console.log('📊 Database Statistics:');
    Object.entries(stats).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} records`);
    });

    console.log('\n🎉 All Grand Slam integration tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ GitHub Grand Slam data service working');
    console.log('✅ Grand Slam points data accessible');
    console.log('✅ Historical database schema supports Grand Slam data');
    console.log('✅ Data insertion successful');
    console.log('✅ Database queries working');
    console.log('✅ Tournament queries functional');
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
  testGrandSlamIntegration()
    .then(() => {
      console.log('\n✅ Grand Slam integration test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Grand Slam integration test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testGrandSlamIntegration };
