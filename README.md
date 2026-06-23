# Natalie Gutman — Landing Page

Multi-page site for Natalie Gutman, a real estate agent helping international clients **buy and sell** property in Portugal's Golden Triangle. A home hub routes visitors into two tailored conversion paths.

## Architecture
- `index.html` — home hub: dual hero (buy/sell), two-path cards, About, end-to-end process teaser, social.
- `buy.html` — buyer path: free buyer's-guide email capture, A–Z buying process, buyer FAQ.
- `sell.html` — seller path: free home-valuation capture, A–Z selling process, seller FAQ.
- `calculators.html` — public tools: purchase costs (IMT/Stamp Duty), mortgage, yield, ROI, seller's net proceeds (2026 rules; sources cited in the script's RATES block).
- `guide.html` / `hub.html` — the gated guide content and post-signup resource hub.
- `privacy.html` / `terms.html` — legal.

Shared nav across pages: `Home · Buy · Sell · (Calculators) · Contact`.

## Stack
- Static HTML (one file per page; nav/footer duplicated across pages — see Architecture above)
- Tailwind compiled to `assets/tailwind.css` (no CDN — see build step below)
- Fonts: Fraunces (serif headings) + Inter (body), **self-hosted** from `assets/fonts/`

No third-party requests fire on page load (no Google Fonts / Tailwind CDN / placeholder
images). This keeps the site GDPR/ePrivacy-friendly and avoids needing a cookie banner.
The only outbound call is the form submission you wire up (see below), which is disclosed
in the Privacy Policy.

## Install (first time)

```
npm install
```

## Build the CSS

Tailwind is compiled, not loaded from a CDN. **Any time you add or change CSS classes in
the HTML, rebuild:**

```
npm run build:css      # one-off minified build → assets/tailwind.css
npm run watch:css      # rebuild automatically while editing
```

Tailwind theme (colors, fonts) lives in `tailwind.config.js`; base styles, the
`@font-face` rules, and the `.link-underline` component live in `src/input.css`.

## Run locally

```
npm run dev            # serves on http://localhost:3000
```

## Deploy
Drop the folder into Netlify, Vercel, Cloudflare Pages, or any static host.

## Swap placeholders
- **Guide cover** — currently a CSS placeholder card (no external image). Optionally replace with `assets/guide-cover.jpg` (3:4) — keep it local, don't reintroduce a third-party URL.
- **Testimonial avatars** — currently CSS initials circles. When real testimonials arrive, swap in local avatar images (don't use `placehold.co` or other external hosts).
- **Contact info** — `mailto:` is `bhinvest7@gmail.com`; update the `tel:` and `wa.me` links if the number changes. Contact blocks live on `index.html`, `buy.html` and `sell.html`.
- **Social links** — Instagram / Facebook / LinkedIn are placeholders (`href="#"`) in every footer. Swap in real profile URLs when handles are confirmed.
- **OG image** — `assets/og-image.jpg` (1200×630) is generated from the portrait.

## Legal / compliance
- `privacy.html` and `terms.html` are live and linked in every footer + beside each form.
- Search them for `[TO CONFIRM: ...]` markers — a few facts need filling in (legal trading
  name / NIF, brokerage name + AMI licence number, any email-marketing tool you add).
- `natalie.png` is ~7.5 MB — compress it before launch (it's the hero/LCP image).

## Wire up the forms
All three forms post to `#` (placeholder). Pick one provider and point each form's `action` at it:
- **ConvertKit** — copy the form action URL from ConvertKit and replace `action="#"`.
- **Mailchimp** — same idea (also requires hidden bot field).
- **Formspree** — `action="https://formspree.io/f/<your-id>"`.

The contact form should go to whichever inbox Natalie reads.

## Out of scope (v1)
- No backend / email delivery wired up yet.
- No actual guide PDF — placeholder cover only.
- No Portuguese translation (likely v2).
- No blog / CMS — this is a single page.

## Deploy notes
- Run `npm run build:css` before deploying so `assets/tailwind.css` is current.
- Commit `assets/tailwind.css` and `assets/fonts/` (they ship); `node_modules/` is gitignored.
- Serve over HTTPS on `https://nataliegutman.com` — canonical tags, sitemap, OG, and schema
  all assume that domain. Then submit `sitemap.xml` in Google Search Console + Bing.
