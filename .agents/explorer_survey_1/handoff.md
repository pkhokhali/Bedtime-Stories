# Codebase Survey & R1 Technical Architecture Report

## 1. Observation

Direct observations from codebase inspection across configurations, entry points, navigation routes, store modules, and asset catalogs:

### 1.1 Package & Configuration Environment
- **`package.json`** (`d:\Antigravity Projects\Bedtime Stories\package.json:1-63`):
  - React Native: `0.86.2`
  - React: `19.2.3`
  - Expo SDK: `~57.0.12`
  - TypeScript: `~6.0.3`
  - Core Graphics / Animations: `react-native-reanimated` (`4.5.1`), `react-native-svg` (`15.15.4`), `expo-linear-gradient` (`~57.0.1`), `react-native-gesture-handler` (`~2.32.0`)
  - Audio Engine: `expo-audio` (`~57.0.3`), `expo-speech` (`~57.0.1`)
  - State & Storage: `zustand` (`^5.0.15`), `@react-native-async-storage/async-storage` (`2.2.0`)
  - Fonts: `@expo-google-fonts/nunito` (`^0.4.2`), `@expo-google-fonts/noto-sans-devanagari` (`^0.4.1`), `@expo/vector-icons` (`^15.0.2`)
- **`app.json`** (`d:\Antigravity Projects\Bedtime Stories\app.json:1-64`):
  - App Name: `"Saanjh: Bedtime Stories | कथा"`
  - Package: `com.pkhokhali.saanjh`
  - Splash screen plugin config:
    ```json
    [
      "expo-splash-screen",
      {
        "image": "./assets/images/splash-icon.png",
        "resizeMode": "contain",
        "backgroundColor": "#1A1410"
      }
    ]
    ```
  - Audio plugin config:
    ```json
    [
      "expo-audio",
      {
        "recordAudioAndroid": false,
        "enableBackgroundPlayback": false
      }
    ]
    ```
  - Router experiment: `"typedRoutes": true`
- **`tsconfig.json`** (`d:\Antigravity Projects\Bedtime Stories\tsconfig.json:1-22`):
  - Path alias: `"@/*": ["./*"]`
  - Excludes: `node_modules`, `admin`, `backend`, `.agents`
- **Baseline Typecheck**:
  - `npx tsc --noEmit` executed and passed with exit code 0 (0 errors).

### 1.2 Asset Inventory
- **`assets/audio/`**:
  - `assets/audio/chime.wav`: 16-bit WAV intro chime sting (already mapped in `lib/sounds.ts:11` and referenced by `playChime()` in `lib/audio.ts:170-172`).
  - `assets/audio/night.wav`, `assets/audio/moon.wav`, `assets/audio/river.wav`, `assets/audio/courtyard.wav`, `assets/audio/wind.wav`: Ambient looping beds.
  - `assets/audio/roar.wav`, `assets/audio/splash.wav`, `assets/audio/ripple.wav`: SFX audio assets.
- **`assets/images/`**:
  - `icon.png`, `adaptive-icon.png`, `splash-icon.png`, `favicon.png`.
- **`assets/videos/`**:
  - `sleepy_cloud_1.mp4` through `sleepy_cloud_5.mp4` for video stories.

### 1.3 Entry Points & Navigation Tree
- **Root Layout** (`app/_layout.tsx:1-64`):
  - Loads Google fonts: `Nunito_500Medium`, `Nunito_600SemiBold`, `Nunito_700Bold`, `Nunito_800ExtraBold`, `NotoSansDevanagari_400Regular`, `NotoSansDevanagari_600SemiBold`, `NotoSansDevanagari_700Bold`.
  - Hydrates settings (`hydrate()`), speech voices (`hydrateVoices()`), and remote catalog (`fetchRemoteCatalog()`).
  - Calls `SplashScreen.hideAsync().catch(() => undefined)` immediately on mount in `useEffect`.
  - Mounts `<GestureHandlerRootView>` wrapping an Expo Router `<Stack>` with screens:
    - `index` (`app/index.tsx`): Home Screen featuring hero story banner, category carousels, and quick navigation.
    - `library` (`app/library.tsx`): Library browse screen with age-band switcher and story cards.
    - `settings` (`app/settings.tsx`): Settings screen with language and storyteller configuration.
    - `story-detail/[id]` (`app/story-detail/[id].tsx`): Story details preview screen with cover image, badges, moral lesson, and favorite toggle.
    - `story/[id]` (`app/story/[id].tsx`): Story player dispatcher (`MediaStoryPlayer`, `NovelReader`, `StoryPlayer`).

### 1.4 Audio Subsystem (`lib/audio.ts` & `lib/sounds.ts`)
- `lib/sounds.ts` provides `soundFiles` dictionary linking `SoundId` enum keys to local audio files.
- `lib/audio.ts` manages singleton `AudioPlayer` from `expo-audio`, volume fades via `fadeBedVolume`, sound effects via `playSfx(id)`, and already exports:
  ```ts
  export async function playChime() {
    await playSfx('chime');
  }
  ```
- All audio calls use graceful catch handlers so audio playback failures do not interrupt UI flows.

---

## 2. Logic Chain

1. **Navigation Non-Interference**:
   - Creating a separate route (e.g. `/splash`) that performs `router.replace('/')` can trigger navigation stack mounting glitches, route history pollution, or flash unstyled screens.
   - Conversely, mounting an animated splash ritual overlay (`<SplashRitual onFinish={...} />`) directly within `app/_layout.tsx` over the `<Stack>` allows the underlying Home Screen (`app/index.tsx`) and catalog stores to initialize, compute categories, and render behind the overlay without user-visible lag.
   - When the ritual finishes or the user taps to skip, the overlay animates its opacity from 1 to 0 via Reanimated `withTiming(0, { duration: 450 })` and unmounts, revealing the pre-rendered Home screen instantaneously.

2. **Animation Engine Capabilities**:
   - `react-native-reanimated` 4.5.1 and `react-native-svg` 15.15.4 are already fully operational in the app (used in `ForestStage.tsx`, `Fireflies.tsx`, `TreeLine.tsx`).
   - SVG vector paths (`Svg`, `Path`, `G`, `Defs`, `RadialGradient`, `LinearGradient`, `Stop`) allow high-definition rendering of a glowing storybook cover, spine, filigree corner ornaments, and parchment pages.
   - Reanimated `useSharedValue` and `useAnimatedStyle` allow 60 FPS hardware-accelerated 3D-like book page rotations (`transform: [{ perspective: 800 }, { rotateY: ... }]`), stardust particle float physics, and brand title reveals on the UI thread without JavaScript bridge bottleneck.

3. **Audio Synchronization**:
   - `playChime()` in `lib/audio.ts` directly plays `assets/audio/chime.wav` using `expo-audio`.
   - Triggering `playChime()` at ~400ms-600ms as the storybook cover swings open creates an enchanting multisensory feedback loop.
   - Wrapping audio triggers in try/catch and respecting device silent mode ensures failure-proof execution across all devices.

4. **Bilingual Branding Consistency**:
   - The typography system already includes loaded font families: `Nunito_800ExtraBold` for English and `NotoSansDevanagari_700Bold` for Nepali.
   - Displaying both `"Saanjh"` and `"साँझ - Bedtime Stories & Novels"` / `"सुत्ने बेलाको कथा र उपन्यास"` aligns with the project's bilingual design standard in `constants/theme.ts` and `constants/ui.ts`.

---

## 3. Detailed Technical Analysis & Specification for Requirement R1

### Component Architecture: `components/splash/SplashRitual.tsx`

```
┌──────────────────────────────────────────────────────────────┐
│                    RootLayout (_layout.tsx)                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    Stack Navigation                    │  │
│  │  (index, library, settings, story-detail, story)       │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │             SplashRitual (Absolute Overlay)            │  │
│  │  - Nocturnal Gradient Backdrop & Ambient Orb Glow      │  │
│  │  - SVG Magical Storybook (Cover swing + Page fan)      │  │
│  │  - Stardust & Sparkle Particle Field (Upward drift)    │  │
│  │  - Bilingual Brand Reveal ("Saanjh" / "साँझ")          │  │
│  │  - Chime Audio Sting (assets/audio/chime.wav)          │  │
│  │  - Tap-to-Skip Touch Handler & 450ms Crossfade         │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Motion & Choreography Timeline

| Timestamp | Phase | Visual / Audio Action | Implementation |
|---|---|---|---|
| **0ms** | Initialization | Native splash hidden, React Native `SplashRitual` renders full-screen nocturnal canvas (`#0A0E1A` -> `#1A1410`). | `StyleSheet.absoluteFillObject`, `LinearGradient` |
| **200ms - 900ms** | Book Unfold | Book cover rotates open (`rotateY: 0deg -> -110deg`), inner pages glow amber (`#E8A04A`), central ambient radiance pulses outward. | Reanimated `useSharedValue`, SVG `transform`, `RadialGradient` |
| **450ms** | Audio Sting | Ambient chime sound triggers softly. | `playChime()` from `lib/audio.ts` |
| **600ms - 2200ms** | Stardust Radiance | 16-20 stardust sparkles and glowing particle dots burst and float upwards from the open pages with sine wave lateral float. | Dynamic particle nodes with Reanimated `translateY`, `translateX`, `opacity`, `scale` |
| **900ms - 1800ms** | Bilingual Reveal | English "Saanjh" and Devanagari "साँझ" with subtitle fade in and rise smoothly into position. | Reanimated `opacity: 0 -> 1`, `translateY: 16 -> 0` |
| **2600ms - 3100ms** | Auto-Crossfade | Entire splash container fades opacity `1 -> 0` over 500ms, revealing the pre-rendered Home screen. | `containerOpacity.value = withTiming(0, { duration: 500 }, () => runOnJS(onFinish)())` |
| **Anytime** | User Tap-to-Skip | Tapping the screen instantly initiates smooth 300ms fadeout to avoid frustrating repeat users. | `Pressable` wrapping with immediate `skip()` handler |

---

## 4. Feature Inventory & Dependency Matrix (Overhaul Project)

| # | Feature | Scope | Prerequisites / Dependencies | Target Status |
|---|---|---|---|---|
| **F1** | **Magical Storybook Animated Splash Ritual (R1)** | `components/splash/SplashRitual.tsx`, `app/_layout.tsx`, `lib/audio.ts` | `react-native-reanimated`, `react-native-svg`, `assets/audio/chime.wav` | Ready for Implementation |
| **F2** | **Atmospheric Bedtime Background & Pine Silhouettes (R2)** | `components/common/AtmosphericBackground.tsx`, `app/index.tsx`, `app/library.tsx`, `app/settings.tsx`, `app/story-detail/[id].tsx` | `react-native-reanimated`, `react-native-svg`, `expo-linear-gradient` | Surveyed |
| **F3** | **Dedicated Full-Screen Search & Discovery Modal (R3)** | `components/search/SearchModal.tsx`, `components/search/SearchTriggerButton.tsx`, `data/catalog.ts` | `zustand`, `lucide-react-native`/`@expo/vector-icons`, `react-native-modal` or Reanimated overlay | Surveyed |
| **F4** | **Bedtime Sleep Timer & Fadeout Controller (R4.1)** | `store/useSleepTimerStore.ts`, `lib/sleepTimer.ts`, `components/player/PlayerChrome.tsx`, `app/_layout.tsx` | `expo-audio`, `zustand`, `lib/audio.ts` | Surveyed |
| **F5** | **Continuous Sleep Soundscapes White Noise Player (R4.2)** | `components/soundscapes/SoundscapesPlayer.tsx`, `lib/audio.ts`, `assets/audio/` (`night`, `river`, `wind`, `moon`, `courtyard`) | `expo-audio`, `zustand` | Surveyed |
| **F6** | **Bedtime Night Light Mode (R4.3)** | `components/nightlight/NightLightModal.tsx`, `app/settings.tsx` | `expo-keep-awake`, `react-native-reanimated` | Surveyed |
| **F7** | **Revamped Card-Based Settings Screen (R4.4)** | `app/settings.tsx`, `store/useSettingsStore.ts` | `constants/theme.ts`, `constants/ui.ts` | Surveyed |

---

## 5. Potential Conflicts & Missing Packages Check

- **Reanimated & React 19 Compatibility**: `react-native-reanimated` 4.5.1 is configured and fully compatible with React 19 in Expo SDK 57.
- **Audio Playback**: `expo-audio` ~57.0.3 is configured in `app.json` plugins and working in `lib/audio.ts`. No deprecated `expo-av` conflicts.
- **Icon Libraries**: `@expo/vector-icons` provides complete coverage for Ionicons, MaterialIcons, Feather. No additional icon packages required.
- **SVG Support**: `react-native-svg` 15.15.4 is installed and verified.
- **Fonts**: All Google fonts for English (`Nunito`) and Nepali (`NotoSansDevanagari`) are registered in `app/_layout.tsx`.
- **Verdict**: Zero package conflicts, zero missing dependencies.

---

## 6. Caveats

- **Audio Playback in Silent Mode on iOS**: `expo-audio` requires `setAudioModeAsync({ playsInSilentMode: true })`, which is already implemented in `lib/audio.ts:58-63`.
- **First Launch Font Loading**: Fonts load asynchronously in `RootLayout`. The splash ritual should render fallback system fonts gracefully if fonts take >100ms, or render immediately once `useFonts` returns true.
- **No Caveats on Architecture**: The in-tree overlay design in `RootLayout` cleanly isolates splash animation logic from route navigation.

---

## 7. Conclusion

The codebase is well-structured, modern (Expo SDK 57, React Native 0.86, Reanimated 4.5), and in a healthy state (`npx tsc --noEmit` passes with 0 errors).
Implementing **Requirement R1 (Magical Storybook Animated Splash Ritual)** as an in-tree overlay in `app/_layout.tsx` using `react-native-reanimated`, `react-native-svg`, and `assets/audio/chime.wav` satisfies all user and acceptance criteria without navigation stack blocking or double-mounting.

---

## 8. Verification Method

1. **TypeScript Static Analysis**:
   ```bash
   npx tsc --noEmit
   ```
   Must pass with 0 errors.

2. **Component Inspection**:
   Inspect `d:\Antigravity Projects\Bedtime Stories\app\_layout.tsx` to verify `<SplashRitual>` overlay mounting and clean lifecycle dismissal.

3. **Audio Verification**:
   Inspect `d:\Antigravity Projects\Bedtime Stories\assets\audio\chime.wav` and `d:\Antigravity Projects\Bedtime Stories\lib\audio.ts` to verify `playChime()` execution.
