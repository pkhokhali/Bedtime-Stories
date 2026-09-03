import * as FileSystem from 'expo-file-system/legacy';

import { VoiceGender, VoicePace } from '@/store/useSettingsStore';
import { Beat, Language, VoiceRole } from '@/types/story';
import { CloudTtsOptions } from './types';

const CACHE_DIR = `${FileSystem.cacheDirectory}saanjh_tts/`;
const GOOGLE_TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

type AudioPlayer = import('expo-audio').AudioPlayer;

let currentCloudAudioPlayer: AudioPlayer | null = null;
let currentCloudAudioSub: { remove: () => void } | null = null;

/**
 * Premium voice name mapping for warm, natural bedtime narration.
 * Neural2 voices deliver dramatically more human-like speech than Standard.
 */
const VOICE_MAP: Record<string, Record<VoiceGender, string>> = {
  en: {
    female: 'en-IN-Neural2-A',  // Warm Indian-English female
    male: 'en-IN-Neural2-B',    // Deep soothing Indian-English male
  },
  ne: {
    female: 'ne-NP-Standard-A', // Nepali female (best available)
    male: 'ne-NP-Standard-B',   // Nepali male (best available)
  },
};

/**
 * Speaking rate presets tuned for bedtime storytelling — deliberately slower
 * than conversational speech to promote calm and sleepiness.
 */
const PACE_RATES: Record<VoicePace, number> = {
  slow: 0.72,
  gentle: 0.85,
  clear: 0.95,
};

/**
 * Character voice pitch offsets (in semitones) for SSML prosody.
 * Narrator is neutral; characters get distinct, expressive pitches.
 */
const ROLE_PITCH_ST: Record<VoiceRole, string> = {
  narrator: '+0st',
  soft: '-1st',
  rabbit: '+3st',
  tiger: '-4st',
};

/**
 * Wraps plain text in SSML markup optimized for warm bedtime narration.
 * - Applies gentle prosody (slow rate, soft pitch)
 * - Inserts <break> tags between sentences for natural breathing pauses
 * - Wraps dialogue in character-specific prosody
 */
function wrapInSsml(
  text: string,
  role: VoiceRole,
  pace: VoicePace,
  gender: VoiceGender,
): string {
  const rate = PACE_RATES[pace] || 0.85;
  const pitchSt = ROLE_PITCH_ST[role] || '+0st';

  // Split by sentence terminators to insert breathing pauses
  const sentences = text
    .split(/([.!?।॥]+[\s]*)/)
    .filter(Boolean);

  let ssmlBody = '';
  for (let i = 0; i < sentences.length; i++) {
    const chunk = sentences[i].trim();
    if (!chunk) continue;

    // Sentence terminators (pure punctuation) — skip but don't add breaks
    if (/^[.!?।॥]+$/.test(chunk)) continue;

    ssmlBody += chunk;

    // Add natural breathing pause between sentences (not after the last one)
    if (i < sentences.length - 1) {
      const pauseMs = pace === 'slow' ? 900 : pace === 'gentle' ? 700 : 500;
      ssmlBody += ` <break time="${pauseMs}ms"/> `;
    }
  }

  // Wrap in prosody for bedtime warmth
  const ratePercent = `${Math.round(rate * 100)}%`;

  return `<speak>
  <prosody rate="${ratePercent}" pitch="${pitchSt}" volume="soft">
    ${ssmlBody}
  </prosody>
</speak>`;
}

/**
 * Deterministic hash function for cache keys
 */
export function getCacheKey(
  text: string,
  language: Language,
  gender: VoiceGender,
  pace: VoicePace,
  role: VoiceRole = 'narrator'
): string {
  // Include 'v2' in hash to bust cache from old Standard voices
  const combined = `v2_${text}_${language}_${gender}_${pace}_${role}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  // Return fixed-length 32-character hex key
  return `${hex}${hex}${hex}${hex}`.slice(0, 32);
}

export async function ensureCacheDirectory(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  } catch {
    // ignore directory creation error
  }
}

/**
 * Synthesizes speech using Google Cloud TTS API with SSML and caches the MP3 locally.
 * Uses Neural2/WaveNet voices for dramatically more natural, warm bedtime narration.
 * Returns local file URI if successful, or null to trigger graceful fallback to Layer 1.
 */
export async function getSynthesizedAudioUri(
  text: string,
  options: CloudTtsOptions
): Promise<string | null> {
  if (!text || !text.trim()) return null;

  const apiKey = (options.apiKey || process.env.EXPO_PUBLIC_GOOGLE_TTS_API_KEY || '').trim();
  if (!apiKey) {
    return null;
  }

  const role = options.role || 'narrator';
  const cacheKey = getCacheKey(text, options.language, options.gender, options.pace, role);
  const localFilePath = `${CACHE_DIR}${cacheKey}.mp3`;

  try {
    await ensureCacheDirectory();

    // 1. Check Local File Cache
    const fileInfo = await FileSystem.getInfoAsync(localFilePath);
    if (fileInfo.exists && fileInfo.size && fileInfo.size > 0) {
      return localFilePath;
    }

    // 2. Map Voice Configuration — Neural2 for English, Standard for Nepali
    const isNepali = options.language === 'ne';
    const langKey = isNepali ? 'ne' : 'en';
    const voiceName = VOICE_MAP[langKey]?.[options.gender]
      || (isNepali ? 'ne-NP-Standard-A' : 'en-IN-Neural2-A');

    // 3. Generate SSML for warm bedtime narration
    const ssmlText = wrapInSsml(text, role, options.pace, options.gender);

    // 4. Synthesize via Google Cloud TTS with 8s timeout (longer for Neural2 quality)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${GOOGLE_TTS_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { ssml: ssmlText },
        voice: {
          languageCode: isNepali ? 'ne-NP' : 'en-IN',
          name: voiceName,
          ssmlGender: options.gender === 'female' ? 'FEMALE' : 'MALE',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          // Speaking rate and pitch are controlled by SSML prosody tags
          // These API-level params serve as global defaults
          speakingRate: 1.0,
          pitch: 0.0,
          // Effects profile for warm audio (headphone-optimized)
          effectsProfileId: ['headphone-class-device'],
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (!data || !data.audioContent) {
      return null;
    }

    // 5. Save Base64 to Local File
    await FileSystem.writeAsStringAsync(localFilePath, data.audioContent, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return localFilePath;
  } catch {
    return null;
  }
}

/**
 * Pre-fetches Cloud TTS audio files for upcoming story beats in the background.
 */
export async function prefetchUpcomingBeats(
  beats: Beat[],
  startIndex: number,
  options: CloudTtsOptions,
  count: number = 3
): Promise<void> {
  const targetBeats = beats.slice(startIndex, startIndex + count);
  for (const beat of targetBeats) {
    const text = beat.text[options.language];
    if (text) {
      getSynthesizedAudioUri(text, {
        ...options,
        role: beat.voice || options.role,
      }).catch(() => undefined);
    }
  }
}

/**
 * Plays a cached Cloud TTS MP3 audio file using expo-audio.
 */
export async function playCloudAudio(
  fileUri: string,
  onDone?: () => void
): Promise<AudioPlayer | null> {
  try {
    stopCloudAudio();
    const { createAudioPlayer, setAudioModeAsync } = await import('expo-audio');
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    });

    const player = createAudioPlayer({ uri: fileUri });
    player.volume = 1.0;
    player.play();
    currentCloudAudioPlayer = player;

    currentCloudAudioSub = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        if (currentCloudAudioSub) {
          currentCloudAudioSub.remove();
          currentCloudAudioSub = null;
        }
        stopCloudAudio();
        onDone?.();
      }
    });

    return player;
  } catch {
    onDone?.();
    return null;
  }
}

/**
 * Stops any currently playing cloud audio.
 */
export function stopCloudAudio(): void {
  if (currentCloudAudioSub) {
    try {
      currentCloudAudioSub.remove();
    } catch {
      // ignore
    }
    currentCloudAudioSub = null;
  }
  if (currentCloudAudioPlayer) {
    try {
      currentCloudAudioPlayer.pause();
      currentCloudAudioPlayer.remove();
    } catch {
      // ignore
    }
    currentCloudAudioPlayer = null;
  }
}
