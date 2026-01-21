-- Function to handle Weekly League Resets
-- calculates promotions/demotions and resets profit to 0.

CREATE OR REPLACE FUNCTION reset_weekly_leagues()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Use a CTE to calculate ranks and new positions
    WITH ranked_users AS (
        SELECT 
            user_id,
            tier,
            division,
            weekly_profit,
            rank() OVER (PARTITION BY tier, division ORDER BY weekly_profit DESC) as pos,
            count(*) OVER (PARTITION BY tier, division) as cohort_size
        FROM league_entries
    ),
    updates AS (
        SELECT
            user_id,
            -- PROMOTION (Pos <= 10)
            CASE 
                WHEN pos <= 10 THEN
                    CASE 
                        WHEN division > 1 THEN division - 1              -- IV -> III
                        WHEN division = 1 AND tier = 'IRON' THEN 4       -- Iron I -> Bronze IV
                        WHEN division = 1 AND tier = 'BRONZE' THEN 4     -- Bronze I -> Silver IV
                        WHEN division = 1 AND tier = 'SILVER' THEN 4     -- Silver I -> Gold IV
                        WHEN division = 1 AND tier = 'GOLD' THEN 4       -- Gold I -> Diamond IV
                        ELSE division                                    -- Diamond I Stays
                    END
                -- DEMOTION (Bottom 10, only if cohort has > 15 players to avoid auto-demotion in small leagues)
                WHEN pos > (cohort_size - 10) AND cohort_size >= 15 THEN
                    CASE
                        WHEN division < 4 THEN division + 1              -- I -> II
                        WHEN division = 4 AND tier = 'DIAMOND' THEN 1    -- Diamond IV -> Gold I
                        WHEN division = 4 AND tier = 'GOLD' THEN 1       -- Gold IV -> Silver I
                        WHEN division = 4 AND tier = 'SILVER' THEN 1     -- Silver IV -> Bronze I
                        WHEN division = 4 AND tier = 'BRONZE' THEN 1     -- Bronze IV -> Iron I
                        ELSE division                                    -- Iron IV Stays
                    END
                ELSE division
            END as new_division,
            
            CASE 
                WHEN pos <= 10 THEN
                   CASE 
                        WHEN division > 1 THEN tier
                        WHEN division = 1 AND tier = 'IRON' THEN 'BRONZE'::league_tier
                        WHEN division = 1 AND tier = 'BRONZE' THEN 'SILVER'::league_tier
                        WHEN division = 1 AND tier = 'SILVER' THEN 'GOLD'::league_tier
                        WHEN division = 1 AND tier = 'GOLD' THEN 'DIAMOND'::league_tier
                        ELSE tier
                   END
                WHEN pos > (cohort_size - 10) AND cohort_size >= 15 THEN
                    CASE
                        WHEN division < 4 THEN tier
                        WHEN division = 4 AND tier = 'DIAMOND' THEN 'GOLD'::league_tier
                        WHEN division = 4 AND tier = 'GOLD' THEN 'SILVER'::league_tier
                        WHEN division = 4 AND tier = 'SILVER' THEN 'BRONZE'::league_tier
                        WHEN division = 4 AND tier = 'BRONZE' THEN 'IRON'::league_tier
                        ELSE tier
                    END
                ELSE tier
            END as new_tier

        FROM ranked_users
    )
    UPDATE league_entries le
    SET 
        tier = u.new_tier,
        division = u.new_division,
        weekly_profit = 0, -- RESET PROFIT
        updated_at = now()
    FROM updates u
    WHERE le.user_id = u.user_id;

END;
$$;
