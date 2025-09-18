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
        console.log('⚠️  No data received from Sportsradar, skipping sync');
        return { success: false, reason: 'No data received from Sportsradar' };
      }

        // Check if we have any data to sync (ATP rankings only for now)
        const hasData = (liveData.atp_rankings && liveData.atp_rankings.length > 0);

      if (!hasData) {
        console.log('⚠️  No valid data to sync, skipping database update');
        return { 
          success: false, 
          reason: 'No valid data to sync',
          data: {
            atp_rankings: 0,
            wta_rankings: 0
          }
        };
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
            wta_rankings: liveData.wta_rankings.length
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
    // Ensure database is connected
    if (!database.pool) {
      console.log('🔄 Connecting to database...');
      await database.connect();
    }
    
    const client = await database.getClient();
    
    try {
      await client.query('BEGIN');

        // Update players and rankings
        await this.updatePlayersAndRankings(client, liveData);
        
        // Update competitions (disabled for now due to database issues)
        // await this.updateCompetitions(client, liveData);

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

    let totalUpdated = 0;

    // Process ATP rankings
    if (liveData.atp_rankings && liveData.atp_rankings.length > 0) {
      for (const ranking of liveData.atp_rankings) {
        try {
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
          totalUpdated++;
        } catch (error) {
          console.error(`Error updating ATP player ${ranking.player_name}:`, error.message);
        }
      }
    }

    // Process WTA rankings
    if (liveData.wta_rankings && liveData.wta_rankings.length > 0) {
      for (const ranking of liveData.wta_rankings) {
        try {
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
          totalUpdated++;
        } catch (error) {
          console.error(`Error updating WTA player ${ranking.player_name}:`, error.message);
        }
      }
    }

    console.log(`✅ Updated ${totalUpdated} player rankings`);
  }

  /**
   * Update competitions
   */
  async updateCompetitions(client, liveData) {
    console.log('🏆 Updating competitions...');

    if (!liveData.competitions || liveData.competitions.length === 0) {
      console.log('⚠️  No competitions to update');
      return;
    }

    let totalUpdated = 0;
    for (const competition of liveData.competitions) {
      try {
        await this.upsertCompetition(client, competition);
        totalUpdated++;
      } catch (error) {
        console.error(`Error updating competition ${competition.name}:`, error.message);
      }
    }

    console.log(`✅ Updated ${totalUpdated} competitions`);
  }

  /**
   * Update tournaments (legacy method)
   */
  async updateTournaments(client, liveData) {
    console.log('🏆 Updating tournaments...');

    if (!liveData.tournaments || liveData.tournaments.length === 0) {
      console.log('⚠️  No tournaments to update');
      return;
    }

    let totalUpdated = 0;
    for (const tournament of liveData.tournaments) {
      try {
        await this.upsertTournament(client, tournament);
        totalUpdated++;
      } catch (error) {
        console.error(`Error updating tournament ${tournament.name}:`, error.message);
      }
    }

    console.log(`✅ Updated ${totalUpdated} tournaments`);
  }

  /**
   * Upsert player (insert or update)
   */
  async upsertPlayer(client, playerData) {
    // First try to update existing player
    const updateQuery = `
      UPDATE players 
      SET country = $2, current_ranking = $3, tour = $4, updated_at = CURRENT_TIMESTAMP
      WHERE name = $1
    `;
    
    const updateResult = await client.query(updateQuery, [
      playerData.name,
      playerData.country,
      playerData.current_ranking,
      playerData.tour || 'ATP'
    ]);

    // If no rows were updated, insert new player
    if (updateResult.rowCount === 0) {
      const insertQuery = `
        INSERT INTO players (name, country, current_ranking, tour, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `;

      await client.query(insertQuery, [
        playerData.name,
        playerData.country,
        playerData.current_ranking,
        playerData.tour || 'ATP'
      ]);
    }
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

    // First try to update existing ranking
    const updateQuery = `
      UPDATE rankings 
      SET ranking = $2, points = $3, tour = $4
      WHERE player_id = $1 AND ranking_date = $5
    `;
    
    const updateResult = await client.query(updateQuery, [
      playerId,
      rankingData.ranking,
      rankingData.points,
      rankingData.tour,
      rankingData.ranking_date
    ]);

    // If no rows were updated, insert new ranking
    if (updateResult.rowCount === 0) {
      const insertQuery = `
        INSERT INTO rankings (player_id, ranking, points, tour, ranking_date, created_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      `;

      await client.query(insertQuery, [
        playerId,
        rankingData.ranking,
        rankingData.points,
        rankingData.tour,
        rankingData.ranking_date
      ]);
    }
  }

  /**
   * Upsert competition (insert or update)
   */
  async upsertCompetition(client, competitionData) {
    try {
      // Truncate name if too long for database
      const name = competitionData.name ? competitionData.name.substring(0, 255) : 'Unknown Competition';
      const type = competitionData.type || 'unknown';
      const level = competitionData.level || 'unknown';

      // First try to update existing competition
      const updateQuery = `
        UPDATE tournaments 
        SET name = $2, type = $3, level = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      
      const updateResult = await client.query(updateQuery, [
        competitionData.id,
        name,
        type,
        level
      ]);

      // If no rows were updated, insert new competition
      if (updateResult.rowCount === 0) {
        const insertQuery = `
          INSERT INTO tournaments (id, name, type, level, updated_at)
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        `;

        await client.query(insertQuery, [
          competitionData.id,
          name,
          type,
          level
        ]);
      }
    } catch (error) {
      console.error(`Error upserting competition ${competitionData.id}:`, error.message);
      // Don't throw error to prevent transaction abort
    }
  }

  /**
   * Upsert tournament (insert or update)
   */
  async upsertTournament(client, tournamentData) {
    // First try to update existing tournament
    const updateQuery = `
      UPDATE tournaments 
      SET name = $2, type = $3, surface = $4, level = $5, location = $6, 
          start_date = $7, end_date = $8, prize_money = $9, status = $10, 
          current_round = $11, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    
    const updateResult = await client.query(updateQuery, [
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

    // If no rows were updated, insert new tournament
    if (updateResult.rowCount === 0) {
      const insertQuery = `
        INSERT INTO tournaments (id, name, type, surface, level, location, start_date, end_date, prize_money, status, current_round, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
      `;

      await client.query(insertQuery, [
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
