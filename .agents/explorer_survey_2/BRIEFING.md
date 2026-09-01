# BRIEFING — 2026-09-01T11:52:30+05:45

## Mission
Investigate and map the audio and narration architecture for Saanjh 3.0 (Pillar R2: AI-Powered Story Narrator & Novel Reader), covering existing TTS/audio, Layer 1 on-device narration enhancements, Layer 2 Cloud AI Voice (Google Cloud TTS + caching/fallback), and Novel Reader Mode.

## 🔒 My Identity
- Archetype: Teamwork explorer
- Roles: Audio & Narration Architecture Investigator
- Working directory: d:\Antigravity Projects\Bedtime Stories\.agents\explorer_survey_2
- Original parent: 65ffadb4-051d-4185-80a2-394c719211fd
- Milestone: Saanjh 3.0 Survey Phase (Pillar R2)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement project source code
- Produce comprehensive 5-component handoff report
- Investigate Layer 1, Layer 2, Novel Reader Mode, expo-speech, expo-audio, sound beds, caching, pre-fetching, fallback

## Current Parent
- Conversation ID: 65ffadb4-051d-4185-80a2-394c719211fd
- Updated: 2026-09-01T11:52:30+05:45

## Investigation State
- **Explored paths**:
  - `lib/speech.ts` (current on-device TTS using `expo-speech`, pitch/rate rules)
  - `lib/audio.ts` & `lib/sounds.ts` (audio playback using modern `expo-audio`, sound assets)
  - `hooks/useStoryPlayback.ts` (state machine for beat narration, bed/sfx playback)
  - `components/player/` (`StoryPlayer.tsx`, `MediaStoryPlayer.tsx`, `SeekBar.tsx`, `PlayerChrome.tsx`, `SleepFade.tsx`, `SubtitleBar.tsx`)
  - `components/scenes/` (`ForestStage.tsx`, `NightStage.tsx`)
  - `data/catalog.ts`, `data/stories/` (beats, novels, voice roles, scene/stage metadata)
  - `store/useSettingsStore.ts` & `app/settings.tsx` (voice pace, voice gender, night sounds, keep awake)
  - `admin/src/App.tsx`, `backend/src/index.ts`, `lib/catalogFetcher.ts`, `lib/downloadManager.ts`
- **Key findings**:
  - `expo-speech` currently fires single-shot strings per beat with no sentence pauses, dialogue modulation, or SSML handling.
  - `expo-audio` (~57.0.3) is used for audio beds/SFX; needs volume fading engine, cross-fading, and final-beat sleep wind-down.
  - Ambient sound bed auto-detection can map `beat.scene` and `story.stage` to sound files (`night`, `moon`, `river`, `courtyard`, `wind`).
  - Layer 2 Cloud AI Voice can use Google Cloud TTS free tier (`en-IN-Neural2-A`/`en-US-Neural2-F` and `ne-NP-Standard-A`), cached to `${FileSystem.cacheDirectory}tts_cache/` with SHA hash keys and pre-fetching queue.
  - Novel Reader Mode requires paginated reader view, font scaling controls, "Read Aloud" integration with unified narrator, auto-advance, and novel progress bar.
- **Unexplored areas**: None for Pillar R2 scope.

## Key Decisions Made
- Fully analyzed all 4 core subsections of Pillar R2 and prepared end-to-end architecture specification for `handoff.md`.

## Artifact Index
- DISPATCH.md — Received mission prompts
- progress.md — Liveness and step tracking
- BRIEFING.md — Situational awareness
- handoff.md — Comprehensive findings report (target)
