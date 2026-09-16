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
 *  - What leaves the browser, and nothing else: $pageview, $pageleave,
 *    $exception (JS errors), walkthrough_play (the Play tap on the private
 *    listing), gate_submitted (the email pop-up, no email) and form_submitted
 *    (form name only, never the contents; Michael 2026-09-16). Query strings,
 *    fragments and anything email-shaped are stripped.
 *  - Do Not Track / Global Privacy Control = nothing loads. localhost and LAN
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
      capture_dead_clicks: false,
      rageclick: false,
      capture_performance: false,  // web vitals stay off (counsel 2026-09-10)
      disable_session_recording: true,
      disable_surveys: true,
      // Belt and braces: only the counting set can leave, whatever the SDK adds later.
      before_send: function (ev) {
        if (!ev) return ev;
        if (!/^(\$pageview|\$pageleave|\$exception|walkthrough_play|gate_submitted|form_submitted)$/.test(ev.event)) return null;
        scrub(ev.properties);
        return ev;
      },
      loaded: function (p) { p.capture('$pageview'); }
    });
  };
  document.head.appendChild(s);
})();
