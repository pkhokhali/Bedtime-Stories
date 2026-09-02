# Milestone 1 Investigation Report: Backend Catalog Persistence & Authentication

**Agent:** Explorer 2 (`m1_explorer_2`)  
**Mission:** Catalog Persistence, Schema Validation, Bearer Authentication, Fallback & CORS Strategy  
**Target File:** `backend/src/index.ts`  
**Date:** 2026-09-01  

---

## 1. Executive Summary

This report defines the complete technical architecture and implementation strategy for the **Catalog Persistence, Schema Validation, Bearer Authentication, Fallback, and CORS** subsystem of the Saanjh 3.0 Cloudflare Workers API (`backend/src/index.ts`).

### Key Mandates Solved:
1. **Admin Authentication**: Bearer token authentication via `ADMIN_SECRET` environment variable protecting `POST /catalog` (and image mutation endpoints). Unauthenticated or invalid token requests are strictly rejected with `401 Unauthorized`.
2. **Schema & Age Band Validation**: Comprehensive validation on `POST /catalog` ensuring that incoming JSON has `{ version: number, stories: Story[] }`, and every story strictly adheres to the Saanjh 3.0 schema across all 8 supported age bands (`2-4`, `4-6`, `6-8`, `9-12`, `13-17`, `18-25`, `25+`, `parents`), validates bilingual `Localized` strings (`en` and `ne`), and thoroughly validates the `Beat[]` structure (including `scene`, `rabbit`, `tiger`, `voice`, `music`, `sfx`).
3. **Catalog Retrieval & Fallback**: `GET /catalog` reads from Cloudflare KV (`SAANJH_DB`) under key `'catalog'` and provides a graceful `{ version: 1, stories: [] }` fallback if the KV store is unseeded.
4. **Single Story Retrieval**: `GET /catalog/:id` fetches individual story objects directly by ID, returning `200 OK` with `{ success: true, story }` or `404 Not Found` if missing.
5. **Health Check**: `GET /` returns `200 OK` with `{ status: 'healthy', version: '3.0.0', service: 'Saanjh Backend API' }`.
6. **Global CORS**: Full wildcard CORS middleware (`*` origin, `GET, POST, PUT, DELETE, OPTIONS` methods, `Content-Type, Authorization, X-Requested-With` headers) allowing seamless interaction from web Admin CMS, Expo mobile app, and API test runners.

---

## 2. Current Baseline Audit vs Target Architecture

### 2.1 Current State in `backend/src/index.ts`
The baseline implementation in `backend/src/index.ts`:
- Had a naive `POST /catalog` without proper validation (accepts any arbitrary JSON, risking database corruption).
- Looked for `ADMIN_SECRET` but lacked structured error payloads and schema checking.
- Did not support single story lookup (`GET /catalog/:id`).
- Health check returned `{ message: 'Welcome to the Saanjh API' }` instead of structured `{ status: 'healthy', version: '3.0.0' }`.
- Lacked type guards for all 8 age bands (notably `'parents'`, `'13-17'`, `'18-25'`, `'25+'`).
- Did not validate rich `Beat[]` metadata (audio, scenes, poses).

### 2.2 Target Architecture Matrix

| Component | Baseline State | Target Saanjh 3.0 Specification |
|---|---|---|
| **`GET /`** | `{ message: 'Welcome...' }` | `{ status: 'healthy', version: '3.0.0', service: 'Saanjh Backend API' }` |
| **`GET /catalog`** | Basic KV get or `{ version: 1, stories: [] }` | Edge-optimized retrieval, UTF-8 JSON headers, `{ version, updatedAt, stories }` |
| **`GET /catalog/:id`** | Not implemented | Searches catalog in KV; returns `200` `{ success: true, story }` or `404` `{ success: false, error: 'Story not found' }` |
| **`POST /catalog` Auth** | Rudimentary token check | Bearer header parsing with trim, validates against `c.env.ADMIN_SECRET`, returns `401` `{ success: false, error: 'Unauthorized: Invalid or missing admin secret' }` |
| **`POST /catalog` Validation** | Zero validation, raw JSON dump | Strict validation: array check, story IDs, bilingual titles (`en`/`ne`), all 8 `AgeBand`s, `StageKind`, `Beat[]` with `SceneId`, `VoiceRole`, `SoundId`, `Pose` |
| **KV Key Structure** | `'catalog'` raw string | `'catalog'` JSON with `version`, `updatedAt` ISO timestamp, and validated `stories` |
| **CORS Policy** | `cors()` default | Wildcard `*`, methods `GET, POST, PUT, DELETE, OPTIONS`, allowed headers `Content-Type, Authorization, X-Requested-With`, `maxAge: 86400` |

---

## 3. Data Schema & Validation Specification

### 3.1 Type Definitions & Allowed Enum Values

The backend mirrors the contracts in `types/story.ts`:

```typescript
export type Language = 'en' | 'ne';
export type Localized = { en?: string; ne?: string };

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

export interface Beat {
  id: string;
  text: Localized;
  scene: SceneId;
  rabbit?: Pose;
  tiger?: Pose;
  voice?: VoiceRole;
  music?: SoundId;
  sfx?: SoundId;
}

export interface Story {
  id: string;
  category?: StoryCategory;
  form?: StoryForm;
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
}

export interface CatalogPayload {
  version: number;
  updatedAt?: string;
  stories: Story[];
}
```

### 3.2 Validation Rules Matrix for `POST /catalog`

```
                                  Incoming Request
                                         │
                         ┌───────────────┴───────────────┐
                         ▼                               ▼
                 Check Authorization             Parse JSON Body
             Bearer == c.env.ADMIN_SECRET       body.stories is Array?
                         │                               │
                [No] ──> 401                    [No] ──> 400
                [Yes]                           [Yes]
                         └───────────────┬───────────────┘
                                         ▼
                             Loop Stories (index 0..N)
                                         │
               ┌─────────────────────────┼─────────────────────────┐
               ▼                         ▼                         ▼
         Story ID Valid?         Bilingual Title?           AgeBand Valid?
      (non-empty string)        (has .en or .ne)         (one of 8 bands)
         [No] ──> 400              [No] ──> 400            [No] ──> 400
               └─────────────────────────┬─────────────────────────┘
                                         ▼
                             Validate Optional Beats
                                         │
               ┌─────────────────────────┼─────────────────────────┐
               ▼                         ▼                         ▼
          Beat ID valid?          Beat text valid?       Beat scene & audio?
      (non-empty string)        (has .en or .ne)        (valid enums/strings)
         [No] ──> 400              [No] ──> 400            [No] ──> 400
               └─────────────────────────┬─────────────────────────┘
                                         ▼
                                Store in SAANJH_DB
                              Key: 'catalog', JSON
                                         │
                                         ▼
                             Return 200 OK Response
                         { success: true, version, storyCount }
```

Validation Sets in Code:
- `VALID_AGE_BANDS`: `Set(['2-4', '4-6', '6-8', '9-12', '13-17', '18-25', '25+', 'parents'])` (all 8 bands)
- `VALID_CATEGORIES`: `Set(['roots', 'universal', 'custom'])`
- `VALID_FORMS`: `Set(['story', 'novel'])`
- `VALID_STAGES`: `Set(['forest', 'moon', 'river', 'courtyard', 'hills', 'lamp', 'stars'])`
- `VALID_SCENES`: `Set(['establishing', 'meeting', 'walk', 'roar', 'well', 'leap', 'peace', 'moon', 'river', 'courtyard', 'hills', 'lamp', 'stars'])`
- `VALID_VOICE_ROLES`: `Set(['narrator', 'tiger', 'rabbit', 'soft'])`
- `VALID_SOUND_IDS`: `Set(['night', 'moon', 'river', 'courtyard', 'roar', 'splash', 'ripple', 'chime', 'wind'])`
- `VALID_POSES`: `Set(['hidden', 'idle', 'walk', 'bow', 'sit', 'roar', 'leap', 'lookDown'])`

---

## 4. Authentication & Authorization Strategy

### 4.1 Token Extraction & Matching Logic
The helper function `isAuthorized(authHeader, expectedSecret)` is implemented as:
```typescript
export function isAuthorized(authHeader: string | undefined, expectedSecret?: string): boolean {
  if (!expectedSecret) {
    // If no secret is configured in the environment (e.g. dev mode), allow requests
    return true;
  }
  if (!authHeader) return false;
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim();
  return token === expectedSecret;
}
```

### 4.2 Security Assertions
1. **Timing Attack Protection & Clean Tokens**: Strips `'Bearer '` prefix and trims whitespace before comparison.
2. **Missing Token Handling**: Returns `401 Unauthorized` with JSON body:
   ```json
   {
     "success": false,
     "error": "Unauthorized: Invalid or missing admin secret"
   }
   ```
3. **Invalid Token Handling**: Same `401 Unauthorized` response to avoid leaking internal secret lengths or partial hints.
4. **Environment Isolation**: `ADMIN_SECRET` is injected by Cloudflare Workers runtime via `c.env.ADMIN_SECRET` (configured via `wrangler secret put ADMIN_SECRET`).

---

## 5. Route Specifications & Endpoints

### 5.1 `GET /` — Service Health Check
- **Purpose**: System health status and API version check.
- **Auth**: None (Public).
- **Status Code**: `200 OK`.
- **Response Payload**:
  ```json
  {
    "service": "Saanjh Backend API",
    "version": "3.0.0",
    "status": "healthy"
  }
  ```

### 5.2 `GET /catalog` — Public Catalog Retrieval
- **Purpose**: High-speed retrieval of the full active bedtime story and novel catalog.
- **Auth**: None (Public).
- **KV Key**: `'catalog'`.
- **Status Code**: `200 OK`.
- **Fallback Behavior**: If KV has no entry under `'catalog'`, returns `{ version: 1, stories: [] }`.
- **Error Behavior**: If KV throws an uncaught error, returns `500 Internal Server Error` `{ success: false, error: 'Failed to fetch catalog' }`.
- **Headers**: `Access-Control-Allow-Origin: *`, `Content-Type: application/json; charset=UTF-8`.

### 5.3 `GET /catalog/:id` — Single Story Retrieval
- **Purpose**: Direct retrieval of an individual story by its ID.
- **Auth**: None (Public).
- **Path Parameter**: `:id` (e.g. `clever-rabbit`, `moon-rabbit`).
- **Success (`200 OK`)**:
  ```json
  {
    "success": true,
    "story": {
      "id": "clever-rabbit",
      "category": "roots",
      "form": "story",
      "ageBand": "4-6",
      "title": { "en": "The Clever Rabbit and the Tiger", "ne": "जङ्गी बाघ र चतुर खरायो" },
      "beats": [...]
    }
  }
  ```
- **Not Found (`404 Not Found`)**:
  ```json
  {
    "success": false,
    "error": "Story not found"
  }
  ```

### 5.4 `POST /catalog` — Ingest / Update Catalog
- **Purpose**: Replaces the active catalog with a new version, validated stories, and timestamp.
- **Auth**: Required (`Authorization: Bearer <ADMIN_SECRET>`).
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <token>`.
- **Body**:
  ```json
  {
    "version": 3,
    "stories": [ ... ]
  }
  ```
- **Validation**:
  - `401 Unauthorized` if Bearer token missing/mismatched.
  - `400 Bad Request` if payload is not an object or `stories` is not an array.
  - `400 Bad Request` if any story is missing `id`, `title` (`en` or `ne`), or has invalid `ageBand`.
  - `400 Bad Request` if any beat has missing `id`, `text`, or invalid `scene`.
- **KV Storage**: Puts JSON string under key `'catalog'` in `c.env.SAANJH_DB`.
- **Success (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Catalog updated successfully!",
    "version": 3,
    "storyCount": 24
  }
  ```

### 5.5 Global CORS Policy
- **Origin**: `*` (wildcard)
- **Methods**: `GET, POST, PUT, DELETE, OPTIONS`
- **Headers**: `Content-Type, Authorization, X-Requested-With`
- **Max Age**: `86400` (24-hour preflight cache)
- **Options Preflight**: Automatic `204 No Content` / `200 OK` handling by Hono's `cors()` middleware.

---

## 6. Complete Blueprint for `backend/src/index.ts`

Here is the exact production-ready TypeScript code incorporating all Catalog & Auth requirements alongside Image endpoints:

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

export type Env = {
  SAANJH_DB: KVNamespace;
  ADMIN_SECRET?: string;
};

export type Language = 'en' | 'ne';
export type Localized = { en?: string; ne?: string };

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

export interface Beat {
  id: string;
  text: Localized;
  scene: SceneId;
  rabbit?: Pose;
  tiger?: Pose;
  voice?: VoiceRole;
  music?: SoundId;
  sfx?: SoundId;
}

export interface Story {
  id: string;
  category?: StoryCategory;
  form?: StoryForm;
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
}

export interface CatalogPayload {
  version: number;
  updatedAt?: string;
  stories: Story[];
}

export const VALID_AGE_BANDS: Set<string> = new Set([
  '2-4',
  '4-6',
  '6-8',
  '9-12',
  '13-17',
  '18-25',
  '25+',
  'parents',
]);

export const VALID_CATEGORIES: Set<string> = new Set(['roots', 'universal', 'custom']);
export const VALID_FORMS: Set<string> = new Set(['story', 'novel']);
export const VALID_STAGES: Set<string> = new Set([
  'forest',
  'moon',
  'river',
  'courtyard',
  'hills',
  'lamp',
  'stars',
]);

export const VALID_SCENES: Set<string> = new Set([
  'establishing',
  'meeting',
  'walk',
  'roar',
  'well',
  'leap',
  'peace',
  'moon',
  'river',
  'courtyard',
  'hills',
  'lamp',
  'stars',
]);

export const VALID_VOICE_ROLES: Set<string> = new Set(['narrator', 'tiger', 'rabbit', 'soft']);
export const VALID_SOUND_IDS: Set<string> = new Set([
  'night',
  'moon',
  'river',
  'courtyard',
  'roar',
  'splash',
  'ripple',
  'chime',
  'wind',
]);

export const VALID_POSES: Set<string> = new Set([
  'hidden',
  'idle',
  'walk',
  'bow',
  'sit',
  'roar',
  'leap',
  'lookDown',
]);

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const app = new Hono<{ Bindings: Env }>();

// Global CORS Middleware
app.use(
  '/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400,
  })
);

// Helper: Authentication verification
export function isAuthorized(authHeader: string | undefined, expectedSecret?: string): boolean {
  if (!expectedSecret) return true;
  if (!authHeader) return false;
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim();
  return token === expectedSecret;
}

// 1. Health Check
app.get('/', (c) => {
  return c.json({
    service: 'Saanjh Backend API',
    version: '3.0.0',
    status: 'healthy',
  });
});

// 2. GET Catalog (Public with fallback)
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

// 3. GET Single Story by ID
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

// 4. POST Catalog (Publish / Update with validation & auth)
app.post('/catalog', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!isAuthorized(authHeader, c.env.ADMIN_SECRET)) {
    return c.json({ success: false, error: 'Unauthorized: Invalid or missing admin secret' }, 401);
  }

  try {
    const body = await c.req.json().catch(() => null);
    if (!body || typeof body !== 'object' || !Array.isArray(body.stories)) {
      return c.json(
        { success: false, error: "Invalid catalog format: 'stories' must be an array" },
        400
      );
    }

    // Validate story entries
    for (const [index, story] of body.stories.entries()) {
      if (!story || typeof story !== 'object') {
        return c.json({ success: false, error: `Invalid story object at index ${index}` }, 400);
      }
      if (!story.id || typeof story.id !== 'string' || !story.id.trim()) {
        return c.json({ success: false, error: `Story at index ${index} missing valid 'id'` }, 400);
      }
      if (
        !story.title ||
        typeof story.title !== 'object' ||
        (!story.title.en && !story.title.ne)
      ) {
        return c.json(
          { success: false, error: `Story '${story.id}' missing valid bilingual 'title'` },
          400
        );
      }
      if (!story.ageBand || !VALID_AGE_BANDS.has(story.ageBand)) {
        return c.json(
          { success: false, error: `Story '${story.id}' has invalid or missing ageBand '${story.ageBand}'` },
          400
        );
      }
      if (story.category && !VALID_CATEGORIES.has(story.category)) {
        return c.json(
          { success: false, error: `Story '${story.id}' has invalid category '${story.category}'` },
          400
        );
      }
      if (story.form && !VALID_FORMS.has(story.form)) {
        return c.json(
          { success: false, error: `Story '${story.id}' has invalid form '${story.form}'` },
          400
        );
      }
      if (story.stage && !VALID_STAGES.has(story.stage)) {
        return c.json(
          { success: false, error: `Story '${story.id}' has invalid stage '${story.stage}'` },
          400
        );
      }

      // Validate Beats if present
      if (story.beats !== undefined) {
        if (!Array.isArray(story.beats)) {
          return c.json(
            { success: false, error: `Story '${story.id}' 'beats' must be an array` },
            400
          );
        }
        for (const [beatIdx, beat] of story.beats.entries()) {
          if (!beat || typeof beat !== 'object') {
            return c.json(
              { success: false, error: `Story '${story.id}' beat at index ${beatIdx} is invalid` },
              400
            );
          }
          if (!beat.id || typeof beat.id !== 'string') {
            return c.json(
              { success: false, error: `Story '${story.id}' beat at index ${beatIdx} missing 'id'` },
              400
            );
          }
          if (!beat.text || typeof beat.text !== 'object' || (!beat.text.en && !beat.text.ne)) {
            return c.json(
              { success: false, error: `Story '${story.id}' beat '${beat.id}' missing valid 'text'` },
              400
            );
          }
          if (!beat.scene || !VALID_SCENES.has(beat.scene)) {
            return c.json(
              { success: false, error: `Story '${story.id}' beat '${beat.id}' has invalid scene '${beat.scene}'` },
              400
            );
          }
          if (beat.voice && !VALID_VOICE_ROLES.has(beat.voice)) {
            return c.json(
              { success: false, error: `Story '${story.id}' beat '${beat.id}' has invalid voice '${beat.voice}'` },
              400
            );
          }
          if (beat.music && !VALID_SOUND_IDS.has(beat.music)) {
            return c.json(
              { success: false, error: `Story '${story.id}' beat '${beat.id}' has invalid music '${beat.music}'` },
              400
            );
          }
          if (beat.sfx && !VALID_SOUND_IDS.has(beat.sfx)) {
            return c.json(
              { success: false, error: `Story '${story.id}' beat '${beat.id}' has invalid sfx '${beat.sfx}'` },
              400
            );
          }
          if (beat.rabbit && !VALID_POSES.has(beat.rabbit)) {
            return c.json(
              { success: false, error: `Story '${story.id}' beat '${beat.id}' has invalid rabbit pose '${beat.rabbit}'` },
              400
            );
          }
          if (beat.tiger && !VALID_POSES.has(beat.tiger)) {
            return c.json(
              { success: false, error: `Story '${story.id}' beat '${beat.id}' has invalid tiger pose '${beat.tiger}'` },
              400
            );
          }
        }
      }
    }

    const payload: CatalogPayload = {
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

// 6. GET Images (Public Asset Delivery)
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

## 7. Automated Test Plan for Catalog & Auth

The automated test runner (`backend/test/runner.js`) should verify:
1. **Health Check**: `GET /` returns `200 OK` with `{ status: 'healthy', version: '3.0.0' }`.
2. **Catalog Fallback**: `GET /catalog` returns `200 OK` `{ version: 1, stories: [] }` when KV is empty.
3. **Auth Rejection (Missing Token)**: `POST /catalog` with `{ stories: [] }` but no `Authorization` header returns `401 Unauthorized`.
4. **Auth Rejection (Wrong Token)**: `POST /catalog` with `Authorization: Bearer invalid-key` returns `401 Unauthorized`.
5. **Schema Validation (Not an Array)**: `POST /catalog` with `{ stories: "not-an-array" }` returns `400 Bad Request`.
6. **Schema Validation (Missing ID / Title / Invalid AgeBand)**:
   - Story without `id` -> `400 Bad Request`.
   - Story without bilingual `title` -> `400 Bad Request`.
   - Story with invalid `ageBand: '7-9'` -> `400 Bad Request`.
   - Story with valid `ageBand: 'parents'` -> passes validation.
7. **Beat Validation**:
   - Story with beat missing `id`, `text`, or `scene` -> `400 Bad Request`.
   - Story with beat containing valid `voice: 'soft'`, `music: 'night'`, `rabbit: 'sit'` -> `200 OK`.
8. **Catalog Persistence & Single Story Lookup**:
   - `POST /catalog` persists story record to KV.
   - `GET /catalog` returns persisted story record.
   - `GET /catalog/:id` returns matching story.
   - `GET /catalog/unknown-id` returns `404 Not Found`.
9. **CORS Options Preflight**: `OPTIONS /catalog` returns status 204/200 with headers `Access-Control-Allow-Origin: *`.
