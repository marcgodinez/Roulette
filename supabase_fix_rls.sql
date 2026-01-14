-- FIX: Allow users to insert their own profile
-- This is required because the "self-healing" logic in the app needs to create a profile
-- if the initial registration trigger failed or if the user is legacy.

-- 1. Check if policy exists (optional, or just blindly create if we know it's missing)
-- We'll just create it. If it exists, this might error, so we can wrap in a DO block or just run the CREATE POLICY.
-- Since we can't easily check 'IF NOT EXISTS' for policies in standard SQL without complex queries,
-- we will just provide the command. If it fails saying it exists, that is fine (but it shouldn't exist based on previous file).

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- 2. Ensure Update permissions are also correct (they were in the previous file, but good to be sure)
-- (Already verified as present in previous steps, but re-asserting logic for completeness if needed)
-- create policy "Users can update own profile" on public.profiles ... (Skipping to avoid duplicates)
