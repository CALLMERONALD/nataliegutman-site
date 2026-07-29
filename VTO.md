# VTO — Property Listings + Admin (2026-07-29)

## Core Focus
Let Natalie publish and manage her property listings herself, shown as a minimal, on-brand portfolio on the site.

## What done looks like
- Public `properties.html`: card grid of published listings (photo, location, title, price, beds/baths/m², amenity icons), detail modal with gallery + description + enquiry CTA. Homepage gets a "Featured Properties" teaser (3 featured) and the hero's "Explore Services & Portfolio" CTA points at the portfolio. "Portfolio" in the nav on all pages.
- `admin.html` (unlinked URL): email+password login for `natalichn@gmail.com` only; create/edit/delete/publish properties; multi-photo upload (client-side downscaled); amenity checkboxes.
- Backend: self-hosted Supabase (VPS), schema `natalie`, storage bucket `natalie-properties`. RLS: anyone reads `published=true`; only Natalie's authed account writes. No client libraries — plain `fetch` against PostgREST/GoTrue/Storage REST.

## Non-goals
- Rentals, filters/search, map view, multi-agent accounts, i18n, per-property SEO pages (modal only), email notifications.

## Constraints & stack
- Static site (GitHub Pages) + Tailwind compiled locally (`npm run build:css` after class changes; content glob `./*.html` only — JS-injected markup must use classes that also appear in HTML, or add the JS file to the glob).
- Match existing brand: serif headings, `label` small-caps, `hairline` borders, `ink/surface/muted/accent` palette, stroke-1.4 line icons, `reveal` animations.
- No third-party requests: everything self-hosted (Supabase is our own VPS domain).
- Site JS style: vanilla ES5-ish inline patterns, no build step for JS.

## Goals (this cycle)
1. Supabase infra ready (schema, table, RLS, bucket, auth user) — Fable, Rock 0.
2. Public portfolio (properties.html + homepage teaser + nav) — Codex, Rock 1.
3. Admin CRUD with photo upload — Codex, Rock 2.
4. Seed 2 sample listings; end-to-end proof: create in admin → visible on public page.
