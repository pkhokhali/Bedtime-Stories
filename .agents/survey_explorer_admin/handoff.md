# Handoff Report — Saanjh 3.0 Admin Panel Technical Survey

**Explorer**: Survey Explorer (Admin Panel)  
**Date**: 2026-09-01  
**Status**: Complete (Hard Handoff)  
**Deliverables**:
- Survey Report: `d:\Antigravity Projects\Bedtime Stories\.agents\survey_explorer_admin\report.md`
- Handoff Report: `d:\Antigravity Projects\Bedtime Stories\.agents\survey_explorer_admin\handoff.md`

---

## 1. Observation

1. **Current Codebase Structure & Build**:
   - `admin/package.json`: Vite `8.2.0`, React `19.2.8`, TypeScript `6.0.2`, TailwindCSS `4.3.3`, `lucide-react` `1.33.0`.
   - Command `npm run build` executed in `d:\Antigravity Projects\Bedtime Stories\admin` succeeded with code 0 (`✓ built in 11.49s`, zero TypeScript compilation or bundler errors).
   - `admin/src/App.tsx` (280 lines) is currently a monolithic component managing story metadata with limited fields (`title`, `subtitle`, `category`, `ageBand`, `mediaType`, `mediaUrl`, `mediaUrl_ne`, `coverImage`, `isHidden`).

2. **Schema & Contract Analysis**:
   - Mobile application schema defined in `types/story.ts`:
     - `Language = 'en' | 'ne'`
     - `AgeBand = '2-4' | '4-6' | '6-8' | '9-12' | '13-17' | '18-25' | '25+' | 'parents'`
     - `StageKind = 'forest' | 'moon' | 'river' | 'courtyard' | 'hills' | 'lamp' | 'stars'`
     - `SceneId = 'establishing' | 'meeting' | 'walk' | 'roar' | 'well' | 'leap' | 'peace' | 'moon' | 'river' | 'courtyard' | 'hills' | 'lamp' | 'stars'`
     - `VoiceRole = 'narrator' | 'tiger' | 'rabbit' | 'soft'`
     - `SoundId = 'night' | 'moon' | 'river' | 'courtyard' | 'roar' | 'splash' | 'ripple' | 'chime' | 'wind'`
     - `Pose = 'hidden' | 'idle' | 'walk' | 'bow' | 'sit' | 'roar' | 'leap' | 'lookDown'`
     - `Beat = { id: string; text: { en: string; ne: string }; scene: SceneId; rabbit: Pose; tiger: Pose; voice?: VoiceRole; music?: SoundId; sfx?: SoundId; }`
     - `Story = { id: string; category: StoryCategory; form: StoryForm; ageBand: AgeBand; title: Localized; subtitle?: Localized; runtimeMinutes?: number; theme?: Localized; accent?: string; stage?: StageKind; cast?: 'rabbit' | 'none'; locked?: boolean; beats?: Beat[]; mediaType?: MediaType; mediaUrl?: string; mediaUrl_ne?: string; coverImage?: string; isHidden?: boolean; }`
   - Existing sample stories in `data/stories/*.ts` (e.g. `clever-rabbit.ts`) and mobile readers (`components/player/StoryPlayer.tsx`, `components/reader/NovelReader.tsx`, `hooks/useStoryPlayback.ts`) depend strictly on this exact structure.

3. **Backend API Endpoint Behavior**:
   - `backend/src/index.ts` exposes:
     - `GET /catalog` (fetches `catalog` JSON from KV `SAANJH_DB`).
     - `POST /catalog` (validates `Authorization: Bearer <ADMIN_SECRET>` header; returns 401 if invalid/missing, saves to KV on success).

4. **Missing Capabilities in Admin Panel**:
   - No Beat Editor (cannot edit `beats: Beat[]`).
   - No Stage / Scene / Voice / Ambient Sound / SFX / Pose controls.
   - No Direct Image Uploader (only accepts raw URL string).
   - No Toast notification system (uses inline alerts that scroll out of view).
   - No search or category filters; all cards expand simultaneously.

---

## 2. Logic Chain

1. *From Observation 1 & 2*: The mobile app relies on `Beat[]` for both procedural animated stories (`StoryPlayer`) and text-based novels (`NovelReader`). To allow authors to publish new stories or novels from the CMS without editing source code, the Admin Panel must provide a bilingual Beat Editor producing valid `Beat[]` records.
2. *From Observation 2*: The AI Narrator (`useStoryPlayback.ts`, `lib/audio.ts`) uses `stage`, `scene`, `music`, `voice`, and `sfx` to automatically trigger ambient audio beds (`night`, `moon`, `river`, `courtyard`, `wind`), sound effects, and voice pacing. Exposing these exact enum keys in dropdowns guarantees seamless audio narration in the mobile app.
3. *From Observation 3 & 4*: Managing story artwork currently requires manual external image hosting. Providing a dedicated `ImageUploader` component with local file picking, validation, loading indicator, and remote upload integration streamlines story publishing.
4. *From Observation 4*: For production readiness, replacing inline error banners with a dedicated Toast notification system ensures instant, non-intrusive feedback for success, network failures, and 401 unauthorized errors, while a responsive layout guarantees usability across desktop and mobile devices.

---

## 3. Caveats

1. **Cloudflare KV vs. R2 Storage**: If R2 bucket is not provisioned on the Cloudflare Worker, direct image uploads can store optimized image data / base64 or integrate with a free hosting endpoint / worker endpoint returning a valid public URL.
2. **Offline Mode**: When disconnected from the internet, the Admin Panel cannot reach `saanjh-api.prabinkhokhali89.workers.dev`; the UI must catch this gracefully and display an error toast instead of crashing or hanging.
3. **Legacy Story Media URLs**: Legacy stories have `mediaUrl` pointing to `.mp4`/`.mp3`. The upgraded Admin Panel must support both media-based streaming stories and text-based beat/novel stories simultaneously.

---

## 4. Conclusion

The Admin Panel (`admin/`) is ready for modular refactoring into a production-ready Saanjh 3.0 CMS. The full specification detailed in `report.md` provides:
1. **Content & Beat Editor UI** supporting bilingual English and Nepali Devanagari text, beat addition/reordering/deletion, and smart text auto-splitting.
2. **Audio & Scene Metadata Controls** with accurate dropdown options matching mobile enums.
3. **Direct Cover Image Uploader** with file validation, upload state, and automatic URL insertion.
4. **Toast Notification System & Responsive Layout** for error resilience and cross-device polish.

---

## 5. Verification Method

To verify the investigation and future implementation:

1. **Build Verification**:
   ```bash
   cd "d:\Antigravity Projects\Bedtime Stories\admin"
   npm run build
   ```
   *Expected Result*: Exits with code 0, generates production assets in `dist/`.

2. **Typecheck Verification**:
   ```bash
   npx tsc -b
   ```
   *Expected Result*: Zero TypeScript errors.

3. **Schema Compatibility**:
   - Verify that JSON produced by Admin Panel saves to `POST /catalog` and loads properly in mobile app (`useDownloadsStore`, `StoryScreen`).
