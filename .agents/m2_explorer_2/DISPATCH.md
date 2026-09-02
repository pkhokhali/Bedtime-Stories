## 2026-09-01T08:29:14Z

<USER_REQUEST>
You are Explorer 2 for Milestone 2 (Audio & Scene Metadata Controls).
Your working directory is: d:\Antigravity Projects\Bedtime Stories\.agents\m2_explorer_2

Task:
1. Read:
   - `d:\Antigravity Projects\Bedtime Stories\.agents\ORIGINAL_REQUEST.md`
   - `d:\Antigravity Projects\Bedtime Stories\PROJECT.md`
   - `d:\Antigravity Projects\Bedtime Stories\TEST_READY.md`
   - `d:\Antigravity Projects\Bedtime Stories\.agents\survey_explorer_contracts\report.md`
2. Formulate comprehensive component architecture and implementation blueprints for:
   - `admin/src/types/story.ts`: Exact TypeScript definitions for `Language`, `StoryCategory`, `StoryForm`, `AgeBand` (all 8: `2-4`, `4-6`, `6-8`, `9-12`, `13-17`, `18-25`, `25+`, `parents`), `StageKind` (7 options), `SceneId` (13 options), `VoiceRole` (4 options), `SoundId` (9 options), `Pose` (8 options), `Localized`, `Beat`, and `Story`.
   - `admin/src/components/AudioMetadataControls.tsx`: Story-level and Beat-level audio controls:
     - Story-level `stage` selector (`forest`, `moon`, `river`, `courtyard`, `hills`, `lamp`, `stars`).
     - Beat-level `scene` selector (`establishing`, `meeting`, `walk`, `roar`, `well`, `leap`, `peace`, `moon`, `river`, `courtyard`, `hills`, `lamp`, `stars`).
     - Beat-level `voice` role selector (`narrator`, `soft`, `rabbit`, `tiger`).
     - Beat-level `music` (ambient sound bed: `night`, `moon`, `river`, `courtyard`, `wind`).
     - Beat-level `sfx` sound effects (`roar`, `splash`, `ripple`, `chime`).
     - Character pose selectors for `rabbit` and `tiger` (`hidden`, `idle`, `walk`, `bow`, `sit`, `roar`, `leap`, `lookDown`).
     - Ambient bed resolution preview showing the active soundscape cascade.
3. Write your report to: `d:\Antigravity Projects\Bedtime Stories\.agents\m2_explorer_2\report.md`
4. Write your handoff to: `d:\Antigravity Projects\Bedtime Stories\.agents\m2_explorer_2\handoff.md`
5. Send a completion message when done.
</USER_REQUEST>
