-- ============================================================
-- PEARL Cloud — full schema + RLS + seed data
-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)
-- ============================================================

-- ── Tables ──────────────────────────────────────────────────

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  global_role text not null default 'member'
              check (global_role in ('super_admin','member')),
  created_at  timestamptz not null default now()
);

create table if not exists companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text,
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);

create table if not exists company_members (
  company_id  uuid not null references companies(id) on delete cascade,
  user_id     uuid not null references profiles(id)  on delete cascade,
  role        text not null default 'assessor'
              check (role in ('client_admin','assessor','viewer')),
  created_at  timestamptz not null default now(),
  primary key (company_id, user_id)
);

create table if not exists rounds (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references companies(id) on delete cascade,
  name        text not null default 'New Review Round',
  round_date  date not null default current_date,
  created_at  timestamptz not null default now()
);

create table if not exists managers (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references companies(id) on delete cascade,
  name        text not null,
  title       text not null default '',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists round_participants (
  round_id    uuid not null references rounds(id)   on delete cascade,
  manager_id  uuid not null references managers(id) on delete cascade,
  primary key (round_id, manager_id)
);

create table if not exists scores (
  id            uuid primary key default gen_random_uuid(),
  round_id      uuid not null references rounds(id)     on delete cascade,
  manager_id    uuid not null references managers(id)   on delete cascade,
  assessor_id   uuid not null references profiles(id)   on delete cascade,
  p smallint check (p between 1 and 10),
  e smallint check (e between 1 and 10),
  a smallint check (a between 1 and 10),
  r smallint check (r between 1 and 10),
  l smallint check (l between 1 and 10),
  rehire        text  check (rehire in ('Yes','Maybe','No')),
  team_type     text  check (team_type in ('divider','subtractor','adder','multiplier')),
  notes         text  not null default '',
  updated_at    timestamptz not null default now(),
  unique (round_id, manager_id, assessor_id)
);

-- indexes
create index if not exists idx_company_members_user    on company_members (user_id);
create index if not exists idx_rounds_company          on rounds   (company_id);
create index if not exists idx_managers_company        on managers  (company_id);
create index if not exists idx_scores_round            on scores    (round_id);
create index if not exists idx_scores_assessor         on scores    (assessor_id);

-- ── Helper functions ─────────────────────────────────────────

create or replace function is_super_admin() returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and global_role = 'super_admin'
  );
$$;

create or replace function is_company_member(cid uuid) returns boolean
language sql security definer stable as $$
  select is_super_admin() or exists (
    select 1 from company_members
    where company_id = cid and user_id = auth.uid()
  );
$$;

create or replace function is_company_admin(cid uuid) returns boolean
language sql security definer stable as $$
  select is_super_admin() or exists (
    select 1 from company_members
    where company_id = cid and user_id = auth.uid() and role = 'client_admin'
  );
$$;

-- ── Row-Level Security ───────────────────────────────────────

alter table profiles           enable row level security;
alter table companies          enable row level security;
alter table company_members    enable row level security;
alter table rounds             enable row level security;
alter table managers           enable row level security;
alter table round_participants enable row level security;
alter table scores             enable row level security;

-- profiles
drop policy if exists "read own profile"   on profiles;
drop policy if exists "update own profile" on profiles;
create policy "read own profile"   on profiles for select using (id = auth.uid() or is_super_admin());
create policy "update own profile" on profiles for update using (id = auth.uid());

-- super-admin can insert profiles (needed when creating users)
drop policy if exists "super-admin insert profile" on profiles;
create policy "super-admin insert profile" on profiles for insert with check (is_super_admin() or id = auth.uid());

-- companies
drop policy if exists "members read company"        on companies;
drop policy if exists "admins write company"        on companies;
drop policy if exists "super-admin creates company" on companies;
create policy "members read company"        on companies for select using (is_company_member(id));
create policy "admins write company"        on companies for update using (is_company_admin(id)) with check (is_company_admin(id));
create policy "super-admin creates company" on companies for insert with check (is_super_admin());
create policy "super-admin deletes company" on companies for delete using (is_super_admin());

-- company_members
drop policy if exists "members read membership"  on company_members;
drop policy if exists "admins manage membership" on company_members;
create policy "members read membership"  on company_members for select using (is_company_member(company_id));
create policy "admins manage membership" on company_members for all using (is_super_admin()) with check (is_super_admin());

-- rounds
drop policy if exists "members read rounds" on rounds;
drop policy if exists "admins write rounds" on rounds;
create policy "members read rounds" on rounds for select using (is_company_member(company_id));
create policy "admins write rounds" on rounds for all using (is_company_admin(company_id)) with check (is_company_admin(company_id));
create policy "super-admin write rounds" on rounds for all using (is_super_admin()) with check (is_super_admin());

-- managers
drop policy if exists "members read managers" on managers;
drop policy if exists "admins write managers" on managers;
create policy "members read managers" on managers for select using (is_company_member(company_id));
create policy "admins write managers" on managers for all using (is_company_admin(company_id)) with check (is_company_admin(company_id));
create policy "super-admin write managers" on managers for all using (is_super_admin()) with check (is_super_admin());

-- round_participants
drop policy if exists "members read participants" on round_participants;
drop policy if exists "admins write participants" on round_participants;
create policy "members read participants" on round_participants for select
  using (is_company_member((select company_id from rounds where id = round_id)));
create policy "super-admin write participants" on round_participants for all
  using (is_super_admin()) with check (is_super_admin());

-- scores
drop policy if exists "members read scores"        on scores;
drop policy if exists "assessor writes own scores" on scores;
drop policy if exists "assessor updates own scores" on scores;
drop policy if exists "assessor deletes own scores" on scores;
create policy "members read scores" on scores for select
  using (is_company_member((select company_id from rounds where id = round_id)));
create policy "assessor writes own scores" on scores for insert
  with check (
    assessor_id = auth.uid()
    and is_company_member((select company_id from rounds where id = round_id))
  );
create policy "assessor updates own scores" on scores for update
  using (assessor_id = auth.uid()) with check (assessor_id = auth.uid());
create policy "assessor deletes own scores" on scores for delete
  using (assessor_id = auth.uid());
create policy "super-admin write scores" on scores for all using (is_super_admin()) with check (is_super_admin());

-- ── Trigger: auto-create profile on signup ───────────────────

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Seed: Endeavor demo company ─────────────────────────────
-- This inserts the sample data so the app has something to show
-- after you sign in. Uses fixed UUIDs so it's idempotent.

do $$
declare
  v_company_id  uuid := 'c1000000-0000-0000-0000-000000000001';
  v_round_q1    uuid := 'b1000000-0000-0000-0000-000000000001';
  v_round_q2    uuid := 'b1000000-0000-0000-0000-000000000002';

  -- manager IDs
  m1  uuid := 'a0000000-0000-0000-0000-000000000001';
  m2  uuid := 'a0000000-0000-0000-0000-000000000002';
  m3  uuid := 'a0000000-0000-0000-0000-000000000003';
  m4  uuid := 'a0000000-0000-0000-0000-000000000004';
  m5  uuid := 'a0000000-0000-0000-0000-000000000005';
  m6  uuid := 'a0000000-0000-0000-0000-000000000006';
  m7  uuid := 'a0000000-0000-0000-0000-000000000007';
  m8  uuid := 'a0000000-0000-0000-0000-000000000008';
  m9  uuid := 'a0000000-0000-0000-0000-000000000009';
  m10 uuid := 'a0000000-0000-0000-0000-000000000010';
  m11 uuid := 'a0000000-0000-0000-0000-000000000011';
  m12 uuid := 'a0000000-0000-0000-0000-000000000012';
  m13 uuid := 'a0000000-0000-0000-0000-000000000013';
begin
  -- company
  insert into companies (id, name) values (v_company_id, 'Endeavor')
  on conflict (id) do nothing;

  -- rounds
  insert into rounds (id, company_id, name, round_date) values
    ('b1000000-0000-0000-0000-000000000001', v_company_id, 'Q1 2026 Review', '2026-01-15'),
    ('b1000000-0000-0000-0000-000000000002', v_company_id, 'Q2 2026 Review', '2026-04-15')
  on conflict (id) do nothing;

  -- managers
  insert into managers (id, company_id, name, title) values
    (m1,  v_company_id, 'Amber K',     'Operations Manager'),
    (m2,  v_company_id, 'Lilly G',     'Team Lead'),
    (m3,  v_company_id, 'Shelley N',   'Team Lead'),
    (m4,  v_company_id, 'Katherine G', 'Sales Director'),
    (m5,  v_company_id, 'Charlene T',  'Team Lead'),
    (m6,  v_company_id, 'Arin Y',      'Business Development'),
    (m7,  v_company_id, 'Shelly R',    'Team Lead'),
    (m8,  v_company_id, 'Landon S',    'Sales Manager'),
    (m9,  v_company_id, 'Teresa G',    'Team Lead'),
    (m10, v_company_id, 'Fird H',      'Team Lead'),
    (m11, v_company_id, 'Rosie M',     'Team Lead'),
    (m12, v_company_id, 'Liz G',       'Team Lead'),
    (m13, v_company_id, 'Chase D',     'Account Manager')
  on conflict (id) do nothing;

  -- round participants (same roster both rounds)
  insert into round_participants (round_id, manager_id) values
    (v_round_q1,m1),(v_round_q1,m2),(v_round_q1,m3),(v_round_q1,m4),(v_round_q1,m5),
    (v_round_q1,m6),(v_round_q1,m7),(v_round_q1,m8),(v_round_q1,m9),(v_round_q1,m10),
    (v_round_q1,m11),(v_round_q1,m12),(v_round_q1,m13),
    (v_round_q2,m1),(v_round_q2,m2),(v_round_q2,m3),(v_round_q2,m4),(v_round_q2,m5),
    (v_round_q2,m6),(v_round_q2,m7),(v_round_q2,m8),(v_round_q2,m9),(v_round_q2,m10),
    (v_round_q2,m11),(v_round_q2,m12),(v_round_q2,m13)
  on conflict do nothing;

end $$;
