-- 002 — off-market listings (2026-08-03). Rerunnable.
--
-- Adds the off_market flag. A published + off_market row is hidden from the public
-- portfolio (properties.html and the index.html featured teaser filter it out) and
-- rendered only on the unlinked, noindex off-market.html page that Natalie shares
-- by link.
--
-- Deliberately NO RLS change: off-market rows stay published=true and readable with
-- the anon key. Michael's call 2026-08-03 — the link is unlisted, not secret; real
-- gating (token-checked RPC) can be added later without touching this column.
--
-- Apply BEFORE deploying the site update: the public pages start filtering on
-- off_market=eq.false, which 400s while the column is missing.

alter table natalie.properties
  add column if not exists off_market boolean not null default false;

NOTIFY pgrst, 'reload schema';
