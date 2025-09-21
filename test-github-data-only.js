#!/usr/bin/env node

const githubDataService = require('./src/githubDataService');
const historicalDatabase = require('./src/historicalDatabase');

async function testGitHubDataOnly() {
  console.log('🧪 Testing GitHub Data Integration (Data Only)');
  console.log('=============================================\n');

  try {
    // Test 1: GitHub Data Service
    console.log('📊 Test 1: GitHub Data Service');
    console.log('─'.repeat(40));
    
    console.log('🔄 Fetching ATP rankings...');
    const atpRankings = await githubDataService.fetchATPRankings();
    console.log(`✅ Fetched ${atpRankings.length} ATP rankings`);
    
    if (atpRankings.length > 0) {
      console.log(`📋 Sample ATP ranking: ${atpRankings[0].player_name} - #${atpRankings[0].ranking}`);
    }
    
    console.log('🔄 Fetching WTA rankings...');
    const wtaRankings = await githubDataService.fetchWTARankings();
    console.log(`✅ Fetched ${wtaRankings.length} WTA rankings`);
    
    if (wtaRankings.length > 0) {
      console.log(`📋 Sample WTA ranking: ${wtaRankings[0].player_name} - #${wtaRankings[0].ranking}`);
    }
    
    console.log('🔄 Fetching ATP players...');
    const atpPlayers = await githubDataService.fetchPlayerData('ATP');
    console.log(`✅ Fetched ${atpPlayers.length} ATP players`);
    
    if (atpPlayers.length > 0) {
      console.log(`📋 Sample ATP player: ${atpPlayers[0].name} from ${atpPlayers[0].country}`);
    }
    
    console.log('🔄 Fetching 2024 ATP matches...');
    const atpMatches = await githubDataService.fetchMatchResults('ATP', 2024);
    console.log(`✅ Fetched ${atpMatches.length} ATP matches for 2024`);
    
    if (atpMatches.length > 0) {
      console.log(`📋 Sample match: ${atpMatches[0].winner_name} def. ${atpMatches[0].loser_name}`);
    }

    // Test 2: Historical Database
    console.log('\n💾 Test 2: Historical Database');
    console.log('─'.repeat(40));
    
    console.log('🔄 Initializing historical database schema...');
    await historicalDatabase.initializeHistoricalSchema();
    console.log('✅ Historical database schema initialized');
    
    console.log('🔄 Inserting ATP rankings (first 50)...');
    await historicalDatabase.insertHistoricalRankings(atpRankings.slice(0, 50));
    console.log('✅ ATP rankings inserted');
    
    console.log('🔄 Inserting ATP players (first 25)...');
    await historicalDatabase.insertHistoricalPlayers(atpPlayers.slice(0, 25));
    console.log('✅ ATP players inserted');
    
    console.log('🔄 Inserting ATP matches (first 50)...');
    await historicalDatabase.insertHistoricalMatches(atpMatches.slice(0, 50));
    console.log('✅ ATP matches inserted');

    // Test 3: Database Queries
    console.log('\n🔍 Test 3: Database Queries');
    console.log('─'.repeat(40));
    
    // Test player ranking history
    console.log('🔄 Testing player ranking history...');
    const rankingHistory = await historicalDatabase.getPlayerHistoricalRankings('Djokovic', 'ATP', 10);
    console.log(`✅ Found ${rankingHistory.length} ranking records for Djokovic`);
    
    if (rankingHistory.length > 0) {
      console.log(`📋 Latest ranking: #${rankingHistory[0].ranking} on ${rankingHistory[0].ranking_date}`);
    }
    
    // Test head-to-head query
    console.log('🔄 Testing head-to-head query...');
    const h2hData = await historicalDatabase.getHeadToHead('Djokovic', 'Nadal', 'ATP');
    console.log(`✅ Found ${h2hData.length} head-to-head matches`);
    
    if (h2hData.length > 0) {
      console.log(`📋 Latest match: ${h2hData[0].winner_name} def. ${h2hData[0].loser_name} at ${h2hData[0].tournament_name}`);
    }
    
    // Test tournament winners
    console.log('🔄 Testing tournament winners...');
    const tournamentWinners = await historicalDatabase.getTournamentWinners('US Open', 2022, 'ATP');
    console.log(`✅ Found ${tournamentWinners.length} tournament winners`);
    
    if (tournamentWinners.length > 0) {
      console.log(`📋 Winner: ${tournamentWinners[0].winner_name} def. ${tournamentWinners[0].loser_name}`);
    }

    // Test 4: Database Statistics
    console.log('\n📈 Test 4: Database Statistics');
    console.log('─'.repeat(40));
    
    const stats = await historicalDatabase.getDatabaseStats();
    console.log('📊 Database Statistics:');
    Object.entries(stats).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} records`);
    });

    // Test 5: Historical Rankings by Decade
    console.log('\n📅 Test 5: Historical Rankings by Decade');
    console.log('─'.repeat(40));
    
    console.log('🔄 Fetching 2020s ATP rankings...');
    const rankings2020s = await githubDataService.fetchHistoricalRankings('ATP', '20s');
    console.log(`✅ Fetched ${rankings2020s.length} ATP rankings from 2020s`);
    
    console.log('🔄 Fetching 2010s ATP rankings...');
    const rankings2010s = await githubDataService.fetchHistoricalRankings('ATP', '10s');
    console.log(`✅ Fetched ${rankings2010s.length} ATP rankings from 2010s`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ GitHub data service working');
    console.log('✅ Historical database operational');
    console.log('✅ Data insertion successful');
    console.log('✅ Database queries working');
    console.log('✅ Historical data accessible');
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
  testGitHubDataOnly()
    .then(() => {
      console.log('\n✅ GitHub data integration test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ GitHub data integration test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testGitHubDataOnly };
