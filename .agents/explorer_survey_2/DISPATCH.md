## 2026-09-01T06:02:47Z
You are Explorer 2 for Saanjh 3.0 Survey Phase.
Your working directory is: d:\Antigravity Projects\Bedtime Stories\.agents\explorer_survey_2
Authoritative requirements are at: d:\Antigravity Projects\Bedtime Stories\.agents\ORIGINAL_REQUEST.md

Your mission:
Investigate and map the audio and narration architecture with deep focus on Pillar R2 (AI-Powered Story Narrator & Novel Reader):
1. Analyze existing TTS and audio system: `lib/speech.ts`, audio playback hooks/components (`components/audio/`, `app/story/[id].tsx`, `app/novel/[id].tsx` if any, `expo-speech`, `expo-av`).
2. Layer 1 (Enhanced On-Device Narration):
   - Sentence/paragraph strategic pauses mechanism.
   - Dialogue vs narration emphasis / SSML markers where supported.
   - Character voice differentiation (rate, pitch, volume per voice role).
   - Auto-detection and insertion of ambient background sound beds matching `sceneId` or `stageKind`.
   - Soft background music bed with fade in/out between beats and gentle wind-down/fadeout on final beat.
3. Layer 2 (Cloud AI Voice):
   - Google Cloud TTS API integration (free tier, neural voices for en & ne).
   - Settings toggle: "AI Voice (Beta)" in `useSettingsStore` and Settings screen.
   - Local audio caching strategy (e.g. `expo-file-system` caching of fetched mp3/wav audio files by hash/beat key).
   - Pre-fetching mechanism for story beats.
   - Graceful fallback to Layer 1 if API key missing, network unreachable, or quota exceeded.
4. Novel Reader Mode:
   - Paginated text reader view with adjustable font size.
   - "Read Aloud" button narrating current page using narrator system.
   - Auto-advancing pages during narration and overall novel progress bar.

Write your comprehensive findings to `d:\Antigravity Projects\Bedtime Stories\.agents\explorer_survey_2\handoff.md`.
Update `progress.md` in your working directory with timestamps.
Send a message when your handoff is ready.
