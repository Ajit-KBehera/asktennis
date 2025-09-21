/**
 * Data Models for GitHub Repository Integration
 * 
 * This module defines data models and validation schemas for the various
 * data types from Jeff Sackmann's tennis repositories.
 */

class DataModels {
  constructor() {
    this.models = {
      ranking: this.createRankingModel(),
      player: this.createPlayerModel(),
      match: this.createMatchModel(),
      matchCharting: this.createMatchChartingModel(),
      grandSlam: this.createGrandSlamModel()
    };
  }

  /**
   * Create ranking data model
   */
  createRankingModel() {
    return {
      required: ['player_name', 'ranking', 'tour'],
      optional: ['player_id', 'points', 'ranking_date', 'data_source', 'is_current'],
      validate: (data) => {
        const errors = [];
        
        if (!data.player_name || typeof data.player_name !== 'string') {
          errors.push('player_name is required and must be a string');
        }
        
        if (!data.ranking || isNaN(parseInt(data.ranking))) {
          errors.push('ranking is required and must be a number');
        }
        
        if (!data.tour || !['ATP', 'WTA'].includes(data.tour)) {
          errors.push('tour is required and must be ATP or WTA');
        }
        
        if (data.points && isNaN(parseInt(data.points))) {
          errors.push('points must be a number');
        }
        
        return {
          isValid: errors.length === 0,
          errors: errors,
          data: this.normalizeRankingData(data)
        };
      }
    };
  }

  /**
   * Create player data model
   */
  createPlayerModel() {
    return {
      required: ['name', 'tour'],
      optional: ['player_id', 'birth_date', 'country', 'height', 'weight', 'playing_hand', 'turned_pro', 'data_source'],
      validate: (data) => {
        const errors = [];
        
        if (!data.name || typeof data.name !== 'string') {
          errors.push('name is required and must be a string');
        }
        
        if (!data.tour || !['ATP', 'WTA'].includes(data.tour)) {
          errors.push('tour is required and must be ATP or WTA');
        }
        
        if (data.height && isNaN(parseInt(data.height))) {
          errors.push('height must be a number');
        }
        
        if (data.weight && isNaN(parseInt(data.weight))) {
          errors.push('weight must be a number');
        }
        
        if (data.turned_pro && isNaN(parseInt(data.turned_pro))) {
          errors.push('turned_pro must be a number');
        }
        
        return {
          isValid: errors.length === 0,
          errors: errors,
          data: this.normalizePlayerData(data)
        };
      }
    };
  }

  /**
   * Create match data model
   */
  createMatchModel() {
    return {
      required: ['winner_name', 'loser_name', 'tour'],
      optional: ['tournament_name', 'tournament_date', 'surface', 'round', 'score', 'winner_rank', 'loser_rank', 'data_source'],
      validate: (data) => {
        const errors = [];
        
        if (!data.winner_name || typeof data.winner_name !== 'string') {
          errors.push('winner_name is required and must be a string');
        }
        
        if (!data.loser_name || typeof data.loser_name !== 'string') {
          errors.push('loser_name is required and must be a string');
        }
        
        if (!data.tour || !['ATP', 'WTA'].includes(data.tour)) {
          errors.push('tour is required and must be ATP or WTA');
        }
        
        if (data.winner_rank && isNaN(parseInt(data.winner_rank))) {
          errors.push('winner_rank must be a number');
        }
        
        if (data.loser_rank && isNaN(parseInt(data.loser_rank))) {
          errors.push('loser_rank must be a number');
        }
        
        return {
          isValid: errors.length === 0,
          errors: errors,
          data: this.normalizeMatchData(data)
        };
      }
    };
  }

  /**
   * Create match charting data model
   */
  createMatchChartingModel() {
    return {
      required: ['match_id', 'player1', 'player2'],
      optional: ['tournament', 'date', 'surface', 'round', 'winner', 'score', 'data_source'],
      validate: (data) => {
        const errors = [];
        
        if (!data.match_id || typeof data.match_id !== 'string') {
          errors.push('match_id is required and must be a string');
        }
        
        if (!data.player1 || typeof data.player1 !== 'string') {
          errors.push('player1 is required and must be a string');
        }
        
        if (!data.player2 || typeof data.player2 !== 'string') {
          errors.push('player2 is required and must be a string');
        }
        
        return {
          isValid: errors.length === 0,
          errors: errors,
          data: this.normalizeMatchChartingData(data)
        };
      }
    };
  }

  /**
   * Create Grand Slam data model
   */
  createGrandSlamModel() {
    return {
      required: ['point_id', 'match_id', 'tournament', 'year'],
      optional: ['round', 'player1', 'player2', 'point_winner', 'serve_direction', 'return_direction', 'rally_length', 'data_source'],
      validate: (data) => {
        const errors = [];
        
        if (!data.point_id || typeof data.point_id !== 'string') {
          errors.push('point_id is required and must be a string');
        }
        
        if (!data.match_id || typeof data.match_id !== 'string') {
          errors.push('match_id is required and must be a string');
        }
        
        if (!data.tournament || typeof data.tournament !== 'string') {
          errors.push('tournament is required and must be a string');
        }
        
        if (!data.year || isNaN(parseInt(data.year))) {
          errors.push('year is required and must be a number');
        }
        
        if (data.rally_length && isNaN(parseInt(data.rally_length))) {
          errors.push('rally_length must be a number');
        }
        
        return {
          isValid: errors.length === 0,
          errors: errors,
          data: this.normalizeGrandSlamData(data)
        };
      }
    };
  }

  /**
   * Normalize ranking data
   */
  normalizeRankingData(data) {
    return {
      player_id: data.player_id || null,
      player_name: data.player_name?.trim() || '',
      ranking: parseInt(data.ranking) || 0,
      points: parseInt(data.points) || 0,
      tour: data.tour || 'ATP',
      ranking_date: data.ranking_date || new Date().toISOString().split('T')[0],
      data_source: data.data_source || 'github',
      is_current: data.is_current !== undefined ? data.is_current : true
    };
  }

  /**
   * Normalize player data
   */
  normalizePlayerData(data) {
    return {
      player_id: data.player_id || null,
      name: data.name?.trim() || '',
      birth_date: data.birth_date || null,
      country: data.country || null,
      height: data.height ? parseInt(data.height) : null,
      weight: data.weight ? parseInt(data.weight) : null,
      playing_hand: data.playing_hand || null,
      turned_pro: data.turned_pro ? parseInt(data.turned_pro) : null,
      tour: data.tour || 'ATP',
      data_source: data.data_source || 'github'
    };
  }

  /**
   * Normalize match data
   */
  normalizeMatchData(data) {
    return {
      tournament_name: data.tournament_name || null,
      tournament_date: data.tournament_date || null,
      surface: data.surface || null,
      round: data.round || null,
      winner_name: data.winner_name?.trim() || '',
      loser_name: data.loser_name?.trim() || '',
      score: data.score || null,
      winner_rank: data.winner_rank ? parseInt(data.winner_rank) : null,
      loser_rank: data.loser_rank ? parseInt(data.loser_rank) : null,
      winner_points: data.winner_points ? parseInt(data.winner_points) : null,
      loser_points: data.loser_points ? parseInt(data.loser_points) : null,
      tour: data.tour || 'ATP',
      data_source: data.data_source || 'github'
    };
  }

  /**
   * Normalize match charting data
   */
  normalizeMatchChartingData(data) {
    return {
      match_id: data.match_id?.trim() || '',
      tournament: data.tournament || null,
      date: data.date || null,
      surface: data.surface || null,
      round: data.round || null,
      player1: data.player1?.trim() || '',
      player2: data.player2?.trim() || '',
      winner: data.winner || null,
      score: data.score || null,
      data_source: data.data_source || 'github_charting'
    };
  }

  /**
   * Normalize Grand Slam data
   */
  normalizeGrandSlamData(data) {
    return {
      point_id: data.point_id?.trim() || '',
      match_id: data.match_id?.trim() || '',
      tournament: data.tournament || '',
      year: parseInt(data.year) || 0,
      round: data.round || null,
      player1: data.player1 || null,
      player2: data.player2 || null,
      point_winner: data.point_winner || null,
      serve_direction: data.serve_direction || null,
      return_direction: data.return_direction || null,
      rally_length: data.rally_length ? parseInt(data.rally_length) : 0,
      data_source: data.data_source || 'github_slam'
    };
  }

  /**
   * Validate data against a specific model
   */
  validateData(type, data) {
    if (!this.models[type]) {
      return {
        isValid: false,
        errors: [`Unknown model type: ${type}`],
        data: null
      };
    }

    return this.models[type].validate(data);
  }

  /**
   * Validate and normalize an array of data
   */
  validateAndNormalizeArray(type, dataArray) {
    const results = {
      valid: [],
      invalid: [],
      errors: []
    };

    dataArray.forEach((item, index) => {
      const validation = this.validateData(type, item);
      
      if (validation.isValid) {
        results.valid.push(validation.data);
      } else {
        results.invalid.push({
          index: index,
          data: item,
          errors: validation.errors
        });
        results.errors.push(`Item ${index}: ${validation.errors.join(', ')}`);
      }
    });

    return results;
  }

  /**
   * Get model schema for a specific type
   */
  getModelSchema(type) {
    if (!this.models[type]) {
      return null;
    }

    return {
      type: type,
      required: this.models[type].required,
      optional: this.models[type].optional
    };
  }

  /**
   * Get all available model types
   */
  getAvailableModels() {
    return Object.keys(this.models);
  }

  /**
   * Create sample data for testing
   */
  createSampleData(type) {
    const samples = {
      ranking: {
        player_name: 'Novak Djokovic',
        ranking: 1,
        points: 11540,
        tour: 'ATP',
        ranking_date: '2024-01-01',
        data_source: 'github'
      },
      player: {
        name: 'Novak Djokovic',
        birth_date: '1987-05-22',
        country: 'SRB',
        height: 188,
        weight: 77,
        playing_hand: 'Right',
        turned_pro: 2003,
        tour: 'ATP',
        data_source: 'github'
      },
      match: {
        tournament_name: 'Wimbledon',
        tournament_date: '2024-07-14',
        surface: 'Grass',
        round: 'Final',
        winner_name: 'Novak Djokovic',
        loser_name: 'Rafael Nadal',
        score: '6-4, 6-3, 6-4',
        winner_rank: 1,
        loser_rank: 2,
        tour: 'ATP',
        data_source: 'github'
      },
      matchCharting: {
        match_id: '2024-wimbledon-final-djokovic-nadal',
        tournament: 'Wimbledon',
        date: '2024-07-14',
        surface: 'Grass',
        round: 'Final',
        player1: 'Novak Djokovic',
        player2: 'Rafael Nadal',
        winner: 'Novak Djokovic',
        score: '6-4, 6-3, 6-4',
        data_source: 'github_charting'
      },
      grandSlam: {
        point_id: '2024-wimbledon-final-point-1',
        match_id: '2024-wimbledon-final-djokovic-nadal',
        tournament: 'wimbledon',
        year: 2024,
        round: 'Final',
        player1: 'Novak Djokovic',
        player2: 'Rafael Nadal',
        point_winner: 'Novak Djokovic',
        serve_direction: 'T',
        return_direction: 'CC',
        rally_length: 5,
        data_source: 'github_slam'
      }
    };

    return samples[type] || null;
  }
}

module.exports = new DataModels();
