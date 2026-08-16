import { lines } from '@/data/stories/_lines';

export const bridgeLightBeats = lines('river', 'river', [
  {
    id: 'title',
    rabbit: 'idle',
    sfx: 'chime',
    en: 'Two villages shared a wooden bridge. In the last light it looked like a held-out hand.',
    ne: 'दुई गाउँले एउटा काठको पुल बाँडेका थिए। अन्तिम उज्यालोमा त्यो पुल थापिएको हातजस्तो देखिन्थ्यो।',
  },
  {
    id: 'fight',
    rabbit: 'idle',
    sfx: 'ripple',
    en: 'After a quarrel, each side said the river was theirs. Children were told not to cross.',
    ne: 'झगडापछि दुवैतिर भने, नदी हाम्रै हो। नानीहरुलाई नपार भनियो।',
  },
  {
    id: 'kite',
    rabbit: 'walk',
    en: 'A kite from the west bank tangled on the east rail. Two children met in the middle to free it.',
    ne: 'पश्चिमको चङ्गा पूर्वको बारमा अड्कियो। दुई नानी बीचमा भेटिए, छुटाउन।',
  },
  {
    id: 'talk',
    rabbit: 'bow',
    voice: 'soft',
    en: 'They talked about mangoes, and a dog with one white ear. The river kept going, uninterested in borders.',
    ne: 'उनीहरुले आपँप र एउटा कुकुरको कुरा गरे, जसको एउटा कान सेतो थियो। नदी बगिरह्यो, सीमानामा चासो नराखी।',
  },
  {
    id: 'close',
    scene: 'peace',
    rabbit: 'sit',
    sfx: 'chime',
    en: 'The grown-ups found them laughing. The bridge remembered its job. Hands can do that too.',
    ne: 'ठूलाहरुले हाँसिरहेका भेटे। पुलले आफ्नो काम सम्झ्यो। हातले पनि सक्छ।',
  },
]);
