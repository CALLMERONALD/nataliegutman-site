-- 003-sort-order.sql — manual display ordering for listings (idempotent; applied 2026-08-19)
-- Run as: docker exec -i supabase-db psql -U postgres -v ON_ERROR_STOP=1 < 003-sort-order.sql
-- After: NOTIFY pgrst, 'reload schema';
--
-- Nullable on purpose: rows with NULL sort to the end (nullslast) by created_at,
-- so existing listings keep their old order until Natalie first uses the arrows,
-- which materialize 0..n-1 and then swap neighbours. RLS/grants already cover the
-- column (table-level policies + grants from 001).

begin;
alter table natalie.properties add column if not exists sort_order integer;
commit;

NOTIFY pgrst, 'reload schema';
