const axios = require('axios');
const csv = require('csv-parser');
const { Readable } = require('stream');

class GitHubDataService {
  constructor() {
    this.baseUrl = 'https://raw.githubusercontent.com/JeffSackmann';
    this.repositories = {
      atp: 'tennis_atp',
      wta: 'tennis_wta',
      charting: 'tennis_MatchChartingProject',
      slam: 'tennis_slam_pointbypoint'
    };
    
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Fetch current ATP rankings
   */
  async fetchATPRankings() {
    try {
      console.log('🔄 Fetching ATP rankings from GitHub...');
      
      // Try different possible file names
      const possibleFiles = [
        'atp_rankings_current.csv',
        'atp_rankings.csv',
        'rankings_current.csv',
        'current_rankings.csv'
      ];
      
      let data = [];
      for (const fileName of possibleFiles) {
        try {
          const url = `${this.baseUrl}/${this.repositories.atp}/main/${fileName}`;
          data = await this.fetchAndParseCSV(url);
          if (data.length > 0) {
            console.log(`✅ Found ATP rankings in file: ${fileName}`);
            break;
          }
        } catch (error) {
          console.log(`⚠️  File ${fileName} not found, trying next...`);
          continue;
        }
      }
      
      console.log(`✅ Fetched ${data.length} ATP rankings`);
      return this.processRankingsData(data, 'ATP');
    } catch (error) {
      console.error('❌ Failed to fetch ATP rankings:', error.message);
      return [];
    }
  }

  /**
   * Fetch current WTA rankings
   */
  async fetchWTARankings() {
    try {
      console.log('🔄 Fetching WTA rankings from GitHub...');
      
      // Try different possible file names
      const possibleFiles = [
        'wta_rankings_current.csv',
        'wta_rankings.csv',
        'rankings_current.csv',
        'current_rankings.csv'
      ];
      
      let data = [];
      for (const fileName of possibleFiles) {
        try {
          const url = `${this.baseUrl}/${this.repositories.wta}/main/${fileName}`;
          data = await this.fetchAndParseCSV(url);
          if (data.length > 0) {
            console.log(`✅ Found WTA rankings in file: ${fileName}`);
            break;
          }
        } catch (error) {
          console.log(`⚠️  File ${fileName} not found, trying next...`);
          continue;
        }
      }
      
      console.log(`✅ Fetched ${data.length} WTA rankings`);
      return this.processRankingsData(data, 'WTA');
    } catch (error) {
      console.error('❌ Failed to fetch WTA rankings:', error.message);
      return [];
    }
  }

  /**
   * Fetch historical rankings for a specific year
   */
  async fetchHistoricalRankings(tour = 'ATP', year = null) {
    try {
      const repo = tour === 'ATP' ? this.repositories.atp : this.repositories.wta;
      const fileName = year ? `atp_rankings_${year}.csv` : 'atp_rankings_current.csv';
      const url = `${this.baseUrl}/${repo}/main/${fileName}`;
      
      console.log(`🔄 Fetching ${tour} historical rankings for ${year || 'current'}...`);
      const data = await this.fetchAndParseCSV(url);
      
      console.log(`✅ Fetched ${data.length} ${tour} historical rankings`);
      return this.processRankingsData(data, tour);
    } catch (error) {
      console.error(`❌ Failed to fetch ${tour} historical rankings:`, error.message);
      return [];
    }
  }

  /**
   * Fetch match results for a specific year
   */
  async fetchMatchResults(tour = 'ATP', year = null) {
    try {
      const repo = tour === 'ATP' ? this.repositories.atp : this.repositories.wta;
      const fileName = year ? `${tour.toLowerCase()}_matches_${year}.csv` : `${tour.toLowerCase()}_matches_2024.csv`;
      const url = `${this.baseUrl}/${repo}/main/${fileName}`;
      
      console.log(`🔄 Fetching ${tour} match results for ${year || '2024'}...`);
      const data = await this.fetchAndParseCSV(url);
      
      console.log(`✅ Fetched ${data.length} ${tour} match results`);
      return this.processMatchResultsData(data, tour);
    } catch (error) {
      console.error(`❌ Failed to fetch ${tour} match results:`, error.message);
      return [];
    }
  }

  /**
   * Fetch player information
   */
  async fetchPlayerData(tour = 'ATP') {
    try {
      const repo = tour === 'ATP' ? this.repositories.atp : this.repositories.wta;
      const fileName = `${tour.toLowerCase()}_players.csv`;
      const url = `${this.baseUrl}/${repo}/main/${fileName}`;
      
      console.log(`🔄 Fetching ${tour} player data...`);
      const data = await this.fetchAndParseCSV(url);
      
      console.log(`✅ Fetched ${data.length} ${tour} players`);
      return this.processPlayerData(data, tour);
    } catch (error) {
      console.error(`❌ Failed to fetch ${tour} player data:`, error.message);
      return [];
    }
  }

  /**
   * Fetch match charting data (point-by-point)
   */
  async fetchMatchChartingData() {
    try {
      console.log('🔄 Fetching match charting data...');
      
      // Fetch match metadata
      const matchesUrl = `${this.baseUrl}/${this.repositories.charting}/main/charting-m-matches.csv`;
      const matchesData = await this.fetchAndParseCSV(matchesUrl);
      
      console.log(`✅ Fetched ${matchesData.length} charted matches`);
      return this.processMatchChartingData(matchesData);
    } catch (error) {
      console.error('❌ Failed to fetch match charting data:', error.message);
      return [];
    }
  }

  /**
   * Fetch Grand Slam point-by-point data
   */
  async fetchGrandSlamData(year = 2024, tournament = 'wimbledon') {
    try {
      const fileName = `${year}-${tournament}-points.csv`;
      const url = `${this.baseUrl}/${this.repositories.slam}/main/${fileName}`;
      
      console.log(`🔄 Fetching Grand Slam data for ${tournament} ${year}...`);
      const data = await this.fetchAndParseCSV(url);
      
      console.log(`✅ Fetched ${data.length} Grand Slam points`);
      return this.processGrandSlamData(data, year, tournament);
    } catch (error) {
      console.error(`❌ Failed to fetch Grand Slam data:`, error.message);
      return [];
    }
  }

  /**
   * Fetch and parse CSV data from URL
   */
  async fetchAndParseCSV(url) {
    // Check cache first
    const cacheKey = url;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('🎯 Using cached data for:', url);
      return cached.data;
    }

    try {
      console.log(`🌐 Fetching CSV from: ${url}`);
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'AskTennis-GitHub-Integration/1.0.0'
        }
      });

      const csvData = response.data;
      const results = [];

      return new Promise((resolve, reject) => {
        const stream = Readable.from([csvData]);
        
        stream
          .pipe(csv())
          .on('data', (row) => results.push(row))
          .on('end', () => {
            // Cache the results
            this.cache.set(cacheKey, {
              data: results,
              timestamp: Date.now()
            });
            
            console.log(`📊 Parsed ${results.length} CSV rows`);
            resolve(results);
          })
          .on('error', (error) => {
            console.error('❌ CSV parsing error:', error);
            reject(error);
          });
      });
    } catch (error) {
      console.error('❌ Failed to fetch CSV data:', error.message);
      throw error;
    }
  }

  /**
   * Process rankings data into standardized format
   */
  processRankingsData(data, tour) {
    return data.map(row => ({
      player_id: row.player_id || row.player,
      player_name: row.player_name || row.name || row.player,
      ranking: parseInt(row.ranking) || parseInt(row.rank),
      points: parseInt(row.points) || 0,
      tour: tour,
      ranking_date: row.ranking_date || row.date || new Date().toISOString().split('T')[0],
      data_source: 'github',
      is_current: true
    })).filter(item => item.player_name && item.ranking);
  }

  /**
   * Process match results data
   */
  processMatchResultsData(data, tour) {
    return data.map(row => ({
      tournament_name: row.tourney_name || row.tournament,
      tournament_date: row.tourney_date || row.date,
      surface: row.surface,
      round: row.round,
      winner_name: row.winner_name || row.winner,
      loser_name: row.loser_name || row.loser,
      score: row.score,
      winner_rank: parseInt(row.winner_rank) || null,
      loser_rank: parseInt(row.loser_rank) || null,
      winner_points: parseInt(row.winner_pts) || null,
      loser_points: parseInt(row.loser_pts) || null,
      tour: tour,
      data_source: 'github'
    })).filter(item => item.winner_name && item.loser_name);
  }

  /**
   * Process player data
   */
  processPlayerData(data, tour) {
    return data.map(row => ({
      player_id: row.player_id || row.id,
      name: row.name || row.player_name,
      birth_date: row.dob || row.birth_date,
      country: row.country || row.ioc,
      height: parseInt(row.height) || null,
      weight: parseInt(row.weight) || null,
      playing_hand: row.hand || row.playing_hand,
      turned_pro: parseInt(row.turned_pro) || null,
      tour: tour,
      data_source: 'github'
    })).filter(item => item.name);
  }

  /**
   * Process match charting data
   */
  processMatchChartingData(data) {
    return data.map(row => ({
      match_id: row.match_id,
      tournament: row.tournament,
      date: row.date,
      surface: row.surface,
      round: row.round,
      player1: row.player1,
      player2: row.player2,
      winner: row.winner,
      score: row.score,
      data_source: 'github_charting'
    })).filter(item => item.match_id);
  }

  /**
   * Process Grand Slam data
   */
  processGrandSlamData(data, year, tournament) {
    return data.map(row => ({
      point_id: row.point_id,
      match_id: row.match_id,
      tournament: tournament,
      year: year,
      round: row.round,
      player1: row.player1,
      player2: row.player2,
      point_winner: row.point_winner,
      serve_direction: row.serve_direction,
      return_direction: row.return_direction,
      rally_length: parseInt(row.rally_length) || 0,
      data_source: 'github_slam'
    })).filter(item => item.point_id);
  }

  /**
   * Get all available data (comprehensive fetch)
   */
  async getAllData() {
    try {
      console.log('🔄 Fetching all GitHub tennis data...');
      
      const [atpRankings, wtaRankings, atpPlayers, wtaPlayers, matchCharting] = await Promise.all([
        this.fetchATPRankings(),
        this.fetchWTARankings(),
        this.fetchPlayerData('ATP'),
        this.fetchPlayerData('WTA'),
        this.fetchMatchChartingData()
      ]);

      const result = {
        atp_rankings: atpRankings,
        wta_rankings: wtaRankings,
        atp_players: atpPlayers,
        wta_players: wtaPlayers,
        match_charting: matchCharting,
        last_updated: new Date().toISOString(),
        data_source: 'github'
      };

      console.log('✅ Successfully fetched all GitHub data');
      console.log(`📊 ATP Rankings: ${result.atp_rankings.length} players`);
      console.log(`📊 WTA Rankings: ${result.wta_rankings.length} players`);
      console.log(`👥 ATP Players: ${result.atp_players.length} players`);
      console.log(`👥 WTA Players: ${result.wta_players.length} players`);
      console.log(`📈 Match Charting: ${result.match_charting.length} matches`);

      return result;
    } catch (error) {
      console.error('❌ Failed to fetch all GitHub data:', error.message);
      return null;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ GitHub data cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout,
      entries: Array.from(this.cache.keys())
    };
  }
}

module.exports = new GitHubDataService();
