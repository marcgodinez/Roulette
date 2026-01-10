-- Create the saved_strategies table
create table if not exists saved_strategies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  bet_data jsonb not null, -- Stores the object of bets: { "1": 10, "RED": 50 }
  color_code text default '#FFD700',
  total_cost numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table saved_strategies enable row level security;

-- Policy for users to manage their own strategies
create policy "Users can select their own strategies"
on saved_strategies for select
using (auth.uid() = user_id);

create policy "Users can insert their own strategies"
on saved_strategies for insert
with check (auth.uid() = user_id);

create policy "Users can delete their own strategies"
on saved_strategies for delete
using (auth.uid() = user_id);
