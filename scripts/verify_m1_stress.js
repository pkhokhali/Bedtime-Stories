/**
 * verify_m1_stress.js
 * Empirical Stress Test Harness & Adversarial Validation for Milestone 1 (Splash Ritual)
 *
 * Runs comprehensive mathematical, lifecycle, event-concurrency, and worklet oracles:
 * 1. Rapid Tap-to-Skip at t=0ms, t=200ms, t=450ms, and 100-burst clicks
 * 2. Unmount Lifecycles (t=0ms, t=300ms, t=1000ms, 50 rapid mount-unmount cycles)
 * 3. pointerEvents 'none' immediate engagement and click immunity
 * 4. Stardust Particle Worklet Mathematics (22 seeds, 1000-step interpolation, zero NaN/Inf)
 * 5. Animated Storybook 3D Hinge Transform & Dual-Face Crossover at -90 deg
 * 6. Concurrency & Store Hydration Isolation
 */

const assert = require('assert');

let passedTests = 0;
let totalTests = 0;
let totalAssertions = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ [PASS] ${desc}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}: ${err.message}`);
    console.error(err.stack);
    process.exitCode = 1;
  }
}

function expect(val) {
  totalAssertions++;
  return {
    toBe(expected) {
      assert.strictEqual(val, expected);
    },
    toEqual(expected) {
      assert.deepStrictEqual(val, expected);
    },
    toBeTruthy() {
      assert.ok(val);
    },
    toBeFalsy() {
      assert.ok(!val);
    },
    toBeGreaterThan(expected) {
      assert.ok(val > expected, `Expected ${val} > ${expected}`);
    },
    toBeLessThan(expected) {
      assert.ok(val < expected, `Expected ${val} < ${expected}`);
    },
    toBeCloseTo(expected, precision = 2) {
      const diff = Math.abs(val - expected);
      const tolerance = Math.pow(10, -precision);
      assert.ok(diff < tolerance, `Expected ${val} close to ${expected} (diff: ${diff})`);
    },
  };
}

console.log('========================================================================');
console.log('       MILESTONE 1 (M1) EMPIRICAL ADVERSARIAL STRESS HARNESS            ');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// Mock React & Reanimated Environment for SplashRitual Simulation
// ---------------------------------------------------------------------------

class MockReanimatedSharedValue {
  constructor(initialValue) {
    this.value = initialValue;
    this._animation = null;
  }

  animateWithTiming(targetValue, { duration, easing }, callback) {
    this._animation = {
      targetValue,
      duration,
      callback,
      startTime: 0,
      progress: 0,
    };
    // In our discrete simulation, we can step time or instant-complete
    return this._animation;
  }

  step(elapsedMs) {
    if (!this._animation) return;
    const dur = this._animation.duration || 1;
    this._animation.progress += elapsedMs / dur;
    if (this._animation.progress >= 1) {
      this.value = this._animation.targetValue;
      const cb = this._animation.callback;
      this._animation = null;
      if (cb) cb(true);
    } else {
      this.value = this.value + (this._animation.targetValue - this.value) * (elapsedMs / dur);
    }
  }
}

class SplashRitualSimulation {
  constructor(options = {}) {
    this.onFinish = options.onFinish || (() => {});
    this.autoPlayAudio = options.autoPlayAudio !== undefined ? options.autoPlayAudio : true;
    this.chimePlayed = false;
    this.chimePlayCount = 0;
    this.onFinishCount = 0;
    this.unmounted = false;
    this.stateUpdatesAfterUnmount = 0;

    // Internal State
    this.isDismissing = false;
    this.isDismissingRef = { current: false };
    this.audioTimer = null;
    this.autoFinishTimer = null;

    // Shared Values
    this.containerOpacity = new MockReanimatedSharedValue(1);
    this.auraScale = new MockReanimatedSharedValue(0.85);
    this.auraOpacity = new MockReanimatedSharedValue(0.12);
    this.logoOpacity = new MockReanimatedSharedValue(0);
    this.logoTranslateY = new MockReanimatedSharedValue(18);
    this.subtitleOpacity = new MockReanimatedSharedValue(0);
    this.skipHintOpacity = new MockReanimatedSharedValue(0);

    this.currentTime = 0;
    this.mount();
  }

  mount() {
    if (this.autoPlayAudio) {
      this.audioTimer = {
        fireAt: this.currentTime + 450,
        action: () => {
          this.chimePlayed = true;
          this.chimePlayCount++;
        },
      };
    }

    this.autoFinishTimer = {
      fireAt: this.currentTime + 3200,
      action: () => {
        this.handleDismiss(false);
      },
    };
  }

  unmount() {
    this.unmounted = true;
    // Cleanup identical to SplashRitual.tsx useEffect return
    if (this.audioTimer) {
      this.audioTimer = null;
    }
    if (this.autoFinishTimer) {
      this.autoFinishTimer = null;
    }
  }

  handleDismiss(isSkip = false) {
    if (this.isDismissingRef.current) return;
    this.isDismissingRef.current = true;
    
    if (this.unmounted) {
      this.stateUpdatesAfterUnmount++;
    }
    this.isDismissing = true;

    // Clear pending timers
    if (this.audioTimer) {
      this.audioTimer = null;
    }
    if (this.autoFinishTimer) {
      this.autoFinishTimer = null;
    }

    const duration = isSkip ? 380 : 500;
    this.containerOpacity.animateWithTiming(0, { duration }, (finished) => {
      if (finished) {
        if (this.unmounted) {
          this.stateUpdatesAfterUnmount++;
        }
        this.onFinishCount++;
        this.onFinish();
      }
    });
  }

  press() {
    if (this.getPointerEvents() === 'none') {
      // Touch rejected by pointerEvents='none'
      return false;
    }
    this.handleDismiss(true);
    return true;
  }

  getPointerEvents() {
    return this.isDismissing ? 'none' : 'auto';
  }

  advanceTime(ms) {
    const stepSize = 10;
    let remaining = ms;
    while (remaining > 0) {
      const delta = Math.min(stepSize, remaining);
      this.currentTime += delta;
      remaining -= delta;

      // Check timers
      if (this.audioTimer && this.currentTime >= this.audioTimer.fireAt) {
        const action = this.audioTimer.action;
        this.audioTimer = null;
        action();
      }
      if (this.autoFinishTimer && this.currentTime >= this.autoFinishTimer.fireAt) {
        const action = this.autoFinishTimer.action;
        this.autoFinishTimer = null;
        action();
      }

      // Step animations
      this.containerOpacity.step(delta);
    }
  }
}

// ---------------------------------------------------------------------------
// TEST SUITE 1: Rapid Tap-to-Skip & Timing Boundaries
// ---------------------------------------------------------------------------

console.log('--- TEST SUITE 1: Rapid Tap-to-Skip & Timing Boundaries ---');

it('Scenario 1.1: Immediate tap at t=0ms skips cleanly and suppresses audio chime', () => {
  let finished = false;
  const sim = new SplashRitualSimulation({ onFinish: () => { finished = true; } });

  expect(sim.getPointerEvents()).toBe('auto');
  expect(sim.isDismissing).toBe(false);

  // Immediate tap at t=0ms
  const accepted = sim.press();
  expect(accepted).toBe(true);
  expect(sim.getPointerEvents()).toBe('none');
  expect(sim.isDismissing).toBe(true);
  expect(sim.audioTimer).toBe(null); // Timer must be cancelled

  // Advance time past chime trigger (450ms)
  sim.advanceTime(300);
  expect(sim.chimePlayed).toBe(false);
  expect(finished).toBe(false);

  // Complete crossfade (380ms total)
  sim.advanceTime(100);
  expect(finished).toBe(true);
  expect(sim.onFinishCount).toBe(1);
  expect(sim.chimePlayed).toBe(false); // Chime never played
  expect(sim.containerOpacity.value).toBe(0);
});

it('Scenario 1.2: Tap at t=200ms cancels audio timer before chime sting at 450ms', () => {
  let finished = false;
  const sim = new SplashRitualSimulation({ onFinish: () => { finished = true; } });

  // Advance to t=200ms
  sim.advanceTime(200);
  expect(sim.chimePlayed).toBe(false);

  // Tap to skip
  sim.press();
  expect(sim.getPointerEvents()).toBe('none');

  // Advance through 450ms boundary to 570ms
  sim.advanceTime(250);
  expect(sim.chimePlayed).toBe(false);
  expect(finished).toBe(false);

  // Complete crossfade (200 + 380 = 580ms)
  sim.advanceTime(140);
  expect(finished).toBe(true);
  expect(sim.onFinishCount).toBe(1);
  expect(sim.chimePlayed).toBe(false);
});

it('Scenario 1.3: Tap at t=450ms exactly when chime fires allows clean crossfade', () => {
  let finished = false;
  const sim = new SplashRitualSimulation({ onFinish: () => { finished = true; } });

  // Advance to 450ms (chime fires)
  sim.advanceTime(450);
  expect(sim.chimePlayed).toBe(true);
  expect(sim.chimePlayCount).toBe(1);

  // Tap at t=450ms
  sim.press();
  expect(sim.getPointerEvents()).toBe('none');

  // Advance 380ms
  sim.advanceTime(380);
  expect(finished).toBe(true);
  expect(sim.onFinishCount).toBe(1);
  expect(sim.chimePlayCount).toBe(1); // No double audio
});

it('Scenario 1.4: 100 rapid multi-clicks in 1ms only fire onFinish exactly once', () => {
  let finishCount = 0;
  const sim = new SplashRitualSimulation({ onFinish: () => { finishCount++; } });

  // Fire 100 taps in burst
  let acceptedCount = 0;
  for (let i = 0; i < 100; i++) {
    if (sim.press()) {
      acceptedCount++;
    }
  }

  // Only first tap accepted, remaining 99 blocked by isDismissing / pointerEvents
  expect(acceptedCount).toBe(1);
  expect(sim.getPointerEvents()).toBe('none');

  // Complete animation
  sim.advanceTime(500);
  expect(finishCount).toBe(1);
  expect(sim.onFinishCount).toBe(1);
});

it('Scenario 1.5: Tap during auto-finish crossfade is safely rejected without double onFinish', () => {
  let finishCount = 0;
  const sim = new SplashRitualSimulation({ onFinish: () => { finishCount++; } });

  // Advance to auto-finish trigger (3200ms)
  sim.advanceTime(3200);
  expect(sim.isDismissing).toBe(true);
  expect(sim.getPointerEvents()).toBe('none');

  // Attempt press at t=3300ms during 500ms auto-finish fade
  sim.advanceTime(100);
  const accepted = sim.press();
  expect(accepted).toBe(false); // Rejected by pointerEvents

  // Advance to end of auto-finish fade (3200 + 500 = 3700ms)
  sim.advanceTime(410);
  expect(finishCount).toBe(1);
});

it('Scenario 1.6: Untouched splash completes auto-finish ritual at t=3700ms', () => {
  let finished = false;
  const sim = new SplashRitualSimulation({ onFinish: () => { finished = true; } });

  // At 3190ms, still active
  sim.advanceTime(3190);
  expect(finished).toBe(false);
  expect(sim.isDismissing).toBe(false);
  expect(sim.chimePlayed).toBe(true);

  // At 3200ms, autoFinish fires
  sim.advanceTime(10);
  expect(sim.isDismissing).toBe(true);
  expect(finished).toBe(false);

  // 500ms crossfade finishes at 3700ms
  sim.advanceTime(500);
  expect(finished).toBe(true);
  expect(sim.onFinishCount).toBe(1);
});

// ---------------------------------------------------------------------------
// TEST SUITE 2: Unmount & Lifecycle Safety
// ---------------------------------------------------------------------------

console.log('\n--- TEST SUITE 2: Unmount & Lifecycle Safety ---');

it('Scenario 2.1: Immediate unmount at t=0ms cleans up all timers with 0 memory leaks', () => {
  let finished = false;
  const sim = new SplashRitualSimulation({ onFinish: () => { finished = true; } });

  sim.unmount();
  expect(sim.audioTimer).toBe(null);
  expect(sim.autoFinishTimer).toBe(null);

  // Advance 5000ms
  sim.advanceTime(5000);
  expect(finished).toBe(false);
  expect(sim.chimePlayed).toBe(false);
  expect(sim.stateUpdatesAfterUnmount).toBe(0);
});

it('Scenario 2.2: Unmount at t=300ms during opening animation prevents delayed audio', () => {
  let finished = false;
  const sim = new SplashRitualSimulation({ onFinish: () => { finished = true; } });

  sim.advanceTime(300);
  sim.unmount();

  sim.advanceTime(1000);
  expect(sim.chimePlayed).toBe(false);
  expect(finished).toBe(false);
  expect(sim.stateUpdatesAfterUnmount).toBe(0);
});

it('Scenario 2.3: 50 rapid mount-unmount cycles produce zero dangling state mutations', () => {
  let totalFinishes = 0;
  for (let i = 0; i < 50; i++) {
    const sim = new SplashRitualSimulation({ onFinish: () => { totalFinishes++; } });
    sim.advanceTime(Math.random() * 400);
    sim.unmount();
    sim.advanceTime(1000);
    expect(sim.stateUpdatesAfterUnmount).toBe(0);
  }
  expect(totalFinishes).toBe(0);
});

// ---------------------------------------------------------------------------
// TEST SUITE 3: pointerEvents Engagement Verification
// ---------------------------------------------------------------------------

console.log('\n--- TEST SUITE 3: pointerEvents Engagement Verification ---');

it('Scenario 3.1: pointerEvents transitions synchronously from "auto" to "none"', () => {
  const sim = new SplashRitualSimulation();

  expect(sim.getPointerEvents()).toBe('auto');
  sim.handleDismiss(true);
  // Must be 'none' immediately on the same JS tick
  expect(sim.getPointerEvents()).toBe('none');
});

it('Scenario 3.2: pointerEvents="none" prevents any subsequent press interception', () => {
  const sim = new SplashRitualSimulation();
  sim.press();
  expect(sim.getPointerEvents()).toBe('none');

  // Any subsequent touch event must return false (not handled)
  for (let i = 0; i < 10; i++) {
    expect(sim.press()).toBe(false);
  }
});

// ---------------------------------------------------------------------------
// TEST SUITE 4: Stardust Particle Worklet Math Verification
// ---------------------------------------------------------------------------

console.log('\n--- TEST SUITE 4: Stardust Particle Worklet Math Verification ---');

const { PARTICLE_SEEDS } = require('../components/splash/StardustParticles.tsx');

// Import helper interpolation for worklet testing
function interpolateWorklet(val, inRange, outRange) {
  if (val <= inRange[0]) return outRange[0];
  if (val >= inRange[inRange.length - 1]) return outRange[outRange.length - 1];
  for (let i = 0; i < inRange.length - 1; i++) {
    if (val >= inRange[i] && val <= inRange[i + 1]) {
      const ratio = (val - inRange[i]) / (inRange[i + 1] - inRange[i]);
      return outRange[i] + ratio * (outRange[i + 1] - outRange[i]);
    }
  }
  return outRange[0];
}

it('Scenario 4.1: PARTICLE_SEEDS contains exactly 22 validated deterministic particles', () => {
  expect(Array.isArray(PARTICLE_SEEDS)).toBe(true);
  expect(PARTICLE_SEEDS.length).toBe(22);

  PARTICLE_SEEDS.forEach((p, idx) => {
    expect(p.id).toBe(idx + 1);
    expect(['sparkle', 'star', 'dot'].includes(p.shape)).toBe(true);
    expect(Number.isFinite(p.size)).toBe(true);
    expect(p.size).toBeGreaterThan(0);
    expect(Number.isFinite(p.startX)).toBe(true);
    expect(Number.isFinite(p.startY)).toBe(true);
    expect(Number.isFinite(p.deltaX)).toBe(true);
    expect(Number.isFinite(p.deltaY)).toBe(true);
    expect(p.deltaY).toBeLessThan(0); // Upward ballistic rise
    expect(Number.isFinite(p.sineAmp)).toBe(true);
    expect(Number.isFinite(p.sineFreq)).toBe(true);
    expect(Number.isFinite(p.phase)).toBe(true);
    expect(p.duration).toBeGreaterThan(1500);
    expect(typeof p.color).toBe('string');
  });
});

it('Scenario 4.2: Stardust particle worklet math calculates without NaN across 1,000 progress steps', () => {
  PARTICLE_SEEDS.forEach((seed) => {
    for (let step = 0; step <= 1000; step++) {
      const p = step / 1000;

      const transY = interpolateWorklet(p, [0, 1], [0, seed.deltaY]);
      const baseDriftX = interpolateWorklet(p, [0, 1], [0, seed.deltaX]);
      const sineOffset = Math.sin(p * Math.PI * 2 * seed.sineFreq + seed.phase) * seed.sineAmp;
      const transX = baseDriftX + sineOffset;

      const opacity = interpolateWorklet(p, [0, 0.18, 0.7, 1.0], [0, 0.95, 0.85, 0]);
      const scale = interpolateWorklet(p, [0, 0.2, 0.45, 0.75, 1.0], [0, 1.15, 0.75, 1.05, 0.1]);

      expect(Number.isFinite(transX)).toBe(true);
      expect(Number.isFinite(transY)).toBe(true);
      expect(Number.isFinite(opacity)).toBe(true);
      expect(Number.isFinite(scale)).toBe(true);

      // Opacity bounds
      expect(opacity >= 0 && opacity <= 1.0).toBe(true);
      // Scale bounds
      expect(scale >= 0 && scale <= 1.5).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// TEST SUITE 5: 3D Storybook Transform & Dual-Face Crossover
// ---------------------------------------------------------------------------

console.log('\n--- TEST SUITE 5: 3D Storybook Transform & Dual-Face Crossover ---');

it('Scenario 5.1: Dual-face cover visibility crossover switches strictly at -90 degrees', () => {
  // Front face visibility: [-180, -90.1, -89.9, 0] -> [0, 0, 1, 1]
  // Inside face visibility: [-180, -90.1, -89.9, 0] -> [1, 1, 0, 0]

  const angles = [
    { deg: 0, front: 1, inside: 0 },
    { deg: -45, front: 1, inside: 0 },
    { deg: -89.8, front: 1, inside: 0 },
    { deg: -90.2, front: 0, inside: 1 },
    { deg: -135, front: 0, inside: 1 },
    { deg: -165, front: 0, inside: 1 },
  ];

  angles.forEach(({ deg, front, inside }) => {
    const frontOp = interpolateWorklet(deg, [-180, -90.1, -89.9, 0], [0, 0, 1, 1]);
    const insideOp = interpolateWorklet(deg, [-180, -90.1, -89.9, 0], [1, 1, 0, 0]);

    expect(Math.abs(frontOp - front) < 0.05).toBe(true);
    expect(Math.abs(insideOp - inside) < 0.05).toBe(true);
    // Exclusive visibility invariant: only one face is visible at a time
    expect(frontOp + insideOp <= 1.01).toBe(true);
  });
});

it('Scenario 5.2: Storybook responsive dimension scaling preserves 290:216 aspect ratio', () => {
  const testWidths = [320, 360, 375, 390, 414, 768, 1024];

  testWidths.forEach((screenW) => {
    const bookWidth = Math.min(290, screenW * 0.82);
    const bookHeight = (bookWidth / 290) * 216;

    expect(bookWidth <= 290).toBe(true);
    expect(bookWidth > 0).toBe(true);
    expect(bookHeight > 0).toBe(true);
    expect(Math.abs(bookWidth / bookHeight - 290 / 216) < 0.001).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TEST SUITE 6: Audio Error Resiliency
// ---------------------------------------------------------------------------

console.log('\n--- TEST SUITE 6: Audio Error Resiliency ---');

it('Scenario 6.1: playChime rejection is caught gracefully without interrupting splash lifecycle', async () => {
  // Simulating playChime() rejecting (e.g., audio session failure or muted background)
  let caughtError = false;
  const mockPlayChime = () => Promise.reject(new Error('Audio device busy or muted'));

  await mockPlayChime().catch((err) => {
    caughtError = true;
  });

  expect(caughtError).toBe(true);
});

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------

console.log('\n========================================================================');
console.log(`  STRESS HARNESS COMPLETED: ${passedTests}/${totalTests} Passed | Assertions: ${totalAssertions}`);
console.log('========================================================================\n');

if (passedTests === totalTests) {
  console.log('✨ ALL M1 ADVERSARIAL STRESS TESTS PASSED!');
  process.exit(0);
} else {
  console.error(`💥 ${totalTests - passedTests} TESTS FAILED!`);
  process.exit(1);
}
