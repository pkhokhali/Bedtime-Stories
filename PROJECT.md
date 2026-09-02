# Project: Saanjh Bedtime Stories — Comprehensive Overhaul

## Architecture
- **Framework**: Expo SDK 57 (React Native 0.86, React 19, TypeScript 5.9, Expo Router v57)
- **Animation Subsystem**: React Native Reanimated v4 (UI-thread worklets for 3D page flip, 22-seed stardust particles, 32-seed starfield oscillations, 8s night light breathing pulse)
- **Vector Graphics**: React Native SVG (4-layer Himalayan mountain & pine silhouettes, golden storybook filigree, particle shapes)
- **Audio Engine**: Expo Audio (`lib/audio.ts`, `lib/sounds.ts`, `assets/audio/chime.wav`, `assets/audio/rain.wav`) supporting chime stings, narration playback, 5 continuous white noise soundscapes, and 10s linear sleep fade-out
- **State & Persistence**: Zustand stores (`useSettingsStore`, `useSleepTimerStore`, `useFavoritesStore`, `useDownloadsStore`) persisted to AsyncStorage (`@react-native-async-storage/async-storage`)
- **Navigation & Routing**: Expo Router (`app/_layout.tsx`, `app/index.tsx`, `app/library.tsx`, `app/settings.tsx`, `app/story-detail/[id].tsx`, `app/story/[id].tsx`)

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Storybook 3D Page Flip Animation | Reanimated 3D perspective rotation (0 to -165 deg) with layered cover leaves and spine | R1 | ORIGINAL_REQUEST §R1 |
| 2 | Stardust Particle Emitters | 22 deterministic particle seeds with upward drift and sine-wave oscillation | R1 | ORIGINAL_REQUEST §R1 |
| 3 | Bilingual Brand Logo Reveal | Sequential typography fade/slide for "Saanjh" and Nepali "साँझ - Bedtime Stories & Novels" | R1 | ORIGINAL_REQUEST §R1 |
| 4 | Synchronized Audio Chime Sting | Low-latency trigger of chime.wav at t=450ms with graceful error handling | R1 | ORIGINAL_REQUEST §R1 |
| 5 | Tap-to-Skip Splash Ritual | Immediate tap dismissal with 380ms crossfade to main application | R1 | ORIGINAL_REQUEST §R1 |
| 6 | Deep Celestial Gradient Palette | 5-stop nocturnal gradient (#060913 -> #0c1222 -> #121A2F -> #1B1428 -> #22151D) | R2 | ORIGINAL_REQUEST §R2 |
| 7 | Twinkling Starfield UI-Thread Oscillation | 32 deterministic star seeds with sine-wave opacity/scale oscillations on UI thread | R2 | ORIGINAL_REQUEST §R2 |
| 8 | 4-Layer Himalayan Mountain Horizon | Vector SVG mountains with distant ridges, jagged peaks, foothills, and 14 pine conifers | R2 | ORIGINAL_REQUEST §R2 |
| 9 | Reusable Screen-Wide Background | Seamless pass-through wrapper integrated into Home, Library, Settings, Story Details | R2 | ORIGINAL_REQUEST §R2 |
| 10 | Dedicated Full-Screen Search Modal | Modal overlay accessible via floating action button and search triggers on Home/Library | R3 | ORIGINAL_REQUEST §R3 |
| 11 | Real-Time Bilingual Fuzzy Search | Full-text matching across English & Nepali titles, subtitles, morals, tags, IDs, beats | R3 | ORIGINAL_REQUEST §R3 |
| 12 | Quick Filter Pills | Filter tabs: All, Toddlers, Kids, Novels/Parents, Folk Tales, Animals, Audio Only | R3 | ORIGINAL_REQUEST §R3 |
| 13 | Recent & Trending Searches | Persistent search history (max 8) and curated trending story recommendations | R3 | ORIGINAL_REQUEST §R3 |
| 14 | Configurable Sleep Timer | Presets for 15m, 30m, 45m, 60m, endOfStory with active countdown badge | R4 | ORIGINAL_REQUEST §R4 |
| 15 | 10-Second Linear Audio Fade-Out | Smooth audio attenuation over final 10 seconds before complete playback cessation | R4 | ORIGINAL_REQUEST §R4 |
| 16 | Continuous Sleep Soundscapes Player | 5 white noise ambient beds (Rain, River, Night, Wind, Chime) with volume control | R4 | ORIGINAL_REQUEST §R4 |
| 17 | Bedtime Night Light Mode | Full-screen warm amber & moonlight glow, 8s breathing pulse, digital clock, KeepAwake | R4 | ORIGINAL_REQUEST §R4 |
| 18 | Redesigned 4-Card Settings Screen | Audio & Voices, Sleep Timer & Ambiance, Language & Age Group, Display & Night Light | R4 | ORIGINAL_REQUEST §R4 |
| 19 | TypeScript Strict Zero-Error Compliance | `npx tsc --noEmit` clean compilation across all modules | R5 | ORIGINAL_REQUEST §R5 |
| 20 | 100% Passing 5-Tier E2E Test Suite | 127 automated tests with 215,722 assertions verified with 100% success rate | R5 | ORIGINAL_REQUEST §R5 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| R1 | Magical Storybook Animated Splash Ritual | `components/splash/*`, `assets/audio/chime.wav`, `app/_layout.tsx` | none | DONE |
| R2 | Atmospheric Bedtime Background & Visual Graphic Design | `components/background/*`, `constants/theme.ts`, screen layouts | none | DONE |
| R3 | Dedicated Full-Screen Search & Discovery Modal | `components/search/*`, `lib/searchEngine.ts`, `app/index.tsx`, `app/library.tsx` | R2 | DONE |
| R4 | Essential Bedtime Sleep Features & Settings Revamp | `store/useSleepTimerStore.ts`, `lib/sleepTimer.ts`, `components/sleep/*`, `app/settings.tsx` | R2 | DONE |
| R5 | Expo Dev Server Compatibility & Quality Verification | `npx tsc --noEmit`, `node scripts/verify_e2e.js`, clean build verification | R1, R2, R3, R4 | DONE |

---

## Interface Contracts

### Splash ↔ Layout (`components/splash/SplashRitual.tsx` ↔ `app/_layout.tsx`)
```typescript
interface SplashRitualProps {
  onFinish?: () => void;
  minDurationMs?: number;
  autoDismissMs?: number;
}
```

### Background ↔ Screens (`components/background/AtmosphericBackground.tsx`)
```typescript
interface AtmosphericBackgroundProps {
  children?: React.ReactNode;
  showStars?: boolean;
  showMountains?: boolean;
  intensity?: 'subtle' | 'normal' | 'deep';
}
```

### Search Engine (`lib/searchEngine.ts`)
```typescript
type SearchFilterPill = 'all' | 'toddlers' | 'kids' | 'novels_parents' | 'roots' | 'animals' | 'audio_only';

interface SearchResult {
  story: Story;
  score: number;
  matchedFields: string[];
  snippet?: string;
}

function searchStories(query: string, filter?: SearchFilterPill): SearchResult[];
function getTrendingStories(): Story[];
function getRecentSearches(): Promise<string[]>;
function saveRecentSearch(query: string): Promise<void>;
function clearRecentSearches(): Promise<void>;
```

### Sleep Timer Store (`store/useSleepTimerStore.ts`)
```typescript
type SleepTimerDuration = 'off' | '15m' | '30m' | '45m' | '60m' | 'endOfStory';

interface SleepTimerState {
  duration: SleepTimerDuration;
  remainingSeconds: number;
  isActive: boolean;
  isFadingOut: boolean;
  setTimer: (duration: SleepTimerDuration) => void;
  cancelTimer: () => void;
  tick: () => void;
  notifyStoryEnded: () => void;
}
```

---

## Code Layout
```
d:\Antigravity Projects\Bedtime Stories\
├── app/
│   ├── _layout.tsx                     # Global RootLayout, font loading, splash overlay
│   ├── index.tsx                       # Home Screen with AtmosphericBackground, search trigger
│   ├── library.tsx                     # Story Library with filters and search trigger
│   ├── settings.tsx                    # 4-card redesigned Settings screen
│   ├── story/[id].tsx                  # Story player with narration & audio sync
│   └── story-detail/[id].tsx           # Story detail overview with tags and audio preview
├── components/
│   ├── background/
│   │   ├── AtmosphericBackground.tsx   # Master 5-stop celestial gradient wrapper
│   │   ├── TwinklingStarfield.tsx      # 32-star Reanimated UI-thread twinkling starfield
│   │   └── HimalayanHorizon.tsx        # 4-layer SVG Himalayan mountain & pine conifer horizon
│   ├── search/
│   │   ├── SearchDiscoveryModal.tsx    # Full-screen search overlay with filters & trending
│   │   └── SearchTriggerFAB.tsx        # Floating search trigger action button
│   ├── sleep/
│   │   ├── SleepTimerHeaderBadge.tsx   # Live countdown header badge
│   │   ├── SoundscapesPlayer.tsx       # White noise ambient bed player (5 soundscapes)
│   │   └── NightLightModal.tsx         # Warm amber/moonlight glow with 8s breathing pulse
│   └── splash/
│       ├── SplashRitual.tsx            # Full-screen splash ritual coordinator
│       ├── AnimatedStorybook.tsx       # Reanimated 3D page flip with filigree and glow
│       └── StardustParticles.tsx       # 22-particle parametric stardust field
├── constants/
│   └── theme.ts                        # Celestial dark palette tokens and typography
├── data/
│   ├── catalog.ts                      # 24 core bilingual bedtime stories catalog
│   └── stories/                        # Detailed story text, metadata, and beats
├── lib/
│   ├── audio.ts                        # Master audio engine (chime, beds, narration, 10s fade)
│   ├── sounds.ts                       # Soundscapes catalog and playback helpers
│   ├── sleepTimer.ts                   # Sleep timer calculations and audio fade curve
│   └── searchEngine.ts                 # Bilingual search engine and recent search persistence
├── store/
│   ├── useSettingsStore.ts             # User settings with AsyncStorage persistence
│   ├── useSleepTimerStore.ts           # Global sleep timer state with countdown ticker
│   ├── useFavoritesStore.ts            # Saved favorites with AsyncStorage persistence
│   └── useDownloadsStore.ts            # Downloaded offline stories store
└── scripts/
    └── verify_e2e.js                   # 127 automated E2E tests across Tiers 1-5 (215k assertions)
```
