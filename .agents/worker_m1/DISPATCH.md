## 2026-09-02T06:10:16Z
You are the Worker for Milestone 1 (M1: Magical Storybook Animated Splash Ritual).
Your Working Directory: d:\Antigravity Projects\Bedtime Stories\.agents\worker_m1
Original Request: d:\Antigravity Projects\Bedtime Stories\.agents\ORIGINAL_REQUEST.md
Master Project: d:\Antigravity Projects\Bedtime Stories\PROJECT.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Mission:
Implement the complete, high-fidelity Magical Storybook Animated Splash Ritual according to the Explorer blueprints:
1. `components/splash/AnimatedStorybook.tsx`:
   - Detailed SVG vector rendering: leather spine, golden Paubha/filigree corner ornaments, stacked parchment pages with vintage illustration watermark, inner parchment radiance with RadialGradient, vertical light flare.
   - Reanimated 3D perspective opening animation (`perspective: 800`, `rotateY: 0deg -> -165deg`, multi-leaf fluttering, breathing glow).
   - Reference blueprint: `d:\Antigravity Projects\Bedtime Stories\.agents\explorer_m1_1\blueprint_AnimatedStorybook.tsx` & `handoff.md`.
2. `components/splash/StardustParticles.tsx`:
   - 20-24 floating stardust / sparkle particles (✦, ★, glowing dots) radiating upward from the open pages with ballistic lift, horizontal sine fanning, scale twinkling, and Reanimated UI-thread worklets.
   - Reference blueprint: `d:\Antigravity Projects\Bedtime Stories\.agents\explorer_m1_2\handoff.md`.
3. `components/splash/SplashRitual.tsx`:
   - Complete splash orchestration: Nocturnal gradient canvas (`#060913` -> `#0c1222` -> `#121a2f`), pulsing celestial aura behind book, mounting `<AnimatedStorybook>` & `<StardustParticles>`, synchronized chime sound sting (`playChime()` from `lib/audio.ts` at ~450ms with timeout cleanup), bilingual typography reveal ("Saanjh" • "साँझ" and subtitle), tap-to-skip with 380ms crossfade, and auto-finish with 500ms crossfade.
   - Sets `pointerEvents="none"` during dismissal to prevent touch lag.
   - Reference blueprint: `d:\Antigravity Projects\Bedtime Stories\.agents\explorer_m1_3\handoff.md`.
4. `app/_layout.tsx`:
   - Integrate `<SplashRitual onFinish={() => setShowSplash(false)} />` as an absolute in-tree overlay above `<Stack>`.
   - Ensure font loading, store hydration (`useSettingsStore.hydrate()`), speech voice hydration, and remote catalog fetching run smoothly in the background.

Write Ownership:
You exclusively own:
- `components/splash/AnimatedStorybook.tsx`
- `components/splash/StardustParticles.tsx`
- `components/splash/SplashRitual.tsx`
- `app/_layout.tsx`

Verification Requirements:
1. Run `npx tsc --noEmit` and ensure 0 errors.
2. Maintain `progress.md` with timestamps.
3. Write a comprehensive `handoff.md` with:
   - Summary of implemented components
   - Verification commands executed and exact terminal outputs
   - Code layout compliance
4. Send a message back to parent when done.
