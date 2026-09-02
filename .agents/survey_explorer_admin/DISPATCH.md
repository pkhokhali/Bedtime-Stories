## 2026-09-01T08:09:00Z

You are a Survey Explorer investigating the Admin Panel for Saanjh 3.0.
Your working directory is: d:\Antigravity Projects\Bedtime Stories\.agents\survey_explorer_admin

Task:
1. Read the user request at: d:\Antigravity Projects\Bedtime Stories\.agents\ORIGINAL_REQUEST.md (specifically the Saanjh 3.0 Admin Panel Upgrade section).
2. Investigate the `admin/` frontend codebase:
   - `admin/package.json`, `admin/vite.config.ts`, `admin/tsconfig.json`
   - `admin/src/App.tsx`, `admin/src/main.tsx`, components, styling (Tailwind / CSS), icons (lucide-react etc.)
   - Current build/test scripts (e.g., `npm run build`, `npx tsc`, vitest or test setups)
   - Current form structure, story editing flow, API client, authentication token handling (ADMIN_SECRET), error handling.
3. Analyze and specify exact requirements for:
   - Content & Beat Editor UI (supporting English and Nepali text inputs, smart text/beat dynamic editing matching mobile Beat[] schema)
   - Audio & Scene Metadata Controls (dropdowns for sceneId, stageKind, ambient sound beds)
   - Direct Cover Image Uploader (file selection for .jpg/.png, loading state, upload integration, remote URL insertion)
   - Production Polish & Error Handling (responsive mobile/desktop layout, toast notification system for success/network errors)
4. Write your full analysis and findings to: `d:\Antigravity Projects\Bedtime Stories\.agents\survey_explorer_admin\report.md`
5. Write your handoff to: `d:\Antigravity Projects\Bedtime Stories\.agents\survey_explorer_admin\handoff.md`
6. Send a message to your orchestrator when done with a summary of findings.
