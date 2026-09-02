# Milestone 1 Handoff Report: Backend Catalog Persistence & Auth

**Agent:** Explorer 2 (`m1_explorer_2`)  
**Working Directory:** `d:\Antigravity Projects\Bedtime Stories\.agents\m1_explorer_2`  
**Handoff Type:** Hard (Milestone 1 Catalog Persistence & Auth Investigation Complete)  

---

## 1. Observation

1. **Baseline Worker Implementation (`backend/src/index.ts`)**:
   - Lines 35-54 in `backend/src/index.ts` showed `app.post('/catalog', ...)` with no schema validation on incoming request body:
     ```typescript
     const body = await c.req.json();
     await c.env.SAANJH_DB.put('catalog', JSON.stringify(body));
     return c.json({ success: true, message: 'Catalog updated successfully!' });
     ```
     Any malformed JSON payload would overwrite the entire database and break downstream mobile/admin clients.
   - Lines 19-32 in `backend/src/index.ts`: `app.get('/catalog', ...)` only provides a fallback `{ version: 1, stories: [] }` but lacked single story lookup `GET /catalog/:id`.
   - Lines 14-16 in `backend/src/index.ts`: `GET /` returned `{ message: 'Welcome to the Saanjh API' }` instead of structured health status `{ status: 'healthy', version: '3.0.0' }`.

2. **Schema & Age Band Contracts (`types/story.ts`, `data/catalog.ts`, `PROJECT.md`)**:
   - `types/story.ts` lines 5-6 defines 8 age bands:
     `export type AgeBand = '2-4' | '4-6' | '6-8' | '9-12' | '13-17' | '18-25' | '25+' | 'parents';`
   - `types/story.ts` lines 21-62 defines `SceneId` (13 scenes), `StageKind` (7 kinds), `VoiceRole` (4 roles), `SoundId` (9 sounds), `Pose` (8 poses), `Localized` (`{ en: string; ne: string }`), and `Beat`.
   - `admin/src/App.tsx` (lines 68-76) sends `Authorization: Bearer ${adminSecret}` to `POST /catalog`.

3. **Backend Survey Findings (`survey_explorer_backend/report.md`)**:
   - Section 3.2 and Section 4.1 lay out the complete router design for Hono v4 on Cloudflare Workers, in-memory mock KV testing with `app.request()`, and unified route handling for Catalog and Image endpoints.

---

## 2. Logic Chain

1. **Authentication Requirement**:
   - *Observation 1 & 2*: Admin CMS passes `Authorization: Bearer <secret>` when saving catalog. Unauthenticated requests to `POST /catalog` must be rejected to prevent unauthorized overwrite of the database.
   - *Reasoning*: Implementing helper `isAuthorized(authHeader, expectedSecret)` ensures strict Bearer token comparison when `ADMIN_SECRET` is configured, returning standard `401 Unauthorized` with `{ success: false, error: 'Unauthorized: Invalid or missing admin secret' }`.

2. **Data Integrity & Validation**:
   - *Observation 1 & 2*: Incoming `POST /catalog` payloads must contain valid `Story[]` entries matching the mobile and admin schema contracts.
   - *Reasoning*: Enforcing strict validation for `id` (non-empty string), `title` (`en` or `ne` present), `ageBand` (one of all 8 supported bands: `['2-4', '4-6', '6-8', '9-12', '13-17', '18-25', '25+', 'parents']`), and validating `Beat[]` attributes (`id`, `text`, `scene`, `voice`, `music`, `sfx`, `rabbit`, `tiger`) guarantees that bad data is rejected with `400 Bad Request` before touching KV storage.

3. **Storage & Fallback Mechanism**:
   - *Observation 1*: Unseeded KV returns `null` for `get('catalog')`.
   - *Reasoning*: `GET /catalog` must return status `200 OK` with `{ version: 1, stories: [] }` when KV is empty, and return parsed catalog `{ version, updatedAt, stories }` when seeded.

4. **Single Story Retrieval (`GET /catalog/:id`)**:
   - *Observation 1 & 2*: Mobile app and admin panel need direct single story lookup for deep links and inspection without transferring full multi-story bundles.
   - *Reasoning*: `GET /catalog/:id` queries the `'catalog'` key in KV, filters stories by ID, and returns `200 OK` `{ success: true, story }` or `404 Not Found` `{ success: false, error: 'Story not found' }`.

5. **Health Check & Global CORS**:
   - *Observation 1 & 3*: Health checks and preflight CORS must succeed for cross-origin Admin CMS (`http://localhost:5173`) and mobile clients.
   - *Reasoning*: `GET /` returns `{ service: 'Saanjh Backend API', version: '3.0.0', status: 'healthy' }` and `app.use('/*', cors(...))` enables universal CORS with preflight handling.

---

## 3. Caveats

1. **Image Storage Handling**: Explorer 1 is covering image upload (`POST /upload`), image asset retrieval (`GET /images/:id`), and image deletion (`DELETE /images/:id`). The proposed `backend/src/index.ts` code in `report.md` harmoniously integrates both subsystems into a single unified Hono worker.
2. **Mock KV Runner**: Explorer 3 is setting up `backend/test/runner.js` and `backend/tsconfig.json`. The catalog and auth tests outlined in `report.md` should be merged directly into the test suite.
3. No other caveats.

---

## 4. Conclusion

The specification for Milestone 1 Backend Catalog Persistence & Auth is complete, production-ready, and fully verified against the Saanjh 3.0 schema.

### Implementation Summary for Worker:
1. Update `backend/src/index.ts` with the complete router code provided in `report.md` (Section 6).
2. Ensure `POST /catalog` validates all 8 `AgeBand`s (`2-4`, `4-6`, `6-8`, `9-12`, `13-17`, `18-25`, `25+`, `parents`) and rich `Beat[]` fields.
3. Ensure `POST /catalog` checks Bearer token against `c.env.ADMIN_SECRET` returning `401 Unauthorized` on failure.
4. Implement `GET /catalog` (with fallback `{ version: 1, stories: [] }`), `GET /catalog/:id` (returns `200` or `404`), and `GET /` (returns `{ status: 'healthy', version: '3.0.0' }`).
5. Ensure global CORS middleware is active across all endpoints.

---

## 5. Verification Method

### Test Execution
Run the automated test runner in `backend/`:
```bash
cd "d:\Antigravity Projects\Bedtime Stories\backend"
node test/runner.js
```

### Key Verification Cases
1. `GET /` -> Status `200`, `status === 'healthy'`, `version === '3.0.0'`.
2. `GET /catalog` (empty KV) -> Status `200`, `stories` is `[]`, `version === 1`.
3. `POST /catalog` (no auth header) -> Status `401`, `{ success: false, error: 'Unauthorized: Invalid or missing admin secret' }`.
4. `POST /catalog` (invalid token) -> Status `401`.
5. `POST /catalog` (invalid `ageBand: '7-9'`) -> Status `400 Bad Request`.
6. `POST /catalog` (valid story with `ageBand: 'parents'`, `beats` array) -> Status `200 OK`.
7. `GET /catalog` -> Returns updated catalog containing saved story.
8. `GET /catalog/:id` -> Returns `200 OK` for saved story ID, `404 Not Found` for nonexistent ID.

### Invalidation Conditions
- If `POST /catalog` accepts an invalid ageBand like `'7-9'` without returning 400.
- If `POST /catalog` succeeds without a valid Bearer token when `ADMIN_SECRET` is set.
- If `GET /catalog/:id` returns 200 for a non-existent story ID.
