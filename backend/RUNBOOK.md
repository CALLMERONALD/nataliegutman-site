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
BEFORE first deploy: `001-init.sql` may be edited + re-run (idempotent, tracks live truth).
AFTER first deploy: 001 is frozen — every change is a new numbered `00N-*.sql` delta; always end with
`NOTIFY pgrst, 'reload schema';`. PostgREST exposure lives in `/docker/supabase/.env`
`PGRST_DB_SCHEMAS` (backup `.env` first; `docker compose up -d rest` after edits).

## 4. Backups / limits
- DB: nightly `pg_dumpall` on the VPS (03:30, 7-day rotation) covers `natalie.*` rows.
- Storage FILES: added to the same nightly script 2026-07-29 (`storage_*.tar.gz` of
  `/docker/supabase/volumes/storage`, 7-day rotation; run once and verified).
  Off-site copies + restore drill are tracked in ISSUES.md.
- Bucket hard limits: JPEG only, ≤5 MB/object (enforced server-side).

## 6. Known limits (security review 2026-08-02 — Fable + Codex gpt-5.6-sol)

**Unpublishing does NOT retract already-public photos.** The `natalie-properties` bucket is
public (`001-init.sql` 104-107), so any photo URL that was visible while a listing was published
keeps working after unpublish — the DB row becomes invisible, the image file does not. Object keys
are random UUIDs and anon has no storage SELECT policy, so keys can't be discovered or listed;
this only affects URLs someone already captured. **To truly retract an image, delete the photo
from the listing in the admin** (that deletes the storage object), don't just unpublish.

**Admin anti-clickjacking is enforced client-side.** GitHub Pages cannot send `X-Frame-Options`
or `frame-ancestors`, so `admin.html` hides its UI via `html.framed body {display:none}` plus a
top-frame check in the inline head script and in `admin.js init()`. If the site ever moves behind
a proxy/CDN, add the real header and keep the JS as belt-and-braces.

**Verified sound (live probes 2026-08-02):** anon cannot read drafts (0 rows), cannot INSERT (401),
cannot upload (403 RLS), cannot list the bucket (`[]`), cannot reach other schemas (404/406), and
GoTrue self-signup is disabled (`signup_disabled`). RLS — not the client-side JWT check — is the
boundary, and it holds. Natalie's password is therefore the whole admin security boundary: keep it
strong and unique.
