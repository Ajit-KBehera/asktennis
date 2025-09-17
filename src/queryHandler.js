const Groq = require('groq-sdk');
const database = require('./database');

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
      rankingQueries: /(?:ranking|rank|number one|top.*rank|position)/i
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
        isPlaceholder: process.env.GROQ_API_KEY === 'your_groq_api_key_here'
      });
      
      if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
        console.log('Groq API key not configured, using fallback mode');
        // Get some sample data and provide a helpful message
        const sampleData = this.getSampleData();
        return {
          answer: "While I don't have access to the full database in demo mode, this would typically be answered using our AI-powered tennis statistics system. The system can analyze player records, tournament results, head-to-head matchups, and various performance metrics to provide detailed insights.",
          data: null,
          queryType: 'fallback',
          confidence: 0.5
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
      const queryResult = await this.executeQuery(sqlQuery);
      console.log('Database query result:', queryResult);
      
      // Generate natural language response
      console.log('Generating AI answer...');
      const answer = await this.generateAnswer(question, queryResult, queryAnalysis);
      console.log('AI answer generated:', answer);
      
      return {
        answer,
        data: queryResult,
        queryType: queryAnalysis.type,
        confidence: queryAnalysis.confidence
      };
      
    } catch (error) {
      console.error('Query processing error:', error);
      
      // Fallback response for errors
      return {
        answer: "While I don't have access to the full database in demo mode, this would typically be answered using our AI-powered tennis statistics system. The system can analyze player records, tournament results, head-to-head matchups, and various performance metrics to provide detailed insights.",
        data: null,
        queryType: 'error',
        confidence: 0
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
        
        Please respond with a JSON object containing:
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

      const analysis = JSON.parse(response.choices[0].message.content);
      
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
        - players (id, name, country, birth_date, height, weight, playing_hand, turned_pro, current_ranking, career_prize_money)
        - tournaments (id, name, type, surface, level, location, start_date, end_date, prize_money)
        - matches (id, tournament_id, player1_id, player2_id, winner_id, score, duration, match_date, round, surface)
        - match_stats (id, match_id, player_id, aces, double_faults, first_serve_percentage, first_serve_points_won, second_serve_points_won, break_points_saved, break_points_converted, total_points_won)
        - rankings (id, player_id, ranking, points, ranking_date)
        
        Return ONLY the SQL query, no explanations. Use proper JOINs and aggregations as needed.
        If the question asks for "most" or "highest", use ORDER BY and LIMIT.
        If asking about specific players, use WHERE clauses with player names.
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
    try {
      console.log('Executing SQL:', sqlQuery);
      const result = await database.query(sqlQuery);
      console.log('SQL query result:', result.rows);
      return result.rows;
    } catch (error) {
      console.error('Query execution error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail
      });
      
      // Return empty result in demo/error mode to avoid hardcoded player names
      console.log('Returning empty result due to SQL error');
      return [];
    }
  }

  async generateAnswer(question, data, analysis) {
    try {
      if (!data || data.length === 0) {
        return "While I don't have access to the full database in demo mode, this would typically be answered using our AI-powered tennis statistics system. The system can analyze player records, tournament results, head-to-head matchups, and various performance metrics to provide detailed insights.";
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
      return "While I don't have access to the full database in demo mode, this would typically be answered using our AI-powered tennis statistics system. The system can analyze player records, tournament results, head-to-head matchups, and various performance metrics to provide detailed insights.";
    }

    // Try to provide a more intelligent answer based on the question
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('most') || lowerQuestion.includes('highest') || lowerQuestion.includes('best')) {
      if (data.length > 0) {
        const topPlayer = data[0];
        return `While I don't have access to the full database in demo mode, this would typically be answered using our AI-powered tennis statistics system. The system can analyze player records, tournament results, head-to-head matchups, and various performance metrics to provide detailed insights.`;
      }
    }
    
    if (lowerQuestion.includes('who') && data.length > 0) {
      return "While I don't have access to the full database in demo mode, this would typically be answered using our AI-powered tennis statistics system. The system can analyze player records, tournament results, head-to-head matchups, and various performance metrics to provide detailed insights.";
    }
    
    if (lowerQuestion.includes('record') || lowerQuestion.includes('against')) {
      return "While I don't have access to the full database in demo mode, this would typically be answered using our AI-powered tennis statistics system. The system can analyze player records, tournament results, head-to-head matchups, and various performance metrics to provide detailed insights.";
    }
    
    // Default fallback
    return "While I don't have access to the full database in demo mode, this would typically be answered using our AI-powered tennis statistics system. The system can analyze player records, tournament results, head-to-head matchups, and various performance metrics to provide detailed insights.";
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
}

module.exports = new TennisQueryHandler();
