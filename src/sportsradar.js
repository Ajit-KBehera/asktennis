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
   * Process Competition Info data
   */
  processCompetitionInfo(data) {
    if (!data || !data.competition) return null;
    
    return {
      competition: data.competition,
      info: data.info,
      generated_at: data.generated_at
    };
  }

  /**
   * Process Competition Seasons data
   */
  processCompetitionSeasons(data) {
    if (!data || !data.season) return [];
    
    return data.season.map(season => ({
      id: season.id,
      name: season.name,
      competition_id: season.competition_id,
      year: season.year,
      start_date: season.start_date,
      end_date: season.end_date,
      disabled: season.disabled
    }));
  }

  /**
   * Process Season Info data
   */
  processSeasonInfo(data) {
    if (!data) return null;
    
    return {
      season: data.season,
      coverage: data.coverage,
      stages: data.stages,
      winner_last_season: data.winner_last_season,
      generated_at: data.generated_at
    };
  }

  /**
   * Process Season Competitors data
   */
  processSeasonCompetitors(data) {
    if (!data || !data.competitor) return [];
    
    return data.competitor.map(competitor => ({
      id: competitor.id,
      name: competitor.name,
      abbreviation: competitor.abbreviation,
      short_name: competitor.short_name,
      players: competitor.players
    }));
  }

  /**
   * Process Season Standings data
   */
  processSeasonStandings(data) {
    if (!data || !data.season_standing) return [];
    
    return data.season_standing.map(standing => ({
      type: standing.type,
      round: standing.round,
      tie_break_rule: standing.tie_break_rule,
      groups: standing.groups
    }));
  }

  /**
   * Process Season Summaries data
   */
  processSeasonSummaries(data) {
    if (!data || !data.summary) return [];
    
    return data.summary.map(summary => ({
      sport_event: summary.sport_event,
      sport_event_status: summary.sport_event_status,
      statistics: summary.statistics
    }));
  }

  /**
   * Process Schedule Summaries data
   */
  processScheduleSummaries(data) {
    if (!data || !data.summary) return [];
    
    return data.summary.map(summary => ({
      sport_event: summary.sport_event,
      sport_event_status: summary.sport_event_status,
      statistics: summary.statistics
    }));
  }

  /**
   * Process Sport Event Summary data
   */
  processSportEventSummary(data) {
    if (!data) return null;
    
    return {
      sport_event: data.sport_event,
      sport_event_status: data.sport_event_status,
      statistics: data.statistics,
      generated_at: data.generated_at
    };
  }

  /**
   * Process Sport Event Timeline data
   */
  processSportEventTimeline(data) {
    if (!data) return null;
    
    return {
      sport_event: data.sport_event,
      sport_event_status: data.sport_event_status,
      statistics: data.statistics,
      timeline: data.timeline,
      generated_at: data.generated_at
    };
  }

  /**
   * Process Competitor Summaries data
   */
  processCompetitorSummaries(data) {
    if (!data || !data.summary) return [];
    
    return data.summary.map(summary => ({
      sport_event: summary.sport_event,
      sport_event_status: summary.sport_event_status,
      statistics: summary.statistics
    }));
  }

  /**
   * Process Competitor Versus Summaries data
   */
  processCompetitorVersusSummaries(data) {
    if (!data) return null;
    
    return {
      competitors: data.competitors,
      last_meetings: data.last_meetings,
      next_meetings: data.next_meetings,
      generated_at: data.generated_at
    };
  }

  /**
   * Process Race Rankings data
   */
  processRaceRankings(data) {
    if (!data || !data.ranking) return [];
    
    return data.ranking.map(ranking => ({
      gender: ranking.gender,
      name: ranking.name,
      type_id: ranking.type_id,
      week: ranking.week,
      year: ranking.year,
      competitor_rankings: ranking.competitor_rankings
    }));
  }

  /**
   * Process Double Competitors Rankings data
   */
  processDoubleCompetitorsRankings(data) {
    if (!data || !data.ranking) return [];
    
    return data.ranking.map(ranking => ({
      gender: ranking.gender,
      name: ranking.name,
      type_id: ranking.type_id,
      week: ranking.week,
      year: ranking.year,
      competitor_rankings: ranking.competitor_rankings
    }));
  }

  /**
   * Process Double Competitors Race Rankings data
   */
  processDoubleCompetitorsRaceRankings(data) {
    if (!data || !data.ranking) return [];
    
    return data.ranking.map(ranking => ({
      gender: ranking.gender,
      name: ranking.name,
      type_id: ranking.type_id,
      week: ranking.week,
      year: ranking.year,
      competitor_rankings: ranking.competitor_rankings
    }));
  }

  /**
   * Process Complexes data
   */
  processComplexes(data) {
    if (!data || !data.complex) return [];
    
    return data.complex.map(complex => ({
      id: complex.id,
      name: complex.name,
      venues: complex.venues
    }));
  }

  /**
   * Get Competitions - Enhanced with full XSD structure
   */
  async getCompetitions() {
    try {
      const data = await this.makeRequest('/competitions.json');
      return this.processCompetitions(data);
    } catch (error) {
      console.error('Failed to fetch competitions:', error.message);
      return null;
    }
  }

  /**
   * Get Competition Info - Detailed competition information
   */
  async getCompetitionInfo(competitionId) {
    try {
      const data = await this.makeRequest(`/competitions/${competitionId}/info.json`);
      return this.processCompetitionInfo(data);
    } catch (error) {
      console.error(`Failed to fetch competition info for ${competitionId}:`, error.message);
      return null;
    }
  }

  /**
   * Get Competition Seasons
   */
  async getCompetitionSeasons(competitionId) {
    try {
      const data = await this.makeRequest(`/competitions/${competitionId}/seasons.json`);
      return this.processCompetitionSeasons(data);
    } catch (error) {
      console.error(`Failed to fetch seasons for competition ${competitionId}:`, error.message);
      return null;
    }
  }

  /**
   * Get Season Info - Detailed season information
   */
  async getSeasonInfo(seasonId) {
    try {
      const data = await this.makeRequest(`/seasons/${seasonId}/info.json`);
      return this.processSeasonInfo(data);
    } catch (error) {
      console.error(`Failed to fetch season info for ${seasonId}:`, error.message);
      return null;
    }
  }

  /**
   * Get Season Competitors
   */
  async getSeasonCompetitors(seasonId) {
    try {
      const data = await this.makeRequest(`/seasons/${seasonId}/competitors.json`);
      return this.processSeasonCompetitors(data);
    } catch (error) {
      console.error(`Failed to fetch competitors for season ${seasonId}:`, error.message);
      return null;
    }
  }

  /**
   * Get Season Standings
   */
  async getSeasonStandings(seasonId) {
    try {
      const data = await this.makeRequest(`/seasons/${seasonId}/standings.json`);
      return this.processSeasonStandings(data);
    } catch (error) {
      console.error(`Failed to fetch standings for season ${seasonId}:`, error.message);
      return null;
    }
  }

  /**
   * Get Season Summaries
   */
  async getSeasonSummaries(seasonId) {
    try {
      const data = await this.makeRequest(`/seasons/${seasonId}/summaries.json`);
      return this.processSeasonSummaries(data);
    } catch (error) {
      console.error(`Failed to fetch summaries for season ${seasonId}:`, error.message);
      return null;
    }
  }

  /**
   * Get Schedule Summaries - All scheduled matches
   */
  async getScheduleSummaries() {
    try {
      const data = await this.makeRequest('/schedule/summaries.json');
      return this.processScheduleSummaries(data);
    } catch (error) {
      console.error('Failed to fetch schedule summaries:', error.message);
      return null;
    }
  }

  /**
   * Get Sport Event Summary - Individual match details
   */
  async getSportEventSummary(eventId) {
    try {
      const data = await this.makeRequest(`/sport_events/${eventId}/summary.json`);
      return this.processSportEventSummary(data);
    } catch (error) {
      console.error(`Failed to fetch sport event summary for ${eventId}:`, error.message);
      return null;
    }
  }

  /**
   * Get Sport Event Timeline - Match timeline and events
   */
  async getSportEventTimeline(eventId) {
    try {
      const data = await this.makeRequest(`/sport_events/${eventId}/timeline.json`);
      return this.processSportEventTimeline(data);
    } catch (error) {
      console.error(`Failed to fetch sport event timeline for ${eventId}:`, error.message);
      return null;
    }
  }

  /**
   * Get Competitor Summaries - Player match history
   */
  async getCompetitorSummaries(competitorId) {
    try {
      const data = await this.makeRequest(`/competitors/${competitorId}/summaries.json`);
      return this.processCompetitorSummaries(data);
    } catch (error) {
      console.error(`Failed to fetch competitor summaries for ${competitorId}:`, error.message);
      return null;
    }
  }

  /**
   * Get Competitor Versus Summaries - Head-to-head records
   */
  async getCompetitorVersusSummaries(competitorId1, competitorId2) {
    try {
      const data = await this.makeRequest(`/competitors/${competitorId1}/versus/${competitorId2}/summaries.json`);
      return this.processCompetitorVersusSummaries(data);
    } catch (error) {
      console.error(`Failed to fetch versus summaries for ${competitorId1} vs ${competitorId2}:`, error.message);
      return null;
    }
  }

  /**
   * Get Race Rankings - Year-to-date rankings
   */
  async getRaceRankings() {
    try {
      const data = await this.makeRequest('/race_rankings.json');
      return this.processRaceRankings(data);
    } catch (error) {
      console.error('Failed to fetch race rankings:', error.message);
      return null;
    }
  }

  /**
   * Get Double Competitors Rankings
   */
  async getDoubleCompetitorsRankings() {
    try {
      const data = await this.makeRequest('/double_competitors_rankings.json');
      return this.processDoubleCompetitorsRankings(data);
    } catch (error) {
      console.error('Failed to fetch double competitors rankings:', error.message);
      return null;
    }
  }

  /**
   * Get Double Competitors Race Rankings
   */
  async getDoubleCompetitorsRaceRankings() {
    try {
      const data = await this.makeRequest('/double_competitors_race_rankings.json');
      return this.processDoubleCompetitorsRaceRankings(data);
    } catch (error) {
      console.error('Failed to fetch double competitors race rankings:', error.message);
      return null;
    }
  }

  /**
   * Get Complexes - Venue information
   */
  async getComplexes() {
    try {
      const data = await this.makeRequest('/complexes.json');
      return this.processComplexes(data);
    } catch (error) {
      console.error('Failed to fetch complexes:', error.message);
      return null;
    }
  }

  /**
   * Get all available data (rankings, tournaments, etc.) - Enhanced version
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

      // Get additional data with delays
      const scheduleSummaries = await this.getScheduleSummaries();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const raceRankings = await this.getRaceRankings();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const doubleRankings = await this.getDoubleCompetitorsRankings();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const complexes = await this.getComplexes();

      const result = {
        atp_rankings: atpRankings || [],
        wta_rankings: wtaRankings || [],
        competitions: competitions || [],
        live_summaries: liveSummaries || [],
        schedule_summaries: scheduleSummaries || [],
        race_rankings: raceRankings || [],
        double_rankings: doubleRankings || [],
        complexes: complexes || [],
        last_updated: new Date().toISOString()
      };

      console.log('✅ Successfully fetched enhanced data from Sportsradar');
      console.log(`📊 ATP Rankings: ${result.atp_rankings.length} players`);
      console.log(`📊 WTA Rankings: ${result.wta_rankings.length} players`);
      console.log(`🏆 Competitions: ${result.competitions.length} competitions`);
      console.log(`⚡ Live Summaries: ${result.live_summaries.length} live events`);
      console.log(`📅 Schedule Summaries: ${result.schedule_summaries.length} scheduled matches`);
      console.log(`🏃 Race Rankings: ${result.race_rankings.length} race rankings`);
      console.log(`👥 Double Rankings: ${result.double_rankings.length} double rankings`);
      console.log(`🏟️ Complexes: ${result.complexes.length} venues`);

      return result;
    } catch (error) {
      console.error('❌ Failed to fetch data from Sportsradar:', error.message);
      return null;
    }
  }
}

module.exports = new SportsradarAPI();
