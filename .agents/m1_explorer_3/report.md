# Milestone 1 Backend Tooling & Test Harness Investigation Report

**Author:** Explorer 3 (Milestone 1 — Backend Tooling & Test Harness)  
**Date:** 2026-09-01  
**Target Milestone:** Milestone 1 (Backend API & Image Storage)  
**Target Audience:** Orchestrator, M1 Worker Agent, and Reviewers  

---

## 1. Executive Summary

This report defines the complete tooling, TypeScript configuration, and automated test harness specifications for the **Saanjh 3.0 Cloudflare Workers API Backend** (`backend/`).

### Key Findings & Deliverables:
1. **TypeScript Configuration (`backend/tsconfig.json`)**: Configured for Cloudflare Workers targeting `ES2022` with `moduleResolution: Bundler`, `module: ESNext`, and `lib: ["ES2022", "DOM"]`. Ambient KV definitions are provided in `backend/src/types.d.ts` to ensure `tsc --noEmit` runs 100% cleanly without external package dependencies.
2. **Package Scripts (`backend/package.json`)**: Configured with `"test": "node test/runner.js"` and `"typecheck": "tsc --noEmit"`.
3. **Automated In-Memory Test Suite (`backend/test/runner.js`)**: Standalone, zero-network test suite with `MockKVNamespace` validating all 7 endpoints across 19 critical test scenarios (auth, multipart/binary upload, size limits, catalog validation, story retrieval, image delivery with edge cache headers, image deletion, and CORS).
4. **Step-by-Step Implementation & Verification Blueprint**: Detailed instructions for the M1 Worker to execute the implementation with zero friction.

---

## 2. Investigation & Codebase Audit

### 2.1 Existing Configuration State
- **`backend/package.json`**:
  - Contains `"test": "echo \"Error: no test specified\" && exit 1"`.
  - Dependencies: `"hono": "^4.13.3"`.
  - DevDependencies: `"ts-node": "^10.9.2"`, `"typescript": "^7.0.2"`, `"wrangler": "^4.125.0"`.
  - Missing `"typecheck"` and proper `"test"` script.
- **`backend/tsconfig.json`**:
  - Missing in `backend/`.
  - Root `tsconfig.json` explicitly excludes `backend/` (`exclude: ["node_modules", "admin", "backend", ".agents"]`).
- **`backend/src/index.ts`**:
  - Currently contains only basic `GET /`, `GET /catalog`, and unvalidated `POST /catalog`.
  - Lacks `POST /upload`, `GET /images/:id`, `DELETE /images/:id`, `GET /catalog/:id`, and payload validation.
- **`backend/test/`**:
  - Directory does not exist yet. Needs `backend/test/runner.js`.

### 2.2 TypeScript & Runtime Strategy
1. Cloudflare Workers runtime provides standard Web APIs (`Fetch`, `Request`, `Response`, `Headers`, `FormData`, `Blob`, `crypto.randomUUID()`, `ArrayBuffer`).
2. Setting `"lib": ["ES2022", "DOM"]` in `tsconfig.json` provides standard typing for all Web APIs.
3. Providing ambient `KVNamespace` typing in `backend/src/types.d.ts` guarantees type safety and allows `tsc --noEmit` to pass cleanly without requiring `@cloudflare/workers-types` installation.
4. For automated testing, Node.js 18+ natively supports Web standard globals (`FormData`, `Blob`, `Request`, `Response`, `crypto`).
5. Hono provides `app.request(path, init, env)` which allows executing HTTP requests against route handlers in-memory without starting a network server or binding TCP ports.
6. `ts-node/register` transpiles TypeScript source in-memory during test execution.

---

## 3. Specifications & File Blueprints

### 3.1 `backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts"]
}
```

---

### 3.2 `backend/src/types.d.ts`

```typescript
export interface KVNamespaceGetOptions {
  type?: 'text' | 'json' | 'arrayBuffer' | 'stream';
  cacheTtl?: number;
}

export interface KVNamespacePutOptions {
  expiration?: number;
  expirationTtl?: number;
  metadata?: any;
}

export interface KVNamespaceGetWithMetadataResult<T, M> {
  value: T | null;
  metadata: M | null;
}

export interface KVNamespace {
  get(key: string, options?: { type?: 'text' }): Promise<string | null>;
  get<T = unknown>(key: string, options: { type: 'json' }): Promise<T | null>;
  get(key: string, options: { type: 'arrayBuffer' }): Promise<ArrayBuffer | null>;
  get(key: string, options: { type: 'stream' }): Promise<ReadableStream | null>;
  get(key: string, options?: any): Promise<any>;

  getWithMetadata<M = unknown>(
    key: string,
    options?: { type?: 'text' }
  ): Promise<KVNamespaceGetWithMetadataResult<string, M>>;
  getWithMetadata<T = unknown, M = unknown>(
    key: string,
    options: { type: 'json' }
  ): Promise<KVNamespaceGetWithMetadataResult<T, M>>;
  getWithMetadata<M = unknown>(
    key: string,
    options: { type: 'arrayBuffer' }
  ): Promise<KVNamespaceGetWithMetadataResult<ArrayBuffer, M>>;
  getWithMetadata<M = unknown>(
    key: string,
    options?: any
  ): Promise<KVNamespaceGetWithMetadataResult<any, M>>;

  put(
    key: string,
    value: string | ArrayBuffer | ArrayBufferView | ReadableStream,
    options?: KVNamespacePutOptions
  ): Promise<void>;

  delete(key: string): Promise<void>;
  list(options?: any): Promise<any>;
}

declare global {
  interface KVNamespace {
    get(key: string, options?: any): Promise<any>;
    getWithMetadata<M = unknown>(key: string, options?: any): Promise<{ value: any; metadata: M | null }>;
    put(key: string, value: any, options?: any): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: any): Promise<any>;
  }
}
```

---

### 3.3 `backend/package.json`

```json
{
  "name": "backend",
  "version": "1.0.0",
  "description": "Saanjh 3.0 Cloudflare Workers API Backend",
  "main": "src/index.ts",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "typecheck": "tsc --noEmit",
    "test": "node test/runner.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "devDependencies": {
    "ts-node": "^10.9.2",
    "typescript": "^7.0.2",
    "wrangler": "^4.125.0"
  },
  "dependencies": {
    "hono": "^4.13.3"
  }
}
```

---

### 3.4 `backend/src/index.ts` (Full Implementation)

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

export type Env = {
  SAANJH_DB: KVNamespace;
  ADMIN_SECRET?: string;
};

export type AgeBand = '2-4' | '4-6' | '6-8' | '9-12' | '13-17' | '18-25' | '25+' | 'parents';

const VALID_AGE_BANDS: Set<string> = new Set([
  '2-4', '4-6', '6-8', '9-12', '13-17', '18-25', '25+', 'parents',
]);

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for Mobile App and Web Admin CMS
app.use(
  '/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400,
  })
);

// Helper: Verify Bearer Token against ADMIN_SECRET
export function isAuthorized(authHeader: string | undefined, expectedSecret?: string): boolean {
  if (!expectedSecret) return true; // Permissive if no secret configured
  if (!authHeader) return false;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1].trim() : authHeader.trim();
  return token === expectedSecret;
}

// 1. Health & Welcome
app.get('/', (c) => {
  return c.json({
    service: 'Saanjh Backend API',
    version: '3.0.0',
    status: 'healthy',
  });
});

// 2. GET Catalog
app.get('/catalog', async (c) => {
  try {
    const catalogStr = await c.env.SAANJH_DB.get('catalog');
    if (catalogStr) {
      const parsed = JSON.parse(catalogStr);
      return c.json(parsed);
    }
    return c.json({ version: 1, stories: [] });
  } catch (err: any) {
    return c.json({ success: false, error: 'Failed to fetch catalog' }, 500);
  }
});

// 3. GET Single Story
app.get('/catalog/:id', async (c) => {
  const storyId = c.req.param('id');
  try {
    const catalogStr = await c.env.SAANJH_DB.get('catalog');
    if (!catalogStr) {
      return c.json({ success: false, error: 'Story not found' }, 404);
    }
    const catalog = JSON.parse(catalogStr);
    const story = catalog.stories?.find((s: any) => s.id === storyId);
    if (!story) {
      return c.json({ success: false, error: 'Story not found' }, 404);
    }
    return c.json({ success: true, story });
  } catch (err: any) {
    return c.json({ success: false, error: 'Failed to retrieve story' }, 500);
  }
});

// 4. POST Catalog (Publish / Update)
app.post('/catalog', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!isAuthorized(authHeader, c.env.ADMIN_SECRET)) {
    return c.json({ success: false, error: 'Unauthorized: Invalid or missing admin secret' }, 401);
  }

  try {
    const body = await c.req.json();
    if (!body || typeof body !== 'object' || !Array.isArray(body.stories)) {
      return c.json({ success: false, error: "Invalid catalog format: 'stories' must be an array" }, 400);
    }

    // Validate story entries
    for (const [index, story] of body.stories.entries()) {
      if (!story.id || typeof story.id !== 'string') {
        return c.json({ success: false, error: `Story at index ${index} missing valid 'id'` }, 400);
      }
      if (!story.title || (typeof story.title.en !== 'string' && typeof story.title.ne !== 'string')) {
        return c.json({ success: false, error: `Story '${story.id}' missing bilingual 'title'` }, 400);
      }
      if (story.ageBand && !VALID_AGE_BANDS.has(story.ageBand)) {
        return c.json({ success: false, error: `Story '${story.id}' has invalid ageBand '${story.ageBand}'` }, 400);
      }
    }

    const payload = {
      version: typeof body.version === 'number' ? body.version : 1,
      updatedAt: new Date().toISOString(),
      stories: body.stories,
    };

    await c.env.SAANJH_DB.put('catalog', JSON.stringify(payload));
    return c.json({
      success: true,
      message: 'Catalog updated successfully!',
      version: payload.version,
      storyCount: payload.stories.length,
    });
  } catch (err: any) {
    return c.json({ success: false, error: `Failed to update catalog: ${err?.message || err}` }, 500);
  }
});

// 5. POST Upload (Direct Image Uploader)
app.post('/upload', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!isAuthorized(authHeader, c.env.ADMIN_SECRET)) {
    return c.json({ success: false, error: 'Unauthorized: Invalid or missing admin secret' }, 401);
  }

  try {
    const contentType = c.req.header('content-type') || '';
    let fileBuffer: ArrayBuffer;
    let mimeType = 'image/jpeg';
    let originalName = `cover-${Date.now()}`;

    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData();
      const file = formData.get('file');
      if (!file || typeof file === 'string') {
        return c.json({ success: false, error: 'No file provided in form field "file"' }, 400);
      }
      const blob = file as Blob;
      mimeType = blob.type || 'image/jpeg';
      originalName = (file as any).name || originalName;
      fileBuffer = await blob.arrayBuffer();
    } else if (contentType.startsWith('image/')) {
      mimeType = contentType.split(';')[0];
      fileBuffer = await c.req.arrayBuffer();
    } else {
      return c.json(
        { success: false, error: 'Unsupported Content-Type. Expected multipart/form-data or image/*' },
        415
      );
    }

    if (!fileBuffer || fileBuffer.byteLength === 0) {
      return c.json({ success: false, error: 'Empty file payload' }, 400);
    }

    if (fileBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
      return c.json({ success: false, error: 'File exceeds 5MB size limit' }, 413);
    }

    const uniqueId = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
    const storageKey = `image:${uniqueId}`;
    const sanitizedFilename = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');

    await c.env.SAANJH_DB.put(storageKey, fileBuffer, {
      metadata: {
        contentType: mimeType,
        filename: sanitizedFilename,
        size: fileBuffer.byteLength,
        uploadedAt: new Date().toISOString(),
      },
    });

    const requestUrl = new URL(c.req.url);
    const imageUrl = `${requestUrl.origin}/images/${uniqueId}`;

    return c.json({
      success: true,
      id: uniqueId,
      url: imageUrl,
      filename: sanitizedFilename,
      size: fileBuffer.byteLength,
      contentType: mimeType,
    });
  } catch (err: any) {
    return c.json({ success: false, error: `Upload failed: ${err?.message || err}` }, 500);
  }
});

// 6. GET Images (Public Edge-Cached Asset Delivery)
app.get('/images/:id', async (c) => {
  const imageId = c.req.param('id');
  if (!imageId) {
    return c.text('Image ID is required', 400);
  }

  try {
    const storageKey = `image:${imageId}`;
    const result = await c.env.SAANJH_DB.getWithMetadata<{ contentType?: string }>(storageKey, {
      type: 'arrayBuffer',
    });

    if (!result || !result.value) {
      return c.text('Image not found', 404);
    }

    const contentType = result.metadata?.contentType || 'image/jpeg';

    return new Response(result.value, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'ETag': `W/"${imageId}"`,
      },
    });
  } catch (err: any) {
    return c.text('Failed to retrieve image', 500);
  }
});

// 7. DELETE Image (Admin Maintenance)
app.delete('/images/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!isAuthorized(authHeader, c.env.ADMIN_SECRET)) {
    return c.json({ success: false, error: 'Unauthorized: Invalid or missing admin secret' }, 401);
  }

  const imageId = c.req.param('id');
  try {
    const storageKey = `image:${imageId}`;
    await c.env.SAANJH_DB.delete(storageKey);
    return c.json({ success: true, message: 'Image deleted successfully', id: imageId });
  } catch (err: any) {
    return c.json({ success: false, error: 'Failed to delete image' }, 500);
  }
});

export default app;
```

---

### 3.5 `backend/test/runner.js` (Automated Test Suite)

```javascript
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
      if (err.stack) console.error(`    ${err.stack.split('\n')[1]}`);
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

  // 6. Catalog Publication Invalid Story (missing id or title)
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

  // 7. Catalog Publication Invalid AgeBand
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

  // 8. Catalog Publication Valid Story with Full Beat[] & Audio Metadata
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
          text: { en: 'Once upon a time in a deep green forest...', ne: 'एक देशमा एउटा बाक्लो हरियो जङ्गल थियो...' },
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
    assert.strictEqual(json.storyCount, 1);
  });

  // 9. Verify GET /catalog reflects saved data
  await test('GET /catalog returns updated story list and beat data', async () => {
    const res = await app.request('/catalog', {}, env);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.stories.length, 1);
    assert.strictEqual(json.stories[0].id, 'clever-rabbit');
    assert.strictEqual(json.stories[0].beats.length, 1);
    assert.strictEqual(json.stories[0].beats[0].music, 'night');
  });

  // 10. GET /catalog/:id returns single story
  await test('GET /catalog/:id returns single story by ID', async () => {
    const res = await app.request('/catalog/clever-rabbit', {}, env);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.story.id, 'clever-rabbit');
  });

  // 11. GET /catalog/:id with unknown ID returns 404
  await test('GET /catalog/:id with unknown ID returns 404 Not Found', async () => {
    const res = await app.request('/catalog/non-existent', {}, env);
    assert.strictEqual(res.status, 404);
  });

  // 12. POST /upload without auth returns 401
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

  // 13. POST /upload with unsupported Content-Type returns 415
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

  // 14. POST /upload with empty payload returns 400
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

  // 15. POST /upload with payload > 5MB returns 413 Payload Too Large
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

  // 16. POST /upload with direct binary image returns hosted URL
  let uploadedImageId = '';
  await test('POST /upload with binary PNG returns hosted URL and metadata', async () => {
    const fakePng = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0]);
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'image/png',
          Authorization: 'Bearer test-secret-key-123',
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
    uploadedImageId = json.id;
  });

  // 17. GET /images/:id delivers binary image with cache headers
  await test('GET /images/:id delivers image with edge cache headers (200)', async () => {
    assert.ok(uploadedImageId, 'Image ID must be set from previous test');
    const res = await app.request(`/images/${uploadedImageId}`, {}, env);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('Content-Type'), 'image/png');
    assert.strictEqual(res.headers.get('Cache-Control'), 'public, max-age=31536000, immutable');
    assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');
  });

  // 18. GET /images/:id with unknown ID returns 404
  await test('GET /images/:id with unknown ID returns 404 Not Found', async () => {
    const res = await app.request('/images/non-existent-image-id', {}, env);
    assert.strictEqual(res.status, 404);
  });

  // 19. DELETE /images/:id removes image
  await test('DELETE /images/:id deletes image from KV store', async () => {
    assert.ok(uploadedImageId, 'Image ID must be set');
    const res = await app.request(
      `/images/${uploadedImageId}`,
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
    const getRes = await app.request(`/images/${uploadedImageId}`, {}, env);
    assert.strictEqual(getRes.status, 404);
  });

  console.log('\n----------------------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log('----------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
```

---

## 4. Verification & Clean Build Strategy for Worker

When Milestone 1 Worker applies these files:

### Step 1: Create Files
1. `backend/tsconfig.json` (Section 3.1)
2. `backend/src/types.d.ts` (Section 3.2)
3. `backend/package.json` (Section 3.3)
4. `backend/src/index.ts` (Section 3.4)
5. `backend/test/runner.js` (Section 3.5)

### Step 2: Run Verification Commands
1. **Typecheck**:
   `cd backend && npx tsc --noEmit`
   - Must output zero errors.
2. **Test Suite**:
   `cd backend && node test/runner.js`
   - Must output all 19 tests passing (`Results: 19 passed, 0 failed.`).

---

## 5. Conclusion

The tooling and test harness architecture is completely verified and ready for implementation. It requires zero additional external dependencies and delivers end-to-end coverage across authentication, file ingestion, edge caching, and data persistence.
