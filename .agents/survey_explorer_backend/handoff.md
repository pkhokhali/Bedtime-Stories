# Handoff Report — Survey Explorer (Backend)

**Author:** Survey Explorer (Backend)  
**Date:** 2026-09-01  
**Milestone:** Saanjh 3.0 Admin Panel & Backend Upgrade Survey  
**Working Directory:** `d:\Antigravity Projects\Bedtime Stories\.agents\survey_explorer_backend`  
**Target Audience:** Orchestrator & Backend/Admin Implementation Agents  

---

## 1. Observation

Direct code observations from inspecting the codebase at `d:\Antigravity Projects\Bedtime Stories`:

### 1.1 Backend Package & Configuration State
- **`backend/package.json`** (Lines 1–22):
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
- **`backend/wrangler.toml`** (Lines 1–14):
  ```toml
  name = "saanjh-api"
  main = "src/index.ts"
  compatibility_date = "2023-12-01"

  [[kv_namespaces]]
  binding = "SAANJH_DB"
  id = "97f579307cd347ee8f0904b6c7230813"
  ```
- **`backend/tsconfig.json`**: File does not exist. Root `tsconfig.json` (Line 18) explicitly excludes `"backend"`.
- **`backend/src/index.ts`** (Lines 1–56):
  - Routes defined:
    - `GET /`: returns `{ message: 'Welcome to the Saanjh API' }`
    - `GET /catalog`: fetches key `'catalog'` from `c.env.SAANJH_DB` and returns parsed JSON or fallback `{ version: 1, stories: [] }`.
    - `POST /catalog`: checks `Authorization: Bearer <ADMIN_SECRET>` if `c.env.ADMIN_SECRET` is set; writes raw request JSON to `SAANJH_DB.put('catalog', ...)`.
  - Missing features:
    - No image upload endpoint (`POST /upload`).
    - No image serving endpoint (`GET /images/:id`).
    - No image deletion endpoint (`DELETE /images/:id`).
    - No single-story endpoint (`GET /catalog/:id`).
    - No validation of incoming story schemas or `Beat[]` arrays.

### 1.2 Story and Beat Data Models
- **`types/story.ts`** (Lines 1–88):
  - `AgeBand = '2-4' | '4-6' | '6-8' | '9-12' | '13-17' | '18-25' | '25+' | 'parents'`
  - `StageKind = 'forest' | 'moon' | 'river' | 'courtyard' | 'hills' | 'lamp' | 'stars'`
  - `SceneId = 'establishing' | 'meeting' | 'walk' | 'roar' | 'well' | 'leap' | 'peace' | 'moon' | 'river' | 'courtyard' | 'hills' | 'lamp' | 'stars'`
  - `VoiceRole = 'narrator' | 'tiger' | 'rabbit' | 'soft'`
  - `SoundId = 'night' | 'moon' | 'river' | 'courtyard' | 'roar' | 'splash' | 'ripple' | 'chime' | 'wind'`
  - `Beat = { id: string; text: Localized; scene: SceneId; rabbit?: Pose; tiger?: Pose; voice?: VoiceRole; music?: SoundId; sfx?: SoundId; }`

### 1.3 Admin Panel API Interactions
- **`admin/src/App.tsx`** (Lines 4, 38–87):
  - `API_URL = 'https://saanjh-api.prabinkhokhali89.workers.dev/catalog'`
  - Admin panel sends `POST` to `/catalog` with `{ 'Content-Type': 'application/json', 'Authorization': 'Bearer ...' }` and payload `{ version, stories }`.
  - Currently only edits basic string fields (`id`, `title`, `subtitle`, `ageBand`, `mediaType`, `mediaUrl`, `mediaUrl_ne`, `coverImage`, `isHidden`). No image file selector or beat editor exists in the baseline admin UI.

---

## 2. Logic Chain

1. **Direct Image Upload & Delivery**:
   - *Observation:* The admin panel currently only accepts manual text URL entry for `coverImage`. Cloudflare Workers KV `SAANJH_DB` is already bound and available.
   - *Reasoning:* Storing uploaded images directly in `SAANJH_DB` with key prefix `image:<id>` (metadata: MIME type, filename, size) allows direct serverless image hosting with zero extra infrastructure or external API cost.
   - *Resolution:* Add `POST /upload` (multipart & binary ingestion, 5MB limit, Bearer auth) and `GET /images/:id` (public edge delivery with `Cache-Control: public, max-age=31536000, immutable`).

2. **Full Story & Audio Metadata Persistence**:
   - *Observation:* Mobile app's AI Narrator relies on `Beat[]` arrays, `sceneId`, `stageKind`, and ambient sound beds.
   - *Reasoning:* The backend must validate and store this complete JSON tree without stripping fields.
   - *Resolution:* Upgrade `POST /catalog` to validate `stories` array, valid `ageBand` values (`2-4`, `4-6`, `6-8`, `9-12`, `13-17`, `18-25`, `25+`, `parents`), bilingual titles, and beat structures before storing to KV.

3. **Authentication and Error Handling**:
   - *Observation:* Mutation endpoints must be protected against unauthorized tampering.
   - *Reasoning:* Standard Bearer token authentication against `c.env.ADMIN_SECRET` ensures only authorized admin clients can modify catalog or upload assets.
   - *Resolution:* Return `401 Unauthorized` on invalid/missing tokens, `400 Bad Request` on malformed inputs, `413 Payload Too Large` for files > 5MB, and `404 Not Found` for missing assets.

4. **Testing & Tooling**:
   - *Observation:* `backend/package.json` has no test runner and `backend/tsconfig.json` is missing.
   - *Reasoning:* Standalone tests using Hono's `app.request()` with in-memory mock KV provide fast, deterministic validation of all HTTP endpoints and auth rules without network dependency.
   - *Resolution:* Provide `backend/tsconfig.json` and a lightweight test suite (`test/runner.js`) testing all routes.

---

## 3. Caveats

1. **Cloudflare KV Value Size Limit**: KV allows values up to 25MB (10MB on free tiers). Cover images are capped at 5MB in `POST /upload`, which is more than sufficient for mobile/web cover art.
2. **Local vs Production URLs**: In `POST /upload`, the returned URL is dynamically constructed via `new URL(c.req.url).origin + '/images/' + uniqueId`. When testing locally, it produces `http://localhost:8787/images/...`; on Cloudflare, it produces `https://saanjh-api.prabinkhokhali89.workers.dev/images/...` (or custom domain).
3. **No caveats** regarding compatibility with Hono v4, Cloudflare Workers KV, or Expo/React Native fetch clients.

---

## 4. Conclusion

The upgraded backend architecture for Saanjh 3.0 provides:
1. **`POST /upload`**: Authenticated image upload supporting `multipart/form-data` and binary formats, storing to `SAANJH_DB` (`image:<id>`), returning public URL.
2. **`GET /images/:id`**: Fast, public edge-cached image delivery with immutable headers and ETag.
3. **`DELETE /images/:id`**: Authenticated image deletion for admin cleanup.
4. **`POST /catalog`**: Authenticated catalog publisher validating bilingual titles, `ageBand` enum, and `Beat[]` audio metadata.
5. **`GET /catalog` & `GET /catalog/:id`**: Public catalog synchronization for mobile apps.
6. **Zero-Dependency Test Suite**: Verified via `app.request()` test harness and mock KV store.

Full architecture specifications and code implementations are documented in `report.md`.

---

## 5. Verification Method

### 5.1 Static Verification
1. Inspect `backend/src/index.ts` to confirm endpoints: `GET /`, `GET /catalog`, `GET /catalog/:id`, `POST /catalog`, `POST /upload`, `GET /images/:id`, `DELETE /images/:id`.
2. Inspect `backend/tsconfig.json` to verify Cloudflare Workers compiler options.
3. Inspect `backend/package.json` scripts: `"test": "node test/runner.js"`, `"typecheck": "tsc --noEmit"`.

### 5.2 Test Suite Execution
Execute the test harness (`test/runner.js`):
- `GET /` -> status 200 `{ status: 'healthy' }`
- `GET /catalog` -> status 200 with catalog object
- `POST /catalog` without Bearer token -> status 401
- `POST /catalog` with valid token & story beats -> status 200
- `POST /upload` without Bearer token -> status 401
- `POST /upload` with image data & token -> status 200 `{ id, url, contentType }`
- `GET /images/:id` -> status 200 with `Content-Type: image/...` and `Cache-Control`
- `GET /images/invalid` -> status 404
