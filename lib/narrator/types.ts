import { VoiceGender, VoicePace } from '@/store/useSettingsStore';
import { Language, VoiceRole } from '@/types/story';

export interface SpeechSegment {
  text: string;
  pauseAfterMs: number;
  isDialogue: boolean;
  role: VoiceRole;
  pitchModifier?: number;
  rateModifier?: number;
  volume?: number;
}

export interface VoiceProfile {
  pitchDelta: number;
  rateMultiplier: number;
  volume: number;
}

export type VoiceProfiles = Record<VoiceRole, VoiceProfile>;

export interface CloudTtsOptions {
  language: Language;
  gender: VoiceGender;
  pace: VoicePace;
  role?: VoiceRole;
  apiKey?: string;
}

export type NarratorStatus = 'idle' | 'playing' | 'paused' | 'buffering' | 'done';

export interface NarratorState {
  status: NarratorStatus;
  currentBeatIndex: number;
  currentSegmentIndex: number;
  isCloudVoice: boolean;
  error?: string;
}
