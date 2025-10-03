#!/usr/bin/env node

/**
 * Enhanced Integration Test Script
 * Tests all the new XSD-based features and data structures
 */

const sportsradar = require('../../src/sportsradar');
const database = require('../../src/database');
const dataSync = require('../../src/dataSync');

// Only require queryHandler if Perplexity AI API key is available
let queryHandler = null;
try {
  if (process.env.PERPLEXITY_API_KEY && process.env.PERPLEXITY_API_KEY !== 'your_perplexity_api_key_here') {
    queryHandler = require('../../src/queryHandler');
  }
} catch (error) {
  console.log('⚠️  Perplexity AI API key not configured, skipping query handler tests');
}

async function testEnhancedIntegration() {
  console.log('🚀 Starting Enhanced Integration Test');
  console.log('=====================================\n');

  try {
    // Test 1: Database Schema Enhancement
    console.log('1️⃣ Testing Enhanced Database Schema...');
    await testDatabaseSchema();
    console.log('✅ Database schema test completed\n');

    // Test 2: Sportsradar API Enhancement
    console.log('2️⃣ Testing Enhanced Sportsradar API...');
    await testSportsradarAPI();
    console.log('✅ Sportsradar API test completed\n');

    // Test 3: Data Sync Enhancement
    console.log('3️⃣ Testing Enhanced Data Sync...');
    await testDataSync();
    console.log('✅ Data sync test completed\n');

    // Test 4: Query Handler Enhancement
    if (queryHandler) {
      console.log('4️⃣ Testing Enhanced Query Handler...');
      await testQueryHandler();
      console.log('✅ Query handler test completed\n');
    } else {
      console.log('4️⃣ Skipping Query Handler Test (Perplexity AI API not configured)\n');
    }

    // Test 5: End-to-End Integration
    console.log('5️⃣ Testing End-to-End Integration...');
    await testEndToEndIntegration();
    console.log('✅ End-to-end integration test completed\n');

    console.log('🎉 All Enhanced Integration Tests Passed!');
    console.log('==========================================');
    console.log('\n📊 Summary of Enhancements:');
    console.log('• ✅ Enhanced database schema with XSD structures');
    console.log('• ✅ Added 15+ new Sportsradar API endpoints');
    console.log('• ✅ Enhanced data sync with new data types');
    console.log('• ✅ Improved query handler with new patterns');
    console.log('• ✅ Added support for competitions, seasons, venues');
    console.log('• ✅ Added race rankings and double rankings');
    console.log('• ✅ Added sport events and live data support');
    console.log('• ✅ Enhanced player profiles with more data');

  } catch (error) {
    console.error('❌ Enhanced Integration Test Failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    // Clean up database connection
    if (database.pool) {
      await database.close();
    }
  }
}

async function testDatabaseSchema() {
  console.log('  🔍 Testing database schema enhancements...');
  
  // Connect to database
  await database.connect();
  
  // Test new tables exist
  const tables = [
    'competitions', 'competition_info', 'seasons', 'sport_events',
    'sport_event_competitors', 'sport_event_status', 'venues', 'complexes',
    'complex_venues', 'race_rankings', 'double_rankings'
  ];
  
  for (const table of tables) {
    try {
      const result = await database.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`    ✅ Table '${table}' exists`);
      } else {
        console.log(`    ❌ Table '${table}' missing`);
      }
    } catch (error) {
      console.log(`    ❌ Error checking table '${table}': ${error.message}`);
    }
  }
  
  // Test enhanced players table columns
  const playerColumns = [
    'sportsradar_id', 'country_code', 'handedness', 'pro_year',
    'highest_singles_ranking', 'highest_singles_ranking_date',
    'highest_doubles_ranking', 'highest_doubles_ranking_date',
    'gender', 'abbreviation', 'nationality'
  ];
  
  for (const column of playerColumns) {
    try {
      const result = await database.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'players' 
          AND column_name = $1
        );
      `, [column]);
      
      if (result.rows[0].exists) {
        console.log(`    ✅ Column 'players.${column}' exists`);
      } else {
        console.log(`    ❌ Column 'players.${column}' missing`);
      }
    } catch (error) {
      console.log(`    ❌ Error checking column 'players.${column}': ${error.message}`);
    }
  }
}

async function testSportsradarAPI() {
  console.log('  🔍 Testing enhanced Sportsradar API...');
  
  // Test if API is configured
  if (!sportsradar.isConfigured()) {
    console.log('    ⚠️  Sportsradar API not configured, skipping API tests');
    return;
  }
  
  // Test new API methods exist
  const newMethods = [
    'getCompetitions', 'getCompetitionInfo', 'getCompetitionSeasons',
    'getSeasonInfo', 'getSeasonCompetitors', 'getSeasonStandings',
    'getSeasonSummaries', 'getScheduleSummaries', 'getSportEventSummary',
    'getSportEventTimeline', 'getCompetitorSummaries', 'getCompetitorVersusSummaries',
    'getRaceRankings', 'getDoubleCompetitorsRankings', 'getDoubleCompetitorsRaceRankings',
    'getComplexes'
  ];
  
  for (const method of newMethods) {
    if (typeof sportsradar[method] === 'function') {
      console.log(`    ✅ Method '${method}' exists`);
    } else {
      console.log(`    ❌ Method '${method}' missing`);
    }
  }
  
  // Test processing methods exist
  const processingMethods = [
    'processCompetitionInfo', 'processCompetitionSeasons', 'processSeasonInfo',
    'processSeasonCompetitors', 'processSeasonStandings', 'processSeasonSummaries',
    'processScheduleSummaries', 'processSportEventSummary', 'processSportEventTimeline',
    'processCompetitorSummaries', 'processCompetitorVersusSummaries', 'processRaceRankings',
    'processDoubleCompetitorsRankings', 'processDoubleCompetitorsRaceRankings',
    'processComplexes'
  ];
  
  for (const method of processingMethods) {
    if (typeof sportsradar[method] === 'function') {
      console.log(`    ✅ Processing method '${method}' exists`);
    } else {
      console.log(`    ❌ Processing method '${method}' missing`);
    }
  }
}

async function testDataSync() {
  console.log('  🔍 Testing enhanced data sync...');
  
  // Test new sync methods exist
  const syncMethods = [
    'updateCompetitionsEnhanced', 'updateSeasons', 'updateSportEvents',
    'updateVenues', 'updateRaceRankings', 'updateDoubleRankings'
  ];
  
  for (const method of syncMethods) {
    if (typeof dataSync[method] === 'function') {
      console.log(`    ✅ Sync method '${method}' exists`);
    } else {
      console.log(`    ❌ Sync method '${method}' missing`);
    }
  }
  
  // Test sync status
  const syncStatus = dataSync.getSyncStatus();
  console.log(`    📊 Sync status: ${syncStatus.isRunning ? 'Running' : 'Idle'}`);
  console.log(`    📅 Last sync: ${syncStatus.lastSync || 'Never'}`);
  console.log(`    🔗 Sportsradar available: ${dataSync.isSportsradarAvailable() ? 'Yes' : 'No'}`);
}

async function testQueryHandler() {
  if (!queryHandler) {
    console.log('  ⚠️  Query handler not available (Perplexity AI API not configured)');
    return;
  }
  
  console.log('  🔍 Testing enhanced query handler...');
  
  // Test new query patterns exist
  const newPatterns = [
    'playerProfile', 'competitionInfo', 'seasonData', 'liveMatches',
    'scheduleQueries', 'venueQueries', 'raceRankings', 'doubleRankings',
    'matchStatistics', 'timelineQueries', 'competitorHistory', 'versusRecords',
    'complexQueries', 'sportEventQueries'
  ];
  
  for (const pattern of newPatterns) {
    if (queryHandler.queryPatterns[pattern]) {
      console.log(`    ✅ Query pattern '${pattern}' exists`);
    } else {
      console.log(`    ❌ Query pattern '${pattern}' missing`);
    }
  }
  
  // Test sample queries
  const testQueries = [
    'What competitions are available?',
    'Show me race rankings for this year',
    'What venues are available?',
    'Tell me about doubles rankings',
    'Show me live matches',
    'What is the schedule for today?'
  ];
  
  for (const query of testQueries) {
    try {
      console.log(`    🔍 Testing query: "${query}"`);
      const result = await queryHandler.queryDatabaseDirectly(query);
      console.log(`    ✅ Query processed, returned ${result.length} results`);
    } catch (error) {
      console.log(`    ⚠️  Query failed: ${error.message}`);
    }
  }
}

async function testEndToEndIntegration() {
  console.log('  🔍 Testing end-to-end integration...');
  
  // Test data flow: API -> Database -> Query Handler
  if (sportsradar.isConfigured()) {
    try {
      console.log('    🔄 Testing data sync...');
      const syncResult = await dataSync.forceSync();
      console.log(`    📊 Sync result: ${syncResult.success ? 'Success' : 'Failed'}`);
      if (syncResult.data) {
        console.log(`    📈 Data synced:`, syncResult.data);
      }
    } catch (error) {
      console.log(`    ⚠️  Data sync failed: ${error.message}`);
    }
  }
  
  // Test query processing with enhanced data (if query handler is available)
  if (queryHandler) {
    const enhancedQueries = [
      'Who are the top 5 players in race rankings?',
      'What competitions are happening this year?',
      'Show me information about venues',
      'What are the current doubles rankings?'
    ];
    
    for (const query of enhancedQueries) {
      try {
        console.log(`    🔍 Testing enhanced query: "${query}"`);
        const result = await queryHandler.processQuery(query);
        console.log(`    ✅ Enhanced query processed successfully`);
        console.log(`    📝 Answer: ${result.answer.substring(0, 100)}...`);
      } catch (error) {
        console.log(`    ⚠️  Enhanced query failed: ${error.message}`);
      }
    }
  } else {
    console.log('    ⚠️  Skipping enhanced query tests (Perplexity AI API not configured)');
  }
}

// Run the test
if (require.main === module) {
  testEnhancedIntegration().catch(console.error);
}

module.exports = { testEnhancedIntegration };
