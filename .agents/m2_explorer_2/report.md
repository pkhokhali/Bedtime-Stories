# Architectural Blueprint & Component Specification: Audio & Scene Metadata Controls (Milestone 2)

**Author**: Explorer 2 (Milestone 2: Audio & Scene Metadata Controls)  
**Target Files**: `admin/src/types/story.ts`, `admin/src/components/AudioMetadataControls.tsx`  
**Dependencies**: `types/story.ts` (Mobile App Contract), `lib/audio.ts` (Mobile Audio Cascade), `PROJECT.md`, `TEST_READY.md`  
**Date**: 2026-09-01  

---

## 1. Executive Summary

Milestone 2 requires upgrading the Saanjh Admin CMS with production-grade content authoring tools. A core requirement is enabling editors to configure **story-level staging**, **beat-level scene IDs**, **voice narration roles**, **ambient sound beds**, **one-shot SFX stings**, and **character animation rig poses**.

This report provides complete, production-ready implementation blueprints for:
1. **`admin/src/types/story.ts`**: The canonical TypeScript definitions and runtime metadata dictionaries matching the mobile app engine (`types/story.ts`) and backend API (`backend/src/types.d.ts`), eliminating enum drift (e.g. ensuring all 8 `AgeBand` values, all 7 `StageKind` values, all 13 `SceneId` values, all 4 `VoiceRole` values, all 9 `SoundId` values, and all 8 `Pose` values are strictly typed).
2. **`admin/src/components/AudioMetadataControls.tsx`**: A modular, responsive React 19 component library featuring Story-level stage pickers, Beat-level scene and audio controls, character rig pose selectors, and a real-time **Ambient Soundscape Cascade Resolution Preview** that visualizes the exact 4-tier sound bed resolution algorithm used on mobile devices.

---

## 2. Canonical TypeScript Contract (`admin/src/types/story.ts`)

### 2.1 Full Source Blueprint

Below is the complete implementation blueprint for `admin/src/types/story.ts`:

```typescript
/**
 * Saanjh 3.0 Admin CMS - Canonical Story & Audio Metadata Contracts
 * 
 * Shared contract between React Vite Admin Panel, Cloudflare Workers API,
 * and Expo / React Native Mobile Application.
 */

// ============================================================================
// 1. PRIMITIVE UNION TYPES & ENUMS
// ============================================================================

/** Supported natural languages for bilingual storytelling */
export type Language = 'en' | 'ne';

/** High-level editorial category for story organization */
export type StoryCategory = 'roots' | 'universal' | 'custom';

/** Content format mode: interactive animated stage vs paginated novel reader */
export type StoryForm = 'story' | 'novel';

/** 
 * Target audience age band.
 * All 8 bands recognized by mobile app and store settings.
 */
export type AgeBand =
  | '2-4'
  | '4-6'
  | '6-8'
  | '9-12'
  | '13-17'
  | '18-25'
  | '25+'
  | 'parents';

/** High-level audience grouping */
export type AudienceGroup = 'children' | 'young' | 'grown';

/**
 * Procedural 2D visual stages for animated stories (7 kinds).
 * Drives background sky gradients, celestial bodies, and props.
 */
export type StageKind =
  | 'forest'
  | 'moon'
  | 'river'
  | 'courtyard'
  | 'hills'
  | 'lamp'
  | 'stars';

/**
 * Beat-level scene identifiers (13 scenes).
 * Dictates specific background framing and automatic ambient sound bed.
 */
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

/**
 * Spoken voice profile for TTS narrative modulation (4 roles).
 * Varies speech pitch, rate, volume, and Google Cloud Neural voice.
 */
export type VoiceRole = 'narrator' | 'soft' | 'rabbit' | 'tiger';

/**
 * Audio asset identifiers (9 sounds: 5 looping beds + 4 one-shot SFX).
 */
export type SoundId =
  | 'night'
  | 'moon'
  | 'river'
  | 'courtyard'
  | 'wind'
  | 'roar'
  | 'splash'
  | 'ripple'
  | 'chime';

/**
 * Character animation rig poses for procedural SVG rigs (8 poses).
 */
export type Pose =
  | 'hidden'
  | 'idle'
  | 'walk'
  | 'bow'
  | 'sit'
  | 'roar'
  | 'leap'
  | 'lookDown';

/** Media format for streaming or pre-recorded audio/video stories */
export type MediaType = 'video' | 'audio' | 'text';

/** Bilingual localized record */
export type Localized<T = string> = Record<Language, T>;

// ============================================================================
// 2. CORE DATA STRUCTURES (BEAT & STORY)
// ============================================================================

/**
 * Represents an atomic story beat (sentence, dialogue, or paragraph).
 */
export interface Beat {
  /** Unique beat identifier within the story (e.g. "b1", "beat-1", "intro") */
  id: string;

  /** Spoken and displayed text in English and Nepali */
  text: Localized<string>;

  /** Visual background scene identifier */
  scene: SceneId;

  /** Rabbit character animation pose (defaults to 'hidden' if omitted) */
  rabbit?: Pose;

  /** Tiger character animation pose (defaults to 'hidden' if omitted) */
  tiger?: Pose;

  /** Voice profile role for character speech modulation (defaults to 'narrator') */
  voice?: VoiceRole;

  /** 
   * Specific ambient sound bed override for this beat.
   * If undefined, resolves from beat.scene -> story.stage -> 'night'.
   */
  music?: SoundId;

  /** One-shot sound effect sting triggered at beat start */
  sfx?: SoundId;
}

/**
 * Complete story entity matching mobile app and Cloudflare Workers KV schema.
 */
export interface Story {
  /** Unique story slug / kebab-case ID (e.g. "clever-rabbit", "midnight-chiya") */
  id: string;

  /** Thematic categorization */
  category: StoryCategory;

  /** Presentation mode: 'story' (2D stage) or 'novel' (paginated reader) */
  form: StoryForm;

  /** Target audience age band */
  ageBand: AgeBand;

  /** Bilingual story title */
  title: Localized<string>;

  /** Optional bilingual subtitle / description */
  subtitle?: Localized<string>;

  /** Estimated total narration/reading duration in minutes */
  runtimeMinutes?: number;

  /** Bilingual moral, lesson, or philosophical takeaway */
  theme?: Localized<string>;

  /** Primary accent color hex code for card UI and gradients (e.g. "#E8A04A") */
  accent?: string;

  /** Default background stage kind for procedural 2D rendering */
  stage?: StageKind;

  /** Character cast rig flag ('rabbit' enables animal SVG rigs, 'none' disables them) */
  cast?: 'rabbit' | 'none';

  /** Premium lock status flag */
  locked?: boolean;

  /** Ordered array of story beats for TTS narration and reader display */
  beats?: Beat[];

  /** Media format for streaming stories */
  mediaType?: MediaType;

  /** English streaming audio or video URL */
  mediaUrl?: string;

  /** Nepali streaming audio or video URL */
  mediaUrl_ne?: string;

  /** Local bundled asset references (for mobile offline video assets) */
  mediaAssets?: any[];

  /** Hosted HTTPS URL for the cover artwork image */
  coverImage?: string;

  /** Visibility flag in mobile client (if true, excluded from public app catalog) */
  isHidden?: boolean;
}

/**
 * Cloudflare Workers KV root catalog envelope.
 */
export interface CatalogEnvelope {
  /** Incremental schema/revision version number */
  version: number;

  /** Array of active stories */
  stories: Story[];
}

// ============================================================================
// 3. CONSTANT LISTS (FOR FORMS & VALIDATORS)
// ============================================================================

export const AGE_BANDS: readonly AgeBand[] = [
  '2-4',
  '4-6',
  '6-8',
  '9-12',
  '13-17',
  '18-25',
  '25+',
  'parents',
] as const;

export const STAGE_KINDS: readonly StageKind[] = [
  'forest',
  'moon',
  'river',
  'courtyard',
  'hills',
  'lamp',
  'stars',
] as const;

export const SCENE_IDS: readonly SceneId[] = [
  'establishing',
  'meeting',
  'walk',
  'roar',
  'well',
  'leap',
  'peace',
  'moon',
  'river',
  'courtyard',
  'hills',
  'lamp',
  'stars',
] as const;

export const VOICE_ROLES: readonly VoiceRole[] = [
  'narrator',
  'soft',
  'rabbit',
  'tiger',
] as const;

export const SOUND_IDS: readonly SoundId[] = [
  'night',
  'moon',
  'river',
  'courtyard',
  'wind',
  'roar',
  'splash',
  'ripple',
  'chime',
] as const;

export const AMBIENT_SOUND_BEDS: readonly SoundId[] = [
  'night',
  'moon',
  'river',
  'courtyard',
  'wind',
] as const;

export const SFX_SOUNDS: readonly SoundId[] = [
  'roar',
  'splash',
  'ripple',
  'chime',
] as const;

export const POSES: readonly Pose[] = [
  'hidden',
  'idle',
  'walk',
  'bow',
  'sit',
  'roar',
  'leap',
  'lookDown',
] as const;

export const STORY_CATEGORIES: readonly StoryCategory[] = [
  'roots',
  'universal',
  'custom',
] as const;

export const STORY_FORMS: readonly StoryForm[] = [
  'story',
  'novel',
] as const;

// ============================================================================
// 4. SOUNDBED CASCADE RESOLUTION LOGIC
// ============================================================================

/** Scene to ambient sound bed default mapping */
export const SCENE_BED_MAP: Record<SceneId, SoundId> = {
  establishing: 'night',
  meeting: 'night',
  walk: 'night',
  roar: 'night',
  well: 'river',
  leap: 'river',
  peace: 'night',
  moon: 'moon',
  river: 'river',
  courtyard: 'courtyard',
  hills: 'wind',
  lamp: 'courtyard',
  stars: 'night',
};

/** Stage to ambient sound bed default mapping */
export const STAGE_BED_MAP: Record<StageKind, SoundId> = {
  forest: 'night',
  moon: 'moon',
  river: 'river',
  courtyard: 'courtyard',
  hills: 'wind',
  lamp: 'courtyard',
  stars: 'night',
};

/**
 * Resolves the active ambient sound bed using the mobile engine's 4-tier cascade:
 * 1. Explicit Beat Music (`beat.music`)
 * 2. Scene Default (`SCENE_BED_MAP[beat.scene]`)
 * 3. Stage Default (`STAGE_BED_MAP[story.stage]`)
 * 4. Fallback Default (`'night'`)
 */
export function resolveAmbientBed(
  music?: SoundId,
  scene?: SceneId,
  stage?: StageKind
): SoundId {
  if (music) return music;
  if (scene && SCENE_BED_MAP[scene]) return SCENE_BED_MAP[scene];
  if (stage && STAGE_BED_MAP[stage]) return STAGE_BED_MAP[stage];
  return 'night';
}

export type CascadeSource = 'explicit' | 'scene' | 'stage' | 'fallback';

export interface SoundResolutionResult {
  bed: SoundId;
  source: CascadeSource;
  sourceLabel: string;
  sourceDescription: string;
}

/**
 * Detailed ambient bed resolver that returns the sound bed and source provenance.
 */
export function resolveAmbientBedDetailed(
  music?: SoundId,
  scene?: SceneId,
  stage?: StageKind
): SoundResolutionResult {
  if (music) {
    return {
      bed: music,
      source: 'explicit',
      sourceLabel: 'Explicit Beat Override',
      sourceDescription: `Beat specifies music "${music}" directly.`,
    };
  }
  if (scene && SCENE_BED_MAP[scene]) {
    const bed = SCENE_BED_MAP[scene];
    return {
      bed,
      source: 'scene',
      sourceLabel: `Scene Default ("${scene}")`,
      sourceDescription: `Inherited from beat scene "${scene}" → ${bed}.`,
    };
  }
  if (stage && STAGE_BED_MAP[stage]) {
    const bed = STAGE_BED_MAP[stage];
    return {
      bed,
      source: 'stage',
      sourceLabel: `Story Stage Default ("${stage}")`,
      sourceDescription: `Inherited from story stage "${stage}" → ${bed}.`,
    };
  }
  return {
    bed: 'night',
    source: 'fallback',
    sourceLabel: 'Global Fallback',
    sourceDescription: 'Default nocturnal soundscape ("night").',
  };
}

// ============================================================================
// 5. UI DESCRIPTORS & LABELS METADATA
// ============================================================================

export const AGE_BAND_METADATA: Record<AgeBand, { labelEn: string; labelNe: string; audience: AudienceGroup; description: string }> = {
  '2-4': { labelEn: 'Ages 2-4 (Toddlers)', labelNe: '२-४ (साना बालबालिका)', audience: 'children', description: 'Gentle, soothing nature tales' },
  '4-6': { labelEn: 'Ages 4-6 (Bedtime)', labelNe: '४-६ (सुत्ने बेला)', audience: 'children', description: 'Calming bedtime fables' },
  '6-8': { labelEn: 'Ages 6-8 (Wonder)', labelNe: '६-८ (अचम्म र लोककथा)', audience: 'children', description: 'Adventure and Nepali folklore' },
  '9-12': { labelEn: 'Ages 9-12 (Growing)', labelNe: '९-१२ (बढ्दो)', audience: 'children', description: 'School-dusk and community stories' },
  '13-17': { labelEn: 'Ages 13-17 (Teens)', labelNe: '१३-१७ (किशोर)', audience: 'young', description: 'Reflective coming-of-age journeys' },
  '18-25': { labelEn: 'Ages 18-25 (Young Adults)', labelNe: '१८-२५ (युवा)', audience: 'young', description: 'Short evening novels & classics' },
  '25+': { labelEn: 'Ages 25+ (Grown)', labelNe: '२५ र माथि (वयस्क)', audience: 'grown', description: 'Longer contemplative novels' },
  'parents': { labelEn: 'Parents (Novels / Audiobooks)', labelNe: 'अभिभावक (उपन्यास)', audience: 'grown', description: 'After-hours literary relaxation' },
};

export const STAGE_METADATA: Record<StageKind, { label: string; defaultBed: SoundId; description: string; colors: [string, string, string] }> = {
  forest: { label: 'Forest (Deep Woods)', defaultBed: 'night', description: 'Nocturnal woods with grass hill and well', colors: ['#0B0E14', '#1A241C', '#2D4A32'] },
  moon: { label: 'Moon (Ethereal Night)', defaultBed: 'moon', description: 'Glowing large moon and fireflies', colors: ['#120E1C', '#2A1830', '#6A3A28'] },
  river: { label: 'River (Flowing Stream)', defaultBed: 'river', description: 'Rippling water waves and night breeze', colors: ['#0E1818', '#1A3028', '#3A5A52'] },
  courtyard: { label: 'Courtyard (Ancient City)', defaultBed: 'courtyard', description: 'Patan/Bhaktapur carved brick courtyards', colors: ['#1A1020', '#4A2418', '#C4783A'] },
  hills: { label: 'Hills (Himalayan Wind)', defaultBed: 'wind', description: 'Layered mountain silhouettes and breeze', colors: ['#141018', '#2A2430', '#5A3A28'] },
  lamp: { label: 'Lamp (Warm Tea Stall)', defaultBed: 'courtyard', description: 'Glowing amber windows and wooden stall', colors: ['#1A100C', '#3A2218', '#8A4A20'] },
  stars: { label: 'Stars (Deep Cosmos)', defaultBed: 'night', description: 'Twinkling multi-layer starry canopy', colors: ['#0C0A14', '#1A1428', '#3A2848'] },
};

export const SCENE_METADATA: Record<SceneId, { label: string; defaultBed: SoundId; description: string }> = {
  establishing: { label: 'Establishing (Intro)', defaultBed: 'night', description: 'Sets the quiet bedtime atmosphere' },
  meeting: { label: 'Meeting (Encounter)', defaultBed: 'night', description: 'Characters meet on screen' },
  walk: { label: 'Walk (Journey)', defaultBed: 'night', description: 'Pacing journey across the landscape' },
  roar: { label: 'Roar (Drama)', defaultBed: 'night', description: 'Dramatic confrontation or announcement' },
  well: { label: 'Well (Reflection)', defaultBed: 'river', description: 'Stone well with reflective water' },
  leap: { label: 'Leap (Action)', defaultBed: 'river', description: 'Climactic leap into the water' },
  peace: { label: 'Peace (Resolution)', defaultBed: 'night', description: 'Calm closing scene for sleep' },
  moon: { label: 'Moon (Moonlight)', defaultBed: 'moon', description: 'Ethereal glowing night scene' },
  river: { label: 'River (Waterfront)', defaultBed: 'river', description: 'Riverside bank with running water' },
  courtyard: { label: 'Courtyard (City Square)', defaultBed: 'courtyard', description: 'Historical brick courtyard' },
  hills: { label: 'Hills (Mountains)', defaultBed: 'wind', description: 'Mountain pass with highland wind' },
  lamp: { label: 'Lamp (Lantern)', defaultBed: 'courtyard', description: 'Warm glowing lantern or tea stall' },
  stars: { label: 'Stars (Starry Sky)', defaultBed: 'night', description: 'Star-gazing contemplation' },
};

export const VOICE_ROLE_METADATA: Record<VoiceRole, { label: string; description: string; pitchRateHint: string }> = {
  narrator: { label: 'Narrator (Bedtime Default)', description: 'Calm, soothing storytelling voice', pitchRateHint: 'Rate 1.00 • Pitch 0.0' },
  soft: { label: 'Soft / Whispered', description: 'Gentle, intimate whispered delivery', pitchRateHint: 'Rate 0.88 • Pitch -0.05' },
  rabbit: { label: 'Rabbit (Clever / Agile)', description: 'Higher pitch, agile character delivery', pitchRateHint: 'Rate 1.08 • Pitch +0.18 (+2.5 st)' },
  tiger: { label: 'Tiger (Deep / Resonant)', description: 'Deep, commanding character tone', pitchRateHint: 'Rate 0.86 • Pitch -0.22 (-2.5 st)' },
};

export const SOUND_METADATA: Record<SoundId, { label: string; isLoop: boolean; description: string }> = {
  night: { label: 'Night (Crickets)', isLoop: true, description: 'Continuous crickets and nocturnal woods' },
  moon: { label: 'Moon (Drone)', isLoop: true, description: 'Soft ethereal ambient drone' },
  river: { label: 'River (Flow)', isLoop: true, description: 'Gentle continuous flowing mountain water' },
  courtyard: { label: 'Courtyard (Echo)', isLoop: true, description: 'Historic brick courtyard ambient echo' },
  wind: { label: 'Wind (Breeze)', isLoop: true, description: 'Himalayan mountain wind and ridge breeze' },
  roar: { label: 'Roar (Tiger Sting)', isLoop: false, description: 'Gentle tiger roar sound effect' },
  splash: { label: 'Splash (Water Sting)', isLoop: false, description: 'Water well splash sound effect' },
  ripple: { label: 'Ripple (Tea / Water)', isLoop: false, description: 'Subtle water ripple effect' },
  chime: { label: 'Chime (Singing Bowl)', isLoop: false, description: 'Tibetan singing bowl bronze chime' },
};

export const POSE_METADATA: Record<Pose, { label: string; description: string }> = {
  hidden: { label: 'Hidden', description: 'Character not visible on stage' },
  idle: { label: 'Idle (Breathing)', description: 'Standing quietly with gentle breathing' },
  walk: { label: 'Walk (Pacing)', description: 'Walking across stage' },
  bow: { label: 'Bow (Respect)', description: 'Bowing down respectfully' },
  sit: { label: 'Sit (Resting)', description: 'Resting peacefully in sitting pose' },
  roar: { label: 'Roar (Open Mouth)', description: 'Tiger open-mouthed roar stance' },
  leap: { label: 'Leap (Dive)', description: 'Tiger diving downward into well' },
  lookDown: { label: 'Look Down (Well Rim)', description: 'Tiger peering down stone well rim' },
};
```

---

## 3. Component Architecture (`AudioMetadataControls.tsx`)

### 3.1 Component Hierarchy & Structure

`AudioMetadataControls.tsx` is structured into focused sub-components and unified wrappers:

```
AudioMetadataControls.tsx
├── StoryStageControl (Story-level: stageKind dropdown + sky theme gradient + cast toggle)
├── BeatAudioControls (Beat-level: scene, voice, ambient bed override, sfx sting, poses)
├── AmbientBedPreview (Live 4-tier cascade resolution badge & explanation)
└── CharacterPoseControl (Rabbit & Tiger pose dropdowns with visual badges)
```

### 3.2 Visual & UX Wireframe

#### Story-Level Controls
```
+-----------------------------------------------------------------------------------+
|  🎨 STAGE & VISUAL THEME                                                          |
|  [ Stage: Forest (Deep Woods) ▼ ]   [ Preview: ⬛⬛🟩 Gradient ]                  |
|  Default Ambient: 🌙 Night (Crickets) | Cast: [x] Enable Rabbit/Tiger Rig         |
+-----------------------------------------------------------------------------------+
```

#### Beat-Level Controls
```
+-----------------------------------------------------------------------------------+
| 🎬 Beat #2 Audio & Staging Metadata                                               |
+------------------------------------+----------------------------------------------+
| Scene:                             | Voice Role:                                  |
| [ 🌕 Moon (Moonlight)          ▼ ] | [ 🎙️ Soft / Whispered (Intimate)         ▼ ] |
+------------------------------------+----------------------------------------------+
| Ambient Sound Bed (Override):      | SFX Sound Effect Sting:                      |
| [ (Inherit: Moon Drone)        ▼ ] | [ 🔔 Chime (Singing Bowl)                 ▼ ] |
+------------------------------------+----------------------------------------------+
| 🐰 Rabbit Pose:                    | 🐯 Tiger Pose:                               |
| [ 🚶 Walk (Pacing)             ▼ ] | [ 🧎 Sit (Resting)                       ▼ ] |
+------------------------------------+----------------------------------------------+
| 🔊 ACTIVE SOUNDSCAPE RESOLUTION:                                                  |
| ⚡ Active Bed: 🌙 moon (Moon Drone)                                                |
| 🟢 Resolved via: Scene Default ("moon" → moon)                                     |
+-----------------------------------------------------------------------------------+
```

### 3.3 Full Component Implementation Blueprint

Below is the complete implementation blueprint for `admin/src/components/AudioMetadataControls.tsx`:

```tsx
import React, { useMemo } from 'react';
import {
  Volume2,
  Music,
  Sparkles,
  Mic,
  Moon,
  Wind,
  Layers,
  CheckCircle2,
  Info,
} from 'lucide-react';
import type {
  StageKind,
  SceneId,
  VoiceRole,
  SoundId,
  Pose,
  Beat,
} from '../types/story';
import {
  STAGE_KINDS,
  SCENE_IDS,
  VOICE_ROLES,
  AMBIENT_SOUND_BEDS,
  SFX_SOUNDS,
  POSES,
  STAGE_METADATA,
  SCENE_METADATA,
  VOICE_ROLE_METADATA,
  SOUND_METADATA,
  POSE_METADATA,
  resolveAmbientBedDetailed,
} from '../types/story';

// ============================================================================
// 1. STORY-LEVEL STAGE & VISUAL THEME CONTROLS
// ============================================================================

export interface StoryStageControlProps {
  stage?: StageKind;
  cast?: 'rabbit' | 'none';
  onChangeStage: (stage: StageKind) => void;
  onChangeCast?: (cast: 'rabbit' | 'none') => void;
  disabled?: boolean;
  className?: string;
}

export const StoryStageControl: React.FC<StoryStageControlProps> = ({
  stage = 'forest',
  cast = 'rabbit',
  onChangeStage,
  onChangeCast,
  disabled = false,
  className = '',
}) => {
  const currentStageMeta = STAGE_METADATA[stage] || STAGE_METADATA.forest;

  return (
    <div className={`bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
          <Layers size={16} className="text-amber-600" />
          <span>Story Stage & Visual Theme</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 font-medium">Sky Gradient:</span>
          <div
            className="w-16 h-4 rounded border border-slate-300 shadow-inner"
            style={{
              background: `linear-gradient(to right, ${currentStageMeta.colors[0]}, ${currentStageMeta.colors[1]}, ${currentStageMeta.colors[2]})`,
            }}
            title={`Stage Gradient: ${currentStageMeta.colors.join(' → ')}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Stage Kind Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Default Stage Background
          </label>
          <select
            value={stage}
            onChange={(e) => onChangeStage(e.target.value as StageKind)}
            disabled={disabled}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:opacity-60"
          >
            {STAGE_KINDS.map((sk) => {
              const meta = STAGE_METADATA[sk];
              return (
                <option key={sk} value={sk}>
                  {meta.label} (Default: {meta.defaultBed})
                </option>
              );
            })}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            {currentStageMeta.description}
          </p>
        </div>

        {/* Character Cast Toggle */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Character Rig Animation Cast
          </label>
          {onChangeCast ? (
            <select
              value={cast}
              onChange={(e) => onChangeCast(e.target.value as 'rabbit' | 'none')}
              disabled={disabled}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:opacity-60"
            >
              <option value="rabbit">🐇 Enable Rabbit & Tiger SVG Rigs</option>
              <option value="none">🚫 No Character Rigs (Atmospheric / Novel)</option>
            </select>
          ) : (
            <div className="text-sm font-medium text-slate-700 py-2">
              {cast === 'rabbit' ? '🐇 Rabbit & Tiger Rigs Active' : '🚫 No Rigs'}
            </div>
          )}
          <p className="text-xs text-slate-500 mt-1">
            Enables procedural SVG character poses during narration.
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. AMBIENT SOUND BED CASCADE PREVIEW BADGE
// ============================================================================

export interface AmbientBedPreviewProps {
  music?: SoundId;
  scene?: SceneId;
  stage?: StageKind;
  compact?: boolean;
  className?: string;
}

export const AmbientBedPreview: React.FC<AmbientBedPreviewProps> = ({
  music,
  scene,
  stage = 'forest',
  compact = false,
  className = '',
}) => {
  const resolution = useMemo(
    () => resolveAmbientBedDetailed(music, scene, stage),
    [music, scene, stage]
  );

  const badgeColor = useMemo(() => {
    switch (resolution.source) {
      case 'explicit':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'scene':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'stage':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'fallback':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }, [resolution.source]);

  const soundMeta = SOUND_METADATA[resolution.bed] || SOUND_METADATA.night;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColor} ${className}`}>
        <Volume2 size={12} />
        <span>Sound Bed: <strong>{soundMeta.label}</strong></span>
        <span className="text-[10px] opacity-75 font-normal">({resolution.sourceLabel})</span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-3 ${badgeColor} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="shrink-0" />
          <div className="text-xs">
            <span className="font-semibold">Active Bedtime Ambient Bed: </span>
            <span className="font-bold underline">{soundMeta.label}</span>
          </div>
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/70 shadow-xs border border-current">
          {resolution.sourceLabel}
        </span>
      </div>
      <p className="text-[11px] mt-1.5 opacity-85 leading-relaxed">
        {resolution.sourceDescription} {soundMeta.description}.
      </p>
    </div>
  );
};

// ============================================================================
// 3. BEAT-LEVEL AUDIO & SCENE METADATA CONTROLS
// ============================================================================

export interface BeatAudioControlsProps {
  beat: Beat;
  storyStage?: StageKind;
  storyCast?: 'rabbit' | 'none';
  onChangeBeat: (updatedFields: Partial<Beat>) => void;
  disabled?: boolean;
  className?: string;
}

export const BeatAudioControls: React.FC<BeatAudioControlsProps> = ({
  beat,
  storyStage = 'forest',
  storyCast = 'rabbit',
  onChangeBeat,
  disabled = false,
  className = '',
}) => {
  const showRigControls = storyCast !== 'none';

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Row 1: Scene & Voice Role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Scene Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Moon size={13} className="text-indigo-500" />
            <span>Scene Framing (`sceneId`)</span>
          </label>
          <select
            value={beat.scene}
            onChange={(e) => onChangeBeat({ scene: e.target.value as SceneId })}
            disabled={disabled}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:opacity-60"
          >
            {SCENE_IDS.map((sc) => {
              const meta = SCENE_METADATA[sc];
              return (
                <option key={sc} value={sc}>
                  {meta.label} → 🎵 {meta.defaultBed}
                </option>
              );
            })}
          </select>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {SCENE_METADATA[beat.scene]?.description || ''}
          </p>
        </div>

        {/* Voice Role Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Mic size={13} className="text-amber-500" />
            <span>Narrator Voice Role (`voice`)</span>
          </label>
          <select
            value={beat.voice || 'narrator'}
            onChange={(e) => onChangeBeat({ voice: e.target.value as VoiceRole })}
            disabled={disabled}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:opacity-60"
          >
            {VOICE_ROLES.map((vr) => {
              const meta = VOICE_ROLE_METADATA[vr];
              return (
                <option key={vr} value={vr}>
                  {meta.label} ({meta.pitchRateHint})
                </option>
              );
            })}
          </select>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {VOICE_ROLE_METADATA[beat.voice || 'narrator']?.description || ''}
          </p>
        </div>
      </div>

      {/* Row 2: Ambient Music Bed & One-Shot SFX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Ambient Bed Override */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Music size={13} className="text-blue-500" />
            <span>Ambient Bed Override (`music`)</span>
          </label>
          <select
            value={beat.music || ''}
            onChange={(e) =>
              onChangeBeat({
                music: e.target.value ? (e.target.value as SoundId) : undefined,
              })
            }
            disabled={disabled}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:opacity-60"
          >
            <option value="">(Auto: Inherit from Scene / Stage)</option>
            {AMBIENT_SOUND_BEDS.map((snd) => (
              <option key={snd} value={snd}>
                🔁 {SOUND_METADATA[snd].label}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Loops continuously during this beat.
          </p>
        </div>

        {/* SFX Sting */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-600" />
            <span>Sound Effect Sting (`sfx`)</span>
          </label>
          <select
            value={beat.sfx || ''}
            onChange={(e) =>
              onChangeBeat({
                sfx: e.target.value ? (e.target.value as SoundId) : undefined,
              })
            }
            disabled={disabled}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:opacity-60"
          >
            <option value="">(None - No Sound Effect)</option>
            {SFX_SOUNDS.map((sfxId) => (
              <option key={sfxId} value={sfxId}>
                ⚡ {SOUND_METADATA[sfxId].label}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Plays once at the start of this beat.
          </p>
        </div>
      </div>

      {/* Row 3: Character Rig Poses (if cast is active) */}
      {showRigControls && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              🐇 Rabbit Rig Pose (`rabbit`)
            </label>
            <select
              value={beat.rabbit || 'hidden'}
              onChange={(e) => onChangeBeat({ rabbit: e.target.value as Pose })}
              disabled={disabled}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:opacity-60"
            >
              {POSES.map((p) => (
                <option key={p} value={p}>
                  {POSE_METADATA[p].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              🐯 Tiger Rig Pose (`tiger`)
            </label>
            <select
              value={beat.tiger || 'hidden'}
              onChange={(e) => onChangeBeat({ tiger: e.target.value as Pose })}
              disabled={disabled}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:opacity-60"
            >
              {POSES.map((p) => (
                <option key={p} value={p}>
                  {POSE_METADATA[p].label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Live Ambient Sound Bed Cascade Resolution Preview */}
      <AmbientBedPreview
        music={beat.music}
        scene={beat.scene}
        stage={storyStage}
      />
    </div>
  );
};

// ============================================================================
// 4. UNIFIED EXPORT
// ============================================================================

export default BeatAudioControls;
```

---

## 4. Ambient Bed Resolution Cascade Analysis

### 4.1 Resolution Algorithm & Priority Order

On the mobile app (`lib/audio.ts` -> `resolveAmbientBed`), the audio engine evaluates 4 distinct tiers before starting playback for any beat:

$$\text{ActiveBed} = \begin{cases} 
\text{beat.music} & \text{if defined and non-empty} \\
\text{SCENE\_BED\_MAP}[\text{beat.scene}] & \text{if mapped} \\
\text{STAGE\_BED\_MAP}[\text{story.stage}] & \text{if mapped} \\
\text{'night'} & \text{default fallback}
\end{cases}$$

### 4.2 Comprehensive Cascade Matrix

| Scenario | `beat.music` | `beat.scene` | `story.stage` | Resolved Bed | Cascade Tier |
|---|---|---|---|---|---|
| **1. Explicit Override** | `'river'` | `'moon'` | `'forest'` | **`river`** | Tier 1 (Explicit Beat Music) |
| **2. Explicit SFX Check** | `undefined` | `'moon'` | `'forest'` | **`moon`** | Tier 2 (Scene Default) |
| **3. Well / Water Scene** | `undefined` | `'well'` | `'courtyard'`| **`river`** | Tier 2 (Scene Default) |
| **4. Hillside Wind Scene** | `undefined` | `'hills'` | `'forest'` | **`wind`** | Tier 2 (Scene Default) |
| **5. Stage Fallback** | `undefined` | `'establishing'` | `'hills'` | **`night`** | Tier 2 (`establishing` $\rightarrow$ `night`) |
| **6. Stage Cascade** | `undefined` | `undefined` | `'courtyard'`| **`courtyard`** | Tier 3 (Stage Default) |
| **7. Global Default** | `undefined` | `undefined` | `undefined` | **`night`** | Tier 4 (Global Fallback) |

---

## 5. Implementation & Integration Plan for Downstream Agents

### 5.1 Step 1: Create `admin/src/types/story.ts`
Implement the full file in `admin/src/types/story.ts` using the exact blueprint from Section 2.

### 5.2 Step 2: Create `admin/src/components/AudioMetadataControls.tsx`
Implement the component in `admin/src/components/AudioMetadataControls.tsx` using the blueprint from Section 3.

### 5.3 Step 3: Integrate into `BeatEditor.tsx` & `App.tsx`
- In `BeatEditor.tsx`, render `<BeatAudioControls beat={beat} storyStage={story.stage} storyCast={story.cast} onChangeBeat={...} />` inside each accordion beat card.
- In `StoryForm` / `App.tsx`, render `<StoryStageControl stage={story.stage} cast={story.cast} onChangeStage={...} onChangeCast={...} />` in the story metadata panel.

---

## 6. Verification Method

Once implemented, verify with the following steps:
1. Run `npx tsc --noEmit` in `admin/` to confirm zero TypeScript compilation errors with `verbatimModuleSyntax: true`.
2. Run the automated E2E test suite:
   ```bash
   node tests/e2e/runner.js
   ```
   Specifically verify that `Feature 7: Audio & Scene Metadata Controls` (`F07-1` to `F07-6`), `Tier 2 Enum Boundary Checks`, and `Tier 4 Scenario 5 (Mobile App Catalog Consumption)` pass with 100% success.
