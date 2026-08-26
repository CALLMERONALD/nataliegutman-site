#!/usr/bin/env node
// Share pages: one static stub per published, public listing at p/<ref>.html
// (ref = first 8 hex of the listing id, the same ref /properties?ref= uses).
//
// Why: the site is static and listings render client-side, so a shared
// /properties?ref=... link unfurls with the generic portfolio card. WhatsApp,
// iMessage, Facebook and LinkedIn read <meta> tags and never run JS, so each
// stub carries the property's own title, photo and price, then JS-redirects
// humans to /properties?ref=<ref>, which opens the listing.
//
// Run by .github/workflows/share-pages.yml on a schedule (and by hand:
// `node backend/build-share-pages.mjs`). It rebuilds p/ from scratch, so an
// unpublished or deleted listing loses its stub on the next run.
//
// ponytail: redirect stubs, not full listing pages. Upgrade to real per-listing
// pages (indexable, nav, gallery) only if per-listing SEO is ever wanted.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://supabase.vandalesolutions.com';
// Public anon key (same one shipped in assets/portfolio.js); RLS is the boundary.
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzgxNTcyODc0LCJleHAiOjE5MzkyNTI4NzR9.F676ikQc-ocleC7cDjwiLB9N_YaUmOyVj2NOeR7o2VQ';
const SITE = 'https://nataliegutman.com';
const PHOTO_BASE_URL = SUPABASE_URL + '/storage/v1/object/public/natalie-properties/';
const OUT_DIR = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), 'p');
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Off-market listings are deliberately excluded: the repo is public, so a stub
// would list them in the git tree. They keep the plain /off-market?ref= link.
const QUERY = '?select=id,title,price,location_area,bedrooms,bathrooms,area_built,area_plot,type,energy_rating,photos,status'
  + '&published=eq.true&off_market=eq.false';

const STATUS_LABELS = { under_offer: 'Under offer', sold: 'Sold' };

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatPrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) return 'Price on request';
  return '€' + String(Math.round(price)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function energyLabel(value) {
  return value === 'exempt' ? 'Energy class: exempt' : 'Energy class ' + String(value);
}

export function describe(property) {
  const parts = [];
  if (STATUS_LABELS[property.status]) parts.push(STATUS_LABELS[property.status]);
  if (property.location_area) parts.push(property.location_area);
  parts.push(formatPrice(property.price));
  // DL 101-D/2020 art. 22(3) + art. 32: the energy class must appear in every
  // advertisement (a link preview is one) "harmonised" with the rest, so it sits
  // right after the price, not at the tail: WhatsApp/Facebook cut descriptions at
  // about two lines and the tail is what disappears first (counsel 2026-08-26).
  // A published row cannot lack it (DB constraint published_needs_content).
  parts.push(energyLabel(property.energy_rating));
  if (property.bedrooms != null) parts.push(property.bedrooms + ' bed');
  if (property.bathrooms != null) parts.push(property.bathrooms + ' bath');
  const area = property.area_built ?? ((property.type === 'plot' || property.type === 'commercial') ? property.area_plot : null);
  if (area != null) parts.push(area + ' m²');
  return parts.join(' · ');
}

export function render(property) {
  const ref = String(property.id).slice(0, 8);
  const url = SITE + '/p/' + ref;
  const target = '/properties?ref=' + ref;
  const cover = Array.isArray(property.photos) && typeof property.photos[0] === 'string' && property.photos[0]
    ? PHOTO_BASE_URL + encodeURIComponent(property.photos[0])
    : SITE + '/assets/og-image.jpg';
  const title = escapeHtml(property.title);
  const description = escapeHtml(describe(property));
  const image = escapeHtml(cover);
  // No <meta http-equiv="refresh">: some preview crawlers follow it and would
  // read the generic portfolio tags instead. Crawlers never run the JS below.
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} · Natalie Gutman</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="noindex,follow">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Natalie Gutman">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${image}">
  <meta property="og:locale" content="en_US">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
</head>
<body style="margin:0;padding:2rem;font-family:system-ui,sans-serif;color:#1A1A1A;line-height:1.6">
  <p><strong>${title}</strong><br>${description}</p>
  <p><a href="${target}">View this property</a> in Natalie Gutman's portfolio. Property mediation is provided through eXp Realty, a licensed brokerage (AMI 18470).</p>
  <script>location.replace(${JSON.stringify(target)});</script>
</body>
</html>
`;
}

async function fetchListings() {
  const response = await fetch(SUPABASE_URL + '/rest/v1/properties' + QUERY, {
    headers: { apikey: SUPABASE_ANON_KEY, 'Accept-Profile': 'natalie' }
  });
  if (!response.ok) throw new Error('Listings request failed with HTTP ' + response.status);
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('Listings response was not an array');
  return rows.filter((row) => UUID_PATTERN.test(String(row.id)) && typeof row.title === 'string' && row.title);
}

async function main() {
  // Fail closed: any fetch failure throws above this line, so a network blip
  // never deletes the existing stubs. Only a successful (possibly empty) answer
  // rewrites p/.
  const listings = await fetchListings();
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const property of listings) {
    fs.writeFileSync(path.join(OUT_DIR, String(property.id).slice(0, 8) + '.html'), render(property));
  }
  console.log(`share pages: wrote ${listings.length} stub(s) to p/`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--self-check')) {
    const sample = { id: '11111111-1111-4111-8111-111111111111', title: 'Villa <"Test"> & co', price: 1250000, location_area: 'Cascais', bedrooms: 3, bathrooms: 2, area_built: 127, type: 'apartment', energy_rating: 'B-', photos: ['a b.jpg'], status: 'available' };
    const html = render(sample);
    const ok = describe(sample) === 'Cascais · €1.250.000 · Energy class B- · 3 bed · 2 bath · 127 m²'
      && html.includes('<meta property="og:title" content="Villa &lt;&quot;Test&quot;&gt; &amp; co">')
      && html.includes('og:image" content="' + PHOTO_BASE_URL + 'a%20b.jpg"')
      && html.includes('location.replace("/properties?ref=11111111")')
      && !html.includes('http-equiv')
      && describe({ ...sample, status: 'sold', energy_rating: 'exempt', bedrooms: null }).startsWith('Sold · ')
      && describe({ ...sample, energy_rating: 'exempt' }).includes('€1.250.000 · Energy class: exempt · 3 bed');
    if (!ok) { console.error('share pages self-check FAILED'); process.exit(1); }
    console.log('share pages self-check: ok');
  } else {
    main().catch((error) => { console.error(error); process.exit(1); });
  }
}
