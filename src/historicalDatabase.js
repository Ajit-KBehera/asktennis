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
          player1_hand VARCHAR(5),
          player2_hand VARCHAR(5),
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

      // Match charting points table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS match_charting_points (
          id SERIAL PRIMARY KEY,
          match_id VARCHAR(100),
          point_number INTEGER,
          set1_score VARCHAR(10),
          set2_score VARCHAR(10),
          game1_score VARCHAR(10),
          game2_score VARCHAR(10),
          point_score VARCHAR(20),
          game_number INTEGER,
          tiebreak_set BOOLEAN DEFAULT FALSE,
          server INTEGER,
          first_serve TEXT,
          second_serve TEXT,
          notes TEXT,
          point_winner INTEGER,
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
          slam VARCHAR(50),
          match_num INTEGER,
          player1 VARCHAR(200),
          player2 VARCHAR(200),
          status VARCHAR(50),
          winner VARCHAR(200),
          event_name VARCHAR(200),
          round VARCHAR(50),
          court_name VARCHAR(100),
          court_id VARCHAR(50),
          player1id VARCHAR(50),
          player2id VARCHAR(50),
          nation1 VARCHAR(10),
          nation2 VARCHAR(10),
          data_source VARCHAR(50) DEFAULT 'github_slam',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Grand Slam points table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS grand_slam_points (
          id SERIAL PRIMARY KEY,
          match_id VARCHAR(100),
          tournament VARCHAR(50) NOT NULL,
          year INTEGER NOT NULL,
          elapsed_time VARCHAR(20),
          set_no INTEGER,
          p1_games_won INTEGER,
          p2_games_won INTEGER,
          set_winner INTEGER,
          game_no INTEGER,
          game_winner INTEGER,
          point_number VARCHAR(20),
          point_winner INTEGER,
          point_server INTEGER,
          speed_kmh INTEGER,
          rally INTEGER,
          p1_score VARCHAR(10),
          p2_score VARCHAR(10),
          p1_momentum INTEGER,
          p2_momentum INTEGER,
          p1_points_won INTEGER,
          p2_points_won INTEGER,
          p1_ace INTEGER,
          p2_ace INTEGER,
          p1_winner INTEGER,
          p2_winner INTEGER,
          p1_double_fault INTEGER,
          p2_double_fault INTEGER,
          p1_unf_err INTEGER,
          p2_unf_err INTEGER,
          p1_net_point INTEGER,
          p2_net_point INTEGER,
          p1_net_point_won INTEGER,
          p2_net_point_won INTEGER,
          p1_break_point INTEGER,
          p2_break_point INTEGER,
          p1_break_point_won INTEGER,
          p2_break_point_won INTEGER,
          p1_first_srv_in INTEGER,
          p2_first_srv_in INTEGER,
          p1_first_srv_won INTEGER,
          p2_first_srv_won INTEGER,
          p1_second_srv_in INTEGER,
          p2_second_srv_in INTEGER,
          p1_second_srv_won INTEGER,
          p2_second_srv_won INTEGER,
          p1_forced_error INTEGER,
          p2_forced_error INTEGER,
          history TEXT,
          speed_mph INTEGER,
          p1_break_point_missed INTEGER,
          p2_break_point_missed INTEGER,
          serve_indicator VARCHAR(10),
          serve_direction VARCHAR(10),
          winner_fh VARCHAR(10),
          winner_bh VARCHAR(10),
          serving_to VARCHAR(10),
          p1_turning_point INTEGER,
          p2_turning_point INTEGER,
          serve_number INTEGER,
          winner_type VARCHAR(10),
          winner_shot_type VARCHAR(10),
          p1_distance_run DECIMAL(10,3),
          p2_distance_run DECIMAL(10,3),
          rally_count INTEGER,
          serve_width VARCHAR(10),
          serve_depth VARCHAR(10),
          return_depth VARCHAR(10),
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

      // Match charting indexes
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_match_charting_tournament 
        ON match_charting(tournament, date, round)
      `);
      
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_match_charting_players 
        ON match_charting(player1, player2, date)
      `);
      
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_match_charting_points_match 
        ON match_charting_points(match_id, point_number)
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
          let year = null;
          let decade = null;
          
          if (ranking.ranking_date) {
            try {
              const date = new Date(ranking.ranking_date);
              if (!isNaN(date.getTime())) {
                year = date.getFullYear();
                decade = Math.floor(year / 10) * 10 + 's';
              }
            } catch (error) {
              // Invalid date, keep as null
            }
          }

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
            (match_id, tournament, date, surface, round, player1, player2, player1_hand, player2_hand, 
             time, court, umpire, best_of, final_tb, charted_by, data_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            ON CONFLICT (match_id) 
            DO UPDATE SET 
              tournament = EXCLUDED.tournament,
              date = EXCLUDED.date,
              surface = EXCLUDED.surface,
              round = EXCLUDED.round,
              player1 = EXCLUDED.player1,
              player2 = EXCLUDED.player2,
              player1_hand = EXCLUDED.player1_hand,
              player2_hand = EXCLUDED.player2_hand,
              time = EXCLUDED.time,
              court = EXCLUDED.court,
              umpire = EXCLUDED.umpire,
              best_of = EXCLUDED.best_of,
              final_tb = EXCLUDED.final_tb,
              charted_by = EXCLUDED.charted_by
          `, [
            match.match_id,
            match.tournament,
            match.date,
            match.surface,
            match.round,
            match.player1,
            match.player2,
            match.player1_hand,
            match.player2_hand,
            match.time,
            match.court,
            match.umpire,
            match.best_of,
            match.final_tb,
            match.charted_by,
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
   * Insert match charting points data
   */
  async insertMatchChartingPoints(pointsData) {
    try {
      if (!pointsData || pointsData.length === 0) {
        console.log('⚠️  No charting points data to insert');
        return;
      }

      console.log(`🔄 Inserting ${pointsData.length} match charting points...`);

      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');

        for (const point of pointsData) {
          await client.query(`
            INSERT INTO match_charting_points 
            (match_id, point_number, set1_score, set2_score, game1_score, game2_score, 
             point_score, game_number, tiebreak_set, server, first_serve, second_serve, 
             notes, point_winner, data_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          `, [
            point.match_id,
            point.point_number,
            point.set1_score,
            point.set2_score,
            point.game1_score,
            point.game2_score,
            point.point_score,
            point.game_number,
            point.tiebreak_set,
            point.server,
            point.first_serve,
            point.second_serve,
            point.notes,
            point.point_winner,
            point.data_source
          ]);
        }

        await client.query('COMMIT');
        console.log(`✅ Successfully inserted ${pointsData.length} match charting points`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Failed to insert match charting points:', error);
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
   * Get match charting data for a specific match
   */
  async getMatchChartingData(matchId) {
    try {
      const result = await this.pool.query(`
        SELECT 
          mc.match_id,
          mc.tournament,
          mc.date,
          mc.surface,
          mc.round,
          mc.player1,
          mc.player2,
          mc.player1_hand,
          mc.player2_hand,
          mc.time,
          mc.court,
          mc.umpire,
          mc.best_of,
          mc.final_tb,
          mc.charted_by,
          COUNT(mcp.point_number) as total_points
        FROM match_charting mc
        LEFT JOIN match_charting_points mcp ON mc.match_id = mcp.match_id
        WHERE mc.match_id = $1
        GROUP BY mc.match_id, mc.tournament, mc.date, mc.surface, mc.round, 
                 mc.player1, mc.player2, mc.player1_hand, mc.player2_hand, 
                 mc.time, mc.court, mc.umpire, mc.best_of, mc.final_tb, mc.charted_by
      `, [matchId]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Failed to get match charting data:', error);
      return null;
    }
  }

  /**
   * Get point-by-point data for a specific match
   */
  async getMatchPoints(matchId, limit = 100) {
    try {
      const result = await this.pool.query(`
        SELECT 
          point_number,
          set1_score,
          set2_score,
          game1_score,
          game2_score,
          point_score,
          game_number,
          tiebreak_set,
          server,
          first_serve,
          second_serve,
          notes,
          point_winner
        FROM match_charting_points 
        WHERE match_id = $1
        ORDER BY point_number
        LIMIT $2
      `, [matchId, limit]);

      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get match points:', error);
      return [];
    }
  }

  /**
   * Get charted matches for a player
   */
  async getPlayerChartedMatches(playerName, limit = 20) {
    try {
      const result = await this.pool.query(`
        SELECT 
          match_id,
          tournament,
          date,
          surface,
          round,
          player1,
          player2,
          time,
          court,
          charted_by
        FROM match_charting 
        WHERE LOWER(player1) LIKE LOWER($1) OR LOWER(player2) LIKE LOWER($1)
        ORDER BY date DESC
        LIMIT $2
      `, [`%${playerName}%`, limit]);

      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get player charted matches:', error);
      return [];
    }
  }

  /**
   * Get charted matches for a tournament
   */
  async getTournamentChartedMatches(tournamentName, year = null, limit = 50) {
    try {
      let query = `
        SELECT 
          match_id,
          tournament,
          date,
          surface,
          round,
          player1,
          player2,
          time,
          court,
          charted_by
        FROM match_charting 
        WHERE LOWER(tournament) LIKE LOWER($1)
      `;
      
      const params = [`%${tournamentName}%`];
      
      if (year) {
        query += ` AND EXTRACT(YEAR FROM date) = $2`;
        params.push(year);
        query += ` ORDER BY date DESC LIMIT $3`;
        params.push(limit);
      } else {
        query += ` ORDER BY date DESC LIMIT $2`;
        params.push(limit);
      }

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get tournament charted matches:', error);
      return [];
    }
  }

  /**
   * Get historical rankings
   */
  async getHistoricalRankings(tour, limit = 100) {
    try {
      const result = await this.pool.query(`
        SELECT hr.*, hp.name as player_name
        FROM historical_rankings hr
        LEFT JOIN historical_players hp ON hr.player_id = hp.player_id
        WHERE hr.tour = $1
        ORDER BY hr.ranking
        LIMIT $2
      `, [tour, limit]);

      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching historical rankings:', error.message);
      return [];
    }
  }

  /**
   * Get historical matches
   */
  async getHistoricalMatches(tour, limit = 100) {
    try {
      const result = await this.pool.query(`
        SELECT *
        FROM historical_matches
        WHERE tour = $1
        ORDER BY tournament_date DESC
        LIMIT $2
      `, [tour, limit]);

      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching historical matches:', error.message);
      return [];
    }
  }

  /**
   * Get tournament matches
   */
  async getTournamentMatches(tournament, year, limit = 100) {
    try {
      const result = await this.pool.query(`
        SELECT *
        FROM grand_slam_matches
        WHERE LOWER(tournament) LIKE LOWER($1) AND year = $2
        ORDER BY id
        LIMIT $3
      `, [`%${tournament}%`, year, limit]);

      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching tournament matches:', error.message);
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
        'match_charting_points',
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
