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

## 7. Share pages (link previews), added 2026-08-26

`p/<ref>.html` is one static stub per PUBLISHED, non-off-market listing (ref = first 8 hex of the
listing id, the same ref `/properties?ref=` uses). It exists only so a shared link unfurls with the
listing's own title, cover photo and a "Cascais · €650.000 · 3 bed · 2 bath · 127 m² · Energy class B-"
line (energy class is mandatory in every advertisement, DL 101-D/2020). The stub is `noindex` and
JS-redirects visitors to `/properties?ref=<ref>`, which opens the listing. The public "Copy link"
button in the listing modal copies `/p/<ref>` when the stub exists, else the always-valid `?ref=` link.

- Generator: `node backend/build-share-pages.mjs` (`--self-check` runs its unit check). Rebuilds `p/`
  from scratch from the anon API, so unpublished/deleted listings lose their stub. Fails closed: a
  fetch error leaves the existing stubs untouched and the run red.
- Automation: `.github/workflows/share-pages.yml` runs it every 15 min and pushes to `main` only when
  `p/` changed (GitHub Pages redeploys on that push). Manual run: Actions tab → share-pages → Run
  workflow. GitHub auto-disables schedules after 60 days without repo activity: if previews stop
  updating, re-enable it from the Actions tab.
- New listing → its preview link exists within ~15 min. Until then "Copy link" hands out the `?ref=`
  link (works, generic preview).
- Off-market listings never get a stub (the repo is public); they keep `/off-market?ref=`.
- Listing titles: no street numbers, no owner or family names. Stubs are committed to a PUBLIC repo
  and cannot be removed from git history (counsel 2026-08-26). To truly retract a photo, delete it in
  the admin (§6); unpublishing only hides the row and drops the stub on the next run.
- The preview image is the listing's first photo at its public storage URL (same retraction caveat
  as §6). WhatsApp/Facebook cache previews per URL for days: after changing a cover photo the card
  can show the old image until their cache expires (Facebook Sharing Debugger can force a rescrape).
