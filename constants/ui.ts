import { Language } from '@/types/story';

export const ui = {
  tonight: { en: "Tonight's story", ne: 'आज रातिको कथा' },
  begin: { en: 'Begin', ne: 'सुरु गरौं' },
  moreStories: { en: 'More stories', ne: 'अरू कथाहरू' },
  comingSoon: { en: 'Coming soon', ne: 'चाँडै आउँदै' },
  roots: { en: 'Roots', ne: 'जरा' },
  minutes: { en: 'min', ne: 'मिनेट' },
  pause: { en: 'Pause', ne: 'रोकौं' },
  resume: { en: 'Continue', ne: 'जारी राखौं' },
  sweetDreams: { en: 'Sweet dreams, little one.', ne: 'शुभ रात्रि, नानी।' },
  tapToWake: { en: 'Tap to go back', ne: 'फर्कन छोउनुहोस्' },
  language: { en: 'English', ne: 'नेपाली' },
  settings: { en: 'Settings', ne: 'सेटिङ' },
  whoListening: { en: 'Who is listening?', ne: 'को सुन्दैछ?' },
  whoListeningHint: {
    en: 'First pick Children, Young, or Grown. Then pick the age.',
    ne: 'पहिले बच्चा, युवा वा वयस्क छान्नुहोस्। अनि उमेर छान्नुहोस्।',
  },
  languageSection: { en: 'Language', ne: 'भाषा' },
  languageHint: {
    en: "Stories and the teller's voice follow this.",
    ne: 'कथा र कथावाचकको आवाज यही भाषामा हुन्छ।',
  },
  storyteller: { en: 'Storyteller', ne: 'कथावाचक' },
  voicePace: { en: 'Voice pace', ne: 'आवाजको गति' },
  paceSlow: { en: 'Slower', ne: 'अझ बिस्तारै' },
  paceGentle: { en: 'Gentle', ne: 'नरम' },
  paceClear: { en: 'Clear', ne: 'प्रस्ट' },
  night: { en: 'Night', ne: 'रात' },
  nightSounds: { en: 'Night sounds', ne: 'रातको आवाज' },
  nightSoundsHint: {
    en: 'Soft beds and story stings while a tale is told.',
    ne: 'कथा चलिरहँदा हल्का संगीत र साना आवाज।',
  },
  keepAwake: { en: 'Keep the screen on', ne: 'स्क्रिन बालिराख्ने' },
  keepAwakeHint: {
    en: 'So the pictures stay with the voice.',
    ne: 'आवाजसँगै चित्र पनि देखिरहोस्।',
  },
  settingsFoot: {
    en: 'The last five minutes of the day.',
    ne: 'दिनको अन्तिम पाँच मिनेट।',
  },
  nepali: { en: 'Nepali', ne: 'नेपाली' },
  english: { en: 'English', ne: 'English' },
  storiesFor: { en: 'Stories for', ne: 'कथाहरू' },
  novelsFor: { en: 'Novels for', ne: 'उपन्यास' },
  story: { en: 'Story', ne: 'कथा' },
  novel: { en: 'Novel', ne: 'उपन्यास' },
  tonightAdult: { en: "Tonight's reading", ne: 'आज रातिको पढाइ' },
  beginAdult: { en: 'Listen', ne: 'सुनौं' },
  sweetDreamsAdult: { en: 'Rest well.', ne: 'आराम गर्नुहोस्।' },
  voiceGender: { en: 'Teller', ne: 'कथावाचकको स्वर' },
  voiceGenderHint: {
    en: 'Uses the device storyteller. Female or male, as the phone allows.',
    ne: 'फोनको कथावाचक प्रयोग हुन्छ। महिला वा पुरुष, फोनले दिएसम्म।',
  },
  female: { en: 'Female', ne: 'महिला' },
  male: { en: 'Male', ne: 'पुरुष' },
  hearVoice: { en: 'Hear a line', ne: 'एक हरफ सुनौं' },
  groupChildren: { en: 'Children', ne: 'बच्चा' },
  groupYoung: { en: 'Young', ne: 'युवा' },
  groupGrown: { en: 'Grown', ne: 'वयस्क' },
  partOf: { en: 'Part', ne: 'भाग' },
} satisfies Record<string, Record<Language, string>>;

export function t(copy: Record<Language, string>, lang: Language) {
  return copy[lang];
}
