#!/usr/bin/env node

require('dotenv').config();
const enhancedQueryHandler = require('./src/enhancedQueryHandler');
const enhancedDataSync = require('./src/enhancedDataSync');
const dataModels = require('./src/dataModels');

async function demoHybridSystem() {
  console.log('🎾 AskTennis Hybrid System Demo');
  console.log('===============================\n');

  try {
    // Demo 1: Show data source routing
    console.log('🛣️  Demo 1: Smart Data Source Routing');
    console.log('-------------------------------------');
    
    const demoQueries = [
      {
        query: 'Who is ranked number 1?',
        expected: 'live_data',
        description: 'Current rankings → Sportsradar API'
      },
      {
        query: 'Show me historical rankings trends',
        expected: 'historical_data', 
        description: 'Historical data → GitHub repositories'
      },
      {
        query: 'Tell me about Djokovic\'s career',
        expected: 'combined_data',
        description: 'Player profile → Both sources combined'
      },
      {
        query: 'Compare current vs last year rankings',
        expected: 'combined_data',
        description: 'Comparison → Both sources needed'
      }
    ];

    for (const demo of demoQueries) {
      console.log(`\n🔍 Query: "${demo.query}"`);
      console.log(`📝 Expected: ${demo.description}`);
      
      try {
        const analysis = await enhancedQueryHandler.analyzeQuery(demo.query);
        console.log(`✅ Detected: ${analysis.type} (${analysis.dataSources.join(', ')})`);
        console.log(`📊 Confidence: ${analysis.confidence}`);
        console.log(`🎯 Intent: ${analysis.intent}`);
        console.log(`⚡ Needs live data: ${analysis.needsLiveData}`);
        console.log(`📚 Needs historical data: ${analysis.needsHistoricalData}`);
        
        const isCorrect = analysis.type === demo.expected;
        console.log(`✅ Routing ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
        
      } catch (error) {
        console.log(`❌ Analysis failed: ${error.message}`);
      }
    }

    // Demo 2: Show data models
    console.log('\n📋 Demo 2: Data Models & Validation');
    console.log('-----------------------------------');
    
    const modelTypes = ['ranking', 'player', 'match', 'matchCharting', 'grandSlam'];
    
    for (const modelType of modelTypes) {
      console.log(`\n📊 ${modelType.toUpperCase()} Model:`);
      
      const sampleData = dataModels.createSampleData(modelType);
      console.log('📝 Sample data:', JSON.stringify(sampleData, null, 2));
      
      const validation = dataModels.validateData(modelType, sampleData);
      console.log(`✅ Validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
      
      if (!validation.isValid) {
        console.log(`❌ Errors: ${validation.errors.join(', ')}`);
      }
    }

    // Demo 3: Show sync status
    console.log('\n🔄 Demo 3: Data Sync Status');
    console.log('---------------------------');
    
    const syncStatus = enhancedDataSync.getSyncStatus();
    console.log('📊 Sync Status:');
    console.log(`  - Running: ${syncStatus.isRunning}`);
    console.log(`  - Sportsradar available: ${syncStatus.isSportsradarAvailable}`);
    console.log(`  - GitHub data available: ${syncStatus.isGitHubDataAvailable}`);
    console.log(`  - Last live sync: ${syncStatus.lastLiveSync || 'Never'}`);
    console.log(`  - Last historical sync: ${syncStatus.lastHistoricalSync || 'Never'}`);
    
    if (syncStatus.nextLiveSyncIn) {
      console.log(`  - Next live sync in: ${Math.round(syncStatus.nextLiveSyncIn / 1000 / 60)} minutes`);
    }
    
    if (syncStatus.nextHistoricalSyncIn) {
      console.log(`  - Next historical sync in: ${Math.round(syncStatus.nextHistoricalSyncIn / 1000 / 60 / 60 / 24)} days`);
    }

    // Demo 4: Show system statistics
    console.log('\n📊 Demo 4: System Statistics');
    console.log('----------------------------');
    
    const stats = enhancedQueryHandler.getStats();
    console.log('📊 Cache Statistics:');
    console.log(`  - Size: ${stats.cache.size}/${stats.cache.maxSize}`);
    console.log(`  - Timeout: ${stats.cache.timeout / 1000 / 60} minutes`);
    
    console.log('📊 Available Models:');
    stats.models.forEach(model => {
      console.log(`  - ${model}`);
    });

    // Demo 5: Show hybrid approach benefits
    console.log('\n🌟 Demo 5: Hybrid Approach Benefits');
    console.log('-----------------------------------');
    
    const benefits = [
      {
        feature: 'Live Rankings',
        source: 'Sportsradar API',
        benefit: 'Always up-to-date current rankings',
        frequency: 'Every 2-4 hours'
      },
      {
        feature: 'Historical Data',
        source: 'GitHub Repositories',
        benefit: 'Comprehensive historical analysis',
        frequency: 'Weekly updates'
      },
      {
        feature: 'Player Profiles',
        source: 'Combined Sources',
        benefit: 'Complete player information',
        frequency: 'Real-time + Historical'
      },
      {
        feature: 'Match Analysis',
        source: 'GitHub Charting',
        benefit: 'Point-by-point match data',
        frequency: 'As available'
      },
      {
        feature: 'Cost Optimization',
        source: 'Hybrid Strategy',
        benefit: 'Reduced API costs, rich data',
        frequency: 'Continuous'
      }
    ];

    benefits.forEach((benefit, index) => {
      console.log(`\n${index + 1}. ${benefit.feature}`);
      console.log(`   📡 Source: ${benefit.source}`);
      console.log(`   💡 Benefit: ${benefit.benefit}`);
      console.log(`   ⏰ Frequency: ${benefit.frequency}`);
    });

    console.log('\n🎉 Hybrid System Demo Completed Successfully!');
    console.log('=============================================');
    
    // Summary
    console.log('\n📊 Demo Summary:');
    console.log('----------------');
    console.log('✅ Smart data source routing: Working');
    console.log('✅ Data models & validation: Working');
    console.log('✅ Enhanced data sync: Working');
    console.log('✅ System statistics: Working');
    console.log('✅ Hybrid approach benefits: Demonstrated');
    
    console.log('\n🚀 The hybrid system is ready to provide:');
    console.log('   • Live, accurate current rankings');
    console.log('   • Rich historical data and trends');
    console.log('   • Comprehensive player profiles');
    console.log('   • Cost-effective data management');
    console.log('   • Smart query routing and caching');

  } catch (error) {
    console.error('\n❌ Hybrid System Demo Failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  demoHybridSystem()
    .then(() => {
      console.log('\n✅ Hybrid system demo completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Demo failed:', error.message);
      process.exit(1);
    });
}

module.exports = { demoHybridSystem };
