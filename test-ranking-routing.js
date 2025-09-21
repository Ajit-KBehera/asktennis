#!/usr/bin/env node

require('dotenv').config();
const enhancedQueryHandler = require('./src/enhancedQueryHandler');

async function testRankingRouting() {
  console.log('🎾 Testing Ranking Question Routing');
  console.log('===================================\n');

  try {
    const rankingQuestions = [
      "Who is ranked number 1?",
      "Show me the current top 5 ATP rankings",
      "What is the current ranking of Djokovic?",
      "Who is the number 1 player?",
      "Current ATP rankings"
    ];

    for (const question of rankingQuestions) {
      console.log(`\n🔍 Testing: "${question}"`);
      
      try {
        // Test query analysis
        const analysis = await enhancedQueryHandler.analyzeQuery(question);
        console.log(`📊 Query type: ${analysis.type}`);
        console.log(`📊 Data sources: ${analysis.dataSources.join(', ')}`);
        console.log(`📊 Needs live data: ${analysis.needsLiveData}`);
        console.log(`📊 Needs historical data: ${analysis.needsHistoricalData}`);
        
        // Check if it's correctly routed to Sportsradar
        const isCorrectlyRouted = analysis.dataSources.includes('sportsradar') && 
                                 !analysis.dataSources.includes('github');
        console.log(`✅ Correctly routed to Sportsradar: ${isCorrectlyRouted ? 'YES' : 'NO'}`);
        
        if (!isCorrectlyRouted) {
          console.log(`❌ Expected: sportsradar, Got: ${analysis.dataSources.join(', ')}`);
        }
        
      } catch (error) {
        console.log(`❌ Analysis failed: ${error.message}`);
      }
    }

    console.log('\n🎉 Ranking Routing Test Completed!');
    
  } catch (error) {
    console.error('\n❌ Ranking Routing Test Failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testRankingRouting()
    .then(() => {
      console.log('\n✅ Ranking routing test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testRankingRouting };
