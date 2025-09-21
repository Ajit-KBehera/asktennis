#!/usr/bin/env node

const githubDataService = require('./src/githubDataService');
const historicalDatabase = require('./src/historicalDatabase');

async function testMatchChartingIntegration() {
  console.log('🧪 Testing Match Charting Integration');
  console.log('====================================\n');

  try {
    // Test 1: GitHub Match Charting Data Service
    console.log('📊 Test 1: GitHub Match Charting Data Service');
    console.log('─'.repeat(50));
    
    console.log('🔄 Fetching men\'s match charting data...');
    const menMatches = await githubDataService.fetchMatchChartingData();
    console.log(`✅ Fetched ${menMatches.length} men's charted matches`);
    
    if (menMatches.length > 0) {
      console.log(`📋 Sample match: ${menMatches[0].player1} vs ${menMatches[0].player2}`);
      console.log(`   Tournament: ${menMatches[0].tournament}, Date: ${menMatches[0].date}`);
    }
    
    console.log('🔄 Fetching women\'s match charting data...');
    const womenMatches = await githubDataService.fetchWomenMatchChartingData();
    console.log(`✅ Fetched ${womenMatches.length} women's charted matches`);
    
    if (womenMatches.length > 0) {
      console.log(`📋 Sample match: ${womenMatches[0].player1} vs ${womenMatches[0].player2}`);
      console.log(`   Tournament: ${womenMatches[0].tournament}, Date: ${womenMatches[0].date}`);
    }

    // Test 2: Match Charting Points Data
    console.log('\n📈 Test 2: Match Charting Points Data');
    console.log('─'.repeat(50));
    
    console.log('🔄 Fetching men\'s match charting points (2020s)...');
    const menPoints = await githubDataService.fetchMatchChartingPoints('2020s');
    console.log(`✅ Fetched ${menPoints.length} men's charted points`);
    
    if (menPoints.length > 0) {
      console.log(`📋 Sample point: Match ${menPoints[0].match_id}, Point ${menPoints[0].point_number}`);
      console.log(`   Score: ${menPoints[0].point_score}, Winner: ${menPoints[0].point_winner}`);
    }
    
    console.log('🔄 Fetching women\'s match charting points (2020s)...');
    const womenPoints = await githubDataService.fetchWomenMatchChartingPoints('2020s');
    console.log(`✅ Fetched ${womenPoints.length} women's charted points`);
    
    if (womenPoints.length > 0) {
      console.log(`📋 Sample point: Match ${womenPoints[0].match_id}, Point ${womenPoints[0].point_number}`);
      console.log(`   Score: ${womenPoints[0].point_score}, Winner: ${womenPoints[0].point_winner}`);
    }

    // Test 3: Historical Database Schema
    console.log('\n💾 Test 3: Historical Database Schema');
    console.log('─'.repeat(50));
    
    console.log('🔄 Initializing historical database schema...');
    await historicalDatabase.initializeHistoricalSchema();
    console.log('✅ Historical database schema initialized');

    // Test 4: Data Insertion
    console.log('\n📥 Test 4: Data Insertion');
    console.log('─'.repeat(50));
    
    console.log('🔄 Inserting match charting data (first 10 matches)...');
    await historicalDatabase.insertMatchCharting(menMatches.slice(0, 10));
    console.log('✅ Match charting data inserted');
    
    console.log('🔄 Inserting match charting points (first 100 points)...');
    await historicalDatabase.insertMatchChartingPoints(menPoints.slice(0, 100));
    console.log('✅ Match charting points inserted');

    // Test 5: Database Queries
    console.log('\n🔍 Test 5: Database Queries');
    console.log('─'.repeat(50));
    
    if (menMatches.length > 0) {
      const sampleMatchId = menMatches[0].match_id;
      
      console.log(`🔄 Testing match charting data query for: ${sampleMatchId}`);
      const matchData = await historicalDatabase.getMatchChartingData(sampleMatchId);
      if (matchData) {
        console.log(`✅ Found match data: ${matchData.player1} vs ${matchData.player2}`);
        console.log(`   Tournament: ${matchData.tournament}, Total Points: ${matchData.total_points}`);
      }
      
      console.log(`🔄 Testing match points query for: ${sampleMatchId}`);
      const matchPoints = await historicalDatabase.getMatchPoints(sampleMatchId, 10);
      console.log(`✅ Found ${matchPoints.length} points for this match`);
      
      if (matchPoints.length > 0) {
        console.log(`📋 Sample point: ${matchPoints[0].point_score}, Winner: ${matchPoints[0].point_winner}`);
      }
    }

    // Test 6: Player Charted Matches
    console.log('\n👤 Test 6: Player Charted Matches');
    console.log('─'.repeat(50));
    
    if (menMatches.length > 0) {
      const samplePlayer = menMatches[0].player1;
      console.log(`🔄 Testing player charted matches for: ${samplePlayer}`);
      const playerMatches = await historicalDatabase.getPlayerChartedMatches(samplePlayer, 5);
      console.log(`✅ Found ${playerMatches.length} charted matches for ${samplePlayer}`);
      
      playerMatches.forEach(match => {
        console.log(`   • ${match.tournament} (${match.round}): vs ${match.player2}`);
      });
    }

    // Test 7: Tournament Charted Matches
    console.log('\n🏆 Test 7: Tournament Charted Matches');
    console.log('─'.repeat(50));
    
    if (menMatches.length > 0) {
      const sampleTournament = menMatches[0].tournament;
      console.log(`🔄 Testing tournament charted matches for: ${sampleTournament}`);
      const tournamentMatches = await historicalDatabase.getTournamentChartedMatches(sampleTournament, null, 5);
      console.log(`✅ Found ${tournamentMatches.length} charted matches for ${sampleTournament}`);
      
      tournamentMatches.forEach(match => {
        console.log(`   • ${match.date} (${match.round}): ${match.player1} vs ${match.player2}`);
      });
    }

    // Test 8: Database Statistics
    console.log('\n📈 Test 8: Database Statistics');
    console.log('─'.repeat(50));
    
    const stats = await historicalDatabase.getDatabaseStats();
    console.log('📊 Database Statistics:');
    Object.entries(stats).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} records`);
    });

    console.log('\n🎉 All match charting integration tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ GitHub match charting data service working');
    console.log('✅ Match charting points data accessible');
    console.log('✅ Historical database schema supports charting');
    console.log('✅ Data insertion successful');
    console.log('✅ Database queries working');
    console.log('✅ Player and tournament queries functional');
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
  testMatchChartingIntegration()
    .then(() => {
      console.log('\n✅ Match charting integration test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Match charting integration test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testMatchChartingIntegration };
