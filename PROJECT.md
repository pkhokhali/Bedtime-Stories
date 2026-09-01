# Project: Saanjh 3.0 Production Upgrade

## Architecture
Saanjh is a bilingual (English / Nepali) bedtime story and novel reading mobile application built with React Native and Expo (SDK 57). It features procedural 2D visual stages, rich audio narration (enhanced on-device TTS with punctuation pauses and voice roles + Google Cloud AI neural voices), ambient background soundscapes with smooth fading, a modern UI with story previews, category carousels, persistent favorites, an Admin Panel (Vite + React 19 + Tailwind), and a Cloudflare Workers KV API backend with Bearer token authentication.

```
                     ┌────────────────────────────────────────────────────────┐
                     │                 Saanjh 3.0 Mobile App                 │
                     │                     (Expo SDK 57)                      │
                     └───────────────────────────┬────────────────────────────┘
                                                 │
            ┌────────────────────────────────────┼────────────────────────────────────┐
            ▼                                    ▼                                    ▼
┌───────────────────────┐            ┌───────────────────────┐            ┌───────────────────────┐
│     UI & Screens      │            │  Audio & Narrator     │            │ Content & Catalog     │
│ - app/index.tsx (Home)│            │ - lib/narrator/       │            │ - data/catalog.ts     │
│ - app/story-detail/   │            │   - segmenter.ts      │            │ - data/stories/*.ts   │
│ - app/story/[id].tsx  │            │   - cloudTts.ts       │            │ - types/story.ts      │
│ - components/reader/  │            │ - lib/speech.ts (TTS) │            │ - constants/ui.ts     │
│ - store/useFavorites  │            │ - lib/audio.ts (Beds) │            │                       │
└───────────────────────┘            └───────────────────────┘            └───────────────────────┘
            │                                    │                                    │
            └────────────────────────────────────┼────────────────────────────────────┘
                                                 ▼
                     ┌────────────────────────────────────────────────────────┐
                     │          Backend & Admin Infrastructure                │
                     │ - Cloudflare Worker: backend/src/index.ts (Bearer Auth)│
                     │ - Admin Panel: admin/src/App.tsx (Vite + React)        │
                     └────────────────────────────────────────────────────────┘
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Fix Devanagari strings in `app/index.tsx` | Replace `????` question marks with authentic Devanagari text matching `constants/ui.ts` | M1 | ORIGINAL_REQUEST §R1.1 |
| 2 | Fix `parseAgeBand` in `useSettingsStore.ts` | Include `'parents'` in valid AgeBand options so it does not reset on app rehydration | M1 | ORIGINAL_REQUEST §R1.2 |
| 3 | Delete dead `components/SplashRitual.tsx` | Remove unreferenced 70-line legacy component | M1 | ORIGINAL_REQUEST §R1.3 |
| 4 | Remove unused imports in `app/index.tsx` | Clean up `storiesForAge`, `ageBands`, `radii`, `spacing` imports | M1 | ORIGINAL_REQUEST §R1.4 |
| 5 | Fix Admin Panel Age Bands in `admin/src/App.tsx` | Replace `'7-9'` option with standard mobile bands `'6-8'` and `'9-12'` | M1 | ORIGINAL_REQUEST §R1.5 |
| 6 | Cloudflare Worker Bearer Auth in `backend/src/index.ts` | Protect `POST /catalog` with `ADMIN_SECRET` Bearer auth header & update Admin Panel | M1 | ORIGINAL_REQUEST §R1.6 |
| 7 | Graceful fallback in `components/AdBanner.tsx` | Hide banner cleanly if placeholder/dummy unit IDs (`ca-app-pub-xxxxxxxx`) or load error | M1 | ORIGINAL_REQUEST §R1.7 |
| 8 | Strategic punctuation pauses in TTS | Tokenize text with 300ms clause, 750ms sentence, 1000ms ellipsis, 1200ms paragraph pauses | M2 | ORIGINAL_REQUEST §R2.1 |
| 9 | Dialogue vs Narration modulation & voice roles | Character voice differentiation across pitch, rate, volume per role | M2 | ORIGINAL_REQUEST §R2.1 |
| 10| Ambient sound bed auto-detection | Map `sceneId`/`stageKind` to ambient sound beds (`night`, `moon`, `river`, `courtyard`, `wind`) | M2 | ORIGINAL_REQUEST §R2.1 |
| 11| Background music bed fading & final wind-down | Cross-fade between beats and fade out bed over 3500ms on final story beat | M2 | ORIGINAL_REQUEST §R2.1 |
| 12| Google Cloud AI TTS Engine | Free tier Google Cloud TTS integration for neural English and Nepali voices | M2 | ORIGINAL_REQUEST §R2.2 |
| 13| AI Voice Settings Toggle | Add "AI Voice (Beta)" toggle in `useSettingsStore` and `app/settings.tsx` | M2 | ORIGINAL_REQUEST §R2.2 |
| 14| Local Audio Caching & Pre-fetching | Cache synthesized audio in `FileSystem.cacheDirectory` and prefetch upcoming beats | M2 | ORIGINAL_REQUEST §R2.2 |
| 15| Graceful Cloud TTS Fallback | Automatically fall back to enhanced device TTS if API key missing, offline, or error | M2 | ORIGINAL_REQUEST §R2.2 |
| 16| Paginated Novel Reader Mode | Text reader with adjustable font size `[A-]` `[A+]` for `form === 'novel'` stories | M2 | ORIGINAL_REQUEST §R2.3 |
| 17| Novel Reader Read Aloud & Auto-Advance | "Read Aloud" button narrating current page and auto-advancing pages with progress bar | M2 | ORIGINAL_REQUEST §R2.3 |
| 18| Story Detail / Preview Screen | `app/story-detail/[id].tsx` with cover/gradient, bilingual title, age/runtime, moral, Play CTA | M3 | ORIGINAL_REQUEST §R3.1 |
| 19| Unified Home Screen Redesign | Hero section with recommended story, horizontal carousels, Devanagari titles | M3 | ORIGINAL_REQUEST §R3.2 |
| 20| Favorites System with AsyncStorage | Heart toggle on cards and detail screen, `useFavoritesStore`, "My Favorites" carousel | M3 | ORIGINAL_REQUEST §R3.3 |
| 21| Skeleton Loaders & Retry Error States | Skeleton placeholders during catalog fetch, friendly retry card if fetch fails | M3 | ORIGINAL_REQUEST §R3.4 |
| 22| 3 New Bilingual Stories | Add `little-pine-sleep` (2-4), `langtang-waterfall` (6-8), and `midnight-chiya` (parents) | M4 | ORIGINAL_REQUEST §R4.1 |
| 23| Ambient Sound Metadata Integration | Map sound beds and SFX metadata for 5+ existing stories in `data/catalog.ts` | M4 | ORIGINAL_REQUEST §R4.2 |
| 24| Public Domain Cover Images | Add high-resolution Creative Commons / Unsplash cover image URLs for 10+ stories | M4 | ORIGINAL_REQUEST §R4.3 |
| 25| End-to-End Test Suite (Tiers 1-4) | Comprehensive opaque-box test runner covering all requirements | M5/E2E | ORIGINAL_REQUEST §Acceptance |
| 26| Full Project Build & TypeScript Verification | 0 errors on `npx tsc --noEmit` and build verification | M5 | ORIGINAL_REQUEST §Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Fix 7 Confirmed Bugs & Backend Auth | R1.1–R1.7: Devanagari strings in `app/index.tsx`, `parseAgeBand`, delete `SplashRitual.tsx`, clean unused imports, Admin age bands, Worker Bearer auth, AdBanner fallback | none | DONE |
| M2 | AI-Powered Story Narrator & Novel Reader | R2.1–R2.3: `lib/narrator/`, enhanced on-device TTS with pauses & voice roles, ambient auto-detection, bed fader & sleep wind-down, Google Cloud TTS with caching & fallback, settings toggle, paginated Novel Reader | M1 | DONE |
| M3 | UI Overhaul, Story Detail & Favorites | R3.1–R3.4: `app/story-detail/[id].tsx`, unified `app/index.tsx`, `useFavoritesStore` with AsyncStorage, skeleton placeholders & retry error state | M1 | DONE |
| M4 | Sample Content, Metadata & Assets | R4.1–R4.3: 3 new bilingual stories in `data/stories/`, register in `data/catalog.ts`, ambient metadata for 5+ stories, cover images for 10+ stories | M1 | DONE |
| M5 | E2E Testing, Full Project Verification & Audit | Tiers 1-5 test verification, `npx tsc --noEmit` check, forensic integrity audit, final release verification | M1, M2, M3, M4 | DONE |

## Interface Contracts
### `useSettingsStore` ↔ Audio & UI Modules
- `aiVoice: boolean` — whether Google Cloud AI Voice is enabled (defaults to `false`).
- `setAiVoice: (enabled: boolean) => void`.
- `ageBand: AgeBand` — includes `'parents'`.

### `useFavoritesStore` ↔ Home Screen & Story Detail
- `favoriteIds: string[]` — list of story IDs stored in AsyncStorage under key `saanjh.favorites.v1`.
- `toggleFavorite: (id: string) => void`.
- `isFavorite: (id: string) => boolean`.

### `lib/narrator` ↔ Story Playback & Novel Reader
- `segmentText(text: string, defaultRole?: VoiceRole): SpeechSegment[]`.
- `getSynthesizedAudioUri(text: string, options: CloudTtsOptions): Promise<string | null>`.
- `resolveAmbientBed(music?: SoundId, scene?: SceneId, stage?: StageKind): SoundId`.
- `fadeBedVolume(target: number, durationMs?: number): Promise<void>`.
- `windDownFinalBeat(): Promise<void>`.

### Backend Worker ↔ Admin Panel
- `POST /catalog`: Requires header `Authorization: Bearer <ADMIN_SECRET>`. Returns `401 Unauthorized` if secret mismatch or missing.

## Code Layout
- `app/` — Expo Router screens (`index.tsx`, `story-detail/[id].tsx`, `story/[id].tsx`, `library.tsx`, `settings.tsx`, `_layout.tsx`)
- `components/` — Reusable components (`AdBanner.tsx`, `StoryCarousel.tsx`, `StoryCardSkeleton.tsx`, `AgeCategoryRow.tsx`)
- `components/player/` — Audio & visual player components (`StoryPlayer.tsx`, `MediaStoryPlayer.tsx`, `SeekBar.tsx`, `SleepFade.tsx`, `SubtitleBar.tsx`)
- `components/reader/` — Novel reading components (`NovelReader.tsx`)
- `constants/` — Design tokens & translations (`theme.ts`, `ui.ts`)
- `data/` — Static catalog & stories (`catalog.ts`, `stories/*.ts`)
- `lib/` — Business logic & audio engines (`audio.ts`, `sounds.ts`, `speech.ts`, `catalogFetcher.ts`, `narrator/*.ts`)
- `store/` — Zustand state stores (`useSettingsStore.ts`, `useFavoritesStore.ts`, `useDownloadsStore.ts`)
- `types/` — TypeScript declarations (`story.ts`)
- `admin/` — React Vite Admin Panel (`admin/src/App.tsx`, `admin/src/main.tsx`)
- `backend/` — Cloudflare Worker API (`backend/src/index.ts`, `backend/wrangler.toml`)
