const { Pool } = require('pg');

class Database {
  constructor() {
    this.pool = null;
  }

  async connect() {
    try {
      // Use DATABASE_URL if available (Railway), otherwise fall back to individual variables
      const config = process.env.DATABASE_URL 
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
          }
        : {
            user: process.env.DB_USER || 'ajitbehera',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'asktennis',
            password: process.env.DB_PASSWORD || 'password',
            port: process.env.DB_PORT || 5432,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
          };

      this.pool = new Pool(config);

      // Test the connection
      const client = await this.pool.connect();
      console.log('✅ Database connected successfully');
      client.release();
      
      // Initialize database schema
      await this.initializeSchema();
      
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async initializeSchema() {
    const client = await this.pool.connect();
    
    try {
      // Create tables if they don't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS players (
          id SERIAL PRIMARY KEY,
          sportsradar_id VARCHAR(50) UNIQUE,
          name VARCHAR(255) NOT NULL UNIQUE,
          country VARCHAR(3),
          country_code VARCHAR(3),
          birth_date DATE,
          height INTEGER,
          weight INTEGER,
          playing_hand VARCHAR(10),
          handedness VARCHAR(10),
          turned_pro INTEGER,
          pro_year INTEGER,
          current_ranking INTEGER,
          highest_singles_ranking INTEGER,
          highest_singles_ranking_date DATE,
          highest_doubles_ranking INTEGER,
          highest_doubles_ranking_date DATE,
          career_prize_money BIGINT,
          tour VARCHAR(10) DEFAULT 'ATP',
          gender VARCHAR(10),
          abbreviation VARCHAR(10),
          nationality VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS competitions (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          alternative_name VARCHAR(255),
          type VARCHAR(50),
          level VARCHAR(20),
          gender VARCHAR(10),
          parent_id VARCHAR(50),
          category_id VARCHAR(50),
          category_name VARCHAR(255),
          category_country_code VARCHAR(3),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS competition_info (
          competition_id VARCHAR(50) PRIMARY KEY REFERENCES competitions(id),
          competition_status VARCHAR(50),
          complex VARCHAR(255),
          complex_id VARCHAR(50),
          number_of_competitors INTEGER,
          number_of_qualified_competitors INTEGER,
          number_of_scheduled_matches INTEGER,
          prize_currency VARCHAR(10),
          prize_money BIGINT,
          surface VARCHAR(20),
          venue_reduced_capacity BOOLEAN,
          venue_reduced_capacity_max INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS seasons (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          competition_id VARCHAR(50) REFERENCES competitions(id),
          year VARCHAR(10) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          disabled BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS tournaments (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50),
          surface VARCHAR(20),
          level VARCHAR(20),
          location VARCHAR(255),
          start_date DATE,
          end_date DATE,
          prize_money BIGINT,
          status VARCHAR(20),
          current_round VARCHAR(50),
          season_id VARCHAR(50) REFERENCES seasons(id),
          competition_id VARCHAR(50) REFERENCES competitions(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS matches (
          id SERIAL PRIMARY KEY,
          tournament_id VARCHAR(50) REFERENCES tournaments(id),
          player1_id INTEGER REFERENCES players(id),
          player2_id INTEGER REFERENCES players(id),
          winner_id INTEGER REFERENCES players(id),
          score VARCHAR(50),
          duration INTEGER,
          match_date DATE,
          round VARCHAR(50),
          surface VARCHAR(20),
          status VARCHAR(20),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS match_stats (
          id SERIAL PRIMARY KEY,
          match_id INTEGER REFERENCES matches(id),
          player_id INTEGER REFERENCES players(id),
          aces INTEGER DEFAULT 0,
          double_faults INTEGER DEFAULT 0,
          first_serve_percentage DECIMAL(5,2),
          first_serve_points_won DECIMAL(5,2),
          second_serve_points_won DECIMAL(5,2),
          break_points_saved DECIMAL(5,2),
          break_points_converted DECIMAL(5,2),
          total_points_won INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS sport_events (
          id VARCHAR(50) PRIMARY KEY,
          parent_id VARCHAR(50),
          start_time TIMESTAMP NOT NULL,
          start_time_confirmed BOOLEAN NOT NULL,
          type VARCHAR(50),
          estimated BOOLEAN DEFAULT FALSE,
          replaced_by VARCHAR(50),
          resume_time VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS sport_event_competitors (
          id SERIAL PRIMARY KEY,
          sport_event_id VARCHAR(50) REFERENCES sport_events(id),
          competitor_id VARCHAR(50),
          competitor_name VARCHAR(255),
          country VARCHAR(100),
          country_code VARCHAR(3),
          abbreviation VARCHAR(10),
          qualifier VARCHAR(50),
          seed INTEGER,
          bracket_number INTEGER,
          virtual BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS sport_event_status (
          sport_event_id VARCHAR(50) PRIMARY KEY REFERENCES sport_events(id),
          status VARCHAR(50) NOT NULL,
          match_status VARCHAR(50),
          home_score INTEGER,
          away_score INTEGER,
          winner_id VARCHAR(50),
          winning_reason VARCHAR(100),
          decided_by_fed BOOLEAN DEFAULT FALSE,
          scout_abandoned BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS venues (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          city_name VARCHAR(255),
          country_name VARCHAR(255),
          country_code VARCHAR(3),
          capacity INTEGER,
          timezone VARCHAR(50),
          map_coordinates VARCHAR(100),
          reduced_capacity BOOLEAN DEFAULT FALSE,
          reduced_capacity_max INTEGER,
          changed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS complexes (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS complex_venues (
          id SERIAL PRIMARY KEY,
          complex_id VARCHAR(50) REFERENCES complexes(id),
          venue_id VARCHAR(50) REFERENCES venues(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS rankings (
          id SERIAL PRIMARY KEY,
          player_id INTEGER REFERENCES players(id),
          sportsradar_id VARCHAR(50),
          ranking INTEGER NOT NULL,
          points INTEGER,
          tour VARCHAR(10) DEFAULT 'ATP',
          ranking_date DATE NOT NULL,
          movement INTEGER DEFAULT 0,
          race_ranking BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(player_id, ranking_date)
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS race_rankings (
          id SERIAL PRIMARY KEY,
          player_id INTEGER REFERENCES players(id),
          sportsradar_id VARCHAR(50),
          ranking INTEGER NOT NULL,
          points INTEGER,
          tour VARCHAR(10) DEFAULT 'ATP',
          ranking_date DATE NOT NULL,
          year INTEGER NOT NULL,
          week INTEGER,
          type_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(player_id, ranking_date, year)
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS double_rankings (
          id SERIAL PRIMARY KEY,
          player1_id INTEGER REFERENCES players(id),
          player2_id INTEGER REFERENCES players(id),
          sportsradar_id VARCHAR(50),
          ranking INTEGER NOT NULL,
          points INTEGER,
          tour VARCHAR(10) DEFAULT 'ATP',
          ranking_date DATE NOT NULL,
          year INTEGER NOT NULL,
          week INTEGER,
          type_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(player1_id, player2_id, ranking_date, year)
        );
      `);

      // Run migrations for existing installations
      await this.runMigrations(client);

      // Create indexes for better performance (after migrations)
      await this.createIndexes(client);

      console.log('✅ Database schema initialized');
      
    } catch (error) {
      console.error('❌ Schema initialization failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async runMigrations(client) {
    try {
      console.log('🔄 Running database migrations...');

      // Add tour column to players if it doesn't exist
      await client.query(`
        ALTER TABLE players 
        ADD COLUMN IF NOT EXISTS tour VARCHAR(10) DEFAULT 'ATP';
      `);

      // Add unique constraint to players name if it doesn't exist
      try {
        await client.query(`
          ALTER TABLE players 
          ADD CONSTRAINT players_name_unique UNIQUE (name);
        `);
      } catch (error) {
        if (error.code !== '42710') { // 42710 = duplicate_object
          console.log('Players name constraint already exists or error:', error.message);
        }
      }

      // Add tour column to rankings if it doesn't exist
      await client.query(`
        ALTER TABLE rankings 
        ADD COLUMN IF NOT EXISTS tour VARCHAR(10) DEFAULT 'ATP';
      `);

      // Add unique constraint to rankings if it doesn't exist
      try {
        await client.query(`
          ALTER TABLE rankings 
          ADD CONSTRAINT rankings_player_date_unique UNIQUE (player_id, ranking_date);
        `);
      } catch (error) {
        if (error.code !== '42710') { // 42710 = duplicate_object
          console.log('Rankings constraint already exists or error:', error.message);
        }
      }

      // Add status and current_round columns to tournaments if they don't exist
      await client.query(`
        ALTER TABLE tournaments 
        ADD COLUMN IF NOT EXISTS status VARCHAR(20);
      `);

      await client.query(`
        ALTER TABLE tournaments 
        ADD COLUMN IF NOT EXISTS current_round VARCHAR(50);
      `);

      // Add status column to matches if it doesn't exist
      await client.query(`
        ALTER TABLE matches 
        ADD COLUMN IF NOT EXISTS status VARCHAR(20);
      `);

      // Add new columns to players table
      await client.query(`
        ALTER TABLE players 
        ADD COLUMN IF NOT EXISTS sportsradar_id VARCHAR(50),
        ADD COLUMN IF NOT EXISTS country_code VARCHAR(3),
        ADD COLUMN IF NOT EXISTS handedness VARCHAR(10),
        ADD COLUMN IF NOT EXISTS pro_year INTEGER,
        ADD COLUMN IF NOT EXISTS highest_singles_ranking INTEGER,
        ADD COLUMN IF NOT EXISTS highest_singles_ranking_date DATE,
        ADD COLUMN IF NOT EXISTS highest_doubles_ranking INTEGER,
        ADD COLUMN IF NOT EXISTS highest_doubles_ranking_date DATE,
        ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
        ADD COLUMN IF NOT EXISTS abbreviation VARCHAR(10),
        ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);
      `);

      // Add new columns to rankings table
      await client.query(`
        ALTER TABLE rankings 
        ADD COLUMN IF NOT EXISTS sportsradar_id VARCHAR(50),
        ADD COLUMN IF NOT EXISTS movement INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS race_ranking BOOLEAN DEFAULT FALSE;
      `);

      // Add unique constraint to players sportsradar_id if it doesn't exist
      try {
        await client.query(`
          ALTER TABLE players 
          ADD CONSTRAINT players_sportsradar_id_unique UNIQUE (sportsradar_id);
        `);
      } catch (error) {
        if (error.code !== '42710') { // 42710 = duplicate_object
          console.log('Players sportsradar_id constraint already exists or error:', error.message);
        }
      }

      console.log('✅ Database migrations completed');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      // Don't throw error for migrations - they might fail if columns already exist
    }
  }

  async createIndexes(client) {
    try {
      console.log('🔄 Creating database indexes...');
      
      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
        CREATE INDEX IF NOT EXISTS idx_players_country ON players(country);
        CREATE INDEX IF NOT EXISTS idx_players_sportsradar_id ON players(sportsradar_id);
        CREATE INDEX IF NOT EXISTS idx_competitions_name ON competitions(name);
        CREATE INDEX IF NOT EXISTS idx_competitions_type ON competitions(type);
        CREATE INDEX IF NOT EXISTS idx_seasons_competition ON seasons(competition_id);
        CREATE INDEX IF NOT EXISTS idx_seasons_year ON seasons(year);
        -- CREATE INDEX IF NOT EXISTS idx_tournaments_season ON tournaments(season_id);
        -- CREATE INDEX IF NOT EXISTS idx_tournaments_competition ON tournaments(competition_id);
        CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
        CREATE INDEX IF NOT EXISTS idx_matches_players ON matches(player1_id, player2_id);
        CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
        CREATE INDEX IF NOT EXISTS idx_sport_events_start_time ON sport_events(start_time);
        CREATE INDEX IF NOT EXISTS idx_sport_event_competitors_event ON sport_event_competitors(sport_event_id);
        CREATE INDEX IF NOT EXISTS idx_rankings_player_date ON rankings(player_id, ranking_date);
        CREATE INDEX IF NOT EXISTS idx_rankings_sportsradar_id ON rankings(sportsradar_id);
        CREATE INDEX IF NOT EXISTS idx_race_rankings_player_date ON race_rankings(player_id, ranking_date);
        CREATE INDEX IF NOT EXISTS idx_double_rankings_players ON double_rankings(player1_id, player2_id);
        CREATE INDEX IF NOT EXISTS idx_venues_country ON venues(country_code);
        CREATE INDEX IF NOT EXISTS idx_complex_venues_complex ON complex_venues(complex_id);
      `);
      
      console.log('✅ Database indexes created');
    } catch (error) {
      console.error('❌ Index creation failed:', error);
      // Don't throw error for indexes - they might fail if they already exist
    }
  }

  async query(text, params = []) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getClient() {
    return await this.pool.connect();
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('Database connection closed');
    }
  }
}

module.exports = new Database();
