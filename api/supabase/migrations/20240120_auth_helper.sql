-- Securely resolve email from username for login
create or replace function get_email_by_username(username_input text)
returns text
language plpgsql
security definer -- Runs with admin privileges to bypass RLS
as $$
declare
  found_email text;
begin
  select email into found_email
  from profiles
  where username = username_input;
  
  return found_email;
end;
$$;

-- Allow anonymous users (login screen) to call this function
grant execute on function get_email_by_username(text) to anon;
grant execute on function get_email_by_username(text) to authenticated;
grant execute on function get_email_by_username(text) to service_role;
