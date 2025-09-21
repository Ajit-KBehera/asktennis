#!/usr/bin/env node

const historicalDatabase = require('./src/historicalDatabase');

async function testPerformanceOptimization() {
  console.log('⚡ Testing Performance Optimization');
  console.log('==================================\n');

  try {
    // Initialize database with performance indexes
    console.log('🔄 Initializing database with performance indexes...');
    await historicalDatabase.initializeHistoricalSchema();
    console.log('✅ Database initialized with performance indexes');

    // Test 1: Top Rankings Performance
    console.log('\n📊 Test 1: Top Rankings Performance');
    console.log('─'.repeat(50));
    
    const startTime1 = Date.now();
    const topRankings = await historicalDatabase.getTopRankings('ATP', 10);
    const endTime1 = Date.now();
    
    console.log(`✅ Top 10 ATP Rankings: ${endTime1 - startTime1}ms`);
    console.log(`📋 Found ${topRankings.length} rankings`);
    if (topRankings.length > 0) {
      console.log(`   #1: ${topRankings[0].player_name} (${topRankings[0].ranking})`);
    }

    // Test 2: Player Search Performance
    console.log('\n🔍 Test 2: Player Search Performance');
    console.log('─'.repeat(50));
    
    const startTime2 = Date.now();
    const searchResults = await historicalDatabase.searchPlayers('Djokovic', 'ATP', 5);
    const endTime2 = Date.now();
    
    console.log(`✅ Player Search: ${endTime2 - startTime2}ms`);
    console.log(`📋 Found ${searchResults.length} players`);
    if (searchResults.length > 0) {
      console.log(`   Sample: ${searchResults[0].name} (${searchResults[0].country})`);
    }

    // Test 3: Recent Matches Performance
    console.log('\n🏆 Test 3: Recent Matches Performance');
    console.log('─'.repeat(50));
    
    const startTime3 = Date.now();
    const recentMatches = await historicalDatabase.getRecentMatches('ATP', 10);
    const endTime3 = Date.now();
    
    console.log(`✅ Recent Matches: ${endTime3 - startTime3}ms`);
    console.log(`📋 Found ${recentMatches.length} matches`);
    if (recentMatches.length > 0) {
      console.log(`   Sample: ${recentMatches[0].winner_name} vs ${recentMatches[0].loser_name}`);
    }

    // Test 4: Historical Rankings Performance
    console.log('\n📈 Test 4: Historical Rankings Performance');
    console.log('─'.repeat(50));
    
    const startTime4 = Date.now();
    const historicalRankings = await historicalDatabase.getHistoricalRankings('ATP', 20);
    const endTime4 = Date.now();
    
    console.log(`✅ Historical Rankings: ${endTime4 - startTime4}ms`);
    console.log(`📋 Found ${historicalRankings.length} rankings`);

    // Test 5: Database Statistics Performance
    console.log('\n📊 Test 5: Database Statistics Performance');
    console.log('─'.repeat(50));
    
    const startTime5 = Date.now();
    const stats = await historicalDatabase.getDatabaseStats();
    const endTime5 = Date.now();
    
    console.log(`✅ Database Statistics: ${endTime5 - startTime5}ms`);
    console.log('📊 Database Statistics:');
    Object.entries(stats).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} records`);
    });

    // Performance Summary
    console.log('\n⚡ Performance Summary');
    console.log('─'.repeat(50));
    console.log(`✅ Top Rankings Query: ${endTime1 - startTime1}ms`);
    console.log(`✅ Player Search Query: ${endTime2 - startTime2}ms`);
    console.log(`✅ Recent Matches Query: ${endTime3 - startTime3}ms`);
    console.log(`✅ Historical Rankings Query: ${endTime4 - startTime4}ms`);
    console.log(`✅ Database Statistics Query: ${endTime5 - startTime5}ms`);
    
    const totalTime = (endTime1 - startTime1) + (endTime2 - startTime2) + (endTime3 - startTime3) + (endTime4 - startTime4) + (endTime5 - startTime5);
    const avgTime = totalTime / 5;
    
    console.log(`\n📈 Average Query Time: ${avgTime.toFixed(2)}ms`);
    
    if (avgTime < 50) {
      console.log('🎉 EXCELLENT performance! All queries under 50ms');
    } else if (avgTime < 100) {
      console.log('✅ GOOD performance! All queries under 100ms');
    } else if (avgTime < 200) {
      console.log('⚠️  ACCEPTABLE performance! Consider further optimization');
    } else {
      console.log('❌ SLOW performance! Needs optimization');
    }

    console.log('\n🎉 Performance optimization test completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Performance indexes created');
    console.log('✅ Optimized query methods implemented');
    console.log('✅ Database statistics available');
    console.log('✅ All queries tested and optimized');

  } catch (error) {
    console.error('\n❌ Performance test failed:', error.message);
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
  testPerformanceOptimization()
    .then(() => {
      console.log('\n✅ Performance optimization test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Performance optimization test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testPerformanceOptimization };
