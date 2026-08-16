import { lines } from '@/data/stories/_lines';

export const drumHillsBeats = lines('hills', 'wind', [
  {
    id: 'title',
    rabbit: 'idle',
    sfx: 'chime',
    en: 'In a village under green hills, there was a drum older than the school roof.',
    ne: 'हरिया पाखा मुनि एउटा गाउँमा, स्कूलको छानाभन्दा पुरानो एउटा मादल थियो।',
  },
  {
    id: 'dry',
    rabbit: 'bow',
    sfx: 'wind',
    en: 'One year the rain forgot the path. The maize stood thirsty. People spoke too loudly.',
    ne: 'एउटा वर्ष पानीले बाटो बिर्सियो। मकै तिर्खायो। मानिसहरु चर्को बोले।',
  },
  {
    id: 'play',
    rabbit: 'idle',
    en: 'A small boy sat with the drum. He did not bang. He asked. Dum. Dum. Like a heartbeat.',
    ne: 'एउटा सानो केटो मादलसँग बस्यो। उसले पिटेन। उसले सोध्यो। डुम। डुम। मुटुको ढुकढुकीजस्तै।',
  },
  {
    id: 'cloud',
    scene: 'moon',
    rabbit: 'sit',
    voice: 'soft',
    en: 'A cloud heard the polite drum. Clouds like manners. It came down the hill, trailing silver.',
    ne: 'बादलले विनयी मादल सुन्यो। बादललाई शिष्टता मन पर्छ। त्यो पाखाबाट ओर्लियो, चाँदीको लर्को बोकेर।',
  },
  {
    id: 'rain',
    scene: 'hills',
    rabbit: 'sit',
    sfx: 'ripple',
    en: 'The rain arrived like a guest who takes off their shoes. Soft. Enough. Then it sat with them.',
    ne: 'पानी पाहुनाजस्तै आयो, जसले जुत्ता खोल्छ। नरम। काफी। अनि उनीहरुसँग बस्यो।',
  },
  {
    id: 'close',
    scene: 'peace',
    rabbit: 'sit',
    sfx: 'chime',
    voice: 'soft',
    en: 'If the night feels dry, knock gently on the dark. The sky still knows that drum.',
    ne: 'रात सुख्खा लाग्यो भने अँध्यारोमा बिस्तारै ठटाऊ। आकाशले अझै त्यो मादल चिन्छ।',
  },
]);
