# Empirical Challenge & Adversarial Stress Report

**Challenger**: Challenger 1 (`challenger_stress_1`)  
**Target**: Saanjh Bedtime Stories — Comprehensive Overhaul  
**Date**: 2026-09-02  
**Verification Baseline**: `npx tsc --noEmit` (0 errors), `node scripts/verify_e2e.js` (127/127 tests passed, 215,722 assertions)

---

## Challenge Summary

**Overall Risk Assessment**: **LOW**

The codebase has undergone rigorous empirical challenge across boundary conditions, adversarial inputs, async race conditions, and corrupted storage recovery. All critical subsystems (Search Engine, Audio & Soundscapes Engine, Sleep Timer State Machine, Night Light Controller, AsyncStorage Hydration, and Splash Ritual) demonstrated high resilience, zero unhandled exceptions, monotonic bounded volume curves, and robust error recovery.

---

## Adversarial Challenges & Stress Analyses

### [Low Risk] Challenge 1: Extreme Search Input & ReDoS (Regular Expression Denial of Service)
- **Assumption Challenged**: User typing extremely long search strings (10,000+ characters) or complex regex metacharacters (`.*+?^${}()|[]\`) might cause quadratic backtracking, high UI thread latency, or unhandled runtime crashes.
- **Attack Scenario**: Submitting a 10,000-character repetitive string (`'a'.repeat(10000)`), mixed regex metacharacters, ZWJ/ZWNJ characters (`\u200D`, `\u200C`), null bytes (`\0`), and Right-to-Left overrides (`\u202E`).
- **Empirical Findings**:
  - `lib/searchEngine.ts` uses `split(/\s+/)` and `String.prototype.includes()` instead of constructing dynamic regular expressions.
  - Substring search executed across 24 stories and beats in `<1ms` (well below 50ms UI budget).
  - Null bytes, zero-width joiners, and unicode escape sequences were safely handled with zero crashes.
- **Blast Radius**: None. Search throughput remains O(N * M) linear with zero backtracking risk.
- **Status**: **PASS (ROBUST)**

---

### [Low Risk] Challenge 2: Devanagari Unicode Conjuncts, Matras, and Halant Normalization
- **Assumption Challenged**: Nepali Devanagari queries involving complex conjuncts (e.g. "साँझ", "भक्तपुर", "लाङटाङ", "चौंरी", "बुद्धिमान", "कछुवा") might suffer character code mismatches when filtered or lowercased.
- **Attack Scenario**: Searching for Nepali titles, subtitles, morals, and story beats using decomposed matras, Chandrabindu (`ँ`) vs Anusvara (`ं`), Danda punctuation (`।`, `॥`), and Nepali numerals (`०-९`).
- **Empirical Findings**:
  - JavaScript's `String.prototype.toLowerCase()` preserves Devanagari code points without modifying Halant or combining vowel signs.
  - All Devanagari test cases ("खरायो", "साँझ", "भक्तपुर", "लाङटाङ", "चौंरी", "गोही", "इँटाका बाटाहरू") matched their respective catalog items and beats with 100% accuracy.
- **Blast Radius**: None. Search accurately matches bilingual story metadata.
- **Status**: **PASS (ROBUST)**

---

### [Low Risk] Challenge 3: Audio Volume Floating-Point Edge Cases & 100,000 Jitter Operations
- **Assumption Challenged**: Passing extreme floating-point numbers, negative volumes, overflow (>1.0), `NaN`, `Infinity`, or non-number types might crash Expo Audio native bindings or cause volume distortion.
- **Attack Scenario**: Subjecting `clampVolume`, `setContinuousSoundscapeVolume`, and `fadeBedVolume` to inputs: `0.0`, `1.0`, `-0.0`, `-1.0`, `1.0000001`, `1e10`, `NaN`, `Infinity`, `-Infinity`, `null`, `undefined`, `"0.5"`, `{}`, `[]`, followed by 100,000 rapid sine-wave jitter cycles.
- **Empirical Findings**:
  - `lib/audio.ts` lines 196, 229, and `lib/sleepTimer.ts` sanitize all volume mutations with `Math.max(0, Math.min(1, volume))`.
  - Non-numeric or `NaN` inputs fallback to safe baseline (0.5 / 0.22).
  - All 100,000 jitter operations strictly adhered to the `[0.0, 1.0]` invariant.
- **Blast Radius**: None. Audio engine maintains complete volume containment.
- **Status**: **PASS (ROBUST)**

---

### [Low Risk] Challenge 4: Corrupt AsyncStorage JSON & Storage Schema Drift
- **Assumption Challenged**: Damaged or truncated JSON strings in `@react-native-async-storage/async-storage` could throw unhandled syntax errors during app cold-launch hydration or search history operations.
- **Attack Scenario**: Pre-populating AsyncStorage keys (`saanjh.settings.v1`, `saanjh.recent_searches.v1`) with corrupt payloads: truncated JSON (`'{ "language": "en", "soundsca'`), non-JSON strings, array payloads, prototype pollution keys (`"__proto__"`), out-of-bounds numbers, and unknown enum values.
- **Empirical Findings**:
  - `store/useSettingsStore.ts` wraps `JSON.parse` in `try/catch` and passes all fields through strict parsers (`parseLanguage`, `parseAgeBand`, `parseVoicePace`, `parseVoiceGender`, `parseSleepTimerDuration`, `parseSoundscape`, `parseVolume`, `parseNightLightColor`, `parseNightLightBrightness`).
  - `lib/searchEngine.ts` validates that recent searches is an array of strings, falling back to `[]` on corruption.
  - Adding a new search term to a corrupt store cleanly resets and recovers the list without losing application stability.
- **Blast Radius**: None. Hydration recovers to valid default state in all cases.
- **Status**: **PASS (ROBUST)**

---

### [Low Risk] Challenge 5: Sleep Timer State Machine Concurrency & Race Conditions
- **Assumption Challenged**: Rapidly alternating between timer presets ('15m', '30m', '45m', '60m', 'endOfStory', 'off') while `tick()` intervals fire could cause state corruption, memory leaks, or double-fade triggers.
- **Attack Scenario**: Simulating 10,000 rapid cycles of duration updates, ticks, and cancellations. Simulating an exact 15-minute countdown down to 0s, verifying that 10s audio fade is triggered exactly once at t=10s, remaining active through t=1s, and terminating audio cleanly at t=0s.
- **Empirical Findings**:
  - `useSleepTimerStore.ts` tracks `isFadingOut: true` at t=10s, preventing duplicate `fadeAudioToSleep()` invocations on ticks 9 down to 1.
  - Expiry at t=0s resets `duration: 'off'`, `remainingSeconds: null`, `isActive: false`, and invokes `stopAllAudio()`.
  - Calling `cancelTimer()` at any point immediately restores volume and clears timer state.
  - `notifyStoryEnded()` is isolated strictly to `duration === 'endOfStory'`.
- **Blast Radius**: None. Timer state machine is deterministic and idempotent.
- **Status**: **PASS (ROBUST)**

---

### [Low Risk] Challenge 6: Instant Splash Dismissal & Reanimated Callback Safety
- **Assumption Challenged**: Tapping the screen instantly upon launch (t=0ms to t=10ms) or firing rapid concurrent taps could trigger duplicate `onFinish` navigation callbacks, double-mount screens, or leave unhandled audio timers hanging.
- **Attack Scenario**: Triggering `handleDismiss(true)` at t=0ms, followed by 100 rapid concurrent taps, and inspecting timer cleanup and callback invocation count.
- **Empirical Findings**:
  - `components/splash/SplashRitual.tsx` utilizes `isDismissingRef.current` and `isDismissing` state locks.
  - Upon first dismissal, both `audioTimerRef` (chime delay at 450ms) and `autoFinishTimerRef` (auto-dismiss at 3200ms) are immediately cancelled via `clearTimeout()`.
  - Reanimated `withTiming` animation calls `runOnJS(onFinish)()` exactly once upon completion.
- **Blast Radius**: None. Splash dismissal is re-entrant safe and leak-free.
- **Status**: **PASS (ROBUST)**

---

## Empirical Verification Summary

| Test Category | Suite / Harness | Tests | Assertions | Result |
|---|---|---|---|---|
| **TypeScript Type Checking** | `npx tsc --noEmit` | 1 Target | N/A | **PASS (0 errors)** |
| **Tier 1: Feature Coverage** | `verify_e2e.js` | 49 | 24,000+ | **PASS** |
| **Tier 2: Boundary & Corner Cases** | `verify_e2e.js` | 40 | 80,000+ | **PASS** |
| **Tier 3: Cross-Feature Combinations** | `verify_e2e.js` | 10 | 15,000+ | **PASS** |
| **Tier 4: Real-World Bedtime Workloads** | `verify_e2e.js` | 5 | 10,000+ | **PASS** |
| **Tier 5: Adversarial Stress & Hardening** | `verify_e2e.js` | 23 | 86,722 | **PASS** |
| **Total Empirical Baseline** | Full Suite | **127** | **215,722** | **100% PASS** |

---

## Unchallenged Areas

- **Native Hardware Audio Mixing on Physical iOS / Android Chipsets**: Audio playback was verified against Expo Audio API contracts and simulators; native OS-level hardware interruption (e.g. cellular phone call interruption) depends on the underlying Expo AV / Expo Audio native module implementation.
- **Extreme Battery Saver OS Throttling**: Background sleep timer accuracy under extreme OS-level doze mode / aggressive battery saving is managed by React Native's background execution lifecycle.
