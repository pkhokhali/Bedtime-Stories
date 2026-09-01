## 2026-09-01T06:22:44Z
You are Worker 2 for Saanjh 3.0 Milestone 2: AI-Powered Story Narrator & Novel Reader.
Your working directory is: d:\Antigravity Projects\Bedtime Stories\.agents\worker_m2
The authoritative requirements are at: d:\Antigravity Projects\Bedtime Stories\.agents\ORIGINAL_REQUEST.md
The project specification is at: d:\Antigravity Projects\Bedtime Stories\PROJECT.md
The audio & narrator survey report is at: d:\Antigravity Projects\Bedtime Stories\.agents\explorer_survey_2\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your mission:
Implement the complete, production-ready AI Narrator & Novel Reader system:
1. **Layer 1: Enhanced On-Device Narration**
   - Create `lib/narrator/types.ts` with type definitions (`SpeechSegment`, `VoiceProfiles`, `CloudTtsOptions`, `NarratorState`).
   - Create `lib/narrator/segmenter.ts`:
     - Natural punctuation pause tokenizer (clause: 300ms, sentence: 750ms, ellipsis: 1000ms, paragraph: 1200ms) supporting both English (`. ! ? ...`) and Devanagari (`। ॥ ! ? ...`).
     - Dialogue vs narration detector and SSML cleaner.
     - Multi-dimensional character voice roles (`narrator`, `soft`, `rabbit`, `tiger`) with distinct pitch, rate, and volume.
   - In `lib/audio.ts`:
     - Implement `resolveAmbientBed(music?: SoundId, scene?: SceneId, stage?: StageKind): SoundId` with deterministic mapping table (`SCENE_BED_MAP`, `STAGE_BED_MAP`).
     - Implement `fadeBedVolume(targetVolume: number, durationMs?: number)` and `windDownFinalBeat()` (fading bed to 0.04/0.0 over 3500ms on final beat).
   - In `lib/speech.ts` & `hooks/useStoryPlayback.ts`:
     - Upgrade speech execution queue to iterate over segmented pauses with cancellation protection.
     - Auto-layer resolved ambient sound bed and trigger final beat sleep wind-down.
2. **Layer 2: Cloud AI Voice (Google Cloud TTS Free Tier)**
   - Create `lib/narrator/cloudTts.ts`:
     - Google Cloud TTS API client targeting neural voices: `en-IN-Neural2-A`/`B` or `en-US-Neural2-F`/`D` for English, `ne-NP-Standard-A`/`B` for Nepali.
     - Local audio file caching with `expo-file-system` in `${FileSystem.cacheDirectory}saanjh_tts/` using deterministic key hashing so cached files are played without network calls.
     - Pre-fetch queue for upcoming beats.
     - Multi-stage graceful fallback to Layer 1 (enhanced on-device TTS) if API key missing, network is offline, or quota error.
   - In `store/useSettingsStore.ts`:
     - Add `aiVoice: boolean` (default `false`) and `setAiVoice: (v: boolean) => void`, persisted in AsyncStorage.
   - In `app/settings.tsx`:
     - Add "AI Voice (Beta)" toggle in the Storyteller section with bilingual labels and descriptions (`ui.aiVoice`, `ui.aiVoiceHint`).
   - In `constants/ui.ts`:
     - Add bilingual translations for AI Voice, Novel Reader, Read Aloud, and Font Size controls.
3. **Novel Reader Mode**
   - Create `components/reader/NovelReader.tsx`:
     - Paginated reading view with dark bedtime aesthetic (`#0B0E14`/`#161B26`), warm cream text (`#F4E6C8`), generous line height.
     - User adjustable font size scaling `[A-]` and `[A+]` (clamped between 14px and 28px).
     - Prominent "Read Aloud" button (`t(ui.readAloud, language)`) integrated with the unified Narrator engine.
     - Auto-advancing pages upon beat narration completion with progress bar (`Page X of Y` / `X / Y पृष्ठ`).
     - Final page sleep fade completion.
   - In `app/story/[id].tsx`:
     - Mount `NovelReader` when `story.form === 'novel'` and `!story.mediaUrl`.

Verification requirement:
- Run `npx tsc --noEmit` across root and ensure 0 TypeScript errors.
- Run `node scripts/verify_e2e.js` to verify passing assertions for Milestone 2 features (F08-F17, B01-B03, B06-B07, C02, etc.).
- Document all changes and verification in `d:\Antigravity Projects\Bedtime Stories\.agents\worker_m2\handoff.md`.
- Send a message when ready.
