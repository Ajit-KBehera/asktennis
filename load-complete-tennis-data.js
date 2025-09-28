const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Configuration
const CHUNK_SIZE = 5000; // Process 5k records at a time
const BATCH_SIZE = 500;   // Insert in batches of 500
const MAX_RECORDS = 5000; // Limit for initial testing

// Create optimized database schema for complete tennis data
async function createCompleteTennisSchema() {
  console.log('🏗️  Creating complete tennis database schema...');
  
  try {
    // Drop existing tables if they exist
    await pool.query('DROP TABLE IF EXISTS tennis_matches_simple CASCADE');
    await pool.query('DROP TABLE IF EXISTS tennis_players CASCADE');
    await pool.query('DROP TABLE IF EXISTS tennis_tournaments CASCADE');
    
    // Main matches table - simplified for the complete dataset
    await pool.query(`
      CREATE TABLE tennis_matches_simple (
        id SERIAL PRIMARY KEY,
        tourney_id VARCHAR(20),
        tourney_name VARCHAR(100),
        surface VARCHAR(20),
        draw_size INTEGER,
        tourney_level VARCHAR(50),
        year INTEGER,
        month INTEGER,
        date DATE,
        match_num INTEGER,
        winner VARCHAR(100),
        loser VARCHAR(100),
        winner_id DECIMAL,
        loser_id DECIMAL,
        winner_rank DECIMAL,
        loser_rank DECIMAL,
        player1_id DECIMAL,
        player1_seed DECIMAL,
        player1_entry VARCHAR(10),
        player1_name VARCHAR(100),
        player1_hand VARCHAR(5),
        player1_ht DECIMAL,
        player1_ioc VARCHAR(3),
        player1_age DECIMAL,
        player2_id DECIMAL,
        player2_seed DECIMAL,
        player2_entry VARCHAR(10),
        player2_name VARCHAR(100),
        player2_hand VARCHAR(5),
        player2_ht DECIMAL,
        player2_ioc VARCHAR(3),
        player2_age DECIMAL,
        set1 VARCHAR(20),
        set2 VARCHAR(20),
        set3 VARCHAR(20),
        set4 VARCHAR(20),
        set5 VARCHAR(20),
        best_of INTEGER,
        round VARCHAR(20),
        minutes INTEGER,
        winner_ace INTEGER,
        winner_df INTEGER,
        winner_svpt INTEGER,
        winner_1stIn INTEGER,
        winner_1stWon INTEGER,
        winner_2ndWon INTEGER,
        winner_SvGms INTEGER,
        winner_bpSaved INTEGER,
        winner_bpFaced INTEGER,
        loser_ace INTEGER,
        loser_df INTEGER,
        loser_svpt INTEGER,
        loser_1stIn INTEGER,
        loser_1stWon INTEGER,
        loser_2ndWon INTEGER,
        loser_SvGms INTEGER,
        loser_bpSaved INTEGER,
        loser_bpFaced INTEGER,
        player1_rank DECIMAL,
        player1_rank_points DECIMAL,
        player2_rank DECIMAL,
        player2_rank_points DECIMAL,
        tour VARCHAR(10),
        data_source VARCHAR(50),
        match_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Player information table
    await pool.query(`
      CREATE TABLE tennis_players (
        id SERIAL PRIMARY KEY,
        player_id VARCHAR(20) UNIQUE,
        name VARCHAR(100),
        hand VARCHAR(5),
        height INTEGER,
        ioc VARCHAR(3),
        age DECIMAL(3,1),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Match results table
    await pool.query(`
      CREATE TABLE match_results (
        id SERIAL PRIMARY KEY,
        match_id VARCHAR(50),
        winner_id VARCHAR(20),
        loser_id VARCHAR(20),
        winner_rank INTEGER,
        loser_rank INTEGER,
        set1 VARCHAR(20),
        set2 VARCHAR(20),
        set3 VARCHAR(20),
        set4 VARCHAR(20),
        set5 VARCHAR(20),
        FOREIGN KEY (match_id) REFERENCES tennis_matches(match_id)
      )
    `);
    
    // Match statistics table
    await pool.query(`
      CREATE TABLE match_statistics (
        id SERIAL PRIMARY KEY,
        match_id VARCHAR(50),
        player_id VARCHAR(20),
        is_winner BOOLEAN,
        aces INTEGER,
        double_faults INTEGER,
        service_points INTEGER,
        first_serves_in INTEGER,
        first_serves_won INTEGER,
        second_serves_won INTEGER,
        service_games INTEGER,
        break_points_saved INTEGER,
        break_points_faced INTEGER,
        rank_points INTEGER,
        FOREIGN KEY (match_id) REFERENCES tennis_matches(match_id)
      )
    `);
    
    // Create performance indexes
    await pool.query('CREATE INDEX idx_tennis_matches_year ON tennis_matches(year)');
    await pool.query('CREATE INDEX idx_tennis_matches_tourney ON tennis_matches(tourney_name)');
    await pool.query('CREATE INDEX idx_tennis_matches_surface ON tennis_matches(surface)');
    await pool.query('CREATE INDEX idx_tennis_matches_round ON tennis_matches(round)');
    await pool.query('CREATE INDEX idx_match_results_winner ON match_results(winner_id)');
    await pool.query('CREATE INDEX idx_match_results_loser ON match_results(loser_id)');
    await pool.query('CREATE INDEX idx_match_statistics_player ON match_statistics(player_id)');
    
    console.log('✅ Complete tennis schema created successfully');
  } catch (error) {
    console.error('❌ Error creating schema:', error.message);
    throw error;
  }
}

// Data cleaning and validation functions
function cleanString(str) {
  if (!str || str === 'NaN' || str === '') return null;
  return str.toString().trim();
}

function parseInteger(str) {
  if (!str || str === 'NaN' || str === '') return null;
  const parsed = parseInt(str);
  return isNaN(parsed) ? null : parsed;
}

function parseFloat(str) {
  if (!str || str === 'NaN' || str === '') return null;
  const parsed = parseFloat(str);
  return isNaN(parsed) ? null : parsed;
}

function parseDate(year, month, date) {
  if (!year || !month || !date) return null;
  try {
    const y = parseInt(year);
    const m = parseInt(month);
    const d = parseInt(date);
    
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    if (y < 1800 || y > 2030) return null;
    if (m < 1 || m > 12) return null;
    if (d < 1 || d > 31) return null;
    
    return `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
  } catch (error) {
    return null;
  }
}

// Process a single record
function processRecord(record) {
  const matchDate = parseDate(record.year, record.month, record.date);
  
  return {
    // Match information
    match_id: cleanString(record.match_id),
    tourney_id: cleanString(record.tourney_id),
    tourney_name: cleanString(record.tourney_name),
    surface: cleanString(record.surface),
    draw_size: parseInteger(record.draw_size),
    tourney_level: cleanString(record.tourney_level),
    year: parseInteger(record.year),
    month: parseInteger(record.month),
    date: matchDate,
    match_num: parseInteger(record.match_num),
    round: cleanString(record.round),
    minutes: parseInteger(record.minutes),
    best_of: parseInteger(record.best_of),
    tour: cleanString(record.tour),
    data_source: cleanString(record.data_source),
    
    // Player information
    winner: cleanString(record.winner),
    loser: cleanString(record.loser),
    winner_id: cleanString(record.winner_id),
    loser_id: cleanString(record.loser_id),
    winner_rank: parseInteger(record.winner_rank),
    loser_rank: parseInteger(record.loser_rank),
    
    // Match results
    set1: cleanString(record.set1),
    set2: cleanString(record.set2),
    set3: cleanString(record.set3),
    set4: cleanString(record.set4),
    set5: cleanString(record.set5),
    
    // Statistics
    winner_ace: parseInteger(record.winner_ace),
    winner_df: parseInteger(record.winner_df),
    winner_svpt: parseInteger(record.winner_svpt),
    winner_1stIn: parseInteger(record.winner_1stIn),
    winner_1stWon: parseInteger(record.winner_1stWon),
    winner_2ndWon: parseInteger(record.winner_2ndWon),
    winner_SvGms: parseInteger(record.winner_SvGms),
    winner_bpSaved: parseInteger(record.winner_bpSaved),
    winner_bpFaced: parseInteger(record.winner_bpFaced),
    loser_ace: parseInteger(record.loser_ace),
    loser_df: parseInteger(record.loser_df),
    loser_svpt: parseInteger(record.loser_svpt),
    loser_1stIn: parseInteger(record.loser_1stIn),
    loser_1stWon: parseInteger(record.loser_1stWon),
    loser_2ndWon: parseInteger(record.loser_2ndWon),
    loser_SvGms: parseInteger(record.loser_SvGms),
    loser_bpSaved: parseInteger(record.loser_bpSaved),
    loser_bpFaced: parseInteger(record.loser_bpFaced),
    player1_rank_points: parseInteger(record.player1_rank_points),
    player2_rank_points: parseInteger(record.player2_rank_points)
  };
}

// Insert batch of matches
async function insertMatchesBatch(matches) {
  if (matches.length === 0) return;
  
  const values = matches.map(match => 
    `('${match.match_id}', '${match.tourney_id}', '${match.tourney_name}', '${match.surface}', 
     ${match.draw_size}, '${match.tourney_level}', ${match.year}, ${match.month}, 
     '${match.date}', ${match.match_num}, '${match.round}', ${match.minutes}, 
     ${match.best_of}, '${match.tour}', '${match.data_source}')`
  ).join(',');
  
  const query = `
    INSERT INTO tennis_matches (match_id, tourney_id, tourney_name, surface, draw_size, 
                               tourney_level, year, month, date, match_num, round, 
                               minutes, best_of, tour, data_source)
    VALUES ${values}
    ON CONFLICT (match_id) DO NOTHING
  `;
  
  await pool.query(query);
}

// Insert batch of match results
async function insertMatchResultsBatch(results) {
  if (results.length === 0) return;
  
  const values = results.map(result => 
    `('${result.match_id}', '${result.winner_id}', '${result.loser_id}', 
     ${result.winner_rank}, ${result.loser_rank}, '${result.set1}', '${result.set2}', 
     '${result.set3}', '${result.set4}', '${result.set5}')`
  ).join(',');
  
  const query = `
    INSERT INTO match_results (match_id, winner_id, loser_id, winner_rank, loser_rank,
                              set1, set2, set3, set4, set5)
    VALUES ${values}
    ON CONFLICT DO NOTHING
  `;
  
  await pool.query(query);
}

// Insert batch of match statistics
async function insertMatchStatisticsBatch(statistics) {
  if (statistics.length === 0) return;
  
  const values = statistics.map(stat => 
    `('${stat.match_id}', '${stat.player_id}', ${stat.is_winner}, ${stat.aces}, 
     ${stat.double_faults}, ${stat.service_points}, ${stat.first_serves_in}, 
     ${stat.first_serves_won}, ${stat.second_serves_won}, ${stat.service_games}, 
     ${stat.break_points_saved}, ${stat.break_points_faced}, ${stat.rank_points})`
  ).join(',');
  
  const query = `
    INSERT INTO match_statistics (match_id, player_id, is_winner, aces, double_faults,
                                 service_points, first_serves_in, first_serves_won,
                                 second_serves_won, service_games, break_points_saved,
                                 break_points_faced, rank_points)
    VALUES ${values}
    ON CONFLICT DO NOTHING
  `;
  
  await pool.query(query);
}

// Load complete tennis data
async function loadCompleteTennisData() {
  console.log('📊 Loading complete tennis data...');
  
  const filePath = '/app/data/complete_tennis_data.csv';
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ Complete tennis data file not found');
    return;
  }
  
  let processed = 0;
  let matches = [];
  let results = [];
  let statistics = [];
  
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', async (record) => {
        if (processed >= MAX_RECORDS) {
          stream.destroy();
          return;
        }
        
        try {
          const processedRecord = processRecord(record);
          
          // Add to matches batch
          matches.push(processedRecord);
          
          // Add to results batch
          if (processedRecord.winner_id && processedRecord.loser_id) {
            results.push({
              match_id: processedRecord.match_id,
              winner_id: processedRecord.winner_id,
              loser_id: processedRecord.loser_id,
              winner_rank: processedRecord.winner_rank,
              loser_rank: processedRecord.loser_rank,
              set1: processedRecord.set1,
              set2: processedRecord.set2,
              set3: processedRecord.set3,
              set4: processedRecord.set4,
              set5: processedRecord.set5
            });
          }
          
          // Add to statistics batch
          if (processedRecord.winner_id) {
            statistics.push({
              match_id: processedRecord.match_id,
              player_id: processedRecord.winner_id,
              is_winner: true,
              aces: processedRecord.winner_ace,
              double_faults: processedRecord.winner_df,
              service_points: processedRecord.winner_svpt,
              first_serves_in: processedRecord.winner_1stIn,
              first_serves_won: processedRecord.winner_1stWon,
              second_serves_won: processedRecord.winner_2ndWon,
              service_games: processedRecord.winner_SvGms,
              break_points_saved: processedRecord.winner_bpSaved,
              break_points_faced: processedRecord.winner_bpFaced,
              rank_points: processedRecord.player1_rank_points
            });
          }
          
          if (processedRecord.loser_id) {
            statistics.push({
              match_id: processedRecord.match_id,
              player_id: processedRecord.loser_id,
              is_winner: false,
              aces: processedRecord.loser_ace,
              double_faults: processedRecord.loser_df,
              service_points: processedRecord.loser_svpt,
              first_serves_in: processedRecord.loser_1stIn,
              first_serves_won: processedRecord.loser_1stWon,
              second_serves_won: processedRecord.loser_2ndWon,
              service_games: processedRecord.loser_SvGms,
              break_points_saved: processedRecord.loser_bpSaved,
              break_points_faced: processedRecord.loser_bpFaced,
              rank_points: processedRecord.player2_rank_points
            });
          }
          
          // Process batch when it reaches BATCH_SIZE
          if (matches.length >= BATCH_SIZE) {
            try {
              await insertMatchesBatch(matches);
              await insertMatchResultsBatch(results);
              await insertMatchStatisticsBatch(statistics);
              
              matches = [];
              results = [];
              statistics = [];
              
              // Force garbage collection
              if (global.gc) {
                global.gc();
              }
            } catch (error) {
              console.log(`⚠️  Error inserting batch: ${error.message}`);
              matches = [];
              results = [];
              statistics = [];
            }
          }
          
          processed++;
          
          if (processed % 10000 === 0) {
            console.log(`📈 Processed ${processed} records...`);
          }
          
        } catch (error) {
          console.log(`⚠️  Error processing record ${processed}:`, error.message);
        }
      })
      .on('end', async () => {
        // Insert remaining records
        if (matches.length > 0) {
          await insertMatchesBatch(matches);
          await insertMatchResultsBatch(results);
          await insertMatchStatisticsBatch(statistics);
        }
        
        console.log(`✅ Completed loading ${processed} records`);
        resolve();
      })
      .on('error', (error) => {
        console.error('❌ Error reading file:', error.message);
        reject(error);
      });
  });
}

// Main function
async function main() {
  try {
    console.log('🎾 Loading Complete Tennis Data System...');
    
    await createCompleteTennisSchema();
    await loadCompleteTennisData();
    
    // Check final statistics
    const matchesCount = await pool.query('SELECT COUNT(*) FROM tennis_matches');
    const resultsCount = await pool.query('SELECT COUNT(*) FROM match_results');
    const statsCount = await pool.query('SELECT COUNT(*) FROM match_statistics');
    
    console.log('\n📊 Final Database Statistics:');
    console.log('Tennis Matches:', matchesCount.rows[0].count);
    console.log('Match Results:', resultsCount.rows[0].count);
    console.log('Match Statistics:', statsCount.rows[0].count);
    
    // Test a few queries
    console.log('\n🧪 Testing queries...');
    
    // Test tournament winner query
    const wimbledon2019 = await pool.query(`
      SELECT tm.tourney_name, tm.year, mr.winner_id, mr.loser_id, mr.set1, mr.set2, mr.set3
      FROM tennis_matches tm
      JOIN match_results mr ON tm.match_id = mr.match_id
      WHERE tm.tourney_name ILIKE '%wimbledon%' 
      AND tm.year = 2019 
      AND tm.round = 'F'
      LIMIT 1
    `);
    
    if (wimbledon2019.rows.length > 0) {
      console.log('✅ Wimbledon 2019 query successful');
    }
    
    console.log('\n✅ Complete tennis data loading completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
