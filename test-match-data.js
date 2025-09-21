#!/usr/bin/env node

require('dotenv').config();
const githubDataService = require('./src/githubDataService');

async function testMatchData() {
  console.log('🎾 Testing Match Data Fetching');
  console.log('==============================\n');

  try {
    // Test fetching ATP match results for 2022
    console.log('🔄 Testing ATP match results for 2022...');
    const atpMatches2022 = await githubDataService.fetchMatchResults('ATP', 2022);
    console.log(`✅ Fetched ${atpMatches2022.length} ATP matches for 2022`);
    
    if (atpMatches2022.length > 0) {
      console.log('📊 Sample ATP match:', atpMatches2022[0]);
    }

    // Test fetching WTA match results for 2022
    console.log('\n🔄 Testing WTA match results for 2022...');
    const wtaMatches2022 = await githubDataService.fetchMatchResults('WTA', 2022);
    console.log(`✅ Fetched ${wtaMatches2022.length} WTA matches for 2022`);
    
    if (wtaMatches2022.length > 0) {
      console.log('📊 Sample WTA match:', wtaMatches2022[0]);
    }

    // Test fetching ATP match results for 2023
    console.log('\n🔄 Testing ATP match results for 2023...');
    const atpMatches2023 = await githubDataService.fetchMatchResults('ATP', 2023);
    console.log(`✅ Fetched ${atpMatches2023.length} ATP matches for 2023`);
    
    if (atpMatches2023.length > 0) {
      console.log('📊 Sample ATP match:', atpMatches2023[0]);
    }

    // Look for US Open 2022 specifically
    console.log('\n🔍 Looking for US Open 2022 matches...');
    const usOpenMatches = atpMatches2022.filter(match => 
      match.tournament_name && match.tournament_name.toLowerCase().includes('us open')
    );
    console.log(`✅ Found ${usOpenMatches.length} US Open 2022 matches`);
    
    if (usOpenMatches.length > 0) {
      console.log('📊 Sample US Open match:', usOpenMatches[0]);
      
      // Look for final matches
      const finalMatches = usOpenMatches.filter(match => 
        match.round && match.round.toLowerCase().includes('final')
      );
      console.log(`🏆 Found ${finalMatches.length} US Open 2022 final matches`);
      
      if (finalMatches.length > 0) {
        console.log('🏆 US Open 2022 Final:', finalMatches[0]);
      }
    }

    console.log('\n🎉 Match Data Test Completed Successfully!');
    
  } catch (error) {
    console.error('\n❌ Match Data Test Failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testMatchData()
    .then(() => {
      console.log('\n✅ Match data test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testMatchData };
