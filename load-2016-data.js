const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create historical tables
async function createHistoricalTables() {
  console.log('🏗️  Creating historical data tables...');
  
  try {
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

// Load 2016 Grand Slam data
async function load2016GrandSlams() {
  console.log('🏆 Loading 2016 Grand Slam data...');
  
  try {
    // 2016 French Open (Roland Garros) - Novak Djokovic won
    await pool.query(`
      INSERT INTO historical_matches (tournament_name, tournament_date, round, winner_name, loser_name, score, year)
      VALUES ('French Open', '2016-06-05', 'F', 'Novak Djokovic', 'Andy Murray', '3-6 6-1 6-2 6-4', 2016)
    `);
    
    // 2016 Wimbledon - Andy Murray won
    await pool.query(`
      INSERT INTO historical_matches (tournament_name, tournament_date, round, winner_name, loser_name, score, year)
      VALUES ('Wimbledon', '2016-07-10', 'F', 'Andy Murray', 'Milos Raonic', '6-4 7-6(3) 7-6(2)', 2016)
    `);
    
    // 2016 US Open - Stan Wawrinka won
    await pool.query(`
      INSERT INTO historical_matches (tournament_name, tournament_date, round, winner_name, loser_name, score, year)
      VALUES ('US Open', '2016-09-11', 'F', 'Stan Wawrinka', 'Novak Djokovic', '6-7(1) 6-4 7-5 6-3', 2016)
    `);
    
    // 2016 Australian Open - Novak Djokovic won
    await pool.query(`
      INSERT INTO historical_matches (tournament_name, tournament_date, round, winner_name, loser_name, score, year)
      VALUES ('Australian Open', '2016-01-31', 'F', 'Novak Djokovic', 'Andy Murray', '6-1 7-5 7-6(3)', 2016)
    `);
    
    console.log('✅ 2016 Grand Slam data loaded successfully');
  } catch (error) {
    console.error('❌ Error loading 2016 data:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log('🎾 Loading 2016 Tennis Data...');
    
    await createHistoricalTables();
    await load2016GrandSlams();
    
    // Check final counts
    const matchesCount = await pool.query('SELECT COUNT(*) FROM historical_matches');
    const frenchOpen2016 = await pool.query(`
      SELECT * FROM historical_matches 
      WHERE tournament_name = 'French Open' 
      AND year = 2016 
      AND round = 'F'
    `);
    
    console.log('\n📊 Database Statistics:');
    console.log('Historical Matches:', matchesCount.rows[0].count);
    
    if (frenchOpen2016.rows.length > 0) {
      console.log('\n🏆 2016 French Open Winner:');
      const match = frenchOpen2016.rows[0];
      console.log(`${match.winner_name} defeated ${match.loser_name} ${match.score}`);
    }
    
    console.log('\n✅ 2016 data loading completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
