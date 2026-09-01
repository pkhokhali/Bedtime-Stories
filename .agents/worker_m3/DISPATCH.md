## 2026-09-01T06:31:15Z

You are Worker 3 for Saanjh 3.0 Milestone 3: UI Overhaul, Story Detail Screen & Favorites.
Your working directory is: d:\Antigravity Projects\Bedtime Stories\.agents\worker_m3
The authoritative requirements are at: d:\Antigravity Projects\Bedtime Stories\.agents\ORIGINAL_REQUEST.md
The project specification is at: d:\Antigravity Projects\Bedtime Stories\PROJECT.md
The UI & content survey report is at: d:\Antigravity Projects\Bedtime Stories\.agents\explorer_survey_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your mission:
Implement the complete mobile UI overhaul:
1. **Favorites Store (`store/useFavoritesStore.ts`)**:
   - Standalone Zustand store with `persist` and `createJSONStorage(() => AsyncStorage)` under name `'saanjh.favorites.v1'`.
   - State: `favoriteIds: string[]`, `addFavorite: (id: string) => void`, `removeFavorite: (id: string) => void`, `toggleFavorite: (id: string) => void`, `isFavorite: (id: string) => boolean`.
2. **Story Detail / Preview Screen (`app/story-detail/[id].tsx`)**:
   - Create screen displaying:
     - Hero with cover image (ImageBackground) or gradient placeholder (`story.accent` / theme background).
     - Top bar with back button (`router.back()`) and animated heart favorite toggle (`toggleFavorite(story.id)`).
     - Category badge (`form === 'novel' ? 'उपन्यास' : 'सुत्ने बेलाको कथा'`).
     - Bilingual title and subtitle.
     - Metadata badges (Age badge with icon, runtime in minutes, language EN/NE).
     - Moral / lesson card displaying `story.theme` (English and Nepali).
     - Prominent "Play Story" / "Listen to Novel" CTA button navigating to `/story/${story.id}`.
   - Register `<Stack.Screen name="story-detail/[id]" />` in `app/_layout.tsx`.
3. **Unified Home Screen (`app/index.tsx`)**:
   - Hero banner featuring recommended / featured story with cover visual, title, Play CTA, and Details CTA (`/story-detail/${featuredStory.id}`).
   - "My Favorites" carousel when `favoriteIds.length > 0`.
   - Category carousels with authentic Devanagari titles.
   - Skeleton loaders (`components/StoryCardSkeleton.tsx`) during catalog fetch.
   - Friendly retry banner if remote catalog fetch fails (`catalogError`).
4. **Navigation Routing**:
   - In `components/StoryCarousel.tsx` and `app/library.tsx`, update story card tap action to navigate to `/story-detail/${story.id}` instead of directly to `/story/${story.id}`.

Verification requirement:
- Run `npx tsc --noEmit` across root and ensure 0 TypeScript errors.
- Run `node scripts/verify_e2e.js` to verify passing assertions for Milestone 3 features (F18-F21, C01, C04, S05, etc.).
- Document all changes and verification in `d:\Antigravity Projects\Bedtime Stories\.agents\worker_m3\handoff.md`.
- Send a message when ready.
