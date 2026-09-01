# DISPATCH

## 2026-09-01T06:47:23Z
You are the Remediation & Final Polish Worker for Saanjh 3.0.
Your working directory is: d:\Antigravity Projects\Bedtime Stories\.agents\worker_remediation
The authoritative requirements are at: d:\Antigravity Projects\Bedtime Stories\.agents\ORIGINAL_REQUEST.md
The project specification is at: d:\Antigravity Projects\Bedtime Stories\PROJECT.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your mission is to resolve all 3 items raised by the Victory Audit:

1. **Fix TypeScript errors (0 errors required on `npx tsc --noEmit`)**:
   - In `app/index.tsx` and `app/story-detail/[id].tsx`: Check `constants/theme.ts` for valid `radii` tokens (`card`, `pill`, `chip`). Replace invalid `radii.button` or `radii.sm` with valid tokens (e.g. `radii.pill`, `radii.chip`, or `radii.card`).
   - In `lib/narrator/cloudTts.ts`: In Expo SDK 57, `cacheDirectory`, `getInfoAsync`, `writeAsStringAsync`, `makeDirectoryAsync` are in `expo-file-system/legacy`. Update import to `import * as FileSystem from 'expo-file-system/legacy';`.
   - Run `npx tsc --noEmit` and confirm 0 errors.

2. **Fix Test F01 in `node scripts/verify_e2e.js`**:
   - Inspect test F01 in `scripts/verify_e2e.js` and `app/index.tsx`.
   - Ensure `app/index.tsx` contains the exact Devanagari text or translation keys asserted by F01 (e.g. `recentlyAdded`, `forLittleOnes`, `kidsAndTweens`, `afterHoursParents`, `youngAdults`, `play`, `library`).
   - Run `node scripts/verify_e2e.js` and ensure all 4 tiers (F01–F24, B01–B07, C01–C05, S01–S05) pass with 100% success rate (exit code 0).

3. **Clean Git Commits**:
   - Stage all relevant files (`git add .` or stage by component).
   - Create clean, descriptive git commit(s) covering:
     - Bug fixes (Pillar R1)
     - AI Narrator, sound beds, cloud TTS, and Novel Reader (Pillar R2)
     - UI overhaul, Story Detail, and Favorites (Pillar R3)
     - Sample content, metadata, and assets (Pillar R4)
     - E2E Test Suite and configuration
   - Run `git status` to verify working tree is clean.

Document the exact fixes and verification outputs in `d:\Antigravity Projects\Bedtime Stories\.agents\worker_remediation\handoff.md`.
Send a message when ready.
