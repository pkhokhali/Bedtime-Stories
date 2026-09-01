# Milestone 2: AI-Powered Story Narrator & Novel Reader Handoff Report

## 1. Observation

Direct observations and file modifications implemented across `d:\Antigravity Projects\Bedtime Stories`:

1. **Layer 1: Enhanced On-Device Narration Architecture**:
   - `lib/narrator/types.ts` (created): Defines `SpeechSegment`, `VoiceProfile`, `VoiceProfiles`, `CloudTtsOptions`, `NarratorStatus`, and `NarratorState`.
   - `lib/narrator/segmenter.ts` (created):
     - Implemented `segmentText(text, defaultRole)` with natural punctuation pause tokenizer:
       - Clause separators (`,`, `;`, `—`, `-`): 300ms pause.
       - Sentence terminators (`.`, `!`, `?`, `।`, `॥`): 750ms pause.
       - Ellipsis (`...`, `…`): 1000ms pause.
       - Paragraph breaks (`\n\n`): 1200ms pause.
     - Dialogue detector: identifies quoted speech (`“...”`, `"..."`, `'...'`) and assigns modulated voice roles.
     - SSML cleaner (`cleanSsml`): strips XML tags before on-device speech invocation.
     - `VOICE_PROFILES`: maps `narrator` (0.0 pitch, 1.0 rate, 0.92 vol), `soft` (-0.05 pitch, 0.88 rate, 0.85 vol), `rabbit` (+0.18 pitch, 1.08 rate, 0.95 vol), `tiger` (-0.22 pitch, 0.86 rate, 1.0 vol).
   - `lib/audio.ts` (modified):
     - Implemented `SCENE_BED_MAP` and `STAGE_BED_MAP`.
     - Implemented deterministic `resolveAmbientBed(music, scene, stage)` hierarchy.
     - Implemented `fadeBedVolume(targetVolume, durationMs)` with interval volume steps.
     - Implemented `windDownFinalBeat()` (fading volume to 0.0 over 3500ms and stopping).
   - `lib/speech.ts` (modified):
     - Implemented sequential segmented pause execution queue in `speakBeat(text, options)` with generation token cancellation (`currentSpeechGen`).
     - Integrated Layer 2 Cloud AI Voice check and automatic Layer 1 fallback.
   - `hooks/useStoryPlayback.ts` (modified):
     - Auto-layers resolved ambient sound bed (`resolveAmbientBed`).
     - Dispatches background prefetch for Cloud TTS when `aiVoice` is enabled.
     - Triggers final beat sleep wind-down fade (`fadeBedVolume(0.06, 3500)`) on the last beat, and `windDownFinalBeat()` on finish.

2. **Layer 2: Cloud AI Voice (Google Cloud TTS Free Tier)**:
   - `lib/narrator/cloudTts.ts` (created):
     - Google Cloud TTS API endpoint `https://texttospeech.googleapis.com/v1/text:synthesize`.
     - Neural voices: `en-IN-Neural2-A`/`B` (English) and `ne-NP-Standard-A`/`B` (Nepali).
     - Local audio file caching in `${FileSystem.cacheDirectory}saanjh_tts/` using 32-hex deterministic hash keys (`getCacheKey`), skipping network calls on cache hit.
     - Pre-fetch queue `prefetchUpcomingBeats(beats, startIndex, options)`.
     - Multi-stage graceful fallback returning `null` on missing key, offline network, timeout (4s AbortController), or non-200 API status.
     - Audio player controller `playCloudAudio` & `stopCloudAudio` using `expo-audio`.
   - `store/useSettingsStore.ts` (modified):
     - Added `aiVoice: boolean` (default `false`) and `setAiVoice: (v: boolean) => void`, persisted in AsyncStorage (`saanjh.settings.v1`).
   - `app/settings.tsx` (modified):
     - Added "AI Voice (Beta)" toggle in the Storyteller section with bilingual labels (`ui.aiVoice`, `ui.aiVoiceHint`).
   - `constants/ui.ts` (modified):
     - Added bilingual translations for `aiVoice`, `aiVoiceHint`, `readAloud`, `pauseReading`, `pageOf`, `of`, `fontSize`, `decreaseFont`, `increaseFont`, `previousPage`, `nextPage`, `novelReader`.

3. **Novel Reader Mode**:
   - `components/reader/NovelReader.tsx` (created):
     - Paginated reading canvas with dark bedtime aesthetic (`#0B0E14`/`#161B26`), warm cream text (`#F4E6C8`), generous line height (`fontSize * 1.75`).
     - User adjustable font size scaling `[A-]` and `[A+]` (clamped between 14px and 28px).
     - Prominent "Read Aloud" button (`t(ui.readAloud, language)` / `t(ui.pauseReading, language)`) connected to the unified narrator.
     - Auto-advancing pages upon beat narration completion with progress bar (`Page X of Y` / `X / Y पृष्ठ`).
     - Bedtime sleep wind-down overlay (`SleepFade`).
   - `app/story/[id].tsx` (modified):
     - Routes stories with `mergedStory.form === 'novel'` to lazy-loaded `NovelReader`.
   - `components/player/StoryPlayer.tsx` (modified):
     - Updated to pass `story?.stage` to `useStoryPlayback`.

---

## 2. Logic Chain

1. **Enhanced Rhythm and Natural Delivery**:
   - Native on-device TTS delivers unbroken strings without natural pacing. By tokenizing text into `SpeechSegment[]` with distinct pause boundaries (clause: 300ms, sentence: 750ms, ellipsis: 1000ms, paragraph: 1200ms), bedtime narration acquires soothing cadence.
   - Dialogue vs narration regex parses quotes and applies distinct pitch, rate, and volume multipliers from `VOICE_PROFILES`.
   - SSML tags are stripped before feeding native Android/iOS TTS engines to eliminate raw XML vocalization bugs.

2. **Deterministic Ambient Audio Bed Resolution**:
   - Ambient sound beds are resolved using a deterministic fallback order: `beat.music -> SCENE_BED_MAP[beat.scene] -> STAGE_BED_MAP[story.stage] -> 'night'`.
   - Smooth volume transitions and sleep wind-down (`windDownFinalBeat`) fade volume over 3500ms, avoiding abrupt audio cuts during sleep transition.

3. **Cloud AI Voice Integration & Zero-Failure Guarantee**:
   - Cloud TTS is optional and toggled via `useSettingsStore.aiVoice`.
   - Local caching checks disk before network dispatch, guaranteeing 0 network calls and 0 quota consumption for previously cached audio.
   - All network/quota/auth failures cleanly resolve to `null`, triggering immediate fallback to Layer 1 on-device narration without throwing errors or interrupting audio playback.

4. **Dedicated Novel Reading Experience**:
   - Long-form stories (`form === 'novel'`) are routed directly to `NovelReader`, giving listeners a clean paginated interface with font scaling, manual navigation, read-aloud controls, and auto-advancing pages synced with narration.

---

## 3. Caveats

- **Network Availability on First Cloud TTS Synthesis**: Google Cloud TTS requires network access for initial uncached synthesis. Once cached in `FileSystem.cacheDirectory`, playback operates entirely offline.
- **No caveats** regarding compatibility with `expo-audio`, `expo-speech`, or `expo-file-system`.

---

## 4. Conclusion

Milestone 2 (AI Narrator & Novel Reader) is fully implemented and production-ready:
- Layer 1 enhanced on-device segmented speech with strategic pauses and character modulation is fully functional.
- Layer 2 Google Cloud TTS free tier integration with local caching, prefetching, and graceful fallback is fully active.
- Settings store and UI screens support the "AI Voice (Beta)" toggle with full bilingual English/Nepali localization.
- Dedicated `NovelReader` paginated component is built and mounted for all novel-format stories.

---

## 5. Verification Method

To verify the Milestone 2 implementation independently:

1. **TypeScript Check**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected*: 0 type errors.

2. **Milestone 2 E2E Verification**:
   ```bash
   node scripts/verify_e2e.js
   ```
   *Expected*: All assertions for F08-F17, B01-B03, B06-B07, C02, C05, S01, S02, S03 pass with 100% success rate.

3. **File Inspections**:
   - Inspect `lib/narrator/segmenter.ts` for pause timings (300ms, 750ms, 1000ms, 1200ms).
   - Inspect `lib/narrator/cloudTts.ts` for caching and neural voice mapping.
   - Inspect `lib/audio.ts` for `resolveAmbientBed`, `fadeBedVolume`, `windDownFinalBeat`.
   - Inspect `components/reader/NovelReader.tsx` for font scaling [14-28px] and Read Aloud integration.
