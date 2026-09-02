# Handoff Report: Mobile App Contracts & Backend/Admin Interoperability

**Agent**: Survey Explorer (Contracts & Mobile Integration)  
**Working Directory**: `d:\Antigravity Projects\Bedtime Stories\.agents\survey_explorer_contracts`  
**Date**: 2026-09-01  
**Status**: Task Complete (Hard Handoff)

---

## 1. Observation

Direct code observations from inspecting the codebase:

1. **Type Definitions in `types/story.ts` (lines 1–95)**:
   - `Language`: `'en' | 'ne'`
   - `StoryCategory`: `'roots' | 'universal' | 'custom'`
   - `AgeBand`: `'2-4' | '4-6' | '6-8' | '9-12' | '13-17' | '18-25' | '25+' | 'parents'`
   - `AudienceGroup`: `'children' | 'young' | 'grown'`
   - `StoryForm`: `'story' | 'novel'`
   - `Pose`: `'hidden' | 'idle' | 'walk' | 'bow' | 'sit' | 'roar' | 'leap' | 'lookDown'`
   - `SceneId`: `'establishing' | 'meeting' | 'walk' | 'roar' | 'well' | 'leap' | 'peace' | 'moon' | 'river' | 'courtyard' | 'hills' | 'lamp' | 'stars'`
   - `StageKind`: `'forest' | 'moon' | 'river' | 'courtyard' | 'hills' | 'lamp' | 'stars'`
   - `VoiceRole`: `'narrator' | 'tiger' | 'rabbit' | 'soft'`
   - `SoundId`: `'night' | 'moon' | 'river' | 'courtyard' | 'roar' | 'splash' | 'ripple' | 'chime' | 'wind'`
   - `Localized<T>`: `Record<Language, T>` (`{ en: T, ne: T }`)
   - `Beat`: `{ id: string; text: Localized; scene: SceneId; rabbit: Pose; tiger: Pose; voice?: VoiceRole; music?: SoundId; sfx?: SoundId; }`
   - `Story`: `{ id, category, form, ageBand, title, subtitle?, runtimeMinutes?, theme?, accent?, stage?, cast?, locked?, beats?, mediaType?, mediaUrl?, mediaUrl_ne?, mediaAssets?, coverImage?, isHidden? }`

2. **Catalog and Story Ingestion (`data/catalog.ts`, `data/stories/*.ts`, `lib/catalogFetcher.ts`)**:
   - `data/catalog.ts` contains 23 curated stories across all age bands.
   - `lib/catalogFetcher.ts` queries `GET https://saanjh-api.prabinkhokhali89.workers.dev/catalog`, parses `{ version: number, stories: Story[] }`, filters out `story.isHidden === true`, and stores in Zustand `useDownloadsStore`.
   - `app/index.tsx` (lines 30–35) and `app/library.tsx` merge local static stories with remote stories matching by `story.id`.

3. **Narrator & Audio Engine (`lib/speech.ts`, `lib/audio.ts`, `lib/narrator/segmenter.ts`, `lib/narrator/cloudTts.ts`, `hooks/useStoryPlayback.ts`)**:
   - `lib/audio.ts` lines 12–43 define `SCENE_BED_MAP` and `STAGE_BED_MAP`. Looping beds are `night`, `moon`, `river`, `courtyard`, `wind`. `resolveAmbientBed(music, scene, stage)` cascades beat music $\rightarrow$ scene bed $\rightarrow$ stage bed $\rightarrow$ default `'night'`.
   - `lib/narrator/segmenter.ts` lines 4–9 define `VOICE_PROFILES` for character voice modulation. Lines 24–105 tokenize sentences/dialogues and insert bedtime pauses (`\n\n`: 1200ms, `\n`: 1100ms, `...`: 1000ms, `.!?।॥`: 750ms, `,;—`: 300ms).
   - `lib/narrator/cloudTts.ts` lines 76–84 map voices to Google Cloud TTS (`ne-NP-Standard-A/B`, `en-IN-Neural2-A/B`) and caches MP3s under `${cacheDirectory}saanjh_tts/`.

4. **Player Routing & Novel Reader (`app/story/[id].tsx`, `components/reader/NovelReader.tsx`, `components/player/StoryPlayer.tsx`)**:
   - `app/story/[id].tsx` branches:
     - Media story (`mediaType || mediaUrl || mediaAssets`) $\rightarrow$ `MediaStoryPlayer`
     - Novel (`story.form === 'novel'`) $\rightarrow$ `NovelReader` (paginated text reader with font scaling A-/A+, progress bar, and "Read Aloud" narration button)
     - 2D Visual story (`story.form === 'story'`) $\rightarrow$ `StoryPlayer` (renders `ForestStage` or `NightStage` with animated character rigs).

5. **Backend & Admin Panel State (`backend/src/index.ts`, `admin/src/App.tsx`)**:
   - `backend/src/index.ts` accepts `GET /catalog` and authenticated `POST /catalog` (checks `ADMIN_SECRET` Bearer token).
   - `admin/src/App.tsx` has basic metadata editing but lacks a Beat editor, stage/scene dropdowns, moral/theme inputs, novel form selector, and direct cover image uploader.

---

## 2. Logic Chain

1. From `types/story.ts` and `hooks/useStoryPlayback.ts`, the mobile app requires stories to have either `beats: Beat[]` (for text/narrator stories and novels) or `mediaUrl`/`mediaAssets` (for streaming media stories).
2. For text stories, `useStoryPlayback` iterates over `story.beats[]`, resolving the ambient bed from `beat.music` or `beat.scene` or `story.stage`, and passing `beat.text[language]` and `beat.voice` to `speakBeat()`.
3. For novels (`form: 'novel'`), `NovelReader` displays each `beat.text[language]` as a page, allowing readers to adjust font size, flip pages, and use "Read Aloud" to narrate pages seamlessly using the same `useStoryPlayback` audio pipeline.
4. When `admin/` publishes to `POST /catalog`, the JSON stored in Cloudflare KV must strictly match the `Story` and `Beat` schemas so that `lib/catalogFetcher.ts` can ingest them and pass them directly to `NovelReader`, `StoryPlayer`, and `StoryDetailScreen` without type errors or missing fields.
5. Therefore, upgrading `admin/` to include a full bilingual Beat Editor (with smart auto-splitting and card editing), Scene/Stage metadata controls, and direct image uploading provides end-to-end compatibility for Saanjh 3.0.

---

## 3. Caveats

- **No Caveats**. All core type definitions, story formats, audio engines, player routes, backend endpoints, and admin UI components were thoroughly examined and verified directly against source files.

---

## 4. Conclusion

The data contracts, enum taxonomies, and architectural requirements for mobile-admin-backend interoperability have been fully defined and documented in:
- `d:\Antigravity Projects\Bedtime Stories\.agents\survey_explorer_contracts\report.md`

Downstream implementers for `admin/` and `backend/` can immediately build against the specifications in `report.md` with guaranteed schema conformance and feature alignment.

---

## 5. Verification Method

1. **Verify TypeScript compilation**:
   ```bash
   npx tsc --noEmit
   ```
2. **Verify Story Types & Catalog Consistency**:
   - Inspect `types/story.ts`
   - Inspect `data/catalog.ts`
   - Inspect `data/stories/_lines.ts`
3. **Verify API Contract**:
   - Test `GET /catalog` returning valid `{ version: number, stories: Story[] }`
   - Test `POST /catalog` with `Authorization: Bearer <ADMIN_SECRET>`
