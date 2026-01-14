-- 1. WEEKLY LEADERBOARD VIEW
-- Aggregates net profit (Win - Bet) for the last 7 days per user.
create or replace view public.weekly_leaderboard as
select 
  p.email,
  sum(bh.total_win - bh.total_bet) as total_profit
from public.bet_history bh
join public.profiles p on bh.user_id = p.id
where bh.created_at > (now() - interval '7 days')
group by p.email
having sum(bh.total_win - bh.total_bet) > 0
order by total_profit desc;

-- Grant access to authenticated users
grant select on public.weekly_leaderboard to authenticated;
grant select on public.weekly_leaderboard to anon;


-- 2. LEGENDARY WINS VIEW
-- Lists the highest single wins of all time.
drop view if exists public.legendary_wins;
create or replace view public.legendary_wins as
select 
  p.email,
  bh.total_win as max_win,
  bh.winning_number,
  bh.is_fire,
  bh.multiplier,
  bh.created_at
from public.bet_history bh
join public.profiles p on bh.user_id = p.id
where bh.total_win > 0
order by bh.total_win desc;

-- Grant access to authenticated users
grant select on public.legendary_wins to authenticated;
grant select on public.legendary_wins to anon;
