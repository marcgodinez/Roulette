-- 1. EXTEND PROFILES
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS xp BigInt DEFAULT 0,
ADD COLUMN IF NOT EXISTS vip_level Integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_session_id UUID;

-- 2. VIP LEVELS
CREATE TABLE IF NOT EXISTS vip_levels (
    level Integer PRIMARY KEY,
    xp_required BigInt NOT NULL,
    label Text NOT NULL,
    bonus_multiplier Float DEFAULT 1.0
);

-- Seed VIP Levels (Example)
INSERT INTO vip_levels (level, xp_required, label, bonus_multiplier) VALUES
(1, 0, 'Bronze', 1.0),
(2, 1000, 'Silver', 1.05),
(3, 5000, 'Gold', 1.1),
(4, 20000, 'Platinum', 1.2),
(5, 50000, 'Diamond', 1.3),
(6, 100000, 'Master', 1.5),
(7, 250000, 'Grandmaster', 1.8),
(8, 1000000, 'Legend', 2.0),
(9, 5000000, 'Mythic', 2.5),
(10, 10000000, 'Oracle', 3.0)
ON CONFLICT (level) DO NOTHING;

-- 3. GAME SESSIONS
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    started_at Timestamp With Time Zone DEFAULT now(),
    ended_at Timestamp With Time Zone,
    initial_balance BigInt DEFAULT 0,
    final_balance BigInt DEFAULT 0,
    total_wagered BigInt DEFAULT 0,
    net_profit BigInt DEFAULT 0
);

-- 4. WEEKLY LEADERBOARD (View)
DROP VIEW IF EXISTS weekly_leaderboard;
CREATE OR REPLACE VIEW weekly_leaderboard AS
SELECT 
    p.username,
    p.id as user_id,
    SUM(bh.total_win - bh.total_bet) as total_profit,
    COUNT(bh.id) as total_games
FROM bet_history bh
JOIN profiles p ON bh.user_id = p.id
WHERE bh.created_at >= date_trunc('week', now()) 
GROUP BY p.id, p.username
ORDER BY total_profit DESC;

-- 5. LEGENDARY WINS (View)
DROP VIEW IF EXISTS legendary_wins;
CREATE OR REPLACE VIEW legendary_wins AS
SELECT 
    bh.id,
    p.username,
    bh.winning_number,
    bh.is_fire,
    bh.total_win as max_win,
    (bh.total_win / NULLIF(bh.total_bet, 0)) as multiplier,
    bh.created_at
FROM bet_history bh
JOIN profiles p ON bh.user_id = p.id
WHERE bh.total_win > 0
ORDER BY bh.total_win DESC
LIMIT 50;
