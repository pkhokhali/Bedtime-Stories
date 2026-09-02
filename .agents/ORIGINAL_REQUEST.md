# Original User Request

## 2026-09-02T10:48:47Z

Comprehensive UI/UX, Graphic Design, and Feature Overhaul for Saanjh Bedtime Stories (Mobile App). Elevate the mobile application into a world-class, enchanting bedtime experience. Implement an animated magical storybook splash ritual, an atmospheric night background with animated twinkling stars and mountain pine silhouettes, a floating search button that opens a full-screen search modal with trending stories, and a suite of bedtime sleep features including an audio sleep timer, a continuous sleep soundscapes white noise player, and a soft room night light mode. Ensure the app runs cleanly in Expo Dev mode (`npx expo start`) for live development testing.

Working directory: d:\Antigravity Projects\Bedtime Stories
Integrity mode: development

## Requirements

### R1. Magical Storybook Animated Splash Ritual
Implement a soothing, high-end entrance ritual displayed when the app launches:
- An animated glowing storybook that gently opens with Reanimated / SVG animations.
- Floating magical stardust/sparkle particle effects radiating from the pages.
- Elegant bilingual logo reveal ("Saanjh" / "साँझ - Bedtime Stories & Novels").
- Soft chime / ambient chime sound sting upon opening (`assets/audio/chime.wav`).
- Seamless, gentle crossfade into the home screen when the ritual concludes (or upon tap to skip).

### R2. Atmospheric Bedtime Background & Visual Graphic Design
Replace static/solid backgrounds across the app with an enchanting nocturnal atmosphere:
- A shared dynamic background component featuring animated twinkling stars with subtle opacity/scale sine-wave oscillations.
- Layered silhouettes of Himalayan mountain pine trees along the bottom/horizon.
- Deep midnight celestial palette (warm nocturnal gradient blending midnight blue, deep slate `#0c1222`, and warm amber glow `#E8A04A`).
- Reusable across Home (`app/index.tsx`), Library (`app/library.tsx`), Settings (`app/settings.tsx`), and Story Details.

### R3. Dedicated Full-Screen Search & Discovery Modal
Provide an intuitive, fast search experience:
- A stylish floating search action button (or header search icon) accessible from Home and Library.
- Clicking opens a dedicated, full-screen search modal with a smooth blur/dim backdrop.
- Real-time bilingual search input supporting English and Nepali Devanagari text matching story titles, subtitles, tags, and story IDs.
- Quick filter pills: "Toddlers (2-4)", "Kids (6-8)", "Novels & Parents", "Folk Tales", "Animal Stories", "Audio Only".
- Displays "Trending Stories" and "Recent Searches" when the search query is empty.
- Immediate navigation to the Story Detail preview screen upon selecting any result.

### R4. Essential Bedtime Sleep Features & Settings Revamp
Transform the app into the ultimate nighttime bedtime companion:
- **Bedtime Sleep Timer**: Configurable sleep timer (15 min, 30 min, 45 min, 60 min, or "End of Current Story"). When the timer expires, audio and screen brightness gently fade out to silence.
- **Continuous Sleep Soundscapes (White Noise Player)**: A dedicated sleep ambiance player accessible from home/settings where users can play soothing continuous sounds (`rain`, `river`, `night crickets`, `gentle wind`, `temple chime`) to help children or adults fall asleep without needing a story running.
- **Bedtime Night Light Mode**: A soothing, full-screen warm amber/moonlight glow mode with adjustable soft brightness for parents placing the phone on a bedside nightstand.
- **Revamped Settings Screen**: Redesign `app/settings.tsx` to group controls into clean visual cards: Audio & Voices, Sleep Timer & Ambiance, Language & Age Group, Display & Night Light.

### R5. Expo Dev Server Compatibility
Ensure the completed app runs cleanly via `npx expo start`:
- All new components must be compatible with the Expo managed workflow.
- The Expo dev server must launch without errors or unresolved module warnings.
- The app must render correctly in Expo Go on a physical Android device or Android emulator.

## Acceptance Criteria

### Splash Screen
- [ ] On app launch, the magical storybook opening animation plays smoothly with floating stardust particles and bilingual logo text.
- [ ] The intro chime audio plays gently during the animation.
- [ ] Tapping the screen allows immediate skip directly to the home screen without lag.
- [ ] Splash does not block or cause double-mounting of the navigation stack.

### Background Atmosphere
- [ ] The app renders animated twinkling stars and subtle mountain silhouettes behind the home and library content.
- [ ] Star animations run at 60 FPS on the native thread without causing scroll stutter on story carousels.

### Search & Discovery
- [ ] Tapping the search icon opens the full-screen search modal with focused input.
- [ ] Typing in English (e.g., "rabbit", "pine", "scandal") or Nepali (e.g., "खरायो", "बादल") instantly filters the 24+ stories.
- [ ] Selecting a quick filter tag (e.g., "Novels & Parents") filters the catalog to matching stories.
- [ ] Tapping any search result navigates directly to that story's preview screen.

### Sleep Features & Settings
- [ ] Starting a 15-minute Sleep Timer shows an active countdown indicator in the app header.
- [ ] When the sleep timer reaches zero during story or soundscape playback, volume fades down over 10 seconds and stops playback.
- [ ] The Sleep Soundscapes white noise player can be started/stopped independently and continues looping smoothly.
- [ ] Night Light mode can be toggled on to display a soothing full-screen warm glow with tap-to-exit.
- [ ] Settings screen renders the new card-based UI with persistent user preferences in AsyncStorage.

### Build & Dev Verification
- [ ] `npx tsc --noEmit` passes with 0 TypeScript errors.
- [ ] `npx expo start` launches the Expo dev server without errors or unresolved module warnings.
- [ ] The app loads and renders correctly on an Android device/emulator via Expo Go or dev client.
- [ ] All changes committed and pushed to git.
