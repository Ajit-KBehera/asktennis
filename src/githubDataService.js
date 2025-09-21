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
      
      // Use the correct file name we discovered
      const possibleFiles = [
        'atp_rankings_current.csv'
      ];
      
      let data = [];
      for (const fileName of possibleFiles) {
        try {
          const url = `${this.baseUrl}/${this.repositories.atp}/master/${fileName}`;
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
      const processedRankings = this.processRankingsData(data, 'ATP');
      
      // Resolve player names
      console.log('🔄 Resolving player names...');
      const players = await this.fetchPlayerData('ATP');
      const rankingsWithNames = await this.resolvePlayerNames(processedRankings, players);
      
      return rankingsWithNames;
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
      
      // Use the correct file name we discovered
      const possibleFiles = [
        'wta_rankings_current.csv'
      ];
      
      let data = [];
      for (const fileName of possibleFiles) {
        try {
          const url = `${this.baseUrl}/${this.repositories.wta}/master/${fileName}`;
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
      const processedRankings = this.processRankingsData(data, 'WTA');
      
      // Resolve player names
      console.log('🔄 Resolving player names...');
      const players = await this.fetchPlayerData('WTA');
      const rankingsWithNames = await this.resolvePlayerNames(processedRankings, players);
      
      return rankingsWithNames;
    } catch (error) {
      console.error('❌ Failed to fetch WTA rankings:', error.message);
      return [];
    }
  }

  /**
   * Fetch historical rankings for a specific decade or year
   */
  async fetchHistoricalRankings(tour = 'ATP', decade = null) {
    try {
      const repo = tour === 'ATP' ? this.repositories.atp : this.repositories.wta;
      
      // Map decade to file name based on discovered structure
      const decadeFiles = {
        '70s': 'atp_rankings_70s.csv',
        '80s': 'atp_rankings_80s.csv', 
        '90s': 'atp_rankings_90s.csv',
        '00s': 'atp_rankings_00s.csv',
        '10s': 'atp_rankings_10s.csv',
        '20s': 'atp_rankings_20s.csv'
      };
      
      const wtaDecadeFiles = {
        '80s': 'wta_rankings_80s.csv',
        '90s': 'wta_rankings_90s.csv',
        '00s': 'wta_rankings_00s.csv',
        '10s': 'wta_rankings_10s.csv',
        '20s': 'wta_rankings_20s.csv'
      };
      
      const fileMap = tour === 'ATP' ? decadeFiles : wtaDecadeFiles;
      const fileName = decade ? fileMap[decade] : (tour === 'ATP' ? 'atp_rankings_current.csv' : 'wta_rankings_current.csv');
      
      if (!fileName) {
        throw new Error(`No data available for ${tour} ${decade}`);
      }
      
      const url = `${this.baseUrl}/${repo}/master/${fileName}`;
      
      console.log(`🔄 Fetching ${tour} historical rankings for ${decade || 'current'}...`);
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
  async fetchMatchResults(tour = 'ATP', year = 2024) {
    try {
      const repo = tour === 'ATP' ? this.repositories.atp : this.repositories.wta;
      
      // Use the correct file name format we discovered
      const fileName = `${tour.toLowerCase()}_matches_${year}.csv`;
      const url = `${this.baseUrl}/${repo}/master/${fileName}`;
      
      console.log(`🔄 Fetching ${tour} match results for ${year}...`);
      const data = await this.fetchAndParseCSV(url);
      
      console.log(`✅ Fetched ${data.length} ${tour} match results for ${year}`);
      return this.processMatchResultsData(data, tour);
    } catch (error) {
      console.error(`❌ Failed to fetch ${tour} match results for ${year}:`, error.message);
      return [];
    }
  }

  /**
   * Fetch multiple years of match results
   */
  async fetchMatchResultsRange(tour = 'ATP', startYear = 2020, endYear = 2024) {
    try {
      console.log(`🔄 Fetching ${tour} match results from ${startYear} to ${endYear}...`);
      
      const allResults = [];
      for (let year = startYear; year <= endYear; year++) {
        try {
          const yearResults = await this.fetchMatchResults(tour, year);
          allResults.push(...yearResults);
          console.log(`✅ Added ${yearResults.length} matches from ${year}`);
        } catch (error) {
          console.log(`⚠️  Skipping ${year} due to error: ${error.message}`);
        }
      }
      
      console.log(`✅ Total ${tour} match results: ${allResults.length}`);
      return allResults;
    } catch (error) {
      console.error(`❌ Failed to fetch ${tour} match results range:`, error.message);
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
      const url = `${this.baseUrl}/${repo}/master/${fileName}`;
      
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
      const matchesUrl = `${this.baseUrl}/${this.repositories.charting}/master/charting-m-matches.csv`;
      const matchesData = await this.fetchAndParseCSV(matchesUrl);
      
      console.log(`✅ Fetched ${matchesData.length} charted matches`);
      return this.processMatchChartingData(matchesData);
    } catch (error) {
      console.error('❌ Failed to fetch match charting data:', error.message);
      return [];
    }
  }

  /**
   * Fetch match charting points data
   */
  async fetchMatchChartingPoints(decade = '2020s') {
    try {
      console.log(`🔄 Fetching match charting points for ${decade}...`);
      
      const pointsUrl = `${this.baseUrl}/${this.repositories.charting}/master/charting-m-points-${decade}.csv`;
      const pointsData = await this.fetchAndParseCSV(pointsUrl);
      
      console.log(`✅ Fetched ${pointsData.length} charted points for ${decade}`);
      return this.processMatchChartingPoints(pointsData);
    } catch (error) {
      console.error(`❌ Failed to fetch match charting points for ${decade}:`, error.message);
      return [];
    }
  }

  /**
   * Fetch women's match charting data
   */
  async fetchWomenMatchChartingData() {
    try {
      console.log('🔄 Fetching women\'s match charting data...');
      
      // Fetch match metadata
      const matchesUrl = `${this.baseUrl}/${this.repositories.charting}/master/charting-w-matches.csv`;
      const matchesData = await this.fetchAndParseCSV(matchesUrl);
      
      console.log(`✅ Fetched ${matchesData.length} women's charted matches`);
      return this.processMatchChartingData(matchesData);
    } catch (error) {
      console.error('❌ Failed to fetch women\'s match charting data:', error.message);
      return [];
    }
  }

  /**
   * Fetch women's match charting points data
   */
  async fetchWomenMatchChartingPoints(decade = '2020s') {
    try {
      console.log(`🔄 Fetching women's match charting points for ${decade}...`);
      
      const pointsUrl = `${this.baseUrl}/${this.repositories.charting}/master/charting-w-points-${decade}.csv`;
      const pointsData = await this.fetchAndParseCSV(pointsUrl);
      
      console.log(`✅ Fetched ${pointsData.length} women's charted points for ${decade}`);
      return this.processMatchChartingPoints(pointsData);
    } catch (error) {
      console.error(`❌ Failed to fetch women's match charting points for ${decade}:`, error.message);
      return [];
    }
  }

  /**
   * Fetch Grand Slam point-by-point data
   */
  async fetchGrandSlamData(year = 2024, tournament = 'wimbledon') {
    try {
      // Map tournament names to file format
      const tournamentMap = {
        'wimbledon': 'wimbledon',
        'usopen': 'usopen', 
        'frenchopen': 'frenchopen',
        'ausopen': 'ausopen'
      };
      
      const tournamentKey = tournamentMap[tournament.toLowerCase()] || tournament;
      const fileName = `${year}-${tournamentKey}-points.csv`;
      const url = `${this.baseUrl}/${this.repositories.slam}/master/${fileName}`;
      
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
   * Fetch Grand Slam match data (without points)
   */
  async fetchGrandSlamMatches(year = 2024, tournament = 'wimbledon') {
    try {
      const tournamentMap = {
        'wimbledon': 'wimbledon',
        'usopen': 'usopen',
        'frenchopen': 'frenchopen', 
        'ausopen': 'ausopen'
      };
      
      const tournamentKey = tournamentMap[tournament.toLowerCase()] || tournament;
      const fileName = `${year}-${tournamentKey}-matches.csv`;
      const url = `${this.baseUrl}/${this.repositories.slam}/master/${fileName}`;
      
      console.log(`🔄 Fetching Grand Slam matches for ${tournament} ${year}...`);
      const data = await this.fetchAndParseCSV(url);
      
      console.log(`✅ Fetched ${data.length} Grand Slam matches`);
      return this.processGrandSlamMatches(data, year, tournament);
    } catch (error) {
      console.error(`❌ Failed to fetch Grand Slam matches:`, error.message);
      return [];
    }
  }

  /**
   * Fetch Grand Slam data for multiple years
   */
  async fetchGrandSlamDataRange(startYear = 2020, endYear = 2024, tournament = 'wimbledon') {
    try {
      console.log(`🔄 Fetching Grand Slam data for ${tournament} ${startYear}-${endYear}...`);
      
      const allMatches = [];
      const allPoints = [];
      
      for (let year = startYear; year <= endYear; year++) {
        try {
          const [matches, points] = await Promise.all([
            this.fetchGrandSlamMatches(year, tournament),
            this.fetchGrandSlamData(year, tournament)
          ]);
          allMatches.push(...matches);
          allPoints.push(...points);
        } catch (error) {
          console.log(`⚠️  Skipping ${tournament} ${year} (data not available)`);
        }
      }
      
      console.log(`✅ Fetched ${allMatches.length} matches and ${allPoints.length} points for ${tournament} ${startYear}-${endYear}`);
      return {
        matches: allMatches,
        points: allPoints
      };
    } catch (error) {
      console.error(`❌ Failed to fetch Grand Slam data range for ${tournament}:`, error.message);
      return { matches: [], points: [] };
    }
  }

  /**
   * Fetch all Grand Slam tournaments for a year
   */
  async fetchAllGrandSlamsForYear(year = 2024) {
    try {
      console.log(`🔄 Fetching all Grand Slam data for ${year}...`);
      
      const tournaments = ['ausopen', 'frenchopen', 'wimbledon', 'usopen'];
      const allMatches = [];
      const allPoints = [];
      
      for (const tournament of tournaments) {
        try {
          const [matches, points] = await Promise.all([
            this.fetchGrandSlamMatches(year, tournament),
            this.fetchGrandSlamData(year, tournament)
          ]);
          allMatches.push(...matches);
          allPoints.push(...points);
        } catch (error) {
          console.log(`⚠️  Skipping ${tournament} ${year} (data not available)`);
        }
      }
      
      console.log(`✅ Fetched ${allMatches.length} matches and ${allPoints.length} points for all Grand Slams ${year}`);
      return {
        matches: allMatches,
        points: allPoints
      };
    } catch (error) {
      console.error(`❌ Failed to fetch all Grand Slam data for ${year}:`, error.message);
      return { matches: [], points: [] };
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
    return data.map(row => {
      const ranking = parseInt(row.rank);
      const points = parseInt(row.points);
      
      // Skip rows with invalid data
      if (!row.player || isNaN(ranking) || ranking <= 0) {
        return null;
      }
      
      return {
        player_id: row.player || row.player_id,
        player_name: row.player || row.player_id, // Will be resolved later with player names
        ranking: ranking,
        points: isNaN(points) ? null : points,
        tour: tour,
        ranking_date: row.ranking_date || row.date || new Date().toISOString().split('T')[0],
        data_source: 'github'
      };
    }).filter(item => item !== null);
  }

  /**
   * Process match results data
   */
  processMatchResultsData(data, tour) {
    return data.map(row => {
      // Safely parse numeric fields
      const winnerRank = row.winner_rank && row.winner_rank !== '' ? parseInt(row.winner_rank) : null;
      const loserRank = row.loser_rank && row.loser_rank !== '' ? parseInt(row.loser_rank) : null;
      const winnerPoints = (row.winner_pts || row.winner_rank_points) && (row.winner_pts || row.winner_rank_points) !== '' ? parseInt(row.winner_pts || row.winner_rank_points) : null;
      const loserPoints = (row.loser_pts || row.loser_rank_points) && (row.loser_pts || row.loser_rank_points) !== '' ? parseInt(row.loser_pts || row.loser_rank_points) : null;
      
      // Parse tournament date safely
      let tournamentDate = null;
      const dateValue = row.tourney_date || row.date;
      if (dateValue) {
        try {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            tournamentDate = date.toISOString().split('T')[0];
          }
        } catch (error) {
          // Invalid date, keep as null
        }
      }
      
      return {
        tournament_name: row.tourney_name || row.tournament,
        tournament_date: tournamentDate,
        surface: row.surface,
        round: row.round,
        winner_name: row.winner_name || row.winner,
        loser_name: row.loser_name || row.loser,
        score: row.score,
        winner_rank: winnerRank,
        loser_rank: loserRank,
        winner_points: winnerPoints,
        loser_points: loserPoints,
        tour: tour,
        data_source: 'github'
      };
    }).filter(item => item.winner_name && item.loser_name);
  }

  /**
   * Process player data
   */
  processPlayerData(data, tour) {
    return data.map(row => {
      // Parse birth date safely
      let birthDate = null;
      if (row.dob && row.dob !== '1900-00-00' && row.dob !== '1889-00-00' && row.dob.length >= 8) {
        try {
          const year = row.dob.slice(0, 4);
          const month = row.dob.slice(4, 6);
          const day = row.dob.slice(6, 8);
          
          // Validate date components
          if (year !== '0000' && month !== '00' && day !== '00') {
            birthDate = `${year}-${month}-${day}`;
          }
        } catch (error) {
          // Invalid date, keep as null
        }
      }
      
      return {
        player_id: row.player_id,
        name: `${row.name_first} ${row.name_last}`.trim(),
        birth_date: birthDate,
        country: row.ioc,
        height: parseInt(row.height) || null,
        weight: null, // Not available in this dataset
        playing_hand: row.hand,
        turned_pro: null, // Not available in this dataset
        tour: tour,
        data_source: 'github'
      };
    }).filter(item => item.name && item.player_id);
  }

  /**
   * Process match charting data
   */
  processMatchChartingData(data) {
    return data.map(row => ({
      match_id: row.match_id,
      tournament: row.Tournament,
      date: row.Date,
      surface: row.Surface,
      round: row.Round,
      player1: row['Player 1'],
      player2: row['Player 2'],
      player1_hand: row['Pl 1 hand'],
      player2_hand: row['Pl 2 hand'],
      time: row.Time,
      court: row.Court,
      umpire: row.Umpire,
      best_of: parseInt(row['Best of']) || null,
      final_tb: row['Final TB?'] === '1',
      charted_by: row['Charted by'],
      data_source: 'github_charting'
    })).filter(item => item.match_id);
  }

  /**
   * Process match charting points data
   */
  processMatchChartingPoints(data) {
    return data.map(row => ({
      match_id: row.match_id,
      point_number: parseInt(row.Pt) || null,
      set1_score: row.Set1,
      set2_score: row.Set2,
      game1_score: row.Gm1,
      game2_score: row.Gm2,
      point_score: row.Pts,
      game_number: parseInt(row['Gm#']) || null,
      tiebreak_set: row.TbSet === 'True',
      server: parseInt(row.Svr) || null,
      first_serve: row['1st'],
      second_serve: row['2nd'],
      notes: row.Notes,
      point_winner: parseInt(row.PtWinner) || null,
      data_source: 'github_charting'
    })).filter(item => item.match_id && item.point_number);
  }

  /**
   * Process Grand Slam points data
   */
  processGrandSlamData(data, year, tournament) {
    return data.map(row => ({
      match_id: row.match_id,
      tournament: tournament,
      year: year,
      elapsed_time: row.ElapsedTime,
      set_no: parseInt(row.SetNo) || null,
      p1_games_won: parseInt(row.P1GamesWon) || null,
      p2_games_won: parseInt(row.P2GamesWon) || null,
      set_winner: parseInt(row.SetWinner) || null,
      game_no: parseInt(row.GameNo) || null,
      game_winner: parseInt(row.GameWinner) || null,
      point_number: row.PointNumber,
      point_winner: parseInt(row.PointWinner) || null,
      point_server: parseInt(row.PointServer) || null,
      speed_kmh: parseInt(row.Speed_KMH) || null,
      rally: parseInt(row.Rally) || null,
      p1_score: row.P1Score,
      p2_score: row.P2Score,
      p1_momentum: parseInt(row.P1Momentum) || null,
      p2_momentum: parseInt(row.P2Momentum) || null,
      p1_points_won: parseInt(row.P1PointsWon) || null,
      p2_points_won: parseInt(row.P2PointsWon) || null,
      p1_ace: parseInt(row.P1Ace) || null,
      p2_ace: parseInt(row.P2Ace) || null,
      p1_winner: parseInt(row.P1Winner) || null,
      p2_winner: parseInt(row.P2Winner) || null,
      p1_double_fault: parseInt(row.P1DoubleFault) || null,
      p2_double_fault: parseInt(row.P2DoubleFault) || null,
      p1_unf_err: parseInt(row.P1UnfErr) || null,
      p2_unf_err: parseInt(row.P2UnfErr) || null,
      p1_net_point: parseInt(row.P1NetPoint) || null,
      p2_net_point: parseInt(row.P2NetPoint) || null,
      p1_net_point_won: parseInt(row.P1NetPointWon) || null,
      p2_net_point_won: parseInt(row.P2NetPointWon) || null,
      p1_break_point: parseInt(row.P1BreakPoint) || null,
      p2_break_point: parseInt(row.P2BreakPoint) || null,
      p1_break_point_won: parseInt(row.P1BreakPointWon) || null,
      p2_break_point_won: parseInt(row.P2BreakPointWon) || null,
      p1_first_srv_in: parseInt(row.P1FirstSrvIn) || null,
      p2_first_srv_in: parseInt(row.P2FirstSrvIn) || null,
      p1_first_srv_won: parseInt(row.P1FirstSrvWon) || null,
      p2_first_srv_won: parseInt(row.P2FirstSrvWon) || null,
      p1_second_srv_in: parseInt(row.P1SecondSrvIn) || null,
      p2_second_srv_in: parseInt(row.P2SecondSrvIn) || null,
      p1_second_srv_won: parseInt(row.P1SecondSrvWon) || null,
      p2_second_srv_won: parseInt(row.P2SecondSrvWon) || null,
      p1_forced_error: parseInt(row.P1ForcedError) || null,
      p2_forced_error: parseInt(row.P2ForcedError) || null,
      history: row.History,
      speed_mph: parseInt(row.Speed_MPH) || null,
      p1_break_point_missed: parseInt(row.P1BreakPointMissed) || null,
      p2_break_point_missed: parseInt(row.P2BreakPointMissed) || null,
      serve_indicator: row.ServeIndicator,
      serve_direction: row.Serve_Direction,
      winner_fh: row.Winner_FH,
      winner_bh: row.Winner_BH,
      serving_to: row.ServingTo,
      p1_turning_point: parseInt(row.P1TurningPoint) || null,
      p2_turning_point: parseInt(row.P2TurningPoint) || null,
      serve_number: parseInt(row.ServeNumber) || null,
      winner_type: row.WinnerType,
      winner_shot_type: row.WinnerShotType,
      p1_distance_run: parseFloat(row.P1DistanceRun) || null,
      p2_distance_run: parseFloat(row.P2DistanceRun) || null,
      rally_count: parseInt(row.RallyCount) || null,
      serve_width: row.ServeWidth,
      serve_depth: row.ServeDepth,
      return_depth: row.ReturnDepth,
      data_source: 'github_slam'
    })).filter(item => item.match_id && item.point_number);
  }

  /**
   * Process Grand Slam matches data
   */
  processGrandSlamMatches(data, year, tournament) {
    return data.map(row => ({
      match_id: row.match_id,
      tournament: tournament,
      year: year,
      slam: row.slam,
      match_num: parseInt(row.match_num) || null,
      player1: row.player1,
      player2: row.player2,
      status: row.status,
      winner: row.winner,
      event_name: row.event_name,
      round: row.round,
      court_name: row.court_name,
      court_id: row.court_id,
      player1id: row.player1id,
      player2id: row.player2id,
      nation1: row.nation1,
      nation2: row.nation2,
      data_source: 'github_slam'
    })).filter(item => item.match_id);
  }

  /**
   * Resolve player names in rankings data
   */
  async resolvePlayerNames(rankingsData, playersData) {
    const playerMap = new Map();
    playersData.forEach(player => {
      playerMap.set(player.player_id, player.name);
    });

    return rankingsData.map(ranking => ({
      ...ranking,
      player_name: playerMap.get(ranking.player_id) || ranking.player_id
    }));
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
