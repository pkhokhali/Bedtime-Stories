# Original User Request

## 2026-09-01T06:01:56Z

Implement a production-ready upgrade ("Saanjh 3.0") to an existing Expo/React Native bilingual (English/Nepali) bedtime story app called "Saanjh." The app currently has 21 stories with procedural 2D SVG animations, TTS narration via expo-speech, a Cloudflare Workers KV API backend, and a React Vite admin panel. The codebase is at `d:\Antigravity Projects\Bedtime Stories`. This upgrade has four pillars: (1) fix 7 confirmed bugs in the existing codebase, (2) build an AI-powered Story Narrator that makes text-only stories and novels listenable with human-like voice and ambient soundscapes, (3) overhaul the mobile UI with a story detail/preview screen and unified browsing, and (4) add sample content demonstrating the new features. The result must be Play Store ready.

Working directory: d:\Antigravity Projects\Bedtime Stories
Integrity mode: development

## Requirements

### R1. Fix All Confirmed Bugs

Fix these 7 bugs discovered by audit:

1. **Corrupted Nepali text in `app/index.tsx`** — Lines 64–88 render `????` question marks instead of Devanagari script for carousel section titles. Replace with proper Nepali strings matching the bilingual pattern used throughout `constants/ui.ts`.
2. **`parseAgeBand` in `store/useSettingsStore.ts` missing `'parents'`** — The validation function on lines 45–53 does not recognize the `'parents'` age band, causing it to reset to `'4-6'` on app reload. Add `'parents'` to the valid values.
3. **Dead code: `components/SplashRitual.tsx`** — 70-line component that is never imported or rendered. Delete it.
4. **Unused imports in `app/index.tsx`** — `storiesForAge`, `ageBands`, `radii`, `spacing` are imported but never used. Remove them.
5. **Admin Panel age band mismatch in `admin/src/App.tsx`** — The `<select>` for Target Audience offers `'7-9'` which doesn't match mobile age bands (`'6-8'` and `'9-12'`). Fix the options to match the mobile app's `AgeBand` type.
6. **No API authentication on `backend/src/index.ts`** — The `POST /catalog` endpoint has zero auth. Add a Bearer token check using a `ADMIN_SECRET` environment variable in the Cloudflare Worker, and update the Admin Panel to send the token.
7. **AdMob dummy unit IDs in `components/AdBanner.tsx`** — Production builds use placeholder strings `ca-app-pub-xxxxxxxx`. Either use real IDs from the existing `app.json` config or make the component gracefully hide itself when no valid ID is configured.

### R2. AI-Powered Story Narrator & Novel Reader

Build a narrator system that converts any text-only story or novel into a rich, listenable audio experience. The system must have two layers:

**Layer 1 — Enhanced On-Device Narration (Primary, Free):**
Upgrade the existing `expo-speech` TTS system (`lib/speech.ts`) to produce dramatically better output:
- Add strategic pauses between sentences and paragraphs (not machine-gun delivery)
- Add SSml-style emphasis markers for dialogue vs. narration where the platform supports it
- Implement character voice differentiation beyond simple pitch shifts (vary rate, pitch, and volume per voice role)
- Auto-detect and insert ambient background sound beds that match the story's `sceneId` or `stageKind` during narration
- Layer a soft background music bed under all narration that fades in/out between beats
- Add a gentle wind-down/fadeout in the final beat of every story

**Layer 2 — Cloud AI Voice (Optional Upgrade, Google Cloud TTS Free Tier):**
Add an optional higher-quality voice path using Google Cloud Text-to-Speech API:
- Use the free tier (4 million characters/month, supports both English and Nepali neural voices)
- Implement as a toggle in Settings: "AI Voice (Beta)" on/off, defaulting to off
- When enabled, pre-fetch and cache audio for the current story's beats before playback begins
- Cache generated audio files locally so the same beat text is never re-requested
- Fall back gracefully to Layer 1 (enhanced expo-speech) if the API is unreachable or quota is exceeded

**Novel Reader Mode:**
For longer text-only content (novels, audiobooks added via the Admin Panel that have body text but no media URL):
- Implement a paginated text reader view with adjustable font size
- Add a "Read Aloud" button that narrates the current page using the narrator system above
- Auto-advance pages as narration progresses
- Show a progress bar for the overall novel

### R3. UI Overhaul & Story Detail Screen

Improve the mobile app's user experience:

1. **Story Detail / Preview Screen** — Create a new screen (`app/story-detail/[id].tsx`) that appears when tapping any story card. It should display: cover image (or a generated gradient placeholder), bilingual title, description/subtitle, age badge, runtime, a moral/lesson summary if available, and a prominent "Play" / "Listen" button. Users should preview before committing to playback.

2. **Unified Home Screen** — The current `app/index.tsx` has corrupted text and a disconnected design from the Library. Redesign it as a single cohesive browsing experience with:
   - A hero section featuring a recommended story
   - Horizontally scrolling carousels per category
   - Proper bilingual section titles (English and Nepali)
   - Smooth transitions and loading states

3. **Favorites System** — Add a heart/bookmark toggle on story cards and the detail screen. Store favorites in AsyncStorage. Show a "My Favorites" carousel on the home screen when the user has saved stories.

4. **Loading & Error States** — Add skeleton placeholders while the API catalog loads, and a friendly retry screen if the fetch fails.

### R4. Sample Content & Assets

Demonstrate the new features with real content:

1. **Write 3 new bilingual stories** (English + Nepali) in the existing `data/stories/` beat format, each with 8-12 beats:
   - One for ages 2-4 (simple, comforting, nature theme)
   - One for ages 6-8 (adventure, Nepali folklore)
   - One for the Parents category (a short literary piece suitable for the Novel Reader)

2. **Add ambient sound integration metadata** to at least 5 existing stories — set appropriate `sceneId`/`stageKind` and ambient sound mappings so the AI narrator auto-layers the correct background sounds.

3. **Generate or source appropriate cover image URLs** for at least 10 stories that currently have no `coverImage` field, using freely available Creative Commons or public domain images relevant to each story's theme.

## Acceptance Criteria

### Bug Fixes
- [ ] `app/index.tsx` renders correct Nepali Devanagari text for all carousel section titles (no `?` characters)
- [ ] Selecting "Parents" age band, closing and reopening the app, correctly restores "Parents" selection
- [ ] `components/SplashRitual.tsx` no longer exists in the project
- [ ] `npx tsc --noEmit` produces zero errors related to unused imports in `app/index.tsx`
- [ ] Admin Panel age band selector shows `6-8` and `9-12` (not `7-9`)
- [ ] `POST /catalog` without a valid Bearer token returns 401 Unauthorized
- [ ] `POST /catalog` with the correct Bearer token succeeds (200)
- [ ] AdBanner component does not crash in production mode

### AI Narrator
- [ ] Opening any text-only story (one with beats but no mediaUrl) triggers the enhanced TTS narration with audible pauses between sentences
- [ ] Background ambient sound plays during narration and matches the story's scene type
- [ ] A "AI Voice (Beta)" toggle exists in the Settings screen
- [ ] When AI Voice is enabled and a valid Google Cloud TTS API key is configured, narration uses the cloud neural voice instead of device TTS
- [ ] When AI Voice is enabled but the API is unreachable, narration falls back to enhanced device TTS without crashing
- [ ] Audio files generated by Cloud TTS are cached locally and reused on subsequent plays

### UI & Navigation
- [ ] Tapping a story card anywhere in the app navigates to a Story Detail screen (not directly to the player)
- [ ] The Story Detail screen displays the story's title, description, age badge, and a Play button
- [ ] A heart/favorite toggle is visible on the Story Detail screen and persists across app restarts
- [ ] The home screen shows a "My Favorites" section when the user has favorited at least one story
- [ ] The home screen shows skeleton loading placeholders while fetching the remote catalog
- [ ] If the catalog fetch fails, a retry button is shown

### Content
- [ ] At least 3 new story files exist in `data/stories/` with 8+ beats each, containing both English and Nepali text
- [ ] The new stories are registered in `data/catalog.ts` and appear in the mobile app
- [ ] At least 10 stories in the catalog have a non-empty `coverImage` field
- [ ] At least 5 stories have scene/sound metadata that triggers automatic ambient sound during narration

### Build & Ship
- [ ] `npx tsc --noEmit` completes with zero errors
- [ ] `npm run build:apk` produces a signed APK that installs and launches without crash on Android
- [ ] All changes are committed to git with descriptive commit messages
