export type Language = 'en' | 'ne';

export type StoryCategory = 'roots' | 'universal' | 'custom';

export type AgeBand = '2-4' | '4-6' | '6-8' | '9-12' | '13-17' | '18-25' | '25+' | 'parents';

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

export type StageKind = 'forest' | 'moon' | 'river' | 'courtyard' | 'hills' | 'lamp' | 'stars';

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

export type Localized<T = string> = Record<Language, T>;

export type Beat = {
  id: string;
  text: Localized;
  scene: SceneId;
  rabbit: Pose;
  tiger: Pose;
  voice?: VoiceRole;
  music?: SoundId;
  sfx?: SoundId;
};

export type MediaType = 'video' | 'audio';

export type Story = {
  id: string;
  category: StoryCategory;
  form: StoryForm;
  ageBand: AgeBand;
  title: Localized;
  subtitle?: Localized;
  runtimeMinutes?: number;
  theme?: Localized;
  accent?: string;
  stage?: StageKind;
  cast?: 'rabbit' | 'none';
  locked?: boolean;
  beats?: Beat[];
  
  // Fields for remote streaming/downloaded stories
  mediaType?: MediaType;
  mediaUrl?: string; // English
  mediaUrl_ne?: string; // Nepali
  mediaAssets?: any[]; // For local bundled files using require(), array supports multi-part stories
  coverImage?: string;
  isHidden?: boolean;
};

export type SceneState = {
  scene: SceneId;
  rabbit: Pose;
  tiger: Pose;
};
