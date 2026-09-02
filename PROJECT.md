# Project: Saanjh Bedtime Stories UI/UX, Graphic Design & Feature Overhaul

## Architecture Overview
Saanjh is a world-class bilingual (Nepali & English) Bedtime Stories and Novels mobile application built on Expo SDK 57, React Native 0.86, React 19, TypeScript, React Native Reanimated 4.5, React Native SVG 15, and Expo Audio.

### Layered Architecture
- **Presentation Layer**: Expo Router (`app/_layout.tsx`, `app/index.tsx`, `app/library.tsx`, `app/settings.tsx`, `app/story-detail/[id].tsx`, `app/story/[id].tsx`).
- **Visual Atmosphere Layer**: `<AtmosphericBackground>` providing a deep celestial night gradient, 32 Reanimated native UI-thread twinkling stars, and layered SVG Himalayan mountain pine silhouettes.
- **Splash & Ritual Layer**: `<SplashRitual>` mounted as an in-tree Reanimated overlay inside `RootLayout` with SVG opening storybook, upward drifting stardust sparkle particle field, bilingual logo reveal, and intro chime sting (`assets/audio/chime.wav`).
- **Discovery Layer**: `<SearchDiscoveryModal>` with floating amber FAB trigger, header triggers, real-time bilingual fuzzy search engine (`lib/searchEngine.ts`) across all 24+ stories, 6 quick filter pills, trending bedtime stories, and AsyncStorage-persisted recent queries.
- **Sleep & Bedtime Features Layer**:
  - Bedtime Sleep Timer with live header countdown badge (`⏰ MM:SS`) and 10s audio volume fade-out.
  - Continuous Sleep Soundscapes player with 5 looping ambiance beds (`rain`, `river`, `night`, `wind`, `chime`) and background playback.
  - Bedtime Night Light Mode with full-screen Warm Amber / Moonlight glow, soft brightness slider, breathing pulse, and tap-to-exit.
  - Revamped card-based Settings Screen (`app/settings.tsx`) grouped into 4 distinct cards with AsyncStorage persistence (`saanjh.settings.v1`).
- **Data & Audio Subsystem**: `data/catalog.ts` (24 stories with bilingual metadata), `lib/audio.ts` (`expo-audio`), `lib/sounds.ts`, `lib/speech.ts`.

---

## Feature Inventory

Every requirement from `ORIGINAL_REQUEST.md` is inventoried and mapped to a specific milestone:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Animated Glowing Storybook | Reanimated & SVG opening glowing storybook animation | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Stardust Sparkle Particles | Floating magical stardust/sparkle particle field radiating from pages | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Bilingual Logo Reveal | Animated reveal of "Saanjh" and "साँझ - Bedtime Stories & Novels" | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Splash Chime Audio Sting | Soft ambient intro chime audio (`assets/audio/chime.wav`) played during opening | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Splash Tap-to-Skip & Crossfade | Immediate tap-to-skip and 500ms smooth crossfade into app without navigation glitches | M1 | ORIGINAL_REQUEST §R1 |
| 6 | Celestial Nocturnal Palette | Deep celestial gradient (`#060913` -> `#0c1222` -> `#121A2F` with `#E8A04A` glow) | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Animated Twinkling Stars | 32 UI-thread Reanimated stars with opacity/scale sine oscillations at 60 FPS | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Himalayan Pine Silhouettes | Layered SVG vector silhouettes of mountain ridges and Himalayan pine conifers | M2 | ORIGINAL_REQUEST §R2 |
| 9 | Reusable Background Container | Shared `<AtmosphericBackground>` container applied across Home, Library, Settings, Story Detail | M2 | ORIGINAL_REQUEST §R2 |
| 10 | Floating Search Trigger (FAB) | Glowing warm amber floating search button on Home and Library | M3 | ORIGINAL_REQUEST §R3 |
| 11 | Full-Screen Search Modal | Modal with blur/dim backdrop, auto-focused bilingual search input | M3 | ORIGINAL_REQUEST §R3 |
| 12 | Real-time Bilingual Search | Search matching English & Nepali Devanagari titles, subtitles, tags, IDs across 24+ stories | M3 | ORIGINAL_REQUEST §R3 |
| 13 | 6 Quick Filter Pills | Filter pills: Toddlers (2-4), Kids (6-8), Novels & Parents, Folk Tales, Animal Stories, Audio Only | M3 | ORIGINAL_REQUEST §R3 |
| 14 | Trending & Recent Searches | Displays trending bedtime recommendations and AsyncStorage-persisted recent searches | M3 | ORIGINAL_REQUEST §R3 |
| 15 | Direct Story Navigation | Selecting any search result navigates directly to that story's preview screen | M3 | ORIGINAL_REQUEST §R3 |
| 16 | Bedtime Sleep Timer | Configurable timer (15m, 30m, 45m, 60m, End of Story) with live header countdown | M4 | ORIGINAL_REQUEST §R4 |
| 17 | 10-Second Volume Fade Out | Smooth 10s audio fade-out to silence and stop on sleep timer expiry | M4 | ORIGINAL_REQUEST §R4 |
| 18 | Continuous Sleep Soundscapes | Looping white noise player with 5 ambient beds (rain, river, night, wind, chime) | M4 | ORIGINAL_REQUEST §R4 |
| 19 | Rain Audio Synthesis | Pure JS synthesis of `rain.wav` registered in `types/story.ts` & `lib/sounds.ts` | M4 | ORIGINAL_REQUEST §R4 |
| 20 | Bedtime Night Light Mode | Full-screen warm amber & moonlight screen glow with soft brightness slider & tap-to-exit | M4 | ORIGINAL_REQUEST §R4 |
| 21 | Settings Visual Cards Revamp | 4 visual cards (Audio & Voices, Sleep Timer & Ambiance, Language & Age Group, Display & Night Light) | M4 | ORIGINAL_REQUEST §R4 |
| 22 | AsyncStorage Settings Persistence | Complete persistence and hydration under `saanjh.settings.v1` | M4 | ORIGINAL_REQUEST §R4 |
| 23 | E2E Test Suite (Tiers 1-4) | Comprehensive 4-tier opaque-box test suite verifying all features and corner cases | M5 | ORIGINAL_REQUEST §Acceptance |
| 24 | Adversarial Hardening (Tier 5) | White-box adversarial testing and bug hunting | M5 | Orchestration Strategy |
| 25 | Release Build Verification | `npx tsc --noEmit` passing with 0 errors & `npm run build:apk` release packaging | M5 | ORIGINAL_REQUEST §Build |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| **M1** | Magical Storybook Splash Ritual (R1) | `components/splash/SplashRitual.tsx`, `components/splash/AnimatedStorybook.tsx`, `components/splash/StardustParticles.tsx`, `app/_layout.tsx`, `lib/audio.ts` | Survey | DONE |
| **M2** | Atmospheric Bedtime Background (R2) | `components/background/AtmosphericBackground.tsx`, `components/background/TwinklingStarfield.tsx`, `components/background/HimalayanHorizon.tsx`, `app/index.tsx`, `app/library.tsx`, `app/settings.tsx`, `app/story-detail/[id].tsx`, `constants/theme.ts` | Survey | DONE |
| **M3** | Full-Screen Search & Discovery Modal (R3) | `components/search/SearchDiscoveryModal.tsx`, `components/search/SearchTriggerFAB.tsx`, `lib/searchEngine.ts`, `app/index.tsx`, `app/library.tsx` | M2 | DONE |
| **M4** | Sleep Features & Settings Revamp (R4) | `store/useSleepTimerStore.ts`, `store/useSettingsStore.ts`, `lib/sleepTimer.ts`, `lib/audio.ts`, `lib/sounds.ts`, `types/story.ts`, `scripts/make-audio.js`, `components/sleep/SleepTimerHeaderBadge.tsx`, `components/sleep/SoundscapesPlayer.tsx`, `components/sleep/NightLightModal.tsx`, `app/settings.tsx`, `app/_layout.tsx` | M2 | DONE |
| **M5** | Final E2E Suite & Release APK Build | `scripts/verify_e2e.js`, `TEST_READY.md`, `npx tsc --noEmit`, `npm run build:apk`, Git commit & push | M1, M2, M3, M4 | PLANNED |

---

## Interface Contracts

### 1. Splash Ritual Contract (`components/splash/SplashRitual.tsx`)
```ts
export interface SplashRitualProps {
  onFinish: () => void;
  autoPlayAudio?: boolean;
}
// Mounted inside app/_layout.tsx as an absolute overlay
// On tap or animation complete: triggers 450ms crossfade and calls onFinish()
```

### 2. Atmospheric Background Contract (`components/background/AtmosphericBackground.tsx`)
```ts
export interface AtmosphericBackgroundProps {
  children: React.ReactNode;
  showStars?: boolean;
  showHorizon?: boolean;
  intensity?: 'full' | 'subtle' | 'dim';
  style?: StyleProp<ViewStyle>;
}
```

### 3. Search Engine Contract (`lib/searchEngine.ts`)
```ts
export interface SearchFilterOptions {
  query?: string;
  pill?: 'all' | 'toddlers' | 'kids' | 'novels_parents' | 'roots' | 'animals' | 'audio_only';
}

export function searchCatalog(catalog: Story[], options: SearchFilterOptions): Story[];
export function getTrendingStories(catalog: Story[]): Story[];
```

### 4. Sleep Timer & Soundscapes Store Contract (`store/useSleepTimerStore.ts`)
```ts
export type SleepTimerDuration = 'off' | '15m' | '30m' | '45m' | '60m' | 'endOfStory';

export interface SleepTimerStore {
  duration: SleepTimerDuration;
  remainingSeconds: number | null;
  isActive: boolean;
  isFadingOut: boolean;
  setDuration: (duration: SleepTimerDuration) => void;
  tick: () => void;
  cancelTimer: () => void;
  notifyStoryEnded: () => void;
}
```

### 5. Settings Store Contract (`store/useSettingsStore.ts`)
```ts
export interface SettingsState {
  language: 'en' | 'ne';
  ageBand: AgeBand;
  voicePace: 'slow' | 'gentle' | 'clear';
  voiceGender: 'female' | 'male';
  nightSounds: boolean;
  keepAwake: boolean;
  aiVoice: boolean;
  sleepTimerDuration: SleepTimerDuration;
  activeSoundscape: 'rain' | 'river' | 'night' | 'wind' | 'chime' | null;
  soundscapeVolume: number;
  nightLightColor: 'amber' | 'moonlight';
  nightLightBrightness: number;
  hydrate: () => Promise<void>;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
}
```

---

## Code Layout

```
Bedtime Stories/
├── app/
│   ├── _layout.tsx                 # Root layout (Splash overlay, Global Sleep Timer, Audio hydration)
│   ├── index.tsx                   # Home screen (Atmospheric background, Search triggers, Header badge)
│   ├── library.tsx                 # Library screen (Atmospheric background, Search triggers)
│   ├── settings.tsx                # Revamped 4-card Settings screen
│   ├── story-detail/[id].tsx       # Story preview screen with Atmospheric background
│   └── story/[id].tsx              # Story player
├── components/
│   ├── splash/
│   │   ├── SplashRitual.tsx        # Main animated splash overlay
│   │   ├── AnimatedStorybook.tsx   # Reanimated 3D book cover & page turn
│   │   └── StardustParticles.tsx   # Rising sparkle particle effect
│   ├── background/
│   │   ├── AtmosphericBackground.tsx # Master background wrapper
│   │   ├── TwinklingStarfield.tsx  # 32 UI-thread Reanimated twinkling stars
│   │   └── HimalayanHorizon.tsx    # SVG mountain & pine silhouettes
│   ├── search/
│   │   ├── SearchDiscoveryModal.tsx# Full-screen search & discovery modal
│   │   ├── SearchTriggerFAB.tsx    # Floating action button
│   │   └── QuickFilterPills.tsx    # 6 filter pills
│   ├── sleep/
│   │   ├── SleepTimerHeaderBadge.tsx # Live countdown indicator chip
│   │   ├── SoundscapesPlayer.tsx   # Continuous white noise player
│   │   └── NightLightModal.tsx     # Full-screen amber/moonlight glow modal
├── store/
│   ├── useSettingsStore.ts         # Settings state + AsyncStorage persistence
│   └── useSleepTimerStore.ts       # Global sleep timer store & 10s fade logic
├── lib/
│   ├── searchEngine.ts             # Real-time bilingual fuzzy search & filter
│   ├── sleepTimer.ts               # Sleep timer tick & fade orchestration
│   ├── audio.ts                    # Expo audio player engine & volume fading
│   └── sounds.ts                   # Sound registry (rain, river, night, wind, chime)
├── data/
│   └── catalog.ts                  # 24 bilingual story catalog records
├── scripts/
│   ├── make-audio.js               # Audio synthesis script (including rain.wav)
│   └── verify_e2e.js               # Comprehensive 4-tier E2E test runner
└── package.json
```
