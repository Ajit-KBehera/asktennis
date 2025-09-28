const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

class EnhancedTennisQueryHandler {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  // Tournament winner queries
  async getTournamentWinner(tournament, year) {
    const cacheKey = `tournament_${tournament}_${year}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const query = `
        SELECT 
          tm.tourney_name,
          tm.year,
          tm.surface,
          mr.winner_id,
          mr.loser_id,
          mr.set1,
          mr.set2,
          mr.set3,
          mr.set4,
          mr.set5
        FROM tennis_matches tm
        JOIN match_results mr ON tm.match_id = mr.match_id
        WHERE tm.tourney_name ILIKE $1 
        AND tm.year = $2 
        AND tm.round = 'F'
        LIMIT 1
      `;
      
      const result = await pool.query(query, [`%${tournament}%`, year]);
      
      if (result.rows.length > 0) {
        const match = result.rows[0];
        const response = {
          tournament: match.tourney_name,
          year: match.year,
          surface: match.surface,
          winner: match.winner_id,
          loser: match.loser_id,
          score: this.formatScore(match),
          timestamp: new Date().toISOString()
        };
        
        this.cache.set(cacheKey, response);
        return response;
      }
      
      return null;
    } catch (error) {
      console.error('Error querying tournament winner:', error.message);
      return null;
    }
  }

  // Head-to-head records
  async getHeadToHead(player1, player2) {
    const cacheKey = `h2h_${player1}_${player2}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const query = `
        SELECT 
          COUNT(CASE WHEN mr.winner_id = $1 THEN 1 END) as player1_wins,
          COUNT(CASE WHEN mr.winner_id = $2 THEN 1 END) as player2_wins,
          COUNT(*) as total_matches,
          tm.surface,
          tm.year
        FROM tennis_matches tm
        JOIN match_results mr ON tm.match_id = mr.match_id
        WHERE (mr.winner_id = $1 AND mr.loser_id = $2) 
        OR (mr.winner_id = $2 AND mr.loser_id = $1)
        GROUP BY tm.surface, tm.year
        ORDER BY tm.year DESC
        LIMIT 20
      `;
      
      const result = await pool.query(query, [player1, player2]);
      
      if (result.rows.length > 0) {
        const totalWins = result.rows.reduce((acc, row) => acc + parseInt(row.player1_wins), 0);
        const totalLosses = result.rows.reduce((acc, row) => acc + parseInt(row.player2_wins), 0);
        
        const response = {
          player1,
          player2,
          player1_wins: totalWins,
          player2_wins: totalLosses,
          total_matches: totalWins + totalLosses,
          recent_matches: result.rows.slice(0, 10),
          timestamp: new Date().toISOString()
        };
        
        this.cache.set(cacheKey, response);
        return response;
      }
      
      return null;
    } catch (error) {
      console.error('Error querying head-to-head:', error.message);
      return null;
    }
  }

  // Player career statistics
  async getPlayerCareerStats(player) {
    const cacheKey = `career_${player}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const query = `
        SELECT 
          COUNT(CASE WHEN mr.winner_id = $1 THEN 1 END) as wins,
          COUNT(CASE WHEN mr.loser_id = $1 THEN 1 END) as losses,
          AVG(tm.minutes) as avg_match_duration,
          COUNT(DISTINCT tm.tourney_name) as tournaments_played,
          COUNT(DISTINCT tm.year) as years_active,
          COUNT(CASE WHEN tm.round = 'F' AND mr.winner_id = $1 THEN 1 END) as titles,
          COUNT(CASE WHEN tm.round = 'F' AND mr.loser_id = $1 THEN 1 END) as finals_lost
        FROM tennis_matches tm
        JOIN match_results mr ON tm.match_id = mr.match_id
        WHERE mr.winner_id = $1 OR mr.loser_id = $1
      `;
      
      const result = await pool.query(query, [player]);
      
      if (result.rows.length > 0) {
        const stats = result.rows[0];
        const response = {
          player,
          wins: parseInt(stats.wins),
          losses: parseInt(stats.losses),
          win_percentage: ((parseInt(stats.wins) / (parseInt(stats.wins) + parseInt(stats.losses))) * 100).toFixed(1),
          avg_match_duration: Math.round(parseFloat(stats.avg_match_duration) || 0),
          tournaments_played: parseInt(stats.tournaments_played),
          years_active: parseInt(stats.years_active),
          titles: parseInt(stats.titles),
          finals_lost: parseInt(stats.finals_lost),
          timestamp: new Date().toISOString()
        };
        
        this.cache.set(cacheKey, response);
        return response;
      }
      
      return null;
    } catch (error) {
      console.error('Error querying player career stats:', error.message);
      return null;
    }
  }

  // Grand Slam winners by year
  async getGrandSlamWinners(year) {
    const cacheKey = `grandslams_${year}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const query = `
        SELECT 
          tm.tourney_name,
          tm.year,
          tm.surface,
          mr.winner_id,
          mr.loser_id,
          mr.set1,
          mr.set2,
          mr.set3,
          mr.set4,
          mr.set5
        FROM tennis_matches tm
        JOIN match_results mr ON tm.match_id = mr.match_id
        WHERE tm.year = $1 
        AND tm.tourney_name IN ('Australian Open', 'French Open', 'Wimbledon', 'US Open')
        AND tm.round = 'F'
        ORDER BY 
          CASE tm.tourney_name
            WHEN 'Australian Open' THEN 1
            WHEN 'French Open' THEN 2
            WHEN 'Wimbledon' THEN 3
            WHEN 'US Open' THEN 4
          END
      `;
      
      const result = await pool.query(query, [year]);
      
      if (result.rows.length > 0) {
        const response = {
          year,
          grand_slams: result.rows.map(match => ({
            tournament: match.tourney_name,
            surface: match.surface,
            winner: match.winner_id,
            loser: match.loser_id,
            score: this.formatScore(match)
          })),
          timestamp: new Date().toISOString()
        };
        
        this.cache.set(cacheKey, response);
        return response;
      }
      
      return null;
    } catch (error) {
      console.error('Error querying Grand Slam winners:', error.message);
      return null;
    }
  }

  // Most successful players
  async getMostSuccessfulPlayers(limit = 10) {
    const cacheKey = `most_successful_${limit}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const query = `
        SELECT 
          mr.winner_id as player,
          COUNT(*) as total_wins,
          COUNT(CASE WHEN tm.round = 'F' THEN 1 END) as titles,
          COUNT(DISTINCT tm.tourney_name) as tournaments_won,
          COUNT(DISTINCT tm.year) as years_active
        FROM tennis_matches tm
        JOIN match_results mr ON tm.match_id = mr.match_id
        WHERE mr.winner_id IS NOT NULL
        GROUP BY mr.winner_id
        ORDER BY total_wins DESC
        LIMIT $1
      `;
      
      const result = await pool.query(query, [limit]);
      
      if (result.rows.length > 0) {
        const response = {
          players: result.rows.map(row => ({
            player: row.player,
            total_wins: parseInt(row.total_wins),
            titles: parseInt(row.titles),
            tournaments_won: parseInt(row.tournaments_won),
            years_active: parseInt(row.years_active)
          })),
          timestamp: new Date().toISOString()
        };
        
        this.cache.set(cacheKey, response);
        return response;
      }
      
      return null;
    } catch (error) {
      console.error('Error querying most successful players:', error.message);
      return null;
    }
  }

  // Format match score
  formatScore(match) {
    const sets = [match.set1, match.set2, match.set3, match.set4, match.set5]
      .filter(set => set && set !== '')
      .join(' ');
    
    return sets || 'Score not available';
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

module.exports = EnhancedTennisQueryHandler;
