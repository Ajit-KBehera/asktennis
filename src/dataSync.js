const sportsradar = require('./sportsradar');
const database = require('./database');

class DataSyncService {
  constructor() {
    this.isRunning = false;
    this.lastSyncTime = null;
    this.syncInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  /**
   * Check if Sportsradar is configured and available
   */
  isSportsradarAvailable() {
    return sportsradar.isConfigured();
  }

  /**
   * Sync all data from Sportsradar to database
   */
  async syncAllData() {
    if (!this.isSportsradarAvailable()) {
      console.log('⚠️  Sportsradar not configured, skipping data sync');
      return { success: false, reason: 'Sportsradar not configured' };
    }

    if (this.isRunning) {
      console.log('⚠️  Data sync already in progress, skipping');
      return { success: false, reason: 'Sync already in progress' };
    }

    this.isRunning = true;
    console.log('🔄 Starting data synchronization with Sportsradar...');

    try {
      // Fetch data from Sportsradar
      const liveData = await sportsradar.getAllData();
      
      if (!liveData) {
        throw new Error('Failed to fetch data from Sportsradar');
      }

      // Update database with live data
      await this.updateDatabase(liveData);

      this.lastSyncTime = new Date();
      console.log('✅ Data synchronization completed successfully');
      
      return {
        success: true,
        lastSync: this.lastSyncTime,
        data: {
          atp_rankings: liveData.atp_rankings.length,
          wta_rankings: liveData.wta_rankings.length,
          tournaments: liveData.tournaments.length
        }
      };

    } catch (error) {
      console.error('❌ Data synchronization failed:', error.message);
      return {
        success: false,
        error: error.message,
        lastSync: this.lastSyncTime
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Update database with live data
   */
  async updateDatabase(liveData) {
    const client = await database.getClient();
    
    try {
      await client.query('BEGIN');

      // Update players and rankings
      await this.updatePlayersAndRankings(client, liveData);
      
      // Update tournaments
      await this.updateTournaments(client, liveData);

      await client.query('COMMIT');
      console.log('✅ Database updated successfully');

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Database update failed:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update players and rankings
   */
  async updatePlayersAndRankings(client, liveData) {
    console.log('📊 Updating players and rankings...');

    // Process ATP rankings
    for (const ranking of liveData.atp_rankings) {
      await this.upsertPlayer(client, {
        name: ranking.player_name,
        country: ranking.country,
        current_ranking: ranking.ranking,
        tour: 'ATP'
      });

      await this.upsertRanking(client, {
        player_name: ranking.player_name,
        ranking: ranking.ranking,
        points: ranking.points,
        tour: ranking.tour,
        ranking_date: ranking.ranking_date
      });
    }

    // Process WTA rankings
    for (const ranking of liveData.wta_rankings) {
      await this.upsertPlayer(client, {
        name: ranking.player_name,
        country: ranking.country,
        current_ranking: ranking.ranking,
        tour: 'WTA'
      });

      await this.upsertRanking(client, {
        player_name: ranking.player_name,
        ranking: ranking.ranking,
        points: ranking.points,
        tour: ranking.tour,
        ranking_date: ranking.ranking_date
      });
    }

    console.log(`✅ Updated ${liveData.atp_rankings.length + liveData.wta_rankings.length} player rankings`);
  }

  /**
   * Update tournaments
   */
  async updateTournaments(client, liveData) {
    console.log('🏆 Updating tournaments...');

    for (const tournament of liveData.tournaments) {
      await this.upsertTournament(client, tournament);
    }

    console.log(`✅ Updated ${liveData.tournaments.length} tournaments`);
  }

  /**
   * Upsert player (insert or update)
   */
  async upsertPlayer(client, playerData) {
    const query = `
      INSERT INTO players (name, country, current_ranking, tour, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (name) 
      DO UPDATE SET 
        country = EXCLUDED.country,
        current_ranking = EXCLUDED.current_ranking,
        tour = EXCLUDED.tour,
        updated_at = CURRENT_TIMESTAMP
    `;

    await client.query(query, [
      playerData.name,
      playerData.country,
      playerData.current_ranking,
      playerData.tour || 'ATP'
    ]);
  }

  /**
   * Upsert ranking (insert or update)
   */
  async upsertRanking(client, rankingData) {
    // First get player ID
    const playerResult = await client.query(
      'SELECT id FROM players WHERE name = $1',
      [rankingData.player_name]
    );

    if (playerResult.rows.length === 0) {
      console.warn(`Player not found: ${rankingData.player_name}`);
      return;
    }

    const playerId = playerResult.rows[0].id;

    const query = `
      INSERT INTO rankings (player_id, ranking, points, tour, ranking_date, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (player_id, ranking_date) 
      DO UPDATE SET 
        ranking = EXCLUDED.ranking,
        points = EXCLUDED.points,
        tour = EXCLUDED.tour
    `;

    await client.query(query, [
      playerId,
      rankingData.ranking,
      rankingData.points,
      rankingData.tour,
      rankingData.ranking_date
    ]);
  }

  /**
   * Upsert tournament (insert or update)
   */
  async upsertTournament(client, tournamentData) {
    const query = `
      INSERT INTO tournaments (id, name, type, surface, level, location, start_date, end_date, prize_money, status, current_round, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
      ON CONFLICT (id) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        surface = EXCLUDED.surface,
        level = EXCLUDED.level,
        location = EXCLUDED.location,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        prize_money = EXCLUDED.prize_money,
        status = EXCLUDED.status,
        current_round = EXCLUDED.current_round,
        updated_at = CURRENT_TIMESTAMP
    `;

    await client.query(query, [
      tournamentData.id,
      tournamentData.name,
      tournamentData.type,
      tournamentData.surface,
      tournamentData.level,
      tournamentData.location,
      tournamentData.start_date,
      tournamentData.end_date,
      tournamentData.prize_money,
      tournamentData.status,
      tournamentData.current_round
    ]);
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isRunning: this.isRunning,
      lastSync: this.lastSyncTime,
      isSportsradarAvailable: this.isSportsradarAvailable(),
      nextSyncIn: this.lastSyncTime ? 
        Math.max(0, this.syncInterval - (Date.now() - this.lastSyncTime.getTime())) : 
        null
    };
  }

  /**
   * Force immediate sync
   */
  async forceSync() {
    console.log('🔄 Force sync requested...');
    return await this.syncAllData();
  }

  /**
   * Start automatic sync (every 24 hours)
   */
  startAutoSync() {
    if (!this.isSportsradarAvailable()) {
      console.log('⚠️  Sportsradar not configured, auto-sync disabled');
      return;
    }

    console.log('⏰ Starting automatic data sync (every 24 hours)');
    
    // Initial sync
    this.syncAllData().catch(error => {
      console.error('Initial sync failed:', error.message);
    });

    // Set up interval
    setInterval(() => {
      this.syncAllData().catch(error => {
        console.error('Auto sync failed:', error.message);
      });
    }, this.syncInterval);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync() {
    console.log('⏹️  Stopping automatic data sync');
    // Note: In a real implementation, you'd store the interval ID and clear it
    // For now, this is just a placeholder
  }
}

module.exports = new DataSyncService();
