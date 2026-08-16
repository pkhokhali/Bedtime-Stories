import { Beat, Pose, SceneId, SoundId, VoiceRole } from '@/types/story';

type Line = {
  id: string;
  en: string;
  ne: string;
  scene?: SceneId;
  rabbit?: Pose;
  tiger?: Pose;
  music?: SoundId;
  sfx?: SoundId;
  voice?: VoiceRole;
};

export function lines(scene: SceneId, music: SoundId, items: Line[]): Beat[] {
  return items.map((item) => ({
    id: item.id,
    scene: item.scene ?? scene,
    rabbit: item.rabbit ?? 'hidden',
    tiger: item.tiger ?? 'hidden',
    music: item.music ?? music,
    sfx: item.sfx,
    voice: item.voice,
    text: { en: item.en, ne: item.ne },
  }));
}
