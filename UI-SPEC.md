# UI Spec — Property Portfolio (Fable's design seat; Codex implements EXACTLY this markup)

Design language: match the existing site. Serif display (`font-serif`), small-caps `label`, thin `border-hairline`, palette tokens `ink / surface / muted / faint / accent`, icons = inline SVG `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"`. Minimal: no shadows, no rounded corners, no pills except the status chip.

## 1. Data-driven property card (public, used on properties.html grid + homepage teaser)

```html
<article class="group cursor-pointer reveal is-in" data-property-id="{id}">
  <div class="relative aspect-[4/3] bg-surface overflow-hidden mb-5">
    <img src="{cover_photo}" alt="{title}" loading="lazy"
         class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
    <!-- status chip ONLY when status != available -->
    <span class="absolute top-4 left-4 label text-white bg-ink/85 px-3 py-1.5">Under offer | Sold</span>
  </div>
  <p class="label text-faint mb-2">{location_area}</p>
  <h3 class="font-serif text-2xl mb-1 group-hover:text-accent transition-colors">{title}</h3>
  <p class="text-ink text-lg mb-3">{price formatted "€1.250.000" or "Price on request"}</p>
  <div class="flex items-center gap-5 text-sm text-muted mb-3">
    <span class="inline-flex items-center gap-1.5">[bed icon] {bedrooms}</span>
    <span class="inline-flex items-center gap-1.5">[bath icon] {bathrooms}</span>
    <span class="inline-flex items-center gap-1.5">[area icon] {area_built} m²</span>
  </div>
  <!-- amenity icon row: ONLY amenities the property has, max all 10, w-[18px] h-[18px] text-faint, each svg gets <title> for tooltip/a11y -->
  <div class="flex items-center gap-3 text-faint">[amenity icons]</div>
</article>
```

## 2. properties.html page skeleton
- Header/footer: copy EXACTLY from calculators.html (sticky white header pattern), add active state on the new "Portfolio" nav item (`text-ink` instead of default).
- Page head block:
```html
<section class="border-b border-hairline">
  <div class="max-w-7xl mx-auto px-6 lg:px-10 pt-16 lg:pt-24 pb-12 lg:pb-16">
    <p class="label mb-4">Portfolio</p>
    <h1 class="font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight mb-5">Available properties</h1>
    <p class="text-muted leading-relaxed max-w-xl">A curated selection across Cascais, Lisbon and Sintra.
       Every listing personally vetted — numbers, legal clarity and long-term value first.</p>
  </div>
</section>
<section>
  <div class="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-20">
    <div id="property-grid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14"></div>
    <p id="properties-empty" class="hidden text-muted text-center py-20">New listings are being prepared.
       <a href="contact.html" class="link-underline text-ink">Tell me what you're looking for</a> and I'll search privately.</p>
  </div>
</section>
```
- Loading state: nothing (grid fills when fetch resolves). Error/empty behavior: §7 is authoritative (`#properties-error` vs `#properties-empty` — never the same element).

## 3. Detail modal (native `<dialog id="property-modal">`, same pattern as guide modal on index)
- `w-full max-w-4xl p-0 border border-hairline bg-white text-ink`, `::backdrop rgba(15,20,25,.6)`.
- Content: gallery (main img `aspect-[4/3] object-cover w-full` + thumbnail strip `flex gap-2 mt-2`, thumbs `w-20 h-14 object-cover cursor-pointer opacity-60`, active thumb `opacity-100`), then `p-8 sm:p-10`:
  - label location · status chip inline if not available
  - `font-serif text-3xl` title, price line `text-xl mt-1`
  - spec row (beds/baths/built m² [/plot m² if set] / floor / year / energy rating — only fields that are set) as `label text-faint` key + `text-ink` value pairs in a `flex flex-wrap gap-x-8 gap-y-3 py-6 border-y border-hairline my-6`
  - description: `text-muted leading-relaxed space-y-4` (split on blank lines)
  - amenities: `grid grid-cols-2 sm:grid-cols-3 gap-3` of `inline-flex items-center gap-2.5 text-sm text-muted` icon+label, only ones it has
  - CTA row: `<a href="contact.html" class="more-link ...">Enquire about this property [arrow svg]</a>` + close button top-right (same X as guide modal)
- Close: X button, backdrop click, Esc (native).

## 4. Homepage teaser (insert AFTER Prime Locations section, BEFORE Toolkit)
```html
<section class="bg-white" id="featured-properties-section" hidden>
  <div class="max-w-7xl mx-auto px-6 lg:px-10 pb-20 lg:pb-28">
    <div class="text-center mb-14 reveal">
      <p class="label mb-4">Portfolio</p>
      <h2 class="font-serif text-4xl sm:text-5xl mb-5">Featured Properties</h2>
    </div>
    <div id="featured-grid" class="grid md:grid-cols-3 gap-8"><!-- up to 3 featured cards --></div>
    <div class="text-center mt-12">
      <a href="properties.html" class="more-link hover:text-accent transition-colors">View all properties [arrow svg]</a>
    </div>
  </div>
</section>
```
- Section stays `hidden` unless fetch succeeds AND ≥1 featured+published property. NOTE global guard: add `[hidden]{display:none!important}` to a `<style>` in both touched pages (lesson C2).
- Hero secondary CTA: change `href="#about"` → `href="properties.html"`. Nav (desktop + mobile, ALL 11 pages incl. properties.html): add `Portfolio` between `Sell` and `Calculators`.

## 5. Icon set (inline SVG paths, stroke-width 1.4, round caps — Codex draws these simple line icons; keep each ≤3 paths)
Spec row: `bed`, `bath`, `area` (square with corner arrows).
Amenities (10, key → label): `parking` → Parking · `garage` → Garage · `elevator` → Elevator · `pool` → Pool · `garden` → Garden · `terrace` → Terrace / Balcony · `sea_view` → Sea view · `air_con` → Air conditioning · `storage` → Storage · `furnished` → Furnished.
Define once in JS as an icon map; render with innerHTML.

## 6. admin.html (unlinked; noindex meta; NOT in nav or sitemap)
Minimal one-file admin, same brand, no header/footer chrome — just:
- Centered login card (`max-w-sm mx-auto mt-32 border border-hairline p-10`): wordmark "Natalie Gutman" serif 2xl centered, `label` "Listings admin", email + password inputs (same input style as site forms), submit `bg-ink text-white` button, error line `text-sm text-red-600`.
- After login: `max-w-5xl mx-auto px-6 py-12`:
  - Top bar: serif "Listings" + `+ Add property` button (bg-ink text-white px-5 py-2.5 text-sm) + `Sign out` (label link) right-aligned.
  - Table-less list: rows `flex items-center gap-5 py-4 border-b border-hairline` — thumb `w-20 h-14 object-cover bg-surface`, title+location stacked (title `font-serif text-lg`), status `label`, Published toggle (checkbox styled `accent-ink` + label), `Edit` / `Delete` label links (Delete confirms via `confirm()`).
  - Form (add/edit, replaces list view; `Back to list` link): two-col `grid sm:grid-cols-2 gap-5` fields —
    title*, location_area*, price (number, blank = price on request), status (select: Available/Under offer/Sold), type (select: Apartment/House/Villa/Townhouse/Penthouse/Plot/Commercial), bedrooms, bathrooms, area_built, area_plot, floor (text), year_built, energy_rating (select: blank, A+, A, B, B-, C, D, E, F — exact DB enum), featured (checkbox), published (checkbox), description (textarea rows=6, full width), amenities (full width: `grid grid-cols-2 sm:grid-cols-3 gap-3` of checkbox+icon+label), photos (full width: file input multiple accept .jpg,.jpeg,.png,.webp; reject >20MB or >8000px sources before canvas; client-side downscale to max 1600px JPEG q0.82 via canvas BEFORE upload; thumbnails row with ✕ remove and ←/→ reorder buttons; first photo = cover, mark it "Cover").
  - Save button `bg-ink text-white px-7 py-3`; inline success/error line. All labels `label` style.

## 7. Copy rules
Price format: CUSTOM formatter (no Intl — its pt-PT output `1 250 000 €` is wrong for us): `€` prefix + dot thousands separators → `€1.250.000`, no decimals. Never show `€0` — blank/null price renders "Price on request". Dates: none shown publicly.
Facts row: render ONLY set fields (null bedrooms → no bed item). For `plot`/`commercial` with no `area_built`, show `area_plot` m² with the area icon instead.
States (properties.html): fetch error → `#properties-error` ("Listings are temporarily unavailable — please try again shortly.", same styling as empty line) + console.error; successful 0-row response → `#properties-empty`. Never both. Homepage teaser: `hidden` unless success AND ≥1 featured.

## 8. Accessibility & responsive (binding)
- Cards: the whole card is a real interactive control — wrap media+title in a `<button type="button" class="block w-full text-left …">` OR make the article `role`-free and put the open action on an inner button covering it; visible `focus-visible:ring-2 ring-accent` on focus; accessible name = property title.
- Modal: `aria-labelledby` → title element id; close X is a `<button aria-label="Close">`; thumbnails are `<button>`s with `aria-label="Photo N"`; focus moves into dialog on open and RETURNS to the originating card button on close; Esc native.
- Amenity icons: each svg carries `<title>label</title>` + parent `title` attr; icon row `flex flex-wrap gap-3` (wraps on narrow screens).
- Thumbnail strip: `flex gap-2 mt-2 overflow-x-auto` (scrolls, never overflows the dialog).
- Admin rows stack on mobile: `flex flex-wrap` with the thumb+title group `min-w-0` and actions row full-width below at <sm. Everything must be clean at 320px wide.
- `[hidden]{display:none!important}` guard `<style>` on index.html, properties.html, admin.html (lesson C2).
- New small text: use `text-muted`/`text-ink` — do NOT introduce new small `text-accent` copy (contrast); accent stays hover-only, matching the site.
