#!/usr/bin/env node

const { Pool } = require('pg');

// Railway database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Safely parse integer values for Railway database
 */
function safeParseInt(value, defaultValue = null) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const parsed = parseInt(value);
  if (isNaN(parsed) || parsed <= 0) {
    return defaultValue;
  }
  
  return parsed;
}

/**
 * Safely parse date values for Railway database
 */
function safeParseDate(value, defaultValue = null) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  // Handle invalid dates like "1900-00-00" or "1889-00-00"
  if (value.includes('00-00') || value.includes('1900-00-00') || value.includes('1889-00-00')) {
    return defaultValue;
  }
  
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return defaultValue;
    }
    return date;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Process and insert historical rankings data safely
 */
async function insertHistoricalRankings(rankingsData) {
  console.log(`🔄 Processing ${rankingsData.length} historical rankings...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const ranking of rankingsData) {
    try {
      // Safely parse all values
      const playerId = ranking.player_id || null;
      const playerName = ranking.player_name || null;
      const rankingValue = safeParseInt(ranking.ranking);
      const points = safeParseInt(ranking.points);
      const tour = ranking.tour || 'ATP';
      const rankingDate = safeParseDate(ranking.ranking_date);
      const decade = safeParseInt(ranking.decade);
      const year = safeParseInt(ranking.year);
      
      // Skip invalid records
      if (!playerId || !playerName || !rankingValue || !rankingDate) {
        errorCount++;
        continue;
      }
      
      await pool.query(`
        INSERT INTO historical_rankings 
        (player_id, player_name, ranking, points, tour, ranking_date, decade, year, data_source)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (player_id, ranking_date, tour) 
        DO UPDATE SET 
          ranking = EXCLUDED.ranking,
          points = EXCLUDED.points,
          decade = EXCLUDED.decade,
          year = EXCLUDED.year
      `, [playerId, playerName, rankingValue, points, tour, rankingDate, decade, year, 'github']);
      
      successCount++;
      
    } catch (error) {
      console.error(`❌ Error inserting ranking for ${ranking.player_name}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`✅ Processed rankings: ${successCount} success, ${errorCount} errors`);
  return { successCount, errorCount };
}

/**
 * Process and insert historical players data safely
 */
async function insertHistoricalPlayers(playersData) {
  console.log(`🔄 Processing ${playersData.length} historical players...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const player of playersData) {
    try {
      // Safely parse all values
      const playerId = player.player_id || null;
      const name = player.name || null;
      const birthDate = safeParseDate(player.birth_date);
      const country = player.country || null;
      const height = safeParseInt(player.height);
      const weight = safeParseInt(player.weight);
      const playingHand = player.playing_hand || null;
      const turnedPro = safeParseInt(player.turned_pro);
      const tour = player.tour || 'ATP';
      
      // Skip invalid records
      if (!playerId || !name) {
        errorCount++;
        continue;
      }
      
      await pool.query(`
        INSERT INTO historical_players 
        (player_id, name, birth_date, country, height, weight, playing_hand, turned_pro, tour, data_source)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (player_id) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          birth_date = EXCLUDED.birth_date,
          country = EXCLUDED.country,
          height = EXCLUDED.height,
          weight = EXCLUDED.weight,
          playing_hand = EXCLUDED.playing_hand,
          turned_pro = EXCLUDED.turned_pro
      `, [playerId, name, birthDate, country, height, weight, playingHand, turnedPro, tour, 'github']);
      
      successCount++;
      
    } catch (error) {
      console.error(`❌ Error inserting player ${player.name}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`✅ Processed players: ${successCount} success, ${errorCount} errors`);
  return { successCount, errorCount };
}

/**
 * Process and insert historical matches data safely
 */
async function insertHistoricalMatches(matchesData) {
  console.log(`🔄 Processing ${matchesData.length} historical matches...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const match of matchesData) {
    try {
      // Safely parse all values
      const tournamentName = match.tournament_name || null;
      const tournamentDate = safeParseDate(match.tournament_date);
      const winnerName = match.winner_name || null;
      const loserName = match.loser_name || null;
      const score = match.score || null;
      const surface = match.surface || null;
      const round = match.round || null;
      const winnerRank = safeParseInt(match.winner_rank);
      const loserRank = safeParseInt(match.loser_rank);
      const winnerPoints = safeParseInt(match.winner_points);
      const loserPoints = safeParseInt(match.loser_points);
      const tour = match.tour || 'ATP';
      
      // Skip invalid records
      if (!tournamentName || !winnerName || !loserName) {
        errorCount++;
        continue;
      }
      
      await pool.query(`
        INSERT INTO historical_matches 
        (tournament_name, tournament_date, winner_name, loser_name, score, surface, round, 
         winner_rank, loser_rank, winner_points, loser_points, tour, data_source)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [tournamentName, tournamentDate, winnerName, loserName, score, surface, round,
          winnerRank, loserRank, winnerPoints, loserPoints, tour, 'github']);
      
      successCount++;
      
    } catch (error) {
      console.error(`❌ Error inserting match ${match.winner_name} vs ${match.loser_name}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`✅ Processed matches: ${successCount} success, ${errorCount} errors`);
  return { successCount, errorCount };
}

/**
 * Get database statistics
 */
async function getDatabaseStats() {
  try {
    const stats = {};
    
    const tables = ['rankings', 'players', 'historical_rankings', 'historical_players', 'historical_matches', 'match_charting'];
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        stats[table] = parseInt(result.rows[0].count);
      } catch (error) {
        stats[table] = 0;
      }
    }
    
    return stats;
  } catch (error) {
    console.error('❌ Error getting database stats:', error.message);
    return {};
  }
}

/**
 * Clean up database and free space
 */
async function cleanupDatabase() {
  console.log('🔄 Cleaning up database...');
  
  try {
    // Remove duplicate or invalid records
    await pool.query(`
      DELETE FROM historical_rankings 
      WHERE ranking IS NULL OR ranking <= 0 OR player_name IS NULL OR player_id IS NULL
    `);
    
    await pool.query(`
      DELETE FROM historical_players 
      WHERE name IS NULL OR player_id IS NULL
    `);
    
    await pool.query(`
      DELETE FROM historical_matches 
      WHERE winner_name IS NULL OR loser_name IS NULL OR tournament_name IS NULL
    `);
    
    // Vacuum to reclaim space
    await pool.query('VACUUM ANALYZE');
    
    console.log('✅ Database cleanup completed');
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

module.exports = {
  insertHistoricalRankings,
  insertHistoricalPlayers,
  insertHistoricalMatches,
  getDatabaseStats,
  cleanupDatabase,
  safeParseInt,
  safeParseDate
};
