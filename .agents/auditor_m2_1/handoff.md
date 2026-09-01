# Forensic Audit Report: Milestone 2 (AI-Powered Story Narrator & Novel Reader)

**Work Product**: Milestone 2 codebase changes across `lib/narrator/`, `lib/speech.ts`, `lib/audio.ts`, `hooks/useStoryPlayback.ts`, `components/reader/NovelReader.tsx`, `app/settings.tsx`, `store/useSettingsStore.ts`, `app/story/[id].tsx`, `constants/ui.ts`, `components/player/StoryPlayer.tsx`  
**Profile**: General Project  
**Integrity Mode**: Development (per `ORIGINAL_REQUEST.md`)  
**Verdict**: **CLEAN**

---

## 1. Observation

Direct forensic observations across the Milestone 2 codebase:

1. **Layer 1: Enhanced On-Device Segmented Speech & Bedtime Pacing**:
   - `lib/narrator/types.ts` (lines 4-38): Accurately defines `SpeechSegment`, `VoiceProfile`, `VoiceProfiles`, `CloudTtsOptions`, `NarratorStatus`, and `NarratorState`.
   - `lib/narrator/segmenter.ts`:
     - `cleanSsml` (lines 15-18): Regex `/<[^>]*>/g` strips SSML tags to prevent native TTS vocalization errors.
     - `segmentText` (lines 24-105): Implements genuine punctuation tokenization splitting on `(\.\.\.|…|\n\n|\n|[.!?।॥])`. Assigns bedtime pauses:
       - Paragraph breaks (`\n\n`): 1200ms
       - Single newline (`\n`): 1100ms
       - Ellipsis (`...`, `…`): 1000ms
       - Sentence terminators (`.`, `!`, `?`, `।`, `॥`): 750ms
       - Clause breaks (`,`, `;`, `—`, `-`): 300ms
     - Dialogue detection (lines 34, 41-57): Matches quotes (`"`, `“`, `”`, `'`) and applies character voice role modulation.
     - `VOICE_PROFILES` (lines 4-9): Configures pitch delta, rate multiplier, and volume for `narrator` (0, 1.0, 0.92), `soft` (-0.05, 0.88, 0.85), `rabbit` (+0.18, 1.08, 0.95), and `tiger` (-0.22, 0.86, 1.0).
   - `lib/audio.ts`:
     - `SCENE_BED_MAP` and `STAGE_BED_MAP` (lines 12-36): Maps 13 scene IDs and 7 stage kinds to ambient sound beds (`night`, `moon`, `river`, `courtyard`, `wind`).
     - `resolveAmbientBed` (lines 38-43): Implements deterministic fallback hierarchy: `music` -> `scene` -> `stage` -> `'night'`.
     - `fadeBedVolume` (lines 70-117): Uses stepped interval transitions to smoothly ramp audio bed volume over configurable duration (`durationMs`).
     - `windDownFinalBeat` (lines 119-122): Fades volume to 0.0 over 3500ms and cleanly stops the bed player.
   - `lib/speech.ts`:
     - Generation token cancellation (lines 26, 74, 88, 103, 113, 117, 136, 144, 159): `currentSpeechGen` increment ensures cancelled or skipped speeches immediately halt without overlapping or audio collision.
     - Sequential segment playback (lines 106-144): Executes segments in order with `Speech.speak`, per-role pitch/rate adjustments, and `wait(segment.pauseAfterMs)`.
   - `hooks/useStoryPlayback.ts`:
     - Auto-detects and triggers ambient bed via `resolveAmbientBed(beat.music, beat.scene, stageRef.current)` (lines 39-45).
     - Dispatches background prefetch for upcoming beats when `aiVoice` is active (lines 48-54).
     - Starts bedtime sleep wind-down fade (`fadeBedVolume(0.06, 3500)`) on the final beat (lines 56-60) and finishes with `windDownFinalBeat()` (lines 32, 70).

2. **Layer 2: Cloud AI Neural Voice (Google Cloud TTS Free Tier)**:
   - `lib/narrator/cloudTts.ts`:
     - Synthesizes via Google Cloud TTS API endpoint `https://texttospeech.googleapis.com/v1/text:synthesize` (line 8).
     - Maps neural voices: `en-IN-Neural2-A`/`B` for English and `ne-NP-Standard-A`/`B` for Nepali (lines 77-83).
     - Local caching (lines 18-34, 69-74, 128-131): Generates 32-hex deterministic cache key, checks `FileSystem.getInfoAsync`, and saves synthesized base64 MP3 to `${FileSystem.cacheDirectory}saanjh_tts/`.
     - Background prefetching: `prefetchUpcomingBeats` synthesizes upcoming beats in advance (lines 141-157).
     - Graceful fallback: Returns `null` on missing API key, network error, bad response, or 4s timeout (`AbortController`), allowing `lib/speech.ts` to seamlessly fall back to Layer 1 on-device speech.
     - `playCloudAudio` & `stopCloudAudio` (lines 162-219): Controls playback with `expo-audio` and cleans up listeners.
   - `store/useSettingsStore.ts` (lines 18, 28, 37, 85, 99, 133-136): Implements `aiVoice` boolean flag (defaults to `false`), persisted in AsyncStorage (`saanjh.settings.v1`).
   - `app/settings.tsx` (lines 98-106): Adds "AI Voice (Beta)" switch toggle with bilingual labels (`ui.aiVoice`, `ui.aiVoiceHint`).

3. **Novel Reader Mode**:
   - `components/reader/NovelReader.tsx`:
     - Paginated reader view for novel stories (`form === 'novel'`).
     - Font size scaling `[A-]` and `[A+]` (lines 46-52, 113-132) clamped between 14px and 28px.
     - Prominent "Read Aloud" button (lines 196-224) bound to `useStoryPlayback`.
     - Auto-advancing pages synchronized with beat progression (`playback.index`).
     - Novel progress bar (lines 136-138) and bilingual page indicators (`Page X of Y` / `X / Y पृष्ठ`).
     - Sleep wind-down completion overlay (`SleepFade`) (lines 254-262).
   - `app/story/[id].tsx` (lines 33-39): Directs novel stories (`mergedStory.form === 'novel'`) to `NovelReader`.
   - `constants/ui.ts` (lines 79-88): Complete English/Nepali translations for novel reader controls and settings.

4. **Prohibited Patterns Forensic Checks**:
   - Hardcoded test results: None found. All logic is dynamic and algorithmic.
   - Facade implementations: None found. All methods perform real computation, file caching, state persistence, and audio management.
   - Fabricated verification outputs: None found.
   - Layout compliance: Verified `.agents/` contains solely agent metadata.

---

## 2. Logic Chain

1. **Rhythm and Delivery Compliance**:
   - The strategic pause tokenizer in `lib/narrator/segmenter.ts` accurately addresses the machine-gun delivery problem by enforcing 300ms clause, 750ms sentence/danda, 1000ms ellipsis, and 1200ms paragraph pauses.
   - SSML tags are stripped safely to avoid raw XML vocalization on Android/iOS TTS engines.

2. **Ambient Soundbed Reliability**:
   - The deterministic mapping in `lib/audio.ts` guarantees ambient soundscapes (`SCENE_BED_MAP`, `STAGE_BED_MAP`) are reliably selected for any story beat or stage kind.
   - `fadeBedVolume` and `windDownFinalBeat` provide smooth volume cross-fades and a 3.5s sleep wind-down on the final beat without blocking UI threads.

3. **Zero-Failure Cloud Voice Architecture**:
   - Layer 2 Cloud TTS is fully decoupled from core playback: if the API key is absent, offline, or timed out, the synthesize function cleanly returns `null`, and `lib/speech.ts` falls back to Layer 1 without interruption or crash.
   - Local audio caching prevents redundant network calls and guarantees offline playback for cached beats.

4. **Novel Reader Completeness**:
   - The paginated interface in `components/reader/NovelReader.tsx` satisfies all functional requirements (font scaling, read aloud, page synchronization, bedtime theme, progress indication).

---

## 3. Caveats

- **Physical Audio Hardware Playback**: Forensic verification verified the code paths, mock engine behaviors, state stores, and error handling. Final acoustic evaluation of on-device speech engines on physical Android/iOS hardware will occur during release APK testing.
- **Google Cloud TTS Quota**: Live Google Cloud TTS requires a valid `EXPO_PUBLIC_GOOGLE_TTS_API_KEY` configured in the user's environment. When unconfigured, the system verified graceful fallback to Layer 1 on-device TTS.

---

## 4. Conclusion

All Milestone 2 requirements (R2.1, R2.2, R2.3) have been authentically implemented with high engineering standards. There are no facade implementations, no hardcoded test strings, no unhandled exceptions, and no security violations.

**Verdict: CLEAN**

---

## 5. Verification Method

To independently verify this audit:
1. Review `lib/narrator/segmenter.ts` for punctuation pause timings (300ms clause, 750ms sentence, 1000ms ellipsis, 1200ms paragraph) and voice roles.
2. Review `lib/narrator/cloudTts.ts` for Google Cloud TTS API endpoint, local file caching logic, 4s abort timeout, and fallback handling.
3. Review `lib/audio.ts` for `resolveAmbientBed`, `fadeBedVolume`, and `windDownFinalBeat`.
4. Review `components/reader/NovelReader.tsx` for font scaling bounds [14px - 28px] and Read Aloud integration.
5. Review `app/settings.tsx` and `store/useSettingsStore.ts` for `aiVoice` toggle and persistence.
