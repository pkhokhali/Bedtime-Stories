# Saanjh 3.0 Admin Panel — Technical Survey & Specification Report

**Document**: Admin Panel Architecture, UI/UX Specification, and Upgrade Blueprint  
**Target Directory**: `admin/`  
**API Backend**: `backend/` (`https://saanjh-api.prabinkhokhali89.workers.dev`)  
**Date**: 2026-09-01  
**Author**: Survey Explorer (Admin Panel & CMS)

---

## 1. Executive Summary

The Saanjh bedtime story app is undergoing a 3.0 production upgrade. While the existing Admin Panel (`admin/`) provided basic metadata editing (Title, URL, AgeBand), it lacked the capabilities needed for Saanjh 3.0's core pillars:
1. **Interactive Beat-Based Story & Novel Content Creation** (supporting English and Nepali Devanagari script).
2. **Audio & Scene Metadata Assignment** (Stage environments, Scene IDs, Ambient Sound Beds, Sound Effects, Voice Roles, and Character Poses).
3. **Direct Image Uploads** for story cover art (supporting `.jpg`, `.png`, `.webp` file picking, loading states, and remote URL generation).
4. **Production Polish & Error Resilience** (Toast notifications, responsive desktop/mobile layout, filtering/search, dirty state tracking, and Bearer token auth).

This report presents a thorough survey of the existing `admin/` codebase, mobile schema contracts, backend capabilities, and delivers a complete technical blueprint for implementing the Saanjh 3.0 Admin CMS.

---

## 2. Existing Codebase Audit

### 2.1 Dependencies & Build Infrastructure (`admin/package.json`)
- **React**: `19.2.8` & **React DOM**: `19.2.8`
- **Build Tool**: Vite `8.2.0` (`@vitejs/plugin-react` `6.0.4`)
- **Language**: TypeScript `~6.0.2` (`tsconfig.app.json` in bundler mode, `noEmit: true`)
- **CSS / Styling**: TailwindCSS `4.3.3` with `@tailwindcss/postcss` `4.3.3` and PostCSS `8.5.26`
- **Icons**: `lucide-react` `1.33.0`
- **Linter**: `oxlint` `1.75.0`
- **Build Test Verified**: `npm run build` (`tsc -b && vite build`) executes cleanly in ~11.5s with zero type errors.

### 2.2 Component & File Structure (`admin/src/`)
- `src/main.tsx`: Standard React 19 root mounting with StrictMode.
- `src/index.css`: `@import "tailwindcss";` with basic body font and background resets.
- `src/App.css`: Unused template CSS from initial Vite scaffold.
- `src/App.tsx`: A single 280-line monolithic component that handles:
  - Catalog fetching (`GET /catalog` from Cloudflare Worker).
  - Secret key input with `localStorage` persistence.
  - Adding basic stories, modifying `title.en`, `title.ne`, `ageBand`, `mediaType`, `coverImage`, `mediaUrl`, `mediaUrl_ne`, `isHidden`.
  - Publishing (`POST /catalog` with `Authorization: Bearer <token>`).

### 2.3 Identified Deficiencies in Current Implementation
1. **No Beat / Text Editing**: Only provides raw streaming URL inputs (`mediaUrl`, `mediaUrl_ne`). Cannot create or edit text beats (`Beat[]`) for procedural stories or novels.
2. **Missing Story Schema Fields**: Does not support `form` (`'story' | 'novel'`), `stage` (`StageKind`), `cast`, `runtimeMinutes`, `theme`, `accent`, or `locked`.
3. **No Audio & Scene Controls**: Cannot set ambient sound beds (`music`), scene environments (`scene`), sound effects (`sfx`), voice roles (`voice`), or animal poses (`rabbit`, `tiger`).
4. **Manual Image URL Entry Only**: No file picker, upload endpoint integration, drag-and-drop, or thumbnail preview.
5. **Basic Status Messages**: Uses inline banners (`<div className="bg-red-100">`) that disappear or get lost offscreen during scrolling. Lacks an ephemeral, persistent toast notification system.
6. **Scalability & UX Issues**: All story cards render expanded simultaneously; managing 25+ stories results in extreme vertical scrolling with no search, filtering, or collapse/expand controls.

---

## 3. Schema & Data Contract Compatibility

The mobile application (`types/story.ts`, `lib/audio.ts`, `data/catalog.ts`) defines the exact schema required for story playback, TTS AI narration, and novel reading:

```typescript
export type Language = 'en' | 'ne';
export type Localized<T = string> = Record<Language, T>;

export type StoryCategory = 'roots' | 'universal' | 'custom';
export type StoryForm = 'story' | 'novel';
export type MediaType = 'video' | 'audio';

export type AgeBand =
  | '2-4'
  | '4-6'
  | '6-8'
  | '9-12'
  | '13-17'
  | '18-25'
  | '25+'
  | 'parents';

export type StageKind =
  | 'forest'
  | 'moon'
  | 'river'
  | 'courtyard'
  | 'hills'
  | 'lamp'
  | 'stars';

export type SceneId =
  | 'establishing'
  | 'meeting'
  | 'walk'
  | 'roar'
  | 'well'
  | 'leap'
  | 'peace'
  | 'moon'
  | 'river'
  | 'courtyard'
  | 'hills'
  | 'lamp'
  | 'stars';

export type VoiceRole = 'narrator' | 'tiger' | 'rabbit' | 'soft';

export type SoundId =
  | 'night'
  | 'moon'
  | 'river'
  | 'courtyard'
  | 'roar'
  | 'splash'
  | 'ripple'
  | 'chime'
  | 'wind';

export type Pose =
  | 'hidden'
  | 'idle'
  | 'walk'
  | 'bow'
  | 'sit'
  | 'roar'
  | 'leap'
  | 'lookDown';

export interface Beat {
  id: string;
  text: Localized<string>; // { en: string; ne: string }
  scene: SceneId;
  rabbit: Pose;
  tiger: Pose;
  voice?: VoiceRole;
  music?: SoundId;
  sfx?: SoundId;
}

export interface Story {
  id: string;
  category: StoryCategory;
  form: StoryForm; // 'story' | 'novel'
  ageBand: AgeBand;
  title: Localized<string>;
  subtitle?: Localized<string>;
  runtimeMinutes?: number;
  theme?: Localized<string>;
  accent?: string;
  stage?: StageKind;
  cast?: 'rabbit' | 'none';
  locked?: boolean;
  beats?: Beat[];
  
  // Remote streaming fields (optional for text-only beats/novels)
  mediaType?: MediaType;
  mediaUrl?: string; // English
  mediaUrl_ne?: string; // Nepali
  coverImage?: string;
  isHidden?: boolean;
}

export interface Catalog {
  version: number;
  stories: Story[];
}
```

---

## 4. Requirement 1 — Content & Beat Editor UI Specification

### 4.1 Functional Requirements
- **Format Toggle**:
  - `Animated Beat Story` (`form: 'story'`, has `beats: Beat[]`): For interactive bedtime stories with procedural SVG animations, character poses, and TTS AI Narration.
  - `Novel / Longform Reader` (`form: 'novel'`, has `beats: Beat[]`): For chapter/page-based reading in `NovelReader` with adjustable typography and TTS auto-advance.
  - `External Media Stream` (`mediaType: 'video' | 'audio'`): For external video/audio streams.
- **Dynamic Beat List Manager**:
  - Add new beat at end or insert at index.
  - Delete beat with confirmation.
  - Move beat up/down to reorder sequence.
  - Duplicate existing beat.
  - Auto-generate beat IDs (`beat-1`, `beat-2` or semantic slugs).
- **Bilingual Text Inputs**:
  - **English Textarea**: Auto-resizing, clean typography, character & word counter.
  - **Nepali Textarea**: Full UTF-8 Devanagari support with tailored font styling, character & word counter.
- **Smart Text Auto-Splitter (Bulk Import/Convert)**:
  - Facilitates rapidly turning plain text manuscripts into beats.
  - Allows pasting English and Nepali paragraphs separated by blank lines (`\n\n`) or delimiter (`---`).
  - Auto-matches paragraph $i$ of English with paragraph $i$ of Nepali into Beat $i$.
  - Live preview modal with 1-click conversion into structured `Beat[]`.
- **JSON Import / Export**:
  - Export single story or full catalog to JSON.
  - Import JSON directly for backup or migration of legacy code-defined stories.

### 4.2 Visual Layout & UX
- Beat cards displayed in a numbered sequence (`#1`, `#2`, `#3`...).
- Badge summary on each beat card header (e.g. `[Scene: Forest]`, `[Voice: Narrator]`, `[Bed: Night]`).
- Expand/collapse toggle per beat for compact overview.

---

## 5. Requirement 2 — Audio & Scene Metadata Controls

### 5.1 Stage & Scene Selectors
- **Story-Level Stage (`stage`)**:
  - Dropdown populated with `StageKind` options:
    - `forest` — Forest clearing under moonlight
    - `moon` — Open night sky & glowing moon
    - `river` — Flowing riverbank & water sounds
    - `courtyard` — Traditional village brick courtyard
    - `hills` — High mountain ridge with gentle wind
    - `lamp` — Warm indoor tea shop with lantern glow
    - `stars` — Cosmic starfield
- **Beat-Level Scene (`scene`)**:
  - Dropdown populated with all 13 `SceneId` options (`establishing`, `meeting`, `walk`, `roar`, `well`, `leap`, `peace`, `moon`, `river`, `courtyard`, `hills`, `lamp`, `stars`).

### 5.2 Soundscapes & AI Voice Controls
- **Ambient Sound Bed (`music`)**:
  - Option to choose `Default (Auto from Scene/Stage)` or explicitly pick from:
    - `night` (Night crickets and gentle breeze)
    - `moon` (Ethereal shimmering night bed)
    - `river` (Continuous water flow)
    - `courtyard` (Subtle village night ambience)
    - `wind` (Himalayan mountain wind)
- **Sound Effects (`sfx`)**:
  - Dropdown: `none`, `chime`, `ripple`, `splash`, `roar`, `night`, `wind`.
- **Voice Role (`voice`)**:
  - Select role for AI Narrator voice modulation:
    - `narrator` (Balanced storyteller tone)
    - `soft` (Soothing, whisper-like bedtime tone)
    - `tiger` (Deep, resonant tone)
    - `rabbit` (Higher pitch, expressive tone)
- **Character Poses (`rabbit`, `tiger`)**:
  - Dropdowns: `hidden`, `idle`, `walk`, `bow`, `sit`, `roar`, `leap`, `lookDown`.

---

## 6. Requirement 3 — Direct Cover Image Uploader

### 6.1 Architecture & Flow
```
[User Selects .jpg/.png/.webp] 
       │
       ▼
[Client-Side File Validation (<5MB, valid MIME)]
       │
       ▼
[Upload Handler Triggered] ──► (Shows Spinner + Progress in UI)
       │
       ├─► Option A: POST /upload to Cloudflare Worker (stores in KV/R2 and returns CDN URL)
       └─► Option B: Direct Free Image Hosting / Base64 fallback if offline or unauthenticated
       │
       ▼
[Response: { success: true, url: "https://..." }]
       │
       ▼
[Auto-populate story.coverImage with hosted URL]
       │
       ▼
[Render Thumbnail Preview with Remove / Replace Actions]
```

### 6.2 Implementation Details
- **File Input Component**:
  - Supports drag-and-drop zone and click-to-browse.
  - Accepted extensions: `.jpg`, `.jpeg`, `.png`, `.webp`.
  - Client-side size validation (max 5 MB) with user-friendly error messages.
- **Upload Endpoint Support**:
  - Primary: `POST /upload` on Cloudflare Worker (`Authorization: Bearer <ADMIN_SECRET>`).
  - Fallback: Robust base64 / free image host upload handler so the admin panel functions seamlessly even during development or sandbox testing.
- **Thumbnail Preview**:
  - Renders 16:9 or 1:1 image thumbnail directly in the story card.
  - Displays image dimension / aspect info.
  - Includes "Replace Image", "Copy URL", and "Remove" buttons.
  - Allows manual URL editing if the admin prefers pasting an external CDN URL.

---

## 7. Requirement 4 — Production Polish & Error Handling

### 7.1 Toast Notification System
- Custom React Toast manager (no heavy external package needed) featuring:
  - **Success Toast**: Green theme with check icon (e.g. *"Published 24 stories to live catalog"*).
  - **Error Toast**: Red theme with alert icon and detailed error message (e.g. *"401 Unauthorized: Invalid Admin Secret"*, *"Network Error: Failed to reach Cloudflare API"*).
  - **Info Toast**: Blue theme for actions like *"Cover image uploaded successfully"*, *"Beat copied to clipboard"*.
  - Auto-dismiss after 4 seconds with manual close button and fade animations.
  - Fixed top-right / bottom-right viewport positioning.

### 7.2 Responsive & Modern UI Design
- **Header Bar**:
  - Sticky top navigation with Saanjh branding, story counter, and catalog version badge.
  - Admin Secret password input with show/hide toggle and validation status indicator.
  - Quick action buttons: "Add Story", "Import JSON", "Export Backup", and "Publish Live".
- **Sidebar / Filter Controls**:
  - Search bar: Filter by story title (English or Nepali) or ID.
  - Filter pills: All, Toddlers (2-4), Bedtime (4-6), Wonder (6-8), Growing (9-12), Parents (Novels), Hidden.
  - Format pills: All, Beats Story, Novel, Video, Audio.
- **Story Cards & Accordions**:
  - Collapsible cards to prevent scrolling clutter.
  - Status badges: `Published`, `Hidden`, `Novel`, `Beats`, `Video`, `Audio`.
  - Modal or full-screen Beat Editor for focused story writing without distractions.
- **Mobile Friendliness**:
  - Full-width grid layouts using Tailwind breakpoints (`sm:`, `md:`, `lg:`).
  - 44px minimum touch targets for all buttons and selects on mobile.
  - Responsive drawer for story navigation on smaller screens.

### 7.3 State Management & Error Resilience
- **Dirty State Tracking**: Visual badge indicating unsaved local changes before publishing.
- **Connection Health Check**: Graceful offline handling with explicit retry options.
- **Input Validation**: Prevents duplicate IDs, empty titles, or malformed URLs before submitting to API.

---

## 8. Proposed Component Architecture

To maintain high code quality and modularity, the upgraded `admin/src/` will be structured into clean, single-responsibility components:

```
admin/src/
├── App.tsx                      # Root application layout, state orchestration
├── main.tsx                     # React 19 entry point
├── index.css                    # TailwindCSS 4 root stylesheet
├── types/
│   └── story.ts                 # Full story, beat, audio, scene type definitions
├── components/
│   ├── Header.tsx               # Top navigation bar with Secret auth & publish controls
│   ├── ToastContainer.tsx       # Floating toast notifications container
│   ├── StoryCard.tsx            # Story item card with accordion collapse & metadata
│   ├── StoryEditorModal.tsx     # Full-screen / modal editor for story details & beats
│   ├── BeatEditor.tsx           # Dynamic beat list manager (Add, Delete, Reorder)
│   ├── BeatItem.tsx             # Single beat editor with bilingual inputs & audio dropdowns
│   ├── BulkTextSplitterModal.tsx# Smart text-to-beat parser and importer
│   ├── ImageUploader.tsx        # File picker, upload handler, and thumbnail preview
│   └── AudioSceneControls.tsx   # Reusable dropdowns for Scene, Stage, Voice, Sound Beds
└── hooks/
    ├── useToast.ts              # Toast notification state hook
    └── useCatalog.ts            # API data fetching, saving, and dirty tracking hook
```

---

## 9. Verification & Quality Assurance Strategy

1. **Type Checking & Build**:
   - `npm run build` must run `tsc -b && vite build` and output production bundles with zero TypeScript or bundler errors.
2. **Schema Integrity**:
   - Stories saved through the Admin Panel must be 100% compatible with the mobile app's `Story`, `Beat[]`, `NovelReader`, and `useStoryPlayback`.
3. **Authentication Verification**:
   - Unauthenticated `POST /catalog` returns 401.
   - Supplying the correct `ADMIN_SECRET` Bearer token publishes changes with version increment.
4. **Offline & Error Resilience**:
   - Disconnecting network or providing invalid secrets displays immediate, descriptive toast notifications.
5. **Cross-Device Usability**:
   - Verified on both wide desktop displays (>1280px) and mobile viewport widths (<480px).
