import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const NATALIE_UID = '696378f9-f9f9-4a72-8f5d-66ec03a09312';
const BUCKET = 'natalie-properties';
const PHOTO_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/;
const REQUIRED_ENV_KEYS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'NATALIE_ADMIN_EMAIL',
  'NATALIE_ADMIN_PASSWORD'
];

const backendDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(backendDirectory);
const envPath = path.join(projectRoot, '.env.local');

const drafts = [
  {
    photoKey: '11111111-1111-4111-8111-111111111111.jpg',
    photoPath: path.join(projectRoot, 'assets/photos/guide-living.jpg'),
    values: {
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Garden Apartment near the Cascais Coast',
      location_area: 'Cascais — Bairro do Rosário',
      price: 895000,
      status: 'available',
      type: 'apartment',
      bedrooms: 3,
      bathrooms: 2,
      area_built: 142,
      area_plot: null,
      floor: 'Ground floor',
      year_built: 2019,
      energy_rating: 'A',
      description: 'A calm, light-filled home with generous living spaces and an easy connection to a private garden, close to the coast and the centre of Cascais.',
      amenities: ['garden', 'terrace'],
      featured: false,
      published: false
    }
  },
  {
    photoKey: '22222222-2222-4222-8222-222222222222.jpg',
    photoPath: path.join(projectRoot, 'assets/photos/guide-terrace.jpg'),
    values: {
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Riverside Penthouse in Lisbon',
      location_area: 'Lisbon — Estrela',
      price: 1450000,
      status: 'available',
      type: 'penthouse',
      bedrooms: 3,
      bathrooms: 3,
      area_built: 188,
      area_plot: null,
      floor: 'Top floor',
      year_built: 2021,
      energy_rating: 'A',
      description: 'An elegant top-floor Lisbon residence with warm contemporary interiors and a broad terrace for unhurried evenings above the river.',
      amenities: ['elevator', 'terrace'],
      featured: false,
      published: false
    }
  }
];

function parseEnv(source) {
  const values = {};
  source.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separator = line.indexOf('=');
    const key = separator === -1 ? '' : line.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      throw new Error(`Invalid .env.local entry on line ${index + 1}; expected KEY=VALUE.`);
    }

    let value = line.slice(separator + 1).trim();
    if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  });
  return values;
}

async function readConfig() {
  let source;
  try {
    source = await fs.readFile(envPath, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      throw new Error('Missing .env.local in the project root.');
    }
    throw new Error('Could not read .env.local from the project root.');
  }

  const env = parseEnv(source);
  for (const key of REQUIRED_ENV_KEYS) {
    if (typeof env[key] !== 'string' || env[key].length === 0) {
      throw new Error(`Missing required key ${key} in .env.local.`);
    }
  }

  let supabaseUrl;
  try {
    supabaseUrl = new URL(env.SUPABASE_URL);
  } catch (error) {
    throw new Error('SUPABASE_URL in .env.local is not a valid URL.');
  }
  if (supabaseUrl.protocol !== 'http:' && supabaseUrl.protocol !== 'https:') {
    throw new Error('SUPABASE_URL in .env.local must use HTTP or HTTPS.');
  }

  return {
    supabaseUrl: supabaseUrl.href.replace(/\/$/, ''),
    anonKey: env.SUPABASE_ANON_KEY,
    email: env.NATALIE_ADMIN_EMAIL,
    password: env.NATALIE_ADMIN_PASSWORD
  };
}

function authHeaders(config, accessToken, extra = {}) {
  return {
    ...extra,
    apikey: config.anonKey,
    Authorization: `Bearer ${accessToken}`
  };
}

async function fetchConfirmed(url, options, failureMessage) {
  try {
    return await fetch(url, options);
  } catch (error) {
    throw new Error(failureMessage);
  }
}

async function responseJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

function jwtSubject(token) {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch (error) {
    return null;
  }
}

async function login(config) {
  const response = await fetchConfirmed(
    `${config.supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: config.email, password: config.password })
    },
    'The authentication service could not be reached.'
  );
  const data = await responseJson(response);
  if (!response.ok) throw new Error(`Authentication failed with HTTP ${response.status}.`);
  if (!data || typeof data.access_token !== 'string') {
    throw new Error('The authentication response did not include an access token.');
  }
  if (jwtSubject(data.access_token) !== NATALIE_UID) {
    throw new Error('The authenticated account is not Natalie; no drafts were changed.');
  }
  return data.access_token;
}

async function dataRequest(config, accessToken, method, query, body) {
  const isRead = method === 'GET' || method === 'HEAD';
  const headers = isRead
    ? authHeaders(config, accessToken, { 'Accept-Profile': 'natalie' })
    : authHeaders(config, accessToken, {
        'Content-Profile': 'natalie',
        'Content-Type': 'application/json',
        Prefer: method === 'POST' ? 'resolution=merge-duplicates,return=minimal' : 'return=minimal'
      });
  const response = await fetchConfirmed(
    `${config.supabaseUrl}/rest/v1/properties${query}`,
    {
      method,
      headers,
      body: isRead ? undefined : JSON.stringify(body)
    },
    `The ${method} listings request could not be confirmed.`
  );

  if (!response.ok) {
    await response.text();
    throw new Error(`The ${method} listings request failed with HTTP ${response.status}.`);
  }
  if (!isRead) {
    await response.text();
    return null;
  }

  const rows = await responseJson(response);
  if (!Array.isArray(rows)) throw new Error('The listings response was not an array.');
  return rows;
}

async function getDraft(config, accessToken, id) {
  const rows = await dataRequest(
    config,
    accessToken,
    'GET',
    `?select=*&id=eq.${encodeURIComponent(id)}&limit=1`
  );
  return rows[0] || null;
}

async function upsertDraft(config, accessToken, draft, currentPhotos) {
  await dataRequest(
    config,
    accessToken,
    'POST',
    '?on_conflict=id',
    { ...draft.values, photos: currentPhotos }
  );
}

async function patchPhotos(config, accessToken, id, photos) {
  await dataRequest(
    config,
    accessToken,
    'PATCH',
    `?id=eq.${encodeURIComponent(id)}`,
    { photos }
  );
}

function storageObjectIsMissing(result) {
  const body = result && result.body;
  return Boolean(result && (result.status === 404 ||
    (body && (String(body.statusCode) === '404' || body.error === 'not_found'))));
}

function storageDeleteIsConfirmed(result) {
  return Boolean(result && (result.ok === true || storageObjectIsMissing(result)));
}

async function storageObjectExists(config, accessToken, key) {
  const response = await fetchConfirmed(
    `${config.supabaseUrl}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(key)}`,
    { method: 'GET', headers: authHeaders(config, accessToken) },
    'The photo existence check could not be confirmed.'
  );
  if (response.ok) {
    await response.arrayBuffer();
    return true;
  }

  const body = await responseJson(response);
  if (storageObjectIsMissing({ status: response.status, body })) return false;
  throw new Error(`The photo existence check failed with HTTP ${response.status}.`);
}

async function uploadPhoto(config, accessToken, draft) {
  let photo;
  try {
    photo = await fs.readFile(draft.photoPath);
  } catch (error) {
    throw new Error(`Could not read the local photo for “${draft.values.title}”.`);
  }

  const response = await fetchConfirmed(
    `${config.supabaseUrl}/storage/v1/object/${BUCKET}/${encodeURIComponent(draft.photoKey)}`,
    {
      method: 'POST',
      headers: authHeaders(config, accessToken, {
        'Content-Type': 'image/jpeg',
        'x-upsert': 'false'
      }),
      body: photo
    },
    `Photo upload outcome is unknown for “${draft.values.title}”.`
  );
  await response.text();
  if (!response.ok) {
    throw new Error(`Photo upload failed with HTTP ${response.status} for “${draft.values.title}”.`);
  }
}

async function deleteStoredPhoto(config, accessToken, key) {
  const response = await fetchConfirmed(
    `${config.supabaseUrl}/storage/v1/object/${BUCKET}/${encodeURIComponent(key)}`,
    { method: 'DELETE', headers: authHeaders(config, accessToken) },
    'Photo cleanup could not be confirmed.'
  );
  const body = response.ok ? (await response.text(), null) : await responseJson(response);
  if (!storageDeleteIsConfirmed({ ok: response.ok, status: response.status, body })) {
    throw new Error(`Photo cleanup failed with HTTP ${response.status}.`);
  }
}

async function cleanupUploadAttempts(config, accessToken, keys) {
  let failures = 0;
  for (const key of new Set(keys)) {
    try {
      await deleteStoredPhoto(config, accessToken, key);
    } catch (error) {
      failures += 1;
    }
  }
  if (failures > 0) {
    console.error(`Upload cleanup could not be confirmed for ${failures} object(s).`);
  }
}

function valuesMatch(row, expected) {
  return Object.keys(expected).every((key) => {
    if (Array.isArray(expected[key])) {
      return Array.isArray(row[key]) && row[key].length === expected[key].length &&
        row[key].every((value, index) => value === expected[key][index]);
    }
    return row[key] === expected[key];
  });
}

function runSelfCheck() {
  const bodyNotFound = { statusCode: '404', error: 'not_found' };
  if (!drafts.every((draft) => PHOTO_KEY_PATTERN.test(draft.photoKey)) ||
      !storageObjectIsMissing({ status: 400, body: bodyNotFound }) ||
      !storageDeleteIsConfirmed({ ok: false, status: 400, body: bodyNotFound }) ||
      storageObjectIsMissing({ status: 403, body: null }) ||
      !valuesMatch({ photos: ['a.jpg'] }, { photos: ['a.jpg'] }) ||
      valuesMatch({ photos: ['b.jpg'] }, { photos: ['a.jpg'] })) {
    throw new Error('Seed drafts self-check failed.');
  }
  console.log('seed-drafts self-check: ok');
}

async function seed() {
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (!Number.isInteger(nodeMajor) || nodeMajor < 18 || typeof fetch !== 'function') {
    throw new Error('This seed requires Node.js 18 or newer.');
  }

  const config = await readConfig();
  const accessToken = await login(config);
  const uploadAttempts = [];

  for (const draft of drafts) {
    const existing = await getDraft(config, accessToken, draft.values.id);
    const baseChanged = !existing || !valuesMatch(existing, draft.values);
    const currentPhotos = existing && Array.isArray(existing.photos) ? existing.photos : [];

    await upsertDraft(config, accessToken, draft, currentPhotos);

    let uploaded = false;
    if (!await storageObjectExists(config, accessToken, draft.photoKey)) {
      uploadAttempts.push(draft.photoKey);
      try {
        await uploadPhoto(config, accessToken, draft);
        uploaded = true;
      } catch (error) {
        await cleanupUploadAttempts(config, accessToken, uploadAttempts);
        throw error;
      }
    }

    const expectedPhotos = [draft.photoKey];
    const rowAfterUpsert = await getDraft(config, accessToken, draft.values.id);
    if (!rowAfterUpsert) throw new Error(`Draft row disappeared for “${draft.values.title}”.`);
    const photosChanged = !valuesMatch(rowAfterUpsert, { photos: expectedPhotos });
    if (photosChanged) {
      await patchPhotos(config, accessToken, draft.values.id, expectedPhotos);
    }

    const outcome = !existing ? 'created' : (baseChanged || uploaded || photosChanged ? 'reconciled' : 'no-op');
    console.log(`${draft.values.title}: ${outcome}`);
  }

  console.log('Seed complete: 2 unpublished, unfeatured draft examples are present.');
}

if (process.argv.includes('--self-check')) {
  runSelfCheck();
} else {
  seed().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Draft seed failed.');
    process.exitCode = 1;
  });
}
