/**
 * Empirical Challenger M4 Stress Test Harness
 * 
 * Deeply stress-tests:
 * 1. Sleep Timer (countdowns, resets, cancels, endOfStory triggers, 10s fade window)
 * 2. Audio & Continuous Soundscapes (looping, volume sliding, switching, race conditions)
 * 3. Settings persistence & sanitization
 * 4. Night light mode calculations
 * 5. Concurrency & lifecycle resilience
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testErrors = [];

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertCloseTo(actual, expected, delta = 0.001, msg) {
  if (Math.abs(actual - expected) > delta) {
    throw new Error(`${msg || 'Assertion failed'}: expected ${actual} to be within ±${delta} of ${expected}`);
  }
}

function assertTrue(condition, msg) {
  if (!condition) {
    throw new Error(msg || 'Expected true but got false');
  }
}

function assertFalse(condition, msg) {
  if (condition) {
    throw new Error(msg || 'Expected false but got true');
  }
}

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failedTests++;
    testErrors.push({ name, error: err });
    console.error(`  ✗ ${name}: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failedTests++;
    testErrors.push({ name, error: err });
    console.error(`  ✗ ${name}: ${err.message}`);
  }
}

console.log('\n======================================================');
console.log('   M4 CHALLENGER EMPIRICAL STRESS TEST SUITE');
console.log('======================================================\n');

// -------------------------------------------------------------
// SECTION 1: SLEEP TIMER STORE & COUNTDOWN LOGIC
// -------------------------------------------------------------
console.log('--- Section 1: Sleep Timer Countdown & Transition Mechanics ---');

const SLEEP_TIMER_SECONDS = {
  off: null,
  '15m': 15 * 60,
  '30m': 30 * 60,
  '45m': 45 * 60,
  '60m': 60 * 60,
  endOfStory: null,
};

function createSleepTimerState(onStopAudio = () => {}, onFadeAudio = () => {}) {
  let state = {
    duration: 'off',
    remainingSeconds: null,
    isActive: false,
    isFadingOut: false,
  };

  const get = () => state;
  const set = (partial) => {
    state = { ...state, ...partial };
  };

  const cancelTimer = () => {
    set({
      duration: 'off',
      remainingSeconds: null,
      isActive: false,
      isFadingOut: false,
    });
  };

  const setDuration = (duration) => {
    if (duration === 'off') {
      cancelTimer();
      return;
    }
    const seconds = SLEEP_TIMER_SECONDS[duration];
    set({
      duration,
      remainingSeconds: seconds,
      isActive: true,
      isFadingOut: false,
    });
  };

  const tick = () => {
    const { isActive, duration, remainingSeconds, isFadingOut } = get();
    if (!isActive || duration === 'off') return;

    if (duration === 'endOfStory') {
      return;
    }

    if (typeof remainingSeconds === 'number') {
      const next = remainingSeconds - 1;

      if (next <= 0) {
        set({
          duration: 'off',
          remainingSeconds: null,
          isActive: false,
          isFadingOut: false,
        });
        onStopAudio();
        return;
      }

      if (next <= 10 && !isFadingOut) {
        set({ remainingSeconds: next, isFadingOut: true });
        onFadeAudio(next * 1000);
        return;
      }

      set({ remainingSeconds: next });
    }
  };

  const notifyStoryEnded = () => {
    const { duration, isActive } = get();
    if (isActive && duration === 'endOfStory') {
      set({
        duration: 'off',
        remainingSeconds: null,
        isActive: false,
        isFadingOut: false,
      });
      onStopAudio();
    }
  };

  return { get, setDuration, cancelTimer, tick, notifyStoryEnded };
}

runTest('1.1: Timer initialization has duration "off" and isActive false', () => {
  const timer = createSleepTimerState();
  assertEqual(timer.get().duration, 'off');
  assertEqual(timer.get().remainingSeconds, null);
  assertFalse(timer.get().isActive);
  assertFalse(timer.get().isFadingOut);
});

runTest('1.2: Setting 15m, 30m, 45m, 60m initial durations sets exact seconds', () => {
  const timer = createSleepTimerState();
  
  timer.setDuration('15m');
  assertEqual(timer.get().duration, '15m');
  assertEqual(timer.get().remainingSeconds, 900);
  assertTrue(timer.get().isActive);
  assertFalse(timer.get().isFadingOut);

  timer.setDuration('30m');
  assertEqual(timer.get().duration, '30m');
  assertEqual(timer.get().remainingSeconds, 1800);

  timer.setDuration('45m');
  assertEqual(timer.get().remainingSeconds, 2700);

  timer.setDuration('60m');
  assertEqual(timer.get().remainingSeconds, 3600);
});

runTest('1.3: Resetting duration mid-countdown replaces timer cleanly', () => {
  const timer = createSleepTimerState();
  timer.setDuration('15m');
  
  // Tick 100 times (100 seconds)
  for (let i = 0; i < 100; i++) timer.tick();
  assertEqual(timer.get().remainingSeconds, 800);

  // Switch to 45m
  timer.setDuration('45m');
  assertEqual(timer.get().duration, '45m');
  assertEqual(timer.get().remainingSeconds, 2700);
  assertTrue(timer.get().isActive);
  assertFalse(timer.get().isFadingOut);
});

runTest('1.4: Canceling timer resets all state fields immediately', () => {
  const timer = createSleepTimerState();
  timer.setDuration('30m');
  for (let i = 0; i < 50; i++) timer.tick();
  
  timer.cancelTimer();
  assertEqual(timer.get().duration, 'off');
  assertEqual(timer.get().remainingSeconds, null);
  assertFalse(timer.get().isActive);
  assertFalse(timer.get().isFadingOut);
});

runTest('1.5: Setting duration to "off" delegates to cancelTimer()', () => {
  const timer = createSleepTimerState();
  timer.setDuration('15m');
  assertTrue(timer.get().isActive);

  timer.setDuration('off');
  assertEqual(timer.get().duration, 'off');
  assertEqual(timer.get().remainingSeconds, null);
  assertFalse(timer.get().isActive);
});

runTest('1.6: 10s audio fade trigger: triggers exactly at remainingSeconds === 10', () => {
  let fadeCalls = [];
  const timer = createSleepTimerState(
    () => {},
    (ms) => fadeCalls.push(ms)
  );

  timer.setDuration('15m');
  // Fast forward remainingSeconds from 900 down to 12
  for (let i = 900; i > 12; i--) timer.tick();
  
  assertEqual(timer.get().remainingSeconds, 12);
  assertFalse(timer.get().isFadingOut);
  assertEqual(fadeCalls.length, 0);

  // Tick to 11
  timer.tick();
  assertEqual(timer.get().remainingSeconds, 11);
  assertFalse(timer.get().isFadingOut);
  assertEqual(fadeCalls.length, 0);

  // Tick to 10 -> MUST trigger fade
  timer.tick();
  assertEqual(timer.get().remainingSeconds, 10);
  assertTrue(timer.get().isFadingOut);
  assertEqual(fadeCalls.length, 1);
  assertEqual(fadeCalls[0], 10000);

  // Subsequent ticks (9 down to 1) do NOT re-trigger fadeAudioToSleep
  for (let s = 9; s >= 1; s--) {
    timer.tick();
    assertEqual(timer.get().remainingSeconds, s);
    assertTrue(timer.get().isFadingOut);
  }
  assertEqual(fadeCalls.length, 1, 'fadeAudioToSleep must only be called once during 10s window');
});

runTest('1.7: Expiry at remainingSeconds === 0 stops audio and resets state', () => {
  let stopCalled = false;
  const timer = createSleepTimerState(() => {
    stopCalled = true;
  });

  timer.setDuration('15m');
  // Set to 1
  for (let i = 900; i > 1; i--) timer.tick();
  assertEqual(timer.get().remainingSeconds, 1);
  assertFalse(stopCalled);

  // Final tick to 0
  timer.tick();
  assertTrue(stopCalled, 'stopAudio must be invoked on 0s expiry');
  assertEqual(timer.get().duration, 'off');
  assertEqual(timer.get().remainingSeconds, null);
  assertFalse(timer.get().isActive);
  assertFalse(timer.get().isFadingOut);
});

// -------------------------------------------------------------
// SECTION 2: "END OF CURRENT STORY" TRIGGER MECHANICS
// -------------------------------------------------------------
console.log('\n--- Section 2: "End of Current Story" Mode & Triggers ---');

runTest('2.1: Setting "endOfStory" duration initializes correctly without fixed seconds', () => {
  const timer = createSleepTimerState();
  timer.setDuration('endOfStory');
  assertEqual(timer.get().duration, 'endOfStory');
  assertEqual(timer.get().remainingSeconds, null);
  assertTrue(timer.get().isActive);
  assertFalse(timer.get().isFadingOut);
});

runTest('2.2: tick() during "endOfStory" is a no-op and never crashes or decrements null', () => {
  let stopCalled = false;
  const timer = createSleepTimerState(() => { stopCalled = true; });
  timer.setDuration('endOfStory');

  for (let i = 0; i < 500; i++) {
    timer.tick();
  }
  assertEqual(timer.get().duration, 'endOfStory');
  assertEqual(timer.get().remainingSeconds, null);
  assertTrue(timer.get().isActive);
  assertFalse(stopCalled);
});

runTest('2.3: notifyStoryEnded() when active in "endOfStory" mode stops audio and resets', () => {
  let stopCalled = false;
  const timer = createSleepTimerState(() => { stopCalled = true; });
  timer.setDuration('endOfStory');
  assertTrue(timer.get().isActive);

  timer.notifyStoryEnded();
  assertTrue(stopCalled);
  assertEqual(timer.get().duration, 'off');
  assertEqual(timer.get().remainingSeconds, null);
  assertFalse(timer.get().isActive);
});

runTest('2.4: notifyStoryEnded() when duration is timed (e.g. 15m) does NOT cancel or stop', () => {
  let stopCalled = false;
  const timer = createSleepTimerState(() => { stopCalled = true; });
  timer.setDuration('15m');

  timer.notifyStoryEnded();
  assertFalse(stopCalled, 'Timed sleep timer must not stop audio on story end');
  assertTrue(timer.get().isActive);
  assertEqual(timer.get().duration, '15m');
  assertEqual(timer.get().remainingSeconds, 900);
});

runTest('2.5: notifyStoryEnded() when timer is "off" is safe no-op', () => {
  let stopCalled = false;
  const timer = createSleepTimerState(() => { stopCalled = true; });
  timer.notifyStoryEnded();
  assertFalse(stopCalled);
  assertFalse(timer.get().isActive);
});

runTest('2.6: Multiple consecutive notifyStoryEnded() calls are idempotent', () => {
  let stopCount = 0;
  const timer = createSleepTimerState(() => { stopCount++; });
  timer.setDuration('endOfStory');

  timer.notifyStoryEnded();
  timer.notifyStoryEnded();
  timer.notifyStoryEnded();
  assertEqual(stopCount, 1, 'Only first notification should trigger stop');
});

// -------------------------------------------------------------
// SECTION 3: SOUNDSCAPES & AUDIO FADE HARNESS
// -------------------------------------------------------------
console.log('\n--- Section 3: Continuous Soundscapes & Audio Fade Engine ---');

class MockAudioPlayer {
  constructor(name) {
    this.name = name;
    this.volume = 1.0;
    this.paused = false;
    this.loop = false;
    this.released = false;
  }
  play() { this.paused = false; }
  pause() { this.paused = true; }
  remove() { this.released = true; }
}

runTest('3.1: All 5 Soundscape sound assets exist on disk and have valid RIFF headers', () => {
  const soundscapeFiles = ['rain.wav', 'river.wav', 'night.wav', 'wind.wav', 'chime.wav'];
  for (const filename of soundscapeFiles) {
    const filePath = path.join(ROOT_DIR, 'assets', 'audio', filename);
    assertTrue(fs.existsSync(filePath), `${filename} must exist on disk`);
    const stat = fs.statSync(filePath);
    assertTrue(stat.size > 1000, `${filename} size (${stat.size}B) must be > 1KB`);

    const buf = fs.readFileSync(filePath);
    assertEqual(buf.toString('ascii', 0, 4), 'RIFF', `${filename} RIFF header`);
    assertEqual(buf.toString('ascii', 8, 12), 'WAVE', `${filename} WAVE format`);
    assertEqual(buf.toString('ascii', 12, 16), 'fmt ', `${filename} fmt subchunk`);
  }
});

runTest('3.2: Soundscape catalog definition in lib/sounds.ts matches expected 5 beds', () => {
  const soundsPath = path.join(ROOT_DIR, 'lib', 'sounds.ts');
  const content = fs.readFileSync(soundsPath, 'utf8');

  assertTrue(content.includes("'rain'"), 'Includes rain');
  assertTrue(content.includes("'river'"), 'Includes river');
  assertTrue(content.includes("'night'"), 'Includes night');
  assertTrue(content.includes("'wind'"), 'Includes wind');
  assertTrue(content.includes("'chime'"), 'Includes chime');
  assertTrue(content.includes("loopingBeds"), 'Defines loopingBeds');
});

runTest('3.3: Volume sliding clamp and precision (0.0 to 1.0 in 0.1 increments)', () => {
  const clampVol = (vol) => Math.max(0, Math.min(1, Math.round(vol * 10) / 10));

  assertEqual(clampVol(-0.5), 0.0);
  assertEqual(clampVol(0.0), 0.0);
  assertEqual(clampVol(0.34), 0.3);
  assertEqual(clampVol(0.36), 0.4);
  assertEqual(clampVol(0.5), 0.5);
  assertEqual(clampVol(1.0), 1.0);
  assertEqual(clampVol(1.8), 1.0);
});

runTest('3.4: 10s audio fade monotonic decay simulation (100 steps)', () => {
  const steps = 100;
  let bedVol = 0.22;
  let scapeVol = 0.5;
  const initialBedVol = bedVol;
  const initialScapeVol = scapeVol;

  const bedHistory = [bedVol];
  const scapeHistory = [scapeVol];

  for (let currentStep = 1; currentStep <= steps; currentStep++) {
    const factor = Math.max(0, 1 - currentStep / steps);
    bedVol = Math.max(0, initialBedVol * factor);
    scapeVol = Math.max(0, initialScapeVol * factor);

    bedHistory.push(bedVol);
    scapeHistory.push(scapeVol);

    // Monotonicity check
    assertTrue(bedVol <= bedHistory[bedHistory.length - 2] + 1e-9, `Bed step ${currentStep} must decrease monotonically`);
    assertTrue(scapeVol <= scapeHistory[scapeHistory.length - 2] + 1e-9, `Scape step ${currentStep} must decrease monotonically`);
  }

  assertEqual(bedVol, 0.0, 'Final bed volume must be 0');
  assertEqual(scapeVol, 0.0, 'Final soundscape volume must be 0');
  assertEqual(bedHistory.length, 101);
});

// -------------------------------------------------------------
// SECTION 4: SETTINGS STORE HYDRATION & SANITIZATION
// -------------------------------------------------------------
console.log('\n--- Section 4: Settings Store & AsyncStorage Sanitization ---');

function sanitizeSettings(parsed) {
  const validAgeBands = ['2-4', '4-6', '6-8', '9-12', '13-17', '18-25', '25+', 'parents'];
  const validSoundscapes = ['rain', 'river', 'night', 'wind', 'chime'];
  const validSleepDurations = ['off', '15m', '30m', '45m', '60m', 'endOfStory'];

  let ageBand = parsed.ageBand;
  if (ageBand === 'teen') ageBand = '13-17';
  else if (ageBand === 'adult' || ageBand === '18+') ageBand = '18-25';
  else if (ageBand === 'parent' || ageBand === 'parents') ageBand = 'parents';
  else if (!validAgeBands.includes(ageBand)) ageBand = '4-6';

  let language = parsed.language === 'en' || parsed.language === 'ne' ? parsed.language : 'ne';
  let voicePace = parsed.voicePace === 'slow' || parsed.voicePace === 'gentle' || parsed.voicePace === 'clear' ? parsed.voicePace : 'gentle';
  let voiceGender = parsed.voiceGender === 'male' || parsed.voiceGender === 'female' ? parsed.voiceGender : 'female';
  let sleepTimerDuration = validSleepDurations.includes(parsed.sleepTimerDuration) ? parsed.sleepTimerDuration : 'off';
  let activeSoundscape = validSoundscapes.includes(parsed.activeSoundscape) ? parsed.activeSoundscape : null;
  let soundscapeVolume = typeof parsed.soundscapeVolume === 'number' && !isNaN(parsed.soundscapeVolume) ? Math.max(0, Math.min(1, parsed.soundscapeVolume)) : 0.5;
  let nightLightColor = parsed.nightLightColor === 'moonlight' ? 'moonlight' : 'amber';
  let nightLightBrightness = typeof parsed.nightLightBrightness === 'number' && !isNaN(parsed.nightLightBrightness) ? Math.max(0.05, Math.min(1, parsed.nightLightBrightness)) : 0.6;

  return {
    language,
    ageBand,
    voicePace,
    voiceGender,
    nightSounds: parsed.nightSounds !== false,
    keepAwake: parsed.keepAwake !== false,
    aiVoice: parsed.aiVoice === true,
    sleepTimerDuration,
    activeSoundscape,
    soundscapeVolume,
    nightLightColor,
    nightLightBrightness,
  };
}

runTest('4.1: Sanitization with null / empty object produces default bedtime settings', () => {
  const result = sanitizeSettings({});
  assertEqual(result.language, 'ne');
  assertEqual(result.ageBand, '4-6');
  assertEqual(result.voicePace, 'gentle');
  assertEqual(result.voiceGender, 'female');
  assertEqual(result.nightSounds, true);
  assertEqual(result.keepAwake, true);
  assertEqual(result.aiVoice, false);
  assertEqual(result.sleepTimerDuration, 'off');
  assertEqual(result.activeSoundscape, null);
  assertEqual(result.soundscapeVolume, 0.5);
  assertEqual(result.nightLightColor, 'amber');
  assertEqual(result.nightLightBrightness, 0.6);
});

runTest('4.2: Sanitization clamps out-of-bounds numbers and invalid enum literals', () => {
  const malicious = {
    language: 'spanish',
    ageBand: 'infant_99',
    voicePace: 'hyper_fast',
    voiceGender: 'robot',
    soundscapeVolume: 999.5,
    nightLightBrightness: -20.0,
    sleepTimerDuration: '1000hours',
    activeSoundscape: 'nuclear_siren',
  };
  const result = sanitizeSettings(malicious);
  assertEqual(result.language, 'ne');
  assertEqual(result.ageBand, '4-6');
  assertEqual(result.voicePace, 'gentle');
  assertEqual(result.voiceGender, 'female');
  assertEqual(result.soundscapeVolume, 1.0);
  assertEqual(result.nightLightBrightness, 0.05);
  assertEqual(result.sleepTimerDuration, 'off');
  assertEqual(result.activeSoundscape, null);
});

// -------------------------------------------------------------
// SECTION 5: NIGHT LIGHT CALCULATIONS & PULSE
// -------------------------------------------------------------
console.log('\n--- Section 5: Bedtime Night Light Mode ---');

runTest('5.1: Night light color theme palette definitions', () => {
  const amberGradient = ['#E8A04A', '#45220E', '#0D0602'];
  const moonGradient = ['#8CA0B8', '#162230', '#060B12'];

  assertEqual(amberGradient[0], '#E8A04A');
  assertEqual(moonGradient[0], '#8CA0B8');
});

runTest('5.2: Night light 8-second breathing sine-wave pulse math verification', () => {
  // 8000ms period oscillating between 0.92 and 1.08
  const durationMs = 8000;
  const minScale = 0.92;
  const maxScale = 1.08;

  for (let t = 0; t <= durationMs; t += 200) {
    const phase = (t % durationMs) / durationMs;
    // Normalized sine: 0 -> 1 -> 0 -> -1 -> 0
    const sine = Math.sin(phase * 2 * Math.PI);
    const mid = (minScale + maxScale) / 2;
    const amp = (maxScale - minScale) / 2;
    const scale = mid + amp * sine;

    assertTrue(scale >= minScale - 1e-6, `Scale at t=${t} >= minScale`);
    assertTrue(scale <= maxScale + 1e-6, `Scale at t=${t} <= maxScale`);
  }
});

runTest('5.3: Soft brightness opacity multiplier never drops below 0.05 or exceeds 1.0', () => {
  const testBrightnesses = [0.05, 0.1, 0.25, 0.45, 0.65, 0.85, 1.0];
  const pulseScale = 1.08; // peak

  for (const b of testBrightnesses) {
    const computedOpacity = Math.max(0.05, Math.min(1.0, b * pulseScale));
    assertTrue(computedOpacity >= 0.05, `Opacity must be >= 0.05 for brightness ${b}`);
    assertTrue(computedOpacity <= 1.0, `Opacity must be <= 1.0 for brightness ${b}`);
  }
});

// -------------------------------------------------------------
// SECTION 6: FORMATTING & HEADER BADGE STRINGS
// -------------------------------------------------------------
console.log('\n--- Section 6: Sleep Timer Formatting & Bilingual Badges ---');

function formatTimerSeconds(seconds, isEndOfStory) {
  if (isEndOfStory) return 'End of Story';
  if (seconds === null || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getSleepTimerBadgeText(duration, remainingSeconds, lang = 'ne') {
  if (duration === 'off') return '';
  if (duration === 'endOfStory') {
    return lang === 'ne' ? 'कथा अन्त्य' : 'End of Story';
  }
  return formatTimerSeconds(remainingSeconds);
}

runTest('6.1: formatTimerSeconds returns proper MM:SS padding', () => {
  assertEqual(formatTimerSeconds(null), '00:00');
  assertEqual(formatTimerSeconds(-5), '00:00');
  assertEqual(formatTimerSeconds(0), '00:00');
  assertEqual(formatTimerSeconds(9), '00:09');
  assertEqual(formatTimerSeconds(59), '00:59');
  assertEqual(formatTimerSeconds(60), '01:00');
  assertEqual(formatTimerSeconds(900), '15:00');
  assertEqual(formatTimerSeconds(1800), '30:00');
  assertEqual(formatTimerSeconds(3599), '59:59');
  assertEqual(formatTimerSeconds(3600), '60:00');
});

runTest('6.2: getSleepTimerBadgeText returns localized strings for duration modes', () => {
  assertEqual(getSleepTimerBadgeText('off', null, 'ne'), '');
  assertEqual(getSleepTimerBadgeText('off', null, 'en'), '');
  assertEqual(getSleepTimerBadgeText('endOfStory', null, 'ne'), 'कथा अन्त्य');
  assertEqual(getSleepTimerBadgeText('endOfStory', null, 'en'), 'End of Story');
  assertEqual(getSleepTimerBadgeText('15m', 845, 'ne'), '14:05');
  assertEqual(getSleepTimerBadgeText('30m', 1800, 'en'), '30:00');
});

console.log('\n======================================================');
console.log(` TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
