const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create historical tables
async function createHistoricalTables() {
  console.log('🏗️  Creating historical data tables...');
  
  try {
    // Historical rankings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historical_rankings (
        id SERIAL PRIMARY KEY,
        player_name VARCHAR(255),
        ranking INTEGER,
        points INTEGER,
        ranking_date DATE,
        year INTEGER,
        decade INTEGER,
        tour VARCHAR(10),
        country VARCHAR(3),
        data_source VARCHAR(50) DEFAULT 'github'
      )
    `);

    // Historical players table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historical_players (
        id SERIAL PRIMARY KEY,
        player_id VARCHAR(50),
        name VARCHAR(255),
        country VARCHAR(3),
        birth_date DATE,
        height INTEGER,
        weight INTEGER,
        playing_hand VARCHAR(10),
        turned_pro INTEGER,
        data_source VARCHAR(50) DEFAULT 'github'
      )
    `);

    // Historical matches table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historical_matches (
        id SERIAL PRIMARY KEY,
        tournament_name VARCHAR(255),
        tournament_date DATE,
        round VARCHAR(50),
        winner_name VARCHAR(255),
        loser_name VARCHAR(255),
        score VARCHAR(100),
        year INTEGER,
        data_source VARCHAR(50) DEFAULT 'github'
      )
    `);

    console.log('✅ Historical tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    throw error;
  }
}

// Load data from CSV files
async function loadHistoricalData() {
  console.log('📊 Loading historical data from CSV files...');
  
  try {
    const dataDir = '/app/data';
    
    // Check if data directory exists
    if (!fs.existsSync(dataDir)) {
      console.log('📁 Data directory not found, creating sample data...');
      await createSampleData();
      return;
    }

    // Load ATP rankings (2010-2023)
    const atpRankingsPath = path.join(dataDir, 'tennis_atp/atp_rankings_10s.csv');
    if (fs.existsSync(atpRankingsPath)) {
      console.log('📈 Loading ATP rankings...');
      await loadRankingsData(atpRankingsPath, 'ATP');
    }

    // Load WTA rankings (2010-2023)
    const wtaRankingsPath = path.join(dataDir, 'tennis_wta/wta_rankings_10s.csv');
    if (fs.existsSync(wtaRankingsPath)) {
      console.log('📈 Loading WTA rankings...');
      await loadRankingsData(wtaRankingsPath, 'WTA');
    }

    // Load 2016 match results
    const matchResultsPath = path.join(dataDir, 'tennis_atp/atp_matches_2016.csv');
    if (fs.existsSync(matchResultsPath)) {
      console.log('🏆 Loading 2016 match results...');
      await loadMatchData(matchResultsPath);
    }

    console.log('✅ Historical data loaded successfully');
  } catch (error) {
    console.error('❌ Error loading historical data:', error.message);
    throw error;
  }
}

// Load rankings data from CSV
async function loadRankingsData(filePath, tour) {
  const csvContent = fs.readFileSync(filePath, 'utf8');
  const lines = csvContent.split('\n').slice(1); // Skip header
  
  let count = 0;
  for (const line of lines) {
    if (line.trim()) {
      const [ranking_date, rank, player, points] = line.split(',');
      
      // Filter out invalid data
      if (rank && points && 
          rank !== 'NaN' && points !== 'NaN' && 
          !isNaN(parseInt(rank)) && !isNaN(parseInt(points)) &&
          parseInt(rank) > 0 && parseInt(points) >= 0) {
        
        const year = new Date(ranking_date).getFullYear();
        const decade = Math.floor(year / 10) * 10;
        
        try {
          await pool.query(`
            INSERT INTO historical_rankings (player_name, ranking, points, ranking_date, year, decade, tour)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [player, parseInt(rank), parseInt(points), ranking_date, year, decade, tour]);
          
          count++;
        } catch (error) {
          console.log(`⚠️  Skipping invalid row: ${line.substring(0, 50)}...`);
        }
      }
    }
  }
  
  console.log(`✅ Loaded ${count} ${tour} rankings`);
}

// Load match data from CSV
async function loadMatchData(filePath) {
  const csvContent = fs.readFileSync(filePath, 'utf8');
  const lines = csvContent.split('\n').slice(1); // Skip header
  
  let count = 0;
  for (const line of lines) {
    if (line.trim()) {
      const columns = line.split(',');
      if (columns.length >= 10) {
        const [tourney_id, tourney_name, surface, draw_size, tourney_level, tourney_date, 
               match_num, winner_id, winner_seed, winner_entry, winner_name, winner_hand, 
               winner_ht, winner_ioc, winner_age, loser_id, loser_seed, loser_entry, 
               loser_name, loser_hand, loser_ht, loser_ioc, loser_age, score, best_of, 
               round, minutes, w_ace, w_df, w_svpt, w_1stIn, w_1stWon, w_2ndWon, w_SvGms, 
               w_bpSaved, w_bpFaced, l_ace, l_df, l_svpt, l_1stIn, l_1stWon, l_2ndWon, 
               l_SvGms, l_bpSaved, l_bpFaced, winner_rank, winner_rank_points, loser_rank, 
               loser_rank_points] = columns;
        
        if (tourney_name && winner_name && loser_name && 
            tourney_name !== 'NaN' && winner_name !== 'NaN' && loser_name !== 'NaN') {
          
          try {
            const year = new Date(tourney_date).getFullYear();
            
            await pool.query(`
              INSERT INTO historical_matches (tournament_name, tournament_date, round, winner_name, loser_name, score, year)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [tourney_name, tourney_date, round, winner_name, loser_name, score, year]);
            
            count++;
          } catch (error) {
            console.log(`⚠️  Skipping invalid match: ${tourney_name} - ${winner_name} vs ${loser_name}`);
          }
        }
      }
    }
  }
  
  console.log(`✅ Loaded ${count} match results`);
}

// Create sample data for testing
async function createSampleData() {
  console.log('📝 Creating sample historical data...');
  
  // Sample 2016 French Open final
  await pool.query(`
    INSERT INTO historical_matches (tournament_name, tournament_date, round, winner_name, loser_name, score, year)
    VALUES ('French Open', '2016-06-05', 'F', 'Novak Djokovic', 'Andy Murray', '3-6 6-1 6-2 6-4', 2016)
  `);
  
  // Sample 2016 Wimbledon final
  await pool.query(`
    INSERT INTO historical_matches (tournament_name, tournament_date, round, winner_name, loser_name, score, year)
    VALUES ('Wimbledon', '2016-07-10', 'F', 'Andy Murray', 'Milos Raonic', '6-4 7-6(3) 7-6(2)', 2016)
  `);
  
  // Sample 2016 US Open final
  await pool.query(`
    INSERT INTO historical_matches (tournament_name, tournament_date, round, winner_name, loser_name, score, year)
    VALUES ('US Open', '2016-09-11', 'F', 'Stan Wawrinka', 'Novak Djokovic', '6-7(1) 6-4 7-5 6-3', 2016)
  `);
  
  // Sample 2016 Australian Open final
  await pool.query(`
    INSERT INTO historical_matches (tournament_name, tournament_date, round, winner_name, loser_name, score, year)
    VALUES ('Australian Open', '2016-01-31', 'F', 'Novak Djokovic', 'Andy Murray', '6-1 7-5 7-6(3)', 2016)
  `);
  
  console.log('✅ Sample data created');
}

// Main function
async function main() {
  try {
    console.log('🎾 Loading AskTennis Historical Data...');
    
    await createHistoricalTables();
    await loadHistoricalData();
    
    // Check final counts
    const rankingsCount = await pool.query('SELECT COUNT(*) FROM historical_rankings');
    const matchesCount = await pool.query('SELECT COUNT(*) FROM historical_matches');
    
    console.log('\\n📊 Final Database Statistics:');
    console.log('Historical Rankings:', rankingsCount.rows[0].count);
    console.log('Historical Matches:', matchesCount.rows[0].count);
    
    console.log('\\n✅ Historical data loading completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
