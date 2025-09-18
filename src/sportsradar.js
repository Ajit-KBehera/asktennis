const axios = require('axios');

class SportsradarAPI {
  constructor() {
    this.apiKey = process.env.SPORTRADAR_API_KEY;
    this.baseURL = 'https://api.sportradar.com/tennis/trial/v3/en';
    this.timeout = 10000; // 10 seconds timeout
    
    if (!this.apiKey || this.apiKey === 'your_sportradar_api_key_here') {
      console.warn('⚠️  Sportsradar API key not configured. Live data features will be disabled.');
    }
  }

  /**
   * Check if API is properly configured
   */
  isConfigured() {
    return this.apiKey && this.apiKey !== 'your_sportradar_api_key_here';
  }

  /**
   * Make HTTP request to Sportsradar API
   */
  async makeRequest(endpoint, params = {}) {
    if (!this.isConfigured()) {
      throw new Error('Sportsradar API key not configured');
    }

    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        params: {
          api_key: this.apiKey,
          ...params
        },
        timeout: this.timeout,
        headers: {
          'User-Agent': 'AskTennis/1.0.0'
        }
      };

      console.log(`🌐 Fetching from Sportsradar: ${endpoint}`);
      const response = await axios.get(url, config);
      
      if (response.status === 200) {
        console.log(`✅ Successfully fetched data from ${endpoint}`);
        return response.data;
      } else {
        throw new Error(`API request failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Sportsradar API error for ${endpoint}:`, error.message);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      throw error;
    }
  }

  /**
   * Get ATP Rankings
   */
  async getATPRankings() {
    try {
      const data = await this.makeRequest('/rankings.json');
      return this.processRankings(data, 'ATP');
    } catch (error) {
      console.error('Failed to fetch ATP rankings:', error.message);
      return null;
    }
  }

  /**
   * Get WTA Rankings
   */
  async getWTARankings() {
    try {
      const data = await this.makeRequest('/rankings.json', { type: 'wta' });
      return this.processRankings(data, 'WTA');
    } catch (error) {
      console.error('Failed to fetch WTA rankings:', error.message);
      return null;
    }
  }

  /**
   * Get current tournaments
   */
  async getCurrentTournaments() {
    try {
      const data = await this.makeRequest('/tournaments.json');
      return this.processTournaments(data);
    } catch (error) {
      console.error('Failed to fetch tournaments:', error.message);
      return null;
    }
  }

  /**
   * Get tournament schedule
   */
  async getTournamentSchedule(tournamentId) {
    try {
      const data = await this.makeRequest(`/tournaments/${tournamentId}/schedule.json`);
      return this.processTournamentSchedule(data);
    } catch (error) {
      console.error(`Failed to fetch schedule for tournament ${tournamentId}:`, error.message);
      return null;
    }
  }

  /**
   * Get player profile
   */
  async getPlayerProfile(playerId) {
    try {
      const data = await this.makeRequest(`/players/${playerId}/profile.json`);
      return this.processPlayerProfile(data);
    } catch (error) {
      console.error(`Failed to fetch player profile ${playerId}:`, error.message);
      return null;
    }
  }

  /**
   * Get match results
   */
  async getMatchResults(tournamentId, date = null) {
    try {
      const params = date ? { date } : {};
      const data = await this.makeRequest(`/tournaments/${tournamentId}/results.json`, params);
      return this.processMatchResults(data);
    } catch (error) {
      console.error(`Failed to fetch match results for tournament ${tournamentId}:`, error.message);
      return null;
    }
  }

  /**
   * Process rankings data
   */
  processRankings(data, tour) {
    if (!data || !data.rankings) {
      return [];
    }

    return data.rankings.map((ranking, index) => ({
      ranking: index + 1,
      player_id: ranking.player?.id,
      player_name: ranking.player?.name,
      country: ranking.player?.country_code,
      points: ranking.points || 0,
      tour: tour,
      ranking_date: new Date().toISOString().split('T')[0],
      previous_ranking: ranking.previous_ranking || null,
      ranking_movement: ranking.ranking_movement || 0
    }));
  }

  /**
   * Process tournaments data
   */
  processTournaments(data) {
    if (!data || !data.tournaments) {
      return [];
    }

    return data.tournaments.map(tournament => ({
      id: tournament.id,
      name: tournament.name,
      type: tournament.type,
      surface: tournament.surface,
      level: tournament.level,
      location: tournament.location,
      start_date: tournament.start_date,
      end_date: tournament.end_date,
      prize_money: tournament.prize_money,
      status: tournament.status,
      current_round: tournament.current_round
    }));
  }

  /**
   * Process tournament schedule
   */
  processTournamentSchedule(data) {
    if (!data || !data.schedule) {
      return [];
    }

    return data.schedule.map(match => ({
      id: match.id,
      tournament_id: data.tournament?.id,
      player1_id: match.player1?.id,
      player1_name: match.player1?.name,
      player2_id: match.player2?.id,
      player2_name: match.player2?.name,
      winner_id: match.winner?.id,
      winner_name: match.winner?.name,
      score: match.score,
      duration: match.duration,
      match_date: match.scheduled,
      round: match.round,
      surface: match.surface,
      status: match.status
    }));
  }

  /**
   * Process player profile
   */
  processPlayerProfile(data) {
    if (!data || !data.player) {
      return null;
    }

    const player = data.player;
    return {
      id: player.id,
      name: player.name,
      country: player.country_code,
      birth_date: player.birth_date,
      height: player.height,
      weight: player.weight,
      playing_hand: player.playing_hand,
      turned_pro: player.turned_pro,
      current_ranking: player.current_ranking,
      career_prize_money: player.career_prize_money,
      coach: player.coach,
      residence: player.residence
    };
  }

  /**
   * Process match results
   */
  processMatchResults(data) {
    if (!data || !data.results) {
      return [];
    }

    return data.results.map(match => ({
      id: match.id,
      tournament_id: data.tournament?.id,
      player1_id: match.player1?.id,
      player1_name: match.player1?.name,
      player2_id: match.player2?.id,
      player2_name: match.player2?.name,
      winner_id: match.winner?.id,
      winner_name: match.winner?.name,
      score: match.score,
      duration: match.duration,
      match_date: match.scheduled,
      round: match.round,
      surface: match.surface,
      status: match.status,
      statistics: match.statistics
    }));
  }

  /**
   * Get all available data (rankings, tournaments, etc.)
   */
  async getAllData() {
    if (!this.isConfigured()) {
      console.log('⚠️  Sportsradar API not configured, skipping data fetch');
      return null;
    }

    try {
      console.log('🔄 Fetching all data from Sportsradar...');
      
      const [atpRankings, wtaRankings, tournaments] = await Promise.allSettled([
        this.getATPRankings(),
        this.getWTARankings(),
        this.getCurrentTournaments()
      ]);

      const result = {
        atp_rankings: atpRankings.status === 'fulfilled' ? atpRankings.value : [],
        wta_rankings: wtaRankings.status === 'fulfilled' ? wtaRankings.value : [],
        tournaments: tournaments.status === 'fulfilled' ? tournaments.value : [],
        last_updated: new Date().toISOString()
      };

      console.log('✅ Successfully fetched data from Sportsradar');
      console.log(`📊 ATP Rankings: ${result.atp_rankings.length} players`);
      console.log(`📊 WTA Rankings: ${result.wta_rankings.length} players`);
      console.log(`🏆 Tournaments: ${result.tournaments.length} tournaments`);

      return result;
    } catch (error) {
      console.error('❌ Failed to fetch data from Sportsradar:', error.message);
      return null;
    }
  }
}

module.exports = new SportsradarAPI();
