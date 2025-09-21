#!/usr/bin/env node

const { Pool } = require('pg');

// Railway database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixRailwayDatabase() {
  console.log('🔧 Fixing Railway Database Issues');
  console.log('==================================\n');

  try {
    // 1. Add missing columns to existing tables
    console.log('🔄 Adding missing columns to existing tables...');
    
    // Add data_source and is_current to rankings table
    try {
      await pool.query(`
        ALTER TABLE rankings 
        ADD COLUMN IF NOT EXISTS data_source VARCHAR(50) DEFAULT 'sportsradar'
      `);
      console.log('✅ Added data_source column to rankings table');
    } catch (error) {
      console.log('⚠️  data_source column may already exist:', error.message);
    }

    try {
      await pool.query(`
        ALTER TABLE rankings 
        ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT TRUE
      `);
      console.log('✅ Added is_current column to rankings table');
    } catch (error) {
      console.log('⚠️  is_current column may already exist:', error.message);
    }

    // Add data_source to players table
    try {
      await pool.query(`
        ALTER TABLE players 
        ADD COLUMN IF NOT EXISTS data_source VARCHAR(50) DEFAULT 'sportsradar'
      `);
      console.log('✅ Added data_source column to players table');
    } catch (error) {
      console.log('⚠️  data_source column may already exist:', error.message);
    }

    // 2. Create historical tables if they don't exist
    console.log('\n🔄 Creating historical data tables...');
    
    // Historical rankings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historical_rankings (
        id SERIAL PRIMARY KEY,
        player_id VARCHAR(50) NOT NULL,
        player_name VARCHAR(200) NOT NULL,
        ranking INTEGER NOT NULL,
        points INTEGER,
        tour VARCHAR(10) NOT NULL,
        ranking_date DATE NOT NULL,
        decade INTEGER,
        year INTEGER,
        data_source VARCHAR(50) DEFAULT 'github',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(player_id, ranking_date, tour)
      )
    `);
    console.log('✅ Created historical_rankings table');

    // Historical players table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historical_players (
        id SERIAL PRIMARY KEY,
        player_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        birth_date DATE,
        country VARCHAR(10),
        height INTEGER,
        weight INTEGER,
        playing_hand VARCHAR(10),
        turned_pro INTEGER,
        tour VARCHAR(10) NOT NULL,
        data_source VARCHAR(50) DEFAULT 'github',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created historical_players table');

    // Historical matches table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historical_matches (
        id SERIAL PRIMARY KEY,
        tournament_name VARCHAR(200),
        tournament_date DATE,
        winner_name VARCHAR(200),
        loser_name VARCHAR(200),
        score VARCHAR(100),
        surface VARCHAR(20),
        round VARCHAR(50),
        winner_rank INTEGER,
        loser_rank INTEGER,
        winner_points INTEGER,
        loser_points INTEGER,
        tour VARCHAR(10) NOT NULL,
        data_source VARCHAR(50) DEFAULT 'github',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created historical_matches table');

    // Match charting table (simplified for Railway)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS match_charting (
        id SERIAL PRIMARY KEY,
        match_id VARCHAR(100) UNIQUE,
        tournament VARCHAR(200),
        date DATE,
        surface VARCHAR(20),
        round VARCHAR(50),
        player1 VARCHAR(200),
        player2 VARCHAR(200),
        time VARCHAR(20),
        court VARCHAR(100),
        umpire VARCHAR(200),
        best_of INTEGER,
        final_tb BOOLEAN DEFAULT FALSE,
        charted_by VARCHAR(100),
        data_source VARCHAR(50) DEFAULT 'github_charting',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created match_charting table');

    // 3. Create indexes for performance
    console.log('\n🔄 Creating performance indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_historical_rankings_tour_date ON historical_rankings(tour, ranking_date DESC)',
      'CREATE INDEX IF NOT EXISTS idx_historical_rankings_player ON historical_rankings(player_id, tour)',
      'CREATE INDEX IF NOT EXISTS idx_historical_players_tour ON historical_players(tour, name)',
      'CREATE INDEX IF NOT EXISTS idx_historical_matches_tour_date ON historical_matches(tour, tournament_date DESC)',
      'CREATE INDEX IF NOT EXISTS idx_match_charting_tournament ON match_charting(tournament, date DESC)'
    ];

    for (const indexQuery of indexes) {
      try {
        await pool.query(indexQuery);
      } catch (error) {
        console.log('⚠️  Index may already exist:', error.message);
      }
    }
    console.log('✅ Created performance indexes');

    // 4. Clean up any corrupted data
    console.log('\n🔄 Cleaning up corrupted data...');
    
    // Remove any rows with invalid data
    await pool.query(`
      DELETE FROM historical_rankings 
      WHERE ranking IS NULL OR ranking <= 0 OR player_name IS NULL
    `);
    
    await pool.query(`
      DELETE FROM historical_players 
      WHERE name IS NULL OR player_id IS NULL
    `);
    
    console.log('✅ Cleaned up corrupted data');

    // 5. Get database statistics
    console.log('\n📊 Database Statistics:');
    
    const tables = ['rankings', 'players', 'historical_rankings', 'historical_players', 'historical_matches', 'match_charting'];
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ${table}: ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`  ${table}: Table not found or error - ${error.message}`);
      }
    }

    console.log('\n✅ Railway database fixes completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Added missing columns to existing tables');
    console.log('✅ Created historical data tables');
    console.log('✅ Created performance indexes');
    console.log('✅ Cleaned up corrupted data');
    console.log('✅ Database schema is now compatible');

  } catch (error) {
    console.error('\n❌ Failed to fix Railway database:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run the fix
if (require.main === module) {
  fixRailwayDatabase()
    .then(() => {
      console.log('\n✅ Railway database fix completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Railway database fix failed:', error.message);
      process.exit(1);
    });
}

module.exports = { fixRailwayDatabase };
