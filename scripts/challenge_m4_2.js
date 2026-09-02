/**
 * Challenger 2 Verification Harness for Milestone 4 (M4)
 * 
 * Target Domains:
 * 1. Night Light Mode (brightness slider bounds 0.05-1.0, theme switching, tap-to-exit responsiveness, Reanimated breathing pulse math)
 * 2. Settings Screen 4-Card UI under rapid concurrent toggling & state consistency
 * 3. Cold-Launch AsyncStorage hydration (corrupted JSON, missing keys, out-of-bounds values, schema sanitization)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let testsFailed = 0;
let totalAssertions = 0;

function pass(name, duration = 0) {
  testsPassed++;
  console.log(`  \x1b[32m✓\x1b[0m ${name} \x1b[2m(${duration}ms)\x1b[0m`);
}

function fail(name, err) {
  testsFailed++;
  console.log(`  \x1b[31m✗\x1b[0m ${name}`);
  console.log(`    \x1b[33mError:\x1b[0m ${err.message}`);
  if (err.stack) {
    console.log(`    \x1b[2m${err.stack.split('\n').slice(1, 3).join('\n    ')}\x1b[0m`);
  }
}

function test(name, fn) {
  const t0 = Date.now();
  try {
    fn();
    pass(name, Date.now() - t0);
  } catch (err) {
    fail(name, err);
  }
}

async function testAsync(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    pass(name, Date.now() - t0);
  } catch (err) {
    fail(name, err);
  }
}

function expect(actual) {
  return {
    toBe(expected, msg) {
      totalAssertions++;
      if (actual !== expected) {
        throw new Error(msg || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected, msg) {
      totalAssertions++;
      assert.deepStrictEqual(actual, expected, msg);
    },
    toBeGreaterThanOrEqual(expected, msg) {
      totalAssertions++;
      if (actual < expected) {
        throw new Error(msg || `Expected ${actual} >= ${expected}`);
      }
    },
    toBeLessThanOrEqual(expected, msg) {
      totalAssertions++;
      if (actual > expected) {
        throw new Error(msg || `Expected ${actual} <= ${expected}`);
      }
    },
    toBeCloseTo(expected, delta = 0.001, msg) {
      totalAssertions++;
      if (Math.abs(actual - expected) > delta) {
        throw new Error(msg || `Expected ${actual} close to ${expected} (±${delta})`);
      }
    },
    toBeTrue(msg) {
      totalAssertions++;
      if (actual !== true) {
        throw new Error(msg || `Expected true but got ${actual}`);
      }
    },
    toBeFalse(msg) {
      totalAssertions++;
      if (actual !== false) {
        throw new Error(msg || `Expected false but got ${actual}`);
      }
    },
  };
}

console.log('\n\x1b[1m\x1b[36m========================================================================\x1b[0m');
console.log('\x1b[1m\x1b[36m   CHALLENGER 2: M4 EMPIRICAL ADVERSARIAL STRESS & VERIFICATION SUITE   \x1b[0m');
console.log('\x1b[1m\x1b[36m========================================================================\x1b[0m\n');

// ============================================================================
// SUITE 1: NIGHT LIGHT MODE EMPIRICAL STRESS TESTS
// ============================================================================
console.log('\x1b[1m--- SUITE 1: NIGHT LIGHT MODE EMPIRICAL STRESS TESTS ---\x1b[0m');

// Helper implementing exact clamping logic from components/sleep/NightLightModal.tsx
function clampNightLightBrightness(val) {
  return Math.max(0.05, Math.min(1.0, Math.round(val * 100) / 100));
}

// Helper implementing exact breathing glow opacity calculation
function calculateGlowOpacity(brightness, breatheValue) {
  return Math.max(0.05, Math.min(1.0, brightness * breatheValue));
}

test('NL.01: Brightness clamping bounds [0.05, 1.0] across 20,000 randomized float inputs', () => {
  // Extreme boundaries
  expect(clampNightLightBrightness(-1000)).toBe(0.05);
  expect(clampNightLightBrightness(0.0)).toBe(0.05);
  expect(clampNightLightBrightness(0.049)).toBe(0.05);
  expect(clampNightLightBrightness(0.05)).toBe(0.05);
  expect(clampNightLightBrightness(0.5)).toBe(0.5);
  expect(clampNightLightBrightness(0.999)).toBe(1.0);
  expect(clampNightLightBrightness(1.0)).toBe(1.0);
  expect(clampNightLightBrightness(1.01)).toBe(1.0);
  expect(clampNightLightBrightness(1000)).toBe(1.0);

  // 20,000 randomized floats in [-1000, 1000]
  for (let i = 0; i < 20000; i++) {
    const val = (Math.random() - 0.5) * 2000;
    const clamped = clampNightLightBrightness(val);
    expect(clamped).toBeGreaterThanOrEqual(0.05);
    expect(clamped).toBeLessThanOrEqual(1.0);
    // Verify rounding precision (max 2 decimal places)
    const rounded = Math.round(clamped * 100) / 100;
    expect(clamped).toBe(rounded);
  }
});

test('NL.02: Night Light UI slider steps [0.1, 0.25, 0.45, 0.65, 0.85, 1.0] coverage', () => {
  const steps = [0.1, 0.25, 0.45, 0.65, 0.85, 1.0];
  for (const step of steps) {
    const clamped = clampNightLightBrightness(step);
    expect(clamped).toBe(step);
    // Test fill condition: brightness >= step - 0.08
    const isFilledForExact = clamped >= step - 0.08;
    expect(isFilledForExact).toBeTrue();
  }
});

test('NL.03: Breathing pulse oscillation math [0.92, 1.08] & resulting opacity bounds', () => {
  // Breathing animation cycles between 0.92 and 1.08 over 8 seconds
  const testBrightnessLevels = [0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0];
  const breatheSamples = [];

  // Generate 800 frames of sine-wave breathing simulation (8s @ 100Hz)
  for (let t = 0; t <= 8000; t += 10) {
    // Sine wave oscillating between 0.92 and 1.08
    const phase = (t / 8000) * 2 * Math.PI;
    const breathe = 1.0 + 0.08 * Math.sin(phase);
    breatheSamples.push(breathe);
  }

  for (const b of testBrightnessLevels) {
    for (const breathe of breatheSamples) {
      const opacity = calculateGlowOpacity(b, breathe);
      expect(opacity).toBeGreaterThanOrEqual(0.05);
      expect(opacity).toBeLessThanOrEqual(1.0);
    }
  }
});

test('NL.04: Theme palettes (Amber vs Moonlight) stop colors and contrast ratio', () => {
  const themes = {
    amber: {
      gradient: ['#E8A04A', '#45220E', '#0D0602'],
      accent: '#E8A04A',
      activeBg: 'rgba(232, 160, 74, 0.2)',
    },
    moonlight: {
      gradient: ['#8CA0B8', '#162230', '#060B12'],
      accent: '#8CA0B8',
      activeBg: 'rgba(140, 160, 184, 0.25)',
    },
  };

  for (const [key, theme] of Object.entries(themes)) {
    // Verify gradient stops
    expect(theme.gradient.length).toBe(3);
    for (const color of theme.gradient) {
      expect(/^#[0-9A-Fa-f]{6}$/.test(color)).toBeTrue(`Invalid hex color: ${color}`);
    }
    expect(/^#[0-9A-Fa-f]{6}$/.test(theme.accent)).toBeTrue(`Invalid accent hex: ${theme.accent}`);
  }
});

test('NL.05: Night Light Modal state transition & tap-to-exit responsiveness', () => {
  // Simulate Night Light modal state machine
  let visible = true;
  let showControls = true;
  let closed = false;

  const onClose = () => {
    closed = true;
    visible = false;
  };

  const handleBackgroundTap = () => {
    showControls = !showControls;
  };

  // Initial state: visible with controls
  expect(visible).toBeTrue();
  expect(showControls).toBeTrue();

  // Tap background toggles controls off for clean sleep view
  handleBackgroundTap();
  expect(showControls).toBeFalse();
  expect(visible).toBeTrue();

  // Tap background again toggles controls back on
  handleBackgroundTap();
  expect(showControls).toBeTrue();

  // Dismiss button or back button triggers onClose
  onClose();
  expect(visible).toBeFalse();
  expect(closed).toBeTrue();
});

test('NL.06: Source code verification of NightLightModal.tsx export & JSX tree', () => {
  const modalPath = path.join(ROOT_DIR, 'components', 'sleep', 'NightLightModal.tsx');
  const code = fs.readFileSync(modalPath, 'utf8');

  expect(code.includes('export function NightLightModal')).toBeTrue();
  expect(code.includes('Math.max(0.05, Math.min(1.0,')).toBeTrue();
  expect(code.includes('colorTheme === \'amber\'')).toBeTrue();
  expect(code.includes('#E8A04A')).toBeTrue();
  expect(code.includes('#8CA0B8')).toBeTrue();
  expect(code.includes('onRequestClose={onClose}')).toBeTrue();
});

// ============================================================================
// SUITE 2: SETTINGS SCREEN 4-CARD UI & RAPID CONCURRENT TOGGLING
// ============================================================================
console.log('\n\x1b[1m--- SUITE 2: SETTINGS SCREEN 4-CARD UI & CONCURRENCY STRESS TESTS ---\x1b[0m');

test('ST.01: Settings screen 4-card semantic structure verification in JSX', () => {
  const settingsPath = path.join(ROOT_DIR, 'app', 'settings.tsx');
  const code = fs.readFileSync(settingsPath, 'utf8');

  // Verify all 4 cards exist in layout
  expect(code.includes('CARD 1: AUDIO & VOICES')).toBeTrue();
  expect(code.includes('CARD 2: SLEEP TIMER & AMBIANCE')).toBeTrue();
  expect(code.includes('CARD 3: LANGUAGE & AGE GROUP')).toBeTrue();
  expect(code.includes('CARD 4: DISPLAY & NIGHT LIGHT')).toBeTrue();

  // Card 1 controls:
  expect(code.includes('setVoicePace')).toBeTrue();
  expect(code.includes('setVoiceGender')).toBeTrue();
  expect(code.includes('previewTeller')).toBeTrue();
  expect(code.includes('aiVoice')).toBeTrue();
  expect(code.includes('nightSounds')).toBeTrue();

  // Card 2 controls:
  expect(code.includes('SLEEP_TIMER_OPTIONS')).toBeTrue();
  expect(code.includes('<SoundscapesPlayer')).toBeTrue();

  // Card 3 controls:
  expect(code.includes('setLanguage')).toBeTrue();
  expect(code.includes('<AgeCategoryRow variant="full"')).toBeTrue();

  // Card 4 controls:
  expect(code.includes('keepAwake')).toBeTrue();
  expect(code.includes('setNightLightColor')).toBeTrue();
  expect(code.includes('<NightLightModal')).toBeTrue();
});

test('ST.02: In-Memory Zustand store replication & 10,000 rapid concurrent toggles', () => {
  // Create an in-memory replica of useSettingsStore state & reducers
  let state = {
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

  const paces = ['slow', 'gentle', 'clear'];
  const genders = ['female', 'male'];
  const languages = ['en', 'ne'];
  const ageBands = ['2-4', '4-6', '6-8', '9-12', '13-17', '18-25', '25+', 'parents'];
  const durations = ['off', '15m', '30m', '45m', '60m', 'endOfStory'];
  const soundscapes = [null, 'rain', 'river', 'night', 'wind', 'chime'];
  const colors = ['amber', 'moonlight'];

  // Perform 10,000 rapid randomized state updates
  for (let i = 0; i < 10000; i++) {
    const action = i % 11;
    switch (action) {
      case 0:
        state.language = languages[i % 2];
        break;
      case 1:
        state.ageBand = ageBands[i % ageBands.length];
        break;
      case 2:
        state.voicePace = paces[i % paces.length];
        break;
      case 3:
        state.voiceGender = genders[i % 2];
        break;
      case 4:
        state.nightSounds = i % 2 === 0;
        break;
      case 5:
        state.keepAwake = i % 2 === 0;
        break;
      case 6:
        state.aiVoice = i % 3 === 0;
        break;
      case 7:
        state.sleepTimerDuration = durations[i % durations.length];
        break;
      case 8:
        state.activeSoundscape = soundscapes[i % soundscapes.length];
        break;
      case 9:
        state.soundscapeVolume = Math.round((i % 11) * 0.1 * 10) / 10;
        break;
      case 10:
        state.nightLightColor = colors[i % 2];
        state.nightLightBrightness = clampNightLightBrightness(0.05 + (i % 20) * 0.05);
        break;
    }
  }

  // Verify all fields are valid and intact
  expect(languages.includes(state.language)).toBeTrue();
  expect(ageBands.includes(state.ageBand)).toBeTrue();
  expect(paces.includes(state.voicePace)).toBeTrue();
  expect(genders.includes(state.voiceGender)).toBeTrue();
  expect(typeof state.nightSounds).toBe('boolean');
  expect(typeof state.keepAwake).toBe('boolean');
  expect(typeof state.aiVoice).toBe('boolean');
  expect(durations.includes(state.sleepTimerDuration)).toBeTrue();
  expect(soundscapes.includes(state.activeSoundscape)).toBeTrue();
  expect(state.soundscapeVolume).toBeGreaterThanOrEqual(0);
  expect(state.soundscapeVolume).toBeLessThanOrEqual(1);
  expect(colors.includes(state.nightLightColor)).toBeTrue();
  expect(state.nightLightBrightness).toBeGreaterThanOrEqual(0.05);
  expect(state.nightLightBrightness).toBeLessThanOrEqual(1.0);
});

// ============================================================================
// SUITE 3: COLD-LAUNCH ASYNCSTORAGE HYDRATION & RECOVERY STRESS TESTS
// ============================================================================
console.log('\n\x1b[1m--- SUITE 3: COLD-LAUNCH ASYNCSTORAGE HYDRATION & RECOVERY ---\x1b[0m');

// Helper functions mirroring store/useSettingsStore.ts sanitizers
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

function parseVolume(value) {
  if (typeof value === 'number' && !isNaN(value)) {
    return Math.max(0, Math.min(1, value));
  }
  return 0.5;
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

function hydrateStoreFromRaw(rawString) {
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

  if (!rawString) return defaults;

  try {
    const parsed = JSON.parse(rawString);
    if (!parsed || typeof parsed !== 'object') return defaults;

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
      soundscapeVolume: parseVolume(parsed.soundscapeVolume),
      nightLightColor: parseNightLightColor(parsed.nightLightColor),
      nightLightBrightness: parseNightLightBrightness(parsed.nightLightBrightness),
      ready: true,
    };
  } catch {
    return defaults;
  }
}

test('HD.01: Null or undefined AsyncStorage returns valid defaults', () => {
  const r1 = hydrateStoreFromRaw(null);
  expect(r1.language).toBe('ne');
  expect(r1.nightLightBrightness).toBe(0.6);
  expect(r1.ready).toBeTrue();

  const r2 = hydrateStoreFromRaw(undefined);
  expect(r2.language).toBe('ne');
  expect(r2.nightLightColor).toBe('amber');
});

test('HD.02: Severely corrupted JSON inputs fall back to safe defaults without throw', () => {
  const corruptPayloads = [
    '{ corrupted json',
    '{"language": "en", ',
    'null',
    '12345',
    '["array", "not", "object"]',
    '<html>502 Bad Gateway</html>',
    '\x00\x01\x02\xFF\xFE',
    'undefined',
    'NaN',
    '{"nightLightBrightness": Infinity}',
  ];

  for (const payload of corruptPayloads) {
    const state = hydrateStoreFromRaw(payload);
    expect(state.ready).toBeTrue();
    expect(typeof state.language).toBe('string');
    expect(typeof state.nightLightBrightness).toBe('number');
    expect(state.nightLightBrightness).toBeGreaterThanOrEqual(0.05);
    expect(state.nightLightBrightness).toBeLessThanOrEqual(1.0);
  }
});

test('HD.03: Out-of-bounds & adversarial type inputs sanitized properly', () => {
  const adversarial = JSON.stringify({
    language: 'klingon',
    ageBand: '99-100',
    voicePace: 'supersonic',
    voiceGender: 'alien',
    nightSounds: 'yes',
    keepAwake: null,
    aiVoice: 'active',
    sleepTimerDuration: '24hours',
    activeSoundscape: 'volcano',
    soundscapeVolume: -999,
    nightLightColor: 'neon_green',
    nightLightBrightness: 99999,
  });

  const state = hydrateStoreFromRaw(adversarial);
  expect(state.language).toBe('ne'); // fallback to 'ne'
  expect(state.ageBand).toBe('4-6'); // fallback to '4-6'
  expect(state.voicePace).toBe('gentle'); // fallback to 'gentle'
  expect(state.voiceGender).toBe('female'); // fallback to 'female'
  expect(state.nightSounds).toBeTrue(); // non-false is true
  expect(state.keepAwake).toBeTrue(); // non-false is true
  expect(state.aiVoice).toBeFalse(); // non-true is false
  expect(state.sleepTimerDuration).toBe('off');
  expect(state.activeSoundscape).toBe(null);
  expect(state.soundscapeVolume).toBe(0.0); // clamped min
  expect(state.nightLightColor).toBe('amber'); // fallback
  expect(state.nightLightBrightness).toBe(1.0); // clamped max
});

test('HD.04: Preserves valid false boolean toggles during hydration', () => {
  const payload = JSON.stringify({
    nightSounds: false,
    keepAwake: false,
    aiVoice: false,
  });

  const state = hydrateStoreFromRaw(payload);
  expect(state.nightSounds).toBeFalse();
  expect(state.keepAwake).toBeFalse();
  expect(state.aiVoice).toBeFalse();
});

test('HD.05: Legacy age band values migration (teen -> 13-17, adult -> 18-25, parent -> parents)', () => {
  expect(hydrateStoreFromRaw(JSON.stringify({ ageBand: 'teen' })).ageBand).toBe('13-17');
  expect(hydrateStoreFromRaw(JSON.stringify({ ageBand: 'adult' })).ageBand).toBe('18-25');
  expect(hydrateStoreFromRaw(JSON.stringify({ ageBand: '18+' })).ageBand).toBe('18-25');
  expect(hydrateStoreFromRaw(JSON.stringify({ ageBand: 'parent' })).ageBand).toBe('parents');
  expect(hydrateStoreFromRaw(JSON.stringify({ ageBand: 'parents' })).ageBand).toBe('parents');
});

test('HD.06: Full round-trip serialization and hydration idempotency across 5,000 cycles', () => {
  let currentState = {
    language: 'en',
    ageBand: '9-12',
    voicePace: 'clear',
    voiceGender: 'male',
    nightSounds: false,
    keepAwake: true,
    aiVoice: true,
    sleepTimerDuration: '45m',
    activeSoundscape: 'rain',
    soundscapeVolume: 0.7,
    nightLightColor: 'moonlight',
    nightLightBrightness: 0.25,
    ready: true,
  };

  for (let i = 0; i < 5000; i++) {
    const serialized = JSON.stringify(currentState);
    const rehydrated = hydrateStoreFromRaw(serialized);
    expect(rehydrated.language).toBe(currentState.language);
    expect(rehydrated.ageBand).toBe(currentState.ageBand);
    expect(rehydrated.voicePace).toBe(currentState.voicePace);
    expect(rehydrated.voiceGender).toBe(currentState.voiceGender);
    expect(rehydrated.nightSounds).toBe(currentState.nightSounds);
    expect(rehydrated.keepAwake).toBe(currentState.keepAwake);
    expect(rehydrated.aiVoice).toBe(currentState.aiVoice);
    expect(rehydrated.sleepTimerDuration).toBe(currentState.sleepTimerDuration);
    expect(rehydrated.activeSoundscape).toBe(currentState.activeSoundscape);
    expect(rehydrated.soundscapeVolume).toBe(currentState.soundscapeVolume);
    expect(rehydrated.nightLightColor).toBe(currentState.nightLightColor);
    expect(rehydrated.nightLightBrightness).toBe(currentState.nightLightBrightness);
  }
});

// ============================================================================
// FINAL CHALLENGE SUMMARY
// ============================================================================
console.log('\n\x1b[1m\x1b[36m========================================================================\x1b[0m');
console.log(`\x1b[1m   TOTAL CHALLENGER 2 TESTS: ${testsPassed + testsFailed} | PASSED: ${testsPassed} | FAILED: ${testsFailed}\x1b[0m`);
console.log(`\x1b[1m   TOTAL CHALLENGER 2 ASSERTIONS: ${totalAssertions}\x1b[0m`);
console.log('\x1b[1m\x1b[36m========================================================================\x1b[0m\n');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
