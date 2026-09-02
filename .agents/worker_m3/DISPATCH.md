## 2026-09-02T12:13:19+05:45

Mission:
Implement the complete Dedicated Full-Screen Search & Discovery Modal across:
1. `lib/searchEngine.ts`:
   - Real-time bilingual search matching English and Nepali Devanagari text across `title.en`, `title.ne`, `subtitle.en`, `subtitle.ne`, `theme.en`, `theme.ne`, tags, and story IDs across all 24+ local and remote stories.
   - 6 Quick filter pills:
     * Toddlers (2-4): `ageBand === '2-4' || ageBand === '4-6'`
     * Kids (6-8): `ageBand === '6-8' || ageBand === '9-12'`
     * Novels & Parents: `form === 'novel' || ageBand === 'parents' || ageBand === '25+' || ageBand === '18-25'`
     * Folk Tales: `category === 'roots'`
     * Animal Stories: Stories with animal characters (`clever-rabbit`, `moon-rabbit`, `sleepy-yak`, `koshi-crocodile`, `dove-net`, `yeti-quiet`, `firefly-lights`, etc.)
     * Audio Only: Stories with audio narration / beats
   - `getTrendingStories(catalog)`: Returns 4 curated popular bedtime stories.
   - Recent Searches AsyncStorage helper: Key `saanjh.recent_searches.v1`.
2. `components/search/SearchTriggerFAB.tsx`:
   - Floating action button (FAB) with glowing warm amber styling (`#E8A04A`), celestial shadow, search icon, positioned at bottom-right of Home & Library.
3. `components/search/SearchDiscoveryModal.tsx`:
   - Fullscreen modal (`animationType="fade"`, `transparent={true}`) with deep celestial blur / nocturnal gradient backdrop (`#060913` -> `#0c1222`).
   - Header: Auto-focused bilingual SearchBar (`"खोज्नुहोस् / Search bedtime stories..."`), clear button, dismiss button.
   - Quick filter chips row with glowing active states.
   - Discovery state (when query is empty):
     * Recent Searches chips with "Clear" action.
     * Trending Stories recommendations with badges.
   - Results state: Clean story cards with cover image / icon, bilingual title, category badge, age band pill, and runtime indicator.
   - On result tap: Closes modal immediately and calls `router.push('/story-detail/' + story.id)`.
4. Integration in `app/index.tsx` & `app/library.tsx`:
   - Add header search icon and `<SearchTriggerFAB onPress={() => setIsSearchOpen(true)} />`.
   - Mount `<SearchDiscoveryModal visible={isSearchOpen} onClose={() => setIsSearchOpen(false)} />`.

Write Ownership:
- `lib/searchEngine.ts`
- `components/search/SearchTriggerFAB.tsx`
- `components/search/SearchDiscoveryModal.tsx`
- `components/search/index.ts`
- `app/index.tsx`
- `app/library.tsx`

Verification Requirements:
1. Run `npx tsc --noEmit` (must pass with 0 errors).
2. Run `node scripts/verify_e2e.js` (must pass 100% tests).
3. Maintain `progress.md` with timestamps.
4. Write `handoff.md` with implementation details and verification results.
5. Send completion message back.
