## 2026-09-02T06:17:11Z

You are the Worker for Milestone 2 (M2: Atmospheric Bedtime Background & Visual Graphic Design).
Your Working Directory: d:\Antigravity Projects\Bedtime Stories\.agents\worker_m2
Original Request: d:\Antigravity Projects\Bedtime Stories\.agents\ORIGINAL_REQUEST.md
Master Project: d:\Antigravity Projects\Bedtime Stories\PROJECT.md
Survey Blueprint: d:\Antigravity Projects\Bedtime Stories\.agents\explorer_survey_2\handoff.md

Mission:
Implement the complete Atmospheric Bedtime Background and integrate it across all primary screens:
1. `components/background/TwinklingStarfield.tsx`:
   - 32 deterministic star nodes spread across the celestial canvas.
   - Sizing: 1.5px to 3.5px with subtle glow for brighter stars (`#FFFFFF`, `#F4E6C8`, `#E8A04A`).
   - Pure Reanimated UI-thread sine-wave opacity and scale oscillations at 60 FPS without JS bridge contention or scroll lag.
   - `pointerEvents="none"`.
2. `components/background/HimalayanHorizon.tsx`:
   - Multi-layer SVG vector silhouettes anchored to the bottom (height ~160-200px): distant ridge layer, sharp mountain peak contours, and detailed Himalayan pine tree / conifer silhouettes.
   - `pointerEvents="none"`.
3. `components/background/AtmosphericBackground.tsx`:
   - Fullscreen `LinearGradient` base (`['#060913', '#0c1222', '#121A2F', '#1B1428', '#22151D']`).
   - Mounts `<TwinklingStarfield>` and `<HimalayanHorizon>`.
   - Props interface: `showStars?: boolean`, `showHorizon?: boolean`, `intensity?: 'full' | 'subtle' | 'dim'`, `style?: StyleProp<ViewStyle>`, `children?: React.ReactNode`.
4. Integration:
   - `app/index.tsx`: Replace static background with `<AtmosphericBackground>`. Translucent card styling (`rgba(18, 26, 44, 0.72)`).
   - `app/library.tsx`: Wrap content with `<AtmosphericBackground>`.
   - `app/settings.tsx`: Wrap content with `<AtmosphericBackground>`.
   - `app/story-detail/[id].tsx`: Wrap with `<AtmosphericBackground>`.

Write Ownership:
- `components/background/TwinklingStarfield.tsx`
- `components/background/HimalayanHorizon.tsx`
- `components/background/AtmosphericBackground.tsx`
- `app/index.tsx`
- `app/library.tsx`
- `app/settings.tsx`
- `app/story-detail/[id].tsx`

Verification Requirements:
1. Run `npx tsc --noEmit` (must pass with 0 errors).
2. Run `node scripts/verify_e2e.js` (must pass all tests).
3. Maintain `progress.md` with timestamps.
4. Write `handoff.md` with details of implementation and verification command outputs.
5. Send completion message back.
