import { bhaktapurBeats } from '@/data/stories/bhaktapur-well';
import { bridgeLightBeats } from '@/data/stories/bridge-light';
import { cleverRabbitBeats } from '@/data/stories/clever-rabbit';
import { doveNetBeats } from '@/data/stories/dove-net';
import { drumHillsBeats } from '@/data/stories/drum-hills';
import { fireflyBeats } from '@/data/stories/firefly-lights';
import { happyPrinceBeats } from '@/data/stories/happy-prince';
import { koshiBeats } from '@/data/stories/koshi-crocodile';
import { lastLampThamelBeats } from '@/data/stories/last-lamp-thamel';
import { lettersRiverBeats } from '@/data/stories/letters-river';
import { moonRabbitBeats } from '@/data/stories/moon-rabbit';
import { mountainSchoolBeats } from '@/data/stories/mountain-school';
import { nightBusBeats } from '@/data/stories/night-bus';
import { northWindBeats } from '@/data/stories/north-wind';
import { oldManKoshiBeats } from '@/data/stories/old-man-koshi';
import { selfishGiantBeats } from '@/data/stories/selfish-giant';
import { sleepyYakBeats } from '@/data/stories/sleepy-yak';
import { starBlanketBeats } from '@/data/stories/star-blanket';
import { teaShopLampBeats } from '@/data/stories/tea-shop-lamp';
import { yetiQuietBeats } from '@/data/stories/yeti-quiet';
import { AgeBand, Story } from '@/types/story';

export const ageBands: {
  id: AgeBand;
  ages: { en: string; ne: string };
  label: { en: string; ne: string };
  hint: { en: string; ne: string };
  icon: 'moon-outline' | 'moon' | 'sparkles' | 'book-outline' | 'bicycle-outline' | 'cafe-outline' | 'book';
  group: 'children' | 'young' | 'grown';
}[] = [
  {
    id: '2-4',
    ages: { en: '2-4', ne: '२-४' },
    label: { en: 'Little ones', ne: 'सानो' },
    hint: { en: 'Very short, very soft.', ne: 'छोटो र धेरै नरम।' },
    icon: 'moon-outline',
    group: 'children',
  },
  {
    id: '4-6',
    ages: { en: '4-6', ne: '४-६' },
    label: { en: 'Bedtime', ne: 'सुत्ने बेला' },
    hint: { en: 'The usual night story.', ne: 'नित्य रातिको कथा।' },
    icon: 'moon',
    group: 'children',
  },
  {
    id: '6-8',
    ages: { en: '6-8', ne: '६-८' },
    label: { en: 'Wonder', ne: 'अचम्म' },
    hint: { en: 'A little older, a little longer.', ne: 'अलि ठूलो, अलि लामा।' },
    icon: 'sparkles',
    group: 'children',
  },
  {
    id: '9-12',
    ages: { en: '9-12', ne: '९-१२' },
    label: { en: 'Growing', ne: 'बढ्दो' },
    hint: { en: 'Fables and school-dusk tales.', ne: 'दन्त्यकथा र स्कूल साँझ।' },
    icon: 'book-outline',
    group: 'children',
  },
  {
    id: '13-17',
    ages: { en: '13-17', ne: '१३-१७' },
    label: { en: 'Teens', ne: 'किशोर' },
    hint: { en: 'Quiet journeys, almost grown.', ne: 'शान्त यात्रा, लगभग ठूलो।' },
    icon: 'bicycle-outline',
    group: 'young',
  },
  {
    id: '18-25',
    ages: { en: '18-25', ne: '१८-२५' },
    label: { en: 'Young adults', ne: 'युवा' },
    hint: { en: 'Short novels and evening tales.', ne: 'छोटा उपन्यास र साँझका कथा।' },
    icon: 'cafe-outline',
    group: 'young',
  },
  {
    id: '25+',
    ages: { en: '25 and above', ne: '२५ र माथि' },
    label: { en: 'Grown', ne: 'वयस्क' },
    hint: { en: 'Longer evening novels, told slowly.', ne: 'लामा साँझ उपन्यास, बिस्तारै।' },
    icon: 'book',
    group: 'grown',
  },
  {
    id: 'parents',
    ages: { en: 'Parents', ne: 'अभिभावक' },
    label: { en: 'After Hours', ne: 'काम पछि' },
    hint: { en: 'Audiobooks and novels just for you.', ne: 'तपाईंको लागि अडियोबुक र उपन्यास।' },
    icon: 'cafe-outline',
    group: 'grown',
  },
];

export const stories: Story[] = [
  {
    id: 'sleepy-cloud',
    category: 'universal',
    form: 'story',
    ageBand: '4-6',
    runtimeMinutes: 10,
    accent: '#8395A7',
    stage: 'stars',
    title: { en: 'The Sleepy Little Cloud', ne: 'निद्रालु सानो बादल' },
    subtitle: { en: 'A bedtime adventure in the sky.', ne: 'आकाशमा सुत्ने बेलाको साहसिक यात्रा।' },
    theme: { en: 'Rest is important', ne: 'आराम महत्त्वपूर्ण छ' },
    mediaType: 'video',
    mediaAssets: [
      require('@/assets/videos/sleepy_cloud_1.mp4'),
      require('@/assets/videos/sleepy_cloud_2.mp4'),
      require('@/assets/videos/sleepy_cloud_3.mp4'),
      require('@/assets/videos/sleepy_cloud_4.mp4'),
      require('@/assets/videos/sleepy_cloud_5.mp4'),
    ],
  },
  {
    id: 'moon-rabbit',
    category: 'roots',
    form: 'story',
    ageBand: '2-4',
    runtimeMinutes: 4,
    accent: '#F4E6C8',
    stage: 'moon',
    title: { en: 'The Rabbit in the Moon', ne: 'चन्द्रमामा खरायो' },
    subtitle: { en: 'Why grandmothers still point at the moon.', ne: 'हजुरआमाले चन्द्रमातिर औंल्याउनुको कारण।' },
    theme: { en: 'Kindness remembered forever', ne: 'दया सधैं सम्मिइन्छ' },
    beats: moonRabbitBeats,
  },
  {
    id: 'firefly-lights',
    category: 'roots',
    form: 'story',
    ageBand: '2-4',
    runtimeMinutes: 4,
    accent: '#E8A04A',
    stage: 'moon',
    title: { en: 'How the Fireflies Got Their Light', ne: 'जुनकिरीको उज्यालो' },
    subtitle: { en: 'Tiny gold crumbs from the moon.', ne: 'चन्द्रमाबाट आएका साना सुनका टुक्रा।' },
    theme: { en: 'A little light is enough', ne: 'थोरै उज्यालो काफी हुन्छ' },
    beats: fireflyBeats,
  },
  {
    id: 'sleepy-yak',
    category: 'roots',
    form: 'story',
    ageBand: '2-4',
    runtimeMinutes: 4,
    accent: '#C4B59A',
    stage: 'hills',
    title: { en: 'The Sleepy Yak of Mustang', ne: 'मुस्ताङको निद्रा याक' },
    subtitle: { en: 'A mountain that already knows how to rest.', ne: 'आराम गर्न जान्ने हिमाल।' },
    theme: { en: 'Put the day down', ne: 'दिनलाई बिसाऊ' },
    beats: sleepyYakBeats,
  },
  {
    id: 'star-blanket',
    category: 'universal',
    form: 'story',
    ageBand: '2-4',
    runtimeMinutes: 4,
    accent: '#F4E6C8',
    stage: 'stars',
    title: { en: 'The Star Blanket', ne: 'ताराको ओढ्ने' },
    subtitle: { en: 'Sky grandmother stitches the night.', ne: 'आकाश हजुरआमाले रात सिल्लिन्।' },
    theme: { en: 'The dark can be kind', ne: 'अँध्यारो मायालु हुन सक्छ' },
    beats: starBlanketBeats,
  },
  {
    id: 'clever-rabbit',
    category: 'roots',
    form: 'story',
    ageBand: '4-6',
    runtimeMinutes: 5,
    accent: '#E8A04A',
    stage: 'forest',
    title: { en: 'The Clever Rabbit and the Tiger', ne: 'जङ्गी बाघ र चतुर खरायो' },
    subtitle: { en: 'A small rabbit. A loud tiger. A well full of moonlight.', ne: 'एउटा सानो खरायो। एउटा चर्को बाघ। जुनकिरण भरिएको इनार।' },
    theme: { en: 'Cleverness beats strength', ne: 'चलाखीले बल जित्छ' },
    beats: cleverRabbitBeats,
  },
  {
    id: 'koshi-crocodile',
    category: 'roots',
    form: 'story',
    ageBand: '4-6',
    runtimeMinutes: 5,
    accent: '#7BA37A',
    stage: 'river',
    title: { en: 'The Kind Crocodile of the Koshi', ne: 'कोशीको दयालु गोही' },
    subtitle: { en: 'A Terai river, and a promise kept.', ne: 'तराईको नदी, र पालना गरिएको बचन।' },
    theme: { en: 'A promise is a kind of courage', ne: 'बचन पनि एउटा साहस हो' },
    beats: koshiBeats,
  },
  {
    id: 'drum-hills',
    category: 'roots',
    form: 'story',
    ageBand: '4-6',
    runtimeMinutes: 5,
    accent: '#C4783A',
    stage: 'hills',
    title: { en: 'The Drum of the Hills', ne: 'पाखाको मादल' },
    subtitle: { en: 'A polite drum that called the rain.', ne: 'पानी बोलाउने विनयी मादल।' },
    theme: { en: 'Ask gently', ne: 'बिस्तारै माग' },
    beats: drumHillsBeats,
  },
  {
    id: 'bhaktapur-well',
    category: 'roots',
    form: 'story',
    ageBand: '6-8',
    runtimeMinutes: 5,
    accent: '#C4783A',
    stage: 'courtyard',
    title: { en: 'The Well of Bhaktapur', ne: 'भक्तपुरको इनार' },
    subtitle: { en: 'A Newar legend, told softly.', ne: 'एउटा नेवार कथा, बिस्तारै भनिएको।' },
    theme: { en: 'Home keeps its own magic', ne: 'घरमा आफ्नै जादू हुन्छ' },
    beats: bhaktapurBeats,
  },
  {
    id: 'yeti-quiet',
    category: 'roots',
    form: 'story',
    ageBand: '6-8',
    runtimeMinutes: 5,
    accent: '#C4B59A',
    stage: 'hills',
    title: { en: "The Yeti's Quiet Footsteps", ne: 'येतीको शान्त पैताला' },
    subtitle: { en: 'A large kindness in the snow.', ne: 'हिउँमा एउटा ठूलो दया।' },
    theme: { en: 'Large things can be gentle', ne: 'ठूला कुरा नरम हुन सक्छन्' },
    beats: yetiQuietBeats,
  },
  {
    id: 'tea-shop-lamp',
    category: 'roots',
    form: 'story',
    ageBand: '6-8',
    runtimeMinutes: 5,
    accent: '#E8A04A',
    stage: 'lamp',
    title: { en: 'The Lamp in the Tea Shop', ne: 'चिया पसलको बत्ती' },
    subtitle: { en: 'One gold coin of light for the road.', ne: 'बाटोका लागि उज्यालोको एउटा सिक्का।' },
    theme: { en: 'Leave a little light', ne: 'थोरै उज्यालो छोड' },
    beats: teaShopLampBeats,
  },
  {
    id: 'dove-net',
    category: 'universal',
    form: 'story',
    ageBand: '9-12',
    runtimeMinutes: 6,
    accent: '#F4E6C8',
    stage: 'stars',
    title: { en: 'The Doves and the Net', ne: 'ढुकुर र जाल' },
    subtitle: { en: 'An old fable about rising together.', ne: 'सँगै उक्लने पुरानो दन्त्यकथा।' },
    theme: { en: 'Together, the knots loosen', ne: 'सँगै गाँठो खुल्छ' },
    beats: doveNetBeats,
  },
  {
    id: 'mountain-school',
    category: 'roots',
    form: 'story',
    ageBand: '9-12',
    runtimeMinutes: 6,
    accent: '#C4783A',
    stage: 'hills',
    title: { en: 'The Mountain School at Dusk', ne: 'साँझको पहाडी स्कूल' },
    subtitle: { en: 'One room, one stove, one hard sum.', ne: 'एउटा कोठा, एउटा चुल्हो, एउटा गाह्रो हिसाब।' },
    theme: { en: 'One step, then another', ne: 'एउटा कदम, अनि अर्को' },
    beats: mountainSchoolBeats,
  },
  {
    id: 'bridge-light',
    category: 'roots',
    form: 'story',
    ageBand: '9-12',
    runtimeMinutes: 6,
    accent: '#7BA37A',
    stage: 'river',
    title: { en: 'The Bridge of Last Light', ne: 'अन्तिम उज्यालोको पुल' },
    subtitle: { en: 'Two villages, one kite, one river.', ne: 'दुई गाउँ, एउटा चङ्गा, एउटा नदी।' },
    theme: { en: 'Hands can be bridges', ne: 'हात पुल हुन सक्छन्' },
    beats: bridgeLightBeats,
  },
  {
    id: 'night-bus',
    category: 'roots',
    form: 'story',
    ageBand: '13-17',
    runtimeMinutes: 7,
    accent: '#E8A04A',
    stage: 'hills',
    cast: 'none',
    title: { en: 'The Night Bus to Pokhara', ne: 'पोखरा जाने रातिको बस' },
    subtitle: { en: 'Between places, still whole.', ne: 'दुई ठाउँबीच, तैपनि पूरा।' },
    theme: { en: 'Kindness without a witness', ne: 'साक्षी नचाहिने दया' },
    beats: nightBusBeats,
  },
  {
    id: 'letters-river',
    category: 'roots',
    form: 'story',
    ageBand: '13-17',
    runtimeMinutes: 7,
    accent: '#7BA37A',
    stage: 'river',
    cast: 'none',
    title: { en: 'Letters Across the River', ne: 'नदीपारिका चिठी' },
    subtitle: { en: 'Paper is older than towers.', ne: 'कागज टावरभन्दा पुरानो हो।' },
    theme: { en: 'The ferry after dark', ne: 'अँध्यारोपछिको डुङ्गा' },
    beats: lettersRiverBeats,
  },
  {
    id: 'happy-prince',
    category: 'universal',
    form: 'novel',
    ageBand: '18-25',
    runtimeMinutes: 10,
    accent: '#E8A04A',
    stage: 'lamp',
    cast: 'none',
    title: { en: 'The Happy Prince', ne: 'सुखी राजकुमार' },
    subtitle: { en: 'Wilde, retold for a grown evening. Public domain.', ne: 'वाइल्ड, वयस्क साँझका लागि। सार्वजनिक सम्पत्ति।' },
    theme: { en: 'What is precious rarely shines', ne: 'मूल्यवान कुरा कमै चम्किन्छ' },
    beats: happyPrinceBeats,
  },
  {
    id: 'selfish-giant',
    category: 'universal',
    form: 'novel',
    ageBand: '18-25',
    runtimeMinutes: 9,
    accent: '#7BA37A',
    stage: 'hills',
    cast: 'none',
    title: { en: 'The Selfish Giant', ne: 'स्वार्थी दैत्य' },
    subtitle: { en: 'Wilde, retold. A wall, a garden, a thaw.', ne: 'वाइल्ड, नयाँ गरी। पर्खाल, बगैंचा, पग्लिने जाडो।' },
    theme: { en: 'Take one stone out', ne: 'एउटा ढुङ्गा निकाल' },
    beats: selfishGiantBeats,
  },
  {
    id: 'north-wind',
    category: 'universal',
    form: 'novel',
    ageBand: '18-25',
    runtimeMinutes: 7,
    accent: '#C4B59A',
    stage: 'hills',
    cast: 'none',
    title: { en: 'The North Wind and the Sun', ne: 'उत्तर हावा र घाम' },
    subtitle: { en: 'Aesop, shortened for the pillow. Public domain.', ne: 'ईसप, सिरानीका लागि। सार्वजनिक सम्पत्ति।' },
    theme: { en: 'Gentleness is still power', ne: 'नम्रता पनि शक्ति हो' },
    beats: northWindBeats,
  },
  {
    id: 'last-lamp-thamel',
    category: 'roots',
    form: 'novel',
    ageBand: '25+',
    runtimeMinutes: 12,
    accent: '#C4783A',
    stage: 'lamp',
    cast: 'none',
    title: { en: 'The Last Lamp in Thamel', ne: 'थमेलको अन्तिम लालटिन' },
    subtitle: { en: 'A bookshop, a Thursday reader, a page kept.', ne: 'किताब पसल, बिहीबारकी पाठक, च्यातिएको पृष्ठ।' },
    theme: { en: 'Keep a place with your thumb', ne: 'औंलाले ठाउँ च्यातिराख' },
    beats: lastLampThamelBeats,
  },
  {
    id: 'old-man-koshi',
    category: 'roots',
    form: 'novel',
    ageBand: '25+',
    runtimeMinutes: 10,
    accent: '#7BA37A',
    stage: 'river',
    cast: 'none',
    title: { en: 'The Old Man and the Koshi', ne: 'बुढो मानिस र कोशी' },
    subtitle: { en: 'Nets, flood, tea on a tin roof.', ne: 'जाल, बाढी, टिन छानामा चिया।' },
    theme: { en: 'Strength is returning to the work', ne: 'बल भनेको काममा फर्कनु' },
    beats: oldManKoshiBeats,
  },
];

export function getStory(id: string) {
  return stories.find((s) => s.id === id);
}

export function storiesForAge(age: AgeBand) {
  return stories.filter((s) => s.ageBand === age);
}

export function featuredForAge(age: AgeBand) {
  return storiesForAge(age)[0] ?? stories[0];
}

export const audienceGroups: {
  id: 'children' | 'young' | 'grown';
  label: { en: string; ne: string };
}[] = [
  { id: 'children', label: { en: 'Children', ne: 'बच्चा' } },
  { id: 'young', label: { en: 'Young', ne: 'युवा' } },
  { id: 'grown', label: { en: 'Grown', ne: 'वयस्क' } },
];

export function groupForAge(age: AgeBand) {
  return ageBands.find((band) => band.id === age)?.group ?? 'children';
}

export function bandsForGroup(group: 'children' | 'young' | 'grown') {
  return ageBands.filter((band) => band.group === group);
}

export function isGrownListening(age: AgeBand) {
  return age === '13-17' || age === '18-25' || age === '25+' || age === 'parents';
}

export function categoryLabel(story: Story, language: 'en' | 'ne') {
  if (story.form === 'novel') {
    return language === 'ne' ? 'उपन्यास' : 'Novel';
  }
  if (story.category === 'roots') {
    return language === 'ne' ? 'जरा' : 'Roots';
  }
  return language === 'ne' ? 'कथा' : 'Story';
}
