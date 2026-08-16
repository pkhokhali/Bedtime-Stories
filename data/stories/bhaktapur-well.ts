import { Beat } from '@/types/story';

export const bhaktapurBeats: Beat[] = [
  {
    id: 'title',
    scene: 'courtyard',
    rabbit: 'hidden',
    tiger: 'hidden',
    music: 'courtyard',
    sfx: 'chime',
    voice: 'soft',
    text: {
      en: 'This one is older than the bricks. A Bhaktapur story. A courtyard. A well. And a kindness the water never forgot.',
      ne: 'यो कथा इँटाभन्दा पुरानो हो। भक्तपुरको कथा। एउटा चोक। एउटा इनार। र पानीले नबिर्सेको दया।',
    },
  },
  {
    id: 'girl',
    scene: 'courtyard',
    rabbit: 'idle',
    tiger: 'hidden',
    music: 'courtyard',
    text: {
      en: 'A girl named Maya filled her brass pot every evening. She always left one cup for whoever came late - a potter, a grandmother, a thirsty dog.',
      ne: 'माया नामकी केटीले हरेक साँझ पित्तलको गाग्री भर्थी। ऊ सधैं एक कचौरा राख्थी - ढिलो आउने कुमाले, हजुरआमा, वा तिर्खाएको कुकुरका लागि।',
    },
  },
  {
    id: 'dry',
    scene: 'well',
    rabbit: 'bow',
    tiger: 'hidden',
    music: 'courtyard',
    sfx: 'wind',
    text: {
      en: 'One summer the well grew shy. The water sank. People argued. Maya still left her cup, even when it was only a sip.',
      ne: 'एउटा गर्मीमा इनार लजालु भयो। पानी होचियो। मानिसहरु झगडा गरे। मायाले अझै कचौरा राख्थी, एक चुस्की मात्र भए पनि।',
    },
  },
  {
    id: 'night',
    scene: 'well',
    rabbit: 'sit',
    tiger: 'hidden',
    music: 'courtyard',
    sfx: 'ripple',
    voice: 'soft',
    text: {
      en: 'That night the well whispered. Because you shared the last sip, I will remember how to be full. Come at dawn.',
      ne: 'त्यो रात इनारले फुसफुसायो। किनभने तिमीले अन्तिम चुस्की बाड्यौ, म भरिने तरिका सम्झनेछु। बिहान आउ।',
    },
  },
  {
    id: 'dawn',
    scene: 'courtyard',
    rabbit: 'idle',
    tiger: 'hidden',
    music: 'courtyard',
    sfx: 'ripple',
    text: {
      en: 'At first light the water had risen, cool and clear. Maya filled every pot - and still left one cup on the stone.',
      ne: 'पहिलो उज्यालोसँगै पानी उठेको थियो, चिसो र सफा। मायाले हरेक गाग्री भर्‍यो - र ढुङ्गामा फेरि एक कचौरा राख्यो।',
    },
  },
  {
    id: 'close',
    scene: 'peace',
    rabbit: 'sit',
    tiger: 'hidden',
    music: 'courtyard',
    voice: 'soft',
    text: {
      en: 'Home keeps its own magic, little one. A well remembers a kind hand. So do we. Sweet dreams.',
      ne: 'घरमा आफ्नै जादू हुन्छ, नानी। इनारले दयालु हात सम्झन्छ। हामीले पनि। शुभ रात्रि।',
    },
  },
];
