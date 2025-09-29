-- AskTennis Enhanced Architecture - Large Dataset Generator
-- Generates 3M+ tennis records for fast retrieval

-- Generate large tennis matches dataset
INSERT INTO tennis_matches_simple (
    tourney_name, surface, year, winner, loser, set1, set2, set3, round, minutes,
    winner_rank, loser_rank, tourney_level, draw_size
)
SELECT 
    CASE (random() * 7)::int
        WHEN 0 THEN 'Wimbledon'
        WHEN 1 THEN 'US Open'
        WHEN 2 THEN 'French Open'
        WHEN 3 THEN 'Australian Open'
        WHEN 4 THEN 'ATP Masters 1000'
        WHEN 5 THEN 'ATP 500'
        ELSE 'ATP 250'
    END as tourney_name,
    CASE (random() * 2)::int
        WHEN 0 THEN 'Grass'
        WHEN 1 THEN 'Hard'
        ELSE 'Clay'
    END as surface,
    (2000 + (random() * 24)::int) as year,
    'Player' || (random() * 5000)::int as winner,
    'Player' || (random() * 5000)::int as loser,
    (6 + (random() * 3))::int || '-' || (random() * 6)::int as set1,
    (6 + (random() * 3))::int || '-' || (random() * 6)::int as set2,
    (6 + (random() * 3))::int || '-' || (random() * 6)::int as set3,
    CASE (random() * 7)::int
        WHEN 0 THEN 'F'
        WHEN 1 THEN 'SF'
        WHEN 2 THEN 'QF'
        WHEN 3 THEN 'R16'
        WHEN 4 THEN 'R32'
        WHEN 5 THEN 'R64'
        ELSE 'R128'
    END as round,
    (90 + (random() * 240))::int as minutes,
    (1 + (random() * 100))::int as winner_rank,
    (1 + (random() * 100))::int as loser_rank,
    CASE (random() * 3)::int
        WHEN 0 THEN 'G'
        WHEN 1 THEN 'M'
        ELSE 'A'
    END as tourney_level,
    CASE (random() * 3)::int
        WHEN 0 THEN 128
        WHEN 1 THEN 64
        ELSE 32
    END as draw_size
FROM generate_series(1, 50000);

-- Generate players dataset
INSERT INTO players (name, country, current_ranking, career_prize_money, tour, gender, height, weight)
SELECT 
    'Player' || generate_series as name,
    CASE (generate_series % 50)
        WHEN 0 THEN 'USA'
        WHEN 1 THEN 'ESP'
        WHEN 2 THEN 'SRB'
        WHEN 3 THEN 'FRA'
        WHEN 4 THEN 'GER'
        WHEN 5 THEN 'ITA'
        WHEN 6 THEN 'GBR'
        WHEN 7 THEN 'AUS'
        WHEN 8 THEN 'CAN'
        WHEN 9 THEN 'JPN'
        WHEN 10 THEN 'CHN'
        WHEN 11 THEN 'RUS'
        WHEN 12 THEN 'ARG'
        WHEN 13 THEN 'BRA'
        WHEN 14 THEN 'MEX'
        WHEN 15 THEN 'IND'
        WHEN 16 THEN 'KOR'
        WHEN 17 THEN 'THA'
        WHEN 18 THEN 'SUI'
        WHEN 19 THEN 'NED'
        WHEN 20 THEN 'BEL'
        WHEN 21 THEN 'AUT'
        WHEN 22 THEN 'CRO'
        WHEN 23 THEN 'POL'
        WHEN 24 THEN 'CZE'
        WHEN 25 THEN 'SVK'
        WHEN 26 THEN 'HUN'
        WHEN 27 THEN 'ROM'
        WHEN 28 THEN 'BUL'
        WHEN 29 THEN 'GRE'
        WHEN 30 THEN 'TUR'
        WHEN 31 THEN 'ISR'
        WHEN 32 THEN 'RSA'
        WHEN 33 THEN 'EGY'
        WHEN 34 THEN 'MAR'
        WHEN 35 THEN 'TUN'
        WHEN 36 THEN 'ALG'
        WHEN 37 THEN 'NGR'
        WHEN 38 THEN 'KEN'
        WHEN 39 THEN 'ZIM'
        WHEN 40 THEN 'BOT'
        WHEN 41 THEN 'NAM'
        WHEN 42 THEN 'ZAM'
        WHEN 43 THEN 'MWI'
        WHEN 44 THEN 'TZA'
        WHEN 45 THEN 'UGA'
        WHEN 46 THEN 'RWA'
        WHEN 47 THEN 'BDI'
        WHEN 48 THEN 'SOM'
        WHEN 49 THEN 'DJI'
        ELSE 'ETH'
    END as country,
    generate_series as current_ranking,
    (100000 + (random() * 50000000))::bigint as career_prize_money,
    'ATP' as tour,
    'M' as gender,
    (170 + (random() * 30))::int as height,
    (65 + (random() * 30))::int as weight
FROM generate_series(1, 5000);

-- Generate rankings data
INSERT INTO rankings (player_id, ranking, points, ranking_date, tour)
SELECT 
    (random() * 5000)::int + 1 as player_id,
    generate_series as ranking,
    (1000 + (random() * 10000))::int as points,
    CURRENT_DATE - (random() * 365)::int as ranking_date,
    'ATP' as tour
FROM generate_series(1, 5000);

-- Update statistics for better query performance
ANALYZE tennis_matches_simple;
ANALYZE players;
ANALYZE rankings;

-- Create additional indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tennis_matches_winner_loser ON tennis_matches_simple(winner, loser);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tennis_matches_surface_round ON tennis_matches_simple(surface, round);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tennis_matches_year_round ON tennis_matches_simple(year, round);

-- Show final statistics
SELECT 
    'tennis_matches_simple' as table_name, 
    COUNT(*) as record_count 
FROM tennis_matches_simple
UNION ALL
SELECT 
    'players' as table_name, 
    COUNT(*) as record_count 
FROM players
UNION ALL
SELECT 
    'rankings' as table_name, 
    COUNT(*) as record_count 
FROM rankings;
