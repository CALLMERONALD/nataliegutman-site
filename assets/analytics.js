/* ────────────────────────────────────────────────────────────────────────────
 * ANALYTICS: PostHog Cloud EU, cookieless counting only (Michael 2026-09-15:
 * "we don't need session replays anymore ... so that we won't need a cookies
 * tab thing").
 *
 * What this does:
 *  - No banner, no session replay, no cookies, nothing written to the device.
 *    PostHog runs in cookieless mode: its server turns IP + browser + date into a
 *    code that rotates daily and cannot be reversed (project 269748: cookieless
 *    server hash mode ON, IP discarded, replay / heatmaps / autocapture /
 *    web vitals OFF at project level since 2026-09-15).
 *  - What leaves the browser, and nothing else (ALLOWED below, counsel's gate
 *    2026-09-24): page views and leaves (scroll depth), JS errors, page-speed
 *    numbers, dead and rage taps (element type only), and fixed-label action
 *    counts: listings opened/shared/enquired, contact taps, forms started and
 *    sent, calculators used, pop-up shown/sent, film played/finished, floor
 *    plan and gallery used, outbound clicks (domain only). Never typed text.
 *    Query strings, fragments, email-shaped strings, search words, ad-click ids
 *    and UTM labels are stripped; referrers cut to the website address.
 *    Autocapture and heatmaps stay OFF (counsel: behavioural, needs consent).
 *  - Do Not Track / Global Privacy Control / the privacy page's "Stop counting my
 *    visits" button (localStorage natalie_no_count) = nothing loads. localhost and LAN
 *    previews = nothing loads. Empty POSTHOG_KEY = nothing loads.
 *  - Legal basis: legitimate interest, art. 6(1)(f) (counsel 2026-09-08 and
 *    2026-09-10: the counting bucket without web vitals). privacy.html s.2, 3, 5.
 * ──────────────────────────────────────────────────────────────────────────── */
(function () {
  // Pages call this at the moment a form is actually sent (after their own validation).
  // Defined before every early return so callers never need to check for it; a no-op
  // when nothing loaded (localhost, DNT, GPC).
  window.siteTrack = function (event, props) {
    try { if (window.posthog && window.posthog.capture) window.posthog.capture(event, props, { send_instantly: true, transport: 'sendBeacon' }); } catch (e) {}
  };
  var POSTHOG_KEY = 'phc_pyHUKYxYFnWqQ2QQN8gdxNd2ghzzuMMijiE5DecVaHze'; // project token (public by design), PostHog Cloud EU project 269748
  var POSTHOG_HOST = 'https://eu.i.posthog.com';
  // Visitors from the banner era (2026-09-08 to 2026-09-15) may still hold the old
  // consent items; forget them so the device carries nothing for analytics.
  try {
    localStorage.removeItem('natalie_analytics_consent');
    Object.keys(localStorage).forEach(function (k) { if (/^(__ph_opt_in_out_|ph_.*_posthog$)/.test(k)) localStorage.removeItem(k); });
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (/^ph_.*_posthog$/.test(name)) document.cookie = name + '=; Max-Age=0; path=/; domain=' + location.hostname.replace(/^www\./, '.');
      if (/^ph_.*_posthog$/.test(name)) document.cookie = name + '=; Max-Age=0; path=/';
    });
  } catch (e) {}
  var local = /^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(location.hostname);
  if (!POSTHOG_KEY || local) return; // never count QA sessions
  var dnt = (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true);
  if (dnt) return;
  // "Stop counting my visits" (privacy.html section 6): the visitor's own choice, kept in this browser.
  try { if (localStorage.getItem('natalie_no_count') === '1') return; } catch (e) {}

  // Payload hygiene: URL-shaped fields lose query strings and fragments, and anything
  // that looks like an email anywhere in the payload (an exception message, a path)
  // is blanked (Astra 2026-09-10 and 2026-09-14).
  function scrub(obj, depth) {
    depth = depth || 0;
    if (!obj || typeof obj !== 'object' || depth > 6) return;
    var k, v;
    for (k in obj) {
      v = obj[k];
      if (typeof v === 'string') {
        if (/url|referrer/i.test(k)) v = v.replace(/[?#].*$/, '');
        obj[k] = v.replace(/[^\s@"'<>()]+@[^\s@"'<>()]+\.[a-z]{2,}/gi, '[email]');
      } else if (v && typeof v === 'object') scrub(v, depth + 1);
    }
  }

  // The only events that may leave the browser (counsel's list; anything else the SDK adds is dropped).
  var ALLOWED = /^(\$pageview|\$pageleave|\$exception|walkthrough_play|walkthrough_completed|\$dead_click|\$web_vitals|rage_click|gate_shown|gate_submitted|form_started|form_submitted|contact_click|outbound_click|property_viewed|property_link_copied|property_enquiry_click|calculator_used|floorplan_used|gallery_opened)$/;

  // Interaction counts (Michael 2026-09-24): fixed labels only, never what anyone typed,
  // never an identifier. Pages call window.siteTrack for their own moments; the three
  // site-wide ones are caught here with one delegated listener each.
  function where(el) {
    return el.closest('#property-modal') ? 'listing' : el.closest('header, nav') ? 'header' : el.closest('footer') ? 'footer' : 'page';
  }
  function formName(f) {
    var byId = { 'gate-form': 'gate', 'viewing-form': 'viewing', 'guide-form': 'guide', 'valuation-form': 'valuation' };
    if (byId[f.id]) return byId[f.id];
    if (f.hasAttribute('data-guide-form')) return 'guide';
    return f.querySelector('textarea') ? 'contact' : '';
  }
  var seen = {};
  function once(key) { if (seen[key]) return false; seen[key] = true; return true; }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var h = a.getAttribute('href') || '';
    var channel = /^tel:/i.test(h) ? 'phone' : /^mailto:/i.test(h) ? 'email' : /^https?:\/\/(wa\.me|api\.whatsapp\.com|(www\.)?whatsapp\.com)\//i.test(h) ? 'whatsapp' : '';
    if (channel) { window.siteTrack('contact_click', { channel: channel, section: where(a) }); return; }
    if (/^https?:$/.test(a.protocol) && a.hostname && a.hostname !== location.hostname) window.siteTrack('outbound_click', { domain: a.hostname.replace(/^www\./, '') });
  }, true);
  document.addEventListener('focusin', function (e) {
    var t = e.target;
    if (!t || !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || !t.form) return;
    var name = formName(t.form);
    if (name && once('form:' + name)) window.siteTrack('form_started', { form: name });
  });
  document.addEventListener('input', function (e) {
    var sec = /\/calculators$/.test(location.pathname) && e.target && e.target.closest ? e.target.closest('section[id]') : null;
    if (sec && once('calc:' + sec.id)) window.siteTrack('calculator_used', { calculator: sec.id });
  });

  // Counsel 2026-09-24 conditions: dead taps keep only the element type (no text, classes,
  // attributes or element chain); page-speed events keep only the numbers; every event loses
  // screen and window sizes and the device model, versions are cut to the major number, and
  // referrers to the website address.
  function trim(ev) {
    var p = ev.properties || {}, k;
    if (ev.event === '$dead_click') {
      var first = (p.$elements && p.$elements[0]) || {};
      var tag = first.tag_name || String(p.$elements_chain || '').split(/[.:;]/)[0];
      for (k in p) if (/^\$(elements|elements_chain|el_text|event_type|ce_version|external_click_url)$/.test(k)) delete p[k];
      p.element = String(tag || '').toLowerCase().slice(0, 20);
    }
    if (ev.event === '$web_vitals') for (k in p) if (/^\$web_vitals_.+_event$/.test(k)) delete p[k];
    [p, p.$set_once || {}].forEach(function (o) {
      ['$screen_height', '$screen_width', '$viewport_height', '$viewport_width', '$device'].forEach(function (x) { delete o[x]; });
      if (typeof o.$browser_version === 'number') o.$browser_version = Math.floor(o.$browser_version);
      if (typeof o.$os_version === 'string') o.$os_version = o.$os_version.split(/[._]/)[0];
      for (k in o) {
        if (/referrer$/i.test(k) && typeof o[k] === 'string') o[k] = o[k].replace(/^(https?:\/\/[^\/?#]+).*$/i, '$1');
        // search words PostHog lifts from a Google referrer, and ad-click identifiers (gclid, fbclid...)
        if (/(ph_keyword|clid|clkid|gclsrc|gbraid|wbraid|gad_source|li_fat_id|_cid|mc_eid|igshid|sccid|_kx|epik)$/i.test(k)) delete o[k];
        // campaign labels too: counsel 2026-09-24, CNIL criteria exclude UTM collection
        else if (/(^|_)utm_(source|medium|campaign|content|term)$/i.test(k)) delete o[k];
      }
    });
  }
  // Rage taps: three taps within a second on the same spot. The position is compared here and
  // never sent; the event carries only the element type (counsel 2026-09-24, item k).
  var taps = [];
  document.addEventListener('click', function (e) {
    var now = Date.now();
    taps = taps.filter(function (t) { return now - t.t < 1000 && Math.abs(t.x - e.clientX) < 30 && Math.abs(t.y - e.clientY) < 30; });
    taps.push({ t: now, x: e.clientX, y: e.clientY });
    if (taps.length === 3) window.siteTrack('rage_click', { element: e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '' });
  }, true);

  if (document.getElementById('ph-loader')) return;
  var s = document.createElement('script');
  s.id = 'ph-loader'; s.async = true; s.src = POSTHOG_HOST + '/static/array.js';
  s.onload = function () {
    if (!window.posthog) return;
    window.posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      cookieless_mode: 'always',   // no cookie, no localStorage, no visitor id on the device
      persistence: 'memory',
      person_profiles: 'never',
      respect_dnt: true,
      // The automatic pageview raced the init state in the banner era (live data
      // 2026-09-09); sent by hand from `loaded` so every counted visit has one.
      capture_pageview: false,
      capture_pageleave: true,
      capture_exceptions: true,
      autocapture: false,
      capture_heatmaps: false,
      // Counsel 2026-09-24: broken-tap signals (element text stripped below) and page-speed
      // numbers are audience measurement; autocapture and heatmaps stay off (behavioural).
      capture_dead_clicks: true,
      rageclick: false,            // needs autocapture; rage_click is detected below instead
      capture_performance: { web_vitals: true, network_timing: false },
      disable_session_recording: true,
      disable_surveys: true,
      // Belt and braces: only the counting set can leave, whatever the SDK adds later.
      before_send: function (ev) {
        if (!ev) return ev;
        if (!ALLOWED.test(ev.event)) return null;
        try { if (localStorage.getItem('natalie_no_count') === '1') return null; } catch (e) {} // pressed on this page
        trim(ev);
        scrub(ev.properties);
        return ev;
      },
      loaded: function (p) { p.capture('$pageview'); }
    });
  };
  document.head.appendChild(s);
})();
