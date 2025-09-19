const Groq = require('groq-sdk');
const database = require('./database');
const dataSync = require('./dataSync');

class TennisQueryHandler {
  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
    
    // Tennis-specific query patterns and responses - Enhanced with XSD data
    this.queryPatterns = {
      playerStats: /(?:who|which player|what player).*(?:most|highest|best|top).*(?:aces|wins|titles|rankings?|points?)/i,
      headToHead: /(?:head.?to.?head|record|against|vs|versus).*(?:djokovic|nadal|federer|murray|serena|venus|sharapova)/i,
      tournamentRecords: /(?:wimbledon|us open|french open|australian open|grand slam|masters|atp|wta).*(?:most|winner|champion|title)/i,
      performanceMetrics: /(?:first serve|second serve|break point|ace|double fault|percentage|rate)/i,
      historicalData: /(?:youngest|oldest|first|last|earliest|latest|when|year)/i,
      surfaceAnalysis: /(?:clay|grass|hard court|surface|indoor|outdoor)/i,
      rankingQueries: /(?:ranking|rank|number one|top.*rank|position)/i,
      playerInfo: /(?:tell me about|information about|who is|profile of).*(?:player|tennis player)/i,
      tournamentInfo: /(?:tournament|competition|event).*(?:happening|upcoming|current|schedule)/i,
      countryQueries: /(?:players from|tennis players in|from country|nationality)/i,
      ageQueries: /(?:youngest|oldest|age|born|birth)/i,
      prizeMoney: /(?:prize money|earnings|salary|income|wealthy|richest)/i,
      
      // New patterns based on XSD data structures
      playerProfile: /(?:handedness|playing hand|height|weight|pro year|turned pro|career high|highest ranking)/i,
      competitionInfo: /(?:competition|tournament).*(?:info|details|information|status|surface|prize money|venue)/i,
      seasonData: /(?:season|year).*(?:standings|competitors|summaries|results)/i,
      liveMatches: /(?:live|current|ongoing|happening now|in progress).*(?:match|game|event)/i,
      scheduleQueries: /(?:schedule|upcoming|next|today|tomorrow).*(?:match|game|event|tournament)/i,
      venueQueries: /(?:venue|stadium|court|location|where).*(?:match|tournament|event)/i,
      raceRankings: /(?:race.*ranking|year.*to.*date|ytd|season.*ranking)/i,
      doubleRankings: /(?:doubles|double.*ranking|pair|team).*(?:ranking|rank)/i,
      matchStatistics: /(?:match.*stat|game.*stat|detailed.*stat|serve.*stat|return.*stat)/i,
      timelineQueries: /(?:timeline|events|points|game.*by.*game|set.*by.*set)/i,
      competitorHistory: /(?:match.*history|previous.*matches|past.*results|career.*record)/i,
      versusRecords: /(?:head.*to.*head|h2h|versus|against).*(?:record|history|matches)/i,
      complexQueries: /(?:complex|venue.*complex|stadium.*complex|tennis.*center)/i,
      sportEventQueries: /(?:sport.*event|match.*event|game.*event).*(?:summary|details|info)/i
    };

    // No global timeouts in original demo mode
  }

  async processQuery(question, userId = null) {
    const runCore = async () => {
      try {
      console.log(`Processing query: "${question}"`);
      
      // Check if Groq API key is configured
      console.log('API Key check:', {
        hasKey: !!process.env.GROQ_API_KEY,
        keyValue: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 10) + '...' : 'undefined',
        isPlaceholder: process.env.GROQ_API_KEY === 'your_groq_api_key_here',
        fullKey: process.env.GROQ_API_KEY
      });
      
      if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
        console.log('❌ Groq API key not configured, trying database-only mode');
        console.log('API key value:', process.env.GROQ_API_KEY);
        
        // Try to answer with database data only (no AI)
        const dbResult = await this.queryDatabaseDirectly(question);
        if (dbResult && dbResult.length > 0) {
          return {
            answer: this.generateSimpleAnswer(question, dbResult),
            data: dbResult,
            queryType: 'database_only',
            confidence: 0.7,
            dataSource: dataSync.isSportsradarAvailable() ? 'live' : 'static',
            lastUpdated: dataSync.getSyncStatus().lastSync
          };
        }
        
        // If no database data, use fallback
        return {
          answer: "While I don't have access to the full database in demo mode, this would typically be answered using our AI-powered tennis statistics system. The system can analyze player records, tournament results, head-to-head matchups, and various performance metrics to provide detailed insights.",
          data: null,
          queryType: 'fallback',
          confidence: 0.5,
          dataSource: dataSync.isSportsradarAvailable() ? 'live' : 'static',
          lastUpdated: dataSync.getSyncStatus().lastSync
        };
      }
      
      console.log('API key is configured, proceeding with AI processing');
      
      // Analyze the query to determine intent
      console.log('Starting query analysis...');
      const queryAnalysis = await this.analyzeQuery(question);
      console.log('Query analysis completed:', queryAnalysis);
      
      // Generate SQL query based on analysis
      console.log('Generating SQL query...');
      const sqlQuery = await this.generateSQLQuery(question, queryAnalysis);
      console.log('SQL query generated:', sqlQuery);
      
      // Execute the query
      console.log('Executing database query...');
      let queryResult;
      try {
        queryResult = await this.executeQuery(sqlQuery);
        console.log('Database query result:', queryResult);
      } catch (error) {
        console.log('AI query failed, trying direct database query...');
        queryResult = [];
      }
      
      // If no data from AI query, try direct database query
      if (!queryResult || queryResult.length === 0) {
        console.log('No data from AI query, trying direct database query...');
        const fallbackData = await this.queryDatabaseDirectly(question);
        if (fallbackData && fallbackData.length > 0) {
          console.log('Found data via direct query, generating simple answer...');
          const simpleAnswer = this.generateSimpleAnswer(question, fallbackData);
          return {
            answer: simpleAnswer,
            data: fallbackData,
            queryType: queryAnalysis.type,
            confidence: 0.8, // Lower confidence for fallback
            dataSource: dataSync.isSportsradarAvailable() ? 'live' : 'static',
            lastUpdated: dataSync.getSyncStatus().lastSync
          };
        } else {
          // No data from direct query either, generate appropriate response
          console.log('No data from direct query either, generating appropriate response...');
          const simpleAnswer = this.generateSimpleAnswer(question, []);
          return {
            answer: simpleAnswer,
            data: [],
            queryType: queryAnalysis.type,
            confidence: 0.5, // Lower confidence for no data
            dataSource: dataSync.isSportsradarAvailable() ? 'live' : 'static',
            lastUpdated: dataSync.getSyncStatus().lastSync
          };
        }
      }
      
      // Generate natural language response
      console.log('Generating AI answer...');
      const answer = await this.generateAnswer(question, queryResult, queryAnalysis);
      console.log('AI answer generated:', answer);
      
      return {
        answer,
        data: queryResult,
        queryType: queryAnalysis.type,
        confidence: queryAnalysis.confidence,
        dataSource: dataSync.isSportsradarAvailable() ? 'live' : 'static',
        lastUpdated: dataSync.getSyncStatus().lastSync
      };
      
    } catch (error) {
      console.error('Query processing error:', error);
      
      // Try direct database query as fallback
      console.log('AI processing failed, trying direct database query...');
      try {
        const fallbackData = await this.queryDatabaseDirectly(question);
        if (fallbackData && fallbackData.length > 0) {
          console.log('Found data via direct query fallback');
          return {
            answer: this.generateSimpleAnswer(question, fallbackData),
            data: fallbackData,
            queryType: 'database_fallback',
            confidence: 0.6,
            dataSource: dataSync.isSportsradarAvailable() ? 'live' : 'static',
            lastUpdated: dataSync.getSyncStatus().lastSync
          };
        }
      } catch (fallbackError) {
        console.error('Direct database query fallback also failed:', fallbackError);
      }
      
      // Final fallback response with better error handling
      return {
        answer: this.generateFallbackAnswer(question, []),
        data: null,
        queryType: 'error',
        confidence: 0,
        dataSource: dataSync.isSportsradarAvailable() ? 'live' : 'static',
        lastUpdated: dataSync.getSyncStatus().lastSync,
        error: error.message
      };
    }
    };

    return runCore();
  }


  async analyzeQuery(question) {
    try {
      console.log('Starting analyzeQuery with question:', question);
      const prompt = `
        Analyze this tennis-related question and determine the query type and key entities:
        
        Question: "${question}"
        
        Return ONLY a valid JSON object with this exact structure:
        {
          "type": "playerStats|headToHead|tournamentRecords|performanceMetrics|historicalData|surfaceAnalysis|rankingQueries|general",
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
        Focus on tennis-specific entities and be precise about what data is being requested.
      `;

      const response = await this.groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are a tennis statistics expert. Analyze tennis questions and extract key information for database queries."
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
      console.log('Raw AI response:', responseText);
      
      // Try to extract JSON from the response
      let analysis;
      try {
        analysis = JSON.parse(responseText);
      } catch (parseError) {
        console.log('JSON parse failed, trying to extract JSON from response...');
        // Try to find JSON in the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error(`Could not parse JSON from response: ${responseText.substring(0, 100)}...`);
        }
      }
      
      // Validate and enhance analysis with pattern matching
      for (const [type, pattern] of Object.entries(this.queryPatterns)) {
        if (pattern.test(question)) {
          analysis.type = type;
          analysis.confidence = Math.max(analysis.confidence, 0.8);
          break;
        }
      }

      return analysis;
      
    } catch (error) {
      console.error('Query analysis error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code
      });
      
      // Fallback analysis
      return {
        type: 'general',
        entities: {
          players: [],
          tournaments: [],
          metrics: [],
          timeframe: null,
          surface: null
        },
        confidence: 0.5,
        intent: 'General tennis question'
      };
    }
  }

  generateRankingQueryTemplate(question, analysis) {
    // Extract ranking numbers from the question
    const rankingNumbers = question.match(/\b(\d+)\b/g) || [];
    const hasMultipleRankings = rankingNumbers.length > 1;
    const hasSpecificRanking = rankingNumbers.length === 1;
    const isTopRanking = /top\s*(\d+)/i.test(question);
    const isNumberOne = /number\s*one|#1|rank\s*1/i.test(question);
    
    if (isNumberOne) {
      return `SELECT p.name, r.ranking, r.points, r.ranking_date 
              FROM rankings r 
              JOIN players p ON r.player_id = p.id 
              WHERE r.ranking = 1 
              AND r.ranking_date = (SELECT MAX(ranking_date) FROM rankings) 
              LIMIT 1`;
    }
    
    if (isTopRanking) {
      const topNumber = question.match(/top\s*(\d+)/i)?.[1] || 5;
      return `SELECT p.name, r.ranking, r.points, r.ranking_date 
              FROM rankings r 
              JOIN players p ON r.player_id = p.id 
              WHERE r.ranking_date = (SELECT MAX(ranking_date) FROM rankings) 
              ORDER BY r.ranking 
              LIMIT ${topNumber}`;
    }
    
    if (hasMultipleRankings) {
      const rankings = rankingNumbers.map(num => parseInt(num)).sort((a, b) => a - b);
      return `SELECT p.name, r.ranking, r.points, r.ranking_date 
              FROM rankings r 
              JOIN players p ON r.player_id = p.id 
              WHERE r.ranking IN (${rankings.join(', ')}) 
              AND r.ranking_date = (SELECT MAX(ranking_date) FROM rankings) 
              ORDER BY r.ranking`;
    }
    
    if (hasSpecificRanking) {
      const ranking = parseInt(rankingNumbers[0]);
      return `SELECT p.name, r.ranking, r.points, r.ranking_date 
              FROM rankings r 
              JOIN players p ON r.player_id = p.id 
              WHERE r.ranking = ${ranking} 
              AND r.ranking_date = (SELECT MAX(ranking_date) FROM rankings) 
              LIMIT 1`;
    }
    
    return null; // No template match
  }

  async generateSQLQuery(question, analysis) {
    try {
      // Check if this is a ranking query and use template if available
      if (analysis.type === 'rankingQueries') {
        const templateQuery = this.generateRankingQueryTemplate(question, analysis);
        if (templateQuery) {
          console.log('Using ranking query template:', templateQuery);
          return templateQuery;
        }
      }
      
      const prompt = `
        Generate a PostgreSQL query for this tennis question:
        
        Question: "${question}"
        Analysis: ${JSON.stringify(analysis)}
        
        Available tables:
        - players (id, name, country, birth_date, height, weight, playing_hand, turned_pro, current_ranking, career_prize_money, tour)
        - tournaments (id, name, type, surface, level, location, start_date, end_date, prize_money, status, current_round)
        - matches (id, tournament_id, player1_id, player2_id, winner_id, score, duration, match_date, round, surface, status)
        - match_stats (id, match_id, player_id, aces, double_faults, first_serve_percentage, first_serve_points_won, second_serve_points_won, break_points_saved, break_points_converted, total_points_won)
        - rankings (id, player_id, ranking, points, ranking_date, tour)
        
        IMPORTANT: Use exact column names as shown above. Do NOT use 'turneds_pro' - use 'turned_pro'.
        
        RANKING QUERY EXAMPLES:
        - For "who is number 1": SELECT p.name, r.ranking, r.points FROM rankings r JOIN players p ON r.player_id = p.id WHERE r.ranking = 1 AND r.ranking_date = (SELECT MAX(ranking_date) FROM rankings) LIMIT 1
        - For "who are number 2 and 4": SELECT p.name, r.ranking, r.points FROM rankings r JOIN players p ON r.player_id = p.id WHERE r.ranking IN (2, 4) AND r.ranking_date = (SELECT MAX(ranking_date) FROM rankings) ORDER BY r.ranking
        - For "current top 5": SELECT p.name, r.ranking, r.points FROM rankings r JOIN players p ON r.player_id = p.id WHERE r.ranking_date = (SELECT MAX(ranking_date) FROM rankings) ORDER BY r.ranking LIMIT 5
        - For "who is ranked higher": Use subqueries to compare rankings
        
        CRITICAL RANKING RULES:
        1. ALWAYS use the most recent ranking_date: WHERE r.ranking_date = (SELECT MAX(ranking_date) FROM rankings)
        2. For specific rankings (like "number 2"): WHERE r.ranking = 2
        3. For multiple rankings (like "2 and 4"): WHERE r.ranking IN (2, 4)
        4. NEVER use JOINs between players for ranking queries - use single table with WHERE clauses
        5. ALWAYS JOIN rankings with players: FROM rankings r JOIN players p ON r.player_id = p.id
        
        Return ONLY the SQL query, no explanations, no markdown formatting, no code blocks.
        Use proper JOINs and aggregations as needed.
        If the question asks for "most" or "highest", use ORDER BY and LIMIT.
        If asking about specific players, use WHERE clauses with player names.
        For Grand Slam titles, count matches won in Grand Slam tournaments (type = 'Grand Slam').
        For tournament wins, join players with matches where player is the winner.
        Do NOT wrap the query in backticks or any other formatting.
      `;

      const response = await this.groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are a SQL expert specializing in tennis statistics. Generate accurate PostgreSQL queries."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      return response.choices[0].message.content.trim();
      
    } catch (error) {
      console.error('SQL generation error:', error);
      
      // Fallback to a simple query
      return `
        SELECT p.name, p.country, p.current_ranking 
        FROM players p 
        WHERE p.name ILIKE '%${this.extractPlayerName(question)}%' 
        LIMIT 5;
      `;
    }
  }

  validateSQLQuery(sqlQuery) {
    try {
      // Clean the SQL query first
      let cleanSQL = sqlQuery.trim();
      
      // Remove markdown code blocks
      if (cleanSQL.startsWith('```sql')) {
        cleanSQL = cleanSQL.replace(/^```sql\s*/, '').replace(/\s*```$/, '');
      }
      if (cleanSQL.startsWith('```')) {
        cleanSQL = cleanSQL.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Basic SQL validation rules
      const validationRules = [
        {
          name: 'Must start with SELECT',
          test: () => cleanSQL.toUpperCase().startsWith('SELECT'),
          error: 'Query must start with SELECT'
        },
        {
          name: 'No dangerous keywords',
          test: () => {
            const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE'];
            const upperSQL = cleanSQL.toUpperCase();
            return !dangerousKeywords.some(keyword => upperSQL.includes(keyword));
          },
          error: 'Query contains dangerous keywords (DROP, DELETE, UPDATE, etc.)'
        },
        {
          name: 'Must have FROM clause',
          test: () => cleanSQL.toUpperCase().includes('FROM'),
          error: 'Query must contain FROM clause'
        },
        {
          name: 'No semicolon injection',
          test: () => {
            const semicolonCount = (cleanSQL.match(/;/g) || []).length;
            return semicolonCount <= 1; // Allow one semicolon at the end
          },
          error: 'Query contains multiple semicolons (potential injection)'
        },
        {
          name: 'Valid table references',
          test: () => {
            const validTables = ['players', 'rankings', 'tournaments', 'matches', 'match_stats'];
            const upperSQL = cleanSQL.toUpperCase();
            // Check if query references only valid tables
            const tableMatches = upperSQL.match(/FROM\s+(\w+)/g) || [];
            return tableMatches.every(match => {
              const tableName = match.replace(/FROM\s+/i, '').toLowerCase();
              return validTables.includes(tableName);
            });
          },
          error: 'Query references invalid tables'
        },
        {
          name: 'No suspicious patterns',
          test: () => {
            const suspiciousPatterns = [
              /--/,  // SQL comments
              /\/\*.*\*\//,  // Block comments
              /UNION/i,  // UNION attacks
              /OR\s+1\s*=\s*1/i,  // SQL injection patterns
              /AND\s+1\s*=\s*1/i
            ];
            return !suspiciousPatterns.some(pattern => pattern.test(cleanSQL));
          },
          error: 'Query contains suspicious patterns'
        }
      ];
      
      // Run all validation rules
      for (const rule of validationRules) {
        if (!rule.test()) {
          console.log(`❌ SQL Validation Failed: ${rule.name} - ${rule.error}`);
          return {
            isValid: false,
            error: rule.error,
            cleanSQL: cleanSQL
          };
        }
      }
      
      console.log('✅ SQL Query validation passed');
      return {
        isValid: true,
        cleanSQL: cleanSQL
      };
      
    } catch (error) {
      console.error('SQL validation error:', error);
      return {
        isValid: false,
        error: 'SQL validation failed due to parsing error',
        cleanSQL: sqlQuery
      };
    }
  }

  async executeQuery(sqlQuery) {
    // Validate SQL query before execution
    const validation = this.validateSQLQuery(sqlQuery);
    if (!validation.isValid) {
      throw new Error(`Invalid SQL query: ${validation.error}`);
    }
    
    // Use the cleaned SQL (already validated and cleaned)
    sqlQuery = validation.cleanSQL;
    
    // Ensure database is connected
    if (!database.pool) {
      console.log('🔄 Connecting to database...');
      await database.connect();
    }
    
    // Add query timeout and optimization hints
    const startTime = Date.now();
    console.log('Executing SQL:', sqlQuery);
    
    try {
      const result = await database.query(sqlQuery);
      const endTime = Date.now();
      console.log(`SQL query completed in ${endTime - startTime}ms, returned ${result.rows.length} rows`);
      return result.rows;
    } catch (error) {
      const endTime = Date.now();
      console.error(`SQL query failed after ${endTime - startTime}ms:`, error.message);
      throw error;
    }
  }

  async generateAnswer(question, data, analysis) {
    try {
      if (!data || data.length === 0) {
        // Try to get some basic data from database
        console.log('No data from AI query, trying direct database query...');
        const fallbackData = await this.queryDatabaseDirectly(question);
        if (fallbackData && fallbackData.length > 0) {
          console.log('Found data via direct query, generating simple answer...');
          return this.generateSimpleAnswer(question, fallbackData);
        }
        return "I don't have enough data to answer that question right now. The database might be empty or the query didn't match any records.";
      }

      const prompt = `
        Generate a natural, conversational answer to this tennis question based on the data:
        
        Question: "${question}"
        Data: ${JSON.stringify(data)}
        Analysis: ${JSON.stringify(analysis)}
        
        Requirements:
        - Be conversational and engaging
        - Include specific numbers and statistics from the data
        - Mention player names, tournaments, or other relevant details
        - Keep it concise but informative
        - If showing multiple results, format them clearly
        - Use tennis terminology appropriately
        
        Don't include phrases like "Based on the data" or "According to the results" - just give the answer directly.
      `;

      const response = await this.groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are a knowledgeable tennis commentator providing statistical insights. Give clear, engaging answers about tennis statistics."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0].message.content;
      
    } catch (error) {
      console.error('Answer generation error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code
      });
      
      // Fallback answer
      return this.generateFallbackAnswer(question, data);
    }
  }

  generateFallbackAnswer(question, data) {
    if (!data || data.length === 0) {
      const lowerQuestion = question.toLowerCase();
      
      // Provide specific error messages based on query type
      if (lowerQuestion.includes('tournament') || lowerQuestion.includes('won') || lowerQuestion.includes('winner')) {
        return "I don't have access to tournament results or match outcomes in the current data. I can only provide current player rankings and basic player information. For tournament results, you would need access to our full match database.";
      }
      
      if (lowerQuestion.includes('match') || lowerQuestion.includes('head to head') || lowerQuestion.includes('vs')) {
        return "I don't have access to match results or head-to-head records in the current data. I can only provide current player rankings and basic player information. For match statistics, you would need access to our full match database.";
      }
      
      if (lowerQuestion.includes('statistics') || lowerQuestion.includes('stats') || lowerQuestion.includes('performance')) {
        return "I don't have access to detailed player statistics in the current data. I can only provide current player rankings and basic player information. For detailed statistics, you would need access to our full match database.";
      }
      
      return "I don't have enough data to answer that question right now. I can only provide current player rankings and basic player information. For more detailed tennis data, you would need access to our full database.";
    }

    // Try to provide a more intelligent answer based on the question
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('most') || lowerQuestion.includes('highest') || lowerQuestion.includes('best')) {
      if (data.length > 0) {
        const topPlayer = data[0];
        return `Based on the available data, ${topPlayer.name || 'the top player'} appears to be leading in this category. However, I have limited data access, so this may not be the complete picture.`;
      }
    }
    
    if (lowerQuestion.includes('who') && data.length > 0) {
      const player = data[0];
      return `Based on the available data, ${player.name || 'the player you asked about'} is the answer. However, I have limited data access, so this may not be the complete picture.`;
    }
    
    if (lowerQuestion.includes('record') || lowerQuestion.includes('against')) {
      return "I don't have access to head-to-head records or match statistics in the current data. I can only provide current player rankings and basic player information.";
    }
    
    // Default fallback with more helpful message
    return "I can provide some basic tennis information, but I don't have access to the full database. I can only provide current player rankings and basic player information. For more detailed tennis data, you would need access to our full database.";
  }

  getSampleData() {
    return [
      {
        name: "Novak Djokovic",
        country: "SRB",
        current_ranking: 1,
        aces: 1250,
        titles: 24
      },
      {
        name: "Rafael Nadal",
        country: "ESP", 
        current_ranking: 2,
        aces: 980,
        titles: 22
      }
    ];
  }

  extractPlayerName(question) {
    const players = ['djokovic', 'nadal', 'federer', 'murray', 'serena', 'venus', 'sharapova'];
    const lowerQuestion = question.toLowerCase();
    
    for (const player of players) {
      if (lowerQuestion.includes(player)) {
        return player;
      }
    }
    
    return '';
  }

  /**
   * Enhanced fallback query processing with better pattern matching and error handling
   */
  async queryDatabaseDirectly(question) {
    try {
      console.log('🔄 Using enhanced fallback query processing...');
      
      // Ensure database is connected
      if (!database.pool) {
        console.log('🔄 Connecting to database...');
        await database.connect();
      }
      
      const lowerQuestion = question.toLowerCase();
      
      // Enhanced pattern matching with priority order
      const queryPatterns = [
        {
          name: 'ranking_queries',
          patterns: [/ranking|rank|number\s*\d+|top\s*\d+|#\d+/i],
          handler: () => this.handleRankingQueries(lowerQuestion)
        },
        {
          name: 'player_queries',
          patterns: [/jannik|sinner|alcaraz|carlos|djokovic|novak|nadal|federer|murray/i],
          handler: () => this.handlePlayerQueries(lowerQuestion)
        },
        {
          name: 'tournament_queries',
          patterns: [/tournament|competition|grand slam|wimbledon|us open|french open|australian open/i],
          handler: () => this.handleTournamentQueries(lowerQuestion)
        },
        {
          name: 'venue_queries',
          patterns: [/venue|stadium|court|location|where/i],
          handler: () => this.handleVenueQueries(lowerQuestion)
        },
        {
          name: 'live_queries',
          patterns: [/live|current|ongoing|happening|now|today/i],
          handler: () => this.handleLiveQueries(lowerQuestion)
        },
        {
          name: 'country_queries',
          patterns: [/from|country|nationality|spanish|italian|serbian|american/i],
          handler: () => this.handleCountryQueries(lowerQuestion)
        },
        {
          name: 'general_queries',
          patterns: [/.*/], // Catch-all pattern
          handler: () => this.handleGeneralQueries(lowerQuestion)
        }
      ];
      
      // Try each pattern in order
      for (const pattern of queryPatterns) {
        if (pattern.patterns.some(p => p.test(question))) {
          console.log(`🎯 Matched pattern: ${pattern.name}`);
          const result = await pattern.handler();
          if (result && result.length > 0) {
            return result;
          }
        }
      }
      
      // If no patterns matched or returned data, return empty
      return [];
      
    } catch (error) {
      console.error('❌ Enhanced fallback query failed:', error.message);
      return [];
    }
  }

  /**
   * Handle ranking-related queries with enhanced logic
   */
  async handleRankingQueries(lowerQuestion) {
    try {
      // Extract ranking numbers from question
      const rankingNumbers = lowerQuestion.match(/\b(\d+)\b/g) || [];
      const isTopQuery = /top\s*(\d+)/i.test(lowerQuestion);
      const isNumberOne = /number\s*one|#1|rank\s*1/i.test(lowerQuestion);
      
      if (isNumberOne) {
        const result = await database.query(`
          SELECT p.name, r.ranking, r.points, r.ranking_date, p.country
          FROM rankings r 
          JOIN players p ON r.player_id = p.id 
          WHERE r.ranking = 1 
          AND r.ranking_date = (SELECT MAX(ranking_date) FROM rankings) 
          LIMIT 1
        `);
        return result.rows;
      }
      
      if (isTopQuery) {
        const topNumber = lowerQuestion.match(/top\s*(\d+)/i)?.[1] || 5;
        const result = await database.query(`
          SELECT p.name, r.ranking, r.points, r.ranking_date, p.country
          FROM rankings r 
          JOIN players p ON r.player_id = p.id 
          WHERE r.ranking_date = (SELECT MAX(ranking_date) FROM rankings) 
          ORDER BY r.ranking 
          LIMIT ${parseInt(topNumber)}
        `);
        return result.rows;
      }
      
      if (rankingNumbers.length > 0) {
        const rankings = rankingNumbers.map(num => parseInt(num)).sort((a, b) => a - b);
        const result = await database.query(`
          SELECT p.name, r.ranking, r.points, r.ranking_date, p.country
          FROM rankings r 
          JOIN players p ON r.player_id = p.id 
          WHERE r.ranking IN (${rankings.join(', ')}) 
          AND r.ranking_date = (SELECT MAX(ranking_date) FROM rankings) 
          ORDER BY r.ranking
        `);
        return result.rows;
      }
      
      // General ranking query
      const result = await database.query(`
        SELECT p.name, r.ranking, r.points, r.ranking_date, p.country
        FROM rankings r 
        JOIN players p ON r.player_id = p.id 
        WHERE r.ranking_date = (SELECT MAX(ranking_date) FROM rankings) 
        ORDER BY r.ranking 
        LIMIT 10
      `);
      return result.rows;
      
    } catch (error) {
      console.error('Ranking query error:', error.message);
      return [];
    }
  }

  /**
   * Handle player-specific queries with enhanced data
   */
  async handlePlayerQueries(lowerQuestion) {
    try {
      // Extract player name from question
      const playerNames = ['jannik', 'sinner', 'alcaraz', 'carlos', 'djokovic', 'novak', 'nadal', 'federer', 'murray'];
      const matchedPlayer = playerNames.find(name => lowerQuestion.includes(name));
      
      if (matchedPlayer) {
        let searchPattern = '';
        switch (matchedPlayer) {
          case 'jannik':
          case 'sinner':
            searchPattern = '%sinner%';
            break;
          case 'alcaraz':
          case 'carlos':
            searchPattern = '%alcaraz%';
            break;
          case 'djokovic':
          case 'novak':
            searchPattern = '%djokovic%';
            break;
          case 'nadal':
            searchPattern = '%nadal%';
            break;
          case 'federer':
            searchPattern = '%federer%';
            break;
          case 'murray':
            searchPattern = '%murray%';
            break;
        }
        
        const result = await database.query(`
          SELECT p.name, p.country, p.country_code, p.current_ranking, p.tour, p.birth_date, 
                 p.height, p.weight, p.playing_hand, p.handedness, p.turned_pro, p.pro_year, 
                 p.career_prize_money, p.highest_singles_ranking, p.highest_singles_ranking_date, 
                 p.gender, p.abbreviation, p.nationality,
                 r.ranking, r.points, r.ranking_date
          FROM players p
          LEFT JOIN rankings r ON p.id = r.player_id 
            AND r.ranking_date = (SELECT MAX(ranking_date) FROM rankings)
          WHERE p.name ILIKE $1
          AND p.tour = 'ATP'
          ORDER BY p.current_ranking ASC
          LIMIT 1
        `, [searchPattern]);
        return result.rows;
      }
      
      return [];
    } catch (error) {
      console.error('Player query error:', error.message);
      return [];
    }
  }

  /**
   * Handle tournament and competition queries
   */
  async handleTournamentQueries(lowerQuestion) {
    try {
      // For now, return empty as we don't have tournament results
      // This could be enhanced when tournament data is available
      return [];
    } catch (error) {
      console.error('Tournament query error:', error.message);
      return [];
    }
  }

  /**
   * Handle venue and location queries
   */
  async handleVenueQueries(lowerQuestion) {
    try {
      const result = await database.query(`
        SELECT name, city_name, country_name, country_code, capacity, timezone
        FROM venues
        ORDER BY name
        LIMIT 10
      `);
      return result.rows;
    } catch (error) {
      console.error('Venue query error:', error.message);
      return [];
    }
  }

  /**
   * Handle live and current event queries
   */
  async handleLiveQueries(lowerQuestion) {
    try {
      const result = await database.query(`
        SELECT se.id, se.start_time, ses.status, ses.match_status, ses.home_score, ses.away_score
        FROM sport_events se
        LEFT JOIN sport_event_status ses ON se.id = ses.sport_event_id
        WHERE se.start_time >= CURRENT_DATE - INTERVAL '1 day'
        AND se.start_time <= CURRENT_DATE + INTERVAL '7 days'
        ORDER BY se.start_time
        LIMIT 10
      `);
      return result.rows;
    } catch (error) {
      console.error('Live query error:', error.message);
      return [];
    }
  }

  /**
   * Handle country and nationality queries
   */
  async handleCountryQueries(lowerQuestion) {
    try {
      const result = await database.query(`
        SELECT name, country, country_code, current_ranking, tour
        FROM players 
        WHERE current_ranking > 0 
        ORDER BY current_ranking 
        LIMIT 20
      `);
      return result.rows;
    } catch (error) {
      console.error('Country query error:', error.message);
      return [];
    }
  }

  /**
   * Handle general queries as fallback
   */
  async handleGeneralQueries(lowerQuestion) {
    try {
      // Return top players as general fallback
      const result = await database.query(`
        SELECT p.name, p.country, p.current_ranking, p.tour
        FROM players p
        WHERE p.current_ranking > 0 
        ORDER BY p.current_ranking 
        LIMIT 10
      `);
      return result.rows;
    } catch (error) {
      console.error('General query error:', error.message);
      return [];
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async queryDatabaseDirectlyLegacy(question) {
    try {
      // Ensure database is connected
      if (!database.pool) {
        console.log('🔄 Connecting to database...');
        await database.connect();
      }
      
      const lowerQuestion = question.toLowerCase();
      
      // Check for tournament questions first
      if (lowerQuestion.includes('won') || lowerQuestion.includes('winner') || 
          lowerQuestion.includes('us open') || lowerQuestion.includes('wimbledon') || 
          lowerQuestion.includes('french open') || lowerQuestion.includes('australian open') ||
          lowerQuestion.includes('grand slam') || lowerQuestion.includes('tournament')) {
        // Return empty for tournament questions - we don't have tournament results
        return [];
      }
      
      // Check for specific player queries with enhanced data
      if (lowerQuestion.includes('jannik') || lowerQuestion.includes('sinner')) {
        const result = await database.query(`
          SELECT name, country, country_code, current_ranking, tour, birth_date, height, weight, 
                 playing_hand, handedness, turned_pro, pro_year, career_prize_money,
                 highest_singles_ranking, highest_singles_ranking_date, gender, abbreviation, nationality
          FROM players 
          WHERE name ILIKE '%sinner%' OR name ILIKE '%jannik%'
          AND tour = 'ATP'
          ORDER BY current_ranking ASC
          LIMIT 1
        `);
        return result.rows;
      }
      
      if (lowerQuestion.includes('alcaraz') || lowerQuestion.includes('carlos')) {
        const result = await database.query(`
          SELECT name, country, current_ranking, tour, birth_date, height, weight, playing_hand, turned_pro, career_prize_money
          FROM players 
          WHERE name ILIKE '%alcaraz%' OR name ILIKE '%carlos%'
          AND tour = 'ATP'
          ORDER BY current_ranking ASC
          LIMIT 1
        `);
        return result.rows;
      }
      
      if (lowerQuestion.includes('djokovic') || lowerQuestion.includes('novak')) {
        const result = await database.query(`
          SELECT name, country, current_ranking, tour, birth_date, height, weight, playing_hand, turned_pro, career_prize_money
          FROM players 
          WHERE name ILIKE '%djokovic%' OR name ILIKE '%novak%'
          AND tour = 'ATP'
          ORDER BY current_ranking ASC
          LIMIT 1
        `);
        return result.rows;
      }
      
      // Simple pattern matching for common queries
      if (lowerQuestion.includes('ranking') || lowerQuestion.includes('rank')) {
        const result = await database.query(`
          SELECT name, country, current_ranking, tour 
          FROM players 
          WHERE current_ranking > 0 
          ORDER BY current_ranking 
          LIMIT 10
        `);
        return result.rows;
      }
      
      // Enhanced queries for new XSD data structures
      
      // Competition/Tournament info queries
      if (lowerQuestion.includes('competition') || lowerQuestion.includes('tournament')) {
        const result = await database.query(`
          SELECT c.name, c.type, c.level, c.gender, ci.surface, ci.prize_money, ci.number_of_competitors
          FROM competitions c
          LEFT JOIN competition_info ci ON c.id = ci.competition_id
          ORDER BY c.name
          LIMIT 10
        `);
        return result.rows;
      }
      
      // Season data queries
      if (lowerQuestion.includes('season') || lowerQuestion.includes('year')) {
        const result = await database.query(`
          SELECT s.name, s.year, s.start_date, s.end_date, c.name as competition_name
          FROM seasons s
          JOIN competitions c ON s.competition_id = c.id
          ORDER BY s.year DESC, s.start_date DESC
          LIMIT 10
        `);
        return result.rows;
      }
      
      // Venue queries
      if (lowerQuestion.includes('venue') || lowerQuestion.includes('stadium') || lowerQuestion.includes('court')) {
        const result = await database.query(`
          SELECT name, city_name, country_name, country_code, capacity, timezone
          FROM venues
          ORDER BY name
          LIMIT 10
        `);
        return result.rows;
      }
      
      // Race rankings queries
      if (lowerQuestion.includes('race') || lowerQuestion.includes('year to date') || lowerQuestion.includes('ytd')) {
        const result = await database.query(`
          SELECT p.name, rr.ranking, rr.points, rr.year, rr.week
          FROM race_rankings rr
          JOIN players p ON rr.player_id = p.id
          WHERE rr.year = EXTRACT(YEAR FROM CURRENT_DATE)
          ORDER BY rr.ranking
          LIMIT 10
        `);
        return result.rows;
      }
      
      // Double rankings queries
      if (lowerQuestion.includes('doubles') || lowerQuestion.includes('double')) {
        const result = await database.query(`
          SELECT p1.name as player1, p2.name as player2, dr.ranking, dr.points, dr.year
          FROM double_rankings dr
          JOIN players p1 ON dr.player1_id = p1.id
          JOIN players p2 ON dr.player2_id = p2.id
          WHERE dr.year = EXTRACT(YEAR FROM CURRENT_DATE)
          ORDER BY dr.ranking
          LIMIT 10
        `);
        return result.rows;
      }
      
      // Sport events queries
      if (lowerQuestion.includes('live') || lowerQuestion.includes('current') || lowerQuestion.includes('ongoing')) {
        const result = await database.query(`
          SELECT se.id, se.start_time, ses.status, ses.match_status, ses.home_score, ses.away_score
          FROM sport_events se
          LEFT JOIN sport_event_status ses ON se.id = ses.sport_event_id
          WHERE se.start_time >= CURRENT_DATE - INTERVAL '1 day'
          AND se.start_time <= CURRENT_DATE + INTERVAL '7 days'
          ORDER BY se.start_time
          LIMIT 10
        `);
        return result.rows;
      }
      
      // Country-based queries
      if (lowerQuestion.includes('from') || lowerQuestion.includes('country')) {
        const countryMatch = lowerQuestion.match(/(?:from|in|country)\s+([a-z]+)/i);
        if (countryMatch) {
          const country = countryMatch[1].toUpperCase();
          const result = await database.query(`
            SELECT name, country, country_code, current_ranking, tour, nationality
            FROM players 
            WHERE (country = $1 OR country_code = $1) AND current_ranking > 0
            ORDER BY current_ranking 
            LIMIT 10
          `, [country]);
          return result.rows;
        }
      }
      
      // Age-based queries
      if (lowerQuestion.includes('youngest') || lowerQuestion.includes('oldest')) {
        const order = lowerQuestion.includes('youngest') ? 'DESC' : 'ASC';
        const result = await database.query(`
          SELECT name, country, current_ranking, birth_date, tour
          FROM players 
          WHERE birth_date IS NOT NULL AND current_ranking > 0
          ORDER BY birth_date ${order}
          LIMIT 5
        `);
        return result.rows;
      }
      
      // Prize money queries
      if (lowerQuestion.includes('prize') || lowerQuestion.includes('money') || lowerQuestion.includes('earnings')) {
        const result = await database.query(`
          SELECT name, country, current_ranking, career_prize_money, tour
          FROM players 
          WHERE career_prize_money > 0
          ORDER BY career_prize_money DESC
          LIMIT 10
        `);
        return result.rows;
      }
      
      if (lowerQuestion.includes('most') || lowerQuestion.includes('highest') || lowerQuestion.includes('best')) {
        if (lowerQuestion.includes('ace') || lowerQuestion.includes('aces')) {
          const result = await database.query(`
            SELECT p.name, p.country, SUM(ms.aces) as total_aces
            FROM players p
            JOIN match_stats ms ON p.id = ms.player_id
            GROUP BY p.id, p.name, p.country
            ORDER BY total_aces DESC
            LIMIT 5
          `);
          return result.rows;
        }
        
        if (lowerQuestion.includes('prize') || lowerQuestion.includes('money')) {
          const result = await database.query(`
            SELECT name, country, career_prize_money
            FROM players
            WHERE career_prize_money > 0
            ORDER BY career_prize_money DESC
            LIMIT 5
          `);
          return result.rows;
        }
      }
      
      // Default: return top ranked players
      const result = await database.query(`
        SELECT name, country, current_ranking, tour
        FROM players
        WHERE current_ranking > 0
        ORDER BY current_ranking
        LIMIT 5
      `);
      return result.rows;
      
    } catch (error) {
      console.error('Direct database query failed:', error.message);
      return [];
    }
  }

  /**
   * Generate simple answer without AI
   */
  generateSimpleAnswer(question, data) {
    if (!data || data.length === 0) {
      const lowerQuestion = question.toLowerCase();
      
      // Handle tournament questions specifically
      if (lowerQuestion.includes('won') || lowerQuestion.includes('winner') || 
          lowerQuestion.includes('us open') || lowerQuestion.includes('wimbledon') || 
          lowerQuestion.includes('french open') || lowerQuestion.includes('australian open') ||
          lowerQuestion.includes('grand slam') || lowerQuestion.includes('tournament')) {
        return "I don't have access to tournament results or match outcomes in the current data. I can only provide current player rankings and basic player information.";
      }
      
      return "I don't have enough data to answer that question right now.";
    }

    const lowerQuestion = question.toLowerCase();
    const player = data[0];
    
    // Handle specific player queries
    if (lowerQuestion.includes('jannik') || lowerQuestion.includes('sinner')) {
      return `Jannik Sinner is an Italian professional tennis player currently ranked #${player.current_ranking} in the ATP tour. He's from ${player.country} and has earned $${player.career_prize_money ? player.career_prize_money.toLocaleString() : 'N/A'} in career prize money. He turned professional in ${player.turned_pro || 'N/A'} and plays with his ${player.playing_hand || 'right'} hand.`;
    }
    
    if (lowerQuestion.includes('alcaraz') || lowerQuestion.includes('carlos')) {
      return `Carlos Alcaraz is a Spanish professional tennis player currently ranked #${player.current_ranking} in the ATP tour. He's from ${player.country} and has earned $${player.career_prize_money ? player.career_prize_money.toLocaleString() : 'N/A'} in career prize money. He turned professional in ${player.turned_pro || 'N/A'} and plays with his ${player.playing_hand || 'right'} hand.`;
    }
    
    if (lowerQuestion.includes('djokovic') || lowerQuestion.includes('novak')) {
      return `Novak Djokovic is a Serbian professional tennis player currently ranked #${player.current_ranking} in the ATP tour. He's from ${player.country} and has earned $${player.career_prize_money ? player.career_prize_money.toLocaleString() : 'N/A'} in career prize money. He turned professional in ${player.turned_pro || 'N/A'} and plays with his ${player.playing_hand || 'right'} hand.`;
    }
    
    if (lowerQuestion.includes('ranking') || lowerQuestion.includes('rank')) {
      return `The current #${player.current_ranking} ranked player is ${player.name} from ${player.country} (${player.tour} tour).`;
    }
    
    if (lowerQuestion.includes('most') || lowerQuestion.includes('highest')) {
      if (lowerQuestion.includes('ace')) {
        return `${player.name} from ${player.country} has the most aces with ${player.total_aces} total aces.`;
      }
      
      if (lowerQuestion.includes('prize') || lowerQuestion.includes('money')) {
        return `${player.name} from ${player.country} has earned the most prize money with $${player.career_prize_money.toLocaleString()}.`;
      }
    }
    
    // Handle country-based queries
    if (lowerQuestion.includes('from') || lowerQuestion.includes('country')) {
      if (data.length > 1) {
        const country = data[0].country;
        const playerNames = data.slice(0, 3).map(p => p.name).join(', ');
        return `Here are the top tennis players from ${country}: ${playerNames}. ${data[0].name} is currently ranked #${data[0].current_ranking}.`;
      }
    }
    
    // Handle age-based queries
    if (lowerQuestion.includes('youngest') || lowerQuestion.includes('oldest')) {
      const ageType = lowerQuestion.includes('youngest') ? 'youngest' : 'oldest';
      const birthYear = new Date(player.birth_date).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      return `The ${ageType} player in the current rankings is ${player.name} from ${player.country}, who is ${age} years old and currently ranked #${player.current_ranking}.`;
    }
    
    // Handle prize money queries
    if (lowerQuestion.includes('prize') || lowerQuestion.includes('money') || lowerQuestion.includes('earnings')) {
      if (data.length > 1) {
        const topEarners = data.slice(0, 3).map(p => `${p.name} ($${p.career_prize_money ? p.career_prize_money.toLocaleString() : 'N/A'})`).join(', ');
        return `The top earners in tennis are: ${topEarners}. ${player.name} has earned $${player.career_prize_money ? player.career_prize_money.toLocaleString() : 'N/A'} in career prize money.`;
      }
    }
    
    // Default response
    return `Here's some tennis data: ${player.name} from ${player.country} is currently ranked #${player.current_ranking || 'N/A'} in the ${player.tour || 'ATP'} tour.`;
  }
}

module.exports = new TennisQueryHandler();
