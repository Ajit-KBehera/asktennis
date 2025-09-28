const EnhancedTennisQueryHandler = require('./enhanced-query-handler');

async function testCompleteTennisData() {
  console.log('🎾 Testing Complete Tennis Data System...');
  
  const handler = new EnhancedTennisQueryHandler();
  
  try {
    // Test 1: Tournament Winner Query
    console.log('\n1. Testing Tournament Winner Query...');
    const wimbledon2019 = await handler.getTournamentWinner('Wimbledon', 2019);
    if (wimbledon2019) {
      console.log('✅ Wimbledon 2019 Winner:', wimbledon2019);
    } else {
      console.log('❌ No data found for Wimbledon 2019');
    }
    
    // Test 2: Head-to-Head Query
    console.log('\n2. Testing Head-to-Head Query...');
    const h2h = await handler.getHeadToHead('Roger Federer', 'Rafael Nadal');
    if (h2h) {
      console.log('✅ Federer vs Nadal H2H:', h2h);
    } else {
      console.log('❌ No H2H data found');
    }
    
    // Test 3: Player Career Stats
    console.log('\n3. Testing Player Career Stats...');
    const careerStats = await handler.getPlayerCareerStats('Novak Djokovic');
    if (careerStats) {
      console.log('✅ Djokovic Career Stats:', careerStats);
    } else {
      console.log('❌ No career stats found');
    }
    
    // Test 4: Grand Slam Winners
    console.log('\n4. Testing Grand Slam Winners...');
    const grandSlams2023 = await handler.getGrandSlamWinners(2023);
    if (grandSlams2023) {
      console.log('✅ 2023 Grand Slam Winners:', grandSlams2023);
    } else {
      console.log('❌ No Grand Slam data found for 2023');
    }
    
    // Test 5: Most Successful Players
    console.log('\n5. Testing Most Successful Players...');
    const topPlayers = await handler.getMostSuccessfulPlayers(5);
    if (topPlayers) {
      console.log('✅ Top 5 Most Successful Players:', topPlayers);
    } else {
      console.log('❌ No player data found');
    }
    
    // Test 6: Cache Statistics
    console.log('\n6. Cache Statistics:');
    const cacheStats = handler.getCacheStats();
    console.log('Cache size:', cacheStats.size);
    console.log('Cached queries:', cacheStats.keys);
    
    console.log('\n✅ Complete tennis data testing completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

// Run the test
testCompleteTennisData();
