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

/** Bilingual localized record */
export type Localized<T = string> = Record<Language, T>;

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
export type VoiceRole = 'narrator' | 'tiger' | 'rabbit' | 'soft';

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
export type MediaType = 'video' | 'audio' | 'text' | 'youtube';

// ============================================================================
// 2. CORE DATA STRUCTURES (BEAT, STORY & CATALOG)
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

  /** YouTube Video ID for youtube mediaType */
  youtubeId?: string;

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
export interface Catalog {
  /** Incremental schema/revision version number */
  version: number;

  /** Last update timestamp ISO string */
  updatedAt?: string;

  /** Array of active stories */
  stories: Story[];
}

export interface CatalogEnvelope {
  version: number;
  stories: Story[];
}

// ============================================================================
// 3. CONSTANT ENUM LISTS (FOR FORMS & VALIDATORS)
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
  'tiger',
  'rabbit',
  'soft',
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
  'wind',
  'night',
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
// 5. UI DESCRIPTORS & METADATA DICTIONARIES
// ============================================================================

export const AGE_BAND_METADATA: Record<
  AgeBand,
  { labelEn: string; labelNe: string; audience: AudienceGroup; description: string }
> = {
  '2-4': {
    labelEn: 'Ages 2-4 (Toddlers)',
    labelNe: '२-४ (साना बालबालिका)',
    audience: 'children',
    description: 'Gentle, soothing nature tales',
  },
  '4-6': {
    labelEn: 'Ages 4-6 (Bedtime)',
    labelNe: '४-६ (सुत्ने बेला)',
    audience: 'children',
    description: 'Calming bedtime fables',
  },
  '6-8': {
    labelEn: 'Ages 6-8 (Wonder)',
    labelNe: '६-८ (अचम्म र लोककथा)',
    audience: 'children',
    description: 'Adventure and Nepali folklore',
  },
  '9-12': {
    labelEn: 'Ages 9-12 (Growing)',
    labelNe: '९-१२ (बढ्दो)',
    audience: 'children',
    description: 'School-dusk and community stories',
  },
  '13-17': {
    labelEn: 'Ages 13-17 (Teens)',
    labelNe: '१३-१७ (किशोर)',
    audience: 'young',
    description: 'Reflective coming-of-age journeys',
  },
  '18-25': {
    labelEn: 'Ages 18-25 (Young Adults)',
    labelNe: '१८-२५ (युवा)',
    audience: 'young',
    description: 'Short evening novels & classics',
  },
  '25+': {
    labelEn: 'Ages 25+ (Grown)',
    labelNe: '२५ र माथि (वयस्क)',
    audience: 'grown',
    description: 'Longer contemplative novels',
  },
  'parents': {
    labelEn: 'Parents (Novels / Audiobooks)',
    labelNe: 'अभिभावक (उपन्यास)',
    audience: 'grown',
    description: 'After-hours literary relaxation',
  },
};

export const STAGE_METADATA: Record<
  StageKind,
  { label: string; defaultBed: SoundId; description: string; colors: [string, string, string] }
> = {
  forest: {
    label: 'Forest (Deep Woods)',
    defaultBed: 'night',
    description: 'Nocturnal woods with grass hill and well',
    colors: ['#0B0E14', '#1A241C', '#2D4A32'],
  },
  moon: {
    label: 'Moon (Ethereal Night)',
    defaultBed: 'moon',
    description: 'Glowing large moon and fireflies',
    colors: ['#120E1C', '#2A1830', '#6A3A28'],
  },
  river: {
    label: 'River (Flowing Stream)',
    defaultBed: 'river',
    description: 'Rippling water waves and night breeze',
    colors: ['#0E1818', '#1A3028', '#3A5A52'],
  },
  courtyard: {
    label: 'Courtyard (Ancient City)',
    defaultBed: 'courtyard',
    description: 'Patan/Bhaktapur carved brick courtyards',
    colors: ['#1A1020', '#4A2418', '#C4783A'],
  },
  hills: {
    label: 'Hills (Himalayan Wind)',
    defaultBed: 'wind',
    description: 'Layered mountain silhouettes and breeze',
    colors: ['#141018', '#2A2430', '#5A3A28'],
  },
  lamp: {
    label: 'Lamp (Warm Tea Stall)',
    defaultBed: 'courtyard',
    description: 'Glowing amber windows and wooden stall',
    colors: ['#1A100C', '#3A2218', '#8A4A20'],
  },
  stars: {
    label: 'Stars (Deep Cosmos)',
    defaultBed: 'night',
    description: 'Twinkling multi-layer starry canopy',
    colors: ['#0C0A14', '#1A1428', '#3A2848'],
  },
};

export const SCENE_METADATA: Record<
  SceneId,
  { label: string; defaultBed: SoundId; description: string }
> = {
  establishing: { label: 'Establishing (Intro)', defaultBed: 'night', description: 'Sets the quiet bedtime atmosphere' },
  meeting: { label: 'Meeting (Encounter)', defaultBed: 'night', description: 'Characters meet on stage' },
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

export const VOICE_ROLE_METADATA: Record<
  VoiceRole,
  { label: string; description: string; pitchRateHint: string }
> = {
  narrator: { label: 'Narrator (Bedtime Default)', description: 'Calm, soothing storytelling voice', pitchRateHint: 'Rate 1.00 • Pitch 0.0' },
  soft: { label: 'Soft / Whispered', description: 'Gentle, intimate whispered delivery', pitchRateHint: 'Rate 0.88 • Pitch -0.05' },
  rabbit: { label: 'Rabbit (Clever / Agile)', description: 'Higher pitch, agile character delivery', pitchRateHint: 'Rate 1.08 • Pitch +0.18 (+2.5 st)' },
  tiger: { label: 'Tiger (Deep / Resonant)', description: 'Deep, commanding character tone', pitchRateHint: 'Rate 0.86 • Pitch -0.22 (-2.5 st)' },
};

export const SOUND_METADATA: Record<
  SoundId,
  { label: string; isLoop: boolean; description: string }
> = {
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
