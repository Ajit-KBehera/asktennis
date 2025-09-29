const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const database = require('./database/connection');

class CSVDataLoader {
  constructor() {
    this.dataDirectory = path.join(__dirname, '../data');
    this.completeDatasetPath = path.join(__dirname, '../data/complete_tennis_data.csv');
    this.isLoading = false;
    this.lastLoadTime = null;
    this.loadStats = {
      matches: 0,
      players: 0,
      rankings: 0,
      errors: 0
    };
  }

  hasCSVData() {
    return fs.existsSync(this.completeDatasetPath);
  }

  getAvailableFiles() {
    if (!this.hasCSVData()) {
      return [];
    }
    return ['complete_tennis_data.csv'];
  }

  async loadAllData() {
    if (this.isLoading) {
      throw new Error('Data loading already in progress');
    }

    if (!this.hasCSVData()) {
      throw new Error('Complete tennis dataset not found at: ' + this.completeDatasetPath);
    }

    this.isLoading = true;
    this.loadStats = { matches: 0, players: 0, rankings: 0, errors: 0 };

    try {
      console.log('🔄 Starting CSV data loading with streaming approach...');
      
      if (!database.pool) {
        await database.connect();
      }

      console.log('📁 Loading complete tennis dataset...');
      console.log(`📊 Dataset path: ${this.completeDatasetPath}`);

      await this.loadCompleteDatasetStreaming();

      this.lastLoadTime = new Date();
      console.log('✅ CSV data loading completed successfully');
      console.log(`📊 Loaded: ${this.loadStats.matches} matches, ${this.loadStats.players} players, ${this.loadStats.rankings} rankings`);

      return {
        success: true,
        stats: this.loadStats,
        lastLoad: this.lastLoadTime
      };

    } catch (error) {
      console.error('❌ CSV data loading failed:', error.message);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async loadCompleteDatasetStreaming() {
    console.log('🎾 Loading complete tennis dataset with streaming...');
    console.log(`📊 File size: ${this.getFileSize()} MB`);

    return new Promise((resolve, reject) => {
      let processedCount = 0;
      const batchSize = 10; // Very small batches
      let batch = [];
      
      const client = database.pool.connect();

      client.then(async (dbClient) => {
        try {
          await dbClient.query('BEGIN');

          fs.createReadStream(this.completeDatasetPath)
            .pipe(csv())
            .on('data', async (data) => {
              batch.push(data);
              
              if (batch.length >= batchSize) {
                await this.processBatchStreaming(dbClient, batch);
                processedCount += batch.length;
                batch = [];
                
                console.log(`📊 Processed ${processedCount} records...`);
                
                if (processedCount % 100 === 0) {
                  if (global.gc) {
                    global.gc();
                  }
                }
              }
            })
            .on('end', async () => {
              try {
                if (batch.length > 0) {
                  await this.processBatchStreaming(dbClient, batch);
                  processedCount += batch.length;
                }

                await dbClient.query('COMMIT');
                console.log(`✅ Complete dataset processed successfully (${processedCount} total records)`);
                resolve();
              } catch (error) {
                await dbClient.query('ROLLBACK');
                console.error(`❌ Error processing complete dataset:`, error.message);
                this.loadStats.errors++;
                reject(error);
              } finally {
                dbClient.release();
              }
            })
            .on('error', (error) => {
              console.error(`❌ Error reading complete dataset:`, error.message);
              this.loadStats.errors++;
              reject(error);
            });
        } catch (error) {
          console.error(`❌ Database error for complete dataset:`, error.message);
          this.loadStats.errors++;
          reject(error);
        }
      }).catch(reject);
    });
  }

  async processBatchStreaming(client, batch) {
    for (const record of batch) {
      try {
        if (this.isMatchRecord(record)) {
          await this.processMatchRecord(client, record);
        } else if (this.isPlayerRecord(record)) {
          await this.processPlayerRecord(client, record);
        } else if (this.isRankingRecord(record)) {
          await this.processRankingRecord(client, record);
        }
      } catch (error) {
        console.error('Error processing record:', error.message);
        this.loadStats.errors++;
      }
    }
  }

  isMatchRecord(record) {
    const keys = Object.keys(record);
    return keys.some(key => 
      key.toLowerCase().includes('winner') || 
      key.toLowerCase().includes('loser') ||
      key.toLowerCase().includes('tournament') ||
      key.toLowerCase().includes('match')
    );
  }

  isPlayerRecord(record) {
    const keys = Object.keys(record);
    return keys.some(key => 
      key.toLowerCase().includes('player') ||
      key.toLowerCase().includes('name') ||
      key.toLowerCase().includes('country')
    ) && !this.isMatchRecord(record);
  }

  isRankingRecord(record) {
    const keys = Object.keys(record);
    return keys.some(key => 
      key.toLowerCase().includes('ranking') ||
      key.toLowerCase().includes('rank') ||
      key.toLowerCase().includes('points')
    );
  }

  async processMatchRecord(client, record) {
    try {
      await client.query(`
        INSERT INTO tennis_matches_simple (
          tourney_name, surface, year, winner, loser, set1, set2, set3, 
          round, minutes, winner_rank, loser_rank, tourney_level, draw_size
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        record.tourney_name || record.tournament || record.tourney || 'Unknown',
        record.surface || 'Unknown',
        parseInt(record.year) || new Date().getFullYear(),
        record.winner || record.winner_name || 'Unknown',
        record.loser || record.loser_name || 'Unknown',
        record.set1 || record.score1 || '0-0',
        record.set2 || record.score2 || '0-0',
        record.set3 || record.score3 || '0-0',
        record.round || record.stage || 'Unknown',
        parseInt(record.minutes) || 0,
        parseInt(record.winner_rank) || 0,
        parseInt(record.loser_rank) || 0,
        record.tourney_level || record.level || 'Unknown',
        parseInt(record.draw_size) || 32
      ]);
      this.loadStats.matches++;
    } catch (error) {
      console.error('Error inserting match:', error.message);
      this.loadStats.errors++;
    }
  }

  async processPlayerRecord(client, record) {
    try {
      await client.query(`
        INSERT INTO players (
          name, country, country_code, current_ranking, career_prize_money, 
          tour, gender, height, weight, birth_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        record.name || record.player_name || 'Unknown Player',
        record.country || record.nationality || 'Unknown',
        record.country_code || record.country || 'UNK',
        parseInt(record.current_ranking) || parseInt(record.ranking) || null,
        parseInt(record.career_prize_money) || parseInt(record.prize_money) || 0,
        record.tour || 'ATP',
        record.gender || 'M',
        parseInt(record.height) || null,
        parseInt(record.weight) || null,
        record.birth_date || record.birthday || null
      ]);
      this.loadStats.players++;
    } catch (error) {
      console.error('Error inserting player:', error.message);
      this.loadStats.errors++;
    }
  }

  async processRankingRecord(client, record) {
    try {
      const playerResult = await client.query(
        'SELECT id FROM players WHERE name = $1',
        [record.player_name || record.name || 'Unknown']
      );

      let playerId;
      if (playerResult.rows.length === 0) {
        const insertResult = await client.query(`
          INSERT INTO players (name, country, country_code, tour, gender)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [
          record.player_name || record.name || 'Unknown',
          record.country || 'Unknown',
          record.country_code || 'UNK',
          record.tour || 'ATP',
          record.gender || 'M'
        ]);
        playerId = insertResult.rows[0].id;
      } else {
        playerId = playerResult.rows[0].id;
      }

      await client.query(`
        INSERT INTO rankings (player_id, ranking, points, tour, ranking_date)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        playerId,
        parseInt(record.ranking) || parseInt(record.rank) || 0,
        parseInt(record.points) || 0,
        record.tour || 'ATP',
        record.ranking_date || record.date || new Date().toISOString().split('T')[0]
      ]);
      this.loadStats.rankings++;
    } catch (error) {
      console.error('Error processing ranking record:', error.message);
      this.loadStats.errors++;
    }
  }

  getFileSize() {
    try {
      const stats = fs.statSync(this.completeDatasetPath);
      return (stats.size / (1024 * 1024)).toFixed(2);
    } catch (error) {
      return 'Unknown';
    }
  }

  getStatus() {
    return {
      isLoading: this.isLoading,
      lastLoad: this.lastLoadTime,
      hasData: this.hasCSVData(),
      availableFiles: this.getAvailableFiles(),
      stats: this.loadStats
    };
  }

  async createSampleData() {
    if (this.hasCSVData()) {
      console.log('📁 Complete tennis dataset already available');
      return;
    }

    console.log('📝 Creating sample CSV data...');

    if (!fs.existsSync(this.dataDirectory)) {
      fs.mkdirSync(this.dataDirectory, { recursive: true });
    }

    const matchesData = [
      'tourney_name,surface,year,winner,loser,set1,set2,set3,round,minutes,winner_rank,loser_rank',
      'Wimbledon,Grass,2023,Carlos Alcaraz,Novak Djokovic,1-6,7-6(6),6-1,3-6,6-4,F,288,1,2',
      'US Open,Hard,2023,Novak Djokovic,Daniil Medvedev,6-3,7-6(5),6-3,,,F,195,2,3',
      'French Open,Clay,2023,Novak Djokovic,Casper Ruud,7-6(1),6-3,7-5,,,F,178,1,4',
      'Australian Open,Hard,2023,Novak Djokovic,Stefanos Tsitsipas,6-3,7-6(4),7-6(5),,,F,165,1,3'
    ];

    fs.writeFileSync(
      path.join(this.dataDirectory, 'tennis_matches_sample.csv'),
      matchesData.join('\n')
    );

    const playersData = [
      'name,country,country_code,current_ranking,career_prize_money,tour,gender,height,weight',
      'Carlos Alcaraz,ESP,ESP,1,15000000,ATP,M,185,72',
      'Novak Djokovic,SRB,SRB,2,180000000,ATP,M,188,77',
      'Daniil Medvedev,RUS,RUS,3,25000000,ATP,M,198,83',
      'Rafael Nadal,ESP,ESP,4,140000000,ATP,M,185,85'
    ];

    fs.writeFileSync(
      path.join(this.dataDirectory, 'players_sample.csv'),
      playersData.join('\n')
    );

    console.log('✅ Sample CSV data created');
  }

  async clearAllData() {
    try {
      console.log('🗑️  Clearing all data from database...');
      
      if (!database.pool) {
        await database.connect();
      }

      const client = await database.pool.connect();
      try {
        await client.query('BEGIN');
        
        await client.query('DELETE FROM rankings');
        await client.query('DELETE FROM tennis_matches_simple');
        await client.query('DELETE FROM players');
        
        await client.query('COMMIT');
        console.log('✅ All data cleared from database');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Error clearing data:', error.message);
      throw error;
    }
  }
}

module.exports = new CSVDataLoader();
