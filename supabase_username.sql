-- 1. Add Username Column to Profiles
-- Using a DO block to safely add the column if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'username') then
        alter table public.profiles add column username text unique;
    end if;
end $$;


-- 2. Drop Old Views (to allow type changes)
drop view if exists public.weekly_leaderboard;
drop view if exists public.legendary_wins;


-- 3. Recreate Weekly Leaderboard with Username
create or replace view public.weekly_leaderboard as
select 
  coalesce(p.username, 'Anonymous') as username, -- Fallback for old users
  sum(bh.total_win - bh.total_bet) as total_profit
from public.bet_history bh
join public.profiles p on bh.user_id = p.id
where bh.created_at > (now() - interval '7 days')
group by p.id, p.username -- Group by ID to handle same usernames if uniqueness failed, but mostly for correctness
having sum(bh.total_win - bh.total_bet) > 0
order by total_profit desc;

grant select on public.weekly_leaderboard to authenticated;
grant select on public.weekly_leaderboard to anon;


-- 4. Recreate Legendary Wins with Username
create or replace view public.legendary_wins as
select 
  coalesce(p.username, 'Anonymous') as username,
  bh.total_win as max_win,
  bh.winning_number,
  bh.is_fire,
  bh.multiplier,
  bh.created_at
from public.bet_history bh
join public.profiles p on bh.user_id = p.id
where bh.total_win > 0
order by bh.total_win desc;

grant select on public.legendary_wins to authenticated;
grant select on public.legendary_wins to anon;


-- 5. Update Profile Trigger to Capture Username
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, credits)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'username', -- Extract username from metadata
    1000
  );
  return new;
exception when others then
  raise warning 'Profile creation failed for user %: %', new.id, SQLERRM;
  return new;
end;
$$ language plpgsql security definer;
