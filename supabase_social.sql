-- Enable Read Access for All Users on bet_history
-- This allows Supabase Realtime to broadcast INSERT events to clients.
-- Clients will receive the raw INSERT payload (including user_id).
-- Privacy: bet_history only contains user_id, not email/username. Client resolves username separately.

-- 1. Drop existing policy if it conflicts (or create new one).
-- Existing policy: "Users can select their own history" -> (auth.uid() = user_id)
-- We want to ADD a policy or Update it. Since Policies are OR'd, we can add a new one.

create policy "Enable public read access for feed"
  on public.bet_history
  for select
  using (true); -- Allow everyone to select

-- Note: You must enable "Realtime" replication for the 'bet_history' table in Supabase Dashboard -> Database -> Replication.
-- Only tables with Replication enabled will emit events.
