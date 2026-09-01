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
 * Deterministic hash function for cache keys
 */
export function getCacheKey(
  text: string,
  language: Language,
  gender: VoiceGender,
  pace: VoicePace,
  role: VoiceRole = 'narrator'
): string {
  const combined = `${text}_${language}_${gender}_${pace}_${role}`;
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
 * Synthesizes speech using Google Cloud TTS API and caches the MP3 locally.
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

    // 2. Map Voice Configuration
    const isNepali = options.language === 'ne';
    const voiceName = isNepali
      ? options.gender === 'female'
        ? 'ne-NP-Standard-A'
        : 'ne-NP-Standard-B'
      : options.gender === 'female'
        ? 'en-IN-Neural2-A'
        : 'en-IN-Neural2-B';

    const speakingRate =
      options.pace === 'slow' ? 0.78 : options.pace === 'gentle' ? 0.88 : 0.98;

    let pitch = 0.0;
    if (role === 'rabbit') pitch = 2.5;
    else if (role === 'tiger') pitch = -2.5;
    else if (role === 'soft') pitch = -0.5;

    // 3. Synthesize via Google Cloud TTS with 4s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${GOOGLE_TTS_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: isNepali ? 'ne-NP' : 'en-IN',
          name: voiceName,
          ssmlGender: options.gender === 'female' ? 'FEMALE' : 'MALE',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate,
          pitch,
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

    // 4. Save Base64 to Local File
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
