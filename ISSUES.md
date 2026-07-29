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
