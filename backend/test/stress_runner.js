/**
 * Challenger 1: Empirical Adversarial Stress Test Suite for Saanjh 3.0 Backend
 * Covers payload boundaries, malformed inputs, auth edge cases, KV metadata, ETags, caching, 304, 404, and schema limits.
 */

const assert = require('assert');

class MockKVNamespace {
  constructor() {
    this.store = new Map();
    this.metadataStore = new Map();
  }

  async get(key, options) {
    const entry = this.store.get(key);
    if (entry === undefined || entry === null) return null;
    if (options && options.type === 'arrayBuffer') {
      if (entry instanceof ArrayBuffer) return entry;
      if (ArrayBuffer.isView(entry)) {
        return entry.buffer.slice(entry.byteOffset, entry.byteOffset + entry.byteLength);
      }
      return Buffer.from(entry).buffer;
    }
    if (options && options.type === 'json') {
      const str = typeof entry === 'string' ? entry : Buffer.from(entry).toString('utf8');
      return JSON.parse(str);
    }
    return typeof entry === 'string' ? entry : Buffer.from(entry).toString('utf8');
  }

  async getWithMetadata(key, options) {
    const value = await this.get(key, options);
    if (value === null) {
      return { value: null, metadata: null };
    }
    const metadata = this.metadataStore.get(key) || null;
    return { value, metadata };
  }

  async put(key, value, options) {
    this.store.set(key, value);
    if (options && options.metadata) {
      this.metadataStore.set(key, options.metadata);
    }
  }

  async delete(key) {
    this.store.delete(key);
    this.metadataStore.delete(key);
  }

  async list(options) {
    const keys = Array.from(this.store.keys());
    const prefix = options?.prefix;
    const filtered = prefix ? keys.filter((k) => k.startsWith(prefix)) : keys;
    return {
      keys: filtered.map((name) => ({
        name,
        metadata: this.metadataStore.get(name) || undefined,
      })),
      list_complete: true,
      cursor: '',
    };
  }
}

async function runAdversarialStressSuite() {
  console.log('================================================================');
  console.log('       Challenger 1 — Empirical Stress Test Suite                ');
  console.log('================================================================\n');

  require('ts-node').register({
    transpileOnly: true,
    compilerOptions: { module: 'commonjs' },
  });

  const appModule = require('../src/index.ts');
  const app = appModule.default || appModule;

  const mockDb = new MockKVNamespace();
  const SECRET = 'challenger-test-secret-2026';
  const env = {
    SAANJH_DB: mockDb,
    ADMIN_SECRET: SECRET,
  };

  let passed = 0;
  let failed = 0;
  const results = [];

  async function testCase(category, name, fn) {
    try {
      await fn();
      console.log(`  [PASS] [${category}] ${name}`);
      passed++;
      results.push({ category, name, pass: true });
    } catch (err) {
      console.error(`  [FAIL] [${category}] ${name}`);
      console.error(`         Error: ${err.message}`);
      if (err.stack) {
        const stackSnippet = err.stack.split('\n').slice(1, 3).join('\n         ');
        console.error(`         ${stackSnippet}`);
      }
      failed++;
      results.push({ category, name, pass: false, error: err.message });
    }
  }

  // =========================================================================
  // CATEGORY 1: PAYLOAD BOUNDARY EXTREMES (0 bytes, 5MB, 5.1MB overflow)
  // =========================================================================
  console.log('\n--- Category 1: Payload Boundary Extremes ---');

  await testCase('PAYLOAD', 'Reject 0-byte binary image upload with 400 Bad Request', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'image/jpeg',
          Authorization: `Bearer ${SECRET}`,
        },
        body: new Uint8Array(0),
      },
      env
    );
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.error, 'Empty file payload');
  });

  await testCase('PAYLOAD', 'Reject 0-byte multipart file upload with 400 Bad Request', async () => {
    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(0)], { type: 'image/png' }), 'empty.png');
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${SECRET}` },
        body: formData,
      },
      env
    );
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.error, 'Empty file payload');
  });

  await testCase('PAYLOAD', 'Accept 1-byte minimal image upload with 200 OK', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'image/png',
          Authorization: `Bearer ${SECRET}`,
          'X-Filename': '1byte.png',
        },
        body: new Uint8Array([0x89]),
      },
      env
    );
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.size, 1);
  });

  await testCase('PAYLOAD', 'Accept exactly 5,000,000 bytes payload with 200 OK', async () => {
    const buffer = new Uint8Array(5000000);
    buffer.fill(0x41);
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'image/jpeg',
          Authorization: `Bearer ${SECRET}`,
          'X-Filename': '5million.jpg',
        },
        body: buffer,
      },
      env
    );
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.size, 5000000);
  });

  await testCase('PAYLOAD', 'Accept exactly 5,242,880 bytes (5MB upper boundary) with 200 OK', async () => {
    const buffer = new Uint8Array(5 * 1024 * 1024);
    buffer.fill(0x55);
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'image/jpeg',
          Authorization: `Bearer ${SECRET}`,
          'X-Filename': 'exact5mb.jpg',
        },
        body: buffer,
      },
      env
    );
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.size, 5242880);
  });

  await testCase('PAYLOAD', 'Reject 5,242,881 bytes (5MB + 1 byte) with 413 Payload Too Large', async () => {
    const overflowBuffer = new Uint8Array(5 * 1024 * 1024 + 1);
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'image/jpeg',
          Authorization: `Bearer ${SECRET}`,
          'X-Filename': 'overflow.jpg',
        },
        body: overflowBuffer,
      },
      env
    );
    assert.strictEqual(res.status, 413);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.ok(json.error.includes('5MB'));
  });

  await testCase('PAYLOAD', 'Reject 5.1MB (5,347,737 bytes) with 413 Payload Too Large', async () => {
    const overflowBuffer = new Uint8Array(5347737);
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'image/png',
          Authorization: `Bearer ${SECRET}`,
        },
        body: overflowBuffer,
      },
      env
    );
    assert.strictEqual(res.status, 413);
  });

  // =========================================================================
  // CATEGORY 2: MALFORMED / INVALID MULTIPART AND BINARY BODIES
  // =========================================================================
  console.log('\n--- Category 2: Malformed Bodies & MIME Types ---');

  await testCase('MALFORMED', 'Multipart form missing "file" field returns 400 Bad Request', async () => {
    const formData = new FormData();
    formData.append('description', 'Missing file property');
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${SECRET}` },
        body: formData,
      },
      env
    );
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.ok(json.error.includes('No file provided in form field "file"'));
  });

  await testCase('MALFORMED', 'Multipart form where "file" is a plain string instead of Blob returns 400', async () => {
    const formData = new FormData();
    formData.append('file', 'plain-text-filename.png');
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${SECRET}` },
        body: formData,
      },
      env
    );
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.strictEqual(json.success, false);
  });

  await testCase('MALFORMED', 'Reject unsupported application/pdf Content-Type with 415', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/pdf',
          Authorization: `Bearer ${SECRET}`,
        },
        body: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      },
      env
    );
    assert.strictEqual(res.status, 415);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.ok(json.error.includes('Unsupported Content-Type'));
  });

  await testCase('MALFORMED', 'Reject unsupported audio/mpeg Content-Type with 415', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'audio/mpeg',
          Authorization: `Bearer ${SECRET}`,
        },
        body: new Uint8Array([0x49, 0x44, 0x33]),
      },
      env
    );
    assert.strictEqual(res.status, 415);
  });

  await testCase('MALFORMED', 'Reject application/json to /upload endpoint with 415', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SECRET}`,
        },
        body: JSON.stringify({ file: 'base64' }),
      },
      env
    );
    assert.strictEqual(res.status, 415);
  });

  await testCase('MALFORMED', 'application/octet-stream with x-filename header correctly deduces image/webp', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Filename': 'forest-scene.webp',
          Authorization: `Bearer ${SECRET}`,
        },
        body: new Uint8Array([0x52, 0x49, 0x46, 0x46]),
      },
      env
    );
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.contentType, 'image/webp');
    assert.strictEqual(json.filename, 'forest-scene.webp');
  });

  await testCase('MALFORMED', 'Sanitize path traversal characters in upload filename', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'image/png',
          'X-Filename': '../../evil<script>.png',
          Authorization: `Bearer ${SECRET}`,
        },
        body: new Uint8Array([1, 2, 3]),
      },
      env
    );
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.filename, '______evil_script_.png');
  });

  // =========================================================================
  // CATEGORY 3: BEARER TOKEN AUTHENTICATION EDGE CASES
  // =========================================================================
  console.log('\n--- Category 3: Bearer Token Edge Cases ---');

  await testCase('AUTH', 'Missing Authorization header returns 401', async () => {
    const res = await app.request('/upload', { method: 'POST' }, env);
    assert.strictEqual(res.status, 401);
  });

  await testCase('AUTH', 'Empty Authorization header "" returns 401', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: { Authorization: '' },
      },
      env
    );
    assert.strictEqual(res.status, 401);
  });

  await testCase('AUTH', 'Empty Bearer token "Bearer " returns 401', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer ' },
      },
      env
    );
    assert.strictEqual(res.status, 401);
  });

  await testCase('AUTH', 'Whitespace-only Bearer token "Bearer    " returns 401', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer    ' },
      },
      env
    );
    assert.strictEqual(res.status, 401);
  });

  await testCase('AUTH', 'Lowercase "bearer <secret>" is accepted (200/400 instead of 401)', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          Authorization: `bearer ${SECRET}`,
          'Content-Type': 'image/png',
        },
        body: new Uint8Array([1, 2]),
      },
      env
    );
    assert.strictEqual(res.status, 200);
  });

  await testCase('AUTH', 'Uppercase "BEARER <secret>" is accepted (200)', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          Authorization: `BEARER ${SECRET}`,
          'Content-Type': 'image/png',
        },
        body: new Uint8Array([1, 2]),
      },
      env
    );
    assert.strictEqual(res.status, 200);
  });

  await testCase('AUTH', 'Bearer token with surrounding whitespace is accepted (200)', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer    ${SECRET}   `,
          'Content-Type': 'image/png',
        },
        body: new Uint8Array([1, 2]),
      },
      env
    );
    assert.strictEqual(res.status, 200);
  });

  await testCase('AUTH', 'Raw token without Bearer prefix is accepted (200)', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          Authorization: SECRET,
          'Content-Type': 'image/png',
        },
        body: new Uint8Array([1, 2]),
      },
      env
    );
    assert.strictEqual(res.status, 200);
  });

  await testCase('AUTH', 'Token with prefixed matching secret "Bearer <secret>_tampered" returns 401', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SECRET}_tampered`,
          'Content-Type': 'image/png',
        },
        body: new Uint8Array([1, 2]),
      },
      env
    );
    assert.strictEqual(res.status, 401);
  });

  await testCase('AUTH', 'Basic Auth header "Basic dXNlcjpwYXNz" returns 401', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic dXNlcjpwYXNz',
          'Content-Type': 'image/png',
        },
        body: new Uint8Array([1, 2]),
      },
      env
    );
    assert.strictEqual(res.status, 401);
  });

  await testCase('AUTH', 'Permissive fallback when ADMIN_SECRET is not set in env (local dev)', async () => {
    const devEnv = { SAANJH_DB: mockDb }; // No ADMIN_SECRET
    const res = await app.request(
      '/catalog',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: 1, stories: [] }),
      },
      devEnv
    );
    assert.strictEqual(res.status, 200);
  });

  // =========================================================================
  // CATEGORY 4: KV PERSISTENCE, ETAG, 304 CONDITIONAL REQUESTS & 404 ASSETS
  // =========================================================================
  console.log('\n--- Category 4: KV Persistence, ETag, 304 & 404 Handling ---');

  let uploadedImageId = '';
  const testBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  await testCase('KV_ETAG', 'Direct binary image upload stores binary bytes and metadata in KV', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'image/png',
          'X-Filename': 'persisted-cover.png',
          Authorization: `Bearer ${SECRET}`,
        },
        body: testBytes,
      },
      env
    );
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.id);
    uploadedImageId = json.id;

    // Verify KV directly
    const kvEntry = await mockDb.getWithMetadata(`image:${uploadedImageId}`, { type: 'arrayBuffer' });
    assert.ok(kvEntry.value);
    assert.strictEqual(kvEntry.metadata.contentType, 'image/png');
    assert.strictEqual(kvEntry.metadata.size, 8);
    assert.strictEqual(kvEntry.metadata.filename, 'persisted-cover.png');
    assert.ok(kvEntry.metadata.uploadedAt);
  });

  await testCase('KV_ETAG', 'GET /images/:id delivers raw binary bytes with immutable cache headers and ETag', async () => {
    const res = await app.request(`/images/${uploadedImageId}`, {}, env);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('Content-Type'), 'image/png');
    assert.strictEqual(res.headers.get('Cache-Control'), 'public, max-age=31536000, immutable');
    assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');
    assert.strictEqual(res.headers.get('ETag'), `W/"${uploadedImageId}"`);

    const ab = await res.arrayBuffer();
    assert.strictEqual(ab.byteLength, 8);
    assert.deepStrictEqual(new Uint8Array(ab), testBytes);
  });

  await testCase('KV_ETAG', 'GET /images/:id with matching If-None-Match (W/"<id>") returns 304 Not Modified', async () => {
    const res = await app.request(
      `/images/${uploadedImageId}`,
      {
        headers: { 'If-None-Match': `W/"${uploadedImageId}"` },
      },
      env
    );
    assert.strictEqual(res.status, 304);
    assert.strictEqual(res.headers.get('ETag'), `W/"${uploadedImageId}"`);
    assert.strictEqual(res.headers.get('Cache-Control'), 'public, max-age=31536000, immutable');
    assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');
  });

  await testCase('KV_ETAG', 'GET /images/:id with matching If-None-Match ("<id>") returns 304 Not Modified', async () => {
    const res = await app.request(
      `/images/${uploadedImageId}`,
      {
        headers: { 'If-None-Match': `"${uploadedImageId}"` },
      },
      env
    );
    assert.strictEqual(res.status, 304);
  });

  await testCase('KV_ETAG', 'GET /images/:id with matching If-None-Match (<id>) returns 304 Not Modified', async () => {
    const res = await app.request(
      `/images/${uploadedImageId}`,
      {
        headers: { 'If-None-Match': uploadedImageId },
      },
      env
    );
    assert.strictEqual(res.status, 304);
  });

  await testCase('KV_ETAG', 'GET /images/:id with mismatched If-None-Match returns 200 with full body', async () => {
    const res = await app.request(
      `/images/${uploadedImageId}`,
      {
        headers: { 'If-None-Match': 'W/"completely-different-etag"' },
      },
      env
    );
    assert.strictEqual(res.status, 200);
    const ab = await res.arrayBuffer();
    assert.strictEqual(ab.byteLength, 8);
  });

  await testCase('KV_ETAG', 'GET /images/:id for non-existent image ID returns 404', async () => {
    const res = await app.request('/images/non-existent-img-99999', {}, env);
    assert.strictEqual(res.status, 404);
    const text = await res.text();
    assert.strictEqual(text, 'Image not found');
  });

  await testCase('KV_ETAG', 'DELETE /images/:id unauthorized without token returns 401', async () => {
    const res = await app.request(`/images/${uploadedImageId}`, { method: 'DELETE' }, env);
    assert.strictEqual(res.status, 401);
  });

  await testCase('KV_ETAG', 'DELETE /images/:id with Bearer token removes image from KV', async () => {
    const res = await app.request(
      `/images/${uploadedImageId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SECRET}` },
      },
      env
    );
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);

    // Verify subsequent GET returns 404
    const getRes = await app.request(`/images/${uploadedImageId}`, {}, env);
    assert.strictEqual(getRes.status, 404);
  });

  // =========================================================================
  // CATEGORY 5: CATALOG SCHEMA VALIDATION & MASSIVE BEATS STRESS
  // =========================================================================
  console.log('\n--- Category 5: Catalog Schema & Beat Stress ---');

  await testCase('CATALOG', 'POST /catalog rejects invalid ageBand "7-9" with 400', async () => {
    const res = await app.request(
      '/catalog',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SECRET}` },
        body: JSON.stringify({
          version: 1,
          stories: [{ id: 's1', title: { en: 'Invalid' }, ageBand: '7-9' }],
        }),
      },
      env
    );
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.ok(json.error.includes('invalid or missing ageBand'));
  });

  await testCase('CATALOG', 'POST /catalog accepts all 8 valid age bands including "parents"', async () => {
    const ageBands = ['2-4', '4-6', '6-8', '9-12', '13-17', '18-25', '25+', 'parents'];
    const stories = ageBands.map((band) => ({
      id: `story-${band.replace('+', 'plus')}`,
      category: 'universal',
      form: 'story',
      ageBand: band,
      title: { en: `Title ${band}`, ne: `शीर्षक ${band}` },
    }));

    const res = await app.request(
      '/catalog',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SECRET}` },
        body: JSON.stringify({ version: 10, stories }),
      },
      env
    );
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.count, 8);
  });

  await testCase('CATALOG', 'POST /catalog persists Devanagari script, danda (।/॥) & emoji without corruption', async () => {
    const nepaliStory = {
      id: 'nepali-night-fable',
      category: 'roots',
      form: 'story',
      ageBand: '6-8',
      title: { en: 'Night Stars 🌙✨', ne: 'रातका ताराहरू 🌙✨' },
      beats: [
        {
          id: 'b1',
          text: {
            en: 'The soft wind blew over the hills.',
            ne: 'डाँडामाथि मन्द बतास चल्यो। खरायोले भन्यो, “शुभ रात्रि!”॥',
          },
          scene: 'hills',
          voice: 'soft',
          music: 'wind',
          rabbit: 'idle',
        },
      ],
    };

    const res = await app.request(
      '/catalog',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SECRET}` },
        body: JSON.stringify({ version: 11, stories: [nepaliStory] }),
      },
      env
    );
    assert.strictEqual(res.status, 200);

    // Retrieve via GET /catalog/:id
    const getRes = await app.request('/catalog/nepali-night-fable', {}, env);
    assert.strictEqual(getRes.status, 200);
    const json = await getRes.json();
    assert.strictEqual(json.story.title.ne, 'रातका ताराहरू 🌙✨');
    assert.strictEqual(
      json.story.beats[0].text.ne,
      'डाँडामाथि मन्द बतास चल्यो। खरायोले भन्यो, “शुभ रात्रि!”॥'
    );
  });

  await testCase('CATALOG', 'POST /catalog stress with 50 stories each having 20 rich beats (1,000 beats total)', async () => {
    const scenes = ['establishing', 'meeting', 'walk', 'roar', 'well', 'leap', 'peace', 'moon', 'river', 'courtyard', 'hills', 'lamp', 'stars'];
    const voices = ['narrator', 'tiger', 'rabbit', 'soft'];
    const sounds = ['night', 'moon', 'river', 'courtyard', 'roar', 'splash', 'ripple', 'chime', 'wind'];
    const poses = ['hidden', 'idle', 'walk', 'bow', 'sit', 'roar', 'leap', 'lookDown'];

    const massiveStories = Array.from({ length: 50 }, (_, sIdx) => ({
      id: `massive-story-${sIdx + 1}`,
      category: 'universal',
      form: 'novel',
      ageBand: 'parents',
      title: { en: `Novel ${sIdx + 1}`, ne: `उपन्यास ${sIdx + 1}` },
      stage: 'courtyard',
      beats: Array.from({ length: 20 }, (_, bIdx) => ({
        id: `beat-${sIdx + 1}-${bIdx + 1}`,
        text: { en: `Chapter sentence ${bIdx + 1}.`, ne: `अध्याय वाक्य ${bIdx + 1}।` },
        scene: scenes[bIdx % scenes.length],
        voice: voices[bIdx % voices.length],
        music: sounds[bIdx % sounds.length],
        rabbit: poses[bIdx % poses.length],
      })),
    }));

    const res = await app.request(
      '/catalog',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SECRET}` },
        body: JSON.stringify({ version: 99, stories: massiveStories }),
      },
      env
    );
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.count, 50);

    // Verify GET /catalog reflects 50 stories
    const getRes = await app.request('/catalog', {}, env);
    assert.strictEqual(getRes.status, 200);
    const getJson = await getRes.json();
    assert.strictEqual(getJson.stories.length, 50);
    assert.strictEqual(getJson.stories[49].beats.length, 20);
  });

  console.log('\n================================================================');
  console.log(`Results: ${passed} passed, ${failed} failed across ${passed + failed} test assertions.`);
  console.log('================================================================\n');

  return { passed, failed, total: passed + failed, results };
}

if (require.main === module) {
  runAdversarialStressSuite()
    .then((res) => {
      process.exit(res.failed === 0 ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal runner error:', err);
      process.exit(1);
    });
}

module.exports = { runAdversarialStressSuite };
