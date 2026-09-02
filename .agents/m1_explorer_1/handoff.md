# Milestone 1 Handoff Report: Backend Image Upload & Storage

**Agent:** Explorer 1 (Milestone 1)  
**Target:** Orchestrator & Worker Agents  
**Date:** 2026-09-01  
**Scope:** Backend Image Upload (`POST /upload`), Delivery (`GET /images/:id`), Deletion (`DELETE /images/:id`), Catalog Persistence (`POST /catalog`, `GET /catalog`, `GET /catalog/:id`), Bearer Auth, TypeScript Configuration, and Automated Testing.

---

## 1. Observation

1. **Baseline Worker Code (`backend/src/index.ts:1-57`)**:
   - Contains 57 lines implementing basic `GET /`, `GET /catalog`, and unvalidated `POST /catalog`.
   - Lacks `POST /upload`, `GET /images/:id`, `DELETE /images/:id`, `GET /catalog/:id`.
   - `POST /catalog` (lines 35-54) performs no schema validation before calling `c.env.SAANJH_DB.put('catalog', JSON.stringify(body))`.
2. **Configuration Files (`backend/package.json:1-22`, `backend/wrangler.toml:1-14`)**:
   - `backend/wrangler.toml` binds KV namespace `SAANJH_DB` with ID `97f579307cd347ee8f0904b6c7230813`.
   - `backend/package.json` specifies `"main": "index.js"` and `"test": "echo \"Error: no test specified\" && exit 1"`.
   - `backend/tsconfig.json` is missing; root `tsconfig.json` explicitly excludes `backend` in line 18 (`"exclude": ["node_modules", "admin", "backend", ".agents"]`).
3. **Data Contract (`types/story.ts:1-95`)**:
   - Defines `AgeBand` with 8 bands: `'2-4' | '4-6' | '6-8' | '9-12' | '13-17' | '18-25' | '25+' | 'parents'`.
   - Defines `Beat` (`id`, `text: Localized`, `scene: SceneId`, `rabbit: Pose`, `tiger: Pose`, `voice?: VoiceRole`, `music?: SoundId`, `sfx?: SoundId`).
   - Defines `Story` (`id`, `title`, `ageBand`, `category`, `form`, `stage`, `beats`, `coverImage`, `mediaType`, etc.).
4. **Admin CMS Interface (`admin/src/App.tsx:4, 20-35, 239-245`)**:
   - Admin connects to `https://saanjh-api.prabinkhokhali89.workers.dev/catalog`.
   - Stores `saanjh_admin_secret` in localStorage.
   - Contains a text input for `coverImage` (lines 239-245) expecting a public hosted URL.
5. **Mobile Catalog Fetcher (`lib/catalogFetcher.ts:1-32`)**:
   - Fetches `https://saanjh-api.prabinkhokhali89.workers.dev/catalog`.
   - Filters out `isHidden` stories and populates `useDownloadsStore`.

---

## 2. Logic Chain

1. **Need for Image Upload & Edge Delivery**:
   - Observation (1) and (4) show that `admin/` currently relies on manually entered image URLs because `backend/src/index.ts` has no upload endpoint.
   - Implementing `POST /upload` with dual-mode ingestion (`multipart/form-data` and raw binary `image/*`), storing `ArrayBuffer` in KV `SAANJH_DB` under `image:<id>` with metadata, and returning `{ id, url, filename, size, contentType }` allows the Admin panel to upload local images directly.
2. **High-Performance Image Caching Strategy**:
   - Observation (1) shows no public image serving route.
   - Adding `GET /images/:id` with `c.env.SAANJH_DB.getWithMetadata` allows delivering images directly to mobile devices.
   - Adding `Cache-Control: public, max-age=31536000, immutable`, `ETag: W/"${id}"`, and `If-None-Match` HTTP 304 response handling ensures high-speed Cloudflare edge caching, eliminating redundant egress and maximizing battery/network efficiency on mobile clients.
3. **Admin Auth & Security Enforcement**:
   - Observation (1) shows baseline `POST /catalog` had loose auth and no auth on other potential endpoints.
   - Enforcing Bearer token authentication against `c.env.ADMIN_SECRET` across `POST /catalog`, `POST /upload`, and `DELETE /images/:id` prevents unauthorized data corruption and spam uploads.
4. **Schema Validation Integrity**:
   - Observation (1) and (3) indicate that saving invalid story structures could crash mobile apps reading `types/story.ts`.
   - Adding runtime validation on `POST /catalog` for `id`, bilingual `title` (`en`/`ne`), and valid `ageBand` (including `'parents'`) guarantees DB consistency.
5. **Tooling & Test Isolation**:
   - Observation (2) showed no `backend/tsconfig.json` and a placeholder test script.
   - Creating `backend/tsconfig.json` with `@cloudflare/workers-types` and `backend/test/runner.js` with an in-memory `MockKVNamespace` enables 100% automated verification of all endpoints, error codes, and edge cases in pure Node.js.

---

## 3. Caveats

- **KV Value Size**: Cloudflare KV has a maximum value size of 25MB (10MB on free tiers). The 5MB image limit configured in `backend/src/index.ts` (`MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024`) is strictly within this limit.
- **Node vs Worker Runtime in Testing**: In unit tests (`test/runner.js`), an in-memory `MockKVNamespace` is used to simulate KV behavior without requiring an active internet connection or live Cloudflare account.
- **Environment Variable Fallback**: In `isAuthorized()`, if `c.env.ADMIN_SECRET` is not set (e.g. in local development), authentication returns `true` (permissive) to prevent blocking local development when secrets have not been provisioned.

---

## 4. Conclusion

The implementation plan formulated in `report.md` provides a complete, production-ready specification for `backend/src/index.ts`, `backend/tsconfig.json`, `backend/package.json`, and `backend/test/runner.js`.

The implementation worker can execute the changes in these 4 concrete steps:
1. Write `backend/tsconfig.json`.
2. Update `backend/package.json` with scripts and dependencies.
3. Replace `backend/src/index.ts` with the upgraded Hono application code.
4. Write `backend/test/runner.js` and execute `node test/runner.js`.

---

## 5. Verification Method

1. **Automated Unit & Integration Test Suite**:
   - Run: `node backend/test/runner.js`
   - Invalidation Condition: Any test assertion fails, or script exits with non-zero code.
2. **TypeScript Typecheck**:
   - Run: `cd backend && npx tsc --noEmit`
   - Invalidation Condition: TypeScript emits type errors on Hono types, KVNamespace bindings, or parameter types.
3. **Files to Inspect**:
   - `backend/src/index.ts`
   - `backend/tsconfig.json`
   - `backend/package.json`
   - `backend/test/runner.js`
