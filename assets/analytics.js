/* ────────────────────────────────────────────────────────────────────────────
 * ANALYTICS + CONSENT: PostHog Cloud EU (Michael's decision 2026-09-08, banner path).
 *
 * Contract (counsel 2026-09-08):
 *  - Before any choice, and after "Decline": cookieless counting only
 *    (cookieless_mode 'on_reject' + opt_out_capturing = PostHog's server-side
 *    daily hash; nothing written to cookies, localStorage or sessionStorage).
 *  - After "Accept": PostHog may store its cookie/localStorage items and session
 *    replay runs with every input masked and every <form> blocked (ph-no-capture).
 *  - The choice itself is the ONE item this file stores: localStorage
 *    natalie_analytics_consent = 'yes|<ms>' | 'no|<ms>' (strictly necessary to
 *    honour it; asked again after six months). PostHog adds its own __ph_opt_in_out_ item.
 *  - Do Not Track / Global Privacy Control = treated as "Decline", no banner.
 *  - "Privacy choices" link (injected next to the footer Privacy link) reopens the banner.
 *  - Project settings that must be ON in PostHog: cookieless server hash, discard client IP.
 *  - Empty POSTHOG_KEY = nothing loads, no banner, no requests.
 * ──────────────────────────────────────────────────────────────────────────── */
(function () {
  var POSTHOG_KEY = '';                    // project API key from PostHog Cloud EU
  var POSTHOG_HOST = 'https://eu.i.posthog.com';
  var CONSENT_KEY = 'natalie_analytics_consent';
  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var preview = local && /nl-consent-preview/.test(location.search); // ?nl-consent-preview shows the banner on localhost, loads nothing
  if (!POSTHOG_KEY && !preview) return;
  if (local && !preview) return; // never count QA sessions

  var dnt = (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true);
  var SIX_MONTHS = 182 * 24 * 3600 * 1000; // counsel: ask again after six months
  function getChoice() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY); if (!raw) return null;
      var parts = raw.split('|'); // "yes|<ms since epoch>"
      if (parts.length < 2 || (Date.now() - Number(parts[1])) > SIX_MONTHS) { clearChoice(); return null; }
      return parts[0];
    } catch (e) { return null; }
  }
  function setChoice(v) { try { localStorage.setItem(CONSENT_KEY, v + '|' + Date.now()); } catch (e) {} }
  function clearChoice() { try { localStorage.removeItem(CONSENT_KEY); } catch (e) {} }

  var ph = null, pending = [];
  function withPosthog(fn) { if (ph) fn(ph); else pending.push(fn); }
  function load() {
    if (preview || ph || document.getElementById('ph-loader')) return;
    var s = document.createElement('script');
    s.id = 'ph-loader'; s.async = true; s.src = POSTHOG_HOST + '/static/array.js';
    s.onload = function () {
      if (!window.posthog) return;
      window.posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        cookieless_mode: 'on_reject',
        opt_out_capturing_by_default: true, // stays cookieless until accept()
        person_profiles: 'never',
        respect_dnt: true,
        capture_pageview: true,
        capture_pageleave: true,
        capture_exceptions: true,
        autocapture: true,
        disable_surveys: true,
        session_recording: {
          maskAllInputs: true,
          blockSelector: 'form, input, textarea, select',
          maskTextSelector: '[data-ph-mask]',
          recordHeaders: false,   // counsel: form POST bodies carry name/email/phone
          recordBody: false
        },
        loaded: function (p) { ph = p; pending.forEach(function (fn) { fn(p); }); pending = []; }
      });
    };
    document.head.appendChild(s);
  }
  function accept() { setChoice('yes'); load(); withPosthog(function (p) { p.opt_in_capturing(); if (p.startSessionRecording) p.startSessionRecording(); }); }
  function decline() { setChoice('no'); load(); withPosthog(function (p) { p.opt_out_capturing(); }); }
  function countOnly() { load(); withPosthog(function (p) { p.opt_out_capturing(); }); }

  /* ── Banner, styled like the site: ivory card, hairline, Cormorant capitals,
        Montserrat body, two equal buttons (no dark patterns). ── */
  var css = ''
    + '#nl-consent{position:fixed;left:1rem;right:1rem;bottom:1rem;z-index:45;display:flex;justify-content:center;pointer-events:none}'
    + '#nl-consent .c{pointer-events:auto;width:100%;max-width:34rem;background:#FDFBF7;border:1px solid #E6E3DD;box-shadow:0 18px 50px rgba(12,12,14,.16);padding:1.35rem 1.5rem 1.25rem;'
    + 'font-family:"Montserrat Variable",Montserrat,ui-sans-serif,system-ui,sans-serif;color:#5C5C5C;font-size:.8125rem;line-height:1.65;'
    + 'transform:translateY(12px);opacity:0;transition:transform .6s cubic-bezier(.16,1,.3,1),opacity .5s ease}'
    + '#nl-consent.on .c{transform:none;opacity:1}'
    + '#nl-consent h2{font-family:"Cormorant Garamond",ui-serif,Georgia,serif;font-weight:500;text-transform:uppercase;letter-spacing:.04em;font-size:1.25rem;line-height:1.15;color:#2C2C2C;margin:0 0 .5rem}'
    + '#nl-consent p{margin:0 0 1rem}'
    + '#nl-consent a{color:#2C2C2C;text-decoration:underline;text-underline-offset:2px}'
    + '#nl-consent .b{display:flex;gap:.6rem;flex-wrap:wrap}'
    + '#nl-consent button{flex:1 1 9rem;cursor:pointer;background:transparent;border:1px solid #2C2C2C;color:#2C2C2C;padding:.7rem 1rem;font:inherit;font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;transition:background .18s,color .18s}'
    + '#nl-consent button:hover{background:#2C2C2C;color:#FDFBF7}'
    + '#nl-consent button:focus-visible{outline:2px solid #2C2C2C;outline-offset:2px}'
    + '@media (prefers-reduced-motion:reduce){#nl-consent .c{transition:none}}';

  var COPY = {
    title: 'Your privacy on this site',
    body: 'This site counts visits without cookies. With your permission it also keeps a 30-day replay of how you move through the pages (scrolling and clicks, never what you type). Change your mind at any time.',
    accept: 'Accept',
    decline: 'Decline',
    link: 'Privacy policy'
  };

  function showBanner() {
    if (document.getElementById('nl-consent')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var w = document.createElement('div'); w.id = 'nl-consent'; w.setAttribute('role', 'region'); w.setAttribute('aria-label', 'Privacy choices');
    var c = document.createElement('div'); c.className = 'c';
    var h = document.createElement('h2'); h.textContent = COPY.title;
    var p = document.createElement('p'); p.textContent = COPY.body + ' ';
    var a = document.createElement('a'); a.href = '/privacy'; a.textContent = COPY.link; p.appendChild(a); p.appendChild(document.createTextNode('.'));
    var b = document.createElement('div'); b.className = 'b';
    var yes = document.createElement('button'); yes.type = 'button'; yes.textContent = COPY.accept;
    var no = document.createElement('button'); no.type = 'button'; no.textContent = COPY.decline;
    function close() { w.classList.remove('on'); setTimeout(function () { w.remove(); }, 600); }
    yes.addEventListener('click', function () { accept(); close(); });
    no.addEventListener('click', function () { decline(); close(); });
    b.appendChild(no); b.appendChild(yes);
    c.appendChild(h); c.appendChild(p); c.appendChild(b); w.appendChild(c); document.body.appendChild(w);
    requestAnimationFrame(function () { requestAnimationFrame(function () { w.classList.add('on'); }); });
  }

  // Footer "Privacy choices" link: forget the choice and ask again.
  function addChoicesLink() {
    var link = document.querySelector('footer a[href="/privacy"]');
    if (!link || document.getElementById('privacy-choices')) return;
    var li = link.parentNode, item = li.cloneNode(false);
    var a = document.createElement('a'); a.id = 'privacy-choices'; a.href = '#'; a.className = link.className; a.textContent = 'Privacy choices';
    a.addEventListener('click', function (ev) { ev.preventDefault(); clearChoice(); showBanner(); });
    item.appendChild(a); li.parentNode.insertBefore(item, li.nextSibling);
  }

  function start() {
    addChoicesLink();
    var choice = getChoice();
    if (dnt || choice === 'no') { countOnly(); return; }
    if (choice === 'yes') { accept(); return; }
    countOnly();
    // Pages with the scroll-driven hero (gandarinha): the card would cover the
    // "Scroll to explore" hint, the one instruction a first visit gets. Wait until
    // the hero has left the screen and the email pop-up (#gate) is not open.
    var hero = document.getElementById('walkthrough'), gate = document.getElementById('gate');
    if (!hero || !('IntersectionObserver' in window)) { showBanner(); return; }
    // The pop-up has been passed when the page flag is '2' (returning visitor) or
    // once #gate goes hidden -> open -> hidden in this visit.
    function whenGatePassed(fn) {
      var passed = false; try { passed = localStorage.getItem('gandarinha-gate-email') === '2'; } catch (e) {}
      if (!gate || passed) { fn(); return; }
      var opened = !gate.hidden;
      var mo = new MutationObserver(function () {
        if (!gate.hidden) { opened = true; return; }
        if (opened) { mo.disconnect(); fn(); }
      });
      mo.observe(gate, { attributes: true, attributeFilter: ['hidden'] });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (!en.isIntersecting) { io.disconnect(); whenGatePassed(showBanner); } });
    }, { threshold: 0 });
    io.observe(hero);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
