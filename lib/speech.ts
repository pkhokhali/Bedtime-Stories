import * as Speech from 'expo-speech';

import { useSettingsStore, VoiceGender, VoicePace } from '@/store/useSettingsStore';
import { Language, VoiceRole } from '@/types/story';

type SpeakOptions = {
  language: Language;
  voice?: VoiceRole;
  onDone?: () => void;
};

const PACE: Record<VoicePace, Record<Language, number>> = {
  slow: { ne: 0.62, en: 0.58 },
  gentle: { ne: 0.74, en: 0.7 },
  clear: { ne: 0.86, en: 0.82 },
};

const GENDER_PITCH: Record<VoiceGender, number> = {
  female: 1.08,
  male: 0.8,
};

const ROLE_PITCH: Record<VoiceRole, number> = {
  narrator: 0,
  soft: -0.04,
  rabbit: 0.14,
  tiger: -0.16,
};

let voices: Speech.Voice[] = [];

export async function hydrateVoices() {
  try {
    voices = await Speech.getAvailableVoicesAsync();
  } catch {
    voices = [];
  }
}

function pickVoiceId(language: Language, gender: VoiceGender): string | undefined {
  if (!voices.length) return undefined;
  const lang = language === 'ne' ? ['ne', 'hi'] : ['en-IN', 'en-GB', 'en-AU', 'en-US', 'en'];
  const gendered = gender === 'female'
    ? ['female', 'woman', 'girl', 'samantha', 'karen', 'veena', 'raveena', 'moira', 'serena', 'zira']
    : ['male', 'man', 'boy', 'daniel', 'rishi', 'david', 'mark', 'fred', 'alex'];

  const inLang = voices.filter((item) => {
    const code = (item.language || '').toLowerCase();
    return lang.some((prefix) => code.startsWith(prefix.toLowerCase()));
  });
  const pool = inLang.length ? inLang : voices.filter((item) =>
    (item.language || '').toLowerCase().startsWith('en'),
  );

  const named = pool.find((item) => {
    const hay = `${item.name} ${item.identifier}`.toLowerCase();
    return gendered.some((word) => hay.includes(word));
  });
  return named?.identifier ?? pool[0]?.identifier;
}

function pitchFor(role: VoiceRole, gender: VoiceGender) {
  const value = GENDER_PITCH[gender] + ROLE_PITCH[role];
  return Math.min(1.4, Math.max(0.5, value));
}

export function speakBeat(text: string, options: SpeakOptions) {
  const { language, voice = 'narrator', onDone } = options;
  Speech.stop();
  const { voicePace, voiceGender } = useSettingsStore.getState();
  Speech.speak(text, {
    language: language === 'ne' ? 'ne-NP' : 'en-IN',
    voice: pickVoiceId(language, voiceGender),
    pitch: pitchFor(voice, voiceGender),
    rate: PACE[voicePace][language],
    onDone,
    onStopped: () => undefined,
    onError: () => onDone?.(),
  });
}

export function previewTeller() {
  const { language } = useSettingsStore.getState();
  const sample =
    language === 'ne'
      ? 'साँझ आयो। म तपाईंलाई एउटा कथा सुनाउँछु।'
      : 'Evening is here. Let me tell you a story.';
  speakBeat(sample, { language, voice: 'narrator' });
}

export function stopSpeech() {
  Speech.stop();
}

export function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
