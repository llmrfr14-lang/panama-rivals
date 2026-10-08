-- ═══════════════════════════════════════════════════════════════════════════
-- Panamá Rivals — Setup de Temporada 3 (idempotente)
--
-- Pegá TODO esto en Supabase → SQL Editor → Run. Es seguro correrlo varias
-- veces (usa "if not exists" / "drop policy if exists" / "create or replace").
--
-- Qué arregla respecto a la Temporada 2:
--   1. Aprobaciones que "funcionaban" en el admin pero el partido se quedaba
--      en pending_review: el trigger de bracket_state corría como el rol anon
--      (solo SELECT/UPDATE) y su INSERT fallaba con 42501, revirtiendo todo el
--      UPDATE. Se recrea con SECURITY DEFINER.
--   2. El botón "Cerrar Temporada 2" no borraba del todo: faltaban permisos de
--      DELETE sobre bracket_state, así que archiveSeason devolvía error y no
--      limpiaba. Se agregan grant + policy de DELETE.
--   3. Orden de juego (jornada) persistente: columna matches.round_number.
--   4. Escrituras anon completas en registrations/matches/submissions.
--
-- Al final hay un bloque OPCIONAL para vaciar los datos de la Temporada 2 y
-- arrancar la Temporada 3 en limpio (descomentá una vez si lo querés).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Registros de equipos ────────────────────────────────────────────────────
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

-- Upgrades idempotentes (create table if not exists no agrega columnas nuevas)
alter table registrations add column if not exists division text not null default 'challenger';
alter table registrations add column if not exists status text not null default 'pending';

-- captain era text; convertir a jsonb para conservar el objeto de contacto
alter table registrations alter column captain type jsonb using case
  when captain is null then '{}'::jsonb
  when left(btrim(captain::text), 1) = '{' then captain::jsonb
  else jsonb_build_object('discord', btrim(captain::text))
end;

-- ── Partidos: fase de grupos + bracket (QF/SF/final) ────────────────────────
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
  ff_winner text,
  round_number int
);

alter table matches add column if not exists scheduled_at bigint;
alter table matches add column if not exists ff_winner text;
-- Jornada (round-robin): los partidos de la misma ronda no chocan para un equipo.
alter table matches add column if not exists round_number int;

-- ── Reportes de resultados (con evidencia) ──────────────────────────────────
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

alter table submissions add column if not exists photo text;
alter table submissions add column if not exists replay text;

-- ── Watchdog de bracket (flag "necesita regenerar" compartido) ──────────────
create table if not exists bracket_state (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at bigint not null default (extract(epoch from now())) * 1000
);

-- ── RLS + permisos ──────────────────────────────────────────────────────────
-- Lectura pública (standings/stats) y escritura anon para una liga comunitaria.
alter table registrations enable row level security;
alter table matches enable row level security;
alter table submissions enable row level security;
alter table bracket_state enable row level security;

-- Recrear policies para que el script sea idempotente
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
drop policy if exists "public read bracket_state" on bracket_state;
drop policy if exists "anon update bracket_state" on bracket_state;
drop policy if exists "anon insert bracket_state" on bracket_state;
drop policy if exists "anon delete bracket_state" on bracket_state;

-- Grants explícitos (proyectos nuevos de Supabase ya no autoconceden CRUD anon)
grant usage on schema public to anon;
grant select, insert, update, delete on registrations to anon;
grant select, insert, update, delete on matches to anon;
grant select, insert, update, delete on submissions to anon;
-- bracket_state: el INSERT lo hace el trigger (definer); el cliente solo limpia.
grant select, delete on bracket_state to anon;

create policy "public read registrations" on registrations for select using (true);
create policy "public read matches" on matches for select using (true);
create policy "public read submissions" on submissions for select using (true);
create policy "anon insert registrations" on registrations for insert with check (true);
create policy "anon update registrations" on registrations for update using (true);
create policy "anon delete registrations" on registrations for delete using (true);
create policy "anon insert matches" on matches for insert with check (true);
create policy "anon update matches" on matches for update using (true);
create policy "anon delete matches" on matches for delete using (true);
create policy "anon insert submissions" on submissions for insert with check (true);
create policy "anon update submissions" on submissions for update using (true);
create policy "anon delete submissions" on submissions for delete using (true);
create policy "public read bracket_state" on bracket_state for select using (true);
-- Sin INSERT para anon a propósito: solo el trigger (SECURITY DEFINER) escribe.
create policy "anon delete bracket_state" on bracket_state for delete using (true);

-- ── Trigger: marca "necesita regenerar" cuando se completa un grupo ─────────
-- SECURITY DEFINER: el UPDATE del partido lo hace anon, y este trigger inserta
-- en bracket_state. Sin definer, ese INSERT falla con 42501 y revierte la
-- aprobación completa (el bug de la Temporada 2).
create or replace function bracket_flag_bracket_regen() returns trigger
language plpgsql security definer set search_path = public as $$
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

-- ── Realtime (ignorá el error de "duplicate_object" si ya estaba) ───────────
do $$ begin alter publication supabase_realtime add table registrations; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table matches; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table submissions; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table bracket_state; exception when duplicate_object then null; end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- OPCIONAL — Arrancar la Temporada 3 en limpio (una sola vez)
-- Descomentá estas 4 líneas y corré el script para borrar los datos de la
-- Temporada 2 en la nube. También podés usar el botón del panel /admin
-- ("Cerrar Temporada 2 y abrir Temporada 3"), que hace lo mismo.
-- ═══════════════════════════════════════════════════════════════════════════
-- delete from submissions;
-- delete from matches;
-- delete from registrations;
-- delete from bracket_state;
