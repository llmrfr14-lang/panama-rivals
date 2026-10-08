-- Migration: group-stage matchday ordering (jornada).
--
-- Problem: group matches were created without any play order, so a team could
-- be booked against two different opponents in the same time slot. The client
-- now generates a round-robin with a `round` (jornada) per pairing; this adds
-- the column that stores it so every device shows the same order.
--
-- How to apply: Supabase Dashboard → SQL Editor → New query → paste → Run.

alter table matches add column if not exists round_number int;
