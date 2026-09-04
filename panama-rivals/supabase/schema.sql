-- Panamá Rivals — Supabase schema (run in the SQL editor)

create table if not exists registrations (
  id text primary key,
  team_name text not null,
  captain text not null,
  players jsonb not null default '[]',
  division text not null default 'challenger',
  group_id text,
  status text not null default 'pending',
  created_at bigint not null
);

create table if not exists matches (
  id text primary key,
  stage text not null,
  group_id text,
  home_team_id text,
  away_team_id text,
  home_score int not null default 0,
  away_score int not null default 0,
  status text not null default 'scheduled',
  stats jsonb not null default '[]'
);

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
  created_at bigint not null
);

-- Read access is public (standings/stats pages), writes go through the anon key
-- with RLS locked to the service role in production; for a community league,
-- anon insert/update is acceptable and keeps the pipeline friction-free.
alter table registrations enable row level security;
alter table matches enable row level security;
alter table submissions enable row level security;

create policy "public read registrations" on registrations for select using (true);
create policy "public read matches" on matches for select using (true);
create policy "public read submissions" on submissions for select using (true);

create policy "anon insert registrations" on registrations for insert with check (true);
create policy "anon update registrations" on registrations for update using (true);
create policy "anon insert matches" on matches for insert with check (true);
create policy "anon update matches" on matches for update using (true);
create policy "anon insert submissions" on submissions for insert with check (true);
create policy "anon update submissions" on submissions for update using (true);

-- Realtime so every browser sees registrations/results live
alter publication supabase_realtime add table registrations;
alter publication supabase_realtime add table matches;
alter publication supabase_realtime add table submissions;
