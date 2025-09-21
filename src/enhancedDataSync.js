const sportsradar = require('./sportsradar');
const githubDataService = require('./githubDataService');
const dataModels = require('./dataModels');
const database = require('./database');
const historicalDatabase = require('./historicalDatabase');

class EnhancedDataSyncService {
  constructor() {
    this.isRunning = false;
    this.lastSyncTime = null;
    this.lastGitHubSyncTime = null;
    
    // Different sync intervals for different data sources
    this.liveDataInterval = 2 * 60 * 60 * 1000; // 2 hours for live data
    this.historicalDataInterval = 7 * 24 * 60 * 60 * 1000; // 7 days for historical data
    
    this.sportsradar = sportsradar;
    this.githubDataService = githubDataService;
    this.dataModels = dataModels;
  }

  /**
   * Check if Sportsradar is configured and available
   */
  isSportsradarAvailable() {
    return sportsradar.isConfigured();
  }

  /**
   * Check if GitHub data service is available
   */
  isGitHubDataAvailable() {
    return true; // GitHub data is always available (no API key required)
  }

  /**
   * Sync live data from Sportsradar (current rankings, live matches)
   */
  async syncLiveData() {
    if (!this.isSportsradarAvailable()) {
      console.log('⚠️  Sportsradar not configured, skipping live data sync');
      return { success: false, reason: 'Sportsradar not configured' };
    }

    if (this.isRunning) {
      console.log('⚠️  Live data sync already in progress, skipping');
      return { success: false, reason: 'Sync already in progress' };
    }

    this.isRunning = true;
    console.log('🔄 Starting live data synchronization with Sportsradar...');

    try {
      // Fetch live data from Sportsradar
      const liveData = await sportsradar.getAllData();
      
      if (!liveData) {
        console.log('⚠️  No live data received from Sportsradar');
        return { success: false, reason: 'No live data received' };
      }

      // Update database with live data
      await this.updateLiveDataInDatabase(liveData);

      this.lastSyncTime = new Date();
      console.log('✅ Live data synchronization completed successfully');
      
      return {
        success: true,
        lastSync: this.lastSyncTime,
        data: {
          atp_rankings: liveData.atp_rankings?.length || 0,
          wta_rankings: liveData.wta_rankings?.length || 0,
          live_summaries: liveData.live_summaries?.length || 0,
          schedule_summaries: liveData.schedule_summaries?.length || 0
        }
      };

    } catch (error) {
      console.error('❌ Live data synchronization failed:', error.message);
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
   * Sync historical data from GitHub repositories
   */
  async syncHistoricalData() {
    if (!this.isGitHubDataAvailable()) {
      console.log('⚠️  GitHub data service not available, skipping historical data sync');
      return { success: false, reason: 'GitHub data service not available' };
    }

    console.log('🔄 Starting historical data synchronization with GitHub...');

    try {
      // Initialize historical database schema
      await historicalDatabase.initializeHistoricalSchema();

      // Fetch current rankings from GitHub (these are actually historical data)
      console.log('📊 Fetching current rankings from GitHub...');
      const [atpRankings, wtaRankings] = await Promise.all([
        githubDataService.fetchATPRankings(),
        githubDataService.fetchWTARankings()
      ]);

      // Fetch player data
      console.log('👥 Fetching player data from GitHub...');
      const [atpPlayers, wtaPlayers] = await Promise.all([
        githubDataService.fetchPlayerData('ATP'),
        githubDataService.fetchPlayerData('WTA')
      ]);

      // Store data in historical database
      console.log('💾 Storing data in historical database...');
      await Promise.all([
        historicalDatabase.insertHistoricalRankings(atpRankings),
        historicalDatabase.insertHistoricalRankings(wtaRankings),
        historicalDatabase.insertHistoricalPlayers(atpPlayers),
        historicalDatabase.insertHistoricalPlayers(wtaPlayers)
      ]);

      // Fetch recent match results (last 2 years)
      console.log('🏆 Fetching recent match results...');
      const currentYear = new Date().getFullYear();
      const [atpMatches2024, atpMatches2023, wtaMatches2024, wtaMatches2023] = await Promise.all([
        githubDataService.fetchMatchResults('ATP', currentYear),
        githubDataService.fetchMatchResults('ATP', currentYear - 1),
        githubDataService.fetchMatchResults('WTA', currentYear),
        githubDataService.fetchMatchResults('WTA', currentYear - 1)
      ]);

      // Store match results
      const allMatches = [...atpMatches2024, ...atpMatches2023, ...wtaMatches2024, ...wtaMatches2023];
      if (allMatches.length > 0) {
        await historicalDatabase.insertHistoricalMatches(allMatches);
      }

      // Fetch and store match charting data (recent matches only)
      console.log('📈 Fetching match charting data...');
      const [menMatches, womenMatches] = await Promise.all([
        githubDataService.fetchMatchChartingData(),
        githubDataService.fetchWomenMatchChartingData()
      ]);

      // Store match charting data
      const allChartedMatches = [...menMatches, ...womenMatches];
      if (allChartedMatches.length > 0) {
        await historicalDatabase.insertMatchCharting(allChartedMatches);
      }

      // Fetch and store recent match charting points (2020s only for now)
      console.log('📊 Fetching match charting points...');
      const [menPoints2020s, womenPoints2020s] = await Promise.all([
        githubDataService.fetchMatchChartingPoints('2020s'),
        githubDataService.fetchWomenMatchChartingPoints('2020s')
      ]);

      // Store match charting points
      const allChartedPoints = [...menPoints2020s, ...womenPoints2020s];
      if (allChartedPoints.length > 0) {
        await historicalDatabase.insertMatchChartingPoints(allChartedPoints);
      }

      this.lastGitHubSyncTime = new Date();
      console.log('✅ Historical data synchronization completed successfully');
      
      return {
        success: true,
        lastSync: this.lastGitHubSyncTime,
        data: {
          atp_rankings: atpRankings.length,
          wta_rankings: wtaRankings.length,
          atp_players: atpPlayers.length,
          wta_players: wtaPlayers.length,
          matches: allMatches.length,
          charted_matches: allChartedMatches.length,
          charted_points: allChartedPoints.length
        }
      };

    } catch (error) {
      console.error('❌ Historical data synchronization failed:', error.message);
      return {
        success: false,
        error: error.message,
        lastSync: this.lastGitHubSyncTime
      };
    }
  }

  /**
   * Sync all data (both live and historical)
   */
  async syncAllData() {
    console.log('🔄 Starting comprehensive data synchronization...');
    
    const results = {
      live: null,
      historical: null,
      combined: null
    };

    try {
      // Sync live data if available
      if (this.isSportsradarAvailable()) {
        results.live = await this.syncLiveData();
      }

      // Sync historical data
      results.historical = await this.syncHistoricalData();

      // Create combined result
      results.combined = {
        success: (results.live?.success || false) || (results.historical?.success || false),
        liveData: results.live,
        historicalData: results.historical,
        lastSync: new Date()
      };

      console.log('✅ Comprehensive data synchronization completed');
      return results.combined;

    } catch (error) {
      console.error('❌ Comprehensive data synchronization failed:', error.message);
      return {
        success: false,
        error: error.message,
        results: results
      };
    }
  }

  /**
   * Update live data in database
   */
  async updateLiveDataInDatabase(liveData) {
    // Ensure database is connected
    if (!database.pool) {
      console.log('🔄 Connecting to database...');
      await database.connect();
    }
    
    const client = await database.getClient();
    
    try {
      await client.query('BEGIN');

      // Update current rankings (mark as live data)
      await this.updateCurrentRankings(client, liveData);
      
      // Update live matches and events
      await this.updateLiveMatches(client, liveData);

      await client.query('COMMIT');
      console.log('✅ Live data updated in database successfully');

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Live data database update failed:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update historical data in database
   */
  async updateHistoricalDataInDatabase(historicalData) {
    // Ensure database is connected
    if (!database.pool) {
      console.log('🔄 Connecting to database...');
      await database.connect();
    }
    
    const client = await database.getClient();
    
    try {
      await client.query('BEGIN');

      // Update historical rankings
      await this.updateHistoricalRankings(client, historicalData);
      
      // Update player data
      await this.updatePlayerData(client, historicalData);
      
      // Update match results
      await this.updateMatchResults(client, historicalData);
      
      // Update match charting data
      await this.updateMatchChartingData(client, historicalData);

      await client.query('COMMIT');
      console.log('✅ Historical data updated in database successfully');

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Historical data database update failed:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update current rankings (live data)
   */
  async updateCurrentRankings(client, liveData) {
    console.log('📊 Updating current rankings...');

    let totalUpdated = 0;

    // Process ATP rankings
    if (liveData.atp_rankings && liveData.atp_rankings.length > 0) {
      for (const ranking of liveData.atp_rankings) {
        try {
          await this.upsertCurrentRanking(client, {
            ...ranking,
            data_source: 'sportsradar',
            is_current: true
          });
          totalUpdated++;
        } catch (error) {
          console.error(`Error updating ATP ranking for ${ranking.player_name}:`, error.message);
          // If we get a transaction error, break out of the loop
          if (error.message.includes('current transaction is aborted')) {
            console.error('Transaction aborted, stopping ranking updates');
            break;
          }
        }
      }
    }

    // Process WTA rankings
    if (liveData.wta_rankings && liveData.wta_rankings.length > 0) {
      for (const ranking of liveData.wta_rankings) {
        try {
          await this.upsertCurrentRanking(client, {
            ...ranking,
            data_source: 'sportsradar',
            is_current: true
          });
          totalUpdated++;
        } catch (error) {
          console.error(`Error updating WTA ranking for ${ranking.player_name}:`, error.message);
          // If we get a transaction error, break out of the loop
          if (error.message.includes('current transaction is aborted')) {
            console.error('Transaction aborted, stopping ranking updates');
            break;
          }
        }
      }
    }

    console.log(`✅ Updated ${totalUpdated} current rankings`);
  }

  /**
   * Update historical rankings
   */
  async updateHistoricalRankings(client, historicalData) {
    console.log('📊 Updating historical rankings...');

    let totalUpdated = 0;

    // Process ATP historical rankings
    if (historicalData.atp_rankings && historicalData.atp_rankings.length > 0) {
      for (const ranking of historicalData.atp_rankings) {
        try {
          await this.upsertHistoricalRanking(client, {
            ...ranking,
            data_source: 'github',
            is_current: false
          });
          totalUpdated++;
        } catch (error) {
          console.error(`Error updating ATP historical ranking for ${ranking.player_name}:`, error.message);
        }
      }
    }

    // Process WTA historical rankings
    if (historicalData.wta_rankings && historicalData.wta_rankings.length > 0) {
      for (const ranking of historicalData.wta_rankings) {
        try {
          await this.upsertHistoricalRanking(client, {
            ...ranking,
            data_source: 'github',
            is_current: false
          });
          totalUpdated++;
        } catch (error) {
          console.error(`Error updating WTA historical ranking for ${ranking.player_name}:`, error.message);
        }
      }
    }

    console.log(`✅ Updated ${totalUpdated} historical rankings`);
  }

  /**
   * Update player data
   */
  async updatePlayerData(client, historicalData) {
    console.log('👥 Updating player data...');

    let totalUpdated = 0;

    // Process ATP players
    if (historicalData.atp_players && historicalData.atp_players.length > 0) {
      for (const player of historicalData.atp_players) {
        try {
          await this.upsertPlayer(client, {
            ...player,
            data_source: 'github'
          });
          totalUpdated++;
        } catch (error) {
          console.error(`Error updating ATP player ${player.name}:`, error.message);
        }
      }
    }

    // Process WTA players
    if (historicalData.wta_players && historicalData.wta_players.length > 0) {
      for (const player of historicalData.wta_players) {
        try {
          await this.upsertPlayer(client, {
            ...player,
            data_source: 'github'
          });
          totalUpdated++;
        } catch (error) {
          console.error(`Error updating WTA player ${player.name}:`, error.message);
        }
      }
    }

    console.log(`✅ Updated ${totalUpdated} players`);
  }

  /**
   * Update match results
   */
  async updateMatchResults(client, historicalData) {
    console.log('🏆 Updating match results...');
    // This would be implemented based on match data from GitHub
    // For now, we'll focus on rankings and player data
    console.log('📝 Match results update - to be implemented');
  }

  /**
   * Update match charting data
   */
  async updateMatchChartingData(client, historicalData) {
    console.log('📈 Updating match charting data...');
    // This would be implemented based on match charting data from GitHub
    // For now, we'll focus on rankings and player data
    console.log('📝 Match charting data update - to be implemented');
  }

  /**
   * Update live matches
   */
  async updateLiveMatches(client, liveData) {
    console.log('⚡ Updating live matches...');
    // This would be implemented based on live match data from Sportsradar
    console.log('📝 Live matches update - to be implemented');
  }

  /**
   * Upsert current ranking
   */
  async upsertCurrentRanking(client, rankingData) {
    // First try to update existing ranking
    const updateQuery = `
      UPDATE rankings 
      SET ranking = $2, points = $3, tour = $4, data_source = $5, is_current = $6, updated_at = CURRENT_TIMESTAMP
      WHERE player_id = (SELECT id FROM players WHERE name = $1)
      AND ranking_date = $7
    `;
    
    const updateResult = await client.query(updateQuery, [
      rankingData.player_name,
      rankingData.ranking,
      rankingData.points,
      rankingData.tour,
      rankingData.data_source,
      rankingData.is_current,
      rankingData.ranking_date
    ]);

    // If no rows were updated, insert new ranking
    if (updateResult.rowCount === 0) {
      const insertQuery = `
        INSERT INTO rankings (player_id, ranking, points, tour, ranking_date, data_source, is_current, created_at)
        VALUES ((SELECT id FROM players WHERE name = $1), $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      `;

      await client.query(insertQuery, [
        rankingData.player_name,
        rankingData.ranking,
        rankingData.points,
        rankingData.tour,
        rankingData.ranking_date,
        rankingData.data_source,
        rankingData.is_current
      ]);
    }
  }

  /**
   * Upsert historical ranking
   */
  async upsertHistoricalRanking(client, rankingData) {
    // Similar to current ranking but for historical data
    await this.upsertCurrentRanking(client, rankingData);
  }

  /**
   * Upsert player
   */
  async upsertPlayer(client, playerData) {
    // First try to update existing player
    const updateQuery = `
      UPDATE players 
      SET country = $2, country_code = $2, birth_date = $3, height = $4, weight = $5, 
          playing_hand = $6, turned_pro = $7, tour = $8, data_source = $9, updated_at = CURRENT_TIMESTAMP
      WHERE name = $1
    `;
    
    const updateResult = await client.query(updateQuery, [
      playerData.name,
      playerData.country,
      playerData.birth_date,
      playerData.height,
      playerData.weight,
      playerData.playing_hand,
      playerData.turned_pro,
      playerData.tour,
      playerData.data_source
    ]);

    // If no rows were updated, insert new player
    if (updateResult.rowCount === 0) {
      const insertQuery = `
        INSERT INTO players (name, country, country_code, birth_date, height, weight, playing_hand, turned_pro, tour, data_source, created_at)
        VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      `;

      await client.query(insertQuery, [
        playerData.name,
        playerData.country,
        playerData.birth_date,
        playerData.height,
        playerData.weight,
        playerData.playing_hand,
        playerData.turned_pro,
        playerData.tour,
        playerData.data_source
      ]);
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isRunning: this.isRunning,
      lastLiveSync: this.lastSyncTime,
      lastHistoricalSync: this.lastGitHubSyncTime,
      isSportsradarAvailable: this.isSportsradarAvailable(),
      isGitHubDataAvailable: this.isGitHubDataAvailable(),
      nextLiveSyncIn: this.lastSyncTime ? 
        Math.max(0, this.liveDataInterval - (Date.now() - this.lastSyncTime.getTime())) : 
        null,
      nextHistoricalSyncIn: this.lastGitHubSyncTime ? 
        Math.max(0, this.historicalDataInterval - (Date.now() - this.lastGitHubSyncTime.getTime())) : 
        null
    };
  }

  /**
   * Force immediate sync
   */
  async forceSync(type = 'all') {
    console.log(`🔄 Force sync requested for type: ${type}`);
    
    switch (type) {
      case 'live':
        return await this.syncLiveData();
      case 'historical':
        return await this.syncHistoricalData();
      case 'all':
      default:
        return await this.syncAllData();
    }
  }

  /**
   * Start automatic sync
   */
  startAutoSync() {
    console.log('⏰ Starting automatic data sync...');
    
    // Initial sync
    this.syncAllData().catch(error => {
      console.error('Initial sync failed:', error.message);
    });

    // Set up intervals
    setInterval(() => {
      this.syncLiveData().catch(error => {
        console.error('Auto live sync failed:', error.message);
      });
    }, this.liveDataInterval);

    setInterval(() => {
      this.syncHistoricalData().catch(error => {
        console.error('Auto historical sync failed:', error.message);
      });
    }, this.historicalDataInterval);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync() {
    console.log('⏹️  Stopping automatic data sync');
    // Note: In a real implementation, you'd store the interval IDs and clear them
  }
}

module.exports = new EnhancedDataSyncService();
