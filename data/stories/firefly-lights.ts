import { Beat } from '@/types/story';

export const fireflyBeats: Beat[] = [
  {
    id: 'title',
    scene: 'establishing',
    rabbit: 'hidden',
    tiger: 'hidden',
    music: 'night',
    sfx: 'chime',
    voice: 'soft',
    text: {
      en: 'Shh. Do you see those tiny gold lights? Tonight we learn how the fireflies got their glow.',
      ne: 'शशश। ती साना सुनौला बत्ती देखिन्छन्? आज राति थाहा पाउँछौं - जुनकिरीले उज्यालो कसरी पायो।',
    },
  },
  {
    id: 'dark',
    scene: 'establishing',
    rabbit: 'hidden',
    tiger: 'hidden',
    music: 'night',
    text: {
      en: 'In the Terai grass, the nights were very dark. The little bugs could sing, but they could not find each other.',
      ne: 'तराईको घाँसमा रातहरु साह्रै अँध्यारा थिए। साना किराहरु गाउन सक्थे, तर एकअर्कालाई भेट्टाउन सक्दैनथे।',
    },
  },
  {
    id: 'ask',
    scene: 'meeting',
    rabbit: 'hidden',
    tiger: 'hidden',
    music: 'night',
    voice: 'soft',
    text: {
      en: 'They asked the moon, Please, a little light. Just enough to say, I am here. I am safe.',
      ne: 'उनीहरुले चन्द्रमासँग मागे, कृपया, थोरै उज्यालो। यति मात्र कि भनियोस्, म यहाँ छु। म सुरक्षित छु।',
    },
  },
  {
    id: 'gift',
    scene: 'moon',
    rabbit: 'hidden',
    tiger: 'hidden',
    music: 'moon',
    sfx: 'chime',
    text: {
      en: 'The moon broke off tiny crumbs of silver, and tucked one into each small back. Not a fire. A whisper of light.',
      ne: 'चन्द्रमाले चाँदीका साना टुक्रा भाँचेर, हरेक सानो पिठ्यूँमा राख्यो। आगो होइन। उज्यालोको फुसफुसाहट।',
    },
  },
  {
    id: 'dance',
    scene: 'peace',
    rabbit: 'sit',
    tiger: 'hidden',
    music: 'night',
    text: {
      en: 'Now, when the grass is quiet, they blink - I am here. I am here. Like little stars that came down to visit.',
      ne: 'अब घाँस शान्त हुँदा, उनीहरु झिमिक्क गर्छन् - म यहाँ छु। म यहाँ छु। तल आएर भेट्न आएका साना ताराजस्तै।',
    },
  },
  {
    id: 'close',
    scene: 'peace',
    rabbit: 'sit',
    tiger: 'hidden',
    music: 'night',
    voice: 'soft',
    text: {
      en: 'If the room feels dark, remember the fireflies. A little light is enough. Close your eyes. Sweet dreams.',
      ne: 'कोठा अँध्यारो लागे पनि, जुनकिरी सम्झनु। थोरै उज्यालो काफी हुन्छ। आँखा चिम्लनु। शुभ रात्रि।',
    },
  },
];
