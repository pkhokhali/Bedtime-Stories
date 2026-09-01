# TEST READY: Saanjh 3.0 Production Upgrade E2E Test Suite

## Executive Summary
The automated End-to-End (E2E) opaque-box test suite for **Saanjh 3.0** is fully established, configured, and ready for continuous regression testing and milestone gate verification.

- **Test Harness Script**: `scripts/verify_e2e.js`
- **Execution Command**: `node scripts/verify_e2e.js` or `npm test`
- **Target Architecture**: Expo SDK 57 / React Native, Cloudflare Workers API, Vite Admin Panel
- **Total Test Tiers**: 4 Tiers
- **Total Test Suites**: 41 Test Suites across 24 Features, 7 Boundary Categories, 5 Cross-Feature Combinations, and 5 Real-World Scenarios
- **Total Assertions**: >200 Assertions
- **Pass Semantics**: Strict Exit Code 0 on 100% Pass Rate; Non-zero on any assertion failure

---

## Test Tier Architecture & Feature Mapping

| Tier | Name | Scope | Assertion Count | Key Verification Objectives |
|:---:|:---|:---|:---:|:---|
| **Tier 1** | **Feature Coverage** | All 24 Features across Pillars R1, R2, R3, R4 | ≥120 assertions | Verifies all 7 bug fixes, TTS pauses, voice roles, ambient auto-detection, bed fading & wind-down, Cloud TTS synthesis, caching & fallback, novel reader mode, story detail preview, home carousels, favorites persistence, loading skeletons, 3 new stories, sound metadata, and cover images. |
| **Tier 2** | **Boundary & Corner Cases** | 7 Boundary Categories (Empty text, offline, invalid tokens, extreme age bands, etc.) | ≥35 assertions | Verifies extremes, null/undefined handling, malformed auth headers, min/max font clamping (14px–28px), single vs 20-beat navigation, cache key hashing with 10k character payloads. |
| **Tier 3** | **Cross-Feature Combinations** | 5 Pairwise Integration Flows | ≥20 assertions | Verifies language toggle with favorites retention, Cloud TTS fallback during novel reading, Admin catalog save with Bearer auth and mobile catalog fetch, detail screen favorite sync with home carousels, ambient sound bed transitions during beat skips. |
| **Tier 4** | **Real-World Scenarios** | 5 Comprehensive End-to-End User Journeys | ≥25 assertions | Simulates complete user sessions: Parent novel reading with AI voice, Toddler bedtime with Devanagari pauses and sleep wind-down, Kid offline adventure with river sound bed, Admin publishing lifecycle, and Cold launch rehydration with AdMob safety. |

---

## Detailed Feature Coverage Matrix (Tier 1)

| Feature # | Feature Name | Requirement | Test Identifier | Verification Focus |
|:---:|:---|:---:|:---:|:---|
| **F01** | Devanagari Nepali Strings | R1.1 | `F01` | Asserts no corrupted `????` placeholders in `app/index.tsx`; validates authentic Devanagari Unicode strings. |
| **F02** | `parseAgeBand` Parents Band | R1.2 | `F02` | Asserts `'parents'` is preserved during parsing and AsyncStorage rehydration without resetting to `'4-6'`. |
| **F03** | SplashRitual Dead Code Removal | R1.3 | `F03` | Asserts `components/SplashRitual.tsx` is deleted and zero imports remain in `app/` and `components/`. |
| **F04** | Clean Unused Imports | R1.4 | `F04` | Asserts `storiesForAge`, `ageBands`, `radii`, and `spacing` are not unused in `app/index.tsx`. |
| **F05** | Admin Panel Age Bands | R1.5 | `F05` | Asserts `<option value="7-9">` is eliminated in `admin/src/App.tsx` and replaced with standard `6-8`, `9-12`, and `parents`. |
| **F06** | Cloudflare Worker Bearer Auth | R1.6 | `F06` | Asserts `POST /catalog` enforces `Authorization: Bearer <ADMIN_SECRET>` returning 401 on unauthorized and 200 on authorized. |
| **F07** | AdBanner Graceful Fallback | R1.7 | `F07` | Asserts `components/AdBanner.tsx` handles dummy IDs (`ca-app-pub-xxxxxxxx`) safely and suppresses crashes in production. |
| **F08** | Strategic TTS Pauses | R2.1 | `F08` | Asserts clause (300ms), sentence (750ms), ellipsis (1000ms), and paragraph (1200ms) pauses in English & Nepali. |
| **F09** | Voice Differentiation & Profiles | R2.1 | `F09` | Asserts distinct pitch, rate, and volume modulation for `narrator`, `rabbit`, `tiger`, and `soft` roles. |
| **F10** | Ambient Bed Auto-Detection | R2.1 | `F10` | Asserts auto-mapping of `sceneId` and `stageKind` to ambient sound beds (`night`, `moon`, `river`, `courtyard`, `wind`). |
| **F11** | Music Bed Fading & Wind-Down | R2.1 | `F11` | Asserts cross-fading between beats and 3500ms smooth volume wind-down to 0.0 on the final story beat. |
| **F12** | Google Cloud AI TTS Engine | R2.2 | `F12` | Asserts neural voice selection (`en-US-Neural2-F`, `ne-NP-Standard-A`) and synthesis payload formatting. |
| **F13** | AI Voice Settings Toggle | R2.2 | `F13` | Asserts `aiVoice` boolean toggle in `useSettingsStore` and `app/settings.tsx` with AsyncStorage persistence. |
| **F14** | Local Audio Caching & Pre-fetch | R2.2 | `F14` | Asserts deterministic hash cache keys, local audio hit skipping network calls, and background pre-fetching. |
| **F15** | Graceful Cloud TTS Fallback | R2.2 | `F15` | Asserts seamless fallback to enhanced device TTS when API key is missing, network is offline, or quota is exceeded. |
| **F16** | Paginated Novel Reader View | R2.3 | `F16` | Asserts paginated reader view for `form === 'novel'` with `[A-]`/`[A+]` font size scaling from 14px to 28px. |
| **F17** | Read Aloud & Auto-Advance | R2.3 | `F17` | Asserts page narration triggering automatic page advancement and progress bar percentage computation. |
| **F18** | Story Detail Preview Screen | R3.1 | `F18` | Asserts `app/story-detail/[id].tsx` with bilingual title, age badge, runtime, moral summary, and Play CTA. |
| **F19** | Unified Home Screen | R3.2 | `F19` | Asserts hero banner with featured story, 4 category carousels, and Devanagari section titles. |
| **F20** | Favorites Store Persistence | R3.3 | `F20` | Asserts `useFavoritesStore` toggle, `saanjh.favorites.v1` AsyncStorage persistence, and "My Favorites" carousel. |
| **F21** | Skeleton Loaders & Error States | R3.4 | `F21` | Asserts loading skeletons during catalog fetch, retry error card on network failure, and local fallback. |
| **F22** | 3 New Bilingual Stories | R4.1 | `F22` | Asserts `little-pine-sleep` (2-4), `langtang-waterfall` (6-8), and `midnight-chiya` (parents) with 8-12 beats each. |
| **F23** | Ambient Sound Metadata | R4.2 | `F23` | Asserts at least 5 stories in `data/catalog.ts` configured with ambient sound stages and SFX metadata. |
| **F24** | Public Domain Cover Images | R4.3 | `F24` | Asserts at least 10 stories in `data/catalog.ts` have valid, high-resolution public domain cover image URLs. |

---

## Boundary & Corner Case Coverage (Tier 2)

- **`B01`**: Empty text strings, null/undefined inputs, whitespace-only strings, and punctuation-only inputs in text segmenter.
- **`B02`**: Cloud TTS synthesis with empty API keys, undefined keys, 10,000+ character payloads, and special character strings.
- **`B03`**: Complete offline network simulation for English and Nepali stories, pre-cached playback, and zero unhandled network exceptions.
- **`B04`**: Cloudflare Worker Bearer authentication with missing headers, malformed Bearer tokens, invalid secret strings, and valid credentials.
- **`B05`**: Extreme and invalid age band values (`null`, `undefined`, numbers, `'teen'`, `'adult'`, `'18+'`, and `'parents'`).
- **`B06`**: Single-beat story boundaries (preventing over/underflow) vs 20-beat story rapid navigation to completion.
- **`B07`**: Novel Reader font scaling clamps at 14px minimum and 28px maximum under repeated scale events.

---

## Pairwise Cross-Feature Combinations (Tier 3)

- **`C01`**: Settings language toggle (`en` ↔ `ne`) combined with persistent favorites in AsyncStorage.
- **`C02`**: Offline network disruption during active Novel Reader playback triggering automatic device TTS fallback and page auto-advance.
- **`C03`**: Admin Panel catalog edit (age band `6-8`) → Bearer Auth POST to Cloudflare KV → Mobile app catalog fetch & merge.
- **`C04`**: Story Detail preview navigation → Favorite toggle on detail screen → Real-time sync with Home Screen Favorites carousel.
- **`C05`**: Rapid story beat skipping with continuous ambient sound bed cross-fading and smooth final beat sleep wind-down.

---

## Real-World User Scenarios (Tier 4)

1. **Scenario 1 (Parent Novel Journey)**:
   A parent sets their age band to `'parents'`, favorites `'midnight-chiya'`, opens the story preview screen, and reads in paginated Novel Reader mode with AI Voice enabled.
2. **Scenario 2 (Toddler Bedtime Journey)**:
   A toddler opens `'little-pine-sleep'` in Nepali, hears enhanced TTS narration with natural punctuation pauses, enjoys the auto-layered night sound bed, and drifts off as the final beat fades out over 3500ms.
3. **Scenario 3 (Kid Offline Adventure Journey)**:
   A child launches `'langtang-waterfall'` while offline; the system seamlessly falls back to enhanced on-device TTS, layered with the river ambient sound bed.
4. **Scenario 4 (Admin Publishing Lifecycle)**:
   An administrator logs into the Admin Panel, updates target audience age bands to `'6-8'`, publishes with Bearer authentication, and verifies the mobile app reflects the updated catalog.
5. **Scenario 5 (Cold Launch & State Recovery)**:
   The app cold-launches after being killed, cleanly restores persisted settings and favorites from AsyncStorage, displays loading skeletons during catalog sync, and suppresses AdMob dummy unit crashes.

---

## How to Run the Tests

```bash
# Execute the automated E2E Test Suite directly
node scripts/verify_e2e.js

# Or via npm test
npm test
```

### Exit Code Semantics
- **`0`**: All tests across Tiers 1–4 passed with zero assertion failures.
- **`1`**: One or more assertions failed; failure report with file and line references printed to stderr/stdout.
