-- FIX: Change FK to reference 'profiles' (public) instead of 'auth.users' (hidden)
-- This allows PostgREST to see the relationship for joins.

BEGIN;

-- 1. Drop old constraint
ALTER TABLE league_entries
DROP CONSTRAINT IF EXISTS league_entries_user_id_fkey;

-- 2. Add new constraint referencing profiles
ALTER TABLE league_entries
ADD CONSTRAINT league_entries_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

COMMIT;
