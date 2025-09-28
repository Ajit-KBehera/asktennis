const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create simple schema for testing
async function createSimpleSchema() {
  console.log('🏗️  Creating simple tennis schema...');
  
  try {
    // Drop existing tables
    await pool.query('DROP TABLE IF EXISTS tennis_matches_simple CASCADE');
    
    // Create simple matches table
    await pool.query(`
      CREATE TABLE tennis_matches_simple (
        id SERIAL PRIMARY KEY,
        match_id VARCHAR(50),
        tourney_name VARCHAR(100),
        surface VARCHAR(20),
        year INTEGER,
        round VARCHAR(20),
        winner VARCHAR(100),
        loser VARCHAR(100),
        set1 VARCHAR(20),
        set2 VARCHAR(20),
        set3 VARCHAR(20),
        set4 VARCHAR(20),
        set5 VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create indexes
    await pool.query('CREATE INDEX idx_simple_year ON tennis_matches_simple(year)');
    await pool.query('CREATE INDEX idx_simple_tourney ON tennis_matches_simple(tourney_name)');
    await pool.query('CREATE INDEX idx_simple_round ON tennis_matches_simple(round)');
    
    console.log('✅ Simple schema created successfully');
  } catch (error) {
    console.error('❌ Error creating schema:', error.message);
    throw error;
  }
}

// Load data in very small batches
async function loadSimpleData() {
  console.log('📊 Loading simple tennis data...');
  
  const filePath = '/app/data/complete_tennis_data.csv';
  let processed = 0;
  let batch = [];
  const BATCH_SIZE = 100; // Very small batches
  const MAX_RECORDS = 1000; // Limit to 1000 records for testing
  
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', async (record) => {
        if (processed >= MAX_RECORDS) {
          stream.destroy();
          return;
        }
        
        try {
          // Process only essential fields
          const processedRecord = {
            match_id: record.match_id || `match_${processed}`,
            tourney_name: record.tourney_name || 'Unknown',
            surface: record.surface || 'Unknown',
            year: parseInt(record.year) || null,
            round: record.round || 'Unknown',
            winner: record.winner || 'Unknown',
            loser: record.loser || 'Unknown',
            set1: record.set1 || '',
            set2: record.set2 || '',
            set3: record.set3 || '',
            set4: record.set4 || '',
            set5: record.set5 || ''
          };
          
          batch.push(processedRecord);
          
          // Insert batch when it reaches BATCH_SIZE
          if (batch.length >= BATCH_SIZE) {
            try {
              await insertBatch(batch);
              batch = [];
              processed += BATCH_SIZE;
              console.log(`📈 Processed ${processed} records...`);
            } catch (error) {
              console.log(`⚠️  Error inserting batch: ${error.message}`);
              batch = [];
            }
          }
          
        } catch (error) {
          console.log(`⚠️  Error processing record ${processed}: ${error.message}`);
        }
      })
      .on('end', async () => {
        // Insert remaining records
        if (batch.length > 0) {
          try {
            await insertBatch(batch);
            processed += batch.length;
          } catch (error) {
            console.log(`⚠️  Error inserting final batch: ${error.message}`);
          }
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

// Insert batch of records
async function insertBatch(batch) {
  if (batch.length === 0) return;
  
  const values = batch.map(record => 
    `('${record.match_id}', '${record.tourney_name}', '${record.surface}', 
     ${record.year}, '${record.round}', '${record.winner}', '${record.loser}',
     '${record.set1}', '${record.set2}', '${record.set3}', '${record.set4}', '${record.set5}')`
  ).join(',');
  
  const query = `
    INSERT INTO tennis_matches_simple (match_id, tourney_name, surface, year, round, 
                                       winner, loser, set1, set2, set3, set4, set5)
    VALUES ${values}
  `;
  
  await pool.query(query);
}

// Test queries
async function testQueries() {
  console.log('\n🧪 Testing queries...');
  
  try {
    // Test 1: Count total records
    const count = await pool.query('SELECT COUNT(*) FROM tennis_matches_simple');
    console.log(`📊 Total records: ${count.rows[0].count}`);
    
    // Test 2: Get recent matches
    const recent = await pool.query(`
      SELECT tourney_name, year, winner, loser, set1, set2, set3
      FROM tennis_matches_simple 
      WHERE year >= 2020 
      ORDER BY year DESC 
      LIMIT 5
    `);
    console.log('📈 Recent matches:', recent.rows);
    
    // Test 3: Get tournament winners
    const winners = await pool.query(`
      SELECT tourney_name, year, winner, loser
      FROM tennis_matches_simple 
      WHERE round = 'F' 
      AND year >= 2020
      ORDER BY year DESC 
      LIMIT 5
    `);
    console.log('🏆 Tournament winners:', winners.rows);
    
  } catch (error) {
    console.error('❌ Error testing queries:', error.message);
  }
}

// Main function
async function main() {
  try {
    console.log('🎾 Loading Simple Tennis Data System...');
    
    await createSimpleSchema();
    await loadSimpleData();
    await testQueries();
    
    console.log('\n✅ Simple tennis data loading completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
