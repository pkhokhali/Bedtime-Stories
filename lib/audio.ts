import { loopingBeds, soundFiles } from '@/lib/sounds';
import { SoundId } from '@/types/story';

type AudioPlayer = import('expo-audio').AudioPlayer;

let bed: AudioPlayer | null = null;
let bedId: SoundId | null = null;
let ready = false;

function release(player: AudioPlayer | null) {
  if (!player) return;
  try {
    player.pause();
    player.remove();
  } catch {
    // already gone
  }
}

async function ensureMode() {
  if (ready) return;
  try {
    const { setAudioModeAsync } = await import('expo-audio');
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    });
    ready = true;
  } catch {
    ready = false;
  }
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
      return;
    }
    await stopBed();
    const player = createAudioPlayer(soundFiles[id]);
    player.loop = loopingBeds.includes(id);
    player.volume = 0.22;
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
  release(bed);
  bed = null;
  bedId = null;
}

export async function stopAllAudio() {
  await stopBed();
}
