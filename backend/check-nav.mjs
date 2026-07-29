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
  assert.equal(countMatches(nav, /href=["']properties\.html["']/g), 1,
    `${fileName}: ${viewport} nav must contain exactly one properties.html link`);
  assert.match(nav, /href=["']properties\.html["'][^>]*>\s*Portfolio\s*<\/a>/,
    `${fileName}: ${viewport} properties link must be labelled Portfolio`);

  const sell = nav.indexOf('href="sell.html"');
  const portfolio = nav.indexOf('href="properties.html"');
  const calculators = nav.indexOf('href="calculators.html"');
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
      const link = nav.match(/<a\b[^>]*href=["']properties\.html["'][^>]*>\s*Portfolio\s*<\/a>/i);
      assert.ok(link && /aria-current=["']page["']/.test(link[0]),
        `properties.html: ${viewport} Portfolio link must be current`);
    }
    assert.match(desktopNav, /href=["']properties\.html["'][^>]*class=["'][^"']*\btext-ink\b[^"']*["']/,
      'properties.html: desktop Portfolio link must use the text-ink active state');
  }
}

const properties = read('properties.html');
assert.match(properties,
  /<link\s+rel=["']canonical["']\s+href=["']https:\/\/nataliegutman\.com\/properties\.html["']\s*\/?>/i,
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
const propertyLocs = [...sitemap.matchAll(/<loc>\s*https:\/\/nataliegutman\.com\/properties\.html\s*<\/loc>/g)];
assert.equal(propertyLocs.length, 1,
  'sitemap.xml: properties.html URL must appear exactly once as a loc');

const adminPath = path.join(rootDirectory, 'admin.html');
if (fs.existsSync(adminPath)) {
  const admin = fs.readFileSync(adminPath, 'utf8');
  assert.doesNotMatch(admin, /aria-label=["']Primary["']/i, 'admin.html must not contain public navigation');
  assert.doesNotMatch(admin, /href=["']properties\.html["']/i, 'admin.html must not link to Portfolio');
}

console.log(`check-nav: ${publicPages.length} public pages passed`);
console.log('check-nav: desktop and mobile Portfolio order passed');
console.log('check-nav: properties metadata and sitemap passed');
console.log('check-nav: admin navigation exclusion passed');
