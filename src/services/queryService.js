/**
 * Tennis Query Service
 * Handles query processing, intent recognition, and response formatting
 * Separates business logic from data access
 */

const Groq = require('groq-sdk');
const tennisRepository = require('../repositories/tennisRepository');

class TennisQueryService {
  constructor() {
    // Initialize Groq with error handling for missing API key
    try {
      this.groq = new Groq({
        apiKey: process.env.GROQ_API_KEY || 'test_key'
      });
      this.hasGroqKey = !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'test_key';
    } catch (error) {
      console.warn('⚠️ Groq API key not configured, using mock responses');
      this.groq = null;
      this.hasGroqKey = false;
    }
    
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  async processQuery(question, userId = null) {
    try {
      console.log(`🎾 Processing query: "${question}"`);
      
      // Check cache first
      const cacheKey = `query_${question.toLowerCase()}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          console.log('📋 Returning cached result');
          return cached.data;
        }
        this.cache.delete(cacheKey);
      }

      // Use Groq to understand the query intent
      const intent = await this.analyzeQueryIntent(question);
      console.log('🧠 Query intent:', intent);

      // Process query based on intent
      const result = await this.executeQueryByIntent(intent, question);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      console.log('✅ Query processed successfully');
      return result;
    } catch (error) {
      console.error('❌ Error processing query:', error.message);
      return { 
        error: 'Unable to process query', 
        details: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async analyzeQueryIntent(question) {
    try {
      // If no Groq API key, use mock intent analysis
      if (!this.hasGroqKey || !this.groq) {
        return this.mockIntentAnalysis(question);
      }

      const groqResponse = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a tennis expert assistant. Analyze the user's question and determine the type of query. 
            Respond with JSON containing: 
            {
              "type": "tournament_winner|head_to_head|career_stats|grand_slam|ranking|historical_match|general",
              "tournament": "tournament name if mentioned",
              "year": number if mentioned,
              "players": ["player1", "player2"] if mentioned,
              "confidence": 0.0-1.0
            }`
          },
          {
            role: "user",
            content: question
          }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.1,
        max_tokens: 200
      });

      const intent = JSON.parse(groqResponse.choices[0].message.content);
      
      // Validate and clean the intent
      return {
        type: intent.type || 'general',
        tournament: intent.tournament || null,
        year: intent.year || null,
        players: intent.players || [],
        confidence: intent.confidence || 0.5
      };
    } catch (error) {
      console.error('Error analyzing query intent:', error.message);
      return this.mockIntentAnalysis(question);
    }
  }

  mockIntentAnalysis(question) {
    const lowerQuestion = question.toLowerCase();
    
    // Simple pattern matching for common queries
    if (lowerQuestion.includes('won') && (lowerQuestion.includes('wimbledon') || lowerQuestion.includes('open') || lowerQuestion.includes('tournament'))) {
      return {
        type: 'tournament_winner',
        tournament: this.extractTournamentName(question),
        year: this.extractYear(question),
        players: [],
        confidence: 0.7
      };
    }
    
    if (lowerQuestion.includes('head to head') || lowerQuestion.includes('h2h')) {
      return {
        type: 'head_to_head',
        tournament: null,
        year: null,
        players: this.extractPlayerNames(question),
        confidence: 0.6
      };
    }
    
    if (lowerQuestion.includes('career') || lowerQuestion.includes('stats')) {
      return {
        type: 'career_stats',
        tournament: null,
        year: null,
        players: this.extractPlayerNames(question),
        confidence: 0.6
      };
    }
    
    if (lowerQuestion.includes('grand slam')) {
      return {
        type: 'grand_slam',
        tournament: null,
        year: this.extractYear(question),
        players: [],
        confidence: 0.8
      };
    }
    
    if (lowerQuestion.includes('ranking') || lowerQuestion.includes('rankings')) {
      return {
        type: 'ranking',
        tournament: null,
        year: null,
        players: [],
        confidence: 0.8
      };
    }
    
    return {
      type: 'general',
      tournament: null,
      year: null,
      players: [],
      confidence: 0.3
    };
  }

  extractTournamentName(question) {
    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes('wimbledon')) return 'Wimbledon';
    if (lowerQuestion.includes('us open')) return 'US Open';
    if (lowerQuestion.includes('australian open')) return 'Australian Open';
    if (lowerQuestion.includes('french open') || lowerQuestion.includes('roland garros')) return 'French Open';
    return null;
  }

  extractYear(question) {
    const yearMatch = question.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? parseInt(yearMatch[0]) : null;
  }

  extractPlayerNames(question) {
    // Simple player name extraction - could be enhanced
    const players = [];
    const commonPlayers = ['federer', 'nadal', 'djokovic', 'murray', 'wawrinka', 'thiem', 'medvedev', 'tsitsipas', 'zverev'];
    
    for (const player of commonPlayers) {
      if (question.toLowerCase().includes(player)) {
        players.push(player.charAt(0).toUpperCase() + player.slice(1));
      }
    }
    
    return players;
  }

  async executeQueryByIntent(intent, originalQuestion) {
    const { type, tournament, year, players } = intent;

    switch (type) {
      case 'tournament_winner':
        if (!tournament || !year) {
          return await this.handleIncompleteQuery('tournament_winner', originalQuestion);
        }
        return await tennisRepository.getTournamentWinner(tournament, year);

      case 'head_to_head':
        if (players.length < 2) {
          return await this.handleIncompleteQuery('head_to_head', originalQuestion);
        }
        return await tennisRepository.getHeadToHead(players[0], players[1]);

      case 'career_stats':
        if (players.length < 1) {
          return await this.handleIncompleteQuery('career_stats', originalQuestion);
        }
        return await tennisRepository.getPlayerCareerStats(players[0]);

      case 'grand_slam':
        const targetYear = year || new Date().getFullYear();
        return await tennisRepository.getGrandSlamWinners(targetYear);

      case 'ranking':
        return await tennisRepository.getCurrentRankings();

      case 'historical_match':
        return await this.handleHistoricalMatchQuery(originalQuestion);

      default:
        return await this.handleGeneralQuery(originalQuestion);
    }
  }

  async handleIncompleteQuery(queryType, originalQuestion) {
    const suggestions = {
      tournament_winner: 'Please specify both tournament name and year (e.g., "Who won Wimbledon 2023?")',
      head_to_head: 'Please specify both players (e.g., "Head to head between Federer and Nadal")',
      career_stats: 'Please specify a player name (e.g., "Career stats for Novak Djokovic")'
    };

    return {
      error: 'Incomplete query',
      message: suggestions[queryType] || 'Please provide more specific information',
      originalQuestion,
      timestamp: new Date().toISOString()
    };
  }

  async handleHistoricalMatchQuery(question) {
    try {
      // Extract search parameters from the question
      const searchParams = this.extractSearchParameters(question);
      const result = await tennisRepository.queryHistoricalMatches(searchParams);
      
      if (result) {
        return result;
      }
      
      return {
        message: 'No historical matches found matching your criteria',
        originalQuestion: question,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error handling historical match query:', error.message);
      return {
        error: 'Unable to search historical matches',
        details: error.message,
        originalQuestion: question,
        timestamp: new Date().toISOString()
      };
    }
  }

  extractSearchParameters(question) {
    const lowerQuestion = question.toLowerCase();
    
    // Extract year
    const yearMatch = lowerQuestion.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? parseInt(yearMatch[0]) : null;
    
    // Extract tournament name
    let tournament = null;
    if (lowerQuestion.includes('roland garros') || lowerQuestion.includes('french open')) {
      tournament = 'French Open';
    } else if (lowerQuestion.includes('wimbledon')) {
      tournament = 'Wimbledon';
    } else if (lowerQuestion.includes('us open')) {
      tournament = 'US Open';
    } else if (lowerQuestion.includes('australian open')) {
      tournament = 'Australian Open';
    }
    
    // Extract player name (simplified - could be enhanced with NLP)
    const playerMatch = lowerQuestion.match(/(?:player|tennis player|athlete)\s+([a-zA-Z\s]+)/i);
    const player = playerMatch ? playerMatch[1].trim() : null;
    
    // Extract round
    let round = null;
    if (lowerQuestion.includes('final')) {
      round = 'F';
    } else if (lowerQuestion.includes('semifinal') || lowerQuestion.includes('semi-final')) {
      round = 'SF';
    } else if (lowerQuestion.includes('quarterfinal') || lowerQuestion.includes('quarter-final')) {
      round = 'QF';
    }
    
    return {
      tournament,
      year,
      player,
      round
    };
  }

  async handleGeneralQuery(question) {
    // For general queries, try to find any relevant historical matches
    try {
      const searchParams = this.extractSearchParameters(question);
      const result = await tennisRepository.queryHistoricalMatches(searchParams);
      
      if (result && result.matches.length > 0) {
        return {
          message: 'Here are some relevant tennis matches:',
          ...result,
          originalQuestion: question
        };
      }
      
      return {
        message: 'I found some general tennis information, but please be more specific about what you\'re looking for.',
        suggestions: [
          'Try asking about a specific tournament winner',
          'Ask for head-to-head records between players',
          'Request career statistics for a player',
          'Ask about Grand Slam winners for a year',
          'Request current rankings'
        ],
        originalQuestion: question,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error handling general query:', error.message);
      return {
        error: 'Unable to process general query',
        details: error.message,
        originalQuestion: question,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    tennisRepository.clearCache();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      serviceCache: {
        size: this.cache.size,
        keys: Array.from(this.cache.keys())
      },
      repositoryCache: tennisRepository.getCacheStats()
    };
  }
}

module.exports = new TennisQueryService();
