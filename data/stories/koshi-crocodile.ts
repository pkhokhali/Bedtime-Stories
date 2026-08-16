import { Beat } from '@/types/story';

export const koshiBeats: Beat[] = [
  {
    id: 'title',
    scene: 'river',
    rabbit: 'hidden',
    tiger: 'hidden',
    music: 'river',
    sfx: 'ripple',
    voice: 'soft',
    text: {
      en: 'Listen - can you hear water? This is a Koshi story. A river, a bird, and a crocodile who kept his word.',
      ne: 'सुन - पानीको आवाज आउँछ? यो कोशीको कथा हो। एउटा नदी, एउटा चरा, र बचन पाल्ने गोही।',
    },
  },
  {
    id: 'hot',
    scene: 'river',
    rabbit: 'hidden',
    tiger: 'hidden',
    music: 'river',
    text: {
      en: 'One hot afternoon, a tired bird could not fly any farther. The river looked cool... and a little frightening.',
      ne: 'एउटा गर्मी दिउँसो, थकित चराले अझ उड्न सकेन। नदी चिसो देखिन्थ्यो... र अलिकति डरलाग्दो पनि।',
    },
  },
  {
    id: 'ask',
    scene: 'river',
    rabbit: 'hidden',
    tiger: 'idle',
    music: 'river',
    voice: 'soft',
    text: {
      en: 'A crocodile lifted his nose. I can carry you, he said. But I am not a ferry for free. Promise you will come back and sing to me at dusk.',
      ne: 'गोहीले नाक उठायो। म तिमीलाई लैजान सक्छु, उसले भन्यो। तर सित्तैमा होइन। बचन दे - साँझमा फर्केर मलाई गीत गाउनेछस्।',
    },
  },
  {
    id: 'cross',
    scene: 'river',
    rabbit: 'hidden',
    tiger: 'walk',
    music: 'river',
    sfx: 'ripple',
    text: {
      en: 'The bird was afraid. Still, she climbed onto his wide, warm back. Slowly, slowly, they crossed the brown water.',
      ne: 'चरा डराएकी थिई। तैपनि ऊ गोहीको फराकिलो, न्यानो पिठ्यूँमा चढी। बिस्तारै, बिस्तारै, खैरो पानी पार भयो।',
    },
  },
  {
    id: 'keep',
    scene: 'river',
    rabbit: 'hidden',
    tiger: 'idle',
    music: 'river',
    text: {
      en: 'On the far bank the bird could have flown away and never returned. Many would have. She did not.',
      ne: 'पल्लो किरानमा चराले उडेर नफर्कन पनि सक्थी। धेरैले त्यही गर्थे। उसले गरेन।',
    },
  },
  {
    id: 'song',
    scene: 'peace',
    rabbit: 'sit',
    tiger: 'sit',
    music: 'river',
    sfx: 'chime',
    voice: 'soft',
    text: {
      en: 'At dusk she came back, and sang a small river song. The crocodile closed his eyes. A promise, he murmured, is also a kind of courage.',
      ne: 'साँझमा ऊ फर्की, र एउटा सानो नदीको गीत गाइ। गोहीले आँखा चिम्ल्यो। बचन, उसले फुसफुसायो, पनि एउटा साहस हो।',
    },
  },
  {
    id: 'close',
    scene: 'peace',
    rabbit: 'sit',
    tiger: 'sit',
    music: 'river',
    voice: 'soft',
    text: {
      en: 'If someone is waiting for you, little one, even a small return is a brave thing. The river knows. Sweet dreams.',
      ne: 'यदि कोही तिमीलाई पर्खिरहेको छ भने, नानी, सानो फर्काइ पनि साहस हो। नदीलाई थाहा छ। शुभ रात्रि।',
    },
  },
];
