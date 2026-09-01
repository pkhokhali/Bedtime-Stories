## 2026-09-01T06:08:11Z

Worker 1 for Saanjh 3.0 Milestone 1: Fix 7 Confirmed Bugs & Backend Auth.
Working directory: d:\Antigravity Projects\Bedtime Stories\.agents\worker_m1
Authoritative requirements: d:\Antigravity Projects\Bedtime Stories\.agents\ORIGINAL_REQUEST.md
Project specification: d:\Antigravity Projects\Bedtime Stories\PROJECT.md
Bug survey report: d:\Antigravity Projects\Bedtime Stories\.agents\explorer_survey_1\handoff.md

Tasks:
1. Bug 1 & 4 (`app/index.tsx` & `constants/ui.ts`):
   - Add proper bilingual dictionary entries with authentic Devanagari text in `constants/ui.ts` for section titles, play button, library button, and carousels (`recentlyAdded`, `play`, `library`, `forLittleOnes`, `kidsAndTweens`, `afterHoursParents`, `youngAdults`).
   - In `app/index.tsx`, replace all `????` question mark strings with `t(ui.<key>, language)`.
   - Remove unused imports `radii`, `spacing`, `storiesForAge`, `ageBands`.
2. Bug 2 (`store/useSettingsStore.ts`):
   - Update `parseAgeBand` to recognize and preserve `'parents'` (and `'parent'`) so selecting "Parents" persists across app reloads.
3. Bug 3 (`components/SplashRitual.tsx`):
   - Delete dead unreferenced file `components/SplashRitual.tsx`.
4. Bug 5 (`admin/src/App.tsx`):
   - Replace mismatched `'7-9'` option with standard mobile age bands (`6-8`, `9-12`) matching `AgeBand` type.
5. Bug 6 (`backend/src/index.ts` & `admin/src/App.tsx`):
   - In `backend/src/index.ts`, add `ADMIN_SECRET?: string` to `Env`.
   - Protect `POST /catalog` with a Bearer token verification check: if `ADMIN_SECRET` is set, verify `Authorization: Bearer <ADMIN_SECRET>` header, returning 401 if missing/mismatched.
   - In `admin/src/App.tsx`, add an Admin Secret input / local storage state and send `Authorization: Bearer ${adminSecret}` in `POST /catalog`.
6. Bug 7 (`components/AdBanner.tsx`):
   - Make AdBanner validate that `adUnitId` is a valid unit ID (not containing dummy placeholder strings like `'xxxxxxxx'` or `'zzzzzzzz'`).
   - Add `hasError` state and `onAdFailedToLoad={() => setHasError(true)}` to return `null` and hide cleanly when dummy/invalid or load fails.

Verification:
- Run `npx tsc --noEmit` across root and ensure 0 TypeScript errors.
- Document in `handoff.md`.
- Send message to parent.
