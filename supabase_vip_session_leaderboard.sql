-- 1. VIP & DAILY REWARDS
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS vip_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_daily_bonus TIMESTAMP WITH TIME ZONE;

-- 2. SINGLE DEVICE SESSION
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS active_session_id UUID;

-- 3. WEEKLY LEADERBOARD VIEW
-- Assuming 'bet_history' has 'user_id', 'total_win', 'total_bet', 'created_at'
DROP VIEW IF EXISTS public.weekly_leaderboard;
CREATE OR REPLACE VIEW public.weekly_leaderboard AS
SELECT 
    p.username,
    bh.user_id,
    SUM(bh.total_win - bh.total_bet) as net_profit,
    COUNT(bh.id) as total_games
FROM bet_history bh
JOIN profiles p ON bh.user_id = p.id
WHERE bh.created_at > (NOW() - INTERVAL '7 days')
GROUP BY bh.user_id, p.username
ORDER BY net_profit DESC;

-- Grant permissions (if RLS is enabled, ensure these are accessible)
GRANT SELECT ON public.weekly_leaderboard TO authenticated;
GRANT SELECT ON public.weekly_leaderboard TO anon;
