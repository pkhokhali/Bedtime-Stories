import * as Speech from 'expo-speech';

import { getSynthesizedAudioUri, playCloudAudio, stopCloudAudio } from '@/lib/narrator/cloudTts';
import { segmentText, VOICE_PROFILES } from '@/lib/narrator/segmenter';
import { useSettingsStore, VoiceGender, VoicePace } from '@/store/useSettingsStore';
import { Language, VoiceRole } from '@/types/story';

export type SpeakOptions = {
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

let voices: Speech.Voice[] = [];
let currentSpeechGen = 0;

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
  const gendered =
    gender === 'female'
      ? ['female', 'woman', 'girl', 'samantha', 'karen', 'veena', 'raveena', 'moira', 'serena', 'zira']
      : ['male', 'man', 'boy', 'daniel', 'rishi', 'david', 'mark', 'fred', 'alex'];

  const inLang = voices.filter((item) => {
    const code = (item.language || '').toLowerCase();
    return lang.some((prefix) => code.startsWith(prefix.toLowerCase()));
  });
  const pool = inLang.length
    ? inLang
    : voices.filter((item) => (item.language || '').toLowerCase().startsWith('en'));

  const named = pool.find((item) => {
    const hay = `${item.name} ${item.identifier}`.toLowerCase();
    return gendered.some((word) => hay.includes(word));
  });
  return named?.identifier ?? pool[0]?.identifier;
}

function pitchFor(role: VoiceRole, gender: VoiceGender) {
  const profile = VOICE_PROFILES[role] || VOICE_PROFILES.narrator;
  const base = GENDER_PITCH[gender] || 1.0;
  const value = base + profile.pitchDelta;
  return Math.min(1.4, Math.max(0.5, value));
}

/**
 * Executes bedtime story narration for a beat or text string.
 * Uses Layer 2 Cloud Neural AI voice when enabled and available,
 * and gracefully falls back to Layer 1 Enhanced on-device segmented speech.
 */
export async function speakBeat(text: string, options: SpeakOptions): Promise<void> {
  const { language, voice = 'narrator', onDone } = options;
  stopSpeech();
  const gen = ++currentSpeechGen;

  const { aiVoice, voicePace, voiceGender } = useSettingsStore.getState();

  // Layer 2: Optional Cloud AI Neural Voice
  if (aiVoice) {
    try {
      const audioUri = await getSynthesizedAudioUri(text, {
        language,
        gender: voiceGender,
        pace: voicePace,
        role: voice,
      });

      if (gen !== currentSpeechGen) return;

      if (audioUri) {
        await playCloudAudio(audioUri, () => {
          if (gen === currentSpeechGen) {
            onDone?.();
          }
        });
        return;
      }
    } catch {
      // Gracefully fall through to Layer 1 on-device TTS
    }
  }

  if (gen !== currentSpeechGen) return;

  // Layer 1: Enhanced On-Device Segmented TTS
  const segments = segmentText(text, voice);
  if (!segments.length) {
    onDone?.();
    return;
  }

  for (let i = 0; i < segments.length; i++) {
    if (gen !== currentSpeechGen) return;
    const segment = segments[i];

    await new Promise<void>((resolve) => {
      if (gen !== currentSpeechGen) {
        resolve();
        return;
      }

      const rate = (PACE[voicePace]?.[language] ?? 0.74) * (segment.rateModifier ?? 1.0);
      const pitch = pitchFor(segment.role, voiceGender);

      Speech.speak(segment.text, {
        language: language === 'ne' ? 'ne-NP' : 'en-IN',
        voice: pickVoiceId(language, voiceGender),
        pitch: Math.min(1.5, Math.max(0.5, pitch)),
        rate: Math.min(1.5, Math.max(0.4, rate)),
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: () => resolve(),
      });
    });

    if (gen !== currentSpeechGen) return;

    // Strategic bedtime pause between segments
    if (i < segments.length - 1 && segment.pauseAfterMs > 0) {
      await wait(segment.pauseAfterMs);
    }
  }

  if (gen === currentSpeechGen) {
    onDone?.();
  }
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
  currentSpeechGen++;
  Speech.stop();
  stopCloudAudio();
}

export function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
