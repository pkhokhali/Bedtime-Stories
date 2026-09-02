# Saanjh 3.0 Backend API Architecture & Survey Report

**Author:** Survey Explorer (Backend)  
**Date:** 2026-09-01  
**Milestone:** Saanjh 3.0 Admin Panel & Backend Upgrade Survey  
**Target Audience:** Orchestrator, Worker Agents, and Reviewers  

---

## 1. Executive Summary

This report delivers an exhaustive architectural survey and technical specification for the Cloudflare Workers Backend API (`backend/`) powering **Saanjh 3.0**. The backend serves as the content distribution and management engine for both the React Native/Expo mobile application and the React Vite Admin CMS.

### Core Objectives Addressed:
1. **Direct Cover Image Upload & Serving Engine**: Implementing `POST /upload` for multipart/binary image ingestion directly into Cloudflare KV (`SAANJH_DB`) and `GET /images/:id` for public, high-speed cached asset delivery.
2. **Full Story & Audio Metadata Persistence**: Upgrading `POST /catalog` and `GET /catalog` to handle rich bilingual text (`Localized`), full `Beat[]` arrays, voice roles (`narrator`, `soft`, `rabbit`, `tiger`), scene identifiers (`SceneId`), stage themes (`StageKind`), and ambient sound bed metadata (`SoundId`).
3. **Robust Bearer Authentication & Security**: Securing mutation endpoints (`POST /catalog`, `POST /upload`, `DELETE /images/:id`) using `ADMIN_SECRET` Bearer tokens, with standard HTTP error codes (`401 Unauthorized`, `400 Bad Request`, `413 Payload Too Large`, `404 Not Found`, `500 Internal Server Error`) and full CORS support.
4. **TypeScript & Tooling Upgrades**: Establishing a dedicated `backend/tsconfig.json`, updating `package.json` scripts, and implementing an automated test suite utilizing Hono's `app.request()` test harness and mock KV storage.

---

## 2. Current Codebase Investigation & Audit

### 2.1 File Structure & Configuration Analysis

#### `backend/package.json`
```json
{
  "name": "backend",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
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
* **Findings:**
  - Hono v4 is used as the web framework.
  - No test command or test framework is configured (`"test"` echoes error).
  - No `@cloudflare/workers-types` in `devDependencies`.

#### `backend/wrangler.toml`
```toml
name = "saanjh-api"
main = "src/index.ts"
compatibility_date = "2023-12-01"

[[kv_namespaces]]
binding = "SAANJH_DB"
id = "97f579307cd347ee8f0904b6c7230813"
```
* **Findings:**
  - KV namespace `SAANJH_DB` is already provisioned and bound.
  - Cloudflare KV provides up to 25MB per value (and 10MB on free tiers), which is ideal for zero-cost, serverless image and JSON storage without requiring external S3/R2 provisioning.

#### `backend/tsconfig.json`
* **Finding:** Missing. The root `tsconfig.json` explicitly excludes `backend` (`exclude: ["node_modules", "admin", "backend", ".agents"]`). A dedicated `backend/tsconfig.json` must be created targeting Cloudflare Workers.

#### `backend/src/index.ts` (Current Baseline)
```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Env = {
  SAANJH_DB: KVNamespace;
  ADMIN_SECRET?: string;
};

const app = new Hono<{ Bindings: Env }>();
app.use('/*', cors());

app.get('/', (c) => c.json({ message: 'Welcome to the Saanjh API' }));

app.get('/catalog', async (c) => {
  try {
    const catalogStr = await c.env.SAANJH_DB.get('catalog');
    if (catalogStr) return c.json(JSON.parse(catalogStr));
    return c.json({ version: 1, stories: [] });
  } catch (err) {
    return c.json({ error: 'Failed to fetch catalog' }, 500);
  }
});

app.post('/catalog', async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const expectedSecret = c.env.ADMIN_SECRET;

  if (expectedSecret && token !== expectedSecret) {
    return c.json({ success: false, error: 'Unauthorized: Invalid or missing admin secret' }, 401);
  }

  try {
    const body = await c.req.json();
    await c.env.SAANJH_DB.put('catalog', JSON.stringify(body));
    return c.json({ success: true, message: 'Catalog updated successfully!' });
  } catch (err) {
    return c.json({ success: false, error: 'Failed to update catalog' }, 500);
  }
});

export default app;
```
* **Gaps in Baseline:**
  1. **No Image Upload (`POST /upload`)**: Admin cannot upload cover images directly.
  2. **No Image Serving (`GET /images/:id`)**: No public endpoint to serve stored image assets.
  3. **No Schema Validation on `POST /catalog`**: Any malformed JSON payload would overwrite the entire database.
  4. **No Single Story Retrieval (`GET /catalog/:id`)**: Clients must fetch the entire catalog even if only checking a single story.

---

## 3. Upgraded Backend Architecture Specification

```
                          ┌──────────────────────────┐
                          │   React Vite Admin CMS   │
                          └─────────────┬────────────┘
                                        │
                         Bearer Token   │  POST /upload (multipart)
                         Auth Check     │  POST /catalog (bilingual, beats, audio)
                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Cloudflare Worker (Hono Router)                      │
│                                                                        │
│  [CORS Middleware] ──> [Auth Middleware] ──> [Route Handlers]          │
│                                                     │                  │
│       ┌─────────────────┬───────────────────┬───────┴────────┐         │
│       ▼                 ▼                   ▼                ▼         │
│  GET /catalog     POST /catalog       POST /upload     GET /images/:id │
│  (Public)         (Auth Required)     (Auth Required)  (Public + Cache)│
└───────┬─────────────────┬───────────────────┬────────────────┬─────────┘
        │                 │                   │                │
        ▼                 ▼                   ▼                ▼
   ┌──────────────────────────────────────────────────────────────┐
   │                  Cloudflare KV: SAANJH_DB                    │
   │                                                              │
   │   Key: "catalog"               Key: "image:<id>"             │
   │   Value: JSON (stories, beats) Value: ArrayBuffer + Metadata │
   └──────────────────────────────────────────────────────────────┘
                                        ▲
                                        │ Public Fetch (GET /catalog, GET /images/:id)
                          ┌─────────────┴────────────┐
                          │  Expo Mobile App (Saanjh)│
                          └──────────────────────────┘
```

### 3.1 Direct Image Upload & Storage Specification

#### Endpoint: `POST /upload`
- **Purpose:** Handles direct image file uploads from the Admin Panel.
- **Authentication:** Required (`Authorization: Bearer <ADMIN_SECRET>`).
- **Supported Content Types:**
  - `multipart/form-data` with form field `file` (standard browser `<input type="file" />`).
  - `image/jpeg`, `image/png`, `image/webp`, `image/gif` (direct raw binary upload).
- **Validation Rules:**
  - Returns `400 Bad Request` if file payload is empty or field is missing.
  - Returns `413 Payload Too Large` if image exceeds **5 MB** (`5 * 1024 * 1024` bytes).
  - Returns `415 Unsupported Media Type` if MIME type is not an image.
- **Storage Strategy:**
  - Generates a collision-resistant unique ID: `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`.
  - Storage key in `SAANJH_DB`: `image:${id}`.
  - Writes `ArrayBuffer` to KV with metadata:
    ```typescript
    await c.env.SAANJH_DB.put(`image:${id}`, buffer, {
      metadata: {
        contentType: mimeType,
        filename: sanitizedFilename,
        size: buffer.byteLength,
        uploadedAt: new Date().toISOString(),
      },
    });
    ```
- **Response Format (`200 OK`):**
  ```json
  {
    "success": true,
    "id": "lh7z2q-a1b2c3d4",
    "url": "https://saanjh-api.prabinkhokhali89.workers.dev/images/lh7z2q-a1b2c3d4",
    "filename": "cover_moon_rabbit.png",
    "size": 245890,
    "contentType": "image/png"
  }
  ```

#### Endpoint: `GET /images/:id`
- **Purpose:** Public endpoint for delivering images to the mobile app and admin preview with high-performance edge caching.
- **Authentication:** None (Public).
- **Headers Returned:**
  - `Content-Type`: `metadata.contentType || 'image/jpeg'`
  - `Cache-Control`: `public, max-age=31536000, immutable` (Cloudflare edge and device cache for 1 year).
  - `Access-Control-Allow-Origin`: `*`
  - `ETag`: `W/"${id}"`
- **Error Handling:** Returns `404 Not Found` if the key does not exist.

#### Endpoint: `DELETE /images/:id` (Admin Maintenance)
- **Purpose:** Deletes an uploaded image from KV store.
- **Authentication:** Required (`Authorization: Bearer <ADMIN_SECRET>`).
- **Response Format (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Image deleted successfully",
    "id": "lh7z2q-a1b2c3d4"
  }
  ```

---

### 3.2 Full Story & Audio Metadata Persistence Specification

#### Data Schema Definition
The backend persists the full Saanjh 3.0 catalog schema matching `types/story.ts`:

```typescript
export type Language = 'en' | 'ne';
export type Localized = Record<Language, string>;

export type AgeBand = '2-4' | '4-6' | '6-8' | '9-12' | '13-17' | '18-25' | '25+' | 'parents';
export type StoryCategory = 'roots' | 'universal' | 'custom';
export type StoryForm = 'story' | 'novel';
export type StageKind = 'forest' | 'moon' | 'river' | 'courtyard' | 'hills' | 'lamp' | 'stars';
export type SceneId = 'establishing' | 'meeting' | 'walk' | 'roar' | 'well' | 'leap' | 'peace' | 'moon' | 'river' | 'courtyard' | 'hills' | 'lamp' | 'stars';
export type VoiceRole = 'narrator' | 'tiger' | 'rabbit' | 'soft';
export type SoundId = 'night' | 'moon' | 'river' | 'courtyard' | 'roar' | 'splash' | 'ripple' | 'chime' | 'wind';
export type Pose = 'hidden' | 'idle' | 'walk' | 'bow' | 'sit' | 'roar' | 'leap' | 'lookDown';

export type Beat = {
  id: string;
  text: Localized;
  scene: SceneId;
  rabbit?: Pose;
  tiger?: Pose;
  voice?: VoiceRole;
  music?: SoundId;
  sfx?: SoundId;
};

export type Story = {
  id: string;
  category: StoryCategory;
  form: StoryForm;
  ageBand: AgeBand;
  title: Localized;
  subtitle?: Localized;
  runtimeMinutes?: number;
  theme?: Localized;
  accent?: string;
  stage?: StageKind;
  cast?: 'rabbit' | 'none';
  locked?: boolean;
  beats?: Beat[];
  mediaType?: 'video' | 'audio' | 'text';
  mediaUrl?: string;
  mediaUrl_ne?: string;
  coverImage?: string;
  isHidden?: boolean;
};

export type Catalog = {
  version: number;
  updatedAt?: string;
  stories: Story[];
};
```

#### Endpoint: `POST /catalog`
- **Authentication:** Required (`Authorization: Bearer <ADMIN_SECRET>`).
- **Validation Rules:**
  1. Payload must be a JSON object containing a `stories` array.
  2. Each story must have a non-empty string `id` and a valid `title` (`title.en` or `title.ne`).
  3. `ageBand` must be one of the 8 supported bands: `['2-4', '4-6', '6-8', '9-12', '13-17', '18-25', '25+', 'parents']`.
  4. If `beats` are present, each beat must contain `id`, `text` (`en` or `ne`), and `scene`.
  5. Auto-increments `version` if not supplied.
  6. Adds `updatedAt: new Date().toISOString()`.
- **Response Format (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Catalog updated successfully!",
    "version": 3,
    "storyCount": 24
  }
  ```

#### Endpoint: `GET /catalog`
- **Purpose:** Delivers the active catalog to mobile apps and admin.
- **Authentication:** None (Public).
- **Caching:** Default `Cache-Control: no-cache` with ETag support for instantaneous updates.
- **Response Format (`200 OK`):**
  ```json
  {
    "version": 3,
    "updatedAt": "2026-09-01T12:30:00.000Z",
    "stories": [ ... ]
  }
  ```

#### Endpoint: `GET /catalog/:id`
- **Purpose:** Fetches a single story by ID (convenience for deep links or partial sync).
- **Response Format (`200 OK`):**
  ```json
  {
    "success": true,
    "story": { "id": "clever-rabbit", ... }
  }
  ```
- **Error Handling:** Returns `404 Not Found` if story does not exist in catalog.

---

### 3.3 Authentication, Error Handling & CORS Matrix

| Status Code | Reason | Example Response Body |
|---|---|---|
| **`200 OK`** | Successful query or mutation | `{"success": true, "message": "Catalog updated successfully!"}` |
| **`400 Bad Request`** | Malformed JSON, missing fields, or invalid enum value | `{"success": false, "error": "Invalid catalog: 'stories' must be an array"}` |
| **`401 Unauthorized`** | Missing or incorrect `Authorization: Bearer <secret>` | `{"success": false, "error": "Unauthorized: Invalid or missing admin secret"}` |
| **`404 Not Found`** | Resource (image or story ID) does not exist | `{"success": false, "error": "Image not found"}` |
| **`413 Payload Too Large`** | Uploaded image exceeds 5MB limit | `{"success": false, "error": "File size exceeds maximum allowed limit of 5MB"}` |
| **`415 Unsupported Media Type`** | Non-image content type uploaded | `{"success": false, "error": "Unsupported Content-Type. Expected image file"}` |
| **`500 Internal Server Error`** | Uncaught exception or KV storage failure | `{"success": false, "error": "Internal server error: <details>"}` |

#### CORS Policy
- Wildcard origin `*` enabled for all routes.
- Allowed Methods: `GET, POST, PUT, DELETE, OPTIONS`.
- Allowed Headers: `Content-Type, Authorization, X-Requested-With`.
- Max Age: `86400` seconds (preflight cache).

---

## 4. Implementation Blueprints

### 4.1 Upgraded `backend/src/index.ts`

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
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
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

### 4.2 Configuration Files

#### `backend/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

#### `backend/package.json` Upgrades
```json
{
  "name": "backend",
  "version": "1.0.0",
  "main": "src/index.ts",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "typecheck": "tsc --noEmit",
    "test": "node test/runner.js"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240208.0",
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

## 5. Automated Testing Strategy & Test Suite Blueprint

### 5.1 In-Memory KV Mock & Test Harness (`backend/test/runner.js`)

```javascript
/**
 * Saanjh 3.0 Backend Test Suite
 * Executes in Node.js without requiring live Cloudflare networks.
 */

const assert = require('assert');

class MockKVNamespace {
  constructor() {
    this.store = new Map();
    this.metadataStore = new Map();
  }

  async get(key, options) {
    const val = this.store.get(key);
    if (!val) return null;
    if (options && options.type === 'arrayBuffer') {
      return val instanceof ArrayBuffer ? val : Buffer.from(val).buffer;
    }
    return typeof val === 'string' ? val : Buffer.from(val).toString('utf8');
  }

  async getWithMetadata(key, options) {
    const value = await this.get(key, options);
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
}

async function runTests() {
  console.log('--- Running Saanjh 3.0 Backend Test Suite ---');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  // Require compiled or transpiled app
  require('ts-node').register({ transpileOnly: true });
  const app = require('../src/index.ts').default;

  const mockDb = new MockKVNamespace();
  const env = {
    SAANJH_DB: mockDb,
    ADMIN_SECRET: 'test-secret-key-123',
  };

  // Test 1: GET /
  await test('GET / returns service health status 200', async () => {
    const res = await app.request('/', {}, env);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.status, 'healthy');
  });

  // Test 2: GET /catalog when empty
  await test('GET /catalog returns fallback empty catalog when DB empty', async () => {
    const res = await app.request('/catalog', {}, env);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.version, 1);
    assert.deepStrictEqual(json.stories, []);
  });

  // Test 3: POST /catalog without auth -> 401
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
  });

  // Test 4: POST /catalog with invalid Bearer token -> 401
  await test('POST /catalog with invalid Bearer token returns 401', async () => {
    const res = await app.request(
      '/catalog',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer wrong-token',
        },
        body: JSON.stringify({ version: 1, stories: [] }),
      },
      env
    );
    assert.strictEqual(res.status, 401);
  });

  // Test 5: POST /catalog with valid Bearer token and full story -> 200
  await test('POST /catalog with valid Bearer token saves story and Beat[] array', async () => {
    const validStory = {
      id: 'clever-rabbit',
      category: 'roots',
      form: 'story',
      ageBand: '6-8',
      title: { en: 'The Clever Rabbit', ne: 'चतुर खरायो' },
      subtitle: { en: 'A forest fable', ne: 'जङ्गलको कथा' },
      stage: 'forest',
      beats: [
        {
          id: 'b1',
          text: { en: 'Once upon a time', ne: 'एक देशमा' },
          scene: 'establishing',
          voice: 'soft',
          music: 'night',
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

    // Verify GET /catalog reflects saved data
    const getRes = await app.request('/catalog', {}, env);
    const getJson = await getRes.json();
    assert.strictEqual(getJson.stories.length, 1);
    assert.strictEqual(getJson.stories[0].id, 'clever-rabbit');
    assert.strictEqual(getJson.stories[0].beats.length, 1);
  });

  // Test 6: POST /upload without auth -> 401
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

  // Test 7: POST /upload with binary image -> 200 + URL
  await test('POST /upload with binary image returns hosted URL and ID', async () => {
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

    // Test 8: GET /images/:id delivers binary image
    const imageRes = await app.request(`/images/${json.id}`, {}, env);
    assert.strictEqual(imageRes.status, 200);
    assert.strictEqual(imageRes.headers.get('Content-Type'), 'image/png');
    assert.strictEqual(imageRes.headers.get('Cache-Control'), 'public, max-age=31536000, immutable');
  });

  // Test 9: GET /images/unknown -> 404
  await test('GET /images/unknown-id returns 404 Not Found', async () => {
    const res = await app.request('/images/does-not-exist', {}, env);
    assert.strictEqual(res.status, 404);
  });

  console.log(`\nSummary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests();
```

---

## 6. Integration Guide for Admin CMS & Mobile App

### 6.1 Admin CMS Integration (`admin/src/App.tsx`)
```typescript
// 1. Upload cover image and get URL
async function uploadCoverImage(file: File, adminSecret: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('https://saanjh-api.prabinkhokhali89.workers.dev/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminSecret}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Failed to upload image');
  }

  const data = await res.json();
  return data.url; // Remote hosted URL
}

// 2. Publish complete catalog with Beat[] and audio metadata
async function publishCatalog(catalog: Catalog, adminSecret: string): Promise<void> {
  const res = await fetch('https://saanjh-api.prabinkhokhali89.workers.dev/catalog', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminSecret}`,
    },
    body: JSON.stringify({ ...catalog, version: (catalog.version || 0) + 1 }),
  });

  if (res.status === 401) throw new Error('Unauthorized: Invalid Admin Secret');
  if (!res.ok) throw new Error('Failed to publish catalog to database');
}
```

### 6.2 Mobile App Integration (`lib/catalogFetcher.ts`)
- Mobile app continues calling `GET https://saanjh-api.prabinkhokhali89.workers.dev/catalog`.
- Receives updated stories with direct hosted `coverImage` URLs (e.g. `https://saanjh-api.prabinkhokhali89.workers.dev/images/...`) and full `beats` arrays.
- Automatic caching in Cloudflare edge ensures zero latency and minimal egress.
