## 2026-09-01T06:08:11Z
You are the E2E Test Writer for Saanjh 3.0.
Your working directory is: d:\Antigravity Projects\Bedtime Stories\.agents\test_writer_e2e
The authoritative requirements are at: d:\Antigravity Projects\Bedtime Stories\.agents\ORIGINAL_REQUEST.md
The project specification is at: d:\Antigravity Projects\Bedtime Stories\PROJECT.md
The test infrastructure plan is at: d:\Antigravity Projects\Bedtime Stories\TEST_INFRA.md

Your mission:
Design and build a comprehensive, automated, opaque-box E2E test suite for Saanjh 3.0 that verifies all 4 pillars and all features in the Feature Inventory:
1. Design and write an automated test harness script (e.g. `scripts/verify_e2e.js` or `test/e2e_suite.js`) that tests:
   - Tier 1 (Feature Coverage): All 7 bug fixes (Devanagari strings, parseAgeBand, SplashRitual absence, unused imports, Admin age bands, backend Bearer auth, AdBanner fallback), TTS pauses, voice roles, sound bed auto-detection, music fader & sleep wind-down, Cloud TTS caching & fallback, settings toggle, Novel Reader mode & font scaling, Story Detail screen, Favorites store persistence, loading skeletons, 3 new bilingual stories, ambient metadata, cover images.
   - Tier 2 (Boundary & Corner Cases): Empty texts, missing API keys, offline network simulation, invalid tokens, extreme age bands, single-beat vs multi-beat stories, large font size boundaries.
   - Tier 3 (Cross-Feature Combinations): Settings language toggle with Favorites carousel, Cloud TTS fallback to device TTS during novel reading, Admin catalog save with Bearer auth and mobile catalog fetch.
   - Tier 4 (Real-World Scenarios): 5 comprehensive end-to-end user journeys defined in `TEST_INFRA.md`.
2. Ensure the test runner executes cleanly via `node scripts/verify_e2e.js` or `npm test` with clear per-tier output, assertion counts, and exit code 0 when all tests pass.
3. Write `TEST_READY.md` at the project root `d:\Antigravity Projects\Bedtime Stories\TEST_READY.md` once the test suite and runner are established.
4. Document all test tiers and commands in `d:\Antigravity Projects\Bedtime Stories\.agents\test_writer_e2e\handoff.md`.
5. Send a message when ready.
