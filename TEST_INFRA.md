# Testing Infrastructure & Architecture: Saanjh Bedtime Stories

## Executive Summary
This document establishes the testing philosophy, architectural layout, verification tiers, execution instructions, and pass/fail criteria for the **Saanjh Bedtime Stories & Novels (UI/UX, Graphic Design & Feature Overhaul)**.

---

## Testing Philosophy
1. **Opaque-Box & Requirement-Driven**: Tests are derived strictly from user requirements and acceptance criteria in `PROJECT.md` and `ORIGINAL_REQUEST.md` without tight coupling to volatile internal implementation artifacts.
2. **Systematic 4-Tier Verification Hierarchy**:
   - **Tier 1: Feature Coverage**: Comprehensive positive validation for every core feature (≥5 tests per feature across 8 features).
   - **Tier 2: Boundary & Corner Cases**: Stressing limits, empty inputs, Devanagari Unicode diacritics/conjuncts, 10-second volume fade curves, zero/extreme volume clamping, corrupt storage recovery, audio fallbacks, and slider boundaries.
   - **Tier 3: Cross-Feature Combinations**: Pairwise and concurrent subsystem integration (Sleep Timer + Soundscape + Narration, Night Light + Background Stars, Search + Navigation + Splash Skip, Settings Sync + Storage).
   - **Tier 4: Real-World Bedtime Workloads**: End-to-end user journeys simulating complete bedtime rituals and parental bedtime companion experiences.
3. **Deterministic & Fast Execution**: Standalone, zero-overhead Node.js test runner requiring no native build dependencies, running 104+ tests and 430+ assertions in under 200 milliseconds.

---

## Test Tier Catalog

### Tier 1: Feature Coverage (8 Feature Domains, 49 Tests)
| Feature Domain | Test IDs | Scope & Objectives |
|---|---|---|
| **1. Splash Ritual (R1)** | `T1.F1.1` – `T1.F1.7` | Opening glowing storybook animation timing (1800ms), 24 upward stardust sparkle particles, bilingual logo reveal ("Saanjh" / "साँझ"), chime audio sting asset integrity, tap-to-skip crossfade state machine (450ms), and in-tree overlay mounting contract. |
| **2. Atmospheric Background (R2)** | `T1.F2.1` – `T1.F2.6` | Celestial nocturnal palette (`#060913` -> `#0c1222` -> `#121A2F` with `#E8A04A`), 32 Reanimated twinkling stars generator with sine phase offsets, Himalayan pine silhouettes, reusable container contract, and intensity mode resolution (`full`, `subtle`, `dim`). |
| **3. Search & Discovery Modal (R3)** | `T1.F3.1` – `T1.F3.7` | Floating search FAB properties and placement, full-screen search modal with blur backdrop, real-time English query search, real-time Devanagari Nepali search ('खरायो', 'बादल'), 6 quick filter pills, trending bedtime recommendations on empty query, and direct story preview navigation. |
| **4. Bedtime Sleep Timer (R4)** | `T1.F4.1` – `T1.F4.6` | Duration mapping (`15m`, `30m`, `45m`, `60m`, `endOfStory`, `off`), live countdown tick state machine (`MM:SS` header badge), 10-second linear volume fade window (t ≤ 10s), expiry stop orchestration at t=0s, `endOfStory` completion listener, and timer cancellation volume restoration. |
| **5. Continuous Sleep Soundscapes (R4)** | `T1.F5.1` – `T1.F5.6` | 5 ambient sound beds registry (`rain`, `river`, `night`, `wind`, `chime`), audio asset presence on disk, looping white noise player state machine, volume step attenuation, rain audio synthesis algorithm (pink noise with drop modulation), and background playback capability. |
| **6. Bedtime Night Light Mode (R4)** | `T1.F6.1` – `T1.F6.5` | Full-screen Warm Amber (`#FFAE42`) & Moonlight (`#90B4CE`) color modes, soft brightness slider regulation (0.05 to 1.0), 6-second breathing pulse oscillation (0.85 to 1.0 opacity), tap-to-exit modal dismiss gesture, and settings persistence. |
| **7. Settings Screen & Persistence (R4)** | `T1.F7.1` – `T1.F7.6` | 4 visual cards layout (Audio & Voices, Sleep Timer & Ambiance, Language & Age Group, Display & Night Light), AsyncStorage persistence schema (`saanjh.settings.v1`), cold launch hydration, default contracts (`ne`, `4-6`, `gentle`), dynamic partial updates, and ageBand to AudienceGroup classification. |
| **8. Catalog Data Integrity** | `T1.F8.1` – `T1.F8.6` | 24+ stories bilingual metadata validation, narrative beat arrays, all 8 age bands represented (`2-4`, `4-6`, `6-8`, `9-12`, `13-17`, `18-25`, `25+`, `parents`), form classification (`story` vs `novel`), and ambient stage metadata coverage. |

---

### Tier 2: Boundary & Corner Cases (8 Categories, 40 Tests)
| Boundary Category | Test IDs | Scope & Objectives |
|---|---|---|
| **B1: Empty Query & Whitespace** | `T2.B1.1` – `T2.B1.5` | Empty query trending fallback, whitespace trimming (`\t\n  `), single character matching, special regex metacharacters escaping (`.*+?^${}()|[]\`), and 10,000 character extreme query safety. |
| **B2: Unicode Devanagari Matching** | `T2.B2.1` – `T2.B2.5` | Devanagari vowel signs/matras, conjuncts matching ('साँझ', 'भक्तपुर', 'लाङटाङ'), Purna Viram (`।`) parsing, mixed bilingual queries, and case-insensitive English matching. |
| **B3: Sleep Timer 10s Fade Window** | `T2.B3.1` – `T2.B3.5` | t=11s pre-fade check (`isFadingOut: false`, vol=1.0), t=10s fade start (`isFadingOut: true`), t=5s mid-fade attenuation (vol=0.5), t=1s end-fade (vol=0.1), and t=0s playback termination (vol=0.0). |
| **B4: Soundscape & Audio Volume Clamping** | `T2.B4.1` – `T2.B4.5` | 0.0 volume silence, negative volume clamping to 0.0, overflow volume > 1.0 clamping to 1.0, 100 rapid monotonic updates, and soundscape switching volume preservation. |
| **B5: Timer Cancellation & Resets** | `T2.B5.1` – `T2.B5.5` | Mid-countdown cancellation at t=500s, cancellation during 10s fade restoring full volume, duration switching mid-timer (15m to 30m), switching to `off`, and replacement without timer leaks. |
| **B6: Corrupt AsyncStorage Fallback** | `T2.B6.1` – `T2.B6.5` | Null storage value defaults, malformed JSON syntax resilience, partial settings hydration, unknown enum sanitization, and schema migration backward compatibility. |
| **B7: Invalid Audio Asset Fallbacks** | `T2.B7.1` – `T2.B7.5` | Non-existent sound ID graceful fallback, RIFF/WAVE header validation, zero-length audio buffer handling, missing remote media fallback to local beats, and error state emission. |
| **B8: Night Light Limits & Toggles** | `T2.B8.1` – `T2.B8.5` | Minimum luminance clamping (0.05), maximum luminance clamping (1.0), NaN/undefined brightness fallback (0.5), color toggle brightness preservation, and 50 rapid toggle consistency. |

---

### Tier 3: Cross-Feature Combinations (10 Pairwise Integration Flows)
| Combination ID | Scope & Interaction |
|---|---|
| **`T3.C01`** | **Sleep Timer + Soundscape + Narration Coordination**: Multi-player coordinator fades both soundscape ambiance and story narration simultaneously during 10s window and stops both at expiry. |
| **`T3.C02`** | **Night Light + Background Stars + Audio Stability**: Opening and closing full-screen night light modal preserves background starfield state and active soundscape audio without interruption. |
| **`T3.C03`** | **Search Modal + Preview Navigation + Splash Tap-to-Skip**: App launches, splash tapped to skip, search modal opens, Devanagari query filters story, navigates directly to preview screen. |
| **`T3.C04`** | **Settings Toggle + Storage Sync + UI Hydration**: Language and ageBand changes sync to AsyncStorage and survive cold app relaunch. |
| **`T3.C05`** | **Soundscape Change During Active Timer**: User switches ambient sound bed from rain to wind; sleep timer countdown proceeds uninterrupted without resetting `remainingSeconds`. |
| **`T3.C06`** | **Filter Pills + Devanagari Search Concurrency**: Filtering by 'toddlers' (2-4) pill combined with Nepali query 'सल्ला' returns only matching 2-4 stories. |
| **`T3.C07`** | **Sleep Timer `endOfStory` Mode + Story Completion Event**: Story reaches final beat; `notifyStoryEnded()` triggers audio fade-out and timer reset. |
| **`T3.C08`** | **Night Light Amber/Moonlight Toggle + Brightness Persistence**: Parent toggles to Moonlight mode, dims to 25%, closes; upon reopening, settings are preserved. |
| **`T3.C09`** | **Search Pill Filter + Direct Navigation + Modal Dismiss Flow**: Filtering by 'roots' category, selecting story item, and navigating to `/story-detail/[id]`. |
| **`T3.C10`** | **Sleep Timer Expiry + Dimmed Atmospheric Background Silence**: Countdown reaches zero, audio stops, volume zeroed, screen remains in calm dimmed state. |

---

### Tier 4: Real-World Bedtime Workload Scenarios (5 Comprehensive Journeys)
1. **Scenario 1: Complete Bedtime Routine Journey (`T4.S01`)**:
   - Cold app launch -> Tap-to-skip splash ritual -> Atmospheric background displays 32 twinkling stars -> Floating search FAB clicked -> Bilingual search for "बुद्धिमान खरायो" -> Preview story detail opened -> 15m sleep timer configured -> User plays continuous "rain" soundscape -> Bedtime night light mode enabled (amber, 30% brightness) -> 15m timer counts down to 10s, fades rain to silence -> Night light remains softly illuminating room.
2. **Scenario 2: Toddler Evening Sleep Routine (`T4.S02`)**:
   - Default settings loaded (`ne`, `4-6`) -> Parent selects 'toddlers' quick filter pill -> Selects 'Little Pine Goes to Sleep' (`little-pine-sleep`) -> Configures Sleep Timer to `endOfStory` -> Listens to gentle Devanagari narration with forest/night bed -> Story finishes -> Auto-fade to silence.
3. **Scenario 3: Parents Novel Experience (`T4.S03`)**:
   - User switches ageBand to 'parents' in settings -> Searches 'midnight' in search modal -> Selects 'Midnight Chiya' novel -> Reads chapters with font scaling -> Starts 'night' soundscape with 45m timer -> Timer header badge displays `⏰ 45:00` and counts down.
4. **Scenario 4: Bedside Nightstand Light (`T4.S04`)**:
   - Parent puts child to bed -> Opens Settings -> Configures Moonlight Night Light at 20% brightness -> Starts 'river' soundscape with 30m timer -> Header badge ticks `⏰ 30:00` -> Audio expires silently.
5. **Scenario 5: Search & Discovery Deep Exploration (`T4.S05`)**:
   - Open search modal -> Empty query displays Trending Bedtime Stories -> User clicks 'Animal Stories' pill -> Results filter to animals -> Types English 'crocodile' -> Finds Koshi Crocodile -> Types Nepali 'गोही' -> Still finds Koshi Crocodile -> Navigates to story preview.

---

## Runner Invocation & Verification

```bash
# Run the E2E verification test suite
node scripts/verify_e2e.js

# Or via npm test
npm test
```

### Exit Code & Threshold Semantics
- **Exit Code `0`**: 100% of tests passed with zero failures.
- **Exit Code `1`**: One or more assertions failed; failure details and tier breakdown printed to terminal.
- **Minimum Test Threshold**: ≥100 test cases, ≥400 assertions across all 4 tiers.
