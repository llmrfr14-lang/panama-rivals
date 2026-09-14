-- Migration: unblock match approvals blocked by the bracket_state trigger.
--
-- Problem: the bracket_state_regen trigger (see schema.sql) runs inside the
-- anonymous client's connection when a group match becomes "approved". It does
--
--   insert into bracket_state(key, value, updated_at) values (...)
--   on conflict (key) do update ...
--
-- bracket_state only grants anon SELECT/UPDATE, so the INSERT path raises
-- 42501 "new row violates row-level security policy" and rolls back the entire
-- match UPDATE. Every approval therefore "succeeded" in the admin UI while the
-- matches row stayed pending_review — so standings/points/bracket never moved.
--
-- Fix: run the function as its owner (SECURITY DEFINER). The trigger remains
-- exactly as before; only the privilege boundary changes.
--
-- How to apply: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- (This only needs `create or replace function`; no owner/permissions change.)

create or replace function bracket_flag_bracket_regen() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'matches' and new.status = 'approved' and new.stage = 'group' then
    insert into bracket_state(key, value, updated_at)
    values ('bracket-regen-' || new.group_id, '{}'::jsonb, (extract(epoch from now())) * 1000)
    on conflict (key) do update set updated_at = (extract(epoch from now())) * 1000;
    return new;
  end if;

  return new;
end $$;