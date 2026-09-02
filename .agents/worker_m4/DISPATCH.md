## 2026-09-02T06:37:27Z
You are the Worker for Milestone 4 (M4: Essential Bedtime Sleep Features & Settings Revamp).
Your Working Directory: d:\Antigravity Projects\Bedtime Stories\.agents\worker_m4
Original Request: d:\Antigravity Projects\Bedtime Stories\.agents\ORIGINAL_REQUEST.md
Master Project: d:\Antigravity Projects\Bedtime Stories\PROJECT.md
Survey Blueprint: d:\Antigravity Projects\Bedtime Stories\.agents\spec_miner_survey_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Mission:
Implement the complete suite of Bedtime Sleep Features & Settings Revamp:
1. Audio Assets & Engine:
   - Synthesize `assets/audio/rain.wav` using `scripts/make-audio.js` (and run `node scripts/make-audio.js`).
   - Register `'rain'` in `types/story.ts` (`SoundId`) and `lib/sounds.ts`.
   - Update `lib/audio.ts` with continuous background playback (`shouldPlayInBackground: true`), volume fade helpers, and independent soundscape playback.
2. Bedtime Sleep Timer:
   - Implement `store/useSleepTimerStore.ts` & `lib/sleepTimer.ts`:
     * Durations: `off`, `15m`, `30m`, `45m`, `60m`, `endOfStory`.
     * Live remaining seconds calculation and tick mechanism.
     * 10-second volume fade down to 0 across all audio and full stop on expiry.
     * `notifyStoryEnded()` trigger for `endOfStory`.
   - Implement `components/sleep/SleepTimerHeaderBadge.tsx`:
     * Live countdown indicator pill (`⏰ MM:SS`) with pulsating amber glow when active.
     * Tapping opens a bottom sheet / modal duration selector.
3. Continuous Sleep Soundscapes (White Noise Player):
   - Implement `components/sleep/SoundscapesPlayer.tsx`:
     * Accessible from Home & Settings.
     * 5 continuous looping ambient sounds: Rain (`rain`), Mountain River (`river`), Night Crickets (`night`), Himalayan Breeze (`wind`), Temple Chime (`chime`).
     * Independent Play/Pause, sound selection chips, volume slider, looping state.
4. Bedtime Night Light Mode:
   - Implement `components/sleep/NightLightModal.tsx`:
     * Fullscreen warm amber (`#E8A04A`) and moonlight (`#8CA0B8`) glowing mode.
     * Soft brightness slider (0.05 to 1.0), subtle breathing pulse, tap-to-exit, activates `useKeepAwake()`.
5. Revamped Settings Screen (`app/settings.tsx`) & Store (`store/useSettingsStore.ts`):
   - Redesign `app/settings.tsx` with 4 clean visual cards:
     * Card 1: Audio & Voices (`कथावाचक र स्वर`) — Pace, Voice Gender, AI Voice Beta toggle, Hear a Line preview, Story SFX toggle.
     * Card 2: Sleep Timer & Ambiance (`निद्रा टाइमर र आवाज`) — Sleep timer picker, live badge, Soundscapes player embedded.
     * Card 3: Language & Age Group (`भाषा र उमेर समूह`) — Bilingual EN/NE toggle, Audience Category & 8 Age Bands.
     * Card 4: Display & Night Light (`डिस्प्ले र नाइट लाइट`) — Keep screen awake toggle, Night Light mode launcher & theme selector.
   - Update `store/useSettingsStore.ts` with complete schema and AsyncStorage persistence (`saanjh.settings.v1`).
6. Integration in `app/_layout.tsx`, `app/index.tsx`, `app/library.tsx`:
   - Mount `<SleepTimerHeaderBadge />` on headers.
   - Embed soundscapes / night light launchers.
   - Register global timer tick in `_layout.tsx` or store.
