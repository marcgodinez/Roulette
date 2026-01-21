-- Create League Tiers Enum
CREATE TYPE league_tier AS ENUM ('IRON', 'BRONZE', 'SILVER', 'GOLD', 'DIAMOND');

-- League Entries Table
CREATE TABLE IF NOT EXISTS league_entries (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    tier league_tier DEFAULT 'IRON',
    division INTEGER DEFAULT 4, -- 4 is lowest, 1 is highest
    weekly_profit BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE league_entries ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public Read Access" ON league_entries
    FOR SELECT USING (true);

CREATE POLICY "Service Role Update" ON league_entries
    FOR ALL USING (auth.role() = 'service_role');

-- Index for fast leaderboard lookups
CREATE INDEX idx_league_entries_tier_division_profit 
ON league_entries (tier, division, weekly_profit DESC);
