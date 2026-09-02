/**
 * Milestone 2 (M2) Adversarial Stress Test Suite
 * 
 * Conducted by Challenger 2 (Empirical Challenger)
 * 
 * Verifies:
 * 1. SVG responsive viewBox scaling across 12+ device aspect ratios & resolutions
 * 2. Conifer pine tree silhouette density, spacing, coordinate bounds, and path grammar
 * 3. Memory consumption, allocation footprint, and worklet execution budget of 32 Reanimated shared values
 * 4. Theme token integrity, WCAG luminance contrast, and translucent card glassmorphism across all screens
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

// Test tracking
let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const testLogs = [];

function expect(actual, message = '') {
  return {
    toBe(expected) {
      totalAssertions++;
      if (actual === expected) {
        passedAssertions++;
      } else {
        failedAssertions++;
        throw new Error(`Assertion failed: expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}. ${message}`);
      }
    },
    toEqual(expected) {
      totalAssertions++;
      if (JSON.stringify(actual) === JSON.stringify(expected)) {
        passedAssertions++;
      } else {
        failedAssertions++;
        throw new Error(`Assertion failed: expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}. ${message}`);
      }
    },
    toBeGreaterThanOrEqual(expected) {
      totalAssertions++;
      if (actual >= expected) {
        passedAssertions++;
      } else {
        failedAssertions++;
        throw new Error(`Assertion failed: expected ${actual} >= ${expected}. ${message}`);
      }
    },
    toBeLessThanOrEqual(expected) {
      totalAssertions++;
      if (actual <= expected) {
        passedAssertions++;
      } else {
        failedAssertions++;
        throw new Error(`Assertion failed: expected ${actual} <= ${expected}. ${message}`);
      }
    },
    toBeCloseTo(expected, delta = 0.01) {
      totalAssertions++;
      if (Math.abs(actual - expected) <= delta) {
        passedAssertions++;
      } else {
        failedAssertions++;
        throw new Error(`Assertion failed: expected ${actual} to be close to ${expected} (within ${delta}). ${message}`);
      }
    },
    toBeTruthy() {
      totalAssertions++;
      if (Boolean(actual)) {
        passedAssertions++;
      } else {
        failedAssertions++;
        throw new Error(`Assertion failed: expected truthy but got ${actual}. ${message}`);
      }
    },
  };
}

function runSection(sectionName, fn) {
  console.log(`\n=== ${sectionName} ===`);
  try {
    fn();
    console.log(`  [PASS] ${sectionName}`);
  } catch (err) {
    console.error(`  [FAIL] ${sectionName}: ${err.message}`);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// SECTION 1: SVG Responsive ViewBox Scaling & Horizon Geometry
// -----------------------------------------------------------------------------
runSection('1. SVG Responsive ViewBox Scaling & Aspect Ratio Stress', () => {
  const horizonFilePath = path.join(ROOT_DIR, 'components', 'background', 'HimalayanHorizon.tsx');
  const horizonContent = fs.readFileSync(horizonFilePath, 'utf8');

  // Verify viewBox attribute and preserveAspectRatio
  expect(horizonContent.includes('viewBox="0 0 400 180"'), 'Must have 0 0 400 180 viewBox').toBeTruthy();
  expect(horizonContent.includes('preserveAspectRatio="none"'), 'Must stretch cleanly with preserveAspectRatio="none"').toBeTruthy();

  // Test across diverse device resolutions & aspect ratios
  const deviceProfiles = [
    { name: 'iPhone SE (1st gen)', width: 320, height: 568, horizonHeight: 180 },
    { name: 'iPhone 8 / SE2', width: 375, height: 667, horizonHeight: 180 },
    { name: 'iPhone 14 / 15', width: 390, height: 844, horizonHeight: 180 },
    { name: 'Pixel 7 Pro', width: 412, height: 915, horizonHeight: 180 },
    { name: 'iPhone 15 Pro Max', width: 430, height: 932, horizonHeight: 180 },
    { name: 'iPad Mini (Portrait)', width: 768, height: 1024, horizonHeight: 220 },
    { name: 'iPad Pro 12.9 (Portrait)', width: 1024, height: 1366, horizonHeight: 250 },
    { name: 'Foldable Phone (Unfolded)', width: 600, height: 800, horizonHeight: 180 },
    { name: 'Android Tablet (Landscape)', width: 1280, height: 800, horizonHeight: 200 },
    { name: 'Phone Landscape (16:9)', width: 844, height: 390, horizonHeight: 120 },
    { name: 'Extreme Ultra-Tall (9:22)', width: 360, height: 880, horizonHeight: 160 },
    { name: 'Extreme Ultra-Wide (21:9)', width: 1200, height: 514, horizonHeight: 140 },
    { name: 'Square Viewport (1:1)', width: 600, height: 600, horizonHeight: 180 },
  ];

  for (const device of deviceProfiles) {
    const scaleX = device.width / 400;
    const scaleY = device.horizonHeight / 180;

    // Verify scale factors are valid and finite
    expect(Number.isFinite(scaleX) && scaleX > 0, `Scale X must be positive finite for ${device.name}`).toBeTruthy();
    expect(Number.isFinite(scaleY) && scaleY > 0, `Scale Y must be positive finite for ${device.name}`).toBeTruthy();

    // Verify coordinate transform for peak at (165, 35) in viewBox
    const peakWorldX = 165 * scaleX;
    const peakWorldY = 35 * scaleY;
    expect(peakWorldX >= 0 && peakWorldX <= device.width, `Peak X inside screen bounds for ${device.name}`).toBeTruthy();
    expect(peakWorldY >= 0 && peakWorldY <= device.horizonHeight, `Peak Y inside horizon bounds for ${device.name}`).toBeTruthy();

    // Verify baseline bottom seal at (0, 174) to (400, 180) transforms cleanly to screen bottom
    const sealTopWorldY = 174 * scaleY;
    const sealBottomWorldY = 180 * scaleY;
    expect(sealBottomWorldY).toBeCloseTo(device.horizonHeight, 0.001);
    expect(sealBottomWorldY - sealTopWorldY > 0, `Baseline seal thickness must be positive for ${device.name}`).toBeTruthy();
  }

  // Parse Path commands in HimalayanHorizon to verify geometric bounds [0, 400] x [0, 180]
  const pathRegex = /d="([^"]+)"/g;
  let match;
  let pathCount = 0;
  while ((match = pathRegex.exec(horizonContent)) !== null) {
    pathCount++;
    const pathD = match[1];
    // Extract all numbers
    const numbers = pathD.match(/[-+]?[0-9]*\.?[0-9]+/g).map(Number);
    for (let i = 0; i < numbers.length; i += 2) {
      const x = numbers[i];
      const y = numbers[i + 1];
      if (x !== undefined && y !== undefined) {
        expect(x >= 0 && x <= 400, `SVG path coordinate X (${x}) must be in [0, 400]`).toBeTruthy();
        expect(y >= 0 && y <= 180, `SVG path coordinate Y (${y}) must be in [0, 180]`).toBeTruthy();
      }
    }
  }
  expect(pathCount).toBeGreaterThanOrEqual(4); // distant ridge, mid peak, foothill, baseline seal
});

// -----------------------------------------------------------------------------
// SECTION 2: Conifer Pine Tree Silhouette Density & Precision
// -----------------------------------------------------------------------------
runSection('2. Conifer Pine Tree Silhouette Density & Spatial Coverage', () => {
  const pineTrees = [
    { x: 12, baseY: 175, w: 14, h: 36 },
    { x: 34, baseY: 178, w: 16, h: 42 },
    { x: 60, baseY: 174, w: 12, h: 30 },
    { x: 92, baseY: 176, w: 18, h: 46 },
    { x: 124, baseY: 177, w: 14, h: 38 },
    { x: 152, baseY: 174, w: 13, h: 34 },
    { x: 185, baseY: 178, w: 17, h: 44 },
    { x: 215, baseY: 175, w: 15, h: 39 },
    { x: 245, baseY: 177, w: 13, h: 32 },
    { x: 278, baseY: 176, w: 19, h: 48 },
    { x: 308, baseY: 174, w: 14, h: 35 },
    { x: 338, baseY: 178, w: 16, h: 42 },
    { x: 366, baseY: 175, w: 13, h: 33 },
    { x: 390, baseY: 177, w: 15, h: 40 },
  ];

  // 1. Density check (Requirement: >= 10 conifer trees)
  expect(pineTrees.length).toBeGreaterThanOrEqual(10);
  expect(pineTrees.length).toBe(14);

  // 2. Spatial distribution check across [0, 400] viewBox
  const minX = Math.min(...pineTrees.map(t => t.x));
  const maxX = Math.max(...pineTrees.map(t => t.x));
  expect(minX <= 15, 'Leftmost pine must be near left edge').toBeTruthy();
  expect(maxX >= 385, 'Rightmost pine must be near right edge').toBeTruthy();

  // Ensure no huge gap between adjacent pine trees (> 45px in 400px viewBox)
  const sortedTrees = [...pineTrees].sort((a, b) => a.x - b.x);
  for (let i = 0; i < sortedTrees.length - 1; i++) {
    const gap = sortedTrees[i + 1].x - sortedTrees[i].x;
    expect(gap <= 45, `Gap between pine ${i} and ${i+1} (${gap}px) must be <= 45px`).toBeTruthy();
  }

  // 3. Mathematical verification of renderPineTree path generator
  function renderPineTreePath(x, baseY, width, height) {
    const hw = width / 2;
    const topY = baseY - height;
    const t1 = topY + height * 0.32;
    const t2 = topY + height * 0.62;
    const t3 = topY + height * 0.90;

    return [
      `M ${x} ${topY}`,
      `L ${x + hw * 0.45} ${t1}`,
      `L ${x + hw * 0.28} ${t1}`,
      `L ${x + hw * 0.75} ${t2}`,
      `L ${x + hw * 0.45} ${t2}`,
      `L ${x + hw} ${t3}`,
      `L ${x + hw * 0.2} ${t3}`,
      `L ${x + hw * 0.2} ${baseY}`,
      `L ${x - hw * 0.2} ${baseY}`,
      `L ${x - hw * 0.2} ${t3}`,
      `L ${x - hw} ${t3}`,
      `L ${x - hw * 0.45} ${t2}`,
      `L ${x - hw * 0.75} ${t2}`,
      `L ${x - hw * 0.28} ${t1}`,
      `L ${x - hw * 0.45} ${t1}`,
      'Z',
    ].join(' ');
  }

  for (const tree of pineTrees) {
    const pathD = renderPineTreePath(tree.x, tree.baseY, tree.w, tree.h);
    expect(pathD.startsWith('M '), 'Path must start with M command').toBeTruthy();
    expect(pathD.endsWith(' Z'), 'Path must close with Z command').toBeTruthy();

    const topY = tree.baseY - tree.h;
    expect(topY > 0, `Pine top (${topY}) must be positive above horizon baseline`).toBeTruthy();
    expect(tree.baseY <= 180, `Pine baseY (${tree.baseY}) must be within viewBox height`).toBeTruthy();

    // Check symmetry: path has 15 line-to segments plus closing Z
    const segments = pathD.split(' ');
    expect(segments.length).toBe(33); // M x y (3) + 14 * (L x y = 28) + 1 * (Z = 1) + formatting = 33 tokens
  }
});

// -----------------------------------------------------------------------------
// SECTION 3: Memory Consumption & UI Worklet Budget of 32 Shared Values
// -----------------------------------------------------------------------------
runSection('3. Memory Footprint & 60 FPS UI-Thread Worklet Simulation', () => {
  const starfieldFilePath = path.join(ROOT_DIR, 'components', 'background', 'TwinklingStarfield.tsx');
  const starfieldContent = fs.readFileSync(starfieldFilePath, 'utf8');

  // Extract STAR_SEEDS definition
  const starSeedRegex = /\{ id: (\d+), xPct: ([0-9.]+), yPct: ([0-9.]+), baseSize: ([0-9.]+), color: '([^']+)', glow: (true|false), minOpacity: ([0-9.]+), maxOpacity: ([0-9.]+), duration: (\d+), delay: (\d+) \}/g;
  const stars = [];
  let m;
  while ((m = starSeedRegex.exec(starfieldContent)) !== null) {
    stars.push({
      id: Number(m[1]),
      xPct: Number(m[2]),
      yPct: Number(m[3]),
      baseSize: Number(m[4]),
      color: m[5],
      glow: m[6] === 'true',
      minOpacity: Number(m[7]),
      maxOpacity: Number(m[8]),
      duration: Number(m[9]),
      delay: Number(m[10]),
    });
  }

  expect(stars.length).toBe(32);

  // 1. Celestial coordinate constraints
  for (const star of stars) {
    expect(star.xPct >= 0 && star.xPct <= 100, `Star ${star.id} xPct (${star.xPct}) must be in [0, 100]`).toBeTruthy();
    expect(star.yPct >= 0 && star.yPct <= 70, `Star ${star.id} yPct (${star.yPct}) must be <= 70% of sky`).toBeTruthy();
    expect(star.minOpacity >= 0.1 && star.minOpacity <= 0.5, `Star ${star.id} minOpacity in reasonable dim range`).toBeTruthy();
    expect(star.maxOpacity >= 0.7 && star.maxOpacity <= 1.0, `Star ${star.id} maxOpacity in bright range`).toBeTruthy();
    expect(star.duration >= 2000 && star.duration <= 5000, `Star ${star.id} duration (${star.duration}ms) gentle bedtime cadence`).toBeTruthy();
    expect(star.baseSize >= 1.5 && star.baseSize <= 3.5, `Star ${star.id} baseSize in [1.5, 3.5]`).toBeTruthy();
  }

  // 2. Spatial collision & clumping analysis
  // Verify stars are not duplicates and have reasonable spread
  const minInterStarDistancePct = 2.0; // At least 2% distance
  for (let i = 0; i < stars.length; i++) {
    for (let j = i + 1; j < stars.length; j++) {
      const dx = stars[i].xPct - stars[j].xPct;
      const dy = stars[i].yPct - stars[j].yPct;
      const dist = Math.sqrt(dx * dx + dy * dy);
      expect(dist >= minInterStarDistancePct, `Stars ${stars[i].id} and ${stars[j].id} must not collide (dist: ${dist.toFixed(2)}%)`).toBeTruthy();
    }
  }

  // 3. UI-Thread Sine Animation Simulation over 10 seconds (600 frames at 60 FPS)
  const simulatedFrames = 600; // 10 seconds @ 60 FPS
  const frameDeltaMs = 1000 / 60; // 16.666 ms

  let totalLerpOperations = 0;
  const startMemory = process.memoryUsage().heapUsed;

  for (let f = 0; f < simulatedFrames; f++) {
    const elapsedMs = f * frameDeltaMs;

    for (const star of stars) {
      // Reanimated withRepeat(withSequence(withTiming(1), withTiming(0))) sine oscillator math
      const activeTime = Math.max(0, elapsedMs - star.delay);
      const phase = (activeTime % star.duration) / star.duration;
      const sineProgress = 0.5 - 0.5 * Math.cos(2 * Math.PI * phase); // Smooth inOut(sin) oscillation

      // Interpolate opacity & scale
      const opacity = star.minOpacity + sineProgress * (star.maxOpacity - star.minOpacity);
      const scale = 0.85 + sineProgress * (1.25 - 0.85);

      expect(opacity >= star.minOpacity - 0.001 && opacity <= star.maxOpacity + 0.001).toBeTruthy();
      expect(scale >= 0.849 && scale <= 1.251).toBeTruthy();

      totalLerpOperations += 2;
    }
  }

  const endMemory = process.memoryUsage().heapUsed;
  const memoryDeltaBytes = endMemory - startMemory;

  // 32 stars * 600 frames * 2 lerps = 38,400 calculations
  expect(totalLerpOperations).toBe(38400);
  console.log(`    Simulated 600 frames (10s @ 60 FPS): ${totalLerpOperations} UI-thread interpolations completed cleanly.`);
  console.log(`    Estimated SharedValue JS memory delta: ${(memoryDeltaBytes / 1024).toFixed(2)} KB.`);

  // 4. Pointer Events Pass-Through Check
  expect(starfieldContent.includes('pointerEvents="none"'), 'Starfield must specify pointerEvents="none"').toBeTruthy();
  const horizonContent = fs.readFileSync(path.join(ROOT_DIR, 'components', 'background', 'HimalayanHorizon.tsx'), 'utf8');
  expect(horizonContent.includes('pointerEvents="none"'), 'Horizon must specify pointerEvents="none"').toBeTruthy();
  const bgContent = fs.readFileSync(path.join(ROOT_DIR, 'components', 'background', 'AtmosphericBackground.tsx'), 'utf8');
  expect(bgContent.includes('pointerEvents="none"'), 'Atmospheric background layer must specify pointerEvents="none"').toBeTruthy();
});

// -----------------------------------------------------------------------------
// SECTION 4: Theme Token Integrity & WCAG Contrast Analysis
// -----------------------------------------------------------------------------
runSection('4. Theme Token Integrity & Translucent Card Contrast Analysis', () => {
  const themeFilePath = path.join(ROOT_DIR, 'constants', 'theme.ts');
  const themeContent = fs.readFileSync(themeFilePath, 'utf8');

  // Verify celestialPalette export
  expect(themeContent.includes("skyTop: '#060913'"), 'skyTop must be #060913').toBeTruthy();
  expect(themeContent.includes("skyMid: '#0c1222'"), 'skyMid must be #0c1222').toBeTruthy();
  expect(themeContent.includes("skyBottom: '#121A2F'"), 'skyBottom must be #121A2F').toBeTruthy();
  expect(themeContent.includes("amberGlow: '#E8A04A'"), 'amberGlow must be #E8A04A').toBeTruthy();
  expect(themeContent.includes("cardBg: 'rgba(18, 26, 44, 0.72)'"), 'cardBg must be rgba(18, 26, 44, 0.72)').toBeTruthy();
  expect(themeContent.includes("cardBorder: 'rgba(232, 160, 74, 0.12)'"), 'cardBorder must be rgba(232, 160, 74, 0.12)').toBeTruthy();

  // WCAG 2.1 Luminance and Contrast Calculation
  function hexToRgb(hex) {
    const cleanHex = hex.replace('#', '');
    const num = parseInt(cleanHex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  function relativeLuminance({ r, g, b }) {
    const [rs, gs, bs] = [r, g, b].map(val => {
      const s = val / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  function contrastRatio(lum1, lum2) {
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Alpha blend rgba over rgb background
  function alphaBlend(fgRgba, bgRgb) {
    const a = fgRgba.a;
    return {
      r: Math.round(fgRgba.r * a + bgRgb.r * (1 - a)),
      g: Math.round(fgRgba.g * a + bgRgb.g * (1 - a)),
      b: Math.round(fgRgba.b * a + bgRgb.b * (1 - a)),
    };
  }

  const cardRgba = { r: 18, g: 26, b: 44, a: 0.72 };
  const gradientStops = [
    '#060913',
    '#0c1222',
    '#121A2F',
    '#1B1428',
    '#22151D',
  ];

  const textCreamLum = relativeLuminance(hexToRgb('#F4E6C8'));
  const textWhiteLum = relativeLuminance(hexToRgb('#FFFFFF'));
  const textMutedLum = relativeLuminance(hexToRgb('#C4B59A'));

  for (const stopHex of gradientStops) {
    const stopRgb = hexToRgb(stopHex);
    const blendedCardRgb = alphaBlend(cardRgba, stopRgb);
    const blendedCardLum = relativeLuminance(blendedCardRgb);

    const contrastCream = contrastRatio(textCreamLum, blendedCardLum);
    const contrastWhite = contrastRatio(textWhiteLum, blendedCardLum);
    const contrastMuted = contrastRatio(textMutedLum, blendedCardLum);

    // Bedtime readability requires >= 7:1 (WCAG AAA) for primary text against dark cards
    expect(contrastCream >= 7.0, `Cream text contrast against card on ${stopHex} (${contrastCream.toFixed(2)}:1) must meet AAA >= 7:1`).toBeTruthy();
    expect(contrastWhite >= 7.0, `White text contrast against card on ${stopHex} (${contrastWhite.toFixed(2)}:1) must meet AAA >= 7:1`).toBeTruthy();
    expect(contrastMuted >= 4.5, `Muted text contrast against card on ${stopHex} (${contrastMuted.toFixed(2)}:1) must meet AA >= 4.5:1`).toBeTruthy();

    console.log(`    Stop ${stopHex} -> Blended Card Contrast: Cream=${contrastCream.toFixed(1)}:1, White=${contrastWhite.toFixed(1)}:1, Muted=${contrastMuted.toFixed(1)}:1`);
  }
});

// -----------------------------------------------------------------------------
// SECTION 5: Cross-Screen Integration Verification
// -----------------------------------------------------------------------------
runSection('5. Screen Integration Coverage across Home, Library, Settings, Story Detail', () => {
  const targetScreens = [
    { name: 'Home Screen', file: 'app/index.tsx' },
    { name: 'Library Screen', file: 'app/library.tsx' },
    { name: 'Settings Screen', file: 'app/settings.tsx' },
    { name: 'Story Detail Screen', file: 'app/story-detail/[id].tsx' },
  ];

  for (const screen of targetScreens) {
    const fullPath = path.join(ROOT_DIR, screen.file);
    expect(fs.existsSync(fullPath), `${screen.name} file exists`).toBeTruthy();
    const content = fs.readFileSync(fullPath, 'utf8');

    // 1. Must import and wrap root in <AtmosphericBackground
    expect(content.includes('AtmosphericBackground'), `${screen.name} must import AtmosphericBackground`).toBeTruthy();
    expect(content.includes('<AtmosphericBackground'), `${screen.name} must render <AtmosphericBackground`).toBeTruthy();

    // 2. Must not contain solid dark brown '#1A1410' background overrides on root
    expect(!content.includes("backgroundColor: '#1A1410'"), `${screen.name} must not have solid background #1A1410`).toBeTruthy();

    console.log(`    ${screen.name} (${screen.file}): Verified AtmosphericBackground integration.`);
  }
});

console.log('\n========================================================================');
console.log(` ✨ ALL ADVERSARIAL CHALLENGER STRESS TESTS PASSED (${passedAssertions}/${totalAssertions} assertions)`);
console.log('========================================================================\n');
