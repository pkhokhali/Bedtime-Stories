import { loopingBeds, soundFiles, SoundscapeId } from '@/lib/sounds';
import { SceneId, SoundId, StageKind } from '@/types/story';

type AudioPlayer = import('expo-audio').AudioPlayer;

let bed: AudioPlayer | null = null;
let bedId: SoundId | null = null;
let currentBedVolume = 0.22;
let fadeIntervalId: ReturnType<typeof setInterval> | null = null;

let soundscapePlayer: AudioPlayer | null = null;
let soundscapeId: SoundscapeId | null = null;
let soundscapeVolume = 0.5;
let soundscapeFadeIntervalId: ReturnType<typeof setInterval> | null = null;

let ready = false;

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

export const STAGE_BED_MAP: Record<StageKind, SoundId> = {
  forest: 'night',
  moon: 'moon',
  river: 'river',
  courtyard: 'courtyard',
  hills: 'wind',
  lamp: 'courtyard',
  stars: 'night',
};

export function resolveAmbientBed(music?: SoundId, scene?: SceneId, stage?: StageKind): SoundId {
  if (music) return music;
  if (scene && SCENE_BED_MAP[scene]) return SCENE_BED_MAP[scene];
  if (stage && STAGE_BED_MAP[stage]) return STAGE_BED_MAP[stage];
  return 'night';
}

function release(player: AudioPlayer | null) {
  if (!player) return;
  try {
    player.pause();
    player.remove();
  } catch {
    // already gone
  }
}

export async function ensureMode() {
  if (ready) return;
  try {
    const { setAudioModeAsync } = await import('expo-audio');
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'mixWithOthers',
    });
    ready = true;
  } catch {
    ready = false;
  }
}

export function fadeBedVolume(targetVolume: number, durationMs: number = 800): Promise<void> {
  return new Promise((resolve) => {
    if (fadeIntervalId) {
      clearInterval(fadeIntervalId);
      fadeIntervalId = null;
    }

    if (!bed) {
      currentBedVolume = targetVolume;
      resolve();
      return;
    }

    const startVolume = currentBedVolume;
    const steps = Math.max(1, Math.floor(durationMs / 50));
    const stepDelta = (targetVolume - startVolume) / steps;
    let currentStep = 0;

    fadeIntervalId = setInterval(() => {
      currentStep++;
      if (currentStep >= steps || !bed) {
        if (fadeIntervalId) {
          clearInterval(fadeIntervalId);
          fadeIntervalId = null;
        }
        currentBedVolume = targetVolume;
        if (bed) {
          try {
            bed.volume = Math.max(0, Math.min(1, targetVolume));
          } catch {
            // ignore
          }
        }
        resolve();
      } else {
        const nextVol = Math.max(0, Math.min(1, startVolume + stepDelta * currentStep));
        currentBedVolume = nextVol;
        if (bed) {
          try {
            bed.volume = nextVol;
          } catch {
            // ignore
          }
        }
      }
    }, 50);
  });
}

export async function windDownFinalBeat() {
  await fadeBedVolume(0.0, 3500);
  await stopBed();
}

export async function playBed(id?: SoundId) {
  try {
    await ensureMode();
    const { createAudioPlayer } = await import('expo-audio');
    if (!id) {
      await stopBed();
      return;
    }
    if (bedId === id && bed) {
      if (bed.paused) bed.play();
      if (currentBedVolume < 0.22) {
        fadeBedVolume(0.22, 600).catch(() => undefined);
      }
      return;
    }
    await stopBed();
    const player = createAudioPlayer(soundFiles[id]);
    player.loop = loopingBeds.includes(id);
    player.volume = 0.22;
    currentBedVolume = 0.22;
    player.play();
    bed = player;
    bedId = id;
  } catch {
    // story continues without bed
  }
}

export async function playSfx(id?: SoundId) {
  if (!id) return;
  try {
    await ensureMode();
    const { createAudioPlayer } = await import('expo-audio');
    const player = createAudioPlayer(soundFiles[id]);
    player.volume = 0.42;
    player.play();
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (!status.didJustFinish) return;
      sub.remove();
      release(player);
    });
  } catch {
    // ignore
  }
}

export async function playChime() {
  await playSfx('chime');
}

export async function stopBed() {
  if (fadeIntervalId) {
    clearInterval(fadeIntervalId);
    fadeIntervalId = null;
  }
  release(bed);
  bed = null;
  bedId = null;
  currentBedVolume = 0.22;
}

// Continuous Soundscapes Engine (Standalone Ambient White Noise)
export async function playContinuousSoundscape(id: SoundscapeId, volume: number = 0.5) {
  try {
    await ensureMode();
    const { createAudioPlayer } = await import('expo-audio');
    const clampedVol = Math.max(0, Math.min(1, volume));

    if (soundscapeId === id && soundscapePlayer) {
      if (soundscapePlayer.paused) soundscapePlayer.play();
      soundscapePlayer.volume = clampedVol;
      soundscapeVolume = clampedVol;
      return;
    }

    await stopContinuousSoundscape();
    const player = createAudioPlayer(soundFiles[id]);
    player.loop = true;
    player.volume = clampedVol;
    soundscapeVolume = clampedVol;
    player.play();
    soundscapePlayer = player;
    soundscapeId = id;
  } catch {
    // Soundscape fails gracefully
  }
}

export async function stopContinuousSoundscape() {
  if (soundscapeFadeIntervalId) {
    clearInterval(soundscapeFadeIntervalId);
    soundscapeFadeIntervalId = null;
  }
  release(soundscapePlayer);
  soundscapePlayer = null;
  soundscapeId = null;
}

export function setContinuousSoundscapeVolume(volume: number) {
  const clamped = Math.max(0, Math.min(1, volume));
  soundscapeVolume = clamped;
  if (soundscapePlayer) {
    try {
      soundscapePlayer.volume = clamped;
    } catch {
      // ignore
    }
  }
}

export function getActiveSoundscape(): SoundscapeId | null {
  return soundscapeId;
}

export function isSoundscapePlaying(): boolean {
  return !!(soundscapePlayer && !soundscapePlayer.paused);
}

// 10-Second Volume Fade down to 0 for Bedtime Sleep Timer
export function fadeAudioToSleep(durationMs: number = 10000): Promise<void> {
  return new Promise((resolve) => {
    const steps = Math.max(1, Math.floor(durationMs / 100));
    let currentStep = 0;
    const initialBedVol = currentBedVolume;
    const initialScapeVol = soundscapeVolume;

    const interval = setInterval(() => {
      currentStep++;
      const factor = Math.max(0, 1 - currentStep / steps);
      if (bed) {
        try {
          bed.volume = Math.max(0, initialBedVol * factor);
        } catch {}
      }
      if (soundscapePlayer) {
        try {
          soundscapePlayer.volume = Math.max(0, initialScapeVol * factor);
        } catch {}
      }
      if (currentStep >= steps) {
        clearInterval(interval);
        stopAllAudio().then(resolve).catch(resolve);
      }
    }, 100);
  });
}

export async function stopAllAudio() {
  await stopBed();
  await stopContinuousSoundscape();
  try {
    const { stopSpeech } = await import('@/lib/speech');
    stopSpeech();
  } catch {
    // ignore
  }
}
