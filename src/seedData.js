const database = require('./database');

class SeedData {
  constructor() {
    this.players = [
      {
        name: 'Novak Djokovic',
        country: 'SRB',
        birth_date: '1987-05-22',
        height: 188,
        weight: 77,
        playing_hand: 'Right',
        turned_pro: 2003,
        current_ranking: 1,
        career_prize_money: 180000000
      },
      {
        name: 'Rafael Nadal',
        country: 'ESP',
        birth_date: '1986-06-03',
        height: 185,
        weight: 85,
        playing_hand: 'Left',
        turned_pro: 2001,
        current_ranking: 2,
        career_prize_money: 140000000
      },
      {
        name: 'Roger Federer',
        country: 'SUI',
        birth_date: '1981-08-08',
        height: 185,
        weight: 85,
        playing_hand: 'Right',
        turned_pro: 1998,
        current_ranking: 0, // Retired
        career_prize_money: 130000000
      },
      {
        name: 'Andy Murray',
        country: 'GBR',
        birth_date: '1987-05-15',
        height: 191,
        weight: 84,
        playing_hand: 'Right',
        turned_pro: 2005,
        current_ranking: 40,
        career_prize_money: 65000000
      },
      {
        name: 'Serena Williams',
        country: 'USA',
        birth_date: '1981-09-26',
        height: 175,
        weight: 70,
        playing_hand: 'Right',
        turned_pro: 1995,
        current_ranking: 0, // Retired
        career_prize_money: 95000000
      },
      {
        name: 'Venus Williams',
        country: 'USA',
        birth_date: '1980-06-17',
        height: 185,
        weight: 74,
        playing_hand: 'Right',
        turned_pro: 1994,
        current_ranking: 0, // Retired
        career_prize_money: 42000000
      },
      {
        name: 'Maria Sharapova',
        country: 'RUS',
        birth_date: '1987-04-19',
        height: 188,
        weight: 70,
        playing_hand: 'Right',
        turned_pro: 2001,
        current_ranking: 0, // Retired
        career_prize_money: 38000000
      },
      {
        name: 'Carlos Alcaraz',
        country: 'ESP',
        birth_date: '2003-05-05',
        height: 183,
        weight: 72,
        playing_hand: 'Right',
        turned_pro: 2018,
        current_ranking: 3,
        career_prize_money: 15000000
      },
      {
        name: 'Jannik Sinner',
        country: 'ITA',
        birth_date: '2001-08-16',
        height: 188,
        weight: 76,
        playing_hand: 'Right',
        turned_pro: 2018,
        current_ranking: 4,
        career_prize_money: 12000000
      },
      {
        name: 'Daniil Medvedev',
        country: 'RUS',
        birth_date: '1996-02-11',
        height: 198,
        weight: 83,
        playing_hand: 'Right',
        turned_pro: 2014,
        current_ranking: 5,
        career_prize_money: 25000000
      }
    ];

    this.tournaments = [
      {
        name: 'Wimbledon',
        type: 'Grand Slam',
        surface: 'Grass',
        level: 'Grand Slam',
        location: 'London, England',
        start_date: '2024-07-01',
        end_date: '2024-07-14',
        prize_money: 50000000
      },
      {
        name: 'US Open',
        type: 'Grand Slam',
        surface: 'Hard',
        level: 'Grand Slam',
        location: 'New York, USA',
        start_date: '2024-08-26',
        end_date: '2024-09-08',
        prize_money: 75000000
      },
      {
        name: 'French Open',
        type: 'Grand Slam',
        surface: 'Clay',
        level: 'Grand Slam',
        location: 'Paris, France',
        start_date: '2024-05-26',
        end_date: '2024-06-09',
        prize_money: 55000000
      },
      {
        name: 'Australian Open',
        type: 'Grand Slam',
        surface: 'Hard',
        level: 'Grand Slam',
        location: 'Melbourne, Australia',
        start_date: '2024-01-14',
        end_date: '2024-01-28',
        prize_money: 60000000
      },
      {
        name: 'ATP Finals',
        type: 'Tour Finals',
        surface: 'Hard',
        level: 'Tour Finals',
        location: 'Turin, Italy',
        start_date: '2024-11-10',
        end_date: '2024-11-17',
        prize_money: 15000000
      }
    ];
  }

  async seed() {
    try {
      console.log('🌱 Starting database seeding...');
      
      // Clear existing data
      await this.clearData();
      
      // Insert players
      await this.insertPlayers();
      
      // Insert tournaments
      await this.insertTournaments();
      
      // Insert sample matches
      await this.insertMatches();
      
      // Insert match statistics
      await this.insertMatchStats();
      
      // Insert rankings
      await this.insertRankings();
      
      console.log('✅ Database seeding completed successfully!');
      
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  async clearData() {
    const client = await database.getClient();
    try {
      await client.query('DELETE FROM match_stats');
      await client.query('DELETE FROM rankings');
      await client.query('DELETE FROM matches');
      await client.query('DELETE FROM tournaments');
      await client.query('DELETE FROM players');
      console.log('🗑️  Cleared existing data');
    } finally {
      client.release();
    }
  }

  async insertPlayers() {
    const client = await database.getClient();
    try {
      for (const player of this.players) {
        await client.query(`
          INSERT INTO players (name, country, birth_date, height, weight, playing_hand, turned_pro, current_ranking, career_prize_money)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          player.name, player.country, player.birth_date, player.height, 
          player.weight, player.playing_hand, player.turned_pro, 
          player.current_ranking, player.career_prize_money
        ]);
      }
      console.log(`✅ Inserted ${this.players.length} players`);
    } finally {
      client.release();
    }
  }

  async insertTournaments() {
    const client = await database.getClient();
    try {
      for (const tournament of this.tournaments) {
        await client.query(`
          INSERT INTO tournaments (name, type, surface, level, location, start_date, end_date, prize_money)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          tournament.name, tournament.type, tournament.surface, tournament.level,
          tournament.location, tournament.start_date, tournament.end_date, tournament.prize_money
        ]);
      }
      console.log(`✅ Inserted ${this.tournaments.length} tournaments`);
    } finally {
      client.release();
    }
  }

  async insertMatches() {
    const client = await database.getClient();
    try {
      // Get player and tournament IDs
      const playersResult = await client.query('SELECT id, name FROM players');
      const tournamentsResult = await client.query('SELECT id, name FROM tournaments');
      
      const players = playersResult.rows;
      const tournaments = tournamentsResult.rows;
      
      // Sample matches
      const matches = [
        {
          tournament: 'Wimbledon',
          player1: 'Novak Djokovic',
          player2: 'Rafael Nadal',
          winner: 'Novak Djokovic',
          score: '6-4, 6-3, 6-4',
          duration: 180,
          match_date: '2024-07-14',
          round: 'Final',
          surface: 'Grass'
        },
        {
          tournament: 'French Open',
          player1: 'Rafael Nadal',
          player2: 'Carlos Alcaraz',
          winner: 'Rafael Nadal',
          score: '6-3, 6-1, 6-2',
          duration: 165,
          match_date: '2024-06-09',
          round: 'Final',
          surface: 'Clay'
        },
        {
          tournament: 'US Open',
          player1: 'Novak Djokovic',
          player2: 'Daniil Medvedev',
          winner: 'Novak Djokovic',
          score: '6-3, 7-6, 6-3',
          duration: 195,
          match_date: '2024-09-08',
          round: 'Final',
          surface: 'Hard'
        }
      ];
      
      for (const match of matches) {
        const tournament = tournaments.find(t => t.name === match.tournament);
        const player1 = players.find(p => p.name === match.player1);
        const player2 = players.find(p => p.name === match.player2);
        const winner = players.find(p => p.name === match.winner);
        
        if (tournament && player1 && player2 && winner) {
          await client.query(`
            INSERT INTO matches (tournament_id, player1_id, player2_id, winner_id, score, duration, match_date, round, surface)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            tournament.id, player1.id, player2.id, winner.id,
            match.score, match.duration, match.match_date, match.round, match.surface
          ]);
        }
      }
      
      console.log(`✅ Inserted ${matches.length} matches`);
    } finally {
      client.release();
    }
  }

  async insertMatchStats() {
    const client = await database.getClient();
    try {
      const matchesResult = await client.query('SELECT id, player1_id, player2_id FROM matches');
      const matches = matchesResult.rows;
      
      for (const match of matches) {
        // Stats for player 1
        await client.query(`
          INSERT INTO match_stats (match_id, player_id, aces, double_faults, first_serve_percentage, first_serve_points_won, second_serve_points_won, break_points_saved, break_points_converted, total_points_won)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          match.id, match.player1_id, 
          Math.floor(Math.random() * 20) + 5, // aces
          Math.floor(Math.random() * 8) + 2,  // double faults
          Math.random() * 20 + 60,            // first serve %
          Math.random() * 20 + 70,            // first serve points won %
          Math.random() * 20 + 50,            // second serve points won %
          Math.random() * 30 + 60,            // break points saved %
          Math.random() * 30 + 30,            // break points converted %
          Math.floor(Math.random() * 50) + 80 // total points won
        ]);
        
        // Stats for player 2
        await client.query(`
          INSERT INTO match_stats (match_id, player_id, aces, double_faults, first_serve_percentage, first_serve_points_won, second_serve_points_won, break_points_saved, break_points_converted, total_points_won)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          match.id, match.player2_id,
          Math.floor(Math.random() * 20) + 5, // aces
          Math.floor(Math.random() * 8) + 2,  // double faults
          Math.random() * 20 + 60,            // first serve %
          Math.random() * 20 + 70,            // first serve points won %
          Math.random() * 20 + 50,            // second serve points won %
          Math.random() * 30 + 60,            // break points saved %
          Math.random() * 30 + 30,            // break points converted %
          Math.floor(Math.random() * 50) + 80 // total points won
        ]);
      }
      
      console.log(`✅ Inserted match statistics for ${matches.length * 2} players`);
    } finally {
      client.release();
    }
  }

  async insertRankings() {
    const client = await database.getClient();
    try {
      const playersResult = await client.query('SELECT id, name, current_ranking FROM players WHERE current_ranking > 0');
      const players = playersResult.rows;
      
      const rankingDate = '2024-01-01';
      
      for (const player of players) {
        await client.query(`
          INSERT INTO rankings (player_id, ranking, points, ranking_date)
          VALUES ($1, $2, $3, $4)
        `, [
          player.id, 
          player.current_ranking, 
          Math.floor(Math.random() * 5000) + 5000, // points
          rankingDate
        ]);
      }
      
      console.log(`✅ Inserted rankings for ${players.length} players`);
    } finally {
      client.release();
    }
  }
}

module.exports = new SeedData();
