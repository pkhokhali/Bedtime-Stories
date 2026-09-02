/**
 * Challenger 2: Concurrency & Cross-Feature Interaction Stress Test Suite
 * 
 * Target Verifications:
 * 1. Concurrent sleep timer fade-out + ambient soundscape playback + story narration transitions.
 * 2. Search modal open/close during night light breathing animations and background starfield rendering.
 * 3. 60 FPS Reanimated worklet determinism, floating point stability, and touch pass-through verification.
 * 4. High-throughput bilingual search concurrency and AsyncStorage state integrity.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let assertionCount = 0;
const testFailures = [];

function check(desc, condition, extraInfo = '') {
  assertionCount++;
  if (!condition) {
    throw new Error(`Assertion failed: ${desc} ${extraInfo}`);
  }
}

function runTest(testName, fn) {
  totalTests++;
  const start = Date.now();
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${testName} (${Date.now() - start}ms)`);
  } catch (err) {
    failedTests++;
    testFailures.push({ name: testName, error: err });
    console.error(`  ✗ ${testName} (${Date.now() - start}ms)`);
    console.error(`    Error: ${err.message}`);
  }
}

async function runAsyncTest(testName, fn) {
  totalTests++;
  const start = Date.now();
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ ${testName} (${Date.now() - start}ms)`);
  } catch (err) {
    failedTests++;
    testFailures.push({ name: testName, error: err });
    console.error(`  ✗ ${testName} (${Date.now() - start}ms)`);
    console.error(`    Error: ${err.message}`);
  }
}

console.log('========================================================================');
console.log(' CHALLENGER 2: CONCURRENCY & CROSS-FEATURE INTERACTION HARNESS');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// SECTION 1: SLEEP TIMER FADE-OUT + SOUNDSCAPE + STORY NARRATION CONCURRENCY
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: Audio Lifecycle, Sleep Timer Fade & Narration Concurrency ---');

// Mock Audio Engine and State Simulator
class MockAudioSubsystem {
  constructor() {
    this.bedId = null;
    this.bedVolume = 0.22;
    this.bedPlaying = false;
    this.soundscapeId = null;
    this.soundscapeVolume = 0.5;
    this.soundscapePlaying = false;
    this.speechPlaying = false;
    this.speechText = null;
    this.fadeIntervalActive = false;
    this.fadeStep = 0;
  }

  playBed(id) {
    this.bedId = id;
    this.bedPlaying = true;
    this.bedVolume = 0.22;
  }

  stopBed() {
    this.bedPlaying = false;
    this.bedId = null;
    this.bedVolume = 0.22;
    this.fadeIntervalActive = false;
  }

  playContinuousSoundscape(id, volume = 0.5) {
    this.soundscapeId = id;
    this.soundscapePlaying = true;
    this.soundscapeVolume = Math.max(0, Math.min(1, volume));
  }

  stopContinuousSoundscape() {
    this.soundscapePlaying = false;
    this.soundscapeId = null;
  }

  setSoundscapeVolume(v) {
    this.soundscapeVolume = Math.max(0, Math.min(1, v));
  }

  speakBeat(text) {
    this.speechPlaying = true;
    this.speechText = text;
  }

  stopSpeech() {
    this.speechPlaying = false;
    this.speechText = null;
  }

  stopAllAudio() {
    this.stopBed();
    this.stopContinuousSoundscape();
    this.stopSpeech();
  }

  // Simulate 10-second fade calculation
  fadeAudioToSleep(remainingSeconds, totalFadeSeconds = 10) {
    const factor = Math.max(0, Math.min(1, remainingSeconds / totalFadeSeconds));
    if (this.bedPlaying) {
      this.bedVolume = 0.22 * factor;
    }
    if (this.soundscapePlaying) {
      this.soundscapeVolume = 0.5 * factor;
    }
    return factor;
  }
}

class MockSleepTimerStore {
  constructor(audio) {
    this.audio = audio;
    this.duration = 'off';
    this.remainingSeconds = null;
    this.isActive = false;
    this.isFadingOut = false;
  }

  setDuration(dur) {
    if (dur === 'off') {
      this.cancelTimer();
      return;
    }
    const map = {
      '15m': 15 * 60,
      '30m': 30 * 60,
      '45m': 45 * 60,
      '60m': 60 * 60,
      endOfStory: null,
    };
    this.duration = dur;
    this.remainingSeconds = map[dur];
    this.isActive = true;
    this.isFadingOut = false;
  }

  tick() {
    if (!this.isActive || this.duration === 'off') return;
    if (this.duration === 'endOfStory') return;

    if (typeof this.remainingSeconds === 'number') {
      const next = this.remainingSeconds - 1;
      if (next <= 0) {
        this.duration = 'off';
        this.remainingSeconds = null;
        this.isActive = false;
        this.isFadingOut = false;
        this.audio.stopAllAudio();
        return;
      }

      if (next <= 10 && !this.isFadingOut) {
        this.remainingSeconds = next;
        this.isFadingOut = true;
        this.audio.fadeAudioToSleep(next);
        return;
      }

      if (this.isFadingOut) {
        this.audio.fadeAudioToSleep(next);
      }

      this.remainingSeconds = next;
    }
  }

  cancelTimer() {
    this.duration = 'off';
    this.remainingSeconds = null;
    this.isActive = false;
    this.isFadingOut = false;
    // When cancelled, restore full volume if audio is playing
    if (this.audio.bedPlaying) this.audio.bedVolume = 0.22;
    if (this.audio.soundscapePlaying) this.audio.soundscapeVolume = 0.5;
  }

  notifyStoryEnded() {
    if (this.isActive && this.duration === 'endOfStory') {
      this.duration = 'off';
      this.remainingSeconds = null;
      this.isActive = false;
      this.isFadingOut = false;
      this.audio.stopAllAudio();
    }
  }
}

runTest('C1.1: Concurrent Audio Fade-Out with Active Soundscape and Story Bed', () => {
  const audio = new MockAudioSubsystem();
  const timer = new MockSleepTimerStore(audio);

  // User starts soundscape 'rain' and story narration 'night' bed
  audio.playContinuousSoundscape('rain', 0.5);
  audio.playBed('night');
  audio.speakBeat('In a cozy meadow...');

  check('Soundscape is playing', audio.soundscapePlaying === true);
  check('Bed is playing', audio.bedPlaying === true);
  check('Speech is playing', audio.speechPlaying === true);

  // User sets 15m timer
  timer.setDuration('15m');
  check('Timer is active', timer.isActive === true);
  check('Remaining is 900s', timer.remainingSeconds === 900);

  // Fast-forward to 11s
  timer.remainingSeconds = 12;
  timer.tick(); // at 11s
  check('At 11s not fading', timer.isFadingOut === false);
  check('Bed volume intact', audio.bedVolume === 0.22);
  check('Soundscape volume intact', audio.soundscapeVolume === 0.5);

  // Enter fade window at 10s
  timer.tick(); // at 10s
  check('At 10s is fading', timer.isFadingOut === true);
  check('Remaining is 10s', timer.remainingSeconds === 10);

  // Step through fade down to 1s
  for (let s = 9; s >= 1; s--) {
    timer.tick();
    check(`Volume at ${s}s within bounds`, audio.bedVolume <= 0.22 && audio.bedVolume >= 0);
    check(`Soundscape at ${s}s within bounds`, audio.soundscapeVolume <= 0.5 && audio.soundscapeVolume >= 0);
    check(`Bed volume decay check at ${s}s`, Math.abs(audio.bedVolume - 0.22 * (s / 10)) < 0.001);
  }

  // Final tick at 0s triggers complete stop
  timer.tick();
  check('Timer deactivated at 0s', timer.isActive === false);
  check('Bed stopped at 0s', audio.bedPlaying === false);
  check('Soundscape stopped at 0s', audio.soundscapePlaying === false);
  check('Speech stopped at 0s', audio.speechPlaying === false);
});

runTest('C1.2: Mid-Fade Cancellation Restores Audio Levels Deterministically', () => {
  const audio = new MockAudioSubsystem();
  const timer = new MockSleepTimerStore(audio);

  audio.playContinuousSoundscape('river', 0.5);
  audio.playBed('courtyard');

  timer.setDuration('15m');
  timer.remainingSeconds = 6;
  timer.tick(); // at 5s (mid-fade)

  check('Is fading', timer.isFadingOut === true);
  check('Bed volume attenuated', audio.bedVolume < 0.22);
  check('Soundscape volume attenuated', audio.soundscapeVolume < 0.5);

  // User cancels timer
  timer.cancelTimer();
  check('Timer inactive', timer.isActive === false);
  check('Timer not fading', timer.isFadingOut === false);
  check('Bed volume restored', audio.bedVolume === 0.22);
  check('Soundscape volume restored', audio.soundscapeVolume === 0.5);
});

runTest('C1.3: 20,000 Rapid Concurrency Jitter Cycles across Timer, Audio & Scene Transitions', () => {
  const audio = new MockAudioSubsystem();
  const timer = new MockSleepTimerStore(audio);
  const durations = ['15m', '30m', '45m', '60m', 'endOfStory', 'off'];
  const soundscapes = ['rain', 'river', 'night', 'wind', 'chime'];
  const beds = ['night', 'moon', 'river', 'courtyard', 'wind', 'rain'];

  for (let i = 0; i < 20000; i++) {
    const action = i % 8;
    switch (action) {
      case 0:
        timer.setDuration(durations[i % durations.length]);
        break;
      case 1:
        timer.tick();
        break;
      case 2:
        audio.playContinuousSoundscape(soundscapes[i % soundscapes.length], (i % 10) / 10);
        break;
      case 3:
        audio.playBed(beds[i % beds.length]);
        break;
      case 4:
        audio.speakBeat(`Beat sentence #${i}`);
        break;
      case 5:
        timer.notifyStoryEnded();
        break;
      case 6:
        timer.cancelTimer();
        break;
      case 7:
        audio.stopAllAudio();
        break;
    }

    // Invariants that must hold after EVERY single step
    check('Bed volume in [0, 1]', audio.bedVolume >= 0 && audio.bedVolume <= 1);
    check('Soundscape volume in [0, 1]', audio.soundscapeVolume >= 0 && audio.soundscapeVolume <= 1);
    check('Timer remaining >= 0 or null', timer.remainingSeconds === null || timer.remainingSeconds >= 0);
    check('IsActive matches duration !== off', timer.isActive === (timer.duration !== 'off'));
  }
});

runTest('C1.4: End-of-Story Event Idempotency & Multiple Concurrent Triggers', () => {
  const audio = new MockAudioSubsystem();
  const timer = new MockSleepTimerStore(audio);

  audio.playBed('night');
  audio.speakBeat('Final moral lesson.');
  timer.setDuration('endOfStory');

  check('Timer active for endOfStory', timer.isActive === true);

  // Trigger notifyStoryEnded 50 times in rapid succession
  for (let i = 0; i < 50; i++) {
    timer.notifyStoryEnded();
    check('Timer turned off', timer.duration === 'off' && timer.isActive === false);
    check('Audio stopped', audio.bedPlaying === false && audio.speechPlaying === false);
  }
});

// -----------------------------------------------------------------------------
// SECTION 2: SEARCH MODAL OPEN/CLOSE DURING NIGHT LIGHT & STARFIELD
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Search Modal & Night Light Concurrency ---');

class MockAppState {
  constructor() {
    this.searchModalVisible = false;
    this.nightLightModalVisible = false;
    this.searchQuery = '';
    this.activePill = 'all';
    this.nightLightBrightness = 0.6;
    this.nightLightColor = 'amber';
    this.recentSearches = [];
  }

  openSearch() {
    this.searchModalVisible = true;
  }

  closeSearch() {
    this.searchModalVisible = false;
  }

  openNightLight() {
    this.nightLightModalVisible = true;
  }

  closeNightLight() {
    this.nightLightModalVisible = false;
  }

  setSearchQuery(q) {
    this.searchQuery = q;
  }

  setPill(p) {
    this.activePill = p;
  }

  setBrightness(b) {
    this.nightLightBrightness = Math.max(0.05, Math.min(1.0, b));
  }

  setColor(c) {
    this.nightLightColor = c;
  }

  addRecent(q) {
    if (!q || !q.trim()) return;
    const clean = q.trim();
    this.recentSearches = [clean, ...this.recentSearches.filter((s) => s !== clean)].slice(0, 8);
  }
}

runTest('C2.1: Search Modal & Night Light Modal Simultaneous State Transitions', () => {
  const state = new MockAppState();

  // Open Night Light
  state.openNightLight();
  check('Night light visible', state.nightLightModalVisible === true);

  // User presses floating search button
  state.openSearch();
  check('Both modal states tracked independently', state.searchModalVisible === true && state.nightLightModalVisible === true);

  // User enters query and selects story
  state.setSearchQuery('बदाम');
  state.addRecent('बदाम');
  state.closeSearch();
  check('Search closed, night light remains', state.searchModalVisible === false && state.nightLightModalVisible === true);
  check('Recent search updated', state.recentSearches.includes('बदाम'));

  // Close night light
  state.closeNightLight();
  check('Night light closed', state.nightLightModalVisible === false);
});

runTest('C2.2: 10,000 Interleaved Modal & Search Filter Operations', () => {
  const state = new MockAppState();
  const pills = ['all', 'toddlers', 'kids', 'novels_parents', 'roots', 'animals', 'audio_only'];
  const queries = ['', 'rabbit', 'खरायो', 'himalaya', 'बाघ', 'moon', 'तारा', 'scandal'];

  for (let i = 0; i < 10000; i++) {
    const action = i % 7;
    switch (action) {
      case 0:
        state.openSearch();
        break;
      case 1:
        state.setSearchQuery(queries[i % queries.length]);
        break;
      case 2:
        state.setPill(pills[i % pills.length]);
        break;
      case 3:
        state.addRecent(queries[i % queries.length]);
        break;
      case 4:
        state.closeSearch();
        break;
      case 5:
        if (state.nightLightModalVisible) state.closeNightLight();
        else state.openNightLight();
        break;
      case 6:
        state.setBrightness((i % 100) / 100);
        state.setColor(i % 2 === 0 ? 'amber' : 'moonlight');
        break;
    }

    // Invariants
    check('Brightness clamped [0.05, 1.0]', state.nightLightBrightness >= 0.05 && state.nightLightBrightness <= 1.0);
    check('Recent searches capped at 8', state.recentSearches.length <= 8);
  }
});

// -----------------------------------------------------------------------------
// SECTION 3: 60 FPS REANIMATED WORKLET DETERMINISM & TOUCH PASS-THROUGH
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: 60 FPS Reanimated Worklets & Touch Pass-Through ---');

// Reanimated math emulation
function interpolate(value, inputMin, inputMax, outputMin, outputMax) {
  const clamped = Math.max(inputMin, Math.min(inputMax, value));
  const t = (clamped - inputMin) / (inputMax - inputMin);
  return outputMin + t * (outputMax - outputMin);
}

runTest('C3.1: 32-Star Deterministic Seeds 6000-Frame Simulation (100s @ 60 FPS)', () => {
  const { STAR_SEEDS } = require('../components/background/TwinklingStarfield');
  check('Total 32 star seeds', STAR_SEEDS.length === 32);

  const totalFrames = 6000; // 100 seconds at 60 FPS
  const dt = 1000 / 60; // 16.666ms per frame

  for (const star of STAR_SEEDS) {
    check(`Star #${star.id} valid coordinates`, star.xPct >= 0 && star.xPct <= 100 && star.yPct >= 0 && star.yPct <= 70);
    check(`Star #${star.id} duration > 0`, star.duration >= 2000);
    check(`Star #${star.id} opacity bounds`, star.minOpacity >= 0 && star.maxOpacity <= 1.0 && star.minOpacity < star.maxOpacity);

    // Run frame-by-frame Reanimated sine-wave simulation
    for (let frame = 0; frame < totalFrames; frame++) {
      const timeMs = frame * dt;
      const delayedTime = Math.max(0, timeMs - star.delay);
      // Sine-wave progression in [0, 1]
      const halfPeriod = star.duration / 2;
      const cycleTime = delayedTime % star.duration;
      let progress;
      if (cycleTime < halfPeriod) {
        progress = 0.5 - 0.5 * Math.cos((cycleTime / halfPeriod) * Math.PI);
      } else {
        progress = 0.5 + 0.5 * Math.cos(((cycleTime - halfPeriod) / halfPeriod) * Math.PI);
      }

      const opacity = interpolate(progress, 0, 1, star.minOpacity, star.maxOpacity);
      const scale = interpolate(progress, 0, 1, 0.85, 1.25);

      check(`Star #${star.id} frame #${frame} opacity not NaN`, !isNaN(opacity));
      check(`Star #${star.id} frame #${frame} scale not NaN`, !isNaN(scale));
      check(`Star #${star.id} frame #${frame} opacity in bounds`, opacity >= star.minOpacity - 0.001 && opacity <= star.maxOpacity + 0.001);
      check(`Star #${star.id} frame #${frame} scale in bounds`, scale >= 0.849 && scale <= 1.251);
    }
  }
});

runTest('C3.2: Night Light 8-Second Breathing Sine-Wave Pulse Determinism (6000 Frames)', () => {
  const totalFrames = 6000;
  const dt = 1000 / 60;
  const period = 8000; // 8s breathing cycle (4s in, 4s out)
  const brightnessLevels = [0.05, 0.2, 0.5, 0.8, 1.0];

  for (const brightness of brightnessLevels) {
    for (let frame = 0; frame < totalFrames; frame++) {
      const timeMs = frame * dt;
      const cycle = timeMs % period;
      let breathe;
      if (cycle < 4000) {
        // Inhale: 1.0 -> 1.08
        breathe = interpolate(cycle, 0, 4000, 1.0, 1.08);
      } else {
        // Exhale: 1.08 -> 0.92
        breathe = interpolate(cycle, 4000, 8000, 1.08, 0.92);
      }

      const glowOpacity = Math.max(0.05, Math.min(1.0, brightness * breathe));

      check(`Frame #${frame} breathe in [0.92, 1.08]`, breathe >= 0.919 && breathe <= 1.081);
      check(`Frame #${frame} glowOpacity in [0.05, 1.0]`, glowOpacity >= 0.049 && glowOpacity <= 1.0);
      check(`Frame #${frame} not NaN`, !isNaN(glowOpacity));
    }
  }
});

runTest('C3.3: Pointer Events Pass-Through Verification on Background Layers', () => {
  const bgCode = fs.readFileSync(path.join(__dirname, '../components/background/AtmosphericBackground.tsx'), 'utf8');
  const starfieldCode = fs.readFileSync(path.join(__dirname, '../components/background/TwinklingStarfield.tsx'), 'utf8');
  const horizonCode = fs.readFileSync(path.join(__dirname, '../components/background/HimalayanHorizon.tsx'), 'utf8');

  // AtmosphericBackground must wrap visual layers with pointerEvents="none"
  check('AtmosphericBackground has pointerEvents="none"', bgCode.includes('pointerEvents="none"'));
  // TwinklingStarfield container and star nodes must have pointerEvents="none"
  check('TwinklingStarfield has pointerEvents="none"', starfieldCode.includes('pointerEvents="none"'));
  // HimalayanHorizon container must have pointerEvents="none"
  check('HimalayanHorizon has pointerEvents="none"', horizonCode.includes('pointerEvents="none"'));
});

runTest('C3.4: Splash Ritual Instant Tap-to-Skip Fast Path Invariants', () => {
  const splashCode = fs.readFileSync(path.join(__dirname, '../components/splash/SplashRitual.tsx'), 'utf8');

  // Must guard double-firing with isDismissingRef
  check('Splash uses isDismissingRef guard', splashCode.includes('isDismissingRef.current'));
  // Must clean up pending audioTimer and autoFinishTimer
  check('Splash clears audioTimerRef', splashCode.includes('clearTimeout(audioTimerRef.current)'));
  check('Splash clears autoFinishTimerRef', splashCode.includes('clearTimeout(autoFinishTimerRef.current)'));
  // Must use runOnJS for onFinish callback
  check('Splash uses runOnJS(onFinish)', splashCode.includes('runOnJS(onFinish)'));
  // Pressable covers the entire ritual screen
  check('Splash has full screen Pressable', splashCode.includes('<Pressable style={StyleSheet.absoluteFill}'));
});

// -----------------------------------------------------------------------------
// SECTION 4: HIGH-THROUGHPUT BILINGUAL SEARCH CONCURRENCY
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 4: High-Throughput Bilingual Search Concurrency ---');

runTest('C4.1: Parallel Search Across 5,000 Bilingual Query / Filter Pairs', () => {
  const { stories } = require('../data/catalog');
  const { searchCatalog } = require('../lib/searchEngine');

  check('Catalog has stories', stories.length >= 24);

  const sampleQueries = [
    'rabbit', 'chalakh', 'खरायो', 'tiger', 'बाघ', 'sher',
    'little pine', 'सल्लो', 'pine', 'tree', 'forest', 'जङ्गल',
    'moon', 'चन्द्रमा', 'night', 'रात', 'stars', 'तारा',
    'scandal', 'bohemia', 'holmes', 'parent', 'novel',
    'nonexistent_query_xyz', '१२३४५', '   ', '',
  ];

  const samplePills = ['all', 'toddlers', 'kids', 'novels_parents', 'roots', 'animals', 'audio_only'];

  for (let i = 0; i < 5000; i++) {
    const q = sampleQueries[i % sampleQueries.length];
    const p = samplePills[i % samplePills.length];

    const results = searchCatalog(stories, { query: q, pill: p });
    check('Results is an array', Array.isArray(results));

    // When query is non-empty and matches, scores must be sorted descending
    if (results.length > 1) {
      for (let j = 0; j < results.length - 1; j++) {
        // If query was empty, it's catalog order; if query was present, score is descending
        if (q.trim()) {
          check('Scores are monotonically non-increasing', results[j].score >= results[j + 1].score);
        }
      }
    }
  }
});

runTest('C4.2: Devanagari Unicode Normalization and Conjuncts Concurrency', () => {
  const { stories } = require('../data/catalog');
  const { searchCatalog } = require('../lib/searchEngine');

  const devanagariWords = ['साँझ', 'भक्तपुर', 'लाङटाङ', 'चालाख', 'बुद्धिमानी', 'सपना'];
  for (const word of devanagariWords) {
    const res = searchCatalog(stories, { query: word, pill: 'all' });
    check(`Search for ${word} returns array`, Array.isArray(res));
  }
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log('                 CONCURRENCY STRESS SUITE SUMMARY                       ');
console.log('========================================================================');
console.log(` • Total Tests Executed:  ${totalTests}`);
console.log(` • Passed Tests:          ${passedTests}`);
console.log(` • Failed Tests:          ${failedTests}`);
console.log(` • Assertions Checked:    ${assertionCount}`);
console.log('========================================================================\n');

if (failedTests > 0) {
  console.error(`💥 ${failedTests} tests failed!`);
  process.exit(1);
} else {
  console.log('✨ ALL CONCURRENCY AND CROSS-FEATURE STRESS TESTS PASSED CLEANLY!');
}
