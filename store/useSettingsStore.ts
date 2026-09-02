import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { AgeBand, Language } from '@/types/story';
import { SoundscapeId } from '@/lib/sounds';
import { SleepTimerDuration } from '@/store/useSleepTimerStore';

const KEY = 'saanjh.settings.v1';

export type VoicePace = 'slow' | 'gentle' | 'clear';
export type VoiceGender = 'female' | 'male';

export type Persisted = {
  language?: Language;
  ageBand?: AgeBand;
  voicePace?: VoicePace;
  voiceGender?: VoiceGender;
  nightSounds?: boolean;
  keepAwake?: boolean;
  aiVoice?: boolean;
  sleepTimerDuration?: SleepTimerDuration;
  activeSoundscape?: SoundscapeId | null;
  soundscapeVolume?: number;
  nightLightColor?: 'amber' | 'moonlight';
  nightLightBrightness?: number;
};

export type SettingsState = {
  language: Language;
  ageBand: AgeBand;
  voicePace: VoicePace;
  voiceGender: VoiceGender;
  nightSounds: boolean;
  keepAwake: boolean;
  aiVoice: boolean;
  sleepTimerDuration: SleepTimerDuration;
  activeSoundscape: SoundscapeId | null;
  soundscapeVolume: number;
  nightLightColor: 'amber' | 'moonlight';
  nightLightBrightness: number;
  ready: boolean;
  hydrate: () => Promise<void>;
  setLanguage: (language: Language) => void;
  setAgeBand: (ageBand: AgeBand) => void;
  setVoicePace: (voicePace: VoicePace) => void;
  setVoiceGender: (voiceGender: VoiceGender) => void;
  setNightSounds: (nightSounds: boolean) => void;
  setKeepAwake: (keepAwake: boolean) => void;
  setAiVoice: (aiVoice: boolean) => void;
  setSleepTimerDuration: (duration: SleepTimerDuration) => void;
  setActiveSoundscape: (soundscape: SoundscapeId | null) => void;
  setSoundscapeVolume: (volume: number) => void;
  setNightLightColor: (color: 'amber' | 'moonlight') => void;
  setNightLightBrightness: (brightness: number) => void;
  updateSetting: <K extends keyof Persisted>(key: K, value: Persisted[K]) => void;
  toggleLanguage: () => void;
};

function parseLanguage(value: unknown): Language {
  return value === 'en' || value === 'ne' ? value : 'ne';
}

function parseAgeBand(value: unknown): AgeBand {
  if (value === 'teen') return '13-17';
  if (value === 'adult' || value === '18+') return '18-25';
  if (value === 'parent' || value === 'parents') return 'parents';
  return value === '2-4' ||
    value === '4-6' ||
    value === '6-8' ||
    value === '9-12' ||
    value === '13-17' ||
    value === '18-25' ||
    value === '25+' ||
    value === 'parents'
    ? value
    : '4-6';
}

function parseVoicePace(value: unknown): VoicePace {
  return value === 'slow' || value === 'gentle' || value === 'clear' ? value : 'gentle';
}

function parseVoiceGender(value: unknown): VoiceGender {
  return value === 'male' || value === 'female' ? value : 'female';
}

function parseSleepTimerDuration(value: unknown): SleepTimerDuration {
  if (
    value === 'off' ||
    value === '15m' ||
    value === '30m' ||
    value === '45m' ||
    value === '60m' ||
    value === 'endOfStory'
  ) {
    return value;
  }
  return 'off';
}

function parseSoundscape(value: unknown): SoundscapeId | null {
  if (
    value === 'rain' ||
    value === 'river' ||
    value === 'night' ||
    value === 'wind' ||
    value === 'chime'
  ) {
    return value;
  }
  return null;
}

function parseVolume(value: unknown): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return Math.max(0, Math.min(1, value));
  }
  return 0.5;
}

function parseNightLightColor(value: unknown): 'amber' | 'moonlight' {
  return value === 'moonlight' || value === 'amber' ? value : 'amber';
}

function parseNightLightBrightness(value: unknown): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return Math.max(0.05, Math.min(1, value));
  }
  return 0.6;
}

function persist(partial: Persisted) {
  AsyncStorage.getItem(KEY)
    .then((raw) => {
      const prev = raw ? (JSON.parse(raw) as Persisted) : {};
      return AsyncStorage.setItem(KEY, JSON.stringify({ ...prev, ...partial }));
    })
    .catch(() => undefined);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: 'ne',
  ageBand: '4-6',
  voicePace: 'gentle',
  voiceGender: 'female',
  nightSounds: true,
  keepAwake: true,
  aiVoice: false,
  sleepTimerDuration: 'off',
  activeSoundscape: null,
  soundscapeVolume: 0.5,
  nightLightColor: 'amber',
  nightLightBrightness: 0.6,
  ready: true,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Persisted;
        set({
          language: parseLanguage(parsed.language),
          ageBand: parseAgeBand(parsed.ageBand),
          voicePace: parseVoicePace(parsed.voicePace),
          voiceGender: parseVoiceGender(parsed.voiceGender),
          nightSounds: parsed.nightSounds !== false,
          keepAwake: parsed.keepAwake !== false,
          aiVoice: parsed.aiVoice === true,
          sleepTimerDuration: parseSleepTimerDuration(parsed.sleepTimerDuration),
          activeSoundscape: parseSoundscape(parsed.activeSoundscape),
          soundscapeVolume: parseVolume(parsed.soundscapeVolume),
          nightLightColor: parseNightLightColor(parsed.nightLightColor),
          nightLightBrightness: parseNightLightBrightness(parsed.nightLightBrightness),
          ready: true,
        });
        return;
      }
    } catch {
      // keep default
    }
    set({ ready: true });
  },

  setLanguage: (language) => {
    set({ language });
    persist({ language });
  },
  setAgeBand: (ageBand) => {
    set({ ageBand });
    persist({ ageBand });
  },
  setVoicePace: (voicePace) => {
    set({ voicePace });
    persist({ voicePace });
  },
  setVoiceGender: (voiceGender) => {
    set({ voiceGender });
    persist({ voiceGender });
  },
  setNightSounds: (nightSounds) => {
    set({ nightSounds });
    persist({ nightSounds });
  },
  setKeepAwake: (keepAwake) => {
    set({ keepAwake });
    persist({ keepAwake });
  },
  setAiVoice: (aiVoice) => {
    set({ aiVoice });
    persist({ aiVoice });
  },
  setSleepTimerDuration: (sleepTimerDuration) => {
    set({ sleepTimerDuration });
    persist({ sleepTimerDuration });
  },
  setActiveSoundscape: (activeSoundscape) => {
    set({ activeSoundscape });
    persist({ activeSoundscape });
  },
  setSoundscapeVolume: (soundscapeVolume) => {
    set({ soundscapeVolume });
    persist({ soundscapeVolume });
  },
  setNightLightColor: (nightLightColor) => {
    set({ nightLightColor });
    persist({ nightLightColor });
  },
  setNightLightBrightness: (nightLightBrightness) => {
    set({ nightLightBrightness });
    persist({ nightLightBrightness });
  },
  updateSetting: (key, value) => {
    set({ [key]: value } as any);
    persist({ [key]: value });
  },
  toggleLanguage: () => {
    const language = get().language === 'ne' ? 'en' : 'ne';
    get().setLanguage(language);
  },
}));

