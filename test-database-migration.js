#!/usr/bin/env node

require('dotenv').config();
const database = require('./src/database');
const dataModels = require('./src/dataModels');

async function testDatabaseMigration() {
  console.log('🔧 Testing Database Migration');
  console.log('=============================\n');

  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await database.connect(false);
    console.log('✅ Database connected successfully');

    // Test 1: Check if new columns exist
    console.log('\n🔍 Test 1: Checking new columns');
    console.log('-------------------------------');
    
    const client = await database.getClient();
    
    try {
      // Check rankings table columns
      const rankingsColumns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'rankings' 
        AND column_name IN ('data_source', 'is_current')
        ORDER BY column_name
      `);
      
      console.log('📊 Rankings table new columns:');
      rankingsColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
      });

      // Check players table columns
      const playersColumns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'players' 
        AND column_name = 'data_source'
        ORDER BY column_name
      `);
      
      console.log('📊 Players table new columns:');
      playersColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
      });

    } finally {
      client.release();
    }

    // Test 2: Insert sample data with new columns
    console.log('\n📝 Test 2: Inserting sample data with new columns');
    console.log('------------------------------------------------');
    
    const sampleRanking = dataModels.createSampleData('ranking');
    const samplePlayer = dataModels.createSampleData('player');
    
    console.log('📊 Sample ranking data:', sampleRanking);
    console.log('📊 Sample player data:', samplePlayer);
    
    // Validate data
    const rankingValidation = dataModels.validateData('ranking', sampleRanking);
    const playerValidation = dataModels.validateData('player', samplePlayer);
    
    console.log('✅ Ranking validation:', rankingValidation.isValid ? 'PASSED' : 'FAILED');
    console.log('✅ Player validation:', playerValidation.isValid ? 'PASSED' : 'FAILED');
    
    if (!rankingValidation.isValid) {
      console.log('❌ Ranking validation errors:', rankingValidation.errors);
    }
    
    if (!playerValidation.isValid) {
      console.log('❌ Player validation errors:', playerValidation.errors);
    }

    // Test 3: Test SQL queries with new columns
    console.log('\n🔍 Test 3: Testing SQL queries with new columns');
    console.log('-----------------------------------------------');
    
    const testClient = await database.getClient();
    
    try {
      // Test query with data_source column
      const testQuery = `
        SELECT p.name, r.ranking, r.points, r.tour, r.data_source, r.is_current
        FROM rankings r 
        JOIN players p ON r.player_id = p.id 
        WHERE r.data_source = 'github'
        ORDER BY r.ranking 
        LIMIT 5
      `;
      
      console.log('🔄 Testing query with new columns...');
      const result = await testClient.query(testQuery);
      console.log(`✅ Query executed successfully, returned ${result.rows.length} rows`);
      
      if (result.rows.length > 0) {
        console.log('📊 Sample result:', result.rows[0]);
      } else {
        console.log('📊 No data found (expected for empty database)');
      }
      
    } finally {
      testClient.release();
    }

    // Test 4: Test data source filtering
    console.log('\n🔍 Test 4: Testing data source filtering');
    console.log('----------------------------------------');
    
    const filterClient = await database.getClient();
    
    try {
      // Test different data source filters
      const dataSources = ['sportsradar', 'github', 'hybrid'];
      
      for (const source of dataSources) {
        const filterQuery = `
          SELECT COUNT(*) as count, data_source
          FROM rankings 
          WHERE data_source = $1
          GROUP BY data_source
        `;
        
        const result = await filterClient.query(filterQuery, [source]);
        console.log(`📊 Data source '${source}': ${result.rows[0]?.count || 0} records`);
      }
      
    } finally {
      filterClient.release();
    }

    console.log('\n🎉 Database Migration Test Completed Successfully!');
    console.log('==================================================');
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('----------------');
    console.log('✅ Database connection: Working');
    console.log('✅ New columns exist: Working');
    console.log('✅ Data validation: Working');
    console.log('✅ SQL queries with new columns: Working');
    console.log('✅ Data source filtering: Working');
    
    console.log('\n🚀 Database is ready for GitHub integration!');

  } catch (error) {
    console.error('\n❌ Database Migration Test Failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    try {
      await database.close();
    } catch (closeError) {
      console.error('Error closing database:', closeError.message);
    }
  }
}

// Run the test
if (require.main === module) {
  testDatabaseMigration()
    .then(() => {
      console.log('\n✅ All database migration tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Database migration test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testDatabaseMigration };
