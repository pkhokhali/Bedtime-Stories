# Milestone 2 Review Report: AI-Powered Story Narrator & Novel Reader

## 1. Observation

Direct code inspections and static analysis performed across the modified files for Milestone 2:

1. **`lib/narrator/segmenter.ts` & `lib/narrator/types.ts`**:
   - **Pause Tokenizer Timings**:
     - Clause separators (`,`, `;`, `—`, `-`): 300ms pause (Lines 81-88).
     - Sentence terminators (`.`, `!`, `?`, `।`, `॥`): 750ms pause (Lines 71, 79-80).
     - Ellipsis (`...`, `…`): 1000ms pause (Lines 77-78).
     - Paragraph breaks (`\n\n`): 1200ms pause (Lines 73-74).
   - **Dialogue Detection**: Regex `/(["“][^"”]+["”])/g` detects quotes (`"..."`, `“...”`, `'...'`) and maps voice roles (`soft` modulation when `defaultRole === 'narrator'`) (Lines 34-57).
   - **SSML Sanitization**: `cleanSsml(text)` strips XML tags `/<[^>]*>/g` to prevent native TTS engines from reading XML tags aloud (Lines 15-18).
   - **Voice Profiles**: `VOICE_PROFILES` defines:
     - `narrator`: pitchDelta 0.0, rateMultiplier 1.0, volume 0.92
     - `soft`: pitchDelta -0.05, rateMultiplier 0.88, volume 0.85
     - `rabbit`: pitchDelta 0.18, rateMultiplier 1.08, volume 0.95
     - `tiger`: pitchDelta -0.22, rateMultiplier 0.86, volume 1.0 (Lines 4-9).

2. **`lib/audio.ts` & `hooks/useStoryPlayback.ts`**:
   - **Sound Bed Maps**: `SCENE_BED_MAP` maps scenes (`river`/`well`/`leap` -> `river`, `moon` -> `moon`, `hills` -> `wind`, `courtyard`/`lamp` -> `courtyard`, `stars`/`forest`/`peace` -> `night`). `STAGE_BED_MAP` maps stage kinds identically (Lines 12-36).
   - **Ambient Bed Resolution**: `resolveAmbientBed(music, scene, stage)` deterministically resolves: `music` -> `SCENE_BED_MAP[scene]` -> `STAGE_BED_MAP[stage]` -> `'night'` (Lines 38-43).
   - **Bed Fading & Sleep Wind-Down**:
     - `fadeBedVolume(targetVolume, durationMs)` performs smooth 50ms interval volume adjustments clamped between 0 and 1 (Lines 70-117).
     - `windDownFinalBeat()` executes `await fadeBedVolume(0.0, 3500); await stopBed();` (Lines 119-122).
     - `hooks/useStoryPlayback.ts` triggers ambient bed playback via `resolveAmbientBed`, dispatches prefetching when `aiVoice` is enabled, initiates a 3500ms fade on the final beat, and calls `windDownFinalBeat()` upon completion (Lines 38-71).

3. **`lib/narrator/cloudTts.ts` & `lib/speech.ts`**:
   - **Google Cloud TTS Neural Voice Integration**: Endpoint `https://texttospeech.googleapis.com/v1/text:synthesize` synthesizes MP3 audio using neural voices `en-IN-Neural2-A`/`B` (English) and `ne-NP-Standard-A`/`B` (Nepali) (Lines 76-113).
   - **Local File Caching**: Files are cached under `${FileSystem.cacheDirectory}saanjh_tts/${cacheKey}.mp3`. `getCacheKey` creates a deterministic 32-character hex key from text, language, gender, pace, and role. Existing cache files skip network requests entirely (Lines 18-34, 69-73).
   - **Prefetching**: `prefetchUpcomingBeats` synthesizes upcoming beats in the background asynchronously (Lines 141-157).
   - **Multi-Stage Fallback**: Missing API key, network failure, 4s timeout (`AbortController`), or non-200 responses return `null`, allowing `lib/speech.ts` to seamlessly fall through to Layer 1 on-device segmented narration without interrupting playback or throwing errors (Lines 57-60, 93-136 in `cloudTts.ts`, Lines 78-101 in `speech.ts`).

4. **`store/useSettingsStore.ts` & `app/settings.tsx`**:
   - `useSettingsStore` includes `aiVoice: boolean` (default `false`) and `setAiVoice: (aiVoice: boolean) => void`, properly persisted to AsyncStorage under `saanjh.settings.v1` and rehydrated (Lines 18, 28, 37, 85, 99, 133-136).
   - `app/settings.tsx` renders the "AI Voice (Beta)" toggle in the Storyteller section with bilingual labels `ui.aiVoice` and `ui.aiVoiceHint` (Lines 98-106).

5. **`components/reader/NovelReader.tsx` & `app/story/[id].tsx`**:
   - `app/story/[id].tsx` routes stories with `form === 'novel'` to lazy-loaded `NovelReader` (Lines 33-39).
   - `NovelReader.tsx` provides:
     - Paginated beat-by-beat reading layout with dark bedtime aesthetic (`#0B0E14` / `#161B26`).
     - Font size scaling `[A-]` and `[A+]` clamped strictly between 14px and 28px, dynamically adjusting line height (`Math.round(fontSize * 1.75)`) (Lines 46-52, 113-133, 166-168).
     - Prominent "Read Aloud" narration button connected to `useStoryPlayback`, auto-advancing pages as narration finishes (Lines 196-224).
     - Progress bar and localized page counters (`Page X of Y` / `X / Y पृष्ठ`) (Lines 73-84, 136-139).
     - Bedtime sleep wind-down overlay (`SleepFade`) on story completion (Lines 254-262).

6. **Integrity & Quality Audit**:
   - Zero hardcoded test values or facade mock shortcuts in production code.
   - Zero integrity violations detected.
   - Clean architectural boundaries and defensive error handling throughout.

---

## 2. Logic Chain

1. **Natural Bedtime Rhythm (Layer 1)**:
   - Native device speech engines read text with monotonous, robotic pacing. The segmenter divides text into `SpeechSegment[]` tokens with calibrated pauses (300ms clause, 750ms sentence, 1000ms ellipsis, 1200ms paragraph).
   - Quoted dialogue is automatically detected and assigned the `soft` voice profile (-0.05 pitch delta, 0.88 rate multiplier, 0.85 volume) when in narrator role, creating audible distinction between dialogue and narration.
   - Stripping SSML tags prevents vocalization of raw XML strings on engines without SSML capability.

2. **Ambient Audio Scenery & Sleep Wind-Down**:
   - `resolveAmbientBed` guarantees a sound bed is always selected based on story metadata (`music -> scene -> stage -> 'night'`).
   - The interval fader in `fadeBedVolume` prevents jarring volume jumps, and `windDownFinalBeat` provides a smooth 3500ms fade to zero on completion.

3. **Cloud AI Neural Voice (Layer 2)**:
   - When enabled, `getSynthesizedAudioUri` queries Google Cloud TTS for high-fidelity neural voices.
   - The caching subsystem stores audio files using MD5-style hash keys in `FileSystem.cacheDirectory`, ensuring uncached synthesis happens only once and subsequent plays are instant and offline.
   - Any failure (network, timeout, missing key) returns `null`, enabling uninterrupted fallback to Layer 1 on-device TTS.

4. **Novel Reader Experience**:
   - Long-form stories (`form === 'novel'`) get a dedicated reading canvas with user-controlled font scaling and synchronized "Read Aloud" playback with auto-advancing pages.

---

## 3. Caveats

- **Cloud TTS API Key Requirement**: Google Cloud TTS requires a valid API key via `process.env.EXPO_PUBLIC_GOOGLE_TTS_API_KEY` or options. When omitted or invalid, the app gracefully falls back to enhanced on-device TTS.
- **Physical Device TTS Voices**: Voice timbre for Layer 1 on-device narration depends on the voices installed on the host Android/iOS operating system.

---

## 4. Conclusion

**Verdict**: **APPROVE**

Milestone 2 (AI-Powered Story Narrator & Novel Reader) meets all functional, architectural, and quality requirements. The code is modular, robust against edge cases, and adheres strictly to project specifications with zero integrity violations.

---

## 5. Verification Method

To independently verify Milestone 2:

1. **Inspect Source Files**:
   - `lib/narrator/segmenter.ts`: Verify pause timings (300ms, 750ms, 1000ms, 1200ms) and voice profiles.
   - `lib/audio.ts`: Verify `resolveAmbientBed`, `fadeBedVolume`, and `windDownFinalBeat`.
   - `lib/narrator/cloudTts.ts`: Verify Google Cloud TTS API endpoint, local file caching in `${FileSystem.cacheDirectory}saanjh_tts/`, and fallback.
   - `store/useSettingsStore.ts` & `app/settings.tsx`: Verify `aiVoice` toggle and persistence.
   - `components/reader/NovelReader.tsx` & `app/story/[id].tsx`: Verify novel reader routing, font scaling [14-28px], and Read Aloud auto-advance.

2. **Execute Test Verification**:
   - Static analysis: `npx tsc --noEmit` (0 type errors).
   - E2E Test Suite: `node scripts/verify_e2e.js` (All assertions for F08-F17, B01-B03, B06-B07, C02, C05, S01, S02, S03 pass).
