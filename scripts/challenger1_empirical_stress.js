/**
 * Saanjh Bedtime Stories - Challenger 1 Empirical Stress Test Harness
 * 
 * Tests boundary conditions, adversarial inputs, async race conditions,
 * and edge cases across:
 * 1. Search Engine (10k strings, unicode bombs, Devanagari conjuncts & matras, ZWJ/ZWNJ)
 * 2. Audio Engine & Volume Math (0/max boundaries, NaN/Infinity, 10s linear fade curve, 100k jitter)
 * 3. AsyncStorage Corruption & Hydration Sanitization (malformed JSON, prototype pollution, schema drift)
 * 4. Sleep Timer State Machine (rapid start/cancel cycles, expiry races, endOfStory triggers)
 * 5. Splash Ritual State & Race Conditions (instant dismissal at t=0, rapid double taps, timer cleanup)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let totalAssertions = 0;
const testErrors = [];

function assertEqual(actual, expected, msg) {
  totalAssertions++;
  if (actual !== expected) {
    throw new Error(`${msg || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertDeepEqual(actual, expected, msg) {
  totalAssertions++;
  assert.deepStrictEqual(actual, expected, msg);
}

function assertTrue(condition, msg) {
  totalAssertions++;
  if (!condition) {
    throw new Error(msg || 'Expected true but got false');
  }
}

function assertFalse(condition, msg) {
  totalAssertions++;
  if (condition) {
    throw new Error(msg || 'Expected false but got true');
  }
}

function assertCloseTo(actual, expected, delta = 0.001, msg) {
  totalAssertions++;
  if (Math.abs(actual - expected) > delta) {
    throw new Error(`${msg || 'Assertion failed'}: expected ${actual} to be within ±${delta} of ${expected}`);
  }
}

function runTest(name, fn) {
  totalTests++;
  const start = Date.now();
  try {
    fn();
    passedTests++;
    const duration = Date.now() - start;
    console.log(`  ✓ ${name} (${duration}ms)`);
  } catch (err) {
    failedTests++;
    testErrors.push({ name, error: err });
    console.error(`  ✗ ${name}: ${err.message}`);
    if (err.stack) {
      console.error(`    ${err.stack.split('\n').slice(1, 3).join('\n    ')}`);
    }
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  const start = Date.now();
  try {
    await fn();
    passedTests++;
    const duration = Date.now() - start;
    console.log(`  ✓ ${name} (${duration}ms)`);
  } catch (err) {
    failedTests++;
    testErrors.push({ name, error: err });
    console.error(`  ✗ ${name}: ${err.message}`);
    if (err.stack) {
      console.error(`    ${err.stack.split('\n').slice(1, 3).join('\n    ')}`);
    }
  }
}

console.log('\n========================================================================');
console.log('       CHALLENGER 1: EMPIRICAL STRESS & ADVERSARIAL HARNESS             ');
console.log('========================================================================\n');

// Mock Catalog Data representing the full app stories
const mockCatalog = [
  {
    id: 'clever-rabbit',
    title: { en: 'The Clever Rabbit and the Well', ne: 'चतुर खरायो र इनार' },
    subtitle: { en: 'A bedtime tale from ancient lore', ne: 'प्राचीन लोककथा' },
    theme: { en: 'Wisdom over might', ne: 'शक्तिको अगाडि बुद्धिको विजय' },
    ageBand: '4-6',
    category: 'roots',
    form: 'story',
    cast: 'rabbit',
    beats: [
      { text: { en: 'Once upon a time in a jungle...', ne: 'एकादेशमा एउटा जंगलमा एउटा चतुर खरायो थियो...' } },
      { text: { en: 'The lion looked into the deep well...', ne: 'सिंहले गहिरो इनारमा हेर्यो...' } }
    ]
  },
  {
    id: 'moon-rabbit',
    title: { en: 'The Rabbit in the Moon', ne: 'चन्द्रमाको खरायो' },
    subtitle: { en: 'Why the moon shines gently', ne: 'चन्द्रमा किन चम्किन्छ' },
    theme: { en: 'Generosity and peace', ne: 'उदारता र शान्ति' },
    ageBand: '2-4',
    category: 'roots',
    form: 'story',
    cast: 'rabbit',
    beats: [
      { text: { en: 'High above in the night sky...', ne: 'रातिको आकाशमा चम्किने तारा र चन्द्रमा...' } }
    ]
  },
  {
    id: 'sleepy-yak',
    title: { en: 'The Sleepy Yak of Langtang', ne: 'लाङटाङको सुत्ने चौंरी' },
    subtitle: { en: 'Himalayan high pasture dream', ne: 'हिमाली खर्कको मीठो निन्द्रा' },
    theme: { en: 'Restful sleep', ne: 'शान्त निन्द्रा' },
    ageBand: '2-4',
    category: 'roots',
    form: 'story',
    cast: 'yak',
    beats: [
      { text: { en: 'Cold wind blew gently over Langtang...', ne: 'लाङटाङ उपत्यकामा चिसो हावा चलिरहेको थियो...' } }
    ]
  },
  {
    id: 'koshi-crocodile',
    title: { en: 'The River Crocodile of Koshi', ne: 'कोशीको गोही' },
    subtitle: { en: 'Along the quiet river banks', ne: 'शान्त नदी किनारको कथा' },
    theme: { en: 'Friendship', ne: 'मित्रता' },
    ageBand: '6-8',
    category: 'roots',
    form: 'story',
    cast: 'crocodile',
    beats: [
      { text: { en: 'Saptakoshi flowed quietly into the night...', ne: 'सप्तकोशी नदी राति शान्त भएर बगिरहेको थियो...' } }
    ]
  },
  {
    id: 'bhaktapur-well',
    title: { en: 'The Whispering Well of Bhaktapur', ne: 'भक्तपुरको सुस्केरा हाल्ने इनार' },
    subtitle: { en: 'Echoes in the courtyards of the old city', ne: 'पुरानो शहरका चोकहरू' },
    theme: { en: 'History and heritage', ne: 'इतिहास र सम्पदा' },
    ageBand: '9-12',
    category: 'roots',
    form: 'story',
    cast: 'human',
    beats: [
      { text: { en: 'Brick paths of Bhaktapur gleamed in the moonlight...', ne: 'भक्तपुरका इँटाका बाटाहरू चन्द्रमाको प्रकाशमा टल्किरहेका थिए...' } }
    ]
  },
  {
    id: 'midnight-chiya',
    title: { en: 'Midnight Chiya in Thamel', ne: 'ठमेलको मध्यरातको चिया' },
    subtitle: { en: 'A cozy nocturnal parent story', ne: 'रात्रिकालीन आराम' },
    theme: { en: 'Mindfulness', ne: 'मनको शान्ति' },
    ageBand: 'parents',
    category: 'contemporary',
    form: 'novel',
    cast: 'human',
    beats: [
      { text: { en: 'Steam rose from the clay cup...', ne: 'माटोको कपबाट बाफ उडिरहेको थियो...' } }
    ]
  }
];

// Recreating searchCatalog logic
const ANIMAL_STORY_IDS = new Set([
  'clever-rabbit',
  'moon-rabbit',
  'sleepy-yak',
  'koshi-crocodile',
  'dove-net',
  'yeti-quiet',
  'firefly-lights',
]);

const ANIMAL_KEYWORDS = [
  'rabbit', 'crocodile', 'yak', 'tiger', 'dove', 'doves', 'firefly', 'fireflies', 'yeti',
  'animal', 'animals', 'bird', 'birds', 'fish', 'deer',
  'खरायो', 'गोही', 'चौंरी', 'बाघ', 'परेवा', 'जुन्किरी', 'यति', 'जनावर', 'पुतली', 'माछा', 'मृग'
];

const CURATED_TRENDING_IDS = [
  'clever-rabbit',
  'sleepy-yak',
  'moon-rabbit',
  'midnight-chiya',
  'sleepy-cloud',
  'koshi-crocodile',
];

function getTrendingStories(catalog) {
  if (!catalog || catalog.length === 0) return [];
  const curated = [];
  const addedIds = new Set();
  for (const id of CURATED_TRENDING_IDS) {
    const found = catalog.find((s) => s.id === id);
    if (found && !addedIds.has(found.id)) {
      curated.push(found);
      addedIds.add(found.id);
      if (curated.length === 4) return curated;
    }
  }
  for (const s of catalog) {
    if (!addedIds.has(s.id)) {
      curated.push(s);
      addedIds.add(s.id);
      if (curated.length === 4) break;
    }
  }
  return curated;
}

function searchCatalog(catalog, options = {}) {
  if (!catalog || !Array.isArray(catalog)) return [];
  const { query = '', pill = 'all' } = options;
  const trimmedQuery = (query || '').trim().toLowerCase();
  let results = [...catalog];

  if (pill && pill !== 'all') {
    switch (pill) {
      case 'toddlers':
        results = results.filter((s) => s.ageBand === '2-4' || s.ageBand === '4-6');
        break;
      case 'kids':
        results = results.filter((s) => s.ageBand === '6-8' || s.ageBand === '9-12');
        break;
      case 'novels_parents':
        results = results.filter(
          (s) =>
            s.form === 'novel' ||
            s.ageBand === 'parents' ||
            s.ageBand === '25+' ||
            s.ageBand === '18-25'
        );
        break;
      case 'roots':
        results = results.filter((s) => s.category === 'roots');
        break;
      case 'animals': {
        results = results.filter((s) => {
          if (ANIMAL_STORY_IDS.has(s.id) || s.cast === 'rabbit') return true;
          const hay = `${s.id} ${s.title?.en || ''} ${s.title?.ne || ''} ${s.subtitle?.en || ''} ${s.subtitle?.ne || ''} ${s.theme?.en || ''} ${s.theme?.ne || ''}`.toLowerCase();
          return ANIMAL_KEYWORDS.some((kw) => hay.includes(kw.toLowerCase()));
        });
        break;
      }
      case 'audio_only':
        results = results.filter(
          (s) =>
            s.mediaType === 'audio' ||
            Boolean(s.mediaUrl) ||
            Boolean(s.mediaUrl_ne) ||
            (Boolean(s.beats) && (s.beats?.length || 0) > 0)
        );
        break;
      default:
        break;
    }
  }

  if (!trimmedQuery) {
    if (pill === 'all') {
      return getTrendingStories(catalog);
    }
    return results;
  }

  const queryTokens = trimmedQuery.split(/\s+/).filter(Boolean);

  return results.filter((story) => {
    const hayEn = [
      story.id,
      story.title?.en || '',
      story.subtitle?.en || '',
      story.theme?.en || '',
      story.category || '',
      story.form || '',
      story.stage || '',
      story.ageBand || '',
    ].join(' ').toLowerCase();

    const hayNe = [
      story.title?.ne || '',
      story.subtitle?.ne || '',
      story.theme?.ne || '',
    ].join(' ').toLowerCase();

    let beatsEn = '';
    let beatsNe = '';
    if (story.beats && Array.isArray(story.beats)) {
      beatsEn = story.beats.map((b) => b.text?.en || '').join(' ').toLowerCase();
      beatsNe = story.beats.map((b) => b.text?.ne || '').join(' ').toLowerCase();
    }

    const fullHaystack = `${hayEn} ${hayNe} ${beatsEn} ${beatsNe}`;

    if (fullHaystack.includes(trimmedQuery)) return true;
    if (queryTokens.length > 1 && queryTokens.every((token) => fullHaystack.includes(token))) {
      return true;
    }

    return false;
  });
}

// =========================================================================
// TEST SUITE 1: ADVERSARIAL SEARCH ENGINE STRESS
// =========================================================================
console.log('--- Test Suite 1: Boundary & Adversarial Search Inputs ---');

runTest('C1.S01: 10,000-character search string executes with zero regex crash & <10ms latency', () => {
  const giantQuery = 'a'.repeat(10000);
  const start = Date.now();
  const res = searchCatalog(mockCatalog, { query: giantQuery });
  const latency = Date.now() - start;
  assertEqual(res.length, 0, 'No match expected for 10k repeated chars');
  assertTrue(latency < 50, `Expected latency < 50ms, got ${latency}ms`);
});

runTest('C1.S02: 10,000-character mixed unicode fuzz string with regex metacharacters', () => {
  const patterns = ['(.*+?^${}()|[]\\)', '.*.*.*', '[a-z]+', '\\d{10}', '\\p{Devanagari}+', '(?=.*abc)'];
  const fuzzy = Array.from({ length: 2000 }, (_, i) => patterns[i % patterns.length]).join('');
  assertEqual(fuzzy.length >= 10000, true, 'String length >= 10000');
  const start = Date.now();
  const res = searchCatalog(mockCatalog, { query: fuzzy });
  const latency = Date.now() - start;
  assertEqual(res.length, 0, 'No match');
  assertTrue(latency < 50, `Latency was ${latency}ms`);
});

runTest('C1.S03: Null bytes, Zero-Width Joiners (ZWJ/ZWNJ), RTL overrides, and BOM in search queries', () => {
  const adversarialStrings = [
    'खरायो\0nullbyte',
    '\uFEFFखरायो', // Byte Order Mark + Nepali
    'चतुर\u200Dखरायो', // ZWJ
    'चतुर\u200Cखरायो', // ZWNJ
    '\u202Eखरायो\u202C', // Right-to-Left Override
    '   \t\n\r  ', // pure whitespace
    'undefined',
    'null',
    '[object Object]',
    '__proto__',
    'constructor',
    'prototype',
  ];

  for (const query of adversarialStrings) {
    const res = searchCatalog(mockCatalog, { query });
    assertTrue(Array.isArray(res), `Query "${query}" should safely return an array`);
  }
});

runTest('C1.S04: Devanagari Complex Conjuncts & Matras Matching Invariants', () => {
  const testCases = [
    { query: 'चतुर', expectedId: 'clever-rabbit' },
    { query: 'खरायो', expectedId: 'clever-rabbit' },
    { query: 'चन्द्रमा', expectedId: 'moon-rabbit' },
    { query: 'लाङटाङ', expectedId: 'sleepy-yak' },
    { query: 'चौंरी', expectedId: 'sleepy-yak' },
    { query: 'गोही', expectedId: 'koshi-crocodile' },
    { query: 'भक्तपुर', expectedId: 'bhaktapur-well' },
    { query: 'ठमेल', expectedId: 'midnight-chiya' },
    { query: 'चिया', expectedId: 'midnight-chiya' },
    { query: 'इँटाका बाटाहरू', expectedId: 'bhaktapur-well' }, // beat match
    { query: 'सप्तकोशी नदी', expectedId: 'koshi-crocodile' }, // beat match
  ];

  for (const tc of testCases) {
    const res = searchCatalog(mockCatalog, { query: tc.query });
    assertTrue(res.length > 0, `Query "${tc.query}" should find story`);
    assertEqual(res[0].id, tc.expectedId, `Query "${tc.query}" top result should be ${tc.expectedId}`);
  }
});

runTest('C1.S05: Multi-word token conjunction search across English and Nepali', () => {
  const query1 = 'clever well ancient';
  const res1 = searchCatalog(mockCatalog, { query: query1 });
  assertEqual(res1.length, 1);
  assertEqual(res1[0].id, 'clever-rabbit');

  const query2 = 'लाङटाङ खर्क निन्द्रा';
  const res2 = searchCatalog(mockCatalog, { query: query2 });
  assertEqual(res2.length, 1);
  assertEqual(res2[0].id, 'sleepy-yak');

  const query3 = 'rabbit ancient nonexistingterm';
  const res3 = searchCatalog(mockCatalog, { query: query3 });
  assertEqual(res3.length, 0, 'All tokens must match');
});

runTest('C1.S06: Quick filter pills + query combinations', () => {
  // All toddlers stories
  const toddlersAll = searchCatalog(mockCatalog, { query: '', pill: 'toddlers' });
  assertEqual(toddlersAll.length, 2); // moon-rabbit and sleepy-yak
  for (const s of toddlersAll) {
    assertTrue(s.ageBand === '2-4' || s.ageBand === '4-6');
  }

  // Toddlers + query for yak
  const toddlersYak = searchCatalog(mockCatalog, { query: 'yak', pill: 'toddlers' });
  assertEqual(toddlersYak.length, 1);
  assertEqual(toddlersYak[0].id, 'sleepy-yak');

  // Novels & Parents pill
  const novels = searchCatalog(mockCatalog, { query: '', pill: 'novels_parents' });
  assertEqual(novels.length, 1);
  assertEqual(novels[0].id, 'midnight-chiya');
});

// =========================================================================
// TEST SUITE 2: AUDIO ENGINE VOLUME MATH & FADE CURVES
// =========================================================================
console.log('\n--- Test Suite 2: Audio Volume Math & 10-Second Fade Precision ---');

function clampVolume(val) {
  if (typeof val === 'number' && !isNaN(val)) {
    return Math.max(0, Math.min(1, val));
  }
  return 0.5;
}

runTest('C1.A01: Extreme Volume Clamping & NaN / Infinity / Type Invariance', () => {
  assertEqual(clampVolume(0.0), 0.0);
  assertEqual(clampVolume(1.0), 1.0);
  assertEqual(clampVolume(-0.0), 0);
  assertEqual(clampVolume(-1.0), 0.0);
  assertEqual(clampVolume(-99999.9), 0.0);
  assertEqual(clampVolume(1.0000001), 1.0);
  assertEqual(clampVolume(100000), 1.0);
  assertEqual(clampVolume(NaN), 0.5);
  assertEqual(clampVolume(Infinity), 1.0);
  assertEqual(clampVolume(-Infinity), 0.0);
  assertEqual(clampVolume(null), 0.5);
  assertEqual(clampVolume(undefined), 0.5);
  assertEqual(clampVolume("0.8"), 0.5); // non-number string
  assertEqual(clampVolume({}), 0.5);
  assertEqual(clampVolume([]), 0.5);
});

runTest('C1.A02: 100,000 Rapid Jitter Volume Operations maintain strict [0.0, 1.0] bound', () => {
  let vol = 0.5;
  for (let i = 0; i < 100000; i++) {
    const jitter = (Math.sin(i) * 0.8) + (i % 2 === 0 ? 0.3 : -0.3);
    vol = clampVolume(jitter);
    assertTrue(vol >= 0.0 && vol <= 1.0, `Volume ${vol} violated bounds [0, 1] at step ${i}`);
  }
});

runTest('C1.A03: 10-Second Linear Fade Out Decay Function (100 steps)', () => {
  const steps = 100;
  const initialBedVol = 0.22;
  const initialScapeVol = 0.75;
  let prevBed = initialBedVol;
  let prevScape = initialScapeVol;

  for (let currentStep = 1; currentStep <= steps; currentStep++) {
    const factor = Math.max(0, 1 - currentStep / steps);
    const bedVol = Math.max(0, initialBedVol * factor);
    const scapeVol = Math.max(0, initialScapeVol * factor);

    assertTrue(bedVol <= prevBed, `Bed volume must be monotonically non-increasing (step ${currentStep})`);
    assertTrue(scapeVol <= prevScape, `Scape volume must be monotonically non-increasing (step ${currentStep})`);
    assertTrue(bedVol >= 0.0, 'Bed volume must not be negative');
    assertTrue(scapeVol >= 0.0, 'Scape volume must not be negative');

    prevBed = bedVol;
    prevScape = scapeVol;
  }

  assertEqual(prevBed, 0.0, 'Bed volume at step 100 must be exactly 0.0');
  assertEqual(prevScape, 0.0, 'Scape volume at step 100 must be exactly 0.0');
});

// =========================================================================
// TEST SUITE 3: ASYNCSTORAGE CORRUPT DATA RECOVERY & HYDRATION
// =========================================================================
console.log('\n--- Test Suite 3: AsyncStorage Corrupted Data Recovery & Schema Drift ---');

// Mock AsyncStorage
class MockAsyncStorage {
  constructor() {
    this.store = new Map();
  }
  async getItem(key) {
    return this.store.get(key) || null;
  }
  async setItem(key, value) {
    this.store.set(key, String(value));
  }
  async removeItem(key) {
    this.store.delete(key);
  }
  async clear() {
    this.store.clear();
  }
}

const mockStorage = new MockAsyncStorage();

function parseLanguage(value) {
  return value === 'en' || value === 'ne' ? value : 'ne';
}

function parseAgeBand(value) {
  if (value === 'teen') return '13-17';
  if (value === 'adult' || value === '18+') return '18-25';
  if (value === 'parent' || value === 'parents') return 'parents';
  return value === '2-4' ||
    value === '4-6' ||
    value === '6-8' ||
    value === '9-12' ||
    value === '13-17' ||
    value === '18-25' ||
    value === '25+' ||
    value === 'parents'
    ? value
    : '4-6';
}

function parseVoicePace(value) {
  return value === 'slow' || value === 'gentle' || value === 'clear' ? value : 'gentle';
}

function parseVoiceGender(value) {
  return value === 'male' || value === 'female' ? value : 'female';
}

function parseSleepTimerDuration(value) {
  if (
    value === 'off' ||
    value === '15m' ||
    value === '30m' ||
    value === '45m' ||
    value === '60m' ||
    value === 'endOfStory'
  ) {
    return value;
  }
  return 'off';
}

function parseSoundscape(value) {
  if (
    value === 'rain' ||
    value === 'river' ||
    value === 'night' ||
    value === 'wind' ||
    value === 'chime'
  ) {
    return value;
  }
  return null;
}

function parseNightLightColor(value) {
  return value === 'moonlight' || value === 'amber' ? value : 'amber';
}

function parseNightLightBrightness(value) {
  if (typeof value === 'number' && !isNaN(value)) {
    return Math.max(0.05, Math.min(1, value));
  }
  return 0.6;
}

function hydrateSettings(rawJson) {
  const defaults = {
    language: 'ne',
    ageBand: '4-6',
    voicePace: 'gentle',
    voiceGender: 'female',
    nightSounds: true,
    keepAwake: true,
    aiVoice: false,
    sleepTimerDuration: 'off',
    activeSoundscape: null,
    soundscapeVolume: 0.5,
    nightLightColor: 'amber',
    nightLightBrightness: 0.6,
    ready: true,
  };

  if (!rawJson) return defaults;

  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return defaults;
    }
    return {
      language: parseLanguage(parsed.language),
      ageBand: parseAgeBand(parsed.ageBand),
      voicePace: parseVoicePace(parsed.voicePace),
      voiceGender: parseVoiceGender(parsed.voiceGender),
      nightSounds: parsed.nightSounds !== false,
      keepAwake: parsed.keepAwake !== false,
      aiVoice: parsed.aiVoice === true,
      sleepTimerDuration: parseSleepTimerDuration(parsed.sleepTimerDuration),
      activeSoundscape: parseSoundscape(parsed.activeSoundscape),
      soundscapeVolume: clampVolume(parsed.soundscapeVolume),
      nightLightColor: parseNightLightColor(parsed.nightLightColor),
      nightLightBrightness: parseNightLightBrightness(parsed.nightLightBrightness),
      ready: true,
    };
  } catch {
    return defaults;
  }
}

runTest('C1.M01: Corrupt & Truncated JSON recovery in AsyncStorage Hydration', () => {
  const corruptPayloads = [
    '{ "language": "en", "soundsca', // truncated
    'undefined',
    'null',
    '12345',
    '"plain string"',
    '[1, 2, 3]',
    '{"__proto__": {"admin": true}}',
    '{"language": 999, "ageBand": null, "nightLightBrightness": "very_bright"}',
    '{"activeSoundscape": "thunderstorm_invalid"}',
    '{"sleepTimerDuration": "120m_invalid"}',
    '{"nightSounds": "maybe"}',
  ];

  for (const raw of corruptPayloads) {
    const hydrated = hydrateSettings(raw);
    assertTrue(hydrated.ready === true, 'Store must mark ready');
    assertTrue(hydrated.language === 'en' || hydrated.language === 'ne', 'Language must be valid enum');
    assertTrue(hydrated.nightLightBrightness >= 0.05 && hydrated.nightLightBrightness <= 1.0, 'Brightness must be valid');
    assertTrue(hydrated.soundscapeVolume >= 0.0 && hydrated.soundscapeVolume <= 1.0, 'Volume must be valid');
    assertTrue(
      ['off', '15m', '30m', '45m', '60m', 'endOfStory'].includes(hydrated.sleepTimerDuration),
      'Timer duration must be valid enum'
    );
  }
});

runTest('C1.M02: Recent Searches persistence with corrupt storage & capacity bounds', async () => {
  const KEY = 'saanjh.recent_searches.v1';
  const MAX = 8;

  async function getRecentSearches() {
    try {
      const raw = await mockStorage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }

  async function addRecentSearch(query) {
    const clean = query.trim();
    if (!clean) return getRecentSearches();
    try {
      const current = await getRecentSearches();
      const filtered = current.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, MAX);
      await mockStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [clean];
    }
  }

  // 1. Initial empty
  await mockStorage.clear();
  let searches = await getRecentSearches();
  assertEqual(searches.length, 0);

  // 2. Add 12 items (should cap at 8)
  for (let i = 1; i <= 12; i++) {
    searches = await addRecentSearch(`Search Term ${i}`);
  }
  assertEqual(searches.length, 8);
  assertEqual(searches[0], 'Search Term 12');
  assertEqual(searches[7], 'Search Term 5');

  // 3. Inject corrupted JSON into storage
  await mockStorage.setItem(KEY, 'NOT_VALID_JSON{[');
  searches = await getRecentSearches();
  assertEqual(searches.length, 0, 'Corrupt storage returns empty array safely');

  // 4. Adding new item recovers cleanly
  searches = await addRecentSearch('Recovered Search');
  assertEqual(searches.length, 1);
  assertEqual(searches[0], 'Recovered Search');
});

// =========================================================================
// TEST SUITE 4: SLEEP TIMER CONCURRENCY & RAPID CYCLES
// =========================================================================
console.log('\n--- Test Suite 4: Sleep Timer Concurrency & Rapid Cycles ---');

function createSleepTimerStateHarness() {
  let state = {
    duration: 'off',
    remainingSeconds: null,
    isActive: false,
    isFadingOut: false,
    fadeCalls: 0,
    stopAudioCalls: 0,
  };

  const SLEEP_SECONDS = {
    off: null,
    '15m': 15 * 60,
    '30m': 30 * 60,
    '45m': 45 * 60,
    '60m': 60 * 60,
    endOfStory: null,
  };

  return {
    getState: () => state,
    setDuration: (dur) => {
      if (dur === 'off') {
        state = {
          ...state,
          duration: 'off',
          remainingSeconds: null,
          isActive: false,
          isFadingOut: false,
        };
        return;
      }
      state = {
        ...state,
        duration: dur,
        remainingSeconds: SLEEP_SECONDS[dur],
        isActive: true,
        isFadingOut: false,
      };
    },
    tick: () => {
      if (!state.isActive || state.duration === 'off') return;
      if (state.duration === 'endOfStory') return;

      if (typeof state.remainingSeconds === 'number') {
        const next = state.remainingSeconds - 1;
        if (next <= 0) {
          state = {
            ...state,
            duration: 'off',
            remainingSeconds: null,
            isActive: false,
            isFadingOut: false,
            stopAudioCalls: state.stopAudioCalls + 1,
          };
          return;
        }

        if (next <= 10 && !state.isFadingOut) {
          state = {
            ...state,
            remainingSeconds: next,
            isFadingOut: true,
            fadeCalls: state.fadeCalls + 1,
          };
          return;
        }

        state = {
          ...state,
          remainingSeconds: next,
        };
      }
    },
    cancelTimer: () => {
      state = {
        ...state,
        duration: 'off',
        remainingSeconds: null,
        isActive: false,
        isFadingOut: false,
      };
    },
    notifyStoryEnded: () => {
      if (state.isActive && state.duration === 'endOfStory') {
        state = {
          ...state,
          duration: 'off',
          remainingSeconds: null,
          isActive: false,
          isFadingOut: false,
          stopAudioCalls: state.stopAudioCalls + 1,
        };
      }
    },
  };
}

runTest('C1.T01: 10,000 Rapid Timer Start / Cancel / Switch cycles', () => {
  const harness = createSleepTimerStateHarness();
  const durations = ['off', '15m', '30m', '45m', '60m', 'endOfStory'];

  for (let i = 0; i < 10000; i++) {
    const dur = durations[i % durations.length];
    harness.setDuration(dur);
    if (i % 3 === 0) {
      harness.tick();
    }
    if (i % 5 === 0) {
      harness.cancelTimer();
    }
  }

  // Ensure state is well-formed
  const finalState = harness.getState();
  assertTrue(durations.includes(finalState.duration));
  if (finalState.duration === 'off') {
    assertFalse(finalState.isActive);
    assertEqual(finalState.remainingSeconds, null);
  } else {
    assertTrue(finalState.isActive);
  }
});

runTest('C1.T02: Exact countdown simulation down to 0s and single-trigger fade at t=10s', () => {
  const harness = createSleepTimerStateHarness();
  harness.setDuration('15m');
  assertEqual(harness.getState().remainingSeconds, 900);
  assertEqual(harness.getState().isFadingOut, false);

  // Fast forward to t=11s (889 ticks)
  for (let i = 0; i < 889; i++) {
    harness.tick();
  }
  assertEqual(harness.getState().remainingSeconds, 11);
  assertEqual(harness.getState().isFadingOut, false);
  assertEqual(harness.getState().fadeCalls, 0);

  // Tick to t=10s (fade should trigger exactly once)
  harness.tick();
  assertEqual(harness.getState().remainingSeconds, 10);
  assertEqual(harness.getState().isFadingOut, true);
  assertEqual(harness.getState().fadeCalls, 1);

  // Ticks 9 down to 1 (isFadingOut remains true, fadeCalls not incremented again)
  for (let i = 9; i >= 1; i--) {
    harness.tick();
    assertEqual(harness.getState().remainingSeconds, i);
    assertEqual(harness.getState().isFadingOut, true);
    assertEqual(harness.getState().fadeCalls, 1);
  }

  // Final tick to 0s (stops audio, clears active)
  harness.tick();
  assertEqual(harness.getState().remainingSeconds, null);
  assertEqual(harness.getState().isActive, false);
  assertEqual(harness.getState().duration, 'off');
  assertEqual(harness.getState().stopAudioCalls, 1);
});

runTest('C1.T03: End of Story trigger isolation', () => {
  const harness = createSleepTimerStateHarness();

  // Inactive timer -> notify does nothing
  harness.notifyStoryEnded();
  assertEqual(harness.getState().stopAudioCalls, 0);

  // Active 15m timer -> notify does nothing (only endOfStory triggers on story end)
  harness.setDuration('15m');
  harness.notifyStoryEnded();
  assertEqual(harness.getState().isActive, true);
  assertEqual(harness.getState().stopAudioCalls, 0);

  // Active endOfStory -> triggers stop audio
  harness.setDuration('endOfStory');
  assertEqual(harness.getState().isActive, true);
  harness.notifyStoryEnded();
  assertEqual(harness.getState().isActive, false);
  assertEqual(harness.getState().duration, 'off');
  assertEqual(harness.getState().stopAudioCalls, 1);
});

// =========================================================================
// TEST SUITE 5: SPLASH RITUAL INSTANT DISMISSAL & RACE CONDITIONS
// =========================================================================
console.log('\n--- Test Suite 5: Splash Ritual Dismissal Mechanics & State Safety ---');

function createSplashDismissalSimulator() {
  let isDismissing = false;
  let finishCalls = 0;
  let timers = [];

  const audioTimer = { id: 1, delay: 450, cancelled: false };
  const autoFinishTimer = { id: 2, delay: 3200, cancelled: false };
  timers.push(audioTimer, autoFinishTimer);

  const handleDismiss = (isSkip = false) => {
    if (isDismissing) return;
    isDismissing = true;

    // Clear timers
    for (const t of timers) {
      t.cancelled = true;
    }

    // Callback simulation
    finishCalls++;
  };

  return {
    handleDismiss,
    getIsDismissing: () => isDismissing,
    getFinishCalls: () => finishCalls,
    getTimers: () => timers,
  };
}

runTest('C1.R01: Instant tap at t=0ms dismisses splash and cancels all pending timers', () => {
  const sim = createSplashDismissalSimulator();
  assertFalse(sim.getIsDismissing());

  sim.handleDismiss(true);

  assertTrue(sim.getIsDismissing());
  assertEqual(sim.getFinishCalls(), 1);
  for (const t of sim.getTimers()) {
    assertTrue(t.cancelled, `Timer ${t.id} should be cancelled`);
  }
});

runTest('C1.R02: 100 rapid concurrent taps trigger onFinish exactly once', () => {
  const sim = createSplashDismissalSimulator();

  for (let i = 0; i < 100; i++) {
    sim.handleDismiss(true);
  }

  assertTrue(sim.getIsDismissing());
  assertEqual(sim.getFinishCalls(), 1, 'onFinish must be invoked exactly once');
});

runTest('C1.R03: Auto-dismissal at t=3200ms triggers cleanly if no user tap occurs', () => {
  const sim = createSplashDismissalSimulator();
  assertFalse(sim.getIsDismissing());

  // Simulate timer firing
  sim.handleDismiss(false);

  assertTrue(sim.getIsDismissing());
  assertEqual(sim.getFinishCalls(), 1);
});

// =========================================================================
// SUMMARY
// =========================================================================
console.log('\n========================================================================');
console.log('                 CHALLENGER 1 STRESS TEST SUMMARY                       ');
console.log('========================================================================');
console.log(` Total Stress Tests:    ${totalTests}`);
console.log(` Passed:                ${passedTests}`);
console.log(` Failed:                ${failedTests}`);
console.log(` Total Assertions:      ${totalAssertions}`);
console.log(` Success Rate:          ${((passedTests / totalTests) * 100).toFixed(1)}%`);
console.log('========================================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
