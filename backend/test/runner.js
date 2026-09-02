/**
 * Saanjh 3.0 Backend Test Suite
 * Automated in-memory test harness using MockKVNamespace and Hono app.request()
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

async function runTests() {
  console.log('====================================================');
  console.log('       Saanjh 3.0 Backend Test Suite Runner          ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${err.message}`);
      if (err.stack) {
        const stackLines = err.stack.split('\n').slice(1, 4).join('\n    ');
        console.error(`    ${stackLines}`);
      }
      failed++;
    }
  }

  // Register ts-node for transpiling index.ts
  require('ts-node').register({
    transpileOnly: true,
    compilerOptions: { module: 'commonjs' },
  });
  const appModule = require('../src/index.ts');
  const app = appModule.default || appModule;

  const mockDb = new MockKVNamespace();
  const env = {
    SAANJH_DB: mockDb,
    ADMIN_SECRET: 'test-secret-key-123',
  };

  // 1. Health & Root Endpoint
  await test('GET / returns health status and service info', async () => {
    const res = await app.request('/', {}, env);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.status, 'healthy');
    assert.strictEqual(json.version, '3.0.0');
    assert.strictEqual(json.service, 'Saanjh Backend API');
  });

  // 2. Empty Catalog Fallback
  await test('GET /catalog returns fallback empty catalog when DB empty', async () => {
    const res = await app.request('/catalog', {}, env);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.version, 1);
    assert.deepStrictEqual(json.stories, []);
  });

  // 3. Catalog Publication Unauthorized (no token)
  await test('POST /catalog without auth returns 401 Unauthorized', async () => {
    const res = await app.request(
      '/catalog',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: 1, stories: [] }),
      },
      env
    );
    assert.strictEqual(res.status, 401);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.ok(json.error.includes('Unauthorized'));
  });

  // 4. Catalog Publication Invalid Bearer Token
  await test('POST /catalog with invalid Bearer token returns 401 Unauthorized', async () => {
    const res = await app.request(
      '/catalog',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer wrong-secret-token',
        },
        body: JSON.stringify({ version: 1, stories: [] }),
      },
      env
    );
    assert.strictEqual(res.status, 401);
    const json = await res.json();
    assert.strictEqual(json.success, false);
  });

  // 5. Catalog Publication Malformed Payload (not array)
  await test('POST /catalog with malformed payload (missing stories array) returns 400', async () => {
    const res = await app.request(
      '/catalog',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-secret-key-123',
        },
        body: JSON.stringify({ version: 1 }),
      },
      env
    );
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.strictEqual(json.success, false);
  });

  // 6. Catalog Publication Invalid Story (missing id)
  await test('POST /catalog with story missing id returns 400', async () => {
    const res = await app.request(
      '/catalog',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-secret-key-123',
        },
        body: JSON.stringify({
          version: 1,
          stories: [{ title: { en: 'Test', ne: 'परीक्षण' }, ageBand: '4-6' }],
        }),
      },
      env
    );
    assert.strictEqual(res.status, 400);
  });

  // 7. Catalog Publication Invalid Story (missing bilingual title)
  await test('POST /catalog with story missing title returns 400', async () => {
    const res = await app.request(
      '/catalog',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-secret-key-123',
        },
        body: JSON.stringify({
          version: 1,
          stories: [{ id: 'test-story', ageBand: '4-6' }],
        }),
      },
      env
    );
    assert.strictEqual(res.status, 400);
  });

  // 8. Catalog Publication Invalid AgeBand
  await test('POST /catalog with invalid ageBand (e.g. 7-9) returns 400', async () => {
    const res = await app.request(
      '/catalog',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-secret-key-123',
        },
        body: JSON.stringify({
          version: 1,
          stories: [{ id: 'test-story', title: { en: 'Test', ne: 'परीक्षण' }, ageBand: '7-9' }],
        }),
      },
      env
    );
    assert.strictEqual(res.status, 400);
  });

  // 9. Catalog Publication with Invalid Beat Scene
  await test('POST /catalog with invalid beat scene returns 400', async () => {
    const res = await app.request(
      '/catalog',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-secret-key-123',
        },
        body: JSON.stringify({
          version: 1,
          stories: [
            {
              id: 'test-story',
              title: { en: 'Test', ne: 'परीक्षण' },
              ageBand: '4-6',
              beats: [{ id: 'b1', text: { en: 'Hello' }, scene: 'invalid-scene-id' }],
            },
          ],
        }),
      },
      env
    );
    assert.strictEqual(res.status, 400);
  });

  // 10. Catalog Publication Valid Story with Full Beat[] & Audio Metadata
  await test('POST /catalog with valid story and Beat[] array saves successfully (200)', async () => {
    const validStory = {
      id: 'clever-rabbit',
      category: 'roots',
      form: 'story',
      ageBand: '6-8',
      title: { en: 'The Clever Rabbit', ne: 'चतुर खरायो' },
      subtitle: { en: 'A forest fable', ne: 'जङ्गलको कथा' },
      stage: 'forest',
      cast: 'rabbit',
      beats: [
        {
          id: 'b1',
          text: {
            en: 'Once upon a time in a deep green forest...',
            ne: 'एक देशमा एउटा बाक्लो हरियो जङ्गल थियो...',
          },
          scene: 'establishing',
          voice: 'soft',
          music: 'night',
          rabbit: 'idle',
        },
      ],
    };

    const res = await app.request(
      '/catalog',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-secret-key-123',
        },
        body: JSON.stringify({ version: 2, stories: [validStory] }),
      },
      env
    );

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.count, 1);
    assert.strictEqual(json.version, 2);
  });

  // 11. Verify all 8 AgeBands are supported
  await test('POST /catalog accepts all 8 valid age bands', async () => {
    const ageBands = ['2-4', '4-6', '6-8', '9-12', '13-17', '18-25', '25+', 'parents'];
    const stories = ageBands.map((band, i) => ({
      id: `story-${band.replace('+', 'plus')}`,
      category: 'roots',
      form: 'story',
      ageBand: band,
      title: { en: `Story for ${band}`, ne: `कथा ${band}` },
    }));

    const res = await app.request(
      '/catalog',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-secret-key-123',
        },
        body: JSON.stringify({ version: 3, stories }),
      },
      env
    );

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.count, 8);
  });

  // 12. GET /catalog returns updated data
  await test('GET /catalog returns updated story list and versions', async () => {
    const res = await app.request('/catalog', {}, env);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.version, 3);
    assert.strictEqual(json.stories.length, 8);
    assert.strictEqual(json.stories[7].ageBand, 'parents');
  });

  // 13. GET /catalog/:id returns single story
  await test('GET /catalog/:id returns single story by ID', async () => {
    const res = await app.request('/catalog/story-parents', {}, env);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.story.id, 'story-parents');
    assert.strictEqual(json.story.ageBand, 'parents');
  });

  // 14. GET /catalog/:id with unknown ID returns 404
  await test('GET /catalog/:id with unknown ID returns 404 Not Found', async () => {
    const res = await app.request('/catalog/non-existent-story-id', {}, env);
    assert.strictEqual(res.status, 404);
    const json = await res.json();
    assert.strictEqual(json.success, false);
  });

  // 15. POST /upload without auth returns 401
  await test('POST /upload without auth returns 401 Unauthorized', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: { 'Content-Type': 'image/png' },
        body: new Uint8Array([1, 2, 3]),
      },
      env
    );
    assert.strictEqual(res.status, 401);
  });

  // 16. POST /upload with invalid Bearer token returns 401
  await test('POST /upload with invalid Bearer token returns 401', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'image/png',
          Authorization: 'Bearer wrong-key',
        },
        body: new Uint8Array([1, 2, 3]),
      },
      env
    );
    assert.strictEqual(res.status, 401);
  });

  // 17. POST /upload with unsupported Content-Type returns 415
  await test('POST /upload with unsupported Content-Type returns 415', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          Authorization: 'Bearer test-secret-key-123',
        },
        body: 'plain text content',
      },
      env
    );
    assert.strictEqual(res.status, 415);
  });

  // 18. POST /upload with empty payload returns 400
  await test('POST /upload with empty payload returns 400 Bad Request', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'image/png',
          Authorization: 'Bearer test-secret-key-123',
        },
        body: new Uint8Array(0),
      },
      env
    );
    assert.strictEqual(res.status, 400);
  });

  // 19. POST /upload with payload > 5MB returns 413 Payload Too Large
  await test('POST /upload exceeding 5MB returns 413 Payload Too Large', async () => {
    const oversizedBuffer = new Uint8Array(5 * 1024 * 1024 + 1);
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'image/jpeg',
          Authorization: 'Bearer test-secret-key-123',
        },
        body: oversizedBuffer,
      },
      env
    );
    assert.strictEqual(res.status, 413);
  });

  // 20. POST /upload with direct binary image returns hosted URL
  let binaryImageId = '';
  await test('POST /upload with binary PNG returns hosted URL and metadata', async () => {
    const fakePng = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0]);
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'image/png',
          Authorization: 'Bearer test-secret-key-123',
          'X-Filename': 'test-cover.png',
        },
        body: fakePng,
      },
      env
    );

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.id);
    assert.ok(json.url.includes(`/images/${json.id}`));
    assert.strictEqual(json.contentType, 'image/png');
    assert.strictEqual(json.size, 10);
    binaryImageId = json.id;
  });

  // 21. POST /upload with multipart/form-data
  let multipartImageId = '';
  await test('POST /upload with multipart/form-data returns hosted URL', async () => {
    const formData = new FormData();
    const fakeJpg = new Uint8Array([255, 216, 255, 224, 0, 16, 74, 70, 73, 70]);
    const blob = new Blob([fakeJpg], { type: 'image/jpeg' });
    formData.append('file', blob, 'sample-cover.jpg');

    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-secret-key-123',
        },
        body: formData,
      },
      env
    );

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.id);
    assert.strictEqual(json.contentType, 'image/jpeg');
    assert.strictEqual(json.size, 10);
    multipartImageId = json.id;
  });

  // 22. GET /images/:id delivers binary image with cache headers
  await test('GET /images/:id delivers image with edge cache headers (200)', async () => {
    assert.ok(binaryImageId, 'Binary Image ID must be set');
    const res = await app.request(`/images/${binaryImageId}`, {}, env);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('Content-Type'), 'image/png');
    assert.strictEqual(res.headers.get('Cache-Control'), 'public, max-age=31536000, immutable');
    assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');
    assert.strictEqual(res.headers.get('ETag'), `W/"${binaryImageId}"`);
  });

  // 23. GET /images/:id conditional 304 on If-None-Match
  await test('GET /images/:id returns 304 Not Modified when ETag matches', async () => {
    const res = await app.request(
      `/images/${binaryImageId}`,
      {
        headers: { 'If-None-Match': `W/"${binaryImageId}"` },
      },
      env
    );
    assert.strictEqual(res.status, 304);
    assert.strictEqual(res.headers.get('Cache-Control'), 'public, max-age=31536000, immutable');
  });

  // 24. GET /images/:id with unknown ID returns 404
  await test('GET /images/:id with unknown ID returns 404 Not Found', async () => {
    const res = await app.request('/images/non-existent-image-id', {}, env);
    assert.strictEqual(res.status, 404);
  });

  // 25. DELETE /images/:id unauthorized without token returns 401
  await test('DELETE /images/:id without auth returns 401 Unauthorized', async () => {
    const res = await app.request(
      `/images/${binaryImageId}`,
      {
        method: 'DELETE',
      },
      env
    );
    assert.strictEqual(res.status, 401);
  });

  // 26. DELETE /images/:id with auth removes image
  await test('DELETE /images/:id deletes image from KV store', async () => {
    assert.ok(multipartImageId, 'Multipart Image ID must be set');
    const res = await app.request(
      `/images/${multipartImageId}`,
      {
        method: 'DELETE',
        headers: { Authorization: 'Bearer test-secret-key-123' },
      },
      env
    );
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);

    // Subsequent GET returns 404
    const getRes = await app.request(`/images/${multipartImageId}`, {}, env);
    assert.strictEqual(getRes.status, 404);
  });

  // 27. OPTIONS CORS preflight check
  await test('OPTIONS /catalog returns CORS preflight headers', async () => {
    const res = await app.request(
      '/catalog',
      {
        method: 'OPTIONS',
      },
      env
    );
    assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');
  });

  console.log('\n----------------------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log('----------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
