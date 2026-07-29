# SAME-PAGE-LOG — Property portfolio + admin

## Round 1 (2026-07-29)
### Integrator findings (Codex gpt-5.6-sol @ xhigh, verbatim)
- [CLARIFY] The sole writer address `natalichn@gmail.com` differs from Natalie’s public business identity, and every automated proof could pass even if it is a typo -> Confirm the exact login email before creating the user or policies.
- [KILL] Publishing fabricated “sample listings” with reused guide photos risks presenting nonexistent inventory as real -> Replace production seeding with a fixed-ID transient E2E fixture that is deleted after testing.
- [KILL] Adding `admin.html` to `robots.txt` advertises the URL and can prevent crawlers from seeing its `noindex` directive -> Keep the page unlinked with `noindex,nofollow` and omit the Disallow rule. [Google guidance](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
- [KILL] Storage `UPDATE` permission is unused because uploads have immutable UUID names and photo reordering changes only database JSON -> Grant only bucket-scoped INSERT and DELETE.
- [FIX] Rock 0 exists only as prose, so one VPS can pass curl while the schema, grants, triggers, and policies remain unreproducible -> Commit an idempotent versioned SQL migration plus a separate user-bootstrap runbook.
- [FIX] Authorizing by an email JWT claim couples access to mutable, potentially stale profile data -> Bind table and storage policies to Natalie’s immutable user UUID via `auth.uid()`. [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [FIX] Storage policies are global on `storage.objects`, but the plan does not explicitly require `bucket_id = 'natalie-properties'` -> Scope every storage mutation policy to both Natalie’s UUID and the exact bucket. [Storage access-control guidance](https://supabase.com/docs/guides/storage/security/access-control)
- [FIX] The database accepts blank titles, negative facts, non-array JSON, unknown amenities, and published rows without photos -> Add server-side CHECK constraints and prevent publication until required content and at least one valid photo exist.
- [FIX] Client-supplied `updated_at` permits incorrect timestamps and misses writes outside this UI -> Set it with a database `BEFORE UPDATE` trigger and make both timestamps non-null.
- [FIX] Self-hosted GoTrue defaults to allowing signups while password-endpoint throttling is explicitly deferred -> Disable signup and unused providers after provisioning Natalie, then configure and prove IP-based `/auth/v1/token` throttling. [GoTrue configuration](https://github.com/supabase/auth) and [rate-limit guidance](https://supabase.com/docs/guides/auth/rate-limits)
- [FIX] Direct curl and non-production Playwright runs do not prove that GitHub Pages can reach the VPS through HTTPS and browser preflights -> Require an HTTPS Supabase URL and smoke-test REST, Auth, and Storage from `https://nataliegutman.com`.
- [FIX] Admin CRUD specifies `Content-Profile` for every verb and omits the Data API key, so reads can target the wrong schema and gateway authentication can fail -> Send `apikey` plus bearer auth, use `Accept-Profile` for GET/HEAD, and use `Content-Profile` plus JSON content type for mutations. [PostgREST schema headers](https://docs.postgrest.org/en/v10/api.html#switching-schemas) and [Supabase request flow](https://supabase.com/docs/guides/self-hosting/self-hosted-auth-keys)
- [FIX] Refresh tokens are single-use, but the plan does not require storing the newly returned token pair or serializing concurrent refreshes -> Atomically replace both tokens, allow one shared refresh operation, and force an expired-token E2E case. [Supabase session behavior](https://supabase.com/docs/guides/auth/sessions)
- [FIX] Clearing `sessionStorage` does not revoke the server-side refresh session -> Call GoTrue logout before local cleanup and prove the old refresh token can no longer mint a session.
- [FIX] A generated admin password without a secure delivery, change, and recovery procedure can leave Natalie dependent on the VPS operator -> Add a credential handoff and password-reset runbook before launch.
- [FIX] Database rows and Storage objects cannot be committed atomically, so partial upload, save, edit, or delete failures can create broken listings or orphans -> Upload first, compensate new uploads if the row write fails, update the row before deleting removed photos, and delete the row before best-effort object cleanup.
- [FIX] The plan defines public photo URLs but not a canonical stored representation, making deletion and domain changes brittle -> Store bucket object keys in `photos` and derive public URLs centrally.
- [FIX] Unbounded `image/*` input can decode enormous or unsupported files before downscaling and can fill the public bucket -> Set an agreed photo-count cap, validate type/size/dimensions, process sequentially, and enforce JPEG MIME and size limits on the bucket.
- [DEFER] Re-fetching after save does not prevent last-write-wins overwrites from two tabs -> Add optimistic concurrency using the prior `updated_at` value to the Issues List.
- [FIX] Tailwind scans only `./*.html` while dynamic card and modal classes live in JavaScript, and the current CSS lacks required utilities such as `w-[18px]`, `bg-ink/85`, and `duration-700` -> Add `./assets/*.js` to the content glob, rebuild CSS, and assert computed styles in-browser.
- [FIX] Clickable articles, image thumbnails, and arrow/X controls are specified as mouse targets rather than fully operable controls -> Use real buttons with visible focus, accessible names, dialog labelling, keyboard activation, and focus restoration.
- [FIX] Ten non-wrapping amenity icons, an unrestricted thumbnail strip, and the single-line admin row can overflow narrow screens -> Add wrapping or horizontal scrolling and a stacked mobile admin layout, then test at 320px.
- [FIX] The accent color is only 3.14:1 against white while `more-link` text is approximately 11px -> Keep small CTA text ink-colored or introduce a darker token meeting 4.5:1.
- [CLARIFY] Nullable bedrooms, bathrooms, and built area conflict with the card’s mandatory three-fact row for plot and commercial listings -> Should unset facts disappear, and should plots substitute `area_plot` for built area?
- [CLARIFY] Native `pt-PT` formatting produces `1 250 000 €`, conflicting with the binding example `€1.250.000` -> Which exact output wins, and should implementation use a custom formatter?
- [FIX] Fetch failure and a genuinely empty portfolio deliberately render the same message, allowing CORS, RLS, or backend outages to masquerade as no inventory -> Add a distinct error state and operational logging while retaining the empty state only for a successful zero-row response.
- [FIX] The self-hosted backend has no acceptance criteria for backups, restoreability, persistence, or health monitoring -> Require automated database and storage backups, a restore drill, and alerts for Auth, PostgREST, and Storage health. [Self-hosting responsibilities](https://supabase.com/docs/guides/self-hosting)
- [FIX] “Enquire about this property” links to a generic contact form that loses the listing identity -> Pass a stable property ID/title in the URL and prefill the contact message.
- [FIX] The hero label still promises “Services & Portfolio” after its target is changed to the portfolio alone -> Rename it to an accurate portfolio CTA.
- [FIX] `properties.html` is added to the sitemap without an explicit indexable head, so copied `noindex` metadata or a missing canonical can ship unnoticed -> Specify canonical, description, Open Graph, and `index,follow`, then prove the deployed URL is present, returns 200, and is indexable.
- [FIX] `grep -c 'Portfolio' *.html` succeeds when only one file matches and does not prove both navigation lists or their ordering -> Parse every page and assert exactly one desktop and one mobile `properties.html` link between Sell and Calculators.
- [FIX] Grepping for plaintext `service_role` cannot detect an encoded service-role JWT committed as the frontend key -> Decode the legacy JWT payload and assert `role=anon`, or reject any secret-key format.
- [FIX] The RLS proof tests anonymous denial and Natalie’s success but would pass if every authenticated account could write -> Test published/unpublished visibility and table/storage CRUD with a second authenticated user that must be denied.
- [FIX] Safe seeded strings do not prove the promised untrusted-content handling -> Add a hostile title, description, location, and malformed JSON fixture and assert literal rendering with no executable DOM.
VERDICT: NOT YET
### Visionary response (Fable)
- ACCEPTED (1 CLARIFY, answered): `natalichn@gmail.com` was typed explicitly by Michael in the Grill — confirmed correct; user + policies created against it. No change.
- ACCEPTED (2 KILL, modified): no fabricated PUBLIC listings — Rock 3 seeds 2 DRAFT rows (published=false) as worked examples in admin only; E2E uses transient fixtures deleted after. PLAN Rock 3 rewritten.
- ACCEPTED (3 KILL): robots.txt Disallow for admin.html dropped; noindex meta only, unlinked. PLAN Rock 2/3.
- ACCEPTED (4 KILL): storage UPDATE policy dropped on the VPS; INSERT/DELETE only. Applied + in backend/001-init.sql.
- ACCEPTED (5 FIX): Rock 0 now committed as idempotent backend/001-init.sql + backend/RUNBOOK.md (bootstrap, password reset, backups).
- ACCEPTED (6 FIX): all table+storage policies rebound to auth.uid() = Natalie's immutable UUID. Applied on VPS + migration.
- ACCEPTED (7 FIX): storage policies explicitly scope bucket_id (they already did; now explicit in the committed migration).
- ACCEPTED (8 FIX): DB CHECKs added — non-blank title/location, non-negative facts, year range, amenity whitelist, array types, publish requires ≥1 photo + description. Applied.
- ACCEPTED (9 FIX): updated_at BEFORE-UPDATE trigger, server-owned; client never sends it. Applied.
- ACCEPTED (10 FIX, partial): signup already disabled instance-wide since 2026-06-21 — proof added and RUN (`/auth/v1/signup` → 422). Token-endpoint throttling proof DEFERRED → ISSUES.md.
- ACCEPTED (11 FIX, modified): local Playwright origin (localhost:8091) is cross-origin to the Supabase domain → real CORS/preflight exercised pre-deploy; post-deploy smoke from nataliegutman.com added to ship checklist in PLAN.
- ACCEPTED (12 FIX): header contract fixed in PLAN — apikey always; Accept-Profile on GET, Content-Profile + JSON content type on mutations.
- ACCEPTED (13 FIX): refresh = single-flight, atomically store NEW token pair, one retry; expired-path E2E via revoked-session case (14) rather than waiting out expiry.
- ACCEPTED (14 FIX): sign out calls /auth/v1/logout before clearing storage; proof asserts old refresh token can no longer mint a session.
- ACCEPTED (15 FIX): credential handoff + reset runbook in backend/RUNBOOK.md; password delivered out-of-band by Michael.
- ACCEPTED (16 FIX): orphan-safe ordering prescribed in PLAN Rock 2 (upload→row w/ compensation; row-before-photo-delete; row-delete-before-cleanup).
- ACCEPTED (17 FIX): photos store object KEYS; photoUrl() derives public URLs centrally.
- ACCEPTED (18 FIX): 12-photo cap, type/size validation (reject >20MB), sequential uploads, bucket enforces JPEG-only ≤5MB server-side. Applied bucket limits.
- DEFERRED (19): optimistic concurrency → ISSUES.md (single editor today).
- ACCEPTED (20 FIX): tailwind content glob += ./assets/*.js; computed-style assertions in my Playwright pass.
- ACCEPTED (21 FIX): UI-SPEC §8 — real buttons, focus ring, aria-labelled dialog, focus return, keyboard operability.
- ACCEPTED (22 FIX): UI-SPEC §8 — wrapping amenity row, scrolling thumb strip, stacked admin rows, 320px test gate.
- ACCEPTED (23 FIX, scoped): no NEW small accent text (UI-SPEC §8); site-wide accent contrast is pre-existing brand → ISSUES.md for Natalie's sign-off.
- ANSWERED (24 CLARIFY): unset facts disappear; plot/commercial fall back to area_plot with the area icon. UI-SPEC §7.
- ANSWERED (25 CLARIFY): `€1.250.000` wins; custom formatter, no Intl. UI-SPEC §7.
- ACCEPTED (26 FIX): distinct error vs empty states + console.error. UI-SPEC §7 / PLAN Rock 1.
- ACCEPTED (27 FIX, partial): DB rows covered by existing nightly pg_dumpall (verified in RUNBOOK); storage-volume backup + health monitoring DEFERRED → ISSUES.md (real, not this cycle).
- ACCEPTED (28 FIX): enquiry link carries ?property=<id>; contact.html prefills message. PLAN Rock 1.
- REJECTED (29 FIX): hero CTA label is Natalie's client-approved copy — stays verbatim; flagged in ISSUES.md to raise with her at ship.
- ACCEPTED (30 FIX): properties.html head spec'd — canonical, description, OG, index,follow; asserted by check-nav.mjs.
- ACCEPTED (31 FIX): grep proof replaced by backend/check-nav.mjs parsing every page (exactly one desktop + one mobile link, correct position).
- ACCEPTED (32 FIX): backend/check-key.mjs decodes the embedded JWT and asserts role=anon.
- ACCEPTED (33 FIX): RLS proof adds transient second authenticated user — insert 403, unpublished invisible, storage denied; deleted after.
- ACCEPTED (34 FIX): hostile-content fixture (script/onerror payloads) asserted to render inert.

## Round 2 (2026-07-29)
### Integrator findings (Codex, verbatim)
- [FIX] UI-SPEC §2 still maps fetch failures to the empty state while §7 requires `#properties-error`, so opposite implementations both satisfy the binding spec -> Delete the stale §2 instruction and make §7 authoritative.
- [FIX] UI-SPEC §4 still adds `hover:text-accent` to a new 11px CTA despite §8’s contrast rule -> Remove that hover color from the new teaser CTA while leaving the client-approved hero copy unchanged.
- [FIX] The backend contract sends bearer authorization only on mutations, so admin GETs run as anon and cannot retrieve Natalie’s drafts -> Require bearer authorization on every admin Data API request, including GET/HEAD.
- [FIX] The global mutation contract mandates JSON content type and `Content-Profile`, which conflicts with JPEG Storage uploads and the JPEG-only bucket -> Scope profile/JSON headers to PostgREST and require `Content-Type: image/jpeg` for Storage uploads.
- [FIX] Any valid GoTrue account can pass the admin login screen even though RLS later rejects its writes -> Verify the returned JWT `sub` equals Natalie’s UID before exposing the admin UI and test this with the transient second user.
- [FIX] `published_needs_content` accepts `[null]`, numbers, arbitrary strings, and more than 12 photo entries, so the live “empty photos” proof passes while malformed published listings remain possible -> Enforce 1–12 unique string keys matching the UUID `.jpg` convention and add hostile constraint probes.
- [CLARIFY] UI-SPEC abbreviates energy ratings as `A+…F` while the database accepts any text -> Confirm the exact enum, such as `A+, A, B, B-, C, D, E, F`, and enforce it in SQL.
- [KILL] The anonymous `storage.objects` SELECT policy is unnecessary for public asset URLs and permits bucket listing, exposing object keys for draft photos -> Drop that policy and verify deletion through the already-known public object URLs instead of listing the bucket. [Supabase Storage guidance](https://supabase.com/docs/guides/storage/security/access-control)
- [FIX] RUNBOOK says to rerun the migration with a replacement UID, but `001-init.sql` unconditionally resets `NATALIE_UID` to the old value -> Freeze the applied migration and use a new UID-rebinding migration or an externally supplied psql variable.
- [FIX] The revoked-session test proves refresh failure after logout, not successful rotation when an access token expires normally -> Corrupt or expire only the stored access token while retaining a valid refresh token, then assert retry success and replacement of both stored tokens.
- [FIX] “POST logout THEN clear storage” can leave Natalie logged in locally when the logout request fails -> Clear local session state in `finally`, while reporting that server-side revocation could not be confirmed.
- [FIX] `grep -L` succeeds when any clean file exists even if another contains `service_role`, and the JWT checker targets only `portfolio.js` -> Use a failing recursive absence assertion and decode every embedded API-key literal, or centralize one checked public config.
- [FIX] The revised upload plan rejects large files but still lacks a decoded-pixel limit, while UI-SPEC §6 continues to allow unrestricted `image/*` -> Align the spec to JPEG/PNG/WebP and reject excessive dimensions before allocating the full canvas.
- [FIX] The only confirmed backup covers database rows on the same VPS while unique listing photos have no backup and no restore drill -> Add off-site database and Storage-volume backups with monitored completion and a tested restore before launch.
- [FIX] Orphan compensation is specified but the happy-path E2E never exercises it, so every cleanup branch could be broken while proof passes -> Inject row-write and object-delete failures and assert compensation plus a visible cleanup warning.
- [FIX] Uploading two photos does not prove the required reorder, cover-selection, removal, or removed-object cleanup controls -> Reorder and remove a photo in Playwright, then assert the public cover order, persisted keys, and deleted object.
- [FIX] Draft seeding skips by title, so a collision or partially created draft is reported as idempotent success -> Use fixed seed UUIDs and reconcile the complete row/photo state with upload compensation.
- [FIX] Rock 3’s sitemap proof contains a placeholder `…parse sitemap…` command and does not assert the required URL -> Run `xmllint --noout sitemap.xml` and separately assert exactly one canonical `properties.html` `<loc>`.
- [FIX] The untrusted `?property=` value is destined for a PostgREST filter and visible reference text without an explicit boundary check -> Require canonical UUID syntax and URL-encode it before querying or displaying the reference.
VERDICT: NOT YET
### Visionary response (Fable)
- ACCEPTED (1): stale §2 error-state line removed; §7 authoritative.
- REJECTED (2): the teaser CTA uses accent on HOVER only — identical to every existing `more-link` on the site; §8 already bans new STATIC small accent text; site-wide accent contrast stays in ISSUES for Natalie's sign-off.
- ACCEPTED (3): bearer now required on EVERY admin Data API request incl. GET (drafts are RLS-hidden). PLAN header contract rewritten.
- ACCEPTED (4): JSON/profile headers scoped to PostgREST; Storage uploads use image/jpeg; Auth uses apikey+JSON. PLAN.
- ACCEPTED (5): admin gate decodes JWT and requires sub == Natalie's UID before showing UI; second-user test asserts the gate. PLAN.
- ACCEPTED (6): photos constraint → natalie.valid_photos(): ≤12 unique '<uuid>.jpg' string keys. APPLIED live + migration; hostile probes in my proof.
- ANSWERED (7): PT energy certificate scale A+, A, B, B-, C, D, E, F enforced in SQL (APPLIED) + exact select options in UI-SPEC §6.
- ACCEPTED (8 KILL): anon storage SELECT policy DROPPED live (public URLs proven still served via bucket flag; anon list now returns hidden/empty). Discovery: Storage delete needs owner SELECT → added authenticated owner-read policy scoped to Natalie+bucket; full upload→public-fetch→delete→404 cycle re-proven.
- ACCEPTED (9, modified): RUNBOOK now prescribes a new numbered rebind migration for UID changes; 001 tracks live truth only during this unreleased cycle, frozen at first deploy.
- ACCEPTED (10): rotation proof = corrupt access token w/ valid refresh → assert auto-refresh, retry success, BOTH tokens replaced. PLAN.
- ACCEPTED (11): logout clears local state in finally + "server sign-out unconfirmed" notice on failure. PLAN.
- ACCEPTED (12): check-key.mjs scans every tracked .html/.js, fails on any service_role string, decodes every eyJ literal and asserts role=anon. PLAN.
- ACCEPTED (13): input types restricted to jpg/jpeg/png/webp; >20MB or >8000px rejected pre-canvas. PLAN + UI-SPEC §6.
- ACCEPTED (14, partial): storage volume ADDED to the nightly VPS backup script (backup.sh patched, run once, tar verified 257MB). Off-site copy + restore drill remain ISSUES — not a launch gate for a portfolio page whose content is re-creatable by its owner; risk accepted and logged.
- ACCEPTED (15, modified): compensation branch exercised with a REAL injected failure — photos uploaded, then row write violates the amenity whitelist → 400 → assert object cleanup + visible error. PLAN proof.
- ACCEPTED (16): reorder + remove photo steps added to the E2E proof (persisted order, public cover, deleted object). PLAN.
- ACCEPTED (17): seeds use fixed UUIDs + reconcile semantics + compensation. PLAN Rock 3.
- ACCEPTED (18): sitemap proof = xmllint --noout + exactly one properties.html <loc>. PLAN Rock 3.
- ACCEPTED (19): ?property= gated by strict UUID regex + encodeURIComponent + safe assignment. PLAN Rock 1.

## Round 3 (2026-07-29)
### Integrator findings (Codex, verbatim)
- [FIX] The new teaser CTA still changes 11px text to the 3.14:1 accent on hover, and matching existing links does not make the new interaction state accessible -> Remove `hover:text-accent` or use a hover token meeting 4.5:1 contrast.
- [FIX] Rock 0 still claims INSERT/DELETE-only policies and records only the old proof despite the required owner-SELECT policy and newly proven constraints -> Make the DONE summary match `001-init.sql` and record the complete reproducible proof matrix.
- [FIX] RUNBOOK §3 still instructs operators to edit and rerun `001-init.sql`, contradicting §1’s frozen-migration rule -> Permit rerunning 001 only before first deployment and require numbered migrations afterward.
- [FIX] Sequential uploads can fail after earlier files succeed, but admin compensation is defined only for row-write failure -> Delete all newly uploaded keys when any upload in the batch fails and prove failure on the second upload.
- [FIX] Treating every failed row request as a definite rejection can delete photos after a timeout or 5xx where the database actually committed -> Generate client-side row IDs and reconcile ambiguous mutations before performing compensation.
- [FIX] Round 2’s requested object-delete failure remains untested, so cleanup can fail silently while the compensation proof passes -> Force Storage DELETE failure, preserve the keys for retry, and require a visible cleanup warning.
- [FIX] UI-SPEC calls the mouse-styled article and thumbnails exact markup while §8 requires real buttons, and Playwright proves only mouse clicks -> Replace the earlier snippets with explicit button markup and test keyboard activation, Escape, and focus restoration.
- [FIX] The 320px responsive requirements have no executable proof, so overflow and unusable admin actions can ship while all listed checks pass -> Add 320px viewport assertions for page width, modal thumbnails, amenity wrapping, and stacked admin rows.
- [FIX] The exact properties skeleton omits `#properties-error` and Playwright never forces a fetch failure, so the required outage state can be absent while proof passes -> Add the hidden error element and intercept a failed request to assert error visibility, empty-state exclusion, and hidden teaser.
- [FIX] Admin proof does not round-trip valid nondefault status, type, energy, amenities, optional facts, or blank values, allowing serialization bugs across most of the form -> Save one full-field fixture plus one blank-optional fixture and assert database values and public rendering.
- [FIX] `check-nav.mjs` claims to require portfolio links in every HTML file even though `admin.html` intentionally has no navigation -> Enumerate the 11 public pages and separately assert that admin has no portfolio navigation.
- [FIX] `check-key.mjs` scans only tracked files, so newly created untracked production files can contain a service key while the check passes -> Scan workspace HTML and JavaScript files directly with explicit dependency and generated-file exclusions.
- [FIX] The sitemap check accepts any origin whose path ends in `/properties.html`, so a noncanonical URL passes -> Assert exactly `https://nataliegutman.com/properties.html` in both the sitemap and canonical tag.
- [FIX] Rock 3 assigns Codex a proof that executes a script reading forbidden `.env.local` credentials -> Assign the credentialed seed runs to Fable or the operator and keep Codex responsible for implementation and secret-free checks.
VERDICT: NOT YET
### Visionary response (Fable)
- REJECTED-FINAL (1): settled in round 2 under the Visionary design seat — hover-only accent on more-links is the site's established interaction pattern; a single divergent link is worse UX than a site-wide token fix, which sits in ISSUES pending the client. Re-raising a settled point is out of protocol; decision stands.
- ACCEPTED (2): Rock 0 summary rewritten to match 001-init.sql live truth + full proof matrix recorded.
- ACCEPTED (3): RUNBOOK §3 now states 001 rerunnable only pre-deploy; numbered deltas after.
- ACCEPTED (4): any mid-batch upload failure → delete ALL new keys + abort. PLAN.
- ACCEPTED (5): client-generated row UUIDs; ambiguous row outcomes (timeout/5xx) reconciled by GET-by-id before any compensation. PLAN.
- ACCEPTED (6): storage-delete failure path stubbed in E2E → keys preserved + visible cleanup warning. PLAN.
- ACCEPTED (7): §1 card + §3 thumbs rewritten as explicit <button> markup; keyboard/Esc/focus-return assertions added. UI-SPEC + PLAN.
- ACCEPTED (8): 320px executable assertions added (overflow, wrap, scroll, stacked admin). PLAN.
- ACCEPTED (9): #properties-error added to the binding skeleton; forced fetch-failure test added. UI-SPEC + PLAN.
- ACCEPTED (10): full-field + blank-optional fixtures round-tripped in proof. PLAN.
- ACCEPTED (11): check-nav enumerates the 11 public pages; admin asserted nav-free. PLAN.
- ACCEPTED (12): check-key globs workspace files (excl. node_modules/docs/.git), not git tracking. PLAN.
- ACCEPTED (13): canonical + sitemap assert exact `https://nataliegutman.com/properties.html`. PLAN.
- ACCEPTED (14): credentialed seed RUNS are Fable/operator work; Codex ships the script + secret-free checks only. PLAN Rock 3.
