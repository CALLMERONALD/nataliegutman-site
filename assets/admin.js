const SUPABASE_URL = 'https://supabase.vandalesolutions.com';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzgxNTcyODc0LCJleHAiOjE5MzkyNTI4NzR9.F676ikQc-ocleC7cDjwiLB9N_YaUmOyVj2NOeR7o2VQ';

(function () {
  'use strict';

  var NATALIE_UID = '696378f9-f9f9-4a72-8f5d-66ec03a09312';
  var DATA_URL = SUPABASE_URL + '/rest/v1/properties';
  var STORAGE_URL = SUPABASE_URL + '/storage/v1/object/natalie-properties/';
  var PUBLIC_PHOTO_URL = SUPABASE_URL + '/storage/v1/object/public/natalie-properties/';
  var TOKEN_URL = SUPABASE_URL + '/auth/v1/token';
  var LOGOUT_URL = SUPABASE_URL + '/auth/v1/logout';
  var SESSION_KEY = 'natalie-admin-session-v1';
  var CLEANUP_KEY = 'natalie-admin-pending-cleanup-v1';
  var MAX_SOURCE_BYTES = 20 * 1024 * 1024;
  var MAX_OUTPUT_BYTES = 5 * 1024 * 1024;
  var MAX_SOURCE_DIMENSION = 8000;
  var MAX_OUTPUT_DIMENSION = 1600;
  var MAX_PHOTOS = 12;
  var PHOTO_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/;

  var STATUS_LABELS = {
    available: 'Available',
    under_offer: 'Under offer',
    sold: 'Sold'
  };

  var AMENITY_LABELS = {
    parking: 'Parking',
    garage: 'Garage',
    elevator: 'Elevator',
    pool: 'Pool',
    garden: 'Garden',
    terrace: 'Terrace / Balcony',
    sea_view: 'Sea view',
    air_con: 'Air conditioning',
    storage: 'Storage',
    furnished: 'Furnished'
  };

  // Static SVG only. This mirrors the private icon map in portfolio.js; no listing data is inserted as HTML.
  var AMENITY_ICONS = {
    parking: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Parking</title><path d="M6 21V3h7a5 5 0 010 10H6M6 13h7"/></svg>',
    garage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Garage</title><path d="M3 21V8l9-4 9 4v13M7 21v-9h10v9M7 16h10"/></svg>',
    elevator: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Elevator</title><path d="M5 3h14v18H5z"/><path d="M9 10V6m0 0L7.5 7.5M9 6l1.5 1.5"/><path d="M15 14v4m0 0l-1.5-1.5M15 18l1.5-1.5"/></svg>',
    pool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Pool</title><path d="M3 10c2 0 2 1.5 4 1.5S9 10 11 10s2 1.5 4 1.5S17 10 19 10s2 1.5 2 1.5"/><path d="M3 15c2 0 2 1.5 4 1.5S9 15 11 15s2 1.5 4 1.5S17 15 19 15s2 1.5 2 1.5"/><path d="M7 10V5a2 2 0 014 0v5"/></svg>',
    garden: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Garden</title><path d="M12 21V9M12 14c-4 0-7-2.5-7-7 4 0 7 2.5 7 7z"/><path d="M12 11c0-4 2.5-7 7-7 0 4-2.5 7-7 7z"/></svg>',
    terrace: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Terrace / Balcony</title><path d="M4 10h16M5 10l2-6h10l2 6"/><path d="M6 10v10M18 10v10M3 20h18"/><path d="M9 14h6"/></svg>',
    sea_view: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Sea view</title><path d="M16 9a4 4 0 10-8 0"/><path d="M3 14c2 0 2 1.5 4 1.5S9 14 11 14s2 1.5 4 1.5S17 14 19 14s2 1.5 2 1.5"/><path d="M3 19c2 0 2 1.5 4 1.5S9 19 11 19s2 1.5 4 1.5S17 19 19 19s2 1.5 2 1.5"/></svg>',
    air_con: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Air conditioning</title><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5"/><path d="M4.5 10l3.4-.9-.9-3.4M19.5 14l-3.4.9.9 3.4"/></svg>',
    storage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Storage</title><path d="M4 7h16v14H4zM3 3h18v4H3z"/><path d="M9 11h6"/></svg>',
    furnished: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Furnished</title><path d="M6 12V7a3 3 0 016 0v5M4 12h16v6H4z"/><path d="M7 18v3M17 18v3M12 12V8a3 3 0 016 0v4"/></svg>'
  };

  var elements = {};
  var session = null;
  var refreshInFlight = null;
  var properties = [];
  var editingProperty = null;
  var photoItems = [];
  var formBusy = false;
  var formStateUnknown = false;
  var memoryCleanupQueue = [];

  function byId(id) {
    return document.getElementById(id);
  }

  function createElement(tagName, className, text) {
    var element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = String(text);
    return element;
  }

  function clearElement(element) {
    while (element.firstChild) element.removeChild(element.firstChild);
  }

  function setMessage(element, message) {
    if (!element) return;
    element.textContent = String(message);
    element.hidden = false;
  }

  function clearMessage(element) {
    if (!element) return;
    element.textContent = '';
    element.hidden = true;
  }

  function uniquePhotoKeys(values) {
    var keys = [];
    (Array.isArray(values) ? values : []).forEach(function (key) {
      if (typeof key === 'string' && PHOTO_KEY_PATTERN.test(key) && keys.indexOf(key) === -1) keys.push(key);
    });
    return keys;
  }

  function photoUrl(key) {
    return PUBLIC_PHOTO_URL + encodeURIComponent(key);
  }

  function decodeJwtPayload(token) {
    var parts = String(token || '').split('.');
    if (parts.length !== 3) throw new Error('Invalid access token');
    var normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    normalized += new Array((4 - normalized.length % 4) % 4 + 1).join('=');
    return JSON.parse(atob(normalized));
  }

  function tokenBelongsToNatalie(token) {
    try {
      return decodeJwtPayload(token).sub === NATALIE_UID;
    } catch (error) {
      return false;
    }
  }

  function tokenPairFromResponse(data) {
    if (!data || typeof data.access_token !== 'string' || typeof data.refresh_token !== 'string') {
      throw new Error('The authentication response did not include a complete session.');
    }
    return { access_token: data.access_token, refresh_token: data.refresh_token };
  }

  function storeSession(pair) {
    if (!tokenBelongsToNatalie(pair.access_token)) throw new Error('This account has no access');
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      access_token: pair.access_token,
      refresh_token: pair.refresh_token
    }));
    session = { access_token: pair.access_token, refresh_token: pair.refresh_token };
  }

  function readSession() {
    var stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    try {
      var parsed = JSON.parse(stored);
      if (!parsed || typeof parsed.access_token !== 'string' || typeof parsed.refresh_token !== 'string') return null;
      return { access_token: parsed.access_token, refresh_token: parsed.refresh_token };
    } catch (error) {
      return null;
    }
  }

  function clearSession() {
    session = null;
    refreshInFlight = null;
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {}
  }

  function requestError(message, status, ambiguous, authFailure) {
    var error = new Error(message);
    error.status = status || 0;
    error.ambiguous = ambiguous === true;
    error.authFailure = authFailure === true;
    return error;
  }

  async function authRequest(query, body) {
    var response;
    try {
      response = await fetch(TOKEN_URL + query, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    } catch (error) {
      throw requestError('The authentication service could not be reached.', 0, false, true);
    }

    var data = {};
    try {
      data = await response.json();
    } catch (error) {}
    if (!response.ok) {
      throw requestError(data.error_description || data.msg || 'Authentication failed.', response.status, false, true);
    }
    return data;
  }

  async function postLogout(accessToken) {
    if (!accessToken) return true;
    var response = await fetch(LOGOUT_URL, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      body: '{}'
    });
    return response.ok;
  }

  function showLogin(message) {
    elements.adminView.hidden = true;
    elements.loginView.hidden = false;
    elements.loginSubmit.disabled = false;
    elements.signOut.disabled = false;
    if (message) setMessage(elements.loginError, message);
    else clearMessage(elements.loginError);
  }

  function showAdmin() {
    clearMessage(elements.loginError);
    elements.loginView.hidden = true;
    elements.adminView.hidden = false;
  }

  async function rejectWrongAccount(accessToken) {
    try {
      await postLogout(accessToken);
    } catch (error) {}
    clearSession();
    showLogin('This account has no access');
  }

  function refreshSession() {
    if (refreshInFlight) return refreshInFlight;
    if (!session || !session.refresh_token) {
      clearSession();
      showLogin('Your session has expired. Please sign in again.');
      return Promise.reject(requestError('No refresh token is available.', 401, false, true));
    }

    var refreshToken = session.refresh_token;
    refreshInFlight = authRequest('?grant_type=refresh_token', { refresh_token: refreshToken }).then(async function (data) {
      var pair = tokenPairFromResponse(data);
      if (!tokenBelongsToNatalie(pair.access_token)) {
        await rejectWrongAccount(pair.access_token);
        throw requestError('This account has no access', 403, false, true);
      }
      try {
        storeSession(pair);
      } catch (error) {
        clearSession();
        showLogin('Your refreshed session could not be stored. Please sign in again.');
        throw requestError('The refreshed session could not be stored.', 0, false, true);
      }
      return pair;
    }, function (error) {
      clearSession();
      showLogin('Your session has expired. Please sign in again.');
      throw requestError(error.message || 'Session refresh failed.', error.status, false, true);
    });

    refreshInFlight = refreshInFlight.then(function (pair) {
      refreshInFlight = null;
      return pair;
    }, function (error) {
      refreshInFlight = null;
      throw error;
    });
    return refreshInFlight;
  }

  function authorizedHeaders(headers, accessToken) {
    var result = {};
    Object.keys(headers || {}).forEach(function (name) { result[name] = headers[name]; });
    result.apikey = SUPABASE_ANON_KEY;
    result.Authorization = 'Bearer ' + accessToken;
    return result;
  }

  async function authorizedFetch(url, options) {
    if (!session) throw requestError('No authenticated session is available.', 401, false, true);
    var requestToken = session.access_token;
    var requestOptions = Object.assign({}, options || {}, {
      headers: authorizedHeaders((options || {}).headers, requestToken)
    });
    var response = await fetch(url, requestOptions);
    if (response.status !== 401) return response;

    if (!session) throw requestError('Your session has expired.', 401, false, true);
    if (session.access_token === requestToken) await refreshSession();
    if (!session) throw requestError('Your session has expired.', 401, false, true);

    requestOptions.headers = authorizedHeaders((options || {}).headers, session.access_token);
    response = await fetch(url, requestOptions);
    if (response.status === 401) {
      clearSession();
      showLogin('Your session has expired. Please sign in again.');
      throw requestError('The request was not authorized after one retry.', 401, false, true);
    }
    return response;
  }

  async function responseText(response) {
    try {
      return await response.text();
    } catch (error) {
      return '';
    }
  }

  async function dataRequest(method, query, body) {
    var headers;
    var options = { method: method };
    if (method === 'GET' || method === 'HEAD') {
      headers = { 'Accept-Profile': 'natalie' };
    } else {
      headers = {
        'Content-Profile': 'natalie',
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      };
      options.body = JSON.stringify(body === undefined ? {} : body);
    }
    options.headers = headers;

    var response;
    try {
      response = await authorizedFetch(DATA_URL + query, options);
    } catch (error) {
      if (error.authFailure) throw error;
      throw requestError('The listings request could not be confirmed.', 0, method !== 'GET' && method !== 'HEAD', false);
    }
    if (!response.ok) {
      var detail = await responseText(response);
      var message = 'Listings request failed with HTTP ' + response.status;
      if (detail) message += ': ' + detail.slice(0, 300);
      throw requestError(message, response.status, response.status >= 500, false);
    }
    if (method === 'GET') {
      try {
        var rows = JSON.parse(await response.text());
        if (!Array.isArray(rows)) throw new Error('Response was not an array');
        return rows;
      } catch (error) {
        throw requestError('The listings response could not be read.', response.status, false, false);
      }
    }
    return null;
  }

  async function uploadPhoto(item) {
    var response;
    try {
      response = await authorizedFetch(STORAGE_URL + encodeURIComponent(item.key), {
        method: 'POST',
        headers: {
          'Content-Type': 'image/jpeg',
          'x-upsert': 'false'
        },
        body: item.blob
      });
    } catch (error) {
      if (error.authFailure) throw error;
      throw requestError('Photo upload outcome is unknown.', 0, true, false);
    }
    if (!response.ok) {
      throw requestError('Photo upload failed with HTTP ' + response.status + '.', response.status, response.status >= 500, false);
    }
  }

  function storageDeleteIsConfirmed(result) {
    var body = result && result.body;
    return Boolean(result && (result.ok === true || result.status === 404 ||
      (body && (body.statusCode === '404' || body.error === 'not_found'))));
  }

  async function deleteStoredPhoto(key) {
    var response;
    try {
      response = await authorizedFetch(STORAGE_URL + encodeURIComponent(key), {
        method: 'DELETE',
        headers: {}
      });
    } catch (error) {
      throw error;
    }
    var body = null;
    if (!response.ok && response.status !== 404) {
      try {
        body = await response.json();
      } catch (error) {}
    }
    if (storageDeleteIsConfirmed({ ok: response.ok, status: response.status, body: body })) return;
    throw requestError('Photo cleanup failed with HTTP ' + response.status + '.', response.status, response.status >= 500, false);
  }

  function readCleanupQueue() {
    var stored = [];
    try {
      var parsed = JSON.parse(localStorage.getItem(CLEANUP_KEY) || '[]');
      stored = uniquePhotoKeys(parsed);
    } catch (error) {}
    return uniquePhotoKeys(stored.concat(memoryCleanupQueue));
  }

  function writeCleanupQueue(keys) {
    var cleanKeys = uniquePhotoKeys(keys);
    memoryCleanupQueue = cleanKeys.slice();
    try {
      localStorage.setItem(CLEANUP_KEY, JSON.stringify(cleanKeys));
      return true;
    } catch (error) {
      return false;
    }
  }

  function addCleanupCandidates(keys) {
    var queued = uniquePhotoKeys(readCleanupQueue().concat(keys));
    return writeCleanupQueue(queued);
  }

  function removeCleanupCandidate(key) {
    return writeCleanupQueue(readCleanupQueue().filter(function (queuedKey) { return queuedKey !== key; }));
  }

  function cleanupWarning(count, durable) {
    var message = count + ' photo cleanup ' + (count === 1 ? 'item is' : 'items are') + ' still pending and will be retried on the next admin load.';
    if (!durable) message += ' This browser could not save the cleanup queue durably; keep this page open and retry.';
    setMessage(elements.cleanupWarning, message);
  }

  async function cleanupKeys(keys) {
    var failed = [];
    var durable = true;
    var candidates = uniquePhotoKeys(keys);
    for (var index = 0; index < candidates.length; index += 1) {
      try {
        await deleteStoredPhoto(candidates[index]);
        if (!removeCleanupCandidate(candidates[index])) durable = false;
      } catch (error) {
        failed.push(candidates[index]);
        if (!addCleanupCandidates([candidates[index]])) durable = false;
      }
    }
    if (failed.length) cleanupWarning(readCleanupQueue().length, durable);
    else if (readCleanupQueue().length === 0) clearMessage(elements.cleanupWarning);
    return failed;
  }

  async function retryPendingCleanup() {
    var queued = readCleanupQueue();
    if (!queued.length) {
      clearMessage(elements.cleanupWarning);
      return;
    }
    var failed = [];
    var durable = true;
    for (var index = 0; index < queued.length; index += 1) {
      try {
        await deleteStoredPhoto(queued[index]);
        if (!removeCleanupCandidate(queued[index])) durable = false;
      } catch (error) {
        failed.push(queued[index]);
      }
    }
    if (failed.length) {
      if (!writeCleanupQueue(failed)) durable = false;
      cleanupWarning(failed.length, durable);
    } else {
      writeCleanupQueue([]);
      clearMessage(elements.cleanupWarning);
    }
  }

  function valuesMatch(row, intended) {
    return Object.keys(intended).every(function (key) {
      var actual = row[key];
      var expected = intended[key];
      if (Array.isArray(expected)) {
        return Array.isArray(actual) && actual.length === expected.length && actual.every(function (value, index) {
          return value === expected[index];
        });
      }
      return actual === expected;
    });
  }

  async function getProperty(id) {
    var rows = await dataRequest('GET', '?select=*&id=eq.' + encodeURIComponent(id) + '&limit=1');
    return rows.length ? rows[0] : null;
  }

  async function mutateWithReconciliation(operation, id, values) {
    var method = operation === 'create' ? 'POST' : (operation === 'edit' ? 'PATCH' : 'DELETE');
    var query = operation === 'create' ? '' : '?id=eq.' + encodeURIComponent(id);
    try {
      await dataRequest(method, query, values);
      return { outcome: 'applied' };
    } catch (error) {
      if (!error.ambiguous) return { outcome: 'failed', error: error };
      try {
        var row = await getProperty(id);
        if (operation === 'create') return row ? { outcome: 'applied' } : { outcome: 'failed', error: error };
        if (operation === 'edit') return row && valuesMatch(row, values) ? { outcome: 'applied' } : { outcome: 'failed', error: error };
        return row ? { outcome: 'failed', error: error } : { outcome: 'applied' };
      } catch (reconciliationError) {
        return { outcome: 'unknown', error: reconciliationError };
      }
    }
  }

  function formatApiError(error, fallback) {
    if (!error || !error.message) return fallback;
    if (error.status >= 400 && error.status < 500) return fallback + ' Check the entered values and publishing requirements.';
    return fallback;
  }

  function setFormBusy(busy) {
    formBusy = busy;
    var controls = elements.propertyForm.querySelectorAll('input, select, textarea, button');
    Array.prototype.forEach.call(controls, function (control) {
      control.disabled = busy || formStateUnknown;
    });
    elements.backToList.disabled = busy;
  }

  function revokeNewPhotoUrls() {
    photoItems.forEach(function (item) {
      if (item.isNew && item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
  }

  function resetNewPhotoKeys() {
    photoItems.forEach(function (item) {
      if (item.isNew) item.key = crypto.randomUUID() + '.jpg';
    });
    renderPhotos();
  }

  function renderPhotos() {
    clearElement(elements.photoList);
    photoItems.forEach(function (item, index) {
      var card = createElement('div', 'w-32 flex-none min-w-0');
      var image = createElement('img', 'w-32 h-24 object-cover bg-surface');
      image.src = item.isNew ? item.previewUrl : photoUrl(item.key);
      image.alt = 'Property photo ' + (index + 1);
      card.appendChild(image);

      if (index === 0) card.appendChild(createElement('p', 'label text-ink mt-2', 'Cover'));
      var actions = createElement('div', 'flex items-center gap-1 mt-2');

      var left = createElement('button', 'w-8 h-8 border border-hairline text-ink disabled:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent', '←');
      left.type = 'button';
      left.disabled = index === 0 || formBusy || formStateUnknown;
      left.setAttribute('aria-label', 'Move photo ' + (index + 1) + ' left');
      left.addEventListener('click', function () {
        var previous = photoItems[index - 1];
        photoItems[index - 1] = photoItems[index];
        photoItems[index] = previous;
        renderPhotos();
      });
      actions.appendChild(left);

      var right = createElement('button', 'w-8 h-8 border border-hairline text-ink disabled:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent', '→');
      right.type = 'button';
      right.disabled = index === photoItems.length - 1 || formBusy || formStateUnknown;
      right.setAttribute('aria-label', 'Move photo ' + (index + 1) + ' right');
      right.addEventListener('click', function () {
        var next = photoItems[index + 1];
        photoItems[index + 1] = photoItems[index];
        photoItems[index] = next;
        renderPhotos();
      });
      actions.appendChild(right);

      var remove = createElement('button', 'w-8 h-8 border border-hairline text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent', '✕');
      remove.type = 'button';
      remove.disabled = formBusy || formStateUnknown;
      remove.setAttribute('aria-label', 'Remove photo ' + (index + 1));
      remove.addEventListener('click', function () {
        if (item.isNew && item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        photoItems.splice(index, 1);
        renderPhotos();
      });
      actions.appendChild(remove);
      card.appendChild(actions);
      elements.photoList.appendChild(card);
    });
  }

  function validatePhotoFile(file) {
    var extensionOk = /\.(jpe?g|png|webp)$/i.test(file.name || '');
    var allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!extensionOk || (file.type && allowedTypes.indexOf(file.type) === -1)) {
      throw new Error((file.name || 'This file') + ' is not a JPG, PNG or WebP image.');
    }
    if (file.size > MAX_SOURCE_BYTES) throw new Error((file.name || 'This file') + ' is larger than 20 MB.');
  }

  function processPhoto(file) {
    validatePhotoFile(file);
    return new Promise(function (resolve, reject) {
      var sourceUrl = URL.createObjectURL(file);
      var image = new Image();
      var released = false;

      function release() {
        if (released) return;
        released = true;
        URL.revokeObjectURL(sourceUrl);
      }

      image.onerror = function () {
        release();
        reject(new Error((file.name || 'This file') + ' could not be read as an image.'));
      };
      image.onload = function () {
        var width = image.naturalWidth;
        var height = image.naturalHeight;
        if (!width || !height || width > MAX_SOURCE_DIMENSION || height > MAX_SOURCE_DIMENSION) {
          release();
          reject(new Error((file.name || 'This file') + ' is larger than 8000 px or has invalid dimensions.'));
          return;
        }

        var scale = Math.min(1, MAX_OUTPUT_DIMENSION / Math.max(width, height));
        var outputWidth = Math.max(1, Math.round(width * scale));
        var outputHeight = Math.max(1, Math.round(height * scale));
        var canvas = document.createElement('canvas');
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        var context = canvas.getContext('2d');
        if (!context) {
          release();
          reject(new Error('This browser could not prepare the selected photo.'));
          return;
        }
        context.drawImage(image, 0, 0, outputWidth, outputHeight);
        release();
        canvas.toBlob(function (blob) {
          canvas.width = 1;
          canvas.height = 1;
          if (!blob) {
            reject(new Error((file.name || 'This file') + ' could not be converted to JPEG.'));
            return;
          }
          if (blob.size > MAX_OUTPUT_BYTES) {
            reject(new Error((file.name || 'This file') + ' could not be reduced below 5 MB.'));
            return;
          }
          resolve({
            key: crypto.randomUUID() + '.jpg',
            blob: blob,
            previewUrl: URL.createObjectURL(blob),
            isNew: true
          });
        }, 'image/jpeg', 0.82);
      };
      image.src = sourceUrl;
    });
  }

  async function handlePhotoSelection(event) {
    var files = Array.prototype.slice.call(event.target.files || []);
    event.target.value = '';
    clearMessage(elements.formError);
    if (!files.length) return;
    if (photoItems.length + files.length > MAX_PHOTOS) {
      setMessage(elements.formError, 'A property can have no more than 12 photos. Remove photos before adding this selection.');
      return;
    }

    setFormBusy(true);
    setMessage(elements.photoStatus, 'Preparing photos…');
    var errors = [];
    for (var index = 0; index < files.length; index += 1) {
      try {
        photoItems.push(await processPhoto(files[index]));
        renderPhotos();
      } catch (error) {
        errors.push(error.message);
      }
    }
    clearMessage(elements.photoStatus);
    setFormBusy(false);
    if (errors.length) setMessage(elements.formError, errors.join(' '));
  }

  function nullableInteger(formData, name, label) {
    var raw = String(formData.get(name) || '').trim();
    if (raw === '') return null;
    var value = Number(raw);
    if (!isFinite(value) || Math.floor(value) !== value || value < 0) throw new Error(label + ' must be a whole number of zero or more.');
    return value;
  }

  function collectFormValues() {
    var formData = new FormData(elements.propertyForm);
    var title = String(formData.get('title') || '').trim();
    var location = String(formData.get('location_area') || '').trim();
    if (!title || !location) throw new Error('Title and location are required.');
    var yearBuilt = nullableInteger(formData, 'year_built', 'Year built');
    if (yearBuilt !== null && (yearBuilt < 1500 || yearBuilt > 2100)) throw new Error('Year built must be between 1500 and 2100.');

    var values = {
      title: title,
      location_area: location,
      price: nullableInteger(formData, 'price', 'Price'),
      status: String(formData.get('status')),
      type: String(formData.get('type')),
      bedrooms: nullableInteger(formData, 'bedrooms', 'Bedrooms'),
      bathrooms: nullableInteger(formData, 'bathrooms', 'Bathrooms'),
      area_built: nullableInteger(formData, 'area_built', 'Built area'),
      area_plot: nullableInteger(formData, 'area_plot', 'Plot area'),
      floor: String(formData.get('floor') || '').trim() || null,
      year_built: yearBuilt,
      energy_rating: String(formData.get('energy_rating') || '') || null,
      description: String(formData.get('description') || '').trim() || null,
      amenities: formData.getAll('amenities').map(String),
      photos: photoItems.map(function (item) { return item.key; }),
      featured: formData.get('featured') === 'on',
      published: formData.get('published') === 'on'
    };
    if (values.published && (!values.photos.length || !values.description)) {
      throw new Error('Published properties need at least one photo and a description.');
    }
    // Mirrors the published_needs_content DB constraint: Portuguese law requires the
    // energy class in every property advertisement (DL 101-D/2020 art. 22(3)).
    if (values.published && !values.energy_rating) {
      throw new Error('Published properties must state an energy class — Portuguese law requires it in every property advertisement. Choose the class from the valid certificate, or "Exempt".');
    }
    return values;
  }

  function inputByName(name) {
    return elements.propertyForm.elements.namedItem(name);
  }

  function setInputValue(name, value) {
    var input = inputByName(name);
    if (input) input.value = value === null || value === undefined ? '' : String(value);
  }

  function showPropertyForm(property) {
    revokeNewPhotoUrls();
    elements.propertyForm.reset();
    editingProperty = property || null;
    photoItems = [];
    formStateUnknown = false;
    clearMessage(elements.formStatus);
    clearMessage(elements.formError);
    clearMessage(elements.photoStatus);
    elements.propertyFormHeading.textContent = property ? 'Edit property' : 'Add property';

    if (property) {
      ['title', 'location_area', 'price', 'status', 'type', 'bedrooms', 'bathrooms', 'area_built', 'area_plot', 'floor', 'year_built', 'energy_rating', 'description'].forEach(function (name) {
        setInputValue(name, property[name]);
      });
      inputByName('featured').checked = property.featured === true;
      inputByName('published').checked = property.published === true;
      var selectedAmenities = Array.isArray(property.amenities) ? property.amenities : [];
      Array.prototype.forEach.call(elements.propertyForm.querySelectorAll('input[name="amenities"]'), function (checkbox) {
        checkbox.checked = selectedAmenities.indexOf(checkbox.value) !== -1;
      });
      photoItems = uniquePhotoKeys(property.photos).map(function (key) {
        return { key: key, isNew: false, blob: null, previewUrl: '' };
      });
    }

    renderPhotos();
    setFormBusy(false);
    elements.listView.hidden = true;
    elements.formView.hidden = false;
    elements.propertyFormHeading.focus();
    window.scrollTo(0, 0);
  }

  function showListView() {
    revokeNewPhotoUrls();
    photoItems = [];
    editingProperty = null;
    formStateUnknown = false;
    setFormBusy(false);
    elements.formView.hidden = true;
    elements.listView.hidden = false;
    window.scrollTo(0, 0);
  }

  function renderPropertyList() {
    clearElement(elements.propertyList);
    elements.listEmpty.hidden = properties.length !== 0;

    properties.forEach(function (property) {
      var row = createElement('article', 'flex flex-wrap sm:flex-nowrap items-center gap-5 py-4 border-b border-hairline min-w-0 [overflow-wrap:anywhere]');
      var identity = createElement('div', 'flex items-center gap-4 min-w-0 flex-1 basis-full sm:basis-auto');
      var photoKeys = uniquePhotoKeys(property.photos);
      if (photoKeys.length) {
        var thumbnail = createElement('img', 'w-20 h-14 object-cover bg-surface flex-none');
        thumbnail.src = photoUrl(photoKeys[0]);
        thumbnail.alt = '';
        identity.appendChild(thumbnail);
      } else {
        identity.appendChild(createElement('div', 'w-20 h-14 bg-surface flex-none'));
      }
      var copy = createElement('div', 'min-w-0 [overflow-wrap:anywhere]');
      copy.appendChild(createElement('h3', 'font-serif text-lg text-ink', property.title || 'Untitled property'));
      copy.appendChild(createElement('p', 'text-sm text-muted', property.location_area || ''));
      identity.appendChild(copy);
      row.appendChild(identity);
      row.appendChild(createElement('p', 'label flex-none', STATUS_LABELS[property.status] || property.status || ''));

      var actions = createElement('div', 'w-full sm:w-auto flex flex-wrap items-center gap-4 sm:ml-auto');
      var publishLabel = createElement('label', 'label text-ink inline-flex items-center gap-2');
      var publishToggle = createElement('input', 'accent-ink w-4 h-4');
      publishToggle.type = 'checkbox';
      publishToggle.checked = property.published === true;
      publishToggle.setAttribute('aria-label', (property.published ? 'Unpublish ' : 'Publish ') + String(property.title || 'property'));
      publishToggle.addEventListener('change', function () {
        updatePublished(property, publishToggle.checked);
      });
      publishLabel.appendChild(publishToggle);
      publishLabel.appendChild(document.createTextNode('Published'));
      actions.appendChild(publishLabel);

      var edit = createElement('button', 'label text-ink link-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent', 'Edit');
      edit.type = 'button';
      edit.addEventListener('click', function () { showPropertyForm(property); });
      actions.appendChild(edit);

      var remove = createElement('button', 'label text-ink link-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent', 'Delete');
      remove.type = 'button';
      remove.addEventListener('click', function () {
        if (window.confirm('Delete “' + String(property.title || 'this property') + '”? This cannot be undone.')) deleteProperty(property);
      });
      actions.appendChild(remove);
      row.appendChild(actions);
      elements.propertyList.appendChild(row);
    });
  }

  async function loadProperties(successMessage) {
    clearMessage(elements.listError);
    setMessage(elements.listStatus, 'Loading listings…');
    try {
      properties = await dataRequest('GET', '?select=*&order=created_at.desc');
      renderPropertyList();
      if (successMessage) setMessage(elements.listStatus, successMessage);
      else clearMessage(elements.listStatus);
    } catch (error) {
      clearMessage(elements.listStatus);
      if (!error.authFailure) setMessage(elements.listError, 'Listings could not be loaded. Please try again.');
    }
  }

  async function saveProperty(event) {
    event.preventDefault();
    if (formBusy || formStateUnknown) return;
    clearMessage(elements.formError);
    clearMessage(elements.formStatus);
    var values;
    try {
      values = collectFormValues();
    } catch (error) {
      setMessage(elements.formError, error.message);
      return;
    }

    setFormBusy(true);
    setMessage(elements.formStatus, 'Uploading and saving…');
    var newPhotos = photoItems.filter(function (item) { return item.isNew; });
    var attemptedKeys = [];
    try {
      for (var index = 0; index < newPhotos.length; index += 1) {
        attemptedKeys.push(newPhotos[index].key);
        await uploadPhoto(newPhotos[index]);
      }
    } catch (error) {
      await cleanupKeys(attemptedKeys);
      resetNewPhotoKeys();
      clearMessage(elements.formStatus);
      setMessage(elements.formError, 'Photo upload failed. Every attempted upload was scheduled for cleanup; no listing changes were sent.');
      setFormBusy(false);
      return;
    }

    var operation = editingProperty ? 'edit' : 'create';
    var propertyId = editingProperty ? editingProperty.id : crypto.randomUUID();
    var mutationValues = Object.assign({}, values);
    if (operation === 'create') mutationValues.id = propertyId;
    var outcome = await mutateWithReconciliation(operation, propertyId, mutationValues);

    if (outcome.outcome === 'unknown') {
      clearMessage(elements.formStatus);
      formStateUnknown = true;
      setFormBusy(false);
      setMessage(elements.formError, 'Save state unknown — reload before retrying. Uploaded photos were kept to avoid deleting data that may now be in use.');
      return;
    }
    if (outcome.outcome === 'failed') {
      await cleanupKeys(attemptedKeys);
      resetNewPhotoKeys();
      clearMessage(elements.formStatus);
      setMessage(elements.formError, formatApiError(outcome.error, 'The property could not be saved.'));
      setFormBusy(false);
      return;
    }

    var removedKeys = [];
    if (editingProperty) {
      removedKeys = uniquePhotoKeys(editingProperty.photos).filter(function (key) {
        return values.photos.indexOf(key) === -1;
      });
    }
    if (removedKeys.length) await cleanupKeys(removedKeys);
    clearMessage(elements.formStatus);
    setFormBusy(false);
    showListView();
    await loadProperties('Property saved.');
  }

  async function updatePublished(property, published) {
    clearMessage(elements.listError);
    clearMessage(elements.listStatus);
    var outcome = await mutateWithReconciliation('edit', property.id, { published: published });
    if (outcome.outcome === 'unknown') {
      setMessage(elements.listError, 'Publish state unknown — reload before retrying.');
      return;
    }
    if (outcome.outcome === 'failed') {
      setMessage(elements.listError, formatApiError(outcome.error, 'The publish setting could not be changed.'));
      await loadProperties();
      return;
    }
    await loadProperties(published ? 'Property published.' : 'Property unpublished.');
  }

  async function deleteProperty(property) {
    clearMessage(elements.listError);
    clearMessage(elements.listStatus);
    setMessage(elements.listStatus, 'Deleting property…');
    var outcome = await mutateWithReconciliation('delete', property.id, null);
    if (outcome.outcome === 'unknown') {
      clearMessage(elements.listStatus);
      setMessage(elements.listError, 'Delete state unknown — reload before retrying. Photos were kept to avoid data loss.');
      return;
    }
    if (outcome.outcome === 'failed') {
      clearMessage(elements.listStatus);
      setMessage(elements.listError, 'The property could not be deleted.');
      return;
    }
    await cleanupKeys(uniquePhotoKeys(property.photos));
    await loadProperties('Property deleted.');
  }

  async function handleLogin(event) {
    event.preventDefault();
    clearMessage(elements.loginError);
    elements.loginSubmit.disabled = true;
    clearSession();
    var formData = new FormData(elements.loginForm);
    try {
      var data = await authRequest('?grant_type=password', {
        email: String(formData.get('email') || ''),
        password: String(formData.get('password') || '')
      });
      var pair = tokenPairFromResponse(data);
      if (!tokenBelongsToNatalie(pair.access_token)) {
        await rejectWrongAccount(pair.access_token);
        return;
      }
      storeSession(pair);
      elements.loginForm.reset();
      enterAdmin();
    } catch (error) {
      clearSession();
      showLogin(error.message === 'This account has no access' ? error.message : 'Email or password is incorrect.');
    }
    elements.loginSubmit.disabled = false;
  }

  async function handleSignOut() {
    elements.signOut.disabled = true;
    var accessToken = session && session.access_token;
    var confirmed = false;
    try {
      confirmed = await postLogout(accessToken);
    } catch (error) {
      confirmed = false;
    } finally {
      clearSession();
      showLogin(confirmed ? '' : 'Signed out locally; server sign-out unconfirmed.');
    }
  }

  function appendAmenityIcons() {
    var iconSlots = document.querySelectorAll('[data-amenity-icon]');
    Array.prototype.forEach.call(iconSlots, function (slot) {
      var key = slot.getAttribute('data-amenity-icon');
      if (!Object.prototype.hasOwnProperty.call(AMENITY_ICONS, key)) return;
      slot.innerHTML = AMENITY_ICONS[key];
      if (slot.parentElement) slot.parentElement.title = AMENITY_LABELS[key];
    });
  }

  function enterAdmin() {
    showAdmin();
    showListView();
    loadProperties();
    retryPendingCleanup();
  }

  function bindElements() {
    elements.loginView = byId('login-view');
    elements.loginForm = byId('login-form');
    elements.loginSubmit = byId('login-submit');
    elements.loginError = byId('login-error');
    elements.adminView = byId('admin-view');
    elements.addProperty = byId('add-property');
    elements.signOut = byId('sign-out');
    elements.cleanupWarning = byId('cleanup-warning');
    elements.listView = byId('list-view');
    elements.listStatus = byId('list-status');
    elements.listError = byId('list-error');
    elements.listEmpty = byId('list-empty');
    elements.propertyList = byId('property-list');
    elements.formView = byId('form-view');
    elements.backToList = byId('back-to-list');
    elements.propertyFormHeading = byId('property-form-heading');
    elements.propertyForm = byId('property-form');
    elements.photoInput = byId('property-photos');
    elements.photoStatus = byId('photo-status');
    elements.photoList = byId('photo-list');
    elements.formStatus = byId('form-status');
    elements.formError = byId('form-error');
  }

  async function init() {
    // Never boot the admin inside a frame — no session, no listeners, nothing to clickjack.
    // (Belt-and-braces with the inline guard in admin.html; GH Pages can't send frame headers.)
    if (window.top !== window.self) return;
    bindElements();
    appendAmenityIcons();
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.signOut.addEventListener('click', handleSignOut);
    elements.addProperty.addEventListener('click', function () { showPropertyForm(null); });
    elements.backToList.addEventListener('click', function () {
      showListView();
      loadProperties();
    });
    elements.propertyForm.addEventListener('submit', saveProperty);
    elements.photoInput.addEventListener('change', handlePhotoSelection);

    var stored = null;
    try {
      stored = readSession();
    } catch (error) {}
    if (!stored) {
      clearSession();
      showLogin('');
      return;
    }
    if (!tokenBelongsToNatalie(stored.access_token)) {
      await rejectWrongAccount(stored.access_token);
      return;
    }
    session = stored;
    enterAdmin();
  }

  if (typeof document === 'undefined') {
    if (!PHOTO_KEY_PATTERN.test('11111111-1111-4111-8111-111111111111.jpg') ||
        PHOTO_KEY_PATTERN.test('11111111-1111-4111-8111-111111111111.png') ||
        !valuesMatch({ price: 0, amenities: ['pool', 'garden'] }, { price: 0, amenities: ['pool', 'garden'] }) ||
        valuesMatch({ amenities: ['garden', 'pool'] }, { amenities: ['pool', 'garden'] }) ||
        !storageDeleteIsConfirmed({ ok: false, status: 400, body: { statusCode: '404' } }) ||
        !storageDeleteIsConfirmed({ ok: false, status: 400, body: { error: 'not_found' } }) ||
        storageDeleteIsConfirmed({ ok: false, status: 403, body: null }) ||
        storageDeleteIsConfirmed({ ok: false, status: 500, body: null })) {
      throw new Error('Admin self-check failed');
    }
    console.log('admin self-check: ok');
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
