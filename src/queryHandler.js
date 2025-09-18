const Groq = require('groq-sdk');
const database = require('./database');
const dataSync = require('./dataSync');

class TennisQueryHandler {
  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
    
    // Tennis-specific query patterns and responses
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
      prizeMoney: /(?:prize money|earnings|salary|income|wealthy|richest)/i
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

  async generateSQLQuery(question, analysis) {
    try {
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

  async executeQuery(sqlQuery) {
    // Ensure database is connected
    if (!database.pool) {
      console.log('🔄 Connecting to database...');
      await database.connect();
    }
    
    // Clean the SQL query - remove markdown formatting
    let cleanSQL = sqlQuery.trim();
    
    // Remove markdown code blocks
    if (cleanSQL.startsWith('```sql')) {
      cleanSQL = cleanSQL.replace(/^```sql\s*/, '').replace(/\s*```$/, '');
    } else if (cleanSQL.startsWith('```')) {
      cleanSQL = cleanSQL.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Remove any remaining markdown formatting
    cleanSQL = cleanSQL.replace(/^```.*$/gm, '').trim();
    
    // Add query timeout and optimization hints
    const startTime = Date.now();
    console.log('Executing SQL:', cleanSQL);
    
    try {
      const result = await database.query(cleanSQL);
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
   * Query database directly without AI (for when Groq API is not available)
   */
  async queryDatabaseDirectly(question) {
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
      
      // Check for specific player queries
      if (lowerQuestion.includes('jannik') || lowerQuestion.includes('sinner')) {
        const result = await database.query(`
          SELECT name, country, current_ranking, tour, birth_date, height, weight, playing_hand, turned_pro, career_prize_money
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
      
      // Country-based queries
      if (lowerQuestion.includes('from') || lowerQuestion.includes('country')) {
        const countryMatch = lowerQuestion.match(/(?:from|in|country)\s+([a-z]+)/i);
        if (countryMatch) {
          const country = countryMatch[1].toUpperCase();
          const result = await database.query(`
            SELECT name, country, current_ranking, tour
            FROM players 
            WHERE country = $1 AND current_ranking > 0
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
