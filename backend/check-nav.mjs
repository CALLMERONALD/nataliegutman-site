import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.dirname(backendDirectory);
const publicPages = [
  'index.html',
  'buy.html',
  'sell.html',
  'properties.html',
  'calculators.html',
  'guide.html',
  'hub.html',
  'about.html',
  'contact.html',
  'privacy.html',
  'terms.html'
];

function read(fileName) {
  return fs.readFileSync(path.join(rootDirectory, fileName), 'utf8');
}

function fragment(html, pattern, label, fileName) {
  const match = html.match(pattern);
  assert.ok(match, `${fileName}: missing ${label}`);
  return match[0];
}

function countMatches(source, pattern) {
  return (source.match(pattern) || []).length;
}

function assertPortfolioOrder(nav, fileName, viewport) {
  assert.equal(countMatches(nav, /href=["']\/properties["']/g), 1,
    `${fileName}: ${viewport} nav must contain exactly one /properties link`);
  assert.match(nav, /href=["']\/properties["'][^>]*>\s*Portfolio\s*<\/a>/,
    `${fileName}: ${viewport} properties link must be labelled Portfolio`);

  const sell = nav.indexOf('href="/sell"');
  const portfolio = nav.indexOf('href="/properties"');
  const calculators = nav.indexOf('href="/calculators"');
  assert.ok(sell !== -1 && sell < portfolio && portfolio < calculators,
    `${fileName}: ${viewport} Portfolio must sit between Sell and Calculators`);
}

for (const fileName of publicPages) {
  const html = read(fileName);
  const desktopNav = fragment(html, /<nav\b[^>]*aria-label=["']Primary["'][^>]*>[\s\S]*?<\/nav>/i,
    'primary nav', fileName);
  const mobileNav = fragment(html, /<div\b[^>]*id=["']mobile-menu["'][^>]*>[\s\S]*?<\/div>/i,
    'mobile nav', fileName);

  assertPortfolioOrder(desktopNav, fileName, 'desktop');
  assertPortfolioOrder(mobileNav, fileName, 'mobile');

  if (fileName === 'properties.html') {
    for (const [viewport, nav] of [['desktop', desktopNav], ['mobile', mobileNav]]) {
      const link = nav.match(/<a\b[^>]*href=["']\/properties["'][^>]*>\s*Portfolio\s*<\/a>/i);
      assert.ok(link && /aria-current=["']page["']/.test(link[0]),
        `properties.html: ${viewport} Portfolio link must be current`);
    }
    assert.match(desktopNav, /href=["']\/properties["'][^>]*class=["'][^"']*\btext-ink\b[^"']*["']/,
      'properties.html: desktop Portfolio link must use the text-ink active state');
  }
}

for (const entry of fs.readdirSync(rootDirectory, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
  assert.doesNotMatch(read(entry.name), /TODO\(listing\)|TODO_ENERGY_CLASS/,
    `${entry.name}: unresolved listing placeholder must block deployment`);
}

const properties = read('properties.html');
assert.match(properties,
  /<link\s+rel=["']canonical["']\s+href=["']https:\/\/nataliegutman\.com\/properties["']\s*\/?>/i,
  'properties.html: missing exact canonical link');
assert.match(properties, /<meta\b[^>]*name=["']description["'][^>]*content=["'][^"']+["'][^>]*>/i,
  'properties.html: missing description meta');
assert.match(properties, /<meta\b[^>]*property=["']og:title["'][^>]*content=["'][^"']+["'][^>]*>/i,
  'properties.html: missing og:title meta');
const robots = properties.match(/<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i);
assert.ok(robots, 'properties.html: missing robots meta');
const robotsDirectives = robots[1].split(',').map((directive) => directive.trim().toLowerCase());
assert.ok(robotsDirectives.includes('index') && robotsDirectives.includes('follow'),
  'properties.html: robots meta must contain index,follow');

const sitemap = read('sitemap.xml');
const propertyLocs = [...sitemap.matchAll(/<loc>\s*https:\/\/nataliegutman\.com\/properties\s*<\/loc>/g)];
assert.equal(propertyLocs.length, 1,
  'sitemap.xml: /properties URL must appear exactly once as a loc');

const adminPath = path.join(rootDirectory, 'admin.html');
if (fs.existsSync(adminPath)) {
  const admin = fs.readFileSync(adminPath, 'utf8');
  assert.doesNotMatch(admin, /aria-label=["']Primary["']/i, 'admin.html must not contain public navigation');
  assert.doesNotMatch(admin, /href=["']\/properties["']/i, 'admin.html must not link to Portfolio');
}

// off-market.html is unlisted: noindex, no canonical, absent from the sitemap,
// and no other page may link to it (the link is shared privately by Natalie).
const offMarket = read('off-market.html');
const offMarketRobots = offMarket.match(/<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i);
assert.ok(offMarketRobots, 'off-market.html: missing robots meta');
const offMarketDirectives = offMarketRobots[1].split(',').map((directive) => directive.trim().toLowerCase());
assert.ok(offMarketDirectives.includes('noindex') && offMarketDirectives.includes('nofollow'),
  'off-market.html: robots meta must contain noindex,nofollow');
assert.doesNotMatch(offMarket, /rel=["']canonical["']/i, 'off-market.html must not declare a canonical URL');
assert.match(offMarket, /<body\b[^>]*\bdata-off-market\b/i, 'off-market.html: body must carry data-off-market');
// The private page deliberately has NO public navigation (minimal invitation header)
// and must keep the Lei 15/2013 licence attribution.
assert.doesNotMatch(offMarket, /aria-label=["']Primary["']/i, 'off-market.html must not carry the public site navigation');
assert.match(offMarket, /AMI 18470/, 'off-market.html must carry the eXp Realty AMI 18470 attribution');
assert.doesNotMatch(read('sitemap.xml'), /off-market/i, 'sitemap.xml must not list off-market.html');
assert.doesNotMatch(read('robots.txt'), /off-market/i, 'robots.txt must not mention off-market.html (a Disallow line would advertise it)');
for (const fileName of publicPages) {
  assert.doesNotMatch(read(fileName), /href=["'][^"']*off-market/i,
    `${fileName} must not link to off-market.html`);
}

// gandarinha.html is also unlisted: noindex, absent from robots and sitemap,
// and not linked from any public page.
const gandarinha = read('gandarinha.html');
const gandarinhaRobots = gandarinha.match(/<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i);
assert.ok(gandarinhaRobots, 'gandarinha.html: missing robots meta');
const gandarinhaDirectives = gandarinhaRobots[1].split(',').map((directive) => directive.trim().toLowerCase());
assert.ok(gandarinhaDirectives.includes('noindex') && gandarinhaDirectives.includes('nofollow'),
  'gandarinha.html: robots meta must contain noindex,nofollow');
assert.doesNotMatch(read('sitemap.xml'), /gandarinha/i, 'sitemap.xml must not list gandarinha.html');
assert.doesNotMatch(read('robots.txt'), /gandarinha/i, 'robots.txt must not mention gandarinha.html');
for (const fileName of publicPages) {
  assert.doesNotMatch(read(fileName), /href=["'][^"']*gandarinha/i,
    `${fileName} must not link to gandarinha.html`);
}

const formEndpoint = read('assets/form-endpoint.js');
assert.match(formEndpoint, /Your request has not been sent\./,
  'assets/form-endpoint.js: missing honest unconfigured-endpoint message');
assert.match(formEndpoint, /https:\/\/wa\.me\/351969227709/,
  'assets/form-endpoint.js: fallback must link to WhatsApp');
assert.match(formEndpoint, /tel:\+351969227709/,
  'assets/form-endpoint.js: fallback must link to Natalie by phone');
for (const [fileName, expectedFallbacks] of [
  ['buy.html', 1],
  ['sell.html', 2],
  ['contact.html', 1],
  ['gandarinha.html', 1]
]) {
  assert.equal(countMatches(read(fileName), /if \(!SHEETS_URL\) \{\s*window\.showFormUnavailable/g), expectedFallbacks,
    `${fileName}: every enquiry form must stop at the honest fallback when SHEETS_URL is empty`);
}

console.log(`check-nav: ${publicPages.length} public pages passed`);
console.log('check-nav: desktop and mobile Portfolio order passed');
console.log('check-nav: properties metadata and sitemap passed');
console.log('check-nav: admin navigation exclusion passed');
console.log('check-nav: listing placeholder guard passed');
console.log('check-nav: off-market unlisted invariants passed');
console.log('check-nav: gandarinha unlisted invariants passed');
console.log('check-nav: unconfigured form fallbacks passed');
