-- ============================================================
-- PEARL Cloud — Import Endeavor Q1 & Q2 2026 scores
-- Run this in Supabase SQL Editor
-- ============================================================

-- Fixed UUIDs for assessors (placeholder accounts)
-- Ben's UUID comes from his real profile
-- Joe, Chris, Dan get placeholder UUIDs so scores are attributed correctly

do $$
declare
  -- Company & rounds (already seeded)
  v_company  uuid := 'c1000000-0000-0000-0000-000000000001';
  v_q1       uuid := 'b1000000-0000-0000-0000-000000000001';
  v_q2       uuid := 'b1000000-0000-0000-0000-000000000002';

  -- Manager UUIDs (already seeded)
  m1  uuid := 'a0000000-0000-0000-0000-000000000001'; -- Amber K
  m2  uuid := 'a0000000-0000-0000-0000-000000000002'; -- Lilly G
  m3  uuid := 'a0000000-0000-0000-0000-000000000003'; -- Shelley N
  m4  uuid := 'a0000000-0000-0000-0000-000000000004'; -- Katherine G
  m5  uuid := 'a0000000-0000-0000-0000-000000000005'; -- Charlene T
  m6  uuid := 'a0000000-0000-0000-0000-000000000006'; -- Arin Y
  m7  uuid := 'a0000000-0000-0000-0000-000000000007'; -- Shelly R
  m8  uuid := 'a0000000-0000-0000-0000-000000000008'; -- Landon S
  m9  uuid := 'a0000000-0000-0000-0000-000000000009'; -- Teresa G
  m10 uuid := 'a0000000-0000-0000-0000-000000000010'; -- Fird H
  m11 uuid := 'a0000000-0000-0000-0000-000000000011'; -- Rosie M
  m12 uuid := 'a0000000-0000-0000-0000-000000000012'; -- Liz G
  m13 uuid := 'a0000000-0000-0000-0000-000000000013'; -- Chase D

  -- Assessor UUIDs
  a_ben  uuid;  -- Ben's real UUID looked up from profiles
  a_joe  uuid := 'e2000000-0000-0000-0000-000000000002'; -- Joe Hunt
  a_chris uuid := 'e2000000-0000-0000-0000-000000000003'; -- Chris Rodgers
  a_dan  uuid := 'e2000000-0000-0000-0000-000000000004'; -- Dan Payne
  a_jeff uuid := 'e2000000-0000-0000-0000-000000000005'; -- Jeff Wiberg
  a_dave uuid := 'e2000000-0000-0000-0000-000000000006'; -- Dave Rodgers

begin
  -- Get Ben's real UUID
  select id into a_ben from profiles where email = 'benward4@gmail.com';

  -- ── Create placeholder auth users for Joe, Chris, Dan, Dave, Jeff ──
  insert into auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values
    (a_joe,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'joe.hunt@endeavor.internal', '', now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Joe Hunt"}', now(), now()),
    (a_chris,'00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'chris.rodgers@endeavor.internal', '', now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Chris Rodgers"}', now(), now()),
    (a_dan,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'dan.payne@endeavor.internal', '', now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Dan Payne"}', now(), now()),
    (a_jeff, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'jeff.wiberg@endeavor.internal', '', now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Jeff Wiberg"}', now(), now()),
    (a_dave, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'dave.rodgers@endeavor.internal', '', now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Dave Rodgers"}', now(), now())
  on conflict (id) do nothing;

  -- ── Create profiles for each assessor ──
  insert into profiles (id, full_name, email) values
    (a_joe,  'Joe Hunt',     'joe.hunt@endeavor.internal'),
    (a_chris,'Chris Rodgers','chris.rodgers@endeavor.internal'),
    (a_dan,  'Dan Payne',    'dan.payne@endeavor.internal'),
    (a_jeff, 'Jeff Wiberg',  'jeff.wiberg@endeavor.internal'),
    (a_dave, 'Dave Rodgers', 'dave.rodgers@endeavor.internal')
  on conflict (id) do update set full_name = excluded.full_name, email = excluded.email;

  -- ── Add all assessors to Endeavor company_members ──
  insert into company_members (company_id, user_id, role) values
    (v_company, a_joe,   'assessor'),
    (v_company, a_chris, 'assessor'),
    (v_company, a_dan,   'assessor'),
    (v_company, a_jeff,  'assessor'),
    (v_company, a_dave,  'assessor')
  on conflict do nothing;

  -- ================================================================
  -- Q1 2026 SCORES
  -- ================================================================

  -- Ben (a1) — Q1
  insert into scores (round_id, manager_id, assessor_id, p, e, a, r, l, rehire, team_type, notes) values
    (v_q1,m1, a_ben,4,6,5,1,4,'No','subtractor',''),
    (v_q1,m2, a_ben,7,8,8,7,7,'Yes','adder',''),
    (v_q1,m3, a_ben,6,6,7,7,7,'Yes','adder',''),
    (v_q1,m4, a_ben,8,8,8,8,8,'Yes','multiplier',''),
    (v_q1,m5, a_ben,7,9,7,7,5,'Yes','adder',''),
    (v_q1,m6, a_ben,7,8,8,8,6,'Yes','adder',''),
    (v_q1,m7, a_ben,7,8,7,8,5,'Yes','adder',''),
    (v_q1,m8, a_ben,7,7,8,6,6,'Yes','multiplier',''),
    (v_q1,m9, a_ben,6,7,6,7,4,'Yes','adder',''),
    (v_q1,m10,a_ben,6,6,6,6,6,'Yes','adder',''),
    (v_q1,m11,a_ben,6,6,6,6,6,'Yes','adder',''),
    (v_q1,m12,a_ben,6,6,6,6,6,'Yes','adder',''),
    (v_q1,m13,a_ben,6,7,7,6,5,'Yes','adder','')
  on conflict (round_id, manager_id, assessor_id) do update
    set p=excluded.p, e=excluded.e, a=excluded.a, r=excluded.r, l=excluded.l,
        rehire=excluded.rehire, team_type=excluded.team_type, notes=excluded.notes;

  -- Joe (a2) — Q1
  insert into scores (round_id, manager_id, assessor_id, p, e, a, r, l, rehire, team_type, notes) values
    (v_q1,m1, a_joe,3,5,3,2,3,'Maybe','subtractor','Would be a solid individual contributor if we had a spot and she''d take a pay cut.'),
    (v_q1,m2, a_joe,7,6,6,6,7,'Yes','adder',''),
    (v_q1,m3, a_joe,5,5,6,3,5,'Maybe','subtractor','Subtractor +'),
    (v_q1,m4, a_joe,9,9,9,9,8,'Yes','multiplier',''),
    (v_q1,m5, a_joe,6,7,5,7,5,'Yes','adder',''),
    (v_q1,m6, a_joe,6,5,6,6,7,'Yes','adder',''),
    (v_q1,m8, a_joe,8,8,7,6,8,'Yes','adder',''),
    (v_q1,m9, a_joe,6,4,6,7,6,'Yes','adder',''),
    (v_q1,m10,a_joe,5,5,5,5,5,'Maybe','subtractor','Too early to tell.'),
    (v_q1,m11,a_joe,6,6,6,6,7,'Yes','adder',''),
    (v_q1,m12,a_joe,5,5,5,5,5,'Yes','adder','Too early to tell.'),
    (v_q1,m13,a_joe,6,7,7,6,7,'Yes','adder','')
  on conflict (round_id, manager_id, assessor_id) do update
    set p=excluded.p, e=excluded.e, a=excluded.a, r=excluded.r, l=excluded.l,
        rehire=excluded.rehire, team_type=excluded.team_type, notes=excluded.notes;

  -- Chris (a3) — Q1
  insert into scores (round_id, manager_id, assessor_id, p, e, a, r, l, rehire, team_type, notes) values
    (v_q1,m1, a_chris,1,4,2,1,1,'No','subtractor',''),
    (v_q1,m2, a_chris,5,5,5,5,5,'Yes','adder',''),
    (v_q1,m3, a_chris,2,2,3,1,3,'No','subtractor','Wonderful, quiet, passive. Could be a solid contributor, not a strong leader.'),
    (v_q1,m4, a_chris,7,7,7,7,7,'Yes','adder',''),
    (v_q1,m5, a_chris,6,6,6,7,6,'Yes','adder',''),
    (v_q1,m6, a_chris,5,7,6,5,6,'Yes','adder','Build a development plan — what will it take to carry BD into the future?'),
    (v_q1,m8, a_chris,8,7,7,7,7,'Yes','adder',''),
    (v_q1,m9, a_chris,4,5,4,4,4,'No','subtractor','Help her find her groove and let her fly.'),
    (v_q1,m11,a_chris,5,4,4,5,5,'Yes','adder',''),
    (v_q1,m13,a_chris,4,5,5,4,5,'Yes','adder','')
  on conflict (round_id, manager_id, assessor_id) do update
    set p=excluded.p, e=excluded.e, a=excluded.a, r=excluded.r, l=excluded.l,
        rehire=excluded.rehire, team_type=excluded.team_type, notes=excluded.notes;

  -- Dan (a4) — Q1
  insert into scores (round_id, manager_id, assessor_id, p, e, a, r, l, rehire, team_type, notes) values
    (v_q1,m1, a_dan,4,7,2,3,4,'No','subtractor','Historical knowledge & effort are great — possibly another role at a pay cut, or part ways.'),
    (v_q1,m2, a_dan,7,6,6,3,6,'Yes','adder',''),
    (v_q1,m3, a_dan,5,5,5,3,4,'Maybe','subtractor','Need to set expectations.'),
    (v_q1,m4, a_dan,8,8,8,7,8,'Yes','multiplier',''),
    (v_q1,m5, a_dan,7,7,6,7,7,'Yes','multiplier',''),
    (v_q1,m6, a_dan,7,7,7,7,7,'Yes','multiplier',''),
    (v_q1,m7, a_dan,8,8,7,7,7,'Yes','multiplier',''),
    (v_q1,m8, a_dan,8,6,8,5,7,'Yes','adder',''),
    (v_q1,m9, a_dan,6,6,5,5,6,'Yes','adder',''),
    (v_q1,m10,a_dan,7,6,5,5,6,'Yes','adder','This is my estimate.'),
    (v_q1,m11,a_dan,7,7,5,5,6,'Yes','multiplier',''),
    (v_q1,m12,a_dan,6,6,5,5,5,'Maybe','adder','This is my estimate.'),
    (v_q1,m13,a_dan,6,4,5,4,5,'Yes','subtractor','Needs to be more assertive with better follow-up; build an ownership mindset.')
  on conflict (round_id, manager_id, assessor_id) do update
    set p=excluded.p, e=excluded.e, a=excluded.a, r=excluded.r, l=excluded.l,
        rehire=excluded.rehire, team_type=excluded.team_type, notes=excluded.notes;

  -- ================================================================
  -- Q2 2026 SCORES
  -- ================================================================

  -- Ben (a1) — Q2
  insert into scores (round_id, manager_id, assessor_id, p, e, a, r, l, rehire, team_type, notes) values
    (v_q2,m1, a_ben,5,7,6,2,5,'No','subtractor',''),
    (v_q2,m2, a_ben,8,9,9,8,8,'Yes','adder',''),
    (v_q2,m3, a_ben,7,7,8,8,8,'Yes','adder',''),
    (v_q2,m4, a_ben,9,9,9,9,9,'Yes','multiplier',''),
    (v_q2,m5, a_ben,8,10,8,8,6,'Yes','adder',''),
    (v_q2,m6, a_ben,8,9,9,9,7,'Yes','adder',''),
    (v_q2,m7, a_ben,8,9,8,9,6,'Yes','adder',''),
    (v_q2,m8, a_ben,8,8,9,7,7,'Yes','multiplier',''),
    (v_q2,m9, a_ben,7,8,7,8,5,'Yes','adder',''),
    (v_q2,m10,a_ben,7,7,7,7,7,'Yes','adder',''),
    (v_q2,m11,a_ben,7,7,7,7,7,'Yes','adder',''),
    (v_q2,m12,a_ben,7,7,7,7,7,'Yes','adder',''),
    (v_q2,m13,a_ben,7,8,8,7,6,'Yes','adder','')
  on conflict (round_id, manager_id, assessor_id) do update
    set p=excluded.p, e=excluded.e, a=excluded.a, r=excluded.r, l=excluded.l,
        rehire=excluded.rehire, team_type=excluded.team_type, notes=excluded.notes;

  -- Joe (a2) — Q2
  insert into scores (round_id, manager_id, assessor_id, p, e, a, r, l, rehire, team_type, notes) values
    (v_q2,m1, a_joe,4,6,4,3,4,'Maybe','subtractor','Would be a solid individual contributor if we had a spot and she''d take a pay cut.'),
    (v_q2,m2, a_joe,8,7,7,7,8,'Yes','adder',''),
    (v_q2,m3, a_joe,6,6,7,4,6,'Maybe','subtractor','Subtractor +'),
    (v_q2,m4, a_joe,10,10,10,10,9,'Yes','multiplier',''),
    (v_q2,m5, a_joe,7,8,6,8,6,'Yes','adder',''),
    (v_q2,m6, a_joe,7,6,7,7,8,'Yes','adder',''),
    (v_q2,m8, a_joe,9,9,8,7,9,'Yes','adder',''),
    (v_q2,m9, a_joe,7,5,7,8,7,'Yes','adder',''),
    (v_q2,m10,a_joe,6,6,6,6,6,'Maybe','subtractor','Too early to tell.'),
    (v_q2,m11,a_joe,7,7,7,7,8,'Yes','adder',''),
    (v_q2,m12,a_joe,6,6,6,6,6,'Yes','adder','Too early to tell.'),
    (v_q2,m13,a_joe,7,8,8,7,8,'Yes','adder','')
  on conflict (round_id, manager_id, assessor_id) do update
    set p=excluded.p, e=excluded.e, a=excluded.a, r=excluded.r, l=excluded.l,
        rehire=excluded.rehire, team_type=excluded.team_type, notes=excluded.notes;

  -- Chris (a3) — Q2
  insert into scores (round_id, manager_id, assessor_id, p, e, a, r, l, rehire, team_type, notes) values
    (v_q2,m1, a_chris,2,5,3,2,2,'No','subtractor',''),
    (v_q2,m2, a_chris,6,6,6,6,6,'Yes','adder',''),
    (v_q2,m3, a_chris,3,3,4,2,4,'No','subtractor','Wonderful, quiet, passive. Could be a solid contributor, not a strong leader.'),
    (v_q2,m4, a_chris,8,8,8,8,8,'Yes','adder',''),
    (v_q2,m5, a_chris,7,7,7,8,7,'Yes','adder',''),
    (v_q2,m6, a_chris,6,8,7,6,7,'Yes','adder','Build a development plan — what will it take to carry BD into the future?'),
    (v_q2,m8, a_chris,9,8,8,8,8,'Yes','adder',''),
    (v_q2,m9, a_chris,5,6,5,5,5,'No','subtractor','Help her find her groove and let her fly.'),
    (v_q2,m11,a_chris,6,5,5,6,6,'Yes','adder',''),
    (v_q2,m13,a_chris,5,6,6,5,6,'Yes','adder','')
  on conflict (round_id, manager_id, assessor_id) do update
    set p=excluded.p, e=excluded.e, a=excluded.a, r=excluded.r, l=excluded.l,
        rehire=excluded.rehire, team_type=excluded.team_type, notes=excluded.notes;

  -- Dan (a4) — Q2
  insert into scores (round_id, manager_id, assessor_id, p, e, a, r, l, rehire, team_type, notes) values
    (v_q2,m1, a_dan,5,8,3,4,5,'No','subtractor','Historical knowledge & effort are great — possibly another role at a pay cut, or part ways.'),
    (v_q2,m2, a_dan,8,7,7,4,7,'Yes','adder',''),
    (v_q2,m3, a_dan,6,6,6,4,5,'Maybe','subtractor','Need to set expectations.'),
    (v_q2,m4, a_dan,9,9,9,8,9,'Yes','multiplier',''),
    (v_q2,m5, a_dan,8,8,7,8,8,'Yes','multiplier',''),
    (v_q2,m6, a_dan,8,8,8,8,8,'Yes','multiplier',''),
    (v_q2,m7, a_dan,9,9,8,8,8,'Yes','multiplier',''),
    (v_q2,m8, a_dan,9,7,9,6,8,'Yes','adder',''),
    (v_q2,m9, a_dan,7,7,6,6,7,'Yes','adder',''),
    (v_q2,m10,a_dan,8,7,6,6,7,'Yes','adder','This is my estimate.'),
    (v_q2,m11,a_dan,8,8,6,6,7,'Yes','multiplier',''),
    (v_q2,m12,a_dan,7,7,6,6,6,'Maybe','adder','This is my estimate.'),
    (v_q2,m13,a_dan,7,5,6,5,6,'Yes','subtractor','Needs to be more assertive with better follow-up; build an ownership mindset.')
  on conflict (round_id, manager_id, assessor_id) do update
    set p=excluded.p, e=excluded.e, a=excluded.a, r=excluded.r, l=excluded.l,
        rehire=excluded.rehire, team_type=excluded.team_type, notes=excluded.notes;

end $$;
