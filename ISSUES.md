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

## Legal gate — DONE 2026-07-29 (lawyer agent). Verdict: proceed-with-conditions, do NOT deploy until the items below are cleared.

**Fixed already (code + DB, verified):**
- [x] B1 energy class — DL 101-D/2020 art. 22(3) makes the energy class mandatory in every property ad (fine €250–3,740 individual / €2,500–44,890 corporate). Enforced fail-closed: `published_needs_content` now requires `energy_rating`; publishing without it returns 400. Class renders on the card AND unconditionally in the modal; admin select is required and gained an "Exempt" option; client-side guard mirrors the constraint with a plain-English message.
- [x] B2 privacy.html — §3 no longer claims nothing loads from elsewhere; new §2 block discloses the portfolio requests (IP, legitimate interest); new §4 paragraph names the backend processor + EU location + nightly backups.
- [x] S2 — DPA drafted at `backend/DPA-natalie-draft.md` (unsigned, unsent).

**BLOCKING — must clear before deploy:**
- [ ] **B3: the footer states "AMI 18470" with no licence holder.** Lei 15/2013 requires the mediation company's *denominação* AND licence number in all external activity/publicity — and `terms.html` still contains a "[TO CONFIRM: brokerage legal name and AMI licence number]" placeholder that contradicts the footer. Get the exact registered name from Natalie and verify it yourself on the IMPIC register (impic.pt → "Empresas titulares de licença de mediação imobiliária"). Lead only, unverified: the number may belong to eXp Portugal. Publishing someone else's AMI, or the right number under the wrong name, is worse than the old "to be confirmed".
- [ ] **Fill the three `[TO CONFIRM]` placeholders in privacy.html §4** (Vandale entity legal name, NIPC, registered address) — check against the certidão permanente. Deliberately left visible so this cannot ship silently. Also update "Last updated" to the deploy date, and fill the pre-existing controller placeholder at §1 (legal name + NIF).
- [ ] **S1: testimonials.** The three quotes were re-attributed between people in Natalie's own revision doc (the Cascais quote moved to Sarah C., the bad-deal quote to Anna & Marc), the bold pull-quotes are not literal extracts, and one quote was strengthened ("caught issues" → "caught structural and legal issues"). Get her written confirmation that each quote is a real client's actual words and that they're content to appear as initial + city; drop or reword any she can't confirm. Misleading-practice exposure under DL 57/2008 art. 7 (ASAE).

**Also confirm with Natalie (not blocking the code, but ask before/at launch):**
- [ ] Her exact relationship to eXp — employee, angariador, or own licence? It determines whose company the footer names.
- [ ] Does eXp's agent agreement permit a personal listing site / mandate specific ad disclosures?
- [ ] Signed written mediation contract for every property she publishes (Lei 15/2013).
- [ ] She must hold a **valid energy certificate (class + SCE number) before publishing** each listing — the constraint forces a value, only she can ensure it's the true one.
- [ ] S3: she warrants she has the right to publish every photo (owner's permission). Verified good news: uploads are re-encoded through a canvas, which strips EXIF — no GPS/camera data leaks.
- [ ] S5 (optional): listing prices show a bare figure; a one-line "excludes IMT, stamp duty and notary costs" qualifier would pre-empt a hidden-costs complaint. Her copy call, not applied.

## Ship checklist (before deploying to nataliegutman.com)
- [ ] Michael reviews on localhost:8091 and approves (house rule: no deploy without explicit approval).
- [ ] Clear every BLOCKING item above.
- [ ] Hand Natalie her admin URL + password OUT OF BAND (separate channels). Password reset runbook: backend/RUNBOOK.md §2.
- [ ] Confirm the hero CTA label "Explore Services & Portfolio" with Natalie (it now targets the portfolio page only).
- [ ] Post-deploy smoke from https://nataliegutman.com: properties.html renders, admin login works, one test listing publishes and appears, then unpublish/delete it.
- [ ] Freeze backend/001-init.sql after first deploy (RUNBOOK §1/§3: further changes = numbered deltas).
