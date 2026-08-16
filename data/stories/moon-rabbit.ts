import { Beat } from '@/types/story';

export const moonRabbitBeats: Beat[] = [
  {
    id: 'title',
    scene: 'moon',
    rabbit: 'sit',
    tiger: 'hidden',
    music: 'moon',
    sfx: 'chime',
    voice: 'soft',
    text: {
      en: 'Look out the window, little one. See the moon? Tonight I will tell you why a rabbit lives there.',
      ne: 'झ्यालबाट हेर नानी। चन्द्रमा देखिन्छ? आज राति भन्छु - त्यहाँ खरायो किन बस्छ।',
    },
  },
  {
    id: 'cold',
    scene: 'moon',
    rabbit: 'idle',
    tiger: 'hidden',
    music: 'moon',
    text: {
      en: 'Once, on a cold hillside, a little rabbit had nothing to give. No gold. No rice. Only a warm heart.',
      ne: 'एकचोटि, चिसो पाखामा, एउटा सानो खरायोसँग दिने केही थिएन। सुन थिएन। चामल थिएन। एउटा न्यानो मन मात्र थियो।',
    },
  },
  {
    id: 'stranger',
    scene: 'moon',
    rabbit: 'bow',
    tiger: 'hidden',
    music: 'moon',
    voice: 'soft',
    text: {
      en: 'An old traveler came, hungry and tired. Rabbit said, Wait. Sit. I will find you something.',
      ne: 'एउटा बुढो यात्री आयो, भोको र थकित। खरायोले भन्यो, पर्खनुहोस्। बस्नुहोस्। म केही खोज्छु।',
    },
  },
  {
    id: 'give',
    scene: 'moon',
    rabbit: 'idle',
    tiger: 'hidden',
    music: 'moon',
    text: {
      en: 'Rabbit looked and looked. The grass was thin. The night was long. Still, Rabbit did not turn the traveler away.',
      ne: 'खरायोले खोज्यो र खोज्यो। घाँस पातलो थियो। रात लामो थियो। तैपनि खरायोले यात्रीलाई फर्काएन।',
    },
  },
  {
    id: 'kind',
    scene: 'moon',
    rabbit: 'sit',
    tiger: 'hidden',
    music: 'moon',
    sfx: 'chime',
    voice: 'soft',
    text: {
      en: 'The traveler smiled. He was no ordinary guest. He was the moon, walking in disguise, looking for kindness.',
      ne: 'यात्री मुस्कुरायो। ऊ साधारण पाहुना थिएन। ऊ चन्द्रमा थियो, भेषमा हिँडेको, दया खोज्दै।',
    },
  },
  {
    id: 'lift',
    scene: 'moon',
    rabbit: 'sit',
    tiger: 'hidden',
    music: 'moon',
    text: {
      en: 'For that warm heart, the moon lifted Rabbit up, up, into the silver sky, so no one would forget.',
      ne: 'त्यही न्यानो मनका लागि, चन्द्रमाले खरायोलाई माथि, माथि, चाँदीको आकाशमा लग्यो, ताकि कसैले नबिर्सियोस्।',
    },
  },
  {
    id: 'close',
    scene: 'peace',
    rabbit: 'sit',
    tiger: 'hidden',
    music: 'moon',
    voice: 'soft',
    text: {
      en: 'That is why, when grandmothers point at the moon, they say - see? The rabbit is still there. Kindness stays. Sweet dreams.',
      ne: 'त्यसैले हजुरआमाले चन्द्रमातिर औंल्याएर भन्नुहुन्छ - देखिस्? खरायो अझै त्यहीँ छ। दया रहन्छ। शुभ रात्रि।',
    },
  },
];
