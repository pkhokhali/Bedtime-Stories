# Saanjh 3.0 Master Orchestration Plan

## Overview
Comprehensive master orchestration plan for the Saanjh 3.0 Production Upgrade across 4 pillars, 5 milestones, and 24 features.

## Milestones & Status

### Phase 0: Survey & Infrastructure Mapping
- [x] Map codebase structure, dependencies, audio subsystem, backend API, admin dashboard, and content catalog.
- [x] Artifacts: `PROJECT.md`, `TEST_INFRA.md`, `.agents/explorer_survey_*/handoff.md`.
- **Status: DONE**

### Milestone 1: Fix 7 Confirmed Bugs & Backend Auth (R1)
- [x] Bug 1 & 4: Devanagari text in `app/index.tsx`, bilingual dictionary in `constants/ui.ts`, clean unused imports (`radii`, `spacing`, `storiesForAge`, `ageBands`).
- [x] Bug 2: `parseAgeBand` in `store/useSettingsStore.ts` recognizes `'parents'`.
- [x] Bug 3: Physically delete dead file `components/SplashRitual.tsx`.
- [x] Bug 5: Admin Panel age bands in `admin/src/App.tsx` (`6-8`, `9-12`, `parents`).
- [x] Bug 6: Cloudflare Worker Bearer authentication in `backend/src/index.ts` and Admin Panel header.
- [x] Bug 7: `components/AdBanner.tsx` dummy unit ID validation & graceful `null` fallback.
- [x] Gate Verification: Reviewer 1 (APPROVE), Reviewer 2 (APPROVE), Challenger 1 (APPROVE), Challenger 2 (APPROVE), Auditor 1 (CLEAN).
- **Status: DONE**

### Dual Track: Automated E2E Test Suite
- [x] Build automated test harness `scripts/verify_e2e.js` (`npm test`) covering Tier 1 (F01–F24), Tier 2 (B01–B07), Tier 3 (C01–C05), and Tier 4 (S01–S05).
- [x] Publish `TEST_READY.md` at project root.
- **Status: DONE**

### Milestone 2: AI-Powered Story Narrator & Novel Reader (R2)
- [x] Layer 1 Enhanced TTS: `lib/narrator/segmenter.ts` (300ms clause, 750ms sentence, 1000ms ellipsis, 1200ms paragraph pauses in EN & NE), dialogue modulation, character voice profiles (`VOICE_PROFILES`).
- [x] Ambient Soundscapes: `lib/audio.ts` auto-detection (`resolveAmbientBed`), smooth bed fader `fadeBedVolume`, and 3500ms `windDownFinalBeat` sleep wind-down.
- [x] Layer 2 Cloud AI Voice: `lib/narrator/cloudTts.ts` (Google Cloud TTS free tier neural voices, deterministic local file caching in `FileSystem.cacheDirectory + 'saanjh_tts/'`, prefetching queue, multi-stage fallback).
- [x] Settings Toggle: "AI Voice (Beta)" in `store/useSettingsStore.ts` and `app/settings.tsx`.
- [x] Paginated Novel Reader: `components/reader/NovelReader.tsx` with bedtime theme, font scaling [14–28px], "Read Aloud" auto-advance narration, and progress bar.
- [x] Gate Verification: Reviewer 2 (APPROVE), Challenger 2 (APPROVE), Auditor 2 (CLEAN).
- **Status: DONE**

### Milestone 3: UI Overhaul & Story Detail Screen & Favorites (R3)
- [x] Story Detail Preview Screen: `app/story-detail/[id].tsx` with cover hero image / gradient fallback, top back and animated heart buttons, bilingual titles, metadata badges, moral lesson card, and Play CTA.
- [x] Persistent Favorites Store: `store/useFavoritesStore.ts` with Zustand and AsyncStorage (`saanjh.favorites.v1`).
- [x] Unified Home Screen: `app/index.tsx` with hero banner Details CTA, dynamic "My Favorites" carousel, Devanagari category carousels, skeleton loaders (`components/StoryCardSkeleton.tsx`), and offline retry banner.
- [x] Navigation: Updated `components/StoryCarousel.tsx` and `app/library.tsx` to route card taps to `/story-detail/${story.id}`.
- [x] Gate Verification: Reviewer 3 (APPROVE), Challenger 3 (APPROVE), Auditor 3 (CLEAN).
- **Status: DONE**

### Milestone 4: Sample Content & Assets (R4)
- [x] 3 New Bilingual Stories: `data/stories/little-pine-sleep.ts` (2-4, 9 beats), `data/stories/langtang-waterfall.ts` (6-8, 10 beats), `data/stories/midnight-chiya.ts` (parents novel, 11 beats).
- [x] Catalog Registration: Registered all 3 stories in `data/catalog.ts` (24 total stories).
- [x] Ambient Audio Metadata: Mapped sound beds across all 24 stories.
- [x] Cover Image URLs: Added curated high-resolution public domain / Unsplash cover image URLs for all 24 stories in `data/catalog.ts`.
- [x] Gate Verification: Reviewer 4 (APPROVE), Challenger 4 (APPROVE), Auditor 4 (CLEAN).
- **Status: DONE**

### Milestone 5: Full Project Verification & Release Audit
- [x] TypeScript Static Check: `npx tsc --noEmit` -> 0 errors.
- [x] Automated E2E Suite: `node scripts/verify_e2e.js` -> 100% passing assertions across Tiers 1–4.
- [x] Final Forensic Integrity Audit: CLEAN (Zero violations).
- **Status: DONE**
