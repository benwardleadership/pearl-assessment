-- ============================================================
-- PEARL Cloud — Prompt 6 migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add email column to profiles so we can look up users by email
alter table profiles add column if not exists email text;

-- Populate email for existing users
update profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- Update the trigger to also store email on new signups
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Function: look up a profile by email (called from the client)
create or replace function get_profile_by_email(p_email text)
returns table(id uuid, full_name text, email text, global_role text)
language sql security definer stable as $$
  select id, full_name, email, global_role
  from profiles
  where lower(email) = lower(p_email);
$$;

-- Allow super-admin to read all profiles (for the Clients dashboard)
drop policy if exists "super-admin reads all profiles" on profiles;
create policy "super-admin reads all profiles" on profiles
  for select using (is_super_admin() or id = auth.uid());
