-- FIX: Add missing 'last_daily_bonus' column to profiles
-- This column is required for the daily bonus logic to work.

-- Using a DO block to safely add the column only if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'last_daily_bonus') then
        alter table public.profiles add column last_daily_bonus timestamp with time zone;
    end if;
end $$;
