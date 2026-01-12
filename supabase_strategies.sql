-- 0. CLEANUP (Drops existing tables/triggers to ensure fresh schema)
-- NOTE: CASCADE on tables will drop their triggers automatically
drop trigger if exists on_auth_user_created on auth.users;

drop function if exists public.seed_user_history();
drop function if exists public.handle_new_user();

drop table if exists public.bet_history cascade;
drop table if exists public.saved_strategies cascade;
drop table if exists public.profiles cascade;


-- 1. PROFILES TABLE & SETUP
create table public.profiles (
  id uuid not null references auth.users on delete cascade primary key,
  email text,
  credits numeric default 1000,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Function to handle new user signup (Auth -> Profile)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, credits)
  values (new.id, new.email, 1000);
  return new;
exception when others then
  raise warning 'Profile creation failed for user %: %', new.id, SQLERRM;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. SAVED STRATEGIES
create table public.saved_strategies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  bet_data jsonb not null,
  color_code text default '#FFD700',
  total_cost numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table saved_strategies enable row level security;

create policy "Users can select their own strategies"
  on saved_strategies for select using (auth.uid() = user_id);

create policy "Users can insert their own strategies"
  on saved_strategies for insert with check (auth.uid() = user_id);

create policy "Users can delete their own strategies"
  on saved_strategies for delete using (auth.uid() = user_id);


-- 3. BET HISTORY
create table public.bet_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  winning_number integer not null,
  is_fire boolean default false,
  multiplier integer,
  bet_details jsonb,
  total_bet numeric default 0,
  total_win numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table bet_history enable row level security;

create policy "Users can select their own history"
  on bet_history for select using (auth.uid() = user_id);

create policy "Users can insert their own history"
  on bet_history for insert with check (auth.uid() = user_id);


-- 4. HISTORY SEEDING (Robust)
create or replace function public.seed_user_history()
returns trigger as $$
begin
  -- Use a block to catch errors and prevent blocking signup
  begin
    insert into public.bet_history (user_id, winning_number, is_fire, multiplier, total_bet, total_win)
    select 
      NEW.id,
      floor(random() * 37)::int,
      (random() > 0.8),
      case when random() > 0.8 then (array[50, 100, 200])[floor(random()*3 + 1)] else null end,
      0,
      0
    from generate_series(1, 100);
  exception when others then
    -- Suppress error to allow profile creation to succeed
    raise warning 'Seeding history failed for user %: %', NEW.id, SQLERRM;
  end;
  return NEW;
end;
$$ language plpgsql security definer;

-- Trigger on public.profiles
create trigger on_profile_created_seed_history
  after insert on public.profiles
  for each row execute procedure public.seed_user_history();