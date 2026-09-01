# E2E Test Infra: Saanjh 3.0 Production Upgrade

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on private internal implementation hacks.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workload Testing across all 4 pillars (R1: Bug fixes, R2: AI Narrator & TTS, R3: UI & Navigation, R4: Content & Assets).

## Feature Inventory & Test Coverage
| # | Feature | Requirement | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Scenario) |
|---|---------|-------------|:-----------------:|:-----------------:|:-----------------:|:-----------------:|
| 1 | Nepali Devanagari Strings in `app/index.tsx` | R1.1 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 2 | `parseAgeBand` includes `'parents'` | R1.2 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 3 | Removal of dead `SplashRitual.tsx` | R1.3 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 4 | Clean unused imports in `app/index.tsx` | R1.4 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 5 | Admin Panel age bands (`6-8`, `9-12`) | R1.5 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 6 | Cloudflare Worker Bearer Token Auth | R1.6 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 7 | AdBanner safe fallback / hide | R1.7 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 8 | Strategic Punctuation Pauses | R2.1 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 9 | Voice Differentiation & Profiles | R2.1 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 10| Ambient Sound Bed Auto-Detection | R2.1 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 11| Music Bed Fading & Final Wind-Down | R2.1 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 12| Google Cloud AI TTS Engine & Neural Voices | R2.2 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 13| AI Voice (Beta) Settings Toggle | R2.2 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 14| Local Audio Caching & Pre-fetching | R2.2 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 15| Graceful Cloud TTS Fallback | R2.2 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 16| Paginated Novel Reader View | R2.3 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 17| Novel Reader Read Aloud & Auto-Advance | R2.3 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 18| Story Detail Preview Screen (`story-detail/[id]`) | R3.1 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 19| Unified Home Screen & Carousels | R3.2 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 20| Favorites System with AsyncStorage | R3.3 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 21| Skeleton Loaders & Retry Error States | R3.4 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 22| 3 New Bilingual Stories (8-12 beats) | R4.1 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 23| Ambient Sound Metadata (5+ stories) | R4.2 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 24| Public Domain Cover Images (10+ stories) | R4.3 | ≥5 cases | ≥5 cases | ✓ | ✓ |

## Test Architecture
- Test Runner: Node.js / TypeScript test harness (`scripts/verify_e2e.js` or `npm test`)
- Pass/Fail Semantics: Strict exit code 0 on 100% pass rate; non-zero on any failure.
- TypeScript Static Analysis: `npx tsc --noEmit` must pass with 0 errors across root and admin.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Parent selects 'parents' age band, browses home, favorites 'midnight-chiya', opens detail preview, and launches novel reader with AI voice | F2, F12, F13, F14, F16, F17, F18, F19, F20, F22 | High |
| 2 | Toddler launches 'little-pine-sleep' in Nepali, listens to enhanced TTS with natural pauses and auto-layered night sound bed, completes story with sleep wind-down fade | F1, F8, F9, F10, F11, F18, F19, F22, F23 | High |
| 3 | Kid explores 'langtang-waterfall', toggles offline mode (no API key / no network), system seamlessly falls back to enhanced on-device TTS with river sound bed | F8, F9, F10, F14, F15, F18, F20, F22, F23 | High |
| 4 | Admin edits story catalog in Admin Panel, selects age band '6-8', saves to Cloudflare KV with Bearer auth token | F5, F6 | Medium |
| 5 | Cold launch: App rehydrates settings from AsyncStorage, checks catalog with skeleton placeholders, verifies clean layout without AdMob crashes | F2, F7, F20, F21 | Medium |
