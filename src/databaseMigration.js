const database = require('./database');

class DatabaseMigration {
  constructor() {
    this.migrations = [
      {
        name: 'add_data_source_columns',
        up: this.addDataSourceColumns.bind(this),
        down: this.removeDataSourceColumns.bind(this)
      },
      {
        name: 'add_is_current_column',
        up: this.addIsCurrentColumn.bind(this),
        down: this.removeIsCurrentColumn.bind(this)
      }
    ];
  }

  /**
   * Add data_source columns to rankings and players tables
   */
  async addDataSourceColumns() {
    const client = await database.getClient();
    
    try {
      await client.query('BEGIN');

      // Add data_source column to rankings table
      await client.query(`
        ALTER TABLE rankings 
        ADD COLUMN IF NOT EXISTS data_source VARCHAR(20) DEFAULT 'sportsradar';
      `);

      // Add data_source column to players table
      await client.query(`
        ALTER TABLE players 
        ADD COLUMN IF NOT EXISTS data_source VARCHAR(20) DEFAULT 'sportsradar';
      `);

      // Add data_source column to tournaments table
      await client.query(`
        ALTER TABLE tournaments 
        ADD COLUMN IF NOT EXISTS data_source VARCHAR(20) DEFAULT 'sportsradar';
      `);

      // Add data_source column to matches table
      await client.query(`
        ALTER TABLE matches 
        ADD COLUMN IF NOT EXISTS data_source VARCHAR(20) DEFAULT 'sportsradar';
      `);

      await client.query('COMMIT');
      console.log('✅ Added data_source columns to all tables');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Failed to add data_source columns:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove data_source columns
   */
  async removeDataSourceColumns() {
    const client = await database.getClient();
    
    try {
      await client.query('BEGIN');

      await client.query('ALTER TABLE rankings DROP COLUMN IF EXISTS data_source;');
      await client.query('ALTER TABLE players DROP COLUMN IF EXISTS data_source;');
      await client.query('ALTER TABLE tournaments DROP COLUMN IF EXISTS data_source;');
      await client.query('ALTER TABLE matches DROP COLUMN IF EXISTS data_source;');

      await client.query('COMMIT');
      console.log('✅ Removed data_source columns from all tables');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Failed to remove data_source columns:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Add is_current column to rankings table
   */
  async addIsCurrentColumn() {
    const client = await database.getClient();
    
    try {
      await client.query('BEGIN');

      // Add is_current column to rankings table
      await client.query(`
        ALTER TABLE rankings 
        ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true;
      `);

      await client.query('COMMIT');
      console.log('✅ Added is_current column to rankings table');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Failed to add is_current column:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove is_current column
   */
  async removeIsCurrentColumn() {
    const client = await database.getClient();
    
    try {
      await client.query('BEGIN');

      await client.query('ALTER TABLE rankings DROP COLUMN IF EXISTS is_current;');

      await client.query('COMMIT');
      console.log('✅ Removed is_current column from rankings table');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Failed to remove is_current column:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations() {
    console.log('🔄 Running database migrations...');
    
    try {
      // Connect to database
      await database.connect(false);
      
      for (const migration of this.migrations) {
        console.log(`🔄 Running migration: ${migration.name}`);
        await migration.up();
      }
      
      console.log('✅ All migrations completed successfully');
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  }

  /**
   * Rollback all migrations
   */
  async rollbackMigrations() {
    console.log('🔄 Rolling back database migrations...');
    
    try {
      // Connect to database
      await database.connect(false);
      
      // Run migrations in reverse order
      for (let i = this.migrations.length - 1; i >= 0; i--) {
        const migration = this.migrations[i];
        console.log(`🔄 Rolling back migration: ${migration.name}`);
        await migration.down();
      }
      
      console.log('✅ All migrations rolled back successfully');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }

  /**
   * Check migration status
   */
  async checkMigrationStatus() {
    try {
      await database.connect(false);
      
      const client = await database.getClient();
      
      try {
        // Check if data_source column exists in rankings table
        const rankingsCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'rankings' AND column_name = 'data_source'
        `);
        
        // Check if is_current column exists in rankings table
        const currentCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'rankings' AND column_name = 'is_current'
        `);
        
        const status = {
          dataSourceColumn: rankingsCheck.rows.length > 0,
          isCurrentColumn: currentCheck.rows.length > 0,
          needsMigration: rankingsCheck.rows.length === 0 || currentCheck.rows.length === 0
        };
        
        console.log('📊 Migration status:', status);
        return status;
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('❌ Failed to check migration status:', error.message);
      return { needsMigration: true };
    }
  }
}

module.exports = new DatabaseMigration();
