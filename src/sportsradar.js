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
   * Make HTTP request to Sportsradar API with retry logic
   */
  async makeRequest(endpoint, params = {}, retries = 3) {
    if (!this.isConfigured()) {
      throw new Error('Sportsradar API key not configured');
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
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

        console.log(`🌐 Fetching from Sportsradar: ${endpoint} (attempt ${attempt}/${retries})`);
        const response = await axios.get(url, config);
        
        if (response.status === 200) {
          console.log(`✅ Successfully fetched data from ${endpoint}`);
          return response.data;
        } else {
          throw new Error(`API request failed with status: ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ Sportsradar API error for ${endpoint} (attempt ${attempt}/${retries}):`, error.message);
        
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
          
          // Handle rate limiting
          if (error.response.status === 429) {
            const retryAfter = error.response.headers['retry-after'];
            const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 2000; // Longer delays
            console.log(`⏳ Rate limited, waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          // Don't retry on 404 or other client errors
          if (error.response.status >= 400 && error.response.status < 500) {
            throw error;
          }
        }
        
        // If this is the last attempt, throw the error
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retrying
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
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
      // Add longer delay to avoid rate limiting
      console.log('⏳ Waiting 3 seconds before WTA rankings request...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // For trial accounts, WTA data is often not available
      // Return empty array to avoid confusion
      console.log('⚠️  WTA rankings not available in trial account, returning empty array');
      return [];
      
      // Uncomment below if you have WTA access
      // const data = await this.makeRequest('/rankings.json', { type: 'wta' });
      // return this.processRankings(data, 'WTA');
    } catch (error) {
      console.error('Failed to fetch WTA rankings:', error.message);
      return [];
    }
  }

  /**
   * Get current tournaments
   */
  async getCurrentTournaments() {
    try {
      // Try the competitions endpoint from the official documentation
      const data = await this.makeRequest('/competitions.json');
      return this.processCompetitions(data);
    } catch (error) {
      console.error('Failed to fetch tournaments:', error.message);
      return [];
    }
  }

  /**
   * Get competitions by category (ATP, WTA, ITF)
   */
  async getCompetitionsByCategory(category = 'ATP') {
    try {
      const data = await this.makeRequest('/competitions.json', { category });
      return this.processCompetitions(data);
    } catch (error) {
      console.error(`Failed to fetch ${category} competitions:`, error.message);
      return [];
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
   * Get player profile (Competitor Profile)
   */
  async getPlayerProfile(playerId) {
    try {
      const data = await this.makeRequest(`/competitors/${playerId}/profile.json`);
      return this.processPlayerProfile(data);
    } catch (error) {
      console.error(`Failed to fetch player profile ${playerId}:`, error.message);
      return null;
    }
  }

  /**
   * Get player summaries (previous and upcoming matches)
   */
  async getPlayerSummaries(playerId) {
    try {
      const data = await this.makeRequest(`/competitors/${playerId}/summaries.json`);
      return this.processPlayerSummaries(data);
    } catch (error) {
      console.error(`Failed to fetch player summaries ${playerId}:`, error.message);
      return null;
    }
  }

  /**
   * Get daily summaries for a specific date
   */
  async getDailySummaries(date) {
    try {
      const data = await this.makeRequest(`/schedules/${date}/summaries.json`);
      return this.processDailySummaries(data);
    } catch (error) {
      console.error(`Failed to fetch daily summaries for ${date}:`, error.message);
      return [];
    }
  }

  /**
   * Get live summaries (real-time match updates)
   */
  async getLiveSummaries() {
    try {
      const data = await this.makeRequest('/schedules/live/summaries.json');
      return this.processLiveSummaries(data);
    } catch (error) {
      console.error('Failed to fetch live summaries:', error.message);
      return [];
    }
  }

  /**
   * Get sport event summary for a specific match
   */
  async getSportEventSummary(eventId) {
    try {
      const data = await this.makeRequest(`/sport_events/${eventId}/summary.json`);
      return this.processSportEventSummary(data);
    } catch (error) {
      console.error(`Failed to fetch sport event summary ${eventId}:`, error.message);
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
    if (!data || !data.rankings || !Array.isArray(data.rankings) || data.rankings.length === 0) {
      console.log('No rankings data found');
      return [];
    }

    // Get the first ranking object (should contain competitor_rankings)
    const rankingData = data.rankings[0];
    if (!rankingData || !rankingData.competitor_rankings) {
      console.log('No competitor_rankings found in ranking data');
      return [];
    }

    return rankingData.competitor_rankings.map((ranking) => {
      return {
        ranking: ranking.rank,
        player_id: ranking.competitor?.id,
        player_name: ranking.competitor?.name || 'Unknown Player',
        country: ranking.competitor?.country_code || 'UNK',
        points: ranking.points || 0,
        tour: tour,
        ranking_date: new Date().toISOString().split('T')[0],
        previous_ranking: ranking.previous_ranking || null,
        ranking_movement: ranking.movement || 0
      };
    });
  }

  /**
   * Process competitions data
   */
  processCompetitions(data) {
    if (!data || !data.competitions) {
      return [];
    }

    return data.competitions.map(competition => ({
      id: competition.id,
      name: competition.name,
      category: competition.category,
      type: competition.type,
      gender: competition.gender,
      level: competition.level,
      country_code: competition.country_code,
      country: competition.country
    }));
  }

  /**
   * Process tournaments data (legacy method)
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
   * Process player summaries
   */
  processPlayerSummaries(data) {
    if (!data || !data.competitor) {
      return null;
    }

    return {
      competitor: {
        id: data.competitor.id,
        name: data.competitor.name,
        country_code: data.competitor.country_code
      },
      previous_matches: data.previous_matches || [],
      upcoming_matches: data.upcoming_matches || [],
      statistics: data.statistics || {}
    };
  }

  /**
   * Process daily summaries
   */
  processDailySummaries(data) {
    if (!data || !data.sport_events) {
      return [];
    }

    return data.sport_events.map(event => ({
      id: event.id,
      scheduled: event.scheduled,
      start_time_tbd: event.start_time_tbd,
      status: event.status,
      tournament_round: event.tournament_round,
      season: event.season,
      tournament: event.tournament,
      competitors: event.competitors,
      venue: event.venue,
      conditions: event.conditions,
      coverage: event.coverage
    }));
  }

  /**
   * Process live summaries
   */
  processLiveSummaries(data) {
    if (!data || !data.sport_events) {
      return [];
    }

    return data.sport_events.map(event => ({
      id: event.id,
      scheduled: event.scheduled,
      status: event.status,
      tournament_round: event.tournament_round,
      season: event.season,
      tournament: event.tournament,
      competitors: event.competitors,
      scores: event.scores,
      statistics: event.statistics,
      venue: event.venue,
      conditions: event.conditions
    }));
  }

  /**
   * Process sport event summary
   */
  processSportEventSummary(data) {
    if (!data || !data.sport_event) {
      return null;
    }

    return {
      sport_event: {
        id: data.sport_event.id,
        scheduled: data.sport_event.scheduled,
        start_time_tbd: data.sport_event.start_time_tbd,
        status: data.sport_event.status,
        tournament_round: data.sport_event.tournament_round,
        season: data.sport_event.season,
        tournament: data.sport_event.tournament,
        competitors: data.sport_event.competitors,
        venue: data.sport_event.venue,
        conditions: data.sport_event.conditions
      },
      sport_event_conditions: data.sport_event_conditions,
      sport_event_status: data.sport_event_status,
      statistics: data.statistics,
      timeline: data.timeline
    };
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
      
      // Fetch data sequentially to avoid rate limiting
      const atpRankings = await this.getATPRankings();
      
      // Add delay between calls
      if (atpRankings && atpRankings.length > 0) {
        console.log('⏳ Waiting 2 seconds before next request...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const wtaRankings = await this.getWTARankings();
      
      // Add delay before competitions
      if (wtaRankings !== null) {
        console.log('⏳ Waiting 2 seconds before competitions request...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const competitions = await this.getCurrentTournaments();
      
      // Add delay before live summaries
      if (competitions !== null) {
        console.log('⏳ Waiting 2 seconds before live summaries request...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const liveSummaries = await this.getLiveSummaries();

      const result = {
        atp_rankings: atpRankings || [],
        wta_rankings: wtaRankings || [],
        competitions: competitions || [],
        live_summaries: liveSummaries || [],
        last_updated: new Date().toISOString()
      };

      console.log('✅ Successfully fetched data from Sportsradar');
      console.log(`📊 ATP Rankings: ${result.atp_rankings.length} players`);
      console.log(`📊 WTA Rankings: ${result.wta_rankings.length} players`);
      console.log(`🏆 Competitions: ${result.competitions.length} competitions`);
      console.log(`⚡ Live Summaries: ${result.live_summaries.length} live events`);

      return result;
    } catch (error) {
      console.error('❌ Failed to fetch data from Sportsradar:', error.message);
      return null;
    }
  }
}

module.exports = new SportsradarAPI();
