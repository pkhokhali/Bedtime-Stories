import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { AgeBand, Language } from '@/types/story';

const KEY = 'saanjh.settings.v1';

export type VoicePace = 'slow' | 'gentle' | 'clear';
export type VoiceGender = 'female' | 'male';

type Persisted = {
  language?: Language;
  ageBand?: AgeBand;
  voicePace?: VoicePace;
  voiceGender?: VoiceGender;
  nightSounds?: boolean;
  keepAwake?: boolean;
};

type SettingsState = {
  language: Language;
  ageBand: AgeBand;
  voicePace: VoicePace;
  voiceGender: VoiceGender;
  nightSounds: boolean;
  keepAwake: boolean;
  ready: boolean;
  hydrate: () => Promise<void>;
  setLanguage: (language: Language) => void;
  setAgeBand: (ageBand: AgeBand) => void;
  setVoicePace: (voicePace: VoicePace) => void;
  setVoiceGender: (voiceGender: VoiceGender) => void;
  setNightSounds: (nightSounds: boolean) => void;
  setKeepAwake: (keepAwake: boolean) => void;
  toggleLanguage: () => void;
};

function parseLanguage(value: unknown): Language {
  return value === 'en' || value === 'ne' ? value : 'ne';
}

function parseAgeBand(value: unknown): AgeBand {
  if (value === 'teen') return '13-17';
  if (value === 'adult' || value === '18+') return '18-25';
  return value === '2-4' ||
    value === '4-6' ||
    value === '6-8' ||
    value === '9-12' ||
    value === '13-17' ||
    value === '18-25' ||
    value === '25+'
    ? value
    : '4-6';
}

function parseVoicePace(value: unknown): VoicePace {
  return value === 'slow' || value === 'gentle' || value === 'clear' ? value : 'gentle';
}

function parseVoiceGender(value: unknown): VoiceGender {
  return value === 'male' || value === 'female' ? value : 'female';
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
  toggleLanguage: () => {
    const language = get().language === 'ne' ? 'en' : 'ne';
    get().setLanguage(language);
  },
}));
