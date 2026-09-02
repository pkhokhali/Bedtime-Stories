# Mobile App Contracts and Integration Survey Report (Saanjh 3.0)

**Date**: 2026-09-01  
**Investigator**: Survey Explorer (Mobile Contracts & Integration)  
**Target Subsystems**: Mobile App (`app/`, `types/`, `data/`, `lib/`, `constants/`, `hooks/`, `store/`), Backend API (`backend/src/index.ts`), Admin CMS (`admin/src/App.tsx`).

---

## 1. Executive Summary

The Saanjh 3.0 bedtime story platform operates on a unified content contract shared across the Expo/React Native mobile application, the Cloudflare Workers KV backend, and the React Vite Admin CMS.

Content is delivered in three primary formats:
1. **Interactive/Animated Stories (`form: 'story'`)**: Driven by structured `Beat[]` sequences featuring procedural 2D SVG scene staging (`ForestStage`, `NightStage`), character rig posing (Rabbit & Tiger), and synchronous bilingual narration with ambient audio beds.
2. **Novels & Audiobooks (`form: 'novel'`)**: Driven by paginated text `Beat[]` sequences rendered in `NovelReader`, with bilingual support, font scaling controls (A-/A+), reading progress tracking, and on-demand AI bedtime narration ("Read Aloud").
3. **Streaming Media Stories (`mediaType: 'video' | 'audio'`)**: Direct audio/video streams (`mediaUrl`, `mediaUrl_ne`) rendered in `MediaStoryPlayer`.

This report provides the canonical data contracts, enum taxonomies, runtime audio synthesis behaviors, and exact backend/admin CMS specifications required to achieve **100% interoperability**.

---

## 2. Canonical Data Models & TypeScript Specifications

### 2.1 Core Types & Enums (`types/story.ts`)

```typescript
export type Language = 'en' | 'ne';

export type StoryCategory = 'roots' | 'universal' | 'custom';

export type AgeBand =
  | '2-4'
  | '4-6'
  | '6-8'
  | '9-12'
  | '13-17'
  | '18-25'
  | '25+'
  | 'parents';

export type AudienceGroup = 'children' | 'young' | 'grown';

export type StoryForm = 'story' | 'novel';

export type Pose =
  | 'hidden'
  | 'idle'
  | 'walk'
  | 'bow'
  | 'sit'
  | 'roar'
  | 'leap'
  | 'lookDown';

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

export type StageKind =
  | 'forest'
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

export type MediaType = 'video' | 'audio' | 'text';

export type Localized<T = string> = Record<Language, T>;
```

---

### 2.2 The `Beat` Data Structure

Every story beat represents an atomic sentence, dialogue unit, or paragraph in the narration sequence:

```typescript
export interface Beat {
  /** Unique beat identifier within the story (e.g. "title", "once", "beat-1", "close") */
  id: string;

  /** Bilingual spoken and displayed text */
  text: Localized<string>; // { en: string; ne: string }

  /** Visual background scene identifier */
  scene: SceneId;

  /** Character animation pose for the Rabbit SVG rig */
  rabbit: Pose;

  /** Character animation pose for the Tiger SVG rig */
  tiger: Pose;

  /** Narrative voice role for character speech modulation (defaults to 'narrator') */
  voice?: VoiceRole;

  /** Specific ambient sound bed to loop during this beat (overrides scene/stage default) */
  music?: SoundId;

  /** One-shot sound effect sting triggered at the start of this beat */
  sfx?: SoundId;
}
```

---

### 2.3 The `Story` Data Structure

```typescript
export interface Story {
  /** Unique story slug / kebab-case ID (e.g. "clever-rabbit", "midnight-chiya") */
  id: string;

  /** Thematic categorization */
  category: StoryCategory;

  /** Presentation mode: 'story' (2D animated stage) or 'novel' (paginated reader) */
  form: StoryForm;

  /** Target audience age band */
  ageBand: AgeBand;

  /** Bilingual story title */
  title: Localized<string>; // { en: string; ne: string }

  /** Optional bilingual subtitle / description */
  subtitle?: Localized<string>; // { en: string; ne: string }

  /** Estimated total narration/reading duration in minutes */
  runtimeMinutes?: number;

  /** Bilingual moral, lesson, or philosophical summary */
  theme?: Localized<string>; // { en: string; ne: string }

  /** Accent color hex code for card UI, gradients, and backgrounds (e.g. "#E8A04A") */
  accent?: string;

  /** Default background stage for procedural 2D rendering */
  stage?: StageKind;

  /** Character cast rendering flag ('rabbit' enables SVG rigs, 'none' disables them) */
  cast?: 'rabbit' | 'none';

  /** Premium lock status flag */
  locked?: boolean;

  /** Ordered array of story beats for TTS narration and reader display */
  beats?: Beat[];

  /** Media story format (optional, for streaming media stories) */
  mediaType?: MediaType;

  /** English streaming audio or video URL */
  mediaUrl?: string;

  /** Nepali streaming audio or video URL */
  mediaUrl_ne?: string;

  /** Local bundled asset references (used for offline built-in video stories) */
  mediaAssets?: any[];

  /** Remote HTTPS URL for the cover image artwork */
  coverImage?: string;

  /** Visibility flag in mobile client (if true, excluded from mobile app catalog) */
  isHidden?: boolean;
}
```

---

### 2.4 Catalog Envelope Structure

The Cloudflare Workers KV store (`SAANJH_DB`, key `'catalog'`) stores the root catalog envelope:

```typescript
export interface CatalogEnvelope {
  /** Incremental schema / revision version number */
  version: number;

  /** Array of active stories */
  stories: Story[];
}
```

---

## 3. Enumeration & Metadata Reference Tables

### 3.1 Age Bands & Audience Groups

| AgeBand | Nepali Code | Label (EN / NE) | Audience Group | Target Content Description |
|---|---|---|---|---|
| `2-4` | २-४ | Little ones / सानो | `children` | Very short, soothing nature tales, nursery rhythms |
| `4-6` | ४-६ | Bedtime / सुत्ने बेला | `children` | Classic calming bedtime fables |
| `6-8` | ६-८ | Wonder / अचम्म | `children` | Adventure, folklore, moral tales |
| `9-12` | ९-१२ | Growing / बढ्दो | `children` | School-dusk tales, community stories, fables |
| `13-17` | १३-१७ | Teens / किशोर | `young` | Quiet journeys, reflective coming-of-age |
| `18-25` | १८-२५ | Young adults / युवा | `young` | Short evening novels, classic literature (Wilde, Aesop) |
| `25+` | २५ र माथि | Grown / वयस्क | `grown` | Longer contemplative novels, atmospheric stories |
| `parents` | अभिभावक | After Hours / काम पछि | `grown` | Literary novels, audiobooks, relaxation for parents |

---

### 3.2 Stage Kinds (`StageKind`) & Visual Themes

| StageKind | Sky Gradient Colors (Top / Mid / Horizon) | Default Ambient Bed | Stage Props & Rig Elements |
|---|---|---|---|
| `forest` | `#0B0E14` / `#1A241C` / `#2D4A32` | `night` | Far trees, near trees, animal silhouettes, grass hill, well |
| `moon` | `#120E1C` / `#2A1830` / `#6A3A28` | `moon` | Glowing large moon, fireflies |
| `river` | `#0E1818` / `#1A3028` / `#3A5A52` | `river` | River water SVG ellipse & flowing waves, moon, fireflies |
| `courtyard` | `#1A1020` / `#4A2418` / `#C4783A` | `courtyard` | Patan/Bhaktapur brick walls, carved lintels, temple pillar |
| `hills` | `#141018` / `#2A2430` / `#5A3A28` | `wind` | Layered Himalayan mountain silhouettes, fireflies |
| `lamp` | `#1A100C` / `#3A2218` / `#8A4A20` | `courtyard` | Tea shop brick façade, warm glowing amber windows |
| `stars` | `#0C0A14` / `#1A1428` / `#3A2848` | `night` | Deep nocturnal sky with twinkling multi-layer stars |

---

### 3.3 Scene Identifiers (`SceneId`) & Poses (`Pose`)

| SceneId | Purpose / Context | Default Ambient Bed |
|---|---|---|
| `establishing` | Story introduction, setting the nighttime scene | `night` |
| `meeting` | Characters encountering each other | `night` |
| `walk` | Journey, slow walking pacing | `night` |
| `roar` | Dramatic character moment / confrontation | `night` |
| `well` | Stone well, reflection, water discovery | `river` |
| `leap` | Action climax / jumping into well or river | `river` |
| `peace` | Resolution, calming ending, rest | `night` |
| `moon` | Moonlit scene | `moon` |
| `river` | Riverbank / water scene | `river` |
| `courtyard` | Ancient city brick courtyard scene | `courtyard` |
| `hills` | Mountain pass / hillside scene | `wind` |
| `lamp` | Warm lantern / tea stall scene | `courtyard` |
| `stars` | Starry sky contemplation | `night` |

**Character Poses (`Pose`)**:
- `hidden`: Element not rendered on stage.
- `idle`: Standing quietly, breathing animation.
- `walk`: Walking across the screen (animates horizontal translation).
- `bow`: Bowing down respectfully.
- `sit`: Resting peacefully in sitting position.
- `roar`: Roaring pose with open mouth (Tiger).
- `leap`: Downward dive animation into the well (Tiger).
- `lookDown`: Peering over the stone well rim (Tiger).

---

### 3.4 Audio Assets & Ambient Sound Resolution Hierarchy

#### Sound Catalog (`lib/sounds.ts` & `assets/audio/`)

| SoundId | Audio File Path | Looping Bed? | Description |
|---|---|---|---|
| `night` | `assets/audio/night.wav` | **Yes** (Loop) | Nocturnal crickets, quiet forest atmosphere |
| `moon` | `assets/audio/moon.wav` | **Yes** (Loop) | Soft ethereal nocturnal drone |
| `river` | `assets/audio/river.wav` | **Yes** (Loop) | Continuous flowing mountain stream |
| `courtyard` | `assets/audio/courtyard.wav` | **Yes** (Loop) | Historic courtyard ambience, soft wind reverberation |
| `wind` | `assets/audio/wind.wav` | **Yes** (Loop) | High Himalayan mountain breeze |
| `chime` | `assets/audio/chime.wav` | No (SFX) | Bronze temple singing bowl chime (intro/outro) |
| `roar` | `assets/audio/roar.wav` | No (SFX) | Gentle tiger roar |
| `splash` | `assets/audio/splash.wav` | No (SFX) | Water well splash sting |
| `ripple` | `assets/audio/ripple.wav` | No (SFX) | Water tea/well ripple sting |

#### Ambient Sound Resolution Cascade (`lib/audio.ts` -> `resolveAmbientBed`)

When playing a beat, the mobile app resolves the background sound bed via this priority order:
1. **Explicit Beat Music**: `beat.music` (if defined).
2. **Scene Mapping (`SCENE_BED_MAP`)**:
   - `moon` $\rightarrow$ `'moon'`
   - `well`, `leap`, `river` $\rightarrow$ `'river'`
   - `courtyard`, `lamp` $\rightarrow$ `'courtyard'`
   - `hills` $\rightarrow$ `'wind'`
   - `establishing`, `meeting`, `walk`, `roar`, `peace`, `stars` $\rightarrow$ `'night'`
3. **Stage Mapping (`STAGE_BED_MAP`)**:
   - `moon` $\rightarrow$ `'moon'`
   - `river` $\rightarrow$ `'river'`
   - `courtyard`, `lamp` $\rightarrow$ `'courtyard'`
   - `hills` $\rightarrow$ `'wind'`
   - `forest`, `stars` $\rightarrow$ `'night'`
4. **Default Fallback**: `'night'`

---

### 3.5 Voice Roles & Speech Profiles

| VoiceRole | Context / Usage | Layer 1 Rate Mod | Layer 1 Pitch Delta | Layer 2 Google Cloud Pitch | Volume |
|---|---|---|---|---|---|
| `narrator` | Standard bedtime narration | 1.00 | +0.00 | 0.0 st | 0.92 |
| `soft` | Whispered dialogue, intimate reflections | 0.88 | -0.05 | -0.5 st | 0.85 |
| `rabbit` | Small, quick, clever characters | 1.08 | +0.18 | +2.5 st | 0.95 |
| `tiger` | Deep, commanding characters | 0.86 | -0.22 | -2.5 st | 1.00 |

---

## 4. Mobile Narration & Ingestion Architecture

### 4.1 Remote Catalog Fetch & Merge Pipeline

```
[Cloudflare Workers API: GET /catalog]
           │
           ▼
[lib/catalogFetcher.ts: fetchRemoteCatalog()]
  - Filters out isHidden === true
  - Stores in Zustand: useDownloadsStore.remoteStories
           │
           ▼
[app/index.tsx & app/library.tsx]
  - Merges local catalog (data/catalog.ts) with remote stories
  - Remote story overrides local metadata by matching story.id
  - Purely remote stories appended to full catalog
           │
           ▼
[UI Presentation]
  - Home Screen: Hero banner, Favorites carousel, Age category carousels
  - Story Detail Screen: Cover art, bilingual titles, runtime, age badge, moral card, Play CTA
```

---

### 4.2 Narration & Reader Playback Flow

```
User taps Play on /story-detail/[id]
           │
           ▼
[app/story/[id].tsx] Routing Logic
  ├── Has mediaType/mediaUrl? ──► [MediaStoryPlayer] (Video/Audio streaming)
  ├── form === 'novel'?        ──► [NovelReader] (Paginated text + Read Aloud)
  └── form === 'story'?        ──► [StoryPlayer] (2D Animated SVG Stage)
           │
           ▼
[hooks/useStoryPlayback.ts] (Beat Loop Engine)
  ├── 1. Ambient Audio Bed: Loops resolveAmbientBed(beat.music, beat.scene, stage) at vol 0.22
  ├── 2. One-shot SFX: Plays beat.sfx if present
  ├── 3. Pre-fetch Cloud TTS: If aiVoice === true, pre-fetches next 3 beats to cache
  ├── 4. Sleep Wind-Down: On final beat, fades ambient bed to 0.06 over 3500ms
  └── 5. Speech Narration: Calls speakBeat(beat.text[language], { voice: beat.voice })
           │
           ├──► [Layer 2: Google Cloud TTS] (if aiVoice === true & API key set)
           │      - Voices: ne-NP-Standard-A/B, en-IN-Neural2-A/B
           │      - File Cache: saanjh_tts/<hash>.mp3
           │      - Audio Player: expo-audio
           │      - Graceful Fallback on failure ──┐
           │                                        │
           └──► [Layer 1: Enhanced Device TTS] ◄────┘
                  - segmentText(): Tokenizes sentences & dialogue quotes
                  - Dialogue quotes modulated to character profile
                  - Bedtime Pauses:
                      * Paragraph (\n\n): 1200ms
                      * Line break (\n): 1100ms
                      * Ellipsis (... / …): 1000ms
                      * Sentence (. ! ? । ॥): 750ms
                      * Clause (, ; —): 300ms
                  - Plays via expo-speech with voice picker & pitch/rate tuning
```

---

## 5. Admin Panel & Backend Contract Specification

To ensure 100% interoperability with the mobile application, the Admin Panel (`admin/`) and Backend (`backend/`) must conform to the following specifications:

### 5.1 Backend Worker API Specifications (`backend/src/index.ts`)

#### Endpoint 1: `GET /catalog`
- **Authentication**: Public (no token required).
- **Response**: `200 OK`
- **Response Header**: `Content-Type: application/json`, `Access-Control-Allow-Origin: *`
- **Response Body**:
  ```json
  {
    "version": 12,
    "stories": [ /* Array of Story objects */ ]
  }
  ```

#### Endpoint 2: `POST /catalog`
- **Authentication**: Required Bearer token matching `c.env.ADMIN_SECRET`.
  - Header: `Authorization: Bearer <ADMIN_SECRET>`
- **Request Body**: Valid `CatalogEnvelope` JSON (`{ "version": number, "stories": Story[] }`).
- **Validation Rules**:
  - `version` must be a positive integer.
  - `stories` must be an array of valid `Story` objects.
  - Every `Story` must have unique `id`, valid `category`, `form`, `ageBand`, and `title: { en, ne }`.
  - If `beats` are provided, every `Beat` must have unique `id`, `text: { en, ne }`, `scene`, `rabbit`, `tiger`.
- **Response**:
  - `200 OK`: `{ "success": true, "message": "Catalog updated successfully!" }`
  - `401 Unauthorized`: `{ "success": false, "error": "Unauthorized: Invalid or missing admin secret" }`
  - `500 Internal Server Error`: `{ "success": false, "error": "Failed to update catalog" }`

---

### 5.2 Admin CMS Feature & UI Requirements (`admin/src/App.tsx`)

#### 1. Story Metadata Controls
The story card/editor must provide form inputs for:
- **Story ID (`id`)**: String (kebab-case slug).
- **Title (`title`)**: Dual inputs for English (`title.en`) and Nepali (`title.ne`).
- **Subtitle (`subtitle`)**: Dual inputs for English (`subtitle.en`) and Nepali (`subtitle.ne`).
- **Lesson / Moral (`theme`)**: Dual inputs for English (`theme.en`) and Nepali (`theme.ne`).
- **Category (`category`)**: Dropdown options: `'roots'`, `'universal'`, `'custom'`.
- **Form (`form`)**: Dropdown options: `'story'` (Bedtime Story with 2D Visual Stage) and `'novel'` (Novel Reader / Paginated Text).
- **Target Audience (`ageBand`)**: Complete 8-option dropdown:
  - `2-4`: Toddlers (2-4)
  - `4-6`: Bedtime (4-6)
  - `6-8`: Wonder (6-8)
  - `9-12`: Growing (9-12)
  - `13-17`: Teens (13-17)
  - `18-25`: Young Adults (18-25)
  - `25+`: Grown (25+)
  - `parents`: Parents (After Hours Novels)
- **Runtime (`runtimeMinutes`)**: Number input (minutes).
- **Accent Color (`accent`)**: Color picker / hex input (e.g. `#E8A04A`).
- **Stage (`stage`)**: Dropdown options: `'forest'`, `'moon'`, `'river'`, `'courtyard'`, `'hills'`, `'lamp'`, `'stars'`.
- **Cast (`cast`)**: Dropdown options: `'rabbit'` (Show animal rigs) or `'none'` (No animal rigs).
- **Status Toggles**: `isHidden` (Published vs Draft checkbox).

#### 2. Full Beat Editor UI
For text-based stories and novels, the Admin CMS must provide a robust beat management interface:
- **Smart Auto-Splitter**: Admin can paste full English and Nepali story text in two textareas, click "Auto-Generate Beats", which automatically splits paragraphs/sentences into structured `Beat[]` with sequential IDs (`beat-1`, `beat-2`, etc.) and default scenes.
- **Dynamic Beat Card List**:
  - Add Beat, Remove Beat, Reorder Beats (Up/Down).
  - Edit `text.en` and `text.ne` per beat.
  - Select `scene` (`SceneId` dropdown).
  - Select `voice` (`VoiceRole` dropdown: `narrator`, `soft`, `rabbit`, `tiger`).
  - Select `music` (ambient bed override dropdown: `none`, `night`, `moon`, `river`, `courtyard`, `wind`).
  - Select `sfx` (sound effect sting dropdown: `none`, `chime`, `ripple`, `splash`, `roar`, `wind`).
  - Select `rabbit` and `tiger` poses (`Pose` dropdown: `hidden`, `idle`, `walk`, `bow`, `sit`, `roar`, `leap`, `lookDown`).

#### 3. Direct Cover Image Uploader
- Instead of requiring manual external hosting, the Admin Panel must provide a direct "Upload Image" button.
- User selects `.jpg`, `.png`, or `.webp` file.
- Shows upload spinner / progress indicator.
- Automatically sets the resulting hosted URL into the story's `coverImage` field.

#### 4. Production Polish & Error Handling
- Persistent Admin Secret Key storage in `localStorage`.
- Toast notifications for success, failure, network disconnects, and unauthorized attempts.
- Responsive CSS layout optimized for both desktop monitors and mobile/tablet browsers.

---

## 6. Sample Interoperable JSON Payload

Below is an exact sample of a valid `Story` object with full bilingual `Beat[]` data ready for Cloudflare KV storage:

```json
{
  "id": "midnight-chiya",
  "category": "roots",
  "form": "novel",
  "ageBand": "parents",
  "runtimeMinutes": 11,
  "accent": "#B85D19",
  "stage": "courtyard",
  "cast": "none",
  "coverImage": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
  "title": {
    "en": "Midnight Chiya in Patan",
    "ne": "पाटनमा मध्यरातको चिया"
  },
  "subtitle": {
    "en": "A quiet courtyard, warm glass, and sleeping hills.",
    "ne": "शान्त चोक, न्यानो गिलास, र सुतेका डाँडाहरू।"
  },
  "theme": {
    "en": "In late silence, even ordinary warmth becomes sacred",
    "ne": "मध्यरातको मौनतामा, साधारण न्यानोपन पनि पवित्र हुन्छ"
  },
  "isHidden": false,
  "beats": [
    {
      "id": "title",
      "scene": "courtyard",
      "rabbit": "hidden",
      "tiger": "hidden",
      "sfx": "chime",
      "music": "courtyard",
      "voice": "soft",
      "text": {
        "en": "Past midnight in Patan, when motorcycle engines have faded and the temple pigeons have tucked their wings, the brick courtyards begin to breathe.",
        "ne": "पाटनमा मध्यरात कटेपछि, जब गाडीका आवाजहरू बिलाउँछन् र मन्दिरका परेवाहरूले पखेटा समेट्छन्, तब इँटाका चोकहरूले सास फेर्न थाल्छन्।"
      }
    },
    {
      "id": "flame",
      "scene": "lamp",
      "rabbit": "hidden",
      "tiger": "hidden",
      "sfx": "wind",
      "music": "courtyard",
      "voice": "narrator",
      "text": {
        "en": "A small brass padlock clicked open near Swotha square. Inside the wooden stall, a gentle blue stove flame hissed softly into life.",
        "ne": "स्वठ चोक नजिकै एउटा सानो पित्तलको ताल्चा खुल्यो। काठे पसलभित्र स्टोभको नीलो ज्वाला सुस्तरी बलेर उठ्यो।"
      }
    },
    {
      "id": "close",
      "scene": "peace",
      "rabbit": "hidden",
      "tiger": "hidden",
      "sfx": "chime",
      "music": "courtyard",
      "voice": "soft",
      "text": {
        "en": "Put down the day now, dear reader. The valley is sleeping. Let your thoughts rest, and let the night keep watch.",
        "ne": "अब दिनलाई बिसाउनुहोस्, प्रिय पाठक। उपत्यका सुतिसक्यो। आफ्ना सोचहरूलाई विश्राम दिनुहोस्, र रातलाई पहरा दिन दिनुहोस्।"
      }
    }
  ]
}
```

---

## 7. Interoperability Checklist for Downstream Implementers

- [x] Canonical `Story` and `Beat` TypeScript interfaces verified against mobile app sources.
- [x] All 8 `AgeBand` values aligned across `types/story.ts`, `data/catalog.ts`, `store/useSettingsStore.ts`, and Admin Panel.
- [x] Complete list of `StageKind`, `SceneId`, `Pose`, `VoiceRole`, and `SoundId` enums documented.
- [x] Ambient sound auto-resolution hierarchy verified (`beat.music` $\rightarrow$ `SCENE_BED_MAP` $\rightarrow$ `STAGE_BED_MAP` $\rightarrow$ `'night'`).
- [x] Multi-layer AI Narrator and Novel Reader ingestion mechanics documented.
- [x] Exact Cloudflare Workers API contract (`GET /catalog`, `POST /catalog` with Bearer auth) defined.
- [x] Admin CMS beat editor, metadata controls, and direct image uploader requirements defined.
