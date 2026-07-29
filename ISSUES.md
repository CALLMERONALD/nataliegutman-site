# ISSUES — deferred items (property portfolio cycle, 2026-07-29)

- [med] Optimistic concurrency on admin edits (two tabs = last-write-wins today; single-editor reality) — send `If-Unmodified-Since`-style guard using prior `updated_at`.
- [med] Off-site backup copies + restore drill (storage volume ADDED to nightly VPS backup 2026-07-29 and verified; off-site + drill remain).
- [med] Supabase service health monitoring/alerts (Auth/PostgREST/Storage) — extend the n8n watchdog pattern.
- [low] Prove/tune GoTrue `/auth/v1/token` IP throttling (signup already disabled; built-in rate limits unverified).
- [low] Site-wide `accent` color is 3.14:1 on white at small sizes (pre-existing; brand token change needs Natalie's sign-off).
- [low] Portfolio filters/sorting UI (worth it above ~12 active listings).
- [low] Per-property indexable pages (SEO for individual listings; modal-only today).
- [low] Drag-and-drop photo reorder in admin (arrow buttons today).
- [note] Hero secondary CTA label "Explore Services & Portfolio" now targets the portfolio page only — flag copy to Natalie for approval before/at ship.
- [note] Privacy page: listings backend adds first-party calls to supabase.vandalesolutions.com; legal gate at deploy should confirm the privacy policy wording still holds.

## Ship checklist (before deploying to nataliegutman.com)
- [ ] Michael reviews on localhost:8091 and approves (house rule: no deploy without explicit approval).
- [ ] Legal gate: dispatch the `lawyer` agent — the listings backend adds first-party calls to supabase.vandalesolutions.com and stores property data; confirm privacy.html wording still holds.
- [ ] Hand Natalie her admin URL + password OUT OF BAND (separate channels). Password reset runbook: backend/RUNBOOK.md §2.
- [ ] Confirm the hero CTA label "Explore Services & Portfolio" with Natalie (it now targets the portfolio page only).
- [ ] Post-deploy smoke from https://nataliegutman.com: properties.html renders, admin login works, one test listing publishes and appears, then unpublish/delete it.
- [ ] Freeze backend/001-init.sql after first deploy (RUNBOOK §1/§3: further changes = numbered deltas).
