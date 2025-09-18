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
          name VARCHAR(255) NOT NULL UNIQUE,
          country VARCHAR(3),
          birth_date DATE,
          height INTEGER,
          weight INTEGER,
          playing_hand VARCHAR(10),
          turned_pro INTEGER,
          current_ranking INTEGER,
          career_prize_money BIGINT,
          tour VARCHAR(10) DEFAULT 'ATP',
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
        CREATE TABLE IF NOT EXISTS rankings (
          id SERIAL PRIMARY KEY,
          player_id INTEGER REFERENCES players(id),
          ranking INTEGER NOT NULL,
          points INTEGER,
          tour VARCHAR(10) DEFAULT 'ATP',
          ranking_date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(player_id, ranking_date)
        );
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
        CREATE INDEX IF NOT EXISTS idx_players_country ON players(country);
        CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
        CREATE INDEX IF NOT EXISTS idx_matches_players ON matches(player1_id, player2_id);
        CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
        CREATE INDEX IF NOT EXISTS idx_rankings_player_date ON rankings(player_id, ranking_date);
      `);

      // Run migrations for existing installations
      await this.runMigrations(client);

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
      await client.query(`
        ALTER TABLE players 
        ADD CONSTRAINT IF NOT EXISTS players_name_unique UNIQUE (name);
      `);

      // Add tour column to rankings if it doesn't exist
      await client.query(`
        ALTER TABLE rankings 
        ADD COLUMN IF NOT EXISTS tour VARCHAR(10) DEFAULT 'ATP';
      `);

      // Add unique constraint to rankings if it doesn't exist
      await client.query(`
        ALTER TABLE rankings 
        ADD CONSTRAINT IF NOT EXISTS rankings_player_date_unique UNIQUE (player_id, ranking_date);
      `);

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

      console.log('✅ Database migrations completed');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      // Don't throw error for migrations - they might fail if columns already exist
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
