#!/usr/bin/env node

require('dotenv').config();
const enhancedQueryHandler = require('./src/enhancedQueryHandler');

async function testTournamentQuestion() {
  console.log('🎾 Testing Tournament Winner Question');
  console.log('====================================\n');

  try {
    const testQuestion = "Who won US Open 2022 Male?";
    console.log(`🔍 Testing question: "${testQuestion}"`);
    
    // Test query analysis
    console.log('\n📊 Query Analysis:');
    const analysis = await enhancedQueryHandler.analyzeQuery(testQuestion);
    console.log('✅ Analysis completed');
    console.log(`📊 Query type: ${analysis.type}`);
    console.log(`📊 Data sources: ${analysis.dataSources.join(', ')}`);
    console.log(`📊 Needs live data: ${analysis.needsLiveData}`);
    console.log(`📊 Needs historical data: ${analysis.needsHistoricalData}`);
    console.log(`📊 Confidence: ${analysis.confidence}`);
    console.log(`🎯 Intent: ${analysis.intent}`);
    
    // Test pattern matching
    console.log('\n🔍 Pattern Matching:');
    const patterns = enhancedQueryHandler.queryPatterns;
    console.log(`✅ Tournament winners pattern: ${patterns.tournamentWinners.test(testQuestion)}`);
    console.log(`✅ Grand Slam data pattern: ${patterns.grandSlamData.test(testQuestion)}`);
    console.log(`✅ Historical data pattern: ${patterns.historicalRankings.test(testQuestion)}`);
    
    // Test full query processing
    console.log('\n🎯 Full Query Processing:');
    const result = await enhancedQueryHandler.processQuery(testQuestion);
    console.log('✅ Query processed successfully');
    console.log(`📊 Query type: ${result.queryType}`);
    console.log(`📊 Data sources: ${result.dataSources?.join(', ')}`);
    console.log(`📊 Confidence: ${result.confidence}`);
    console.log(`💬 Answer: ${result.answer}`);
    
    console.log('\n🎉 Tournament Question Test Completed Successfully!');
    
  } catch (error) {
    console.error('\n❌ Tournament Question Test Failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testTournamentQuestion()
    .then(() => {
      console.log('\n✅ Tournament question test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testTournamentQuestion };
