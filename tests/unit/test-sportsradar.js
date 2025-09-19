#!/usr/bin/env node

/**
 * Test script for Sportsradar integration
 * Run with: node test-sportsradar.js
 */

require('dotenv').config();
const sportsradar = require('./src/sportsradar');
const dataSync = require('./src/dataSync');
const database = require('./src/database');

async function testSportsradarIntegration() {
  console.log('🧪 Testing Sportsradar Integration');
  console.log('=====================================');

  try {
    // Test 1: Check if API key is configured
    console.log('\n1️⃣  Testing API Configuration...');
    const isConfigured = sportsradar.isConfigured();
    console.log(`   Sportsradar configured: ${isConfigured ? '✅' : '❌'}`);
    
    if (!isConfigured) {
      console.log('   ⚠️  Please set SPORTRADAR_API_KEY in your .env file');
      console.log('   Example: SPORTRADAR_API_KEY=your_actual_api_key_here');
      return;
    }

    // Test 2: Test API connection
    console.log('\n2️⃣  Testing API Connection...');
    try {
      const rankings = await sportsradar.getATPRankings();
      if (rankings && rankings.length > 0) {
        console.log(`   ✅ API connection successful`);
        console.log(`   📊 Retrieved ${rankings.length} ATP rankings`);
        console.log(`   🏆 Top 3 players:`);
        rankings.slice(0, 3).forEach((player, index) => {
          console.log(`      ${index + 1}. ${player.player_name} (${player.country}) - ${player.points} points`);
        });
      } else {
        console.log('   ⚠️  API connected but no data returned');
      }
    } catch (error) {
      console.log(`   ❌ API connection failed: ${error.message}`);
      return;
    }

    // Test 3: Test database connection
    console.log('\n3️⃣  Testing Database Connection...');
    try {
      await database.connect();
      console.log('   ✅ Database connection successful');
    } catch (error) {
      console.log(`   ❌ Database connection failed: ${error.message}`);
      return;
    }

    // Test 4: Test data synchronization
    console.log('\n4️⃣  Testing Data Synchronization...');
    try {
      const syncResult = await dataSync.forceSync();
      if (syncResult.success) {
        console.log('   ✅ Data synchronization successful');
        console.log(`   📊 Synced data:`);
        console.log(`      - ATP Rankings: ${syncResult.data.atp_rankings} players`);
        console.log(`      - WTA Rankings: ${syncResult.data.wta_rankings} players`);
        console.log(`      - Tournaments: ${syncResult.data.tournaments} tournaments`);
        console.log(`   🕐 Last sync: ${syncResult.lastSync}`);
      } else {
        console.log(`   ❌ Data synchronization failed: ${syncResult.reason || syncResult.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Data synchronization error: ${error.message}`);
    }

    // Test 5: Test database queries
    console.log('\n5️⃣  Testing Database Queries...');
    try {
      const playersResult = await database.query('SELECT COUNT(*) as count FROM players');
      const rankingsResult = await database.query('SELECT COUNT(*) as count FROM rankings');
      const tournamentsResult = await database.query('SELECT COUNT(*) as count FROM tournaments');
      
      console.log('   ✅ Database queries successful');
      console.log(`   📊 Database contents:`);
      console.log(`      - Players: ${playersResult.rows[0].count}`);
      console.log(`      - Rankings: ${rankingsResult.rows[0].count}`);
      console.log(`      - Tournaments: ${tournamentsResult.rows[0].count}`);
    } catch (error) {
      console.log(`   ❌ Database query failed: ${error.message}`);
    }

    // Test 6: Test sync status
    console.log('\n6️⃣  Testing Sync Status...');
    const syncStatus = dataSync.getSyncStatus();
    console.log(`   🔄 Sync running: ${syncStatus.isRunning ? 'Yes' : 'No'}`);
    console.log(`   🕐 Last sync: ${syncStatus.lastSync || 'Never'}`);
    console.log(`   ⚙️  Sportsradar available: ${syncStatus.isSportsradarAvailable ? 'Yes' : 'No'}`);

    console.log('\n🎉 Sportsradar Integration Test Complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Start your server: npm run server');
    console.log('   2. Test the API endpoints:');
    console.log('      - GET /api/sync/status - Check sync status');
    console.log('      - GET /api/sync/test - Test API connection');
    console.log('      - POST /api/sync/force - Force data sync');
    console.log('   3. Ask tennis questions and see live data!');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Full error:', error);
  } finally {
    try {
      await database.close();
    } catch (closeError) {
      console.error('Error closing database:', closeError.message);
    }
  }
}

// Run the test
testSportsradarIntegration();
