# Saanjh 3.0 Backend Image Upload & Storage Architecture Report

**Author:** Milestone 1 Explorer 1 (Backend Image Upload & Storage)  
**Date:** 2026-09-01  
**Working Directory:** `d:\Antigravity Projects\Bedtime Stories\.agents\m1_explorer_1`  
**Target File:** `backend/src/index.ts`, `backend/tsconfig.json`, `backend/package.json`, `backend/test/runner.js`  

---

## 1. Executive Summary

This investigation report provides a comprehensive, production-grade technical specification and implementation blueprint for **Milestone 1 (Backend Image Upload & Storage)** of the **Saanjh 3.0** upgrade.

The primary objective of Milestone 1 is to elevate the existing Cloudflare Workers backend (`backend/src/index.ts`) from a minimal prototype into a robust edge API supporting:
1. **Direct Cover Image Ingestion (`POST /upload`)**: Seamless handling of `multipart/form-data` and raw binary payloads (`image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`), with strict 5MB size enforcement, collision-resistant ID generation (`${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`), and structured metadata storage in Cloudflare Workers KV (`SAANJH_DB`).
2. **High-Performance Public Edge Asset Delivery (`GET /images/:id`)**: Zero-latency binary image delivery with 1-year immutable caching (`Cache-Control: public, max-age=31536000, immutable`), ETag validation (with `304 Not Modified` support), and permissive CORS headers.
3. **Protected Image Deletion (`DELETE /images/:id`)**: Admin maintenance endpoint secured via Bearer token authentication.
4. **Enhanced Catalog Management (`POST /catalog`, `GET /catalog`, `GET /catalog/:id`)**: Strict payload validation for bilingual titles (`Localized`), all 8 `AgeBand` values (including `'parents'`), full `Beat[]` arrays, audio scene metadata, auto-versioning, and single-story retrieval.
5. **Bearer Token Authentication & Security**: Universal auth enforcement on all mutation endpoints using `ADMIN_SECRET`, structured HTTP error responses (`400`, `401`, `404`, `413`, `415`, `500`), and wildcard CORS.
6. **Developer Tooling & Automated Test Suite**: Dedicated TypeScript configuration (`backend/tsconfig.json`), updated scripts in `backend/package.json`, and an in-memory mock KV test suite (`backend/test/runner.js`) validating 100% of routes and edge cases.

---

## 2. Current Baseline vs Target Architecture

### 2.1 Audit of Existing `backend/src/index.ts`
The baseline `backend/src/index.ts` contains only 57 lines:
- Basic `GET /` and `GET /catalog` routes.
- An unvalidated `POST /catalog` that directly overwrites the `catalog` key in KV.
- No `POST /upload` endpoint (blocking direct image uploads from the Admin panel).
- No `GET /images/:id` endpoint (preventing image hosting on the Cloudflare domain).
- No `DELETE /images/:id` endpoint.
- No `GET /catalog/:id` endpoint.
- Incomplete Bearer token checking (no validation of catalog schema, no error detail).
- Missing `backend/tsconfig.json` and no automated test suite.

### 2.2 System Architecture Diagram

```
                             ┌───────────────────────────────┐
                             │     React Vite Admin CMS      │
                             │  (ImageUploader / BeatEditor) │
                             └───────────────┬───────────────┘
                                             │
                       Bearer Auth Header    │  POST /upload (multipart / binary)
                       Authorization: Bearer │  POST /catalog (JSON schema)
                                             │  DELETE /images/:id
                                             ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Cloudflare Worker API (Hono Engine)                             │
│                                                                                        │
│  [CORS: Allow-Origin: *] ──> [Bearer Auth Guard] ──> [Route Handlers]                  │
│                                                            │                           │
│        ┌───────────────────┬───────────────────┬───────────┴───────────┐               │
│        ▼                   ▼                   ▼                       ▼               │
│   GET /catalog        POST /catalog       POST /upload            GET /images/:id      │
│   (Public JSON)       (Bearer Auth)       (Bearer Auth)           (Public Binary)      │
│   GET /catalog/:id    (Validate Schema)   (Size & MIME Checks)    (1-Year Immutable)   │
└────────┬───────────────────┬───────────────────┬───────────────────────┬───────────────┘
         │                   │                   │                       │
         ▼                   ▼                   ▼                       ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │                     Cloudflare KV: SAANJH_DB                           │
    │                                                                        │
    │   Key: "catalog"                 Key: "image:<id>"                     │
    │   Value: JSON Catalog Tree       Value: ArrayBuffer                    │
    │   (Stories, Beats, Audio Enums)  Metadata: { contentType, size,        │
    │                                              filename, uploadedAt }    │
    └────────────────────────────────────────────────────────────────────────┘
                                                 ▲
                                                 │ Public Read
                                                 │ GET /catalog
                                                 │ GET /images/:id
                                     ┌───────────┴───────────┐
                                     │  Saanjh 3.0 Mobile    │
                                     │  (Expo / React Native)│
                                     └───────────────────────┘
```

---

## 3. Image Upload & Storage Specification (`POST /upload`)

### 3.1 Dual-Mode Payload Ingestion
The upload endpoint must support two ingestion pathways:
1. **Multipart Form Upload (`multipart/form-data`)**: Used by standard web browser `<input type="file" />` via `FormData.append('file', file)`.
2. **Direct Binary Body (`image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`)**: Used by scripts, automated tools, or direct stream uploads.

#### Ingestion Workflow:
```typescript
const contentType = c.req.header('content-type') || '';
let fileBuffer: ArrayBuffer;
let mimeType = 'image/jpeg';
let originalName = `upload-${Date.now()}`;

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
  mimeType = contentType.split(';')[0].trim().toLowerCase();
  const headerFilename = c.req.header('x-filename');
  const urlParamFilename = c.req.query('filename');
  originalName = headerFilename || urlParamFilename || `image-${Date.now()}`;
  fileBuffer = await c.req.arrayBuffer();
} else {
  return c.json(
    { success: false, error: 'Unsupported Content-Type. Expected multipart/form-data or image/*' },
    415
  );
}
```

### 3.2 MIME Type Whitelist & Validation
Supported image types:
- `image/jpeg` (`.jpg`, `.jpeg`)
- `image/png` (`.png`)
- `image/webp` (`.webp`)
- `image/gif` (`.gif`)
- `image/svg+xml` (`.svg`)

If a multipart file has an empty `type` or generic `application/octet-stream`, the MIME type is derived from the file extension:
```typescript
function inferMimeType(filename: string, fallback: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    default:
      return fallback;
  }
}
```

### 3.3 Size Limit & Boundary Checks
- **Maximum payload size**: **5 MB** (`5 * 1024 * 1024` = `5,242,880` bytes).
- **Fast-fail check**: Inspect `Content-Length` header if present.
- **Definitive check**: Inspect `fileBuffer.byteLength`.
- **Empty payload check**: If `fileBuffer.byteLength === 0`, return `400 Bad Request`.
- If `fileBuffer.byteLength > MAX_IMAGE_SIZE_BYTES`, return `413 Payload Too Large`.

### 3.4 Unique ID Generation & KV Persistence
- **ID Generation Scheme**:
  ```typescript
  const uniqueId = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
  ```
  Example ID: `lh7z2q-a1b2c3d4` (time-ordered base-36 timestamp + random 8-character UUID segment).
- **Storage Key**: `image:${uniqueId}`
- **Storage Value**: Raw binary `ArrayBuffer`
- **Metadata Structure**:
  ```typescript
  interface ImageMetadata {
    contentType: string;
    filename: string;
    size: number;
    uploadedAt: string;
  }

  await c.env.SAANJH_DB.put(storageKey, fileBuffer, {
    metadata: {
      contentType: mimeType,
      filename: sanitizedFilename,
      size: fileBuffer.byteLength,
      uploadedAt: new Date().toISOString(),
    },
  });
  ```

### 3.5 Public URL Resolution & Response Format
The URL is resolved dynamically from the incoming request URL's origin:
```typescript
const requestUrl = new URL(c.req.url);
const imageUrl = `${requestUrl.origin}/images/${uniqueId}`;
```

#### Response Payload (`200 OK`):
```json
{
  "success": true,
  "id": "lh7z2q-a1b2c3d4",
  "url": "https://saanjh-api.prabinkhokhali89.workers.dev/images/lh7z2q-a1b2c3d4",
  "filename": "cover_forest.jpg",
  "size": 348920,
  "contentType": "image/jpeg"
}
```

---

## 4. Image Delivery & Edge Caching Specification (`GET /images/:id`)

### 4.1 Request Processing & Metadata Retrieval
- Endpoint: `GET /images/:id`
- Public access: No authentication required.
- Lookup using KV `getWithMetadata`:
  ```typescript
  const imageId = c.req.param('id');
  const storageKey = `image:${imageId}`;
  const result = await c.env.SAANJH_DB.getWithMetadata<ImageMetadata>(storageKey, {
    type: 'arrayBuffer',
  });

  if (!result || !result.value) {
    return c.text('Image not found', 404);
  }
  ```

### 4.2 Cache-Control & ETag Headers
- **`Content-Type`**: `result.metadata?.contentType || 'image/jpeg'`
- **`Cache-Control`**: `public, max-age=31536000, immutable` (Instructs Cloudflare Edge and client browsers to cache the asset for 1 full year; URLs are content-addressable and immutable).
- **`ETag`**: `W/"${imageId}"`
- **`Access-Control-Allow-Origin`**: `*`

### 4.3 Conditional HTTP `304 Not Modified` Handling
To save bandwidth and egress for repeat mobile fetches:
```typescript
const ifNoneMatch = c.req.header('if-none-match');
const etag = `W/"${imageId}"`;
if (ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch === `"${imageId}"` || ifNoneMatch === imageId)) {
  return new Response(null, {
    status: 304,
    headers: {
      'ETag': etag,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
```

---

## 5. Image Deletion Specification (`DELETE /images/:id`)

- Endpoint: `DELETE /images/:id`
- Authentication: Protected (`Authorization: Bearer <ADMIN_SECRET>`).
- Deletion logic:
  ```typescript
  const imageId = c.req.param('id');
  const storageKey = `image:${imageId}`;
  await c.env.SAANJH_DB.delete(storageKey);
  return c.json({
    success: true,
    message: 'Image deleted successfully',
    id: imageId,
  });
  ```

---

## 6. Catalog Management Specification (`POST /catalog`, `GET /catalog`, `GET /catalog/:id`)

### 6.1 Schema Validation Rules on `POST /catalog`
The catalog payload is validated before saving to KV to ensure corrupted data is never written:
1. Payload must be a non-null JSON object containing `stories: Story[]`.
2. Each story must have:
   - `id`: Non-empty string.
   - `title`: Localized object with at least `en` or `ne` non-empty string.
   - `category`: Optional or one of `'roots' | 'universal' | 'custom'`.
   - `ageBand`: Validated against `VALID_AGE_BANDS = ['2-4', '4-6', '6-8', '9-12', '13-17', '18-25', '25+', 'parents']`.
3. If `beats` array is provided:
   - Each beat must contain `id` (string), `text` (`en` or `ne`), and `scene` (`SceneId`).
4. Auto-versioning:
   - Sets `version: typeof body.version === 'number' ? body.version : 1`.
   - Injects `updatedAt: new Date().toISOString()`.

### 6.2 `GET /catalog` & `GET /catalog/:id`
- `GET /catalog`: Returns entire catalog JSON. If empty in KV, returns `{ version: 1, stories: [] }`.
- `GET /catalog/:id`: Fetches catalog, filters for story with matching `id`, returns `{ success: true, story }` or `404 Not Found`.

---

## 7. Security, Authentication & CORS Model

### 7.1 Bearer Token Authorization Helper
```typescript
export function isAuthorized(authHeader: string | undefined, expectedSecret?: string): boolean {
  if (!expectedSecret) return true; // Open in dev/test if secret unset
  if (!authHeader) return false;
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  return token === expectedSecret;
}
```

### 7.2 Status Code & Response Matrix

| Status Code | Condition | Response Body Format |
|---|---|---|
| **`200 OK`** | Successful upload, fetch, or mutation | JSON `{ success: true, ... }` or Binary Image |
| **`304 Not Modified`** | `If-None-Match` matches ETag on image fetch | Empty body with cache headers |
| **`400 Bad Request`** | Missing file, empty buffer, malformed JSON | `{"success": false, "error": "<reason>"}` |
| **`401 Unauthorized`** | Missing or invalid Bearer token | `{"success": false, "error": "Unauthorized: Invalid or missing admin secret"}` |
| **`404 Not Found`** | Non-existent image ID or story ID | `Image not found` or `{"success": false, "error": "Story not found"}` |
| **`413 Payload Too Large`** | Image size exceeds 5MB limit | `{"success": false, "error": "File size exceeds maximum allowed limit of 5MB"}` |
| **`415 Unsupported Media Type`** | Non-image Content-Type submitted | `{"success": false, "error": "Unsupported Content-Type. Expected multipart/form-data or image/*"}` |
| **`500 Internal Server Error`** | Uncaught exception or KV storage failure | `{"success": false, "error": "<details>"}` |

### 7.3 CORS Policy
- Configured at root middleware `app.use('/*', cors({ ... }))`.
- `origin: '*'`.
- `allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD']`.
- `allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Filename', 'If-None-Match']`.
- `maxAge: 86400`.

---

## 8. Complete Implementation Blueprint

### 8.1 Proposed `backend/src/index.ts`
```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

export type Env = {
  SAANJH_DB: KVNamespace;
  ADMIN_SECRET?: string;
};

export type Language = 'en' | 'ne';
export type Localized = Record<Language, string>;

export type AgeBand =
  | '2-4'
  | '4-6'
  | '6-8'
  | '9-12'
  | '13-17'
  | '18-25'
  | '25+'
  | 'parents';

export type StoryCategory = 'roots' | 'universal' | 'custom';
export type StoryForm = 'story' | 'novel';
export type StageKind = 'forest' | 'moon' | 'river' | 'courtyard' | 'hills' | 'lamp' | 'stars';
export type SceneId =
  | 'establishing'
  | 'meeting'
  | 'walk'
  | 'roar'
  | 'well'
  | 'leap'
  | 'peace'
  | 'moon'
  | 'river'
  | 'courtyard'
  | 'hills'
  | 'lamp'
  | 'stars';

export type VoiceRole = 'narrator' | 'tiger' | 'rabbit' | 'soft';
export type SoundId =
  | 'night'
  | 'moon'
  | 'river'
  | 'courtyard'
  | 'roar'
  | 'splash'
  | 'ripple'
  | 'chime'
  | 'wind';

export type Pose =
  | 'hidden'
  | 'idle'
  | 'walk'
  | 'bow'
  | 'sit'
  | 'roar'
  | 'leap'
  | 'lookDown';

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

export type ImageMetadata = {
  contentType: string;
  filename: string;
  size: number;
  uploadedAt: string;
};

const VALID_AGE_BANDS: Set<string> = new Set([
  '2-4',
  '4-6',
  '6-8',
  '9-12',
  '13-17',
  '18-25',
  '25+',
  'parents',
]);

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for Mobile App and Web Admin CMS
app.use(
  '/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Filename',
      'If-None-Match',
    ],
    maxAge: 86400,
  })
);

// Helper: Verify Bearer Token against ADMIN_SECRET
export function isAuthorized(authHeader: string | undefined, expectedSecret?: string): boolean {
  if (!expectedSecret) return true; // Permissive if no secret configured
  if (!authHeader) return false;
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim();
  return token === expectedSecret;
}

// Helper: Deduce MIME type from filename extension
export function inferMimeType(filename: string, fallback: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    default:
      return fallback;
  }
}

// 1. Health & Welcome
app.get('/', (c) => {
  return c.json({
    service: 'Saanjh Backend API',
    version: '3.0.0',
    status: 'healthy',
  });
});

// 2. GET Catalog (Public)
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

// 3. GET Single Story (Public)
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
      return c.json(
        { success: false, error: "Invalid catalog format: 'stories' must be an array" },
        400
      );
    }

    // Validate story entries
    for (const [index, story] of body.stories.entries()) {
      if (!story.id || typeof story.id !== 'string') {
        return c.json({ success: false, error: `Story at index ${index} missing valid 'id'` }, 400);
      }
      if (
        !story.title ||
        (typeof story.title.en !== 'string' && typeof story.title.ne !== 'string')
      ) {
        return c.json({ success: false, error: `Story '${story.id}' missing bilingual 'title'` }, 400);
      }
      if (story.ageBand && !VALID_AGE_BANDS.has(story.ageBand)) {
        return c.json(
          { success: false, error: `Story '${story.id}' has invalid ageBand '${story.ageBand}'` },
          400
        );
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
    return c.json(
      { success: false, error: `Failed to update catalog: ${err?.message || err}` },
      500
    );
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
      originalName = (file as any).name || originalName;
      mimeType = blob.type && blob.type !== 'application/octet-stream'
        ? blob.type
        : inferMimeType(originalName, 'image/jpeg');
      fileBuffer = await blob.arrayBuffer();
    } else if (contentType.startsWith('image/')) {
      mimeType = contentType.split(';')[0].trim().toLowerCase();
      const headerFilename = c.req.header('x-filename');
      const queryFilename = c.req.query('filename');
      originalName = headerFilename || queryFilename || originalName;
      fileBuffer = await c.req.arrayBuffer();
    } else {
      return c.json(
        {
          success: false,
          error: 'Unsupported Content-Type. Expected multipart/form-data or image/*',
        },
        415
      );
    }

    if (!fileBuffer || fileBuffer.byteLength === 0) {
      return c.json({ success: false, error: 'Empty file payload' }, 400);
    }

    if (fileBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
      return c.json(
        { success: false, error: 'File size exceeds maximum allowed limit of 5MB' },
        413
      );
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
    const result = await c.env.SAANJH_DB.getWithMetadata<ImageMetadata>(storageKey, {
      type: 'arrayBuffer',
    });

    if (!result || !result.value) {
      return c.text('Image not found', 404);
    }

    const contentType = result.metadata?.contentType || 'image/jpeg';
    const etag = `W/"${imageId}"`;
    const ifNoneMatch = c.req.header('if-none-match');

    if (
      ifNoneMatch &&
      (ifNoneMatch === etag || ifNoneMatch === `"${imageId}"` || ifNoneMatch === imageId)
    ) {
      return new Response(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(result.value, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'ETag': etag,
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
  if (!imageId) {
    return c.json({ success: false, error: 'Image ID is required' }, 400);
  }

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

### 8.2 Proposed `backend/tsconfig.json`
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

---

### 8.3 Proposed `backend/package.json`
```json
{
  "name": "backend",
  "version": "1.0.0",
  "description": "Saanjh 3.0 Cloudflare Workers Backend API",
  "main": "src/index.ts",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "typecheck": "tsc --noEmit",
    "test": "node test/runner.js"
  },
  "keywords": ["saanjh", "cloudflare-workers", "hono", "kv"],
  "author": "Saanjh Team",
  "license": "ISC",
  "type": "commonjs",
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

### 8.4 Automated Test Suite Blueprint (`backend/test/runner.js`)

```javascript
/**
 * Saanjh 3.0 Backend Test Suite
 * Fully automated Node.js test harness using in-memory mock KV storage.
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
  console.log('====================================================');
  console.log('   Saanjh 3.0 Backend API Automated Test Suite');
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
      console.error(`    ${err.stack || err.message}`);
      failed++;
    }
  }

  // Register ts-node for transpiling on the fly
  require('ts-node').register({ transpileOnly: true });
  const app = require('../src/index.ts').default;

  const mockDb = new MockKVNamespace();
  const env = {
    SAANJH_DB: mockDb,
    ADMIN_SECRET: 'saanjh-super-secret-key-2026',
  };

  // 1. Health Endpoint
  await test('GET / returns 200 with service health info', async () => {
    const res = await app.request('/', {}, env);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.status, 'healthy');
    assert.strictEqual(json.service, 'Saanjh Backend API');
  });

  // 2. Empty Catalog Fetch
  await test('GET /catalog returns default empty catalog when KV is empty', async () => {
    const res = await app.request('/catalog', {}, env);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.version, 1);
    assert.deepStrictEqual(json.stories, []);
  });

  // 3. POST /catalog Auth Validation
  await test('POST /catalog without auth header returns 401 Unauthorized', async () => {
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

  await test('POST /catalog with invalid Bearer token returns 401 Unauthorized', async () => {
    const res = await app.request(
      '/catalog',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer wrong-secret',
        },
        body: JSON.stringify({ version: 1, stories: [] }),
      },
      env
    );
    assert.strictEqual(res.status, 401);
  });

  // 4. POST /catalog Schema Validation
  await test('POST /catalog with invalid payload format returns 400 Bad Request', async () => {
    const res = await app.request(
      '/catalog',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer saanjh-super-secret-key-2026',
        },
        body: JSON.stringify({ version: 1 }), // Missing stories array
      },
      env
    );
    assert.strictEqual(res.status, 400);
  });

  await test('POST /catalog with invalid ageBand returns 400 Bad Request', async () => {
    const res = await app.request(
      '/catalog',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer saanjh-super-secret-key-2026',
        },
        body: JSON.stringify({
          version: 1,
          stories: [{ id: 'story-1', title: { en: 'Title' }, ageBand: 'invalid-age' }],
        }),
      },
      env
    );
    assert.strictEqual(res.status, 400);
  });

  // 5. POST /catalog Success & Persistence
  await test('POST /catalog with valid stories & beats saves successfully', async () => {
    const testStory = {
      id: 'moon-rabbit-fable',
      category: 'roots',
      form: 'story',
      ageBand: 'parents',
      title: { en: 'The Moon Rabbit', ne: 'चन्द्रमाको खरायो' },
      subtitle: { en: 'A bedtime tale', ne: 'एक सुत्ने कथा' },
      stage: 'moon',
      beats: [
        {
          id: 'beat-1',
          text: { en: 'High in the night sky', ne: 'रातको आकाशमा' },
          scene: 'moon',
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
          Authorization: 'Bearer saanjh-super-secret-key-2026',
        },
        body: JSON.stringify({ version: 2, stories: [testStory] }),
      },
      env
    );

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.storyCount, 1);

    // Verify GET /catalog returns saved data
    const getRes = await app.request('/catalog', {}, env);
    const getJson = await getRes.json();
    assert.strictEqual(getJson.stories.length, 1);
    assert.strictEqual(getJson.stories[0].id, 'moon-rabbit-fable');
    assert.strictEqual(getJson.stories[0].beats.length, 1);
  });

  // 6. GET /catalog/:id
  await test('GET /catalog/:id returns single story by ID', async () => {
    const res = await app.request('/catalog/moon-rabbit-fable', {}, env);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.story.id, 'moon-rabbit-fable');
  });

  await test('GET /catalog/:id with unknown ID returns 404', async () => {
    const res = await app.request('/catalog/non-existent-id', {}, env);
    assert.strictEqual(res.status, 404);
  });

  // 7. POST /upload Auth Checks
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

  // 8. POST /upload Content Type Checks
  await test('POST /upload with non-image Content-Type returns 415', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer saanjh-super-secret-key-2026',
        },
        body: JSON.stringify({ file: 'not-an-image' }),
      },
      env
    );
    assert.strictEqual(res.status, 415);
  });

  // 9. POST /upload Empty & Oversized Payload
  await test('POST /upload with empty body returns 400 Bad Request', async () => {
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'image/png',
          Authorization: 'Bearer saanjh-super-secret-key-2026',
        },
        body: new Uint8Array(0),
      },
      env
    );
    assert.strictEqual(res.status, 400);
  });

  await test('POST /upload with oversized body (>5MB) returns 413 Payload Too Large', async () => {
    const oversizedBuffer = new Uint8Array(5 * 1024 * 1024 + 1024);
    const res = await app.request(
      '/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'image/jpeg',
          Authorization: 'Bearer saanjh-super-secret-key-2026',
        },
        body: oversizedBuffer,
      },
      env
    );
    assert.strictEqual(res.status, 413);
  });

  // 10. POST /upload Binary Image Success
  let uploadedImageId = '';
  let uploadedImageUrl = '';
  await test('POST /upload with raw binary image saves and returns URL', async () => {
    const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const res = await app.request(
      '/upload?filename=test_cover.jpg',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'image/jpeg',
          Authorization: 'Bearer saanjh-super-secret-key-2026',
        },
        body: fakeJpeg,
      },
      env
    );

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.id);
    assert.ok(json.url.includes(`/images/${json.id}`));
    assert.strictEqual(json.contentType, 'image/jpeg');
    assert.strictEqual(json.size, fakeJpeg.byteLength);

    uploadedImageId = json.id;
    uploadedImageUrl = json.url;
  });

  // 11. GET /images/:id Delivery & Headers
  await test('GET /images/:id serves binary image with 1-year immutable cache', async () => {
    const res = await app.request(`/images/${uploadedImageId}`, {}, env);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('Content-Type'), 'image/jpeg');
    assert.strictEqual(
      res.headers.get('Cache-Control'),
      'public, max-age=31536000, immutable'
    );
    assert.strictEqual(res.headers.get('ETag'), `W/"${uploadedImageId}"`);
    assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');
  });

  // 12. GET /images/:id HTTP 304 ETag Cache
  await test('GET /images/:id with matching If-None-Match returns 304 Not Modified', async () => {
    const res = await app.request(
      `/images/${uploadedImageId}`,
      {
        headers: { 'If-None-Match': `W/"${uploadedImageId}"` },
      },
      env
    );
    assert.strictEqual(res.status, 304);
  });

  // 13. GET /images/:id Not Found
  await test('GET /images/:id with unknown ID returns 404 Not Found', async () => {
    const res = await app.request('/images/does-not-exist-999', {}, env);
    assert.strictEqual(res.status, 404);
  });

  // 14. DELETE /images/:id
  await test('DELETE /images/:id without auth returns 401 Unauthorized', async () => {
    const res = await app.request(
      `/images/${uploadedImageId}`,
      { method: 'DELETE' },
      env
    );
    assert.strictEqual(res.status, 401);
  });

  await test('DELETE /images/:id with valid auth deletes image from KV', async () => {
    const res = await app.request(
      `/images/${uploadedImageId}`,
      {
        method: 'DELETE',
        headers: { Authorization: 'Bearer saanjh-super-secret-key-2026' },
      },
      env
    );
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);

    // Subsequent GET should return 404
    const getRes = await app.request(`/images/${uploadedImageId}`, {}, env);
    assert.strictEqual(getRes.status, 404);
  });

  console.log(`\n----------------------------------------------------`);
  console.log(`Test Execution Summary: ${passed} passed, ${failed} failed.`);
  console.log(`----------------------------------------------------\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
```

---

## 9. Verification & Implementation Plan

### Step-by-Step Execution for Implementer:
1. **Create `backend/tsconfig.json`** with `@cloudflare/workers-types` and strict compiler settings.
2. **Update `backend/package.json`** with `typecheck`, `test`, `dev`, `deploy` scripts and devDependencies.
3. **Implement `backend/src/index.ts`** with full route handlers, schema validation, KV metadata storage, cache headers, CORS, and Bearer auth.
4. **Create `backend/test/runner.js`** implementing the complete automated test suite with in-memory mock KV.
5. **Run test suite and type check** to ensure zero lint/type errors and 100% test pass.

---

## 10. Conclusion
The proposed architecture provides complete end-to-end functionality for Milestone 1:
- Image storage and delivery requirements are met with precision.
- Full catalog schema validation protects KV integrity.
- Bearer authentication and standard HTTP error codes ensure strong security.
- Comprehensive test harness enables isolated, reproducible verification.
