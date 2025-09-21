const Groq = require('groq-sdk');
const database = require('./database');
const enhancedDataSync = require('./enhancedDataSync');
const dataModels = require('./dataModels');
const historicalDatabase = require('./historicalDatabase');

// Initialize database connection once at startup
let dbInitialized = false;
async function initializeDatabase() {
  if (!dbInitialized) {
    try {
      await database.connect(true);
      dbInitialized = true;
      console.log('🚀 Database initialized for enhanced query processing');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error.message);
    }
  }
}

// Enhanced caching system for frequent queries
class EnhancedQueryCache {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.maxCacheSize = 200; // Increased for more data sources
  }

  generateCacheKey(question, queryType, dataSource) {
    const normalized = question.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return `${queryType}:${dataSource}:${normalized}`;
  }

  get(question, queryType, dataSource = 'combined') {
    const key = this.generateCacheKey(question, queryType, dataSource);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('🎯 Cache HIT for:', question.substring(0, 50) + '...');
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  set(question, queryType, dataSource, data) {
    const key = this.generateCacheKey(question, queryType, dataSource);
    
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
    
    console.log('💾 Cache SET for:', question.substring(0, 50) + '...');
  }

  clear() {
    this.cache.clear();
    console.log('🗑️ Enhanced cache cleared');
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      timeout: this.cacheTimeout
    };
  }
}

// Global cache instance
const enhancedQueryCache = new EnhancedQueryCache();

class EnhancedTennisQueryHandler {
  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
    
    // Enhanced query patterns for hybrid data sources
    this.queryPatterns = {
      // Live data patterns (Sportsradar)
      currentRankings: /(?:current|latest|now|today|rank.*\d+|number.*\d+|who.*rank.*\d+)/i,
      liveMatches: /(?:live|current|ongoing|happening|now|today).*(?:match|game|event)/i,
      
      // Historical data patterns (GitHub)
      historicalRankings: /(?:historical|past|previous|trend|compare|over.*time|ranking.*history)/i,
      matchHistory: /(?:head.*to.*head|h2h|versus|against|record|history|matches)/i,
      careerStats: /(?:career|profile|statistics|stats|performance|analysis)/i,
      tournamentWinners: /(?:who won|winner|champion|championship|title).*(?:us open|wimbledon|french open|australian open|grand slam|tournament|competition)/i,
      
      // Combined data patterns
      playerProfile: /(?:tell me about|information about|who is|profile of).*(?:player|tennis player)/i,
      tournamentAnalysis: /(?:tournament|competition|event).*(?:analysis|performance|statistics)/i,
      
      // Specific data source patterns
      grandSlamData: /(?:grand slam|wimbledon|us open|french open|australian open|roland garros)/i,
      matchCharting: /(?:point.*by.*point|shot.*by.*shot|detailed.*analysis|charting)/i,
      
      // General patterns
      rankingQueries: /(?:ranking|rank|number one|top.*rank|position)/i,
      playerInfo: /(?:player|tennis player|competitor)/i,
      tournamentInfo: /(?:tournament|competition|event)/i
    };
  }

  /**
   * Enhanced query analysis with data source routing
   */
  async analyzeQuery(question) {
    try {
      console.log('🔍 Starting enhanced query analysis...');
      
      const analysis = {
        type: 'general',
        dataSources: [],
        entities: {
          players: [],
          tournaments: [],
          metrics: [],
          timeframe: null,
          surface: null
        },
        confidence: 0.5,
        intent: 'General tennis question',
        needsLiveData: false,
        needsHistoricalData: false,
        needsCombinedData: false
      };

      // Determine data source requirements
      analysis.needsLiveData = this.queryPatterns.currentRankings.test(question) || 
                              this.queryPatterns.liveMatches.test(question) ||
                              this.queryPatterns.rankingQueries.test(question);
      
      analysis.needsHistoricalData = this.queryPatterns.historicalRankings.test(question) ||
                                    this.queryPatterns.matchHistory.test(question) ||
                                    this.queryPatterns.careerStats.test(question) ||
                                    this.queryPatterns.tournamentWinners.test(question) ||
                                    this.queryPatterns.grandSlamData.test(question);
      
      analysis.needsCombinedData = this.queryPatterns.playerProfile.test(question) ||
                                  this.queryPatterns.tournamentAnalysis.test(question);

      // Determine query type
      if (analysis.needsLiveData && !analysis.needsHistoricalData) {
        analysis.type = 'live_data';
        analysis.dataSources = ['sportsradar'];
      } else if (analysis.needsHistoricalData && !analysis.needsLiveData) {
        analysis.type = 'historical_data';
        analysis.dataSources = ['github'];
      } else if (analysis.needsCombinedData || (analysis.needsLiveData && analysis.needsHistoricalData)) {
        analysis.type = 'combined_data';
        analysis.dataSources = ['sportsradar', 'github'];
      } else {
        analysis.type = 'general';
        analysis.dataSources = ['github']; // Default to historical for general queries
      }

      // Extract entities using AI
      const entityAnalysis = await this.extractEntities(question);
      analysis.entities = { ...analysis.entities, ...entityAnalysis.entities };
      analysis.confidence = Math.max(analysis.confidence, entityAnalysis.confidence);
      analysis.intent = entityAnalysis.intent;

      console.log('✅ Enhanced query analysis completed:', analysis);
      return analysis;
      
    } catch (error) {
      console.error('❌ Enhanced query analysis error:', error);
      return {
        type: 'general',
        dataSources: ['github'],
        entities: { players: [], tournaments: [], metrics: [], timeframe: null, surface: null },
        confidence: 0.5,
        intent: 'General tennis question',
        needsLiveData: false,
        needsHistoricalData: true,
        needsCombinedData: false
      };
    }
  }

  /**
   * Extract entities from question using AI
   */
  async extractEntities(question) {
    try {
      const prompt = `
        Analyze this tennis question and extract key entities:
        
        Question: "${question}"
        
        Return ONLY a valid JSON object with this exact structure:
        {
          "entities": {
            "players": ["player names mentioned"],
            "tournaments": ["tournament names mentioned"],
            "metrics": ["statistical metrics mentioned"],
            "timeframe": "time period if mentioned",
            "surface": "court surface if mentioned"
          },
          "confidence": 0.0-1.0,
          "intent": "brief description of what the user wants to know"
        }
        
        Do NOT include any text before or after the JSON. Return ONLY the JSON object.
      `;

      const response = await this.groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are a tennis statistics expert. Extract key entities from tennis questions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const responseText = response.choices[0].message.content.trim();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON from response');
      }
      
    } catch (error) {
      console.error('Entity extraction error:', error);
      return {
        entities: { players: [], tournaments: [], metrics: [], timeframe: null, surface: null },
        confidence: 0.5,
        intent: 'General tennis question'
      };
    }
  }

  /**
   * Main query processing method with smart routing
   */
  async processQuery(question, userId = null) {
    try {
      console.log(`🎾 Processing enhanced query: "${question}"`);
      
      // Initialize database connection
      await initializeDatabase();
      
      // Analyze query to determine data sources and routing
      const analysis = await this.analyzeQuery(question);
      
      // Check cache first
      const cacheKey = analysis.type;
      const cachedResult = enhancedQueryCache.get(question, cacheKey, analysis.dataSources.join('_'));
      if (cachedResult) {
        return {
          ...cachedResult,
          fromCache: true,
          cacheStats: enhancedQueryCache.getStats()
        };
      }
      
      // Route to appropriate data source(s)
      let result;
      if (analysis.dataSources.includes('sportsradar') && analysis.dataSources.includes('github')) {
        result = await this.processCombinedQuery(question, analysis);
      } else if (analysis.dataSources.includes('sportsradar')) {
        result = await this.processLiveDataQuery(question, analysis);
      } else {
        result = await this.processHistoricalDataQuery(question, analysis);
      }
      
      // Cache the result
      enhancedQueryCache.set(question, cacheKey, analysis.dataSources.join('_'), result);
      
      return {
        ...result,
        queryAnalysis: analysis,
        dataSources: analysis.dataSources,
        cacheStats: enhancedQueryCache.getStats()
      };
      
    } catch (error) {
      console.error('❌ Enhanced query processing error:', error);
      
      // Fallback to basic query
      try {
        const fallbackResult = await this.processFallbackQuery(question);
        return {
          ...fallbackResult,
          queryType: 'fallback',
          confidence: 0.3,
          error: error.message
        };
      } catch (fallbackError) {
        return {
          answer: "I'm having trouble processing your tennis question right now. Please try again later.",
          data: null,
          queryType: 'error',
          confidence: 0,
          error: error.message
        };
      }
    }
  }

  /**
   * Process live data queries (Sportsradar)
   */
  async processLiveDataQuery(question, analysis) {
    console.log('⚡ Processing live data query...');
    
    try {
      // Generate SQL query for live data
      const sqlQuery = await this.generateLiveDataSQL(question, analysis);
      
      // Execute query
      const queryResult = await this.executeQuery(sqlQuery);
      
      // Generate answer
      const answer = await this.generateLiveDataAnswer(question, queryResult, analysis);
      
      return {
        answer,
        data: queryResult,
        queryType: 'live_data',
        confidence: analysis.confidence,
        dataSource: 'sportsradar',
        lastUpdated: enhancedDataSync.getSyncStatus().lastLiveSync
      };
      
    } catch (error) {
      console.error('Live data query error:', error);
      throw error;
    }
  }

  /**
   * Process historical data queries (GitHub)
   */
  async processHistoricalDataQuery(question, analysis) {
    console.log('📚 Processing historical data query...');
    
    try {
      // Generate SQL query for historical data
      const sqlQuery = await this.generateHistoricalDataSQL(question, analysis);
      
      // Execute query
      const queryResult = await this.executeQuery(sqlQuery);
      
      // Generate answer
      const answer = await this.generateHistoricalDataAnswer(question, queryResult, analysis);
      
      return {
        answer,
        data: queryResult,
        queryType: 'historical_data',
        confidence: analysis.confidence,
        dataSource: 'github',
        lastUpdated: enhancedDataSync.getSyncStatus().lastHistoricalSync
      };
      
    } catch (error) {
      console.error('Historical data query error:', error);
      throw error;
    }
  }

  /**
   * Process combined data queries (both sources)
   */
  async processCombinedQuery(question, analysis) {
    console.log('🔄 Processing combined data query...');
    
    try {
      // Get data from both sources
      const [liveResult, historicalResult] = await Promise.all([
        this.processLiveDataQuery(question, { ...analysis, dataSources: ['sportsradar'] }),
        this.processHistoricalDataQuery(question, { ...analysis, dataSources: ['github'] })
      ]);
      
      // Combine and analyze results
      const combinedData = this.combineDataSources(liveResult.data, historicalResult.data);
      const combinedAnswer = await this.generateCombinedAnswer(question, combinedData, analysis);
      
      return {
        answer: combinedAnswer,
        data: combinedData,
        queryType: 'combined_data',
        confidence: Math.max(liveResult.confidence, historicalResult.confidence),
        dataSource: 'hybrid',
        liveData: liveResult.data,
        historicalData: historicalResult.data,
        lastUpdated: {
          live: liveResult.lastUpdated,
          historical: historicalResult.lastUpdated
        }
      };
      
    } catch (error) {
      console.error('Combined query error:', error);
      throw error;
    }
  }

  /**
   * Generate SQL query for live data
   */
  async generateLiveDataSQL(question, analysis) {
    // Use existing SQL generation logic but focus on live data
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('rank') || lowerQuestion.includes('ranking')) {
      return this.generateRankingQuery(question, analysis, true);
    }
    
    // Default live data query
    return `
      SELECT p.name, r.ranking, r.points, r.tour, r.ranking_date, r.data_source
      FROM rankings r 
      JOIN players p ON r.player_id = p.id 
      WHERE r.is_current = true 
      AND r.data_source = 'sportsradar'
      ORDER BY r.ranking 
      LIMIT 10
    `;
  }

  /**
   * Generate SQL query for historical data
   */
  async generateHistoricalDataSQL(question, analysis) {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('rank') || lowerQuestion.includes('ranking')) {
      return this.generateRankingQuery(question, analysis, false);
    }
    
    // Handle tournament winner questions
    if (this.queryPatterns.tournamentWinners.test(question) || this.queryPatterns.grandSlamData.test(question)) {
      return this.generateTournamentWinnerQuery(question, analysis);
    }
    
    // Default historical data query
    return `
      SELECT p.name, r.ranking, r.points, r.tour, r.ranking_date, r.data_source
      FROM rankings r 
      JOIN players p ON r.player_id = p.id 
      WHERE r.data_source = 'github'
      ORDER BY r.ranking_date DESC, r.ranking 
      LIMIT 10
    `;
  }

  /**
   * Generate tournament winner query
   */
  generateTournamentWinnerQuery(question, analysis) {
    const lowerQuestion = question.toLowerCase();
    
    // Extract tournament and year from question
    let tournament = '';
    let year = '';
    
    if (lowerQuestion.includes('us open')) {
      tournament = 'US Open';
    } else if (lowerQuestion.includes('wimbledon')) {
      tournament = 'Wimbledon';
    } else if (lowerQuestion.includes('french open') || lowerQuestion.includes('roland garros')) {
      tournament = 'French Open';
    } else if (lowerQuestion.includes('australian open')) {
      tournament = 'Australian Open';
    }
    
    // Extract year
    const yearMatch = question.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      year = yearMatch[1];
    }
    
    // For now, return a query that looks for match results
    // This would need to be enhanced when we have match data in the database
    return `
      SELECT 
        p.name as winner_name,
        t.name as tournament_name,
        t.start_date as tournament_date,
        'Historical data from GitHub' as data_source
      FROM players p
      JOIN tournaments t ON 1=1
      WHERE p.name ILIKE '%${tournament}%' 
      OR t.name ILIKE '%${tournament}%'
      ${year ? `AND EXTRACT(YEAR FROM t.start_date) = ${year}` : ''}
      ORDER BY t.start_date DESC
      LIMIT 5
    `;
  }

  /**
   * Generate ranking query based on question type
   */
  generateRankingQuery(question, analysis, isLive = false) {
    const lowerQuestion = question.toLowerCase();
    const dataSource = isLive ? 'sportsradar' : 'github';
    const currentFilter = isLive ? 'AND r.is_current = true' : '';
    
    // Extract ranking numbers
    const rankingNumbers = question.match(/\b(\d+)\b/g) || [];
    const isNumberOne = /number\s*one|#1|rank\s*1/i.test(question);
    const isTopQuery = /top\s*(\d+)/i.test(question);
    
    if (isNumberOne) {
      return `
        SELECT p.name, r.ranking, r.points, r.tour, r.ranking_date, r.data_source
        FROM rankings r 
        JOIN players p ON r.player_id = p.id 
        WHERE r.ranking = 1 
        AND r.data_source = '${dataSource}'
        ${currentFilter}
        ORDER BY r.ranking_date DESC
        LIMIT 1
      `;
    }
    
    if (isTopQuery) {
      const topNumber = question.match(/top\s*(\d+)/i)?.[1] || 5;
      return `
        SELECT p.name, r.ranking, r.points, r.tour, r.ranking_date, r.data_source
        FROM rankings r 
        JOIN players p ON r.player_id = p.id 
        WHERE r.data_source = '${dataSource}'
        ${currentFilter}
        ORDER BY r.ranking 
        LIMIT ${parseInt(topNumber)}
      `;
    }
    
    if (rankingNumbers.length > 0) {
      const rankings = rankingNumbers.map(num => parseInt(num)).sort((a, b) => a - b);
      return `
        SELECT p.name, r.ranking, r.points, r.tour, r.ranking_date, r.data_source
        FROM rankings r 
        JOIN players p ON r.player_id = p.id 
        WHERE r.ranking IN (${rankings.join(', ')})
        AND r.data_source = '${dataSource}'
        ${currentFilter}
        ORDER BY r.ranking
      `;
    }
    
    // Default ranking query
    return `
      SELECT p.name, r.ranking, r.points, r.tour, r.ranking_date, r.data_source
      FROM rankings r 
      JOIN players p ON r.player_id = p.id 
      WHERE r.data_source = '${dataSource}'
      ${currentFilter}
      ORDER BY r.ranking 
      LIMIT 10
    `;
  }

  /**
   * Execute SQL query
   */
  async executeQuery(sqlQuery) {
    if (!database.pool) {
      await database.connect(false);
    }
    
    try {
      const result = await database.query(sqlQuery);
      return result.rows;
    } catch (error) {
      console.error('SQL execution error:', error);
      throw error;
    }
  }

  /**
   * Generate answer for live data
   */
  async generateLiveDataAnswer(question, data, analysis) {
    if (!data || data.length === 0) {
      return "I don't have current live data to answer that question right now.";
    }

    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('rank') || lowerQuestion.includes('ranking')) {
      return this.generateDirectRankingAnswer(question, data);
    }
    
    // Default live data answer
    return `Based on the latest live data: ${data[0].name} is currently ranked #${data[0].ranking} with ${data[0].points} points.`;
  }

  /**
   * Generate answer for historical data
   */
  async generateHistoricalDataAnswer(question, data, analysis) {
    const lowerQuestion = question.toLowerCase();
    
    // Handle tournament winner questions (even with no data)
    if (this.queryPatterns.tournamentWinners.test(question) || this.queryPatterns.grandSlamData.test(question)) {
      return this.generateTournamentWinnerAnswer(question, data, analysis);
    }

    // Handle head-to-head questions
    if (this.isHeadToHeadQuestion(question)) {
      return await this.generateHeadToHeadAnswer(question);
    }

    // Handle player ranking history questions
    if (this.isPlayerRankingHistoryQuestion(question)) {
      return await this.generatePlayerRankingHistoryAnswer(question);
    }
    
    if (!data || data.length === 0) {
      return "I don't have historical data to answer that question right now.";
    }
    
    if (lowerQuestion.includes('historical') || lowerQuestion.includes('trend')) {
      return `Based on historical data: ${data[0].name} has been ranked as high as #${data[0].ranking} with ${data[0].points} points.`;
    }
    
    // Default historical data answer
    return `Based on historical data: ${data[0].name} was ranked #${data[0].ranking} with ${data[0].points} points.`;
  }

  /**
   * Check if question is about head-to-head records
   */
  isHeadToHeadQuestion(question) {
    const headToHeadPatterns = [
      /head.to.head/i,
      /h2h/i,
      /versus/i,
      /vs\.?/i,
      /against/i,
      /record against/i,
      /matches against/i
    ];
    
    return headToHeadPatterns.some(pattern => pattern.test(question));
  }

  /**
   * Check if question is about player ranking history
   */
  isPlayerRankingHistoryQuestion(question) {
    const rankingHistoryPatterns = [
      /ranking history/i,
      /rankings over time/i,
      /ranking progression/i,
      /ranking evolution/i,
      /career ranking/i,
      /highest ranking/i,
      /lowest ranking/i
    ];
    
    return rankingHistoryPatterns.some(pattern => pattern.test(question));
  }

  /**
   * Generate head-to-head answer
   */
  async generateHeadToHeadAnswer(question) {
    try {
      // Extract player names from question
      const players = this.extractPlayerNames(question);
      if (players.length < 2) {
        return "I need the names of two players to provide a head-to-head record. Please specify both players.";
      }

      const [player1, player2] = players;
      
      // Get head-to-head data from historical database
      const h2hData = await historicalDatabase.getHeadToHead(player1, player2, 'ATP');
      
      if (!h2hData || h2hData.length === 0) {
        return `I don't have head-to-head data between ${player1} and ${player2} in my database. This could be because they haven't played each other or the data isn't available yet.`;
      }

      // Calculate statistics
      const player1Wins = h2hData.filter(match => 
        match.winner_name.toLowerCase().includes(player1.toLowerCase())
      ).length;
      
      const player2Wins = h2hData.filter(match => 
        match.winner_name.toLowerCase().includes(player2.toLowerCase())
      ).length;

      const totalMatches = h2hData.length;
      const recentMatches = h2hData.slice(0, 5); // Last 5 matches

      let answer = `**Head-to-Head: ${player1} vs ${player2}**\n\n`;
      answer += `**Overall Record:** ${player1} ${player1Wins} - ${player2Wins} ${player2}\n`;
      answer += `**Total Matches:** ${totalMatches}\n\n`;

      if (recentMatches.length > 0) {
        answer += `**Recent Matches:**\n`;
        recentMatches.forEach(match => {
          const winner = match.winner_name;
          const loser = match.loser_name;
          const tournament = match.tournament_name;
          const year = match.year;
          const score = match.score;
          
          answer += `• ${year} ${tournament}: ${winner} def. ${loser} ${score}\n`;
        });
      }

      return answer;
    } catch (error) {
      console.error('Error generating head-to-head answer:', error);
      return "I encountered an error while retrieving head-to-head data. Please try again.";
    }
  }

  /**
   * Generate player ranking history answer
   */
  async generatePlayerRankingHistoryAnswer(question) {
    try {
      // Extract player name from question
      const players = this.extractPlayerNames(question);
      if (players.length === 0) {
        return "I need a player name to provide ranking history. Please specify which player you're asking about.";
      }

      const playerName = players[0];
      
      // Get ranking history from historical database
      const rankingHistory = await historicalDatabase.getPlayerHistoricalRankings(playerName, 'ATP', 50);
      
      if (!rankingHistory || rankingHistory.length === 0) {
        return `I don't have ranking history data for ${playerName} in my database. This could be because the player data isn't available yet.`;
      }

      // Calculate statistics
      const highestRanking = Math.min(...rankingHistory.map(r => r.ranking));
      const lowestRanking = Math.max(...rankingHistory.map(r => r.ranking));
      const currentRanking = rankingHistory[0].ranking;
      const currentPoints = rankingHistory[0].points;

      let answer = `**Ranking History: ${playerName}**\n\n`;
      answer += `**Current Ranking:** #${currentRanking} (${currentPoints} points)\n`;
      answer += `**Career High:** #${highestRanking}\n`;
      answer += `**Career Low:** #${lowestRanking}\n\n`;

      answer += `**Recent Rankings:**\n`;
      rankingHistory.slice(0, 10).forEach(ranking => {
        const date = new Date(ranking.ranking_date).toLocaleDateString();
        answer += `• ${date}: #${ranking.ranking} (${ranking.points} points)\n`;
      });

      return answer;
    } catch (error) {
      console.error('Error generating ranking history answer:', error);
      return "I encountered an error while retrieving ranking history. Please try again.";
    }
  }

  /**
   * Extract player names from question
   */
  extractPlayerNames(question) {
    // This is a simple extraction - in a real system, you'd use NLP
    const commonPlayers = [
      'Djokovic', 'Nadal', 'Federer', 'Murray', 'Tsitsipas', 'Zverev', 'Medvedev',
      'Sinner', 'Alcaraz', 'Rublev', 'Ruud', 'Hurkacz', 'Fritz', 'Tiafoe',
      'Swiatek', 'Sabalenka', 'Gauff', 'Pegula', 'Jabeur', 'Krejcikova', 'Garcia'
    ];

    const foundPlayers = [];
    for (const player of commonPlayers) {
      if (question.toLowerCase().includes(player.toLowerCase())) {
        foundPlayers.push(player);
      }
    }

    return foundPlayers;
  }

  /**
   * Generate tournament winner answer
   */
  generateTournamentWinnerAnswer(question, data, analysis) {
    const lowerQuestion = question.toLowerCase();
    
    // Extract tournament and year from question
    let tournament = '';
    let year = '';
    
    if (lowerQuestion.includes('us open')) {
      tournament = 'US Open';
    } else if (lowerQuestion.includes('wimbledon')) {
      tournament = 'Wimbledon';
    } else if (lowerQuestion.includes('french open') || lowerQuestion.includes('roland garros')) {
      tournament = 'French Open';
    } else if (lowerQuestion.includes('australian open')) {
      tournament = 'Australian Open';
    }
    
    // Extract year
    const yearMatch = question.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      year = yearMatch[1];
    }
    
    // Provide known tournament winners for recent years
    const knownWinners = {
      'US Open': {
        '2022': { winner: 'Carlos Alcaraz', runnerUp: 'Casper Ruud', score: '6-4, 2-6, 7-6(1), 6-3' },
        '2023': { winner: 'Novak Djokovic', runnerUp: 'Daniil Medvedev', score: '6-3, 7-6(5), 6-3' }
      },
      'Wimbledon': {
        '2022': { winner: 'Novak Djokovic', runnerUp: 'Nick Kyrgios', score: '4-6, 6-3, 6-4, 7-6(3)' },
        '2023': { winner: 'Carlos Alcaraz', runnerUp: 'Novak Djokovic', score: '1-6, 7-6(6), 6-1, 3-6, 6-4' }
      },
      'French Open': {
        '2022': { winner: 'Rafael Nadal', runnerUp: 'Casper Ruud', score: '6-3, 6-3, 6-0' },
        '2023': { winner: 'Novak Djokovic', runnerUp: 'Casper Ruud', score: '7-6(1), 6-3, 7-5' }
      },
      'Australian Open': {
        '2022': { winner: 'Rafael Nadal', runnerUp: 'Daniil Medvedev', score: '2-6, 6-7(5), 6-4, 6-4, 7-5' },
        '2023': { winner: 'Novak Djokovic', runnerUp: 'Stefanos Tsitsipas', score: '6-3, 7-6(4), 7-6(5)' }
      }
    };
    
    // Check if we have the specific tournament and year
    if (tournament && year && knownWinners[tournament] && knownWinners[tournament][year]) {
      const winnerInfo = knownWinners[tournament][year];
      return `${winnerInfo.winner} won the ${tournament} ${year} men's singles title, defeating ${winnerInfo.runnerUp} in the final with a score of ${winnerInfo.score}.`;
    }
    
    // For now, provide a helpful response about the data limitation
    // This would be enhanced when we have actual match data
    if (data && data.length > 0) {
      return `Based on available data, I found information about ${tournament} ${year || 'tournament'}. However, I need to enhance the match results data to provide specific winner information. The GitHub repositories contain comprehensive match data that I'm working to integrate.`;
    } else {
      return `I'm working on integrating comprehensive tournament data from GitHub repositories to answer questions like "Who won ${tournament} ${year || 'tournament'}?" The data includes detailed match results, but I need to complete the integration to provide specific winner information.`;
    }
  }

  /**
   * Generate combined answer
   */
  async generateCombinedAnswer(question, data, analysis) {
    if (!data || data.length === 0) {
      return "I don't have enough data to provide a comprehensive answer right now.";
    }

    return `Based on both current and historical data: ${data[0].name} is currently performing well with a ranking of #${data[0].ranking}.`;
  }

  /**
   * Combine data from multiple sources
   */
  combineDataSources(liveData, historicalData) {
    // Simple combination logic - in practice, this would be more sophisticated
    const combined = [...(liveData || []), ...(historicalData || [])];
    
    // Remove duplicates based on player name and ranking
    const unique = combined.filter((item, index, self) => 
      index === self.findIndex(t => t.name === item.name && t.ranking === item.ranking)
    );
    
    return unique;
  }

  /**
   * Generate direct ranking answer
   */
  generateDirectRankingAnswer(question, data) {
    if (!data || data.length === 0) {
      return "No ranking data available.";
    }

    const lowerQuestion = question.toLowerCase();
    const player = data[0];

    if (lowerQuestion.includes('rank 1') || lowerQuestion.includes('number 1') || lowerQuestion.includes('#1')) {
      return `${player.name} is ranked #${player.ranking} with ${player.points ? player.points.toLocaleString() : 'N/A'} points.`;
    }

    if (data.length > 1) {
      const topNumber = lowerQuestion.match(/top\s*(\d+)/)?.[1] || data.length;
      const players = data.slice(0, parseInt(topNumber)).map(p => 
        `${p.name} (#${p.ranking}, ${p.points ? p.points.toLocaleString() : 'N/A'} points)`
      ).join(', ');
      return `Top ${Math.min(parseInt(topNumber), data.length)}: ${players}.`;
    }

    return `${player.name} is ranked #${player.ranking} with ${player.points ? player.points.toLocaleString() : 'N/A'} points.`;
  }

  /**
   * Process fallback query
   */
  async processFallbackQuery(question) {
    console.log('🔄 Processing fallback query...');
    
    try {
      // Simple fallback query
      const result = await database.query(`
        SELECT p.name, r.ranking, r.points, r.tour, r.data_source
        FROM rankings r 
        JOIN players p ON r.player_id = p.id 
        ORDER BY r.ranking 
        LIMIT 5
      `);
      
      return {
        answer: `Here are some tennis rankings: ${result.rows.map(p => `${p.name} (#${p.ranking})`).join(', ')}.`,
        data: result.rows,
        queryType: 'fallback',
        confidence: 0.5,
        dataSource: 'database'
      };
    } catch (error) {
      return {
        answer: "I'm having trouble accessing tennis data right now. Please try again later.",
        data: null,
        queryType: 'fallback',
        confidence: 0.3,
        dataSource: 'none'
      };
    }
  }

  /**
   * Get query handler statistics
   */
  getStats() {
    return {
      cache: enhancedQueryCache.getStats(),
      sync: enhancedDataSync.getSyncStatus(),
      models: dataModels.getAvailableModels()
    };
  }
}

module.exports = new EnhancedTennisQueryHandler();
