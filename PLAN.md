# PLAN — Property Listings + Admin

Rocks in dependency order. UI-SPEC.md is binding for all markup/design. VTO.md holds scope.

## Rock 0 — Supabase infra (Fable, not Codex — needs VPS network access)
Schema `natalie`; table `natalie.properties`:
`id uuid pk default gen_random_uuid(), title text not null, location_area text not null, price integer null, status text not null default 'available' check (status in ('available','under_offer','sold')), type text not null default 'apartment' check (type in ('apartment','house','villa','townhouse','penthouse','plot','commercial')), bedrooms int, bathrooms int, area_built int, area_plot int, floor text, year_built int, energy_rating text, description text, amenities jsonb not null default '[]', photos jsonb not null default '[]', featured boolean not null default false, published boolean not null default false, created_at timestamptz default now(), updated_at timestamptz default now()`.
RLS ON: SELECT for anon/authenticated where `published = true` OR `auth.jwt()->>'email' = 'natalichn@gmail.com'`; INSERT/UPDATE/DELETE only for that email. Expose schema in PostgREST (`PGRST_DB_SCHEMAS += natalie`) + grants. Storage bucket `natalie-properties` (public read; insert/update/delete only that email). GoTrue user `natalichn@gmail.com` with generated password (email_confirm true).
**Proof:** `curl {SUPABASE_URL}/rest/v1/properties?select=id -H "apikey: {anon}" -H "Accept-Profile: natalie"` → `200 []`; anonymous INSERT → 401/403; password login → access_token; authed INSERT+DELETE roundtrip → 201/204.

## Rock 1 — Public portfolio (Codex)
Files: NEW `assets/portfolio.js` (API wrapper + card/modal/teaser rendering + icon map), NEW `properties.html`, EDIT `index.html` (teaser section + hero CTA retarget), EDIT nav on ALL 11 html pages (desktop + mobile lists: `Portfolio` between Sell and Calculators).
Plain `fetch` only (no supabase-js): GET `${SUPABASE_URL}/rest/v1/properties?published=eq.true&order=created_at.desc` with `apikey` + `Accept-Profile: natalie` headers. Config consts (SUPABASE_URL, ANON_KEY) at top of portfolio.js. Escape ALL user-content strings into DOM via textContent / attribute-safe building (description, title etc. are Natalie's content but treat as untrusted).
**Proof (offline, Codex):** `node --check assets/portfolio.js`; `grep -c 'Portfolio' *.html` shows nav on 11 pages; properties.html contains `id="property-grid"`, `id="properties-empty"`, `id="property-modal"`. **Proof (Fable, networked):** Playwright — seeded property renders card on properties.html; card click opens modal w/ gallery; homepage teaser visible with featured seed; empty-DB state hides teaser + shows empty line (tested by filtering to zero with a bogus query? no — verified pre-seed).

## Rock 2 — Admin (Codex)
Files: NEW `admin.html` (self-contained: markup + inline JS or paired `assets/admin.js` — Integrator's call), reusing icon map from portfolio.js is fine.
Auth: POST `${SUPABASE_URL}/auth/v1/token?grant_type=password` (headers apikey); keep `access_token` + `refresh_token` in sessionStorage; on 401 mid-session try one refresh (`grant_type=refresh_token`) then force re-login. Sign out clears storage.
CRUD via PostgREST with `Authorization: Bearer` + `Content-Profile: natalie`; uploads via Storage REST `POST /storage/v1/object/natalie-properties/{uuid}.jpg` (downscaled canvas JPEG), public URL = `/storage/v1/object/public/natalie-properties/{name}`. Delete property also best-effort deletes its photos from storage.
Guard rails: `updated_at` set on update; never trust local state after save — re-fetch list. `<meta name="robots" content="noindex,nofollow">`.
**Proof (offline, Codex):** `node --check` on JS; admin.html contains login form + all UI-SPEC §6 fields; grep confirms no service_role key anywhere. **Proof (Fable):** Playwright — login with real creds, create property with photo upload, toggle published, verify it appears on properties.html, edit price, delete test row; wrong-password login shows error, logged-out state can't reach the form.

## Rock 3 — Seed + sitemap/robots touch-up (Codex, small)
Seed script `docs/seed-properties.mjs` (node, reads creds from env, inserts 2 tasteful sample listings using existing `assets/photos/guide-*.jpg` copied to bucket) — Fable runs it. properties.html added to `sitemap.xml`; `admin.html` Disallow line in `robots.txt`.
**Proof:** script idempotent (skips if titles exist); sitemap valid XML (xmllint or node parse).

## Out of scope (Issues List candidates)
Filters/sorting UI, per-property share pages/SEO, image CDN/derivatives, drag-drop photo reorder, audit log, rate limiting.
