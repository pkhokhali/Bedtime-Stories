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
  rain: require('../assets/audio/rain.wav'),
};

export const loopingBeds: SoundId[] = ['night', 'moon', 'river', 'courtyard', 'wind', 'rain'];

export type SoundscapeId = 'rain' | 'river' | 'night' | 'wind' | 'chime';

export interface SoundscapeItem {
  id: SoundscapeId;
  title: { en: string; ne: string };
  subtitle: { en: string; ne: string };
  icon: string;
}

export const SOUNDSCAPES: SoundscapeItem[] = [
  {
    id: 'rain',
    title: { en: 'Soothing Rain', ne: 'झरीको वर्षा' },
    subtitle: { en: 'Gentle droplet texture', ne: 'शान्त पानीका थोपा' },
    icon: 'rainy-outline',
  },
  {
    id: 'river',
    title: { en: 'Mountain Stream', ne: 'पहाडी खोला' },
    subtitle: { en: 'Flowing crystal waters', ne: 'कलकल बग्ने पानी' },
    icon: 'water-outline',
  },
  {
    id: 'night',
    title: { en: 'Night Crickets', ne: 'रातको झ्याउँकिरी' },
    subtitle: { en: 'Nocturnal wilderness', ne: 'रात्रिकालीन शान्ति' },
    icon: 'moon-outline',
  },
  {
    id: 'wind',
    title: { en: 'Himalayan Breeze', ne: 'हिमाली हावा' },
    subtitle: { en: 'Gentle alpine whispers', ne: 'शीतल हिमाली बतास' },
    icon: 'leaf-outline',
  },
  {
    id: 'chime',
    title: { en: 'Temple Chime', ne: 'मन्दिरको घण्टी' },
    subtitle: { en: 'Resonant calming tones', ne: 'ध्यानमग्न धुन' },
    icon: 'notifications-outline',
  },
];

