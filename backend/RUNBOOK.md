# Backend runbook — Natalie property listings

Backend = self-hosted Supabase on the Vandale VPS (`supabase.vandalesolutions.com`).
Schema `natalie`, bucket `natalie-properties`. Frontend uses ONLY the public anon key
(RLS is the security boundary). Secrets & admin credentials: project `.env.local` (gitignored).

## 1. User bootstrap (done 2026-07-29)
Public signup is disabled instance-wide (`GOTRUE_DISABLE_SIGNUP`; `/auth/v1/signup` → 422).
Admin user is provisioned via the service-role admin API (on the VPS):
```
SERVICE_KEY=$(grep '^SERVICE_ROLE_KEY=' /docker/supabase/.env | cut -d= -f2)
curl -X POST http://localhost:8000/auth/v1/admin/users \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"email":"natalichn@gmail.com","password":"<NEW>","email_confirm":true}'
```
Current user id (bound in all RLS policies): `696378f9-f9f9-4a72-8f5d-66ec03a09312`.
If the account is ever recreated, the id changes → write a NEW numbered migration
(`00N-rebind-uid.sql`) that re-creates the uid-bound policies with the new value; after first
deploy, `001-init.sql` is frozen history (during this initial unreleased cycle it tracks live truth).

## 2. Password reset (Natalie forgot it)
```
curl -X PUT http://localhost:8000/auth/v1/admin/users/696378f9-f9f9-4a72-8f5d-66ec03a09312 \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H 'Content-Type: application/json' -d '{"password":"<NEW>"}'
```
Hand over out-of-band (never email the password together with the URL). Update `.env.local`.

## 3. Schema changes
Edit + re-run `001-init.sql` (idempotent), or apply deltas as `00N-*.sql`; always end with
`NOTIFY pgrst, 'reload schema';`. PostgREST exposure lives in `/docker/supabase/.env`
`PGRST_DB_SCHEMAS` (backup `.env` first; `docker compose up -d rest` after edits).

## 4. Backups / limits
- DB: nightly `pg_dumpall` on the VPS (03:30, 7-day rotation) covers `natalie.*` rows.
- Storage FILES: added to the same nightly script 2026-07-29 (`storage_*.tar.gz` of
  `/docker/supabase/volumes/storage`, 7-day rotation; run once and verified).
  Off-site copies + restore drill are tracked in ISSUES.md.
- Bucket hard limits: JPEG only, ≤5 MB/object (enforced server-side).
