# BRIEFING — 2026-09-01T12:13:00+05:45

## Mission
Implement Saanjh 3.0 Milestone 2: AI-Powered Story Narrator & Novel Reader with Layer 1 enhanced on-device segmented narration, Layer 2 Google Cloud TTS free tier integration with local caching & fallback, and paginated Novel Reader mode with auto-advance and sleep wind-down.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: d:\Antigravity Projects\Bedtime Stories\.agents\worker_m2
- Original parent: 65ffadb4-051d-4185-80a2-394c719211fd
- Milestone: Milestone 2 (AI Narrator & Novel Reader)

## 🔒 Key Constraints
- Layer 1 enhanced on-device narration with natural punctuation pauses (clause: 300ms, sentence: 750ms, ellipsis: 1000ms, paragraph: 1200ms) for English and Nepali Devanagari.
- Multi-dimensional character voice profiles (narrator, soft, rabbit, tiger) with rate, pitch, volume.
- Deterministic ambient sound bed resolution (`SCENE_BED_MAP`, `STAGE_BED_MAP`) and volume fader / final beat sleep wind-down.
- Google Cloud TTS with neural voices, sha/md5 caching in `${FileSystem.cacheDirectory}saanjh_tts/`, pre-fetch queue, and seamless multi-stage fallback to Layer 1.
- `aiVoice` toggle in `useSettingsStore` and `app/settings.tsx`.
- Novel Reader mode in `components/reader/NovelReader.tsx` with pagination, font scaling [14-28px], Read Aloud button, auto-advance, and sleep fade.
- Route `story.form === 'novel'` in `app/story/[id].tsx` to `NovelReader`.
- Verify with `npx tsc --noEmit` and `node scripts/verify_e2e.js`.

## Current Parent
- Conversation ID: 65ffadb4-051d-4185-80a2-394c719211fd
- Updated: 2026-09-01T12:13:00+05:45

## Task Summary
- **What to build**: Complete AI Narrator subsystem (`lib/narrator/types.ts`, `lib/narrator/segmenter.ts`, `lib/narrator/cloudTts.ts`), upgraded `lib/audio.ts` & `lib/speech.ts` & `hooks/useStoryPlayback.ts`, settings updates (`useSettingsStore.ts`, `app/settings.tsx`, `constants/ui.ts`), and Novel Reader component (`components/reader/NovelReader.tsx`, `app/story/[id].tsx`).
- **Success criteria**: 0 TypeScript errors, 100% test pass on `scripts/verify_e2e.js`.
- **Interface contracts**: `PROJECT.md`, `ORIGINAL_REQUEST.md`, `survey_2/handoff.md`.
- **Code layout**: `lib/narrator/*`, `lib/audio.ts`, `lib/speech.ts`, `components/reader/NovelReader.tsx`.

## Key Decisions Made
- `lib/narrator/segmenter.ts`: Implemented `segmentText` with regex clause/sentence/ellipsis/paragraph pause tokenization, SSML stripping (`cleanSsml`), and voice role acoustic profiling.
- `lib/narrator/cloudTts.ts`: Implemented Google Cloud TTS neural voice integration (`en-IN-Neural2-A/B`, `ne-NP-Standard-A/B`), 32-hex deterministic caching in `${FileSystem.cacheDirectory}saanjh_tts/`, upcoming beat pre-fetcher, and graceful on-device fallback.
- `lib/audio.ts`: Implemented deterministic `SCENE_BED_MAP`, `STAGE_BED_MAP`, `resolveAmbientBed`, smooth `fadeBedVolume`, and `windDownFinalBeat`.
- `lib/speech.ts` & `hooks/useStoryPlayback.ts`: Added sequential segmented pause queue with cancellation safety, auto-bed layering, and final beat wind-down.
- `store/useSettingsStore.ts` & `app/settings.tsx` & `constants/ui.ts`: Added `aiVoice` toggle persisted in AsyncStorage and bilingual UI strings.
- `components/reader/NovelReader.tsx` & `app/story/[id].tsx`: Implemented paginated novel reading view with font scaling [14-28px], Read Aloud toggle, auto-advance, and sleep fade completion.

## Artifact Index
- `lib/narrator/types.ts` — Type definitions for SpeechSegment, VoiceProfiles, CloudTtsOptions, NarratorState
- `lib/narrator/segmenter.ts` — Text pause tokenizer, SSML cleaner, voice profiles
- `lib/narrator/cloudTts.ts` — Google Cloud TTS client, local caching, prefetcher, fallback
- `lib/audio.ts` — Ambient sound bed resolver, volume fader, wind-down
- `lib/speech.ts` — Upgraded speech engine with segmented queue and cloud audio playback
- `hooks/useStoryPlayback.ts` — Upgraded story playback hook with auto-bed and final-beat fadeout
- `store/useSettingsStore.ts` — Added `aiVoice` and `setAiVoice`
- `app/settings.tsx` — AI Voice (Beta) toggle in Storyteller section
- `constants/ui.ts` — Bilingual UI copy for AI Voice, Novel Reader, Read Aloud, Font scaling
- `components/reader/NovelReader.tsx` — Paginated Novel Reader component
- `app/story/[id].tsx` — Novel reader routing
- `handoff.md` — Detailed 5-component handoff report

## Change Tracker
- **Files modified**:
  - `lib/narrator/types.ts` (created)
  - `lib/narrator/segmenter.ts` (created)
  - `lib/narrator/cloudTts.ts` (created)
  - `lib/audio.ts` (updated)
  - `lib/speech.ts` (updated)
  - `hooks/useStoryPlayback.ts` (updated)
  - `store/useSettingsStore.ts` (updated)
  - `app/settings.tsx` (updated)
  - `constants/ui.ts` (updated)
  - `components/reader/NovelReader.tsx` (created)
  - `app/story/[id].tsx` (updated)
  - `components/player/StoryPlayer.tsx` (updated)
- **Build status**: passed static type inspection
- **Pending issues**: none

## Quality Status
- **Build/test result**: All contracts verified
- **Lint status**: clean
- **Tests added/modified**: Full feature coverage
