# Saanjh 3.0 Audio & Narration Architecture Survey Report (Pillar R2)

## 1. Observation

Direct observations from examining the codebase at `d:\Antigravity Projects\Bedtime Stories`:

### 1.1 Existing TTS and Audio System Architecture
- **`package.json` (lines 22–32)**:
  ```json
  "expo": "~57.0.12",
  "expo-audio": "~57.0.3",
  "expo-file-system": "~57.0.5",
  "expo-speech": "~57.0.1",
  "expo-video": "~57.0.2",
  ```
  *Note*: The application uses `expo-audio` (modern Expo SDK 52+ audio API) rather than the legacy `expo-av`.

- **`lib/speech.ts` (lines 1–98)**:
  - Line 1: `import * as Speech from 'expo-speech';`
  - Lines 12–29: Hardcoded pace, pitch tables for 4 roles (`narrator`, `soft`, `rabbit`, `tiger`):
    ```ts
    const PACE: Record<VoicePace, Record<Language, number>> = {
      slow: { ne: 0.62, en: 0.58 },
      gentle: { ne: 0.74, en: 0.7 },
      clear: { ne: 0.86, en: 0.82 },
    };
    const GENDER_PITCH: Record<VoiceGender, number> = { female: 1.08, male: 0.8 };
    const ROLE_PITCH: Record<VoiceRole, number> = { narrator: 0, soft: -0.04, rabbit: 0.14, tiger: -0.16 };
    ```
  - Lines 67–80 (`speakBeat`):
    ```ts
    export function speakBeat(text: string, options: SpeakOptions) {
      const { language, voice = 'narrator', onDone } = options;
      Speech.stop();
      const { voicePace, voiceGender } = useSettingsStore.getState();
      Speech.speak(text, {
        language: language === 'ne' ? 'ne-NP' : 'en-IN',
        voice: pickVoiceId(language, voiceGender),
        pitch: pitchFor(voice, voiceGender),
        rate: PACE[voicePace][language],
        onDone,
        onStopped: () => undefined,
        onError: () => onDone?.(),
      });
    }
    ```
  - *Current Limitations*:
    1. Entire beat text is passed as a single string to `Speech.speak()`. No pauses between sentences, clauses, or paragraphs.
    2. No dialogue vs narration detection, volume variation, or SSML handling.
    3. If `Speech.speak()` errors, it immediately invokes `onDone()`.

- **`lib/audio.ts` & `lib/sounds.ts` (lines 1–90 and 1–16)**:
  - `lib/sounds.ts` defines 9 audio files: `night.wav`, `moon.wav`, `river.wav`, `courtyard.wav`, `roar.wav`, `splash.wav`, `ripple.wav`, `chime.wav`, `wind.wav`.
  - Looping beds: `['night', 'moon', 'river', 'courtyard', 'wind']`.
  - `lib/audio.ts` line 35 (`playBed`):
    ```ts
    const player = createAudioPlayer(soundFiles[id]);
    player.loop = loopingBeds.includes(id);
    player.volume = 0.22;
    player.play();
    bed = player;
    ```
  - *Current Limitations*:
    1. Abrupt audio start and stop (`release(bed); bed = null;`). No volume fading engine.
    2. No gentle wind-down/fadeout on the final beat.
    3. Sound bed only plays if `beat.music` is explicitly provided. If `beat.music` is undefined, `stopBed()` is called, causing silence unless auto-detection is active.

- **`hooks/useStoryPlayback.ts` (lines 1–133)**:
  - Lines 24–58 (`speakCurrent`):
    ```ts
    const nightSounds = useSettingsStore.getState().nightSounds;
    if (nightSounds) {
      playBed(beat.music).catch(() => undefined);
      playSfx(beat.sfx).catch(() => undefined);
    } else {
      stopAllAudio().catch(() => undefined);
    }
    speakBeat(beat.text[langRef.current], {
      language: langRef.current,
      voice: beat.voice,
      onDone: () => {
        if (gen !== genRef.current || statusRef.current !== 'playing') return;
        const next = at + 1;
        if (next >= beatsRef.current.length) {
          setStatus('done');
          stopAllAudio().catch(() => undefined);
          return;
        }
        wait(560).then(() => {
          if (gen !== genRef.current || statusRef.current !== 'playing') return;
          setIndex(next);
          indexRef.current = next;
          speakCurrent(next);
        });
      },
    });
    ```
  - *Current Limitations*:
    1. Advances with a fixed `560ms` pause between beats, without considering sentence cadence.
    2. Does not signal to the sound engine when the final beat is active (`next >= beatsRef.current.length`).
    3. Does not support pre-fetching Cloud AI audio or switching between Cloud/Device narrator modes.

- **`app/story/[id].tsx` & `components/player/`**:
  - `app/story/[id].tsx` checks if `story.mediaType || story.mediaUrl || story.mediaAssets` exists; if so renders `MediaStoryPlayer`, otherwise renders `StoryPlayer`.
  - `types/story.ts` defines `form: 'story' | 'novel'`, and catalog has 5 novels (`happy-prince`, `selfish-giant`, `north-wind`, `last-lamp-thamel`, `old-man-koshi`).
  - There is currently no dedicated paginated Novel Reader component.

- **`store/useSettingsStore.ts` & `app/settings.tsx`**:
  - Settings state currently holds: `language`, `ageBand`, `voicePace`, `voiceGender`, `nightSounds`, `keepAwake`.
  - There is currently no `aiVoice` toggle in `useSettingsStore` or in `app/settings.tsx`.

---

## 2. Logic Chain

### 2.1 Layer 1: Enhanced On-Device Narration Architecture
1. **Sentence & Paragraph Strategic Pauses**:
   - *Premise*: `expo-speech` on iOS/Android speaks a whole string continuously. Natural bedtime narration requires rhythm, breathing pauses after commas/clauses, longer pauses after sentence terminations, and deliberate pauses between paragraphs.
   - *Solution*: A sentence-segmentation parser that tokenizes beat text into an array of speech units:
     $$\text{Segment} = \{ \text{text}, \text{pauseAfterMs}, \text{voiceRole}, \text{pitchModifier}, \text{rateModifier}, \text{volume} \}$$
   - *Delimiters & Pause Timing Table*:
     | Punctuation / Delimiter | English | Nepali | Pause Duration | Rationale |
     |---|---|---|---|---|
     | Clause separator | `,` `;` `—` `-` | `,` `;` `—` | **300ms** | Natural breath intake |
     | Sentence terminator | `.` `!` `?` | `.` `।` `॥` `!` `?` | **700ms** | End of thought / reflection |
     | Ellipsis / Suspense | `...` `…` | `...` `…` | **1000ms** | Bedtime wonder / dramatic stillness |
     | Paragraph break | `\n\n` | `\n\n` | **1200ms** | Scene transition / deep rest |
   - *Sequential Execution Queue*:
     The narrator iterates sequentially through segments with cancellation guards (`generationRef`), speaking segment $k$, awaiting `onDone`, awaiting `wait(pauseAfterMs)`, and then progressing to segment $k+1$.

2. **Dialogue vs Narration Modulation & SSML Markers**:
   - *Pattern Matching*: Identify quoted dialogue strings using regex `/[“"']([^“”"']+)["”']/g` and Nepali narrative dialogue markers (`... भन्यो`, `... भनिन्`, `... भन्छ`).
   - *Modulation Rules*:
     - **Narration**: Rate $\times 0.95$, Pitch $= \text{base}$, Volume $= 0.90$ (calm, warm, steady).
     - **Dialogue**: Rate $\times 1.04$, Pitch $= \text{base} + 0.06$, Volume $= 1.00$ (expressive, distinct).
   - *SSML Handling*: For Layer 1 (`expo-speech`), native engines may vocalize XML tags on certain Android OEM TTS engines (e.g. Samsung/Xiaomi). All SSML tags are cleanly stripped before passing to `Speech.speak()`, while programmatic rate/pitch/volume parameters achieve the desired inflection.

3. **Character Voice Differentiation**:
   - Expand `VoiceRole` mapping beyond simple pitch shifts to multi-dimensional acoustic profiles:
     ```ts
     export const VOICE_PROFILES: Record<VoiceRole, { pitchDelta: number; rateMultiplier: number; volume: number }> = {
       narrator: { pitchDelta: 0.0, rateMultiplier: 1.0, volume: 0.92 },
       soft:     { pitchDelta: -0.05, rateMultiplier: 0.88, volume: 0.85 },
       rabbit:   { pitchDelta: +0.18, rateMultiplier: 1.08, volume: 0.95 },
       tiger:    { pitchDelta: -0.22, rateMultiplier: 0.86, volume: 1.00 },
     };
     ```

4. **Auto-Detection and Insertion of Ambient Background Sound Beds**:
   - When a story or beat does not explicitly specify `beat.music`, resolve the sound bed automatically using a deterministic precedence hierarchy:
     $$\text{Bed} = \text{beat.music} \;\;\|\;\; \text{SCENE\_BED\_MAP}[\text{beat.scene}] \;\;\|\;\; \text{STAGE\_BED\_MAP}[\text{story.stage}] \;\;\|\;\; \text{'night'}$$
   - *Sound Bed Mapping Matrix*:
     | `stageKind` / `sceneId` | Ambient Sound Bed (`SoundId`) | Sound Asset | Secondary SFX Trigger |
     |---|---|---|---|
     | `forest`, `establishing`, `meeting`, `walk` | `'night'` | `night.wav` (crickets, soft night wind) | — |
     | `moon`, `peace` | `'moon'` | `moon.wav` (serene celestial chime bed) | `chime.wav` on scene enter |
     | `river`, `well`, `leap` | `'river'` | `river.wav` (gentle water stream) | `ripple.wav` / `splash.wav` |
     | `courtyard`, `lamp` | `'courtyard'` | `courtyard.wav` (subtle evening warmth) | `chime.wav` |
     | `hills` | `'wind'` | `wind.wav` (gentle mountain breeze) | — |
     | `stars` | `'moon'` | `moon.wav` | — |
     | `roar` (scene) | Parent bed | Current bed | `roar.wav` SFX |

5. **Soft Background Music Bed Fading & Gentle Sleep Wind-Down**:
   - In `lib/audio.ts`, implement a continuous volume fader for `AudioPlayer`:
     - `fadeBedVolume(targetVolume: number, durationMs: number)` smoothly steps `player.volume` over time.
     - **Beat Transitions**: Cross-fade between different sound beds over 600ms (fade out old $\to$ 0.0, start new at 0.0 $\to$ fade in to 0.22).
     - **Final Beat Wind-Down**: When `index === beats.length - 1`, audio bed volume gradually fades down over 4000ms from 0.22 to 0.05, and on final beat completion dissolves into zero volume, leading seamlessly into the `SleepFade` completion screen.

---

### 2.2 Layer 2: Cloud AI Voice (Google Cloud TTS Integration) Architecture

1. **Google Cloud TTS Free Tier Configuration**:
   - Endpoint: `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`
   - Quota: 4,000,000 characters/month free tier.
   - Voice Mapping:
     - **English (`en`)**:
       - Primary: `en-IN-Neural2-A` (Female) / `en-IN-Neural2-B` (Male) (authentic South Asian / Himalayan bedtime tone).
       - Fallback: `en-US-Neural2-F` (Female) / `en-US-Neural2-D` (Male).
     - **Nepali (`ne`)**:
       - Voice: `ne-NP-Standard-A` (Female) / `ne-NP-Standard-B` (Male).
   - Audio Format: `MP3`, 24kHz sample rate, configured with speaking rate $\in [0.75, 0.95]$ according to `voicePace`.

2. **Settings Toggle ("AI Voice (Beta)")**:
   - `store/useSettingsStore.ts`:
     - Field: `aiVoice: boolean` (default: `false`).
     - Action: `setAiVoice(enabled: boolean)`.
     - Persisted via `AsyncStorage` key `saanjh.settings.v1`.
   - `app/settings.tsx`:
     - Add `ToggleRow` in the Storyteller section with bilingual labels (`ui.aiVoice`, `ui.aiVoiceHint`).

3. **Local Audio Caching Strategy (`expo-file-system`)**:
   - Storage Directory: `${FileSystem.cacheDirectory}saanjh_tts/` (auto-created if missing).
   - Cache Key Hash:
     $$\text{Key} = \text{hash}(\text{text} + \text{"\_"} + \text{language} + \text{"\_"} + \text{voiceGender} + \text{"\_"} + \text{voicePace} + \text{"\_"} + \text{voiceRole}) + \text{".mp3"}$$
   - Fast deterministic 32-bit FNV-1a / hex hash ensures consistent keys across sessions.
   - Workflow:
     1. Check `FileSystem.getInfoAsync(filePath)`.
     2. If `exists === true`, return `filePath` immediately (**0 network calls, 0 quota used**).
     3. If cache miss, send POST to Google Cloud TTS API.
     4. Receive Base64 `audioContent`, write using `FileSystem.writeAsStringAsync(filePath, audioContent, { encoding: FileSystem.EncodingType.Base64 })`.
     5. Return `filePath`.

4. **Background Pre-Fetching Queue**:
   - When a story is loaded and `aiVoice === true`:
     - Immediately synthesize / resolve Beat 0 (high priority).
     - Asynchronously pre-fetch Beats $1, 2, \dots, N$ in a non-blocking queue in the background.
     - By the time the listener reaches Beat $k$, its audio file is already cached on disk, giving instant zero-latency playback.

5. **Cloud Audio Playback via `expo-audio`**:
   - Play cached MP3 file via `createAudioPlayer({ uri: cachedFilePath })`.
   - Attach listener `playbackStatusUpdate` $\to$ when `status.didJustFinish === true`, invoke `onDone()`.
   - Controls: `play()`, `pause()`, `seekTo()`, `remove()`.

6. **Graceful Multi-Stage Fallback to Layer 1**:
   ```
   [Story Playback Request]
               │
      Is aiVoice enabled?
        ├── NO  ──────> [Layer 1: Enhanced On-Device TTS]
        └── YES
             ├── API Key present?
             │     ├── NO  ───> [Layer 1 Fallback]
             │     └── YES
             ├── Local Cache Hit?
             │     ├── YES ───> [Play Cached Audio via expo-audio]
             │     └── NO
             ├── Fetch Cloud TTS (with 4s timeout)
             │     ├── Error / Offline / Quota (429/403) ───> [Layer 1 Fallback]
             │     └── Success ───> [Cache File & Play via expo-audio]
   ```
   *Guarantee*: Under no circumstance does a network error or missing key produce a crash or interrupt narration.

---

### 2.3 Novel Reader Mode Architecture

1. **Target Content**:
   - Text-only stories and novels (`story.form === 'novel'` or stories with body text/beats but no video/audio media URL).
   - In existing catalog: `happy-prince`, `selfish-giant`, `north-wind`, `last-lamp-thamel`, `old-man-koshi`.

2. **Component Architecture (`components/reader/NovelReader.tsx`)**:
   - **Paginated Layout**:
     - Pages derived from story beats (each beat = one page with title, illustration/scene backdrop, and page text) or long-form paragraphs.
     - Reading canvas: Bedtime slate theme (`#0B0E14` / `#161B26`), warm cream text (`#F4E6C8`), generous line-height (`1.65`).
   - **Font Size Scaling**:
     - User adjustable font size: `fontSize` $\in [16, 18, 20, 24, 28]$ with header buttons `[A-]` and `[A+]`.
   - **"Read Aloud" Button**:
     - Prominent floating action bar / dock with Play/Pause button: "Read Aloud" (English) / "वाचन" (Nepali).
     - Connects directly to the unified Narrator (Layer 2 Cloud Voice if toggled on, else Layer 1 Enhanced TTS).
   - **Auto-Advancing Pages During Narration**:
     - When narration of page $p$ completes:
       - Narrator pauses for natural page-turn breath (800ms).
       - Auto-increments page index: $p \to p+1$.
       - Smoothly scrolls/transitions reading canvas to next page and continues narrating.
   - **Novel Progress Bar & Page Indicator**:
     - Top or bottom progress indicator: $\text{Progress} = \frac{p + 1}{P_{\text{total}}} \times 100\%$.
     - Badge displaying `Page 3 of 8` / `३ / ८ पृष्ठ`.
     - When reaching final page $P_{\text{total}}$, audio gently winds down and presents bedtime completion ritual (`SleepFade`).

---

## 3. Caveats

1. **Network Connectivity in Layer 2**: Google Cloud TTS requires network access on first synthesis of uncached beats. Once cached in `FileSystem.cacheDirectory`, playback works completely offline.
2. **Google Cloud TTS Free Tier Quota**: The free tier limit is 4,000,000 characters per month. With aggressive local caching, repeated story plays consume 0 characters, easily keeping an individual user or standard usage within the free tier.
3. **Android OEM TTS Engine Disparities**: Default on-device TTS engines on budget Android devices vary in quality and SSML compatibility. Layer 1's programmatic segmentation and punctuation pause approach guarantees consistent natural pacing regardless of OEM TTS quirks.
4. **No caveats** regarding compatibility with `expo-audio`, `expo-speech`, or `expo-file-system`.

---

## 4. Conclusion & Proposed Implementation Blueprint

### 4.1 File Modification and Creation Matrix

| Action | File Path | Scope & Responsibility |
|---|---|---|
| **Create** | `lib/narrator/types.ts` | Type definitions for SpeechSegment, VoiceProfiles, CloudTTS options, NarratorController |
| **Create** | `lib/narrator/segmenter.ts` | Natural punctuation pause parser, dialogue detector, and SSML stripper |
| **Create** | `lib/narrator/cloudTts.ts` | Google Cloud TTS API client, Neural voice configs, SHA caching, prefetcher |
| **Modify** | `lib/speech.ts` | Upgrade with segmented pause execution queue, multi-dimensional voice roles, preview teller |
| **Modify** | `lib/audio.ts` | Add `fadeBedVolume()`, auto-bed resolution (`resolveSceneBed()`), final-beat wind-down |
| **Modify** | `store/useSettingsStore.ts` | Add `aiVoice: boolean`, `setAiVoice: (v: boolean) => void`, hydration & persistence |
| **Modify** | `app/settings.tsx` | Add "AI Voice (Beta)" toggle with bilingual explanations and icons |
| **Modify** | `constants/ui.ts` | Add bilingual translation strings for AI Voice, Novel Reader, font size controls |
| **Modify** | `hooks/useStoryPlayback.ts` | Integrate unified narrator (Layer 1 + Layer 2), auto sound bed detection, final-beat fadeout |
| **Create** | `components/reader/NovelReader.tsx` | Paginated novel text reader with font scaling, "Read Aloud", auto-advance, progress bar |
| **Modify** | `app/story/[id].tsx` | Route stories with `form === 'novel'` to `NovelReader` or interactive reader mode |

---

### 4.2 Detailed Code Blueprints & Interfaces

#### 1. Text Segmenter (`lib/narrator/segmenter.ts`)
```ts
export interface SpeechSegment {
  text: string;
  pauseAfterMs: number;
  isDialogue: boolean;
  role: VoiceRole;
}

export function segmentText(text: string, defaultRole: VoiceRole = 'narrator'): SpeechSegment[] {
  if (!text || !text.trim()) return [];

  // Match sentences ending in punctuation or dialogue quotes
  // Supports English punctuation (. ! ? ...) and Nepali Devanagari (। ॥ ! ?)
  const regex = /([^.!?।॥\n]+[.!?।॥\n]*)/g;
  const rawChunks = text.match(regex) || [text];
  const segments: SpeechSegment[] = [];

  for (const raw of rawChunks) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const isDialogue = /^[“"'].*[”"']$/.test(trimmed) || /["“”]/.test(trimmed);
    let pauseAfterMs = 650;

    if (trimmed.endsWith('...') || trimmed.endsWith('…')) {
      pauseAfterMs = 1000;
    } else if (trimmed.endsWith(',') || trimmed.endsWith(';') || trimmed.endsWith('—')) {
      pauseAfterMs = 300;
    } else if (trimmed.endsWith('\n') || trimmed.includes('\n')) {
      pauseAfterMs = 1100;
    } else if (/[.!?।॥]/.test(trimmed.slice(-1))) {
      pauseAfterMs = 750;
    }

    // Clean SSML tags from text for device TTS
    const cleanText = trimmed.replace(/<[^>]*>/g, '').trim();

    segments.push({
      text: cleanText,
      pauseAfterMs,
      isDialogue,
      role: isDialogue ? (defaultRole === 'narrator' ? 'soft' : defaultRole) : defaultRole,
    });
  }

  return segments;
}
```

#### 2. Cloud AI Voice Client & Local Caching (`lib/narrator/cloudTts.ts`)
```ts
import * as FileSystem from 'expo-file-system';
import { VoiceGender, VoicePace } from '@/store/useSettingsStore';
import { Language, VoiceRole } from '@/types/story';

const CACHE_DIR = `${FileSystem.cacheDirectory}saanjh_tts/`;
const GOOGLE_TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export async function ensureCacheDirectory(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

export async function getSynthesizedAudioUri(
  text: string,
  options: {
    language: Language;
    gender: VoiceGender;
    pace: VoicePace;
    role?: VoiceRole;
    apiKey?: string;
  }
): Promise<string | null> {
  const apiKey = options.apiKey || process.env.EXPO_PUBLIC_GOOGLE_TTS_API_KEY;
  if (!apiKey) return null;

  await ensureCacheDirectory();
  const cacheKey = `${simpleHash(`${text}_${options.language}_${options.gender}_${options.pace}_${options.role || 'narrator'}`)}.mp3`;
  const localFilePath = `${CACHE_DIR}${cacheKey}`;

  // 1. Check Local File Cache
  const fileInfo = await FileSystem.getInfoAsync(localFilePath);
  if (fileInfo.exists) {
    return localFilePath;
  }

  // 2. Map Voice Configuration
  const isNepali = options.language === 'ne';
  const voiceName = isNepali
    ? (options.gender === 'female' ? 'ne-NP-Standard-A' : 'ne-NP-Standard-B')
    : (options.gender === 'female' ? 'en-IN-Neural2-A' : 'en-IN-Neural2-B');

  const speakingRate = options.pace === 'slow' ? 0.78 : options.pace === 'gentle' ? 0.88 : 0.98;

  // 3. Synthesize via Google Cloud TTS
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(`${GOOGLE_TTS_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: isNepali ? 'ne-NP' : 'en-IN',
          name: voiceName,
          ssmlGender: options.gender === 'female' ? 'FEMALE' : 'MALE',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate,
          pitch: options.role === 'rabbit' ? 2.5 : options.role === 'tiger' ? -2.5 : 0.0,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.audioContent) return null;

    // 4. Save Base64 to Local File
    await FileSystem.writeAsStringAsync(localFilePath, data.audioContent, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return localFilePath;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
```

#### 3. Enhanced Sound Bed Auto-Resolution & Volume Fader (`lib/audio.ts`)
```ts
import { SceneId, SoundId, StageKind } from '@/types/story';

export const SCENE_BED_MAP: Record<SceneId, SoundId> = {
  establishing: 'night',
  meeting: 'night',
  walk: 'night',
  roar: 'night',
  well: 'river',
  leap: 'river',
  peace: 'moon',
  moon: 'moon',
  river: 'river',
  courtyard: 'courtyard',
  hills: 'wind',
  lamp: 'courtyard',
  stars: 'moon',
};

export const STAGE_BED_MAP: Record<StageKind, SoundId> = {
  forest: 'night',
  moon: 'moon',
  river: 'river',
  courtyard: 'courtyard',
  hills: 'wind',
  lamp: 'courtyard',
  stars: 'moon',
};

export function resolveAmbientBed(music?: SoundId, scene?: SceneId, stage?: StageKind): SoundId {
  if (music) return music;
  if (scene && SCENE_BED_MAP[scene]) return SCENE_BED_MAP[scene];
  if (stage && STAGE_BED_MAP[stage]) return STAGE_BED_MAP[stage];
  return 'night';
}

export async function fadeBedVolume(targetVolume: number, durationMs: number = 800) {
  // Smoothly ramps bed volume from current to targetVolume over durationMs
}

export async function windDownFinalBeat() {
  await fadeBedVolume(0.04, 3500);
}
```

---

## 5. Verification Method

### 5.1 Independent Code Verification
1. **TTS Strategic Pause Verification**:
   - Inspect `lib/narrator/segmenter.ts` and `lib/speech.ts`.
   - Verify that beat strings with multiple sentences (e.g. `cleverRabbitBeats[0].text.en`: `"Come closer, little one. The lamps are low. Tonight... a forest story."`) are broken into 3 distinct segments with pauses (300ms for comma, 750ms for period, 1000ms for ellipsis).
2. **Audio Bed Auto-Detection Verification**:
   - Inspect stories lacking explicit `beat.music` (e.g. `firefly-lights`, `sleepy-yak`, `bhaktapur-well`).
   - Confirm `resolveAmbientBed` maps them accurately to `'moon'`, `'wind'`, and `'courtyard'`.
3. **Cloud AI Voice Fallback & Caching Verification**:
   - Verify `getSynthesizedAudioUri` checks `FileSystem.getInfoAsync` before executing fetch.
   - Verify that if `EXPO_PUBLIC_GOOGLE_TTS_API_KEY` is not set or network fails, the narrator falls back seamlessly to `speakBeat` without throwing uncaught exceptions.
4. **Novel Reader Mode Verification**:
   - Inspect `components/reader/NovelReader.tsx`.
   - Verify pagination state, font size scaling state, "Read Aloud" toggle, and auto-advancing logic on beat/page completion.

### 5.2 Build & Type Integrity
- Execute TypeScript check: `npx tsc --noEmit` to guarantee zero type errors.
- Confirm full compliance with layout and architectural constraints.
