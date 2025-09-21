const { Pool } = require('pg');

class HistoricalDatabase {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  /**
   * Initialize historical data tables
   */
  async initializeHistoricalSchema() {
    try {
      console.log('🔄 Initializing historical data schema...');

      // Historical rankings table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS historical_rankings (
          id SERIAL PRIMARY KEY,
          player_id VARCHAR(50),
          player_name VARCHAR(200) NOT NULL,
          ranking INTEGER NOT NULL,
          points INTEGER DEFAULT 0,
          tour VARCHAR(10) NOT NULL,
          ranking_date DATE NOT NULL,
          decade VARCHAR(10),
          year INTEGER,
          data_source VARCHAR(50) DEFAULT 'github',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(player_id, ranking_date, tour)
        )
      `);

      // Historical matches table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS historical_matches (
          id SERIAL PRIMARY KEY,
          tournament_name VARCHAR(200) NOT NULL,
          tournament_date DATE,
          surface VARCHAR(20),
          round VARCHAR(50),
          winner_name VARCHAR(200) NOT NULL,
          loser_name VARCHAR(200) NOT NULL,
          score VARCHAR(100),
          winner_rank INTEGER,
          loser_rank INTEGER,
          winner_points INTEGER,
          loser_points INTEGER,
          tour VARCHAR(10) NOT NULL,
          year INTEGER,
          data_source VARCHAR(50) DEFAULT 'github',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Historical players table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS historical_players (
          id SERIAL PRIMARY KEY,
          player_id VARCHAR(50) UNIQUE,
          name VARCHAR(200) NOT NULL,
          birth_date DATE,
          country VARCHAR(10),
          height INTEGER,
          weight INTEGER,
          playing_hand VARCHAR(20),
          turned_pro INTEGER,
          tour VARCHAR(10) NOT NULL,
          data_source VARCHAR(50) DEFAULT 'github',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Match charting table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS match_charting (
          id SERIAL PRIMARY KEY,
          match_id VARCHAR(100) UNIQUE,
          tournament VARCHAR(200),
          date DATE,
          surface VARCHAR(20),
          round VARCHAR(50),
          player1 VARCHAR(200),
          player2 VARCHAR(200),
          winner VARCHAR(200),
          score VARCHAR(100),
          data_source VARCHAR(50) DEFAULT 'github_charting',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Grand Slam matches table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS grand_slam_matches (
          id SERIAL PRIMARY KEY,
          match_id VARCHAR(100),
          tournament VARCHAR(50) NOT NULL,
          year INTEGER NOT NULL,
          round VARCHAR(50),
          player1 VARCHAR(200),
          player2 VARCHAR(200),
          winner VARCHAR(200),
          score VARCHAR(100),
          surface VARCHAR(20),
          data_source VARCHAR(50) DEFAULT 'github_slam',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Grand Slam points table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS grand_slam_points (
          id SERIAL PRIMARY KEY,
          point_id VARCHAR(100),
          match_id VARCHAR(100),
          tournament VARCHAR(50),
          year INTEGER,
          round VARCHAR(50),
          player1 VARCHAR(200),
          player2 VARCHAR(200),
          point_winner VARCHAR(200),
          serve_direction VARCHAR(50),
          return_direction VARCHAR(50),
          rally_length INTEGER DEFAULT 0,
          data_source VARCHAR(50) DEFAULT 'github_slam',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for better performance
      await this.createIndexes();

      console.log('✅ Historical data schema initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize historical schema:', error);
      throw error;
    }
  }

  /**
   * Create indexes for better query performance
   */
  async createIndexes() {
    try {
      console.log('🔄 Creating indexes for historical data...');

      // Rankings indexes
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_historical_rankings_player 
        ON historical_rankings(player_name, tour, ranking_date)
      `);
      
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_historical_rankings_date 
        ON historical_rankings(ranking_date, tour)
      `);

      // Matches indexes
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_historical_matches_players 
        ON historical_matches(winner_name, loser_name, tour, year)
      `);
      
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_historical_matches_tournament 
        ON historical_matches(tournament_name, year, tour)
      `);

      // Players indexes
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_historical_players_name 
        ON historical_players(name, tour)
      `);

      // Grand Slam indexes
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_grand_slam_matches_tournament 
        ON grand_slam_matches(tournament, year, round)
      `);
      
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_grand_slam_points_match 
        ON grand_slam_points(match_id, tournament, year)
      `);

      console.log('✅ Indexes created successfully');
    } catch (error) {
      console.error('❌ Failed to create indexes:', error);
      throw error;
    }
  }

  /**
   * Insert historical rankings data
   */
  async insertHistoricalRankings(rankingsData) {
    try {
      if (!rankingsData || rankingsData.length === 0) {
        console.log('⚠️  No rankings data to insert');
        return;
      }

      console.log(`🔄 Inserting ${rankingsData.length} historical rankings...`);

      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');

        for (const ranking of rankingsData) {
          // Extract decade and year from ranking_date
          const date = new Date(ranking.ranking_date);
          const year = date.getFullYear();
          const decade = Math.floor(year / 10) * 10 + 's';

          await client.query(`
            INSERT INTO historical_rankings 
            (player_id, player_name, ranking, points, tour, ranking_date, decade, year, data_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (player_id, ranking_date, tour) 
            DO UPDATE SET 
              ranking = EXCLUDED.ranking,
              points = EXCLUDED.points,
              decade = EXCLUDED.decade,
              year = EXCLUDED.year
          `, [
            ranking.player_id,
            ranking.player_name,
            ranking.ranking,
            ranking.points,
            ranking.tour,
            ranking.ranking_date,
            decade,
            year,
            ranking.data_source
          ]);
        }

        await client.query('COMMIT');
        console.log(`✅ Successfully inserted ${rankingsData.length} historical rankings`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Failed to insert historical rankings:', error);
      throw error;
    }
  }

  /**
   * Insert historical matches data
   */
  async insertHistoricalMatches(matchesData) {
    try {
      if (!matchesData || matchesData.length === 0) {
        console.log('⚠️  No matches data to insert');
        return;
      }

      console.log(`🔄 Inserting ${matchesData.length} historical matches...`);

      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');

        for (const match of matchesData) {
          // Extract year from tournament_date
          const year = match.tournament_date ? new Date(match.tournament_date).getFullYear() : null;

          await client.query(`
            INSERT INTO historical_matches 
            (tournament_name, tournament_date, surface, round, winner_name, loser_name, 
             score, winner_rank, loser_rank, winner_points, loser_points, tour, year, data_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          `, [
            match.tournament_name,
            match.tournament_date,
            match.surface,
            match.round,
            match.winner_name,
            match.loser_name,
            match.score,
            match.winner_rank,
            match.loser_rank,
            match.winner_points,
            match.loser_points,
            match.tour,
            year,
            match.data_source
          ]);
        }

        await client.query('COMMIT');
        console.log(`✅ Successfully inserted ${matchesData.length} historical matches`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Failed to insert historical matches:', error);
      throw error;
    }
  }

  /**
   * Insert historical players data
   */
  async insertHistoricalPlayers(playersData) {
    try {
      if (!playersData || playersData.length === 0) {
        console.log('⚠️  No players data to insert');
        return;
      }

      console.log(`🔄 Inserting ${playersData.length} historical players...`);

      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');

        for (const player of playersData) {
          await client.query(`
            INSERT INTO historical_players 
            (player_id, name, birth_date, country, height, weight, playing_hand, turned_pro, tour, data_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (player_id) 
            DO UPDATE SET 
              name = EXCLUDED.name,
              birth_date = EXCLUDED.birth_date,
              country = EXCLUDED.country,
              height = EXCLUDED.height,
              weight = EXCLUDED.weight,
              playing_hand = EXCLUDED.playing_hand,
              turned_pro = EXCLUDED.turned_pro
          `, [
            player.player_id,
            player.name,
            player.birth_date,
            player.country,
            player.height,
            player.weight,
            player.playing_hand,
            player.turned_pro,
            player.tour,
            player.data_source
          ]);
        }

        await client.query('COMMIT');
        console.log(`✅ Successfully inserted ${playersData.length} historical players`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Failed to insert historical players:', error);
      throw error;
    }
  }

  /**
   * Insert match charting data
   */
  async insertMatchCharting(chartingData) {
    try {
      if (!chartingData || chartingData.length === 0) {
        console.log('⚠️  No charting data to insert');
        return;
      }

      console.log(`🔄 Inserting ${chartingData.length} match charting records...`);

      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');

        for (const match of chartingData) {
          await client.query(`
            INSERT INTO match_charting 
            (match_id, tournament, date, surface, round, player1, player2, winner, score, data_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (match_id) 
            DO UPDATE SET 
              tournament = EXCLUDED.tournament,
              date = EXCLUDED.date,
              surface = EXCLUDED.surface,
              round = EXCLUDED.round,
              player1 = EXCLUDED.player1,
              player2 = EXCLUDED.player2,
              winner = EXCLUDED.winner,
              score = EXCLUDED.score
          `, [
            match.match_id,
            match.tournament,
            match.date,
            match.surface,
            match.round,
            match.player1,
            match.player2,
            match.winner,
            match.score,
            match.data_source
          ]);
        }

        await client.query('COMMIT');
        console.log(`✅ Successfully inserted ${chartingData.length} match charting records`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Failed to insert match charting data:', error);
      throw error;
    }
  }

  /**
   * Insert Grand Slam data
   */
  async insertGrandSlamData(matchesData, pointsData = []) {
    try {
      if (!matchesData || matchesData.length === 0) {
        console.log('⚠️  No Grand Slam matches data to insert');
        return;
      }

      console.log(`🔄 Inserting ${matchesData.length} Grand Slam matches...`);

      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');

        // Insert matches
        for (const match of matchesData) {
          await client.query(`
            INSERT INTO grand_slam_matches 
            (match_id, tournament, year, round, player1, player2, winner, score, surface, data_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            match.match_id,
            match.tournament,
            match.year,
            match.round,
            match.player1,
            match.player2,
            match.winner,
            match.score,
            match.surface,
            match.data_source
          ]);
        }

        // Insert points if provided
        if (pointsData && pointsData.length > 0) {
          console.log(`🔄 Inserting ${pointsData.length} Grand Slam points...`);
          
          for (const point of pointsData) {
            await client.query(`
              INSERT INTO grand_slam_points 
              (point_id, match_id, tournament, year, round, player1, player2, 
               point_winner, serve_direction, return_direction, rally_length, data_source)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
              point.point_id,
              point.match_id,
              point.tournament,
              point.year,
              point.round,
              point.player1,
              point.player2,
              point.point_winner,
              point.serve_direction,
              point.return_direction,
              point.rally_length,
              point.data_source
            ]);
          }
        }

        await client.query('COMMIT');
        console.log(`✅ Successfully inserted Grand Slam data`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Failed to insert Grand Slam data:', error);
      throw error;
    }
  }

  /**
   * Get historical rankings for a player
   */
  async getPlayerHistoricalRankings(playerName, tour = 'ATP', limit = 100) {
    try {
      const result = await this.pool.query(`
        SELECT player_name, ranking, points, ranking_date, decade, year
        FROM historical_rankings 
        WHERE LOWER(player_name) LIKE LOWER($1) 
        AND tour = $2
        ORDER BY ranking_date DESC
        LIMIT $3
      `, [`%${playerName}%`, tour, limit]);

      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get player historical rankings:', error);
      return [];
    }
  }

  /**
   * Get head-to-head record between two players
   */
  async getHeadToHead(player1, player2, tour = 'ATP') {
    try {
      const result = await this.pool.query(`
        SELECT 
          winner_name,
          loser_name,
          tournament_name,
          tournament_date,
          surface,
          round,
          score,
          year
        FROM historical_matches 
        WHERE (
          (LOWER(winner_name) LIKE LOWER($1) AND LOWER(loser_name) LIKE LOWER($2))
          OR (LOWER(winner_name) LIKE LOWER($2) AND LOWER(loser_name) LIKE LOWER($1))
        )
        AND tour = $3
        ORDER BY tournament_date DESC
      `, [`%${player1}%`, `%${player2}%`, tour]);

      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get head-to-head record:', error);
      return [];
    }
  }

  /**
   * Get tournament winners
   */
  async getTournamentWinners(tournament, year, tour = 'ATP') {
    try {
      const result = await this.pool.query(`
        SELECT winner_name, loser_name, score, surface, round
        FROM historical_matches 
        WHERE LOWER(tournament_name) LIKE LOWER($1)
        AND year = $2
        AND tour = $3
        AND LOWER(round) LIKE '%final%'
        ORDER BY tournament_date DESC
        LIMIT 1
      `, [`%${tournament}%`, year, tour]);

      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get tournament winners:', error);
      return [];
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    try {
      const stats = {};

      // Get counts for each table
      const tables = [
        'historical_rankings',
        'historical_matches', 
        'historical_players',
        'match_charting',
        'grand_slam_matches',
        'grand_slam_points'
      ];

      for (const table of tables) {
        const result = await this.pool.query(`SELECT COUNT(*) FROM ${table}`);
        stats[table] = parseInt(result.rows[0].count);
      }

      return stats;
    } catch (error) {
      console.error('❌ Failed to get database stats:', error);
      return {};
    }
  }

  /**
   * Close database connection
   */
  async close() {
    await this.pool.end();
  }
}

module.exports = new HistoricalDatabase();
