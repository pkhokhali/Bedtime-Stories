import { SoundId } from '@/types/story';

export const soundFiles: Record<SoundId, number> = {
  night: require('../assets/audio/night.wav'),
  moon: require('../assets/audio/moon.wav'),
  river: require('../assets/audio/river.wav'),
  courtyard: require('../assets/audio/courtyard.wav'),
  roar: require('../assets/audio/roar.wav'),
  splash: require('../assets/audio/splash.wav'),
  ripple: require('../assets/audio/ripple.wav'),
  chime: require('../assets/audio/chime.wav'),
  wind: require('../assets/audio/wind.wav'),
};

export const loopingBeds: SoundId[] = ['night', 'moon', 'river', 'courtyard', 'wind'];
