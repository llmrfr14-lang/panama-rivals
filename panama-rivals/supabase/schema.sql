-- Panamá Rivals — Supabase schema (run in the SQL editor)

create table if not exists registrations (
  id text primary key,
  team_name text not null,
  captain jsonb not null,
  players jsonb not null default '[]',
  division text not null default 'challenger',
  group_id text,
  status text not null default 'pending',
  created_at bigint not null
);

-- Idempotent upgrades for tables created from an earlier schema version
-- (create table if not exists alone won't add columns to existing tables)
alter table registrations add column if not exists division text not null default 'challenger';
alter table registrations add column if not exists status text not null default 'pending';

-- captain was originally text; convert to jsonb so the contact object survives round-trips
alter table registrations alter column captain type jsonb using case
  when captain is null then '{}'::jsonb
  when left(btrim(captain::text), 1) = '{' then captain::jsonb
  else jsonb_build_object('discord', btrim(captain::text))
end;

-- Matches: group stage + knockout bracket (QF/SF/final), with check-in and FF fields
create table if not exists matches (
  id text primary key,
  stage text not null,
  group_id text,
  home_team_id text,
  away_team_id text,
  home_score int not null default 0,
  away_score int not null default 0,
  status text not null default 'scheduled',
  stats jsonb not null default '[]',
  scheduled_at bigint,
  checked_in text,
  ff_winner text
);

-- Idempotent upgrades for the matches table (bracket/check-in/FF columns)
alter table matches add column if not exists scheduled_at bigint;
alter table matches add column if not exists checked_in text;
alter table matches add column if not exists ff_winner text;
alter table matches add column if not exists ff_deadline bigint;


create table if not exists submissions (
  id text primary key,
  match_id text not null references matches(id),
  submitted_by text not null,
  home_score int not null,
  away_score int not null,
  stats jsonb not null default '[]',
  status text not null default 'pending',
  note text,
  photo text,
  replay text,
  created_at bigint not null
);

-- Idempotent upgrades for older tables
alter table submissions add column if not exists photo text;
alter table submissions add column if not exists replay text;

-- Read access is public (standings/stats pages), writes go through the anon key
-- with RLS locked to the service role in production; for a community league,
-- anon insert/update is acceptable and keeps the pipeline friction-free.
alter table registrations enable row level security;
alter table matches enable row level security;
alter table submissions enable row level security;

-- Drop policies first so this script is idempotent (safe to re-run)
drop policy if exists "public read registrations" on registrations;
drop policy if exists "public read matches" on matches;
drop policy if exists "public read submissions" on submissions;
drop policy if exists "anon insert registrations" on registrations;
drop policy if exists "anon update registrations" on registrations;
drop policy if exists "anon delete registrations" on registrations;
drop policy if exists "anon insert matches" on matches;
drop policy if exists "anon update matches" on matches;
drop policy if exists "anon delete matches" on matches;
drop policy if exists "anon insert submissions" on submissions;
drop policy if exists "anon update submissions" on submissions;
drop policy if exists "anon delete submissions" on submissions;

-- Explicit grants (new Supabase projects no longer auto-grant anon CRUD
-- on raw-SQL tables; without these, write/delete silently fail)
grant usage on schema public to anon;
grant select, insert, update, delete on registrations to anon;
grant select, insert, update, delete on matches to anon;
grant select, insert, update, delete on submissions to anon;
create policy "public read registrations" on registrations for select using (true);
create policy "public read matches" on matches for select using (true);
create policy "public read submissions" on submissions for select using (true);

-- Delete policies so admin can remove test registrations/stale rows through the anon client
create policy "anon delete registrations" on registrations for delete using (true);
create policy "anon delete matches" on matches for delete using (true);
create policy "anon delete submissions" on submissions for delete using (true);
create policy "anon insert registrations" on registrations for insert with check (true);
create policy "anon update registrations" on registrations for update using (true);
create policy "anon insert matches" on matches for insert with check (true);
create policy "anon update matches" on matches for update using (true);
create policy "anon insert submissions" on submissions for insert with check (true);
create policy "anon update submissions" on submissions for update using (true);

-- Realtime so every browser sees registrations/results live
-- (Postgres has no ADD TABLE IF NOT EXISTS; ignore the duplicate-object error)
do $$ begin
  alter publication supabase_realtime add table registrations;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table matches;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table submissions;
exception when duplicate_object then null; end $$;

-- ── Server-side bracket regeneration watchdog ──
-- The client generates brackets locally the first time a division's group
-- stage completes. This tiny table persists "needs regen" in the cloud so:
--  1. Admins don't have to remember to regenerate after edits;
--  2. Every device sees the SAME decision (no one's localStorage wins>);
--  3. No edge function / secret wiring required.


create table if not exists bracket_state (
  key text primary key,

  value jsonb not null default '{}'::jsonb,
  updated_at bigint not null default (extract(epoch from now())) * 1000
);


alter table bracket_state enable row level security;


drop policy if exists "public read bracket_state" on bracket_state;
drop policy if exists "anon update bracket_state" on bracket_state;


grant usage on schema public to anon;
grant select, update on bracket_state to anon;


create policy "public read bracket_state" on bracket_state for select using (true);
create policy "anon update bracket_state" on bracket_state for update using (true);


do $$ begin
  alter publication supabase_realtime add table bracket_state;
exception when duplicate_object then null; end $$;


-- Flip the watchdog flag when a division's group stage completes.


create or replace function bracket_flag_bracket_regen() returns trigger language plpgsql as $$
begin
  if tg_table_name = 'matches' and new.status = 'approved' and new.stage = 'group' then
    insert into bracket_state(key, value, updated_at)
    values ('bracket-regen-' || new.group_id, '{}'::jsonb, (extract(epoch from now())) * 1000)
    on conflict (key) do update set updated_at = (extract(epoch from now())) * 1000;
    return new;
  end if;


  return new;
end $$;


drop trigger if exists bracket_state_regen on matches;


create trigger bracket_state_regen after update of status on matches
for each row execute function bracket_flag_bracket_regen();
