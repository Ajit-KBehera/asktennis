const sportsradar = require('./sportsradar');
const database = require('./database');

class DataSyncService {
  constructor() {
    this.isRunning = false;
    this.lastSyncTime = null;
    this.syncInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    this.sportsradar = sportsradar; // Reference to sportsradar instance
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

        // Check if we have any data to sync (enhanced with XSD data)
        const hasData = (liveData.atp_rankings && liveData.atp_rankings.length > 0) ||
                       (liveData.competitions && liveData.competitions.length > 0) ||
                       (liveData.schedule_summaries && liveData.schedule_summaries.length > 0) ||
                       (liveData.race_rankings && liveData.race_rankings.length > 0) ||
                       (liveData.complexes && liveData.complexes.length > 0);

      if (!hasData) {
        console.log('⚠️  No valid data to sync, skipping database update');
        return { 
          success: false, 
          reason: 'No valid data to sync',
          data: {
            atp_rankings: liveData.atp_rankings?.length || 0,
            wta_rankings: liveData.wta_rankings?.length || 0,
            competitions: liveData.competitions?.length || 0,
            schedule_summaries: liveData.schedule_summaries?.length || 0,
            race_rankings: liveData.race_rankings?.length || 0,
            double_rankings: liveData.double_rankings?.length || 0,
            complexes: liveData.complexes?.length || 0
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
            atp_rankings: liveData.atp_rankings?.length || 0,
            wta_rankings: liveData.wta_rankings?.length || 0,
            competitions: liveData.competitions?.length || 0,
            schedule_summaries: liveData.schedule_summaries?.length || 0,
            race_rankings: liveData.race_rankings?.length || 0,
            double_rankings: liveData.double_rankings?.length || 0,
            complexes: liveData.complexes?.length || 0,
            live_summaries: liveData.live_summaries?.length || 0
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
        
        // Update competitions (disabled due to database transaction issues)
        // await this.updateCompetitions(client, liveData);
        
        // Update new XSD data structures (competitions handled separately due to size)
        await this.updateSeasons(client, liveData);
        await this.updateSportEvents(client, liveData);
        await this.updateVenues(client, liveData);
        await this.updateRaceRankings(client, liveData);
        await this.updateDoubleRankings(client, liveData);

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
   * Sync competitions separately to handle large datasets
   */
  async syncCompetitions() {
    try {
      console.log('🏆 Starting competitions sync...');
      
      // Get fresh data from Sportsradar
      const liveData = await this.sportsradar.getAllData();
      if (!liveData || !liveData.competitions) {
        console.log('⚠️  No competitions data available');
        return;
      }

      console.log(`📊 Found ${liveData.competitions.length} competitions to sync`);
      
      // Process competitions in batches (separate from main transaction)
      await this.updateCompetitionsEnhanced(null, liveData);
      
      console.log('✅ Competitions sync completed');
      
    } catch (error) {
      console.error('❌ Competitions sync failed:', error.message);
      throw error;
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
    let totalErrors = 0;
    
    // Process competitions in smaller batches to avoid transaction issues
    const batchSize = 100;
    const competitions = liveData.competitions;
    
    for (let i = 0; i < competitions.length; i += batchSize) {
      const batch = competitions.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(competitions.length/batchSize)} (${batch.length} competitions)`);
      
      for (const competition of batch) {
        try {
          await this.upsertCompetition(client, competition);
          totalUpdated++;
        } catch (error) {
          totalErrors++;
          console.error(`Error updating competition ${competition.id}:`, error.message);
          // Continue with next competition instead of failing the entire batch
        }
      }
    }

    console.log(`✅ Updated ${totalUpdated} competitions (${totalErrors} errors)`);
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

  /**
   * Update competitions with enhanced XSD data (optimized for large datasets)
   */
  async updateCompetitionsEnhanced(client, liveData) {
    if (!liveData.competitions || liveData.competitions.length === 0) {
      return;
    }

    console.log('🏆 Updating competitions with enhanced data...');
    console.log(`📊 Processing ${liveData.competitions.length} competitions in batches...`);
    
    // Ensure database connection
    if (!database.pool) {
      await database.connect(false);
    }
    
    const batchSize = 50; // Smaller batches to prevent transaction timeouts
    const competitions = liveData.competitions;
    let totalProcessed = 0;
    let totalErrors = 0;
    
    for (let i = 0; i < competitions.length; i += batchSize) {
      const batch = competitions.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(competitions.length / batchSize);
      
      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} competitions)`);
      
      // Process each batch in its own transaction
      const batchClient = await database.pool.connect();
      try {
        await batchClient.query('BEGIN');
        
        for (const competition of batch) {
          try {
            await batchClient.query(`
              INSERT INTO competitions (id, name, alternative_name, type, level, gender, parent_id, category_id, category_name, category_country_code)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                alternative_name = EXCLUDED.alternative_name,
                type = EXCLUDED.type,
                level = EXCLUDED.level,
                gender = EXCLUDED.gender,
                parent_id = EXCLUDED.parent_id,
                category_id = EXCLUDED.category_id,
                category_name = EXCLUDED.category_name,
                category_country_code = EXCLUDED.category_country_code,
                updated_at = CURRENT_TIMESTAMP
            `, [
              competition.id,
              competition.name,
              competition.alternative_name,
              competition.type,
              competition.level,
              competition.gender,
              competition.parent_id,
              competition.category?.id,
              competition.category?.name,
              competition.category?.country_code
            ]);
            totalProcessed++;
          } catch (error) {
            totalErrors++;
            console.error(`Failed to update competition ${competition.id}:`, error.message);
            // Continue with next competition
          }
        }
        
        await batchClient.query('COMMIT');
        console.log(`✅ Batch ${batchNumber} completed: ${batch.length} competitions processed`);
        
      } catch (error) {
        await batchClient.query('ROLLBACK');
        console.error(`❌ Batch ${batchNumber} failed:`, error.message);
        totalErrors += batch.length;
      } finally {
        batchClient.release();
      }
      
      // Add small delay between batches to prevent overwhelming the database
      if (i + batchSize < competitions.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`✅ Competitions update completed: ${totalProcessed} processed, ${totalErrors} errors`);
  }

  /**
   * Update seasons data
   */
  async updateSeasons(client, liveData) {
    // This would be called with specific season data
    // For now, it's a placeholder for future implementation
    console.log('📅 Seasons update placeholder - would sync season data');
  }

  /**
   * Update sport events data
   */
  async updateSportEvents(client, liveData) {
    if (!liveData.schedule_summaries || liveData.schedule_summaries.length === 0) {
      return;
    }

    console.log('⚡ Updating sport events...');
    
    for (const summary of liveData.schedule_summaries) {
      if (summary.sport_event) {
        try {
          await client.query(`
            INSERT INTO sport_events (id, parent_id, start_time, start_time_confirmed, type, estimated, replaced_by, resume_time)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE SET
              parent_id = EXCLUDED.parent_id,
              start_time = EXCLUDED.start_time,
              start_time_confirmed = EXCLUDED.start_time_confirmed,
              type = EXCLUDED.type,
              estimated = EXCLUDED.estimated,
              replaced_by = EXCLUDED.replaced_by,
              resume_time = EXCLUDED.resume_time,
              updated_at = CURRENT_TIMESTAMP
          `, [
            summary.sport_event.id,
            summary.sport_event.parent_id,
            summary.sport_event.start_time,
            summary.sport_event.start_time_confirmed,
            summary.sport_event.type,
            summary.sport_event.estimated,
            summary.sport_event.replaced_by,
            summary.sport_event.resume_time
          ]);
        } catch (error) {
          console.error(`Failed to update sport event ${summary.sport_event.id}:`, error.message);
        }
      }
    }
  }

  /**
   * Update venues data
   */
  async updateVenues(client, liveData) {
    if (!liveData.complexes || liveData.complexes.length === 0) {
      return;
    }

    console.log('🏟️ Updating venues and complexes...');
    
    for (const complex of liveData.complexes) {
      try {
        // Insert complex
        await client.query(`
          INSERT INTO complexes (id, name)
          VALUES ($1, $2)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            updated_at = CURRENT_TIMESTAMP
        `, [complex.id, complex.name]);

        // Insert venues for this complex
        if (complex.venues && complex.venues.length > 0) {
          for (const venue of complex.venues) {
            await client.query(`
              INSERT INTO venues (id, name, city_name, country_name, country_code, capacity, timezone, map_coordinates, reduced_capacity, reduced_capacity_max, changed)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
              ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                city_name = EXCLUDED.city_name,
                country_name = EXCLUDED.country_name,
                country_code = EXCLUDED.country_code,
                capacity = EXCLUDED.capacity,
                timezone = EXCLUDED.timezone,
                map_coordinates = EXCLUDED.map_coordinates,
                reduced_capacity = EXCLUDED.reduced_capacity,
                reduced_capacity_max = EXCLUDED.reduced_capacity_max,
                changed = EXCLUDED.changed,
                updated_at = CURRENT_TIMESTAMP
            `, [
              venue.id,
              venue.name,
              venue.city_name,
              venue.country_name,
              venue.country_code,
              venue.capacity,
              venue.timezone,
              venue.map_coordinates,
              venue.reduced_capacity,
              venue.reduced_capacity_max,
              venue.changed
            ]);

            // Link venue to complex
            await client.query(`
              INSERT INTO complex_venues (complex_id, venue_id)
              VALUES ($1, $2)
              ON CONFLICT DO NOTHING
            `, [complex.id, venue.id]);
          }
        }
      } catch (error) {
        console.error(`Failed to update complex ${complex.id}:`, error.message);
      }
    }
  }

  /**
   * Update race rankings data
   */
  async updateRaceRankings(client, liveData) {
    if (!liveData.race_rankings || liveData.race_rankings.length === 0) {
      return;
    }

    console.log('🏃 Updating race rankings...');
    
    for (const ranking of liveData.race_rankings) {
      if (ranking.competitor_rankings && ranking.competitor_rankings.length > 0) {
        for (const competitorRanking of ranking.competitor_rankings) {
          try {
            // Find player by sportsradar_id
            const playerResult = await client.query(`
              SELECT id FROM players WHERE sportsradar_id = $1
            `, [competitorRanking.competitor_id]);

            if (playerResult.rows.length > 0) {
              const playerId = playerResult.rows[0].id;
              
              await client.query(`
                INSERT INTO race_rankings (player_id, sportsradar_id, ranking, points, tour, ranking_date, year, week, type_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (player_id, ranking_date, year) DO UPDATE SET
                  ranking = EXCLUDED.ranking,
                  points = EXCLUDED.points,
                  tour = EXCLUDED.tour,
                  week = EXCLUDED.week,
                  type_id = EXCLUDED.type_id
              `, [
                playerId,
                competitorRanking.competitor_id,
                competitorRanking.rank,
                competitorRanking.points,
                ranking.gender === 'male' ? 'ATP' : 'WTA',
                new Date(),
                ranking.year,
                ranking.week,
                ranking.type_id
              ]);
            }
          } catch (error) {
            console.error(`Failed to update race ranking for ${competitorRanking.competitor_id}:`, error.message);
          }
        }
      }
    }
  }

  /**
   * Update double rankings data
   */
  async updateDoubleRankings(client, liveData) {
    if (!liveData.double_rankings || liveData.double_rankings.length === 0) {
      return;
    }

    console.log('👥 Updating double rankings...');
    
    for (const ranking of liveData.double_rankings) {
      if (ranking.competitor_rankings && ranking.competitor_rankings.length > 0) {
        for (const competitorRanking of ranking.competitor_rankings) {
          try {
            // For doubles, we'd need to handle player pairs
            // This is a simplified implementation
            console.log(`Double ranking for ${competitorRanking.name}: rank ${competitorRanking.rank}, points ${competitorRanking.points}`);
          } catch (error) {
            console.error(`Failed to update double ranking for ${competitorRanking.competitor_id}:`, error.message);
          }
        }
      }
    }
  }
}

module.exports = new DataSyncService();
