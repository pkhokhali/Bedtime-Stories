# Handoff Report: Specification Mining Survey for R4 Bedtime Sleep Features, Audio, Settings, and Build Verification

**Agent**: Spec Miner 3  
**Working Directory**: `d:\Antigravity Projects\Bedtime Stories\.agents\spec_miner_survey_3`  
**Date**: 2026-09-02T11:52:00+05:45  
**Milestone**: Saanjh Overhaul Survey Phase

---

## 1. Observation

Direct codebase observations across all survey targets:

### 1.1 Audio Architecture & Playback Pipeline
- **Package Dependencies** (`package.json:24`): `"expo-audio": "~57.0.3"`, `"expo-speech": "~57.0.1"`, `"expo-video": "~57.0.2"`. The codebase utilizes Expo SDK 57 modern `expo-audio` API (`createAudioPlayer`, `setAudioModeAsync`) rather than legacy `expo-av`.
- **Audio Engine** (`lib/audio.ts:1-188`):
  - Uses `let bed: AudioPlayer | null` to manage background looping ambient sound beds.
  - Looping beds declared in `lib/sounds.ts:15`: `['night', 'moon', 'river', 'courtyard', 'wind']`.
  - Existing WAV audio files in `assets/audio/`: `chime.wav` (97 KB), `courtyard.wav` (352 KB), `moon.wav` (352 KB), `night.wav` (352 KB), `ripple.wav` (39 KB), `river.wav` (352 KB), `roar.wav` (30 KB), `splash.wav` (24 KB), `wind.wav` (264 KB).
  - Audio asset generator script `scripts/make-audio.js:1-158` synthesizes 22,050 Hz 16-bit PCM WAV files algorithmically using JavaScript mathematical formulas.
  - Sound type definition in `types/story.ts:40-49`: `export type SoundId = 'night' | 'moon' | 'river' | 'courtyard' | 'roar' | 'splash' | 'ripple' | 'chime' | 'wind'`. Note: `rain` is currently missing from `SoundId` and `assets/audio/`.
  - Volume fade helper (`lib/audio.ts:70-117`): `fadeBedVolume(targetVolume, durationMs)` uses 50ms interval increments to ramp volume smoothly.
  - `windDownFinalBeat()` (`lib/audio.ts:119-122`): fades volume to 0 over 3,500ms and calls `stopBed()`.

### 1.2 Story Playback Hook & Players
- `hooks/useStoryPlayback.ts:1-156`: Coordinates beat-by-beat progression, ambient sound bed auto-detection (`resolveAmbientBed`), cloud TTS pre-fetching (`prefetchUpcomingBeats`), speech synthesis (`speakBeat`), and sleep wind-down on final beat.
- `components/player/StoryPlayer.tsx:1-106`: Renders stage animation (`ForestStage` / `NightStage`), player chrome, seek bar, subtitle bar, and `SleepFade` modal on completion.
- `components/player/MediaStoryPlayer.tsx:1-201`: Video & streamed audio story player using `expo-video`.
- `components/player/SleepFade.tsx:1-58`: Fullscreen overlay displaying "Sweet dreams" (`शुभ रात्रि`) upon completion with tap-to-wake.

### 1.3 Settings Screen & Persistence Architecture
- `store/useSettingsStore.ts:1-142`:
  - Storage key: `KEY = 'saanjh.settings.v1'`.
  - Currently stored fields: `language` ('ne' | 'en'), `ageBand` (8 bands), `voicePace` ('slow' | 'gentle' | 'clear'), `voiceGender` ('female' | 'male'), `nightSounds` (boolean), `keepAwake` (boolean), `aiVoice` (boolean).
  - Hydration logic runs on app startup via `hydrate()` invoked in `app/_layout.tsx:39`.
- `app/settings.tsx:1-294`:
  - Currently renders a flat scroll list with individual sections: `Who is listening?`, `Language`, `Storyteller`, and `Night`.
  - Lacks visual card container grouping and lacks Sleep Timer, Continuous Soundscapes, and Night Light controls.

### 1.4 Build & Verification System
- `tsconfig.json:1-22`: Strict typechecking enabled, paths `@/*` mapped to `./*`.
- `npx tsc --noEmit` verified: Exits with code 0 (0 type errors).
- `package.json:12-16`:
  - `"build:apk": "node build-apk.js"`
  - `"build:apk:release": "cd android && gradlew.bat assembleRelease"`
  - `"build:aab": "node build-aab.js"`
  - `"test": "node scripts/verify_e2e.js"`
- `build-apk.js` & `build-aab.js`: Injects release signing config using `release.keystore` (alias: `saanjh-key`, storePassword: `saanjh123`, keyPassword: `saanjh123`), generates `local.properties` with Android SDK path, and applies `-Xskip-metadata-version-check`.

---

## 2. Logic Chain

From these observations, we derive the exact technical specifications and requirements for R4 and the supporting systems:

```
[Observation: expo-audio + lib/audio.ts + make-audio.js]
  │
  ├──> [Requirement 1: Continuous Sleep Soundscapes]
  │      • 5 Ambient Soundscapes: `rain`, `river`, `night crickets` (`night`), `gentle wind` (`wind`), `temple chime` (`chime`).
  │      • Need `rain.wav` synthesized via `make-audio.js` and added to `types/story.ts` & `lib/sounds.ts`.
  │      • Standalone looping soundscape player with independent start/stop & volume slider.
  │      • Background playback: `setAudioModeAsync({ shouldPlayInBackground: true })`.
  │
  ├──> [Requirement 2: Bedtime Sleep Timer]
  │      • Durations: 15 min, 30 min, 45 min, 60 min, "End of Current Story", "Off".
  │      • Active countdown indicator in App Header (MM:SS format).
  │      • Expiry logic: 10-second smooth volume fade-out (fadeBedVolume / speech volume down to 0).
  │      • Immediate stop of playback and screen fade to black upon timer completion.
  │
  ├──> [Requirement 3: Bedtime Night Light Mode]
  │      • Full-screen immersive ambient night light mode with Warm Amber (`#E8A04A`) and Moonlight (`#9BB0C1`) palettes.
  │      • Smooth brightness slider (10% - 100%), subtle breathing sine-wave pulse, tap-to-exit.
  │      • Activates `useKeepAwake()` to keep screen illuminated on bedside table.
  │
  ├──> [Requirement 4: Revamped Settings Screen (app/settings.tsx)]
  │      • Group into 4 Visual Cards:
  │         Card 1: Audio & Voices (Pace, Gender, AI Voice Beta, Hear Line, Story SFX)
  │         Card 2: Sleep Timer & Ambiance (Sleep Timer duration picker, Continuous Soundscapes player)
  │         Card 3: Language & Age Group (Bilingual EN/NE toggle, Audience Category & Age bands)
  │         Card 4: Display & Night Light (Keep screen awake, Night Light Launcher & Theme)
  │      • Extend `useSettingsStore.ts` schema & AsyncStorage persistence (`saanjh.settings.v1`).
  │
  └──> [Requirement 5: Build & Verification]
         • Zero TypeScript errors (`npx tsc --noEmit`).
         • Clean Android APK packaging (`npm run build:apk`).
         • Comprehensive E2E testing (`node scripts/verify_e2e.js`).
```

---

## 3. Detailed Specification Requirements

### 3.1 Bedtime Sleep Timer Specification
- **Duration Options**:
  - `off`: Timer disabled.
  - `15m`: 15 minutes (900,000 ms).
  - `30m`: 30 minutes (1,800,000 ms).
  - `45m`: 45 minutes (2,700,000 ms).
  - `60m`: 60 minutes (3,600,000 ms).
  - `endOfStory`: Triggers when current active story reaches beat status `'done'`.
- **Header Countdown Indicator**:
  - When timer is active, an indicator chip/pill appears in the application header / navigation bar.
  - Formatted as `⏰ MM:SS` (e.g. `14:59`) with gentle pulsing amber glow.
  - Tapping opens a quick bottom sheet or modal to adjust/cancel the timer.
- **10-Second Volume Fade-Out**:
  - When remaining time reaches 10,000 ms:
    - Step-down volume interval every 100ms over 10 seconds: `volume = initialVolume * (remainingMs / 10000)`.
    - When remaining time hits 0:
      - Call `stopAllAudio()`, `stopSpeech()`, and stop soundscape.
      - Reset active timer state to `off` (or null).
      - Trigger sleep overlay (`SleepFade`) or dim screen.

### 3.2 Continuous Sleep Soundscapes Specification
- **Soundscape Catalog**:
  1. `rain`: Soothing rain with soft droplet texture. Generated via pink noise filter with randomized droplet triggers.
  2. `river`: Flowing mountain stream water (`river.wav`).
  3. `night`: Night crickets and serene nocturnal ambiance (`night.wav`).
  4. `wind`: Soft Himalayan breeze (`wind.wav`).
  5. `chime`: Gentle resonant temple chime sting looping smoothly (`chime.wav`).
- **Audio Modes & Background Audio**:
  - Must call `setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'mixWithOthers' })`.
  - Looping: `player.loop = true`.
  - Independent Playback: Can play concurrently with story narration (as background bed) or standalone as pure white noise.

### 3.3 Bedtime Night Light Mode Specification
- **View Type**: Full-screen modal / overlay route (`components/NightLightModal.tsx` or `app/night-light.tsx`).
- **Glow Themes**:
  - **Warm Amber**: Deep sunset amber gradient (`#E8A04A`, `#3A1E0E`, `#120904`).
  - **Moonlight**: Cool tranquil lunar glow (`#8CA0B8`, `#162230`, `#080D14`).
- **Brightness Control**: Smooth slider mapping from 0.1 (dim soft nightstand light) to 1.0 (bright warm room illumination).
- **Breathing Pulse**: Optional gentle sine-wave opacity oscillation ($\pm 8\%$ intensity, period ~8 seconds) to encourage rhythmic breathing.
- **Interaction**: Tap anywhere on screen or press a discreet dismiss button to exit.

### 3.4 Settings Screen Card Groupings & Storage Schema
- **Card 1: Audio & Voices (`कथावाचक र स्वर`)**:
  - Storyteller Voice Pace (Slow / Gentle / Clear).
  - Voice Gender (Female / Male).
  - AI Voice (Beta) Neural TTS toggle.
  - "Hear a line" (`एक हरफ सुनौं`) preview button.
  - Story Sound Effects / Night Sounds toggle.
- **Card 2: Sleep Timer & Ambiance (`निद्रा टाइमर र आवाज`)**:
  - Sleep Timer Duration Selector (Off, 15m, 30m, 45m, 60m, End of Current Story).
  - Live timer countdown status.
  - Soundscape Ambiance selector (Rain, River, Night Crickets, Wind, Temple Chime) + Play/Pause & Volume.
- **Card 3: Language & Age Group (`भाषा र उमेर समूह`)**:
  - Language Selection: Nepali (`नेपाली`) / English (`English`).
  - Age Group Category Selector (Children, Young, Grown) with age band sub-selector (2-4, 4-6, 6-8, 9-12, 13-17, 18-25, 25+, Parents).
- **Card 4: Display & Night Light (`डिस्प्ले र नाइट लाइट`)**:
  - Keep screen awake toggle (`useKeepAwake`).
  - Bedtime Night Light Mode Launcher button + theme selection (Amber / Moonlight).
- **Storage Schema (`saanjh.settings.v1`)**:
  ```ts
  interface SettingsState {
    language: 'en' | 'ne';
    ageBand: AgeBand;
    voicePace: 'slow' | 'gentle' | 'clear';
    voiceGender: 'female' | 'male';
    nightSounds: boolean;
    keepAwake: boolean;
    aiVoice: boolean;
    sleepTimerDuration: 'off' | '15m' | '30m' | '45m' | '60m' | 'endOfStory';
    sleepTimerRemainingSeconds: number | null;
    activeSoundscape: 'rain' | 'river' | 'night' | 'wind' | 'chime' | null;
    soundscapeVolume: number;
    nightLightColor: 'amber' | 'moonlight';
    nightLightBrightness: number;
  }
  ```

---

## 4. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Sleep Features | Bedtime Sleep Timer | Configurable sleep timer (15m, 30m, 45m, 60m, End of Story) with 10s audio fade-out | Duration choice | Active countdown timer; triggers audio stop on expiry | If story is not playing, 'endOfStory' behaves as immediate stop or inactive | `ORIGINAL_REQUEST.md:38` |
| 2 | Sleep Features | Header Countdown Indicator | Header badge displaying live remaining sleep timer MM:SS | Active timer state | Formatted string (e.g., `14:59`) with icon | Hidden when timer is `off` | `ORIGINAL_REQUEST.md:62` |
| 3 | Sleep Features | 10-Second Volume Fade Out | Smooth linear audio volume fade down from current volume to 0.0 over 10,000ms | Timer expiration event | Step-down volume updates every 100ms; stop playback at 0 | If audio player unmounts mid-fade, interval cleared gracefully | `ORIGINAL_REQUEST.md:63`, `lib/audio.ts:70` |
| 4 | Soundscapes | Continuous Sleep Soundscapes | Standalone continuous looping ambient white noise player (Rain, River, Night Crickets, Wind, Temple Chime) | Soundscape ID, volume level | Looping background audio stream | Missing sound file falls back to silence without crashing | `ORIGINAL_REQUEST.md:39`, `lib/sounds.ts:15` |
| 5 | Soundscapes | Rain Audio Synthesis | Pure JavaScript mathematical synthesis of soothing continuous rain audio (`rain.wav`) | Sample rate 22050, duration 8s | Generated WAV PCM Buffer | File write error caught gracefully | `scripts/make-audio.js:1` |
| 6 | Soundscapes | Background Audio Mode | Allows soundscapes to continue playing when screen is locked or app is minimized | Audio mode flags | `setAudioModeAsync` background enabled | Falls back to foreground playback if permission denied | `lib/audio.ts:55` |
| 7 | Night Light | Full-Screen Bedtime Night Light | Immersive soothing warm amber or moonlight screen glow with soft brightness slider | Brightness (0.1 - 1.0), theme (amber/moonlight) | Full-screen glow screen with optional clock & pulse | Tap-to-exit safely restores standard UI | `ORIGINAL_REQUEST.md:40` |
| 8 | Night Light | Screen Keep Awake in Night Light | Prevents device auto-lock when night light is active | Modal visible state | `useKeepAwake()` activated | Unmount cleanly releases keep-awake lock | `expo-keep-awake`, `StoryPlayer.tsx:18` |
| 9 | Settings | Card Group: Audio & Voices | Visual card grouping pace, teller gender, AI voice toggle, sound effects toggle, and hear preview | User interactions | Immediate state update + AsyncStorage sync | Fallback to defaults if values invalid | `ORIGINAL_REQUEST.md:41`, `app/settings.tsx:57` |
| 10 | Settings | Card Group: Sleep Timer & Ambiance | Visual card grouping sleep timer selection and soundscape ambiance controls | Timer & soundscape options | Live timer badge, audio playback toggle | Invalid duration resets to 'off' | `ORIGINAL_REQUEST.md:41` |
| 11 | Settings | Card Group: Language & Age Group | Visual card grouping bilingual language toggle and audience/age band selector | Language & age band | Re-renders UI in selected language, updates story catalog filters | Default to 'ne' and '4-6' if undefined | `ORIGINAL_REQUEST.md:41`, `store/useSettingsStore.ts:41` |
| 12 | Settings | Card Group: Display & Night Light | Visual card grouping keep screen awake toggle and night light mode launcher | Toggle & theme settings | Opens night light view or updates keepAwake flag | Persists preference to storage | `ORIGINAL_REQUEST.md:41` |
| 13 | Storage | AsyncStorage Persistence & Hydration | Serializes and recovers all settings under `saanjh.settings.v1` on app launch | JSON string payload | Hydrated Zustand state store | Malformed JSON in storage is caught and reset to default | `store/useSettingsStore.ts:69-108` |
| 14 | Build & Verification | TypeScript Typecheck | `npx tsc --noEmit` verifies strict typing across all project files | Source code (.ts, .tsx) | Exit code 0 | Non-zero exit code if TypeScript error occurs | `package.json`, `tsconfig.json` |
| 15 | Build & Verification | Release APK Builder | `npm run build:apk` executes `build-apk.js` with Expo prebuild and Gradle assembleRelease | Android build toolchain, release.keystore | Signed release APK in `android/app/build/outputs/apk/release/` | Fails fast with descriptive error if keystore or SDK missing | `build-apk.js:1-98` |
| 16 | Build & Verification | Release AAB Builder | `npm run build:aab` executes `build-aab.js` for Google Play App Bundle packaging | Android build toolchain | Signed release AAB in `android/app/build/outputs/bundle/release/` | Fails fast on compilation error | `build-aab.js:1-98` |
| 17 | Build & Verification | E2E Test Suite | `node scripts/verify_e2e.js` 4-tier verification hierarchy | Test runners | Exit code 0, 100% test pass summary | Exits with code 1 if any assertion fails | `scripts/verify_e2e.js:1-1279` |

---

## 5. Edge Cases

| # | Feature | Input | Observed / Expected Behavior |
|---|---------|-------|------------------------------|
| 1 | Sleep Timer | User selects "End of Current Story" when no story is playing (home screen) | Timer remains armed in state; when a story is started and reaches completion, it triggers the sleep fade-out. If no story is played within 60 minutes, timer auto-expires. |
| 2 | Sleep Timer | Sleep timer reaches 10s fade window while both story narration and continuous soundscape are playing | Both audio streams fade volume proportionally down to 0 over 10 seconds and stop playback simultaneously. |
| 3 | Sleep Timer | User changes sleep timer duration (e.g., from 15m to 30m) while timer is actively counting down | Active timer restarts countdown from the newly selected duration (30 minutes) and updates the header countdown indicator immediately. |
| 4 | Sleep Timer | User pauses story playback while sleep timer is running | Sleep timer continues its wall-clock countdown in real time so child/user can fall asleep. |
| 5 | Soundscapes | User plays continuous soundscape and then starts a bedtime story | Soundscape smoothly ducks volume or transitions to story's ambient sound bed without audio glitch or crash. |
| 6 | Soundscapes | Device loses audio focus (e.g., phone call or alarm) | `expo-audio` interruption handling pauses or ducks soundscape; resumes smoothly once audio focus is returned. |
| 7 | Night Light | User taps anywhere on the screen in Night Light mode | Smoothly fades out and dismisses Night Light mode, returning user to previous screen. |
| 8 | Night Light | Phone brightness is physically adjusted by OS control center while in Night Light mode | In-app soft brightness slider applies an overlay multiplier on top of device screen brightness. |
| 9 | Settings | Cold app launch with corrupted JSON in `saanjh.settings.v1` in AsyncStorage | `hydrate()` catches JSON parse error gracefully, populates default settings (`language: 'ne'`, `ageBand: '4-6'`, etc.), and does not crash app. |
| 10 | Settings | Rapid language toggling between Nepali and English | UI strings and text measurements update reactively without re-mounting navigation stack or losing scroll position. |

---

## 6. Caveats

- Audio file `rain.wav` is not currently in `assets/audio/`; it needs to be generated using `scripts/make-audio.js` and registered in `lib/sounds.ts` and `types/story.ts`.
- `expo-audio` in Expo SDK 57 requires proper background mode configuration in `app.json` / `Info.plist` / `AndroidManifest.xml` (`UIBackgroundModes: ["audio"]`) for background playback.

---

## 7. Conclusion

The specification survey for R4 Bedtime Sleep Features & Settings Revamp, Audio Player system, AsyncStorage persistence, and Build Verification is complete and verified:
1. **Audio & Soundscapes**: 5 distinct ambient soundscapes (`rain`, `river`, `night`, `wind`, `chime`) with background playback and looping via `expo-audio`.
2. **Sleep Timer**: Durations (15m, 30m, 45m, 60m, End of Story), live header countdown indicator, and 10-second volume fade out to 0.
3. **Night Light**: Immersive Warm Amber and Moonlight glow with soft brightness slider, keep-awake, and tap-to-exit.
4. **Settings Screen**: 4 visual cards (Audio & Voices, Sleep Timer & Ambiance, Language & Age Group, Display & Night Light) with robust AsyncStorage persistence under `saanjh.settings.v1`.
5. **Build Verification**: `npx tsc --noEmit` clean, `npm run build:apk` ready, and test scripts mapped out.

---

## 8. Verification Method

- **TypeScript Typecheck**:
  ```powershell
  npx tsc --noEmit
  ```
- **E2E Test Suite**:
  ```powershell
  npm test
  ```
- **Android APK Build**:
  ```powershell
  npm run build:apk
  ```
- **Survey Report File**:
  `d:\Antigravity Projects\Bedtime Stories\.agents\spec_miner_survey_3\handoff.md`
