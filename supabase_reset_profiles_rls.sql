-- FIX: Complete reset of Profiles RLS
-- This script drops all existing policies for 'profiles' and re-creates them cleanly.
-- This solves "Ghost Rows" where a user has a row but cannot SELECT it.

-- 1. Drop EVERYTHING related to profiles security
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Enable users to view their own data only" on public.profiles;

-- 2. Make sure RLS is enabled
alter table public.profiles enable row level security;

-- 3. Re-create CLEAN policies

-- SELECT: Verify the ID matches the Auth UID
create policy "Profiles_Select_Own"
  on public.profiles
  for select
  using (auth.uid() = id);

-- INSERT: Verify the ID matches the Auth UID (Prevents creating for others)
create policy "Profiles_Insert_Own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- UPDATE: Verify the ID matches the Auth UID
create policy "Profiles_Update_Own"
  on public.profiles
  for update
  using (auth.uid() = id);

-- 4. Grant access to public/anon (Standard Supabase requirement for API access)
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.profiles to anon;

-- Done!
