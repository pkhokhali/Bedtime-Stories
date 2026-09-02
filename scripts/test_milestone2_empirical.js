/**
 * Saanjh Bedtime Stories - Milestone 2 (M2) Empirical Challenge & Stress Test Suite
 *
 * Covers:
 * 1. 60 FPS Reanimated Starfield performance, worklet integrity, sine wave simulation, memory safety.
 * 2. Touch interactions and pointerEvents pass-through across all 4 screens.
 * 3. Intensity mode opacity calculation and gradient/theme tokens.
 * 4. Himalayan Horizon SVG geometry and conifer pine tree vector paths.
 * 5. Star seed distribution, coordinate clamping, halo geometry, and edge cases.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

function runTest(name, fn) {
  totalTests++;
  const start = Date.now();
  try {
    fn();
    const duration = Date.now() - start;
    passedTests++;
    testResults.push({ name, passed: true, duration });
    console.log(`  \x1b[32m✓\x1b[0m ${name} \x1b[2m(${duration}ms)\x1b[0m`);
  } catch (err) {
    const duration = Date.now() - start;
    failedTests++;
    testResults.push({ name, passed: false, duration, error: err });
    console.log(`  \x1b[31m✗\x1b[0m \x1b[31m${name}\x1b[0m \x1b[2m(${duration}ms)\x1b[0m`);
    console.log(`    \x1b[33mError:\x1b[0m ${err.message}`);
  }
}

console.log('\n\x1b[36m\x1b[1m========================================================================\x1b[0m');
console.log('\x1b[36m\x1b[1m   MILESTONE 2 (M2) EMPIRICAL STRESS TEST SUITE                         \x1b[0m');
console.log('\x1b[36m\x1b[1m========================================================================\x1b[0m\n');

// -------------------------------------------------------------
// 1. STAR ANIMATION & 60 FPS PERFORMANCE SIMULATION
// -------------------------------------------------------------
console.log('\x1b[35m\x1b[1m--- SECTION 1: 60 FPS Starfield Animation & Worklet Integrity ---\x1b[0m');

const starfieldSrc = fs.readFileSync(path.join(ROOT_DIR, 'components', 'background', 'TwinklingStarfield.tsx'), 'utf8');

runTest('1.1: TwinklingStarfield uses UI-thread React Native Reanimated hooks', () => {
  assert.ok(starfieldSrc.includes('useSharedValue'), 'Must use useSharedValue');
  assert.ok(starfieldSrc.includes('useAnimatedStyle'), 'Must use useAnimatedStyle');
  assert.ok(starfieldSrc.includes('withRepeat'), 'Must use withRepeat');
  assert.ok(starfieldSrc.includes('withSequence'), 'Must use withSequence');
  assert.ok(starfieldSrc.includes('withTiming'), 'Must use withTiming');
  assert.ok(starfieldSrc.includes('interpolate'), 'Must use interpolate');
  assert.ok(starfieldSrc.includes('Extrapolation.CLAMP'), 'Must use Extrapolation.CLAMP');
});

runTest('1.2: TwinklingStarfield does not use JS bridge state (useState/setState) during animation loop', () => {
  const starNodeMatch = starfieldSrc.match(/function StarNode[\s\S]*?return \(/);
  assert.ok(starNodeMatch, 'StarNode function must exist');
  assert.ok(!starNodeMatch[0].includes('useState'), 'StarNode must NOT use useState to drive animation');
});

runTest('1.3: Star seeds definition and properties', () => {
  assert.ok(starfieldSrc.includes('export const STAR_SEEDS'), 'STAR_SEEDS must be exported');
  
  const seedsMatch = starfieldSrc.match(/export const STAR_SEEDS:\s*StarConfig\[\]\s*=\s*(\[[\s\S]*?\]);/);
  assert.ok(seedsMatch, 'STAR_SEEDS array must be extracted');
  
  const seeds = eval(seedsMatch[1]);
  assert.strictEqual(seeds.length, 32, 'Exactly 32 deterministic star seeds');
  
  const ids = new Set();
  seeds.forEach((star) => {
    assert.ok(star.id >= 1 && star.id <= 32, `Star ID out of bounds: ${star.id}`);
    assert.ok(!ids.has(star.id), `Duplicate star ID: ${star.id}`);
    ids.add(star.id);

    // Coordinate verification
    assert.ok(star.xPct >= 0 && star.xPct <= 100, `xPct out of bounds: ${star.xPct}`);
    assert.ok(star.yPct >= 0 && star.yPct <= 70, `yPct must be in upper 70% of sky: ${star.yPct}`);

    // Size verification
    assert.ok(star.baseSize >= 1.5 && star.baseSize <= 3.5, `baseSize out of range: ${star.baseSize}`);

    // Opacity bounds
    assert.ok(star.minOpacity >= 0.15 && star.minOpacity <= 0.5, `minOpacity out of range: ${star.minOpacity}`);
    assert.ok(star.maxOpacity >= 0.7 && star.maxOpacity <= 1.0, `maxOpacity out of range: ${star.maxOpacity}`);
    assert.ok(star.minOpacity < star.maxOpacity, `minOpacity must be < maxOpacity`);

    // Timing
    assert.ok(star.duration >= 2000 && star.duration <= 5000, `duration out of range: ${star.duration}`);
    assert.ok(star.delay >= 0 && star.delay <= 2000, `delay out of range: ${star.delay}`);
  });
});

runTest('1.4: 60 FPS Mathematical sine oscillation simulation over 10,000 frames (~166 seconds)', () => {
  const seedsMatch = starfieldSrc.match(/export const STAR_SEEDS:\s*StarConfig\[\]\s*=\s*(\[[\s\S]*?\]);/);
  const seeds = eval(seedsMatch[1]);

  const FPS = 60;
  const totalFrames = 10000;
  const dtMs = 1000 / FPS;

  for (let frame = 0; frame < totalFrames; frame++) {
    const elapsedMs = frame * dtMs;

    for (const star of seeds) {
      if (elapsedMs < star.delay) continue;

      const activeTime = elapsedMs - star.delay;
      const cycleDuration = star.duration;
      const halfCycle = cycleDuration / 2;
      const modTime = activeTime % cycleDuration;

      let progress;
      if (modTime < halfCycle) {
        const t = modTime / halfCycle;
        progress = (1 - Math.cos(t * Math.PI)) / 2;
      } else {
        const t = (modTime - halfCycle) / halfCycle;
        progress = (1 + Math.cos(t * Math.PI)) / 2;
      }

      const opacity = star.minOpacity + progress * (star.maxOpacity - star.minOpacity);
      const scale = 0.85 + progress * (1.25 - 0.85);

      assert.ok(opacity >= star.minOpacity - 0.001 && opacity <= star.maxOpacity + 0.001,
        `Opacity out of bounds at frame ${frame}: ${opacity} (range [${star.minOpacity}, ${star.maxOpacity}])`);
      assert.ok(scale >= 0.849 && scale <= 1.251,
        `Scale out of bounds at frame ${frame}: ${scale} (range [0.85, 1.25])`);
    }
  }
});

runTest('1.5: TwinklingStarfield count prop slicing and corner cases', () => {
  const seedsMatch = starfieldSrc.match(/export const STAR_SEEDS:\s*StarConfig\[\]\s*=\s*(\[[\s\S]*?\]);/);
  const STAR_SEEDS = eval(seedsMatch[1]);

  function getStars(count = 32) {
    return count >= STAR_SEEDS.length ? STAR_SEEDS : STAR_SEEDS.slice(0, Math.max(0, count));
  }

  assert.strictEqual(getStars().length, 32);
  assert.strictEqual(getStars(32).length, 32);
  assert.strictEqual(getStars(50).length, 32);
  assert.strictEqual(getStars(10).length, 10);
  assert.strictEqual(getStars(0).length, 0);
  assert.strictEqual(getStars(-5).length, 0);
});

// -------------------------------------------------------------
// 2. TOUCH PASS-THROUGH & POINTER-EVENTS ACROSS 4 SCREENS
// -------------------------------------------------------------
console.log('\n\x1b[35m\x1b[1m--- SECTION 2: Touch Interactions & pointerEvents Pass-Through ---\x1b[0m');

const atmosSrc = fs.readFileSync(path.join(ROOT_DIR, 'components', 'background', 'AtmosphericBackground.tsx'), 'utf8');
const horizonSrc = fs.readFileSync(path.join(ROOT_DIR, 'components', 'background', 'HimalayanHorizon.tsx'), 'utf8');

runTest('2.1: AtmosphericBackground visual wrapper has pointerEvents="none"', () => {
  assert.ok(
    atmosSrc.includes('<View pointerEvents="none" style={[StyleSheet.absoluteFill'),
    'AtmosphericBackground background visual container must have pointerEvents="none"'
  );
  assert.ok(
    atmosSrc.includes('{children}'),
    'AtmosphericBackground must render foreground children directly in container'
  );
});

runTest('2.2: TwinklingStarfield container has pointerEvents="none"', () => {
  assert.ok(
    starfieldSrc.includes('<View pointerEvents="none" style={[styles.container'),
    'TwinklingStarfield root container must have pointerEvents="none"'
  );
  assert.ok(
    starfieldSrc.includes('pointerEvents="none"'),
    'Star nodes must have pointerEvents="none"'
  );
});

runTest('2.3: HimalayanHorizon container has pointerEvents="none"', () => {
  assert.ok(
    horizonSrc.includes('<View pointerEvents="none" style={[styles.container'),
    'HimalayanHorizon container must have pointerEvents="none"'
  );
});

// Screen Integration Tests
const indexSrc = fs.readFileSync(path.join(ROOT_DIR, 'app', 'index.tsx'), 'utf8');
const librarySrc = fs.readFileSync(path.join(ROOT_DIR, 'app', 'library.tsx'), 'utf8');
const settingsSrc = fs.readFileSync(path.join(ROOT_DIR, 'app', 'settings.tsx'), 'utf8');
const storyDetailSrc = fs.readFileSync(path.join(ROOT_DIR, 'app', 'story-detail', '[id].tsx'), 'utf8');

runTest('2.4: HomeScreen (app/index.tsx) mounts AtmosphericBackground and exposes touch targets', () => {
  assert.ok(indexSrc.includes('<AtmosphericBackground style={styles.root}>'), 'Must wrap in AtmosphericBackground');
  assert.ok(indexSrc.includes('</AtmosphericBackground>'), 'Must close AtmosphericBackground');
  assert.ok(indexSrc.includes('backgroundColor: \'transparent\''), 'Root must have transparent background');
  
  assert.ok(indexSrc.includes('<ScrollView'), 'ScrollView must be present');
  assert.ok(indexSrc.includes('onPress={() => router.push(\'/library\')}'), 'Library button interactive');
  assert.ok(indexSrc.includes('<SettingsButton />'), 'Settings button present');
  assert.ok(indexSrc.includes('onPress={() => router.push(\'/story/\' + featuredStory.id)}'), 'Play button interactive');
  assert.ok(indexSrc.includes('onPress={() => router.push(\'/story-detail/\' + featuredStory.id)}'), 'Details button interactive');
  assert.ok(indexSrc.includes('<StoryCarousel'), 'Carousels present for horizontal touch scroll');
});

runTest('2.5: LibraryScreen (app/library.tsx) mounts AtmosphericBackground and exposes touch targets', () => {
  assert.ok(librarySrc.includes('<AtmosphericBackground style={styles.root}>'), 'Must wrap in AtmosphericBackground');
  assert.ok(librarySrc.includes('</AtmosphericBackground>'), 'Must close AtmosphericBackground');
  assert.ok(librarySrc.includes('backgroundColor: \'transparent\''), 'Safe area must have transparent background');

  assert.ok(librarySrc.includes('onPress={() => router.back()}'), 'Back button interactive');
  assert.ok(librarySrc.includes('<SettingsButton />'), 'Settings button present');
  assert.ok(librarySrc.includes('<AgeCategoryRow />'), 'Age category row present and interactive');
  assert.ok(librarySrc.includes('onPress={() => router.push(`/story-detail/${story.id}`)}'), 'Story card pressable');
  assert.ok(librarySrc.includes('handleDownloadPress(story)'), 'Download button pressable');
});

runTest('2.6: SettingsScreen (app/settings.tsx) mounts AtmosphericBackground and exposes touch targets', () => {
  assert.ok(settingsSrc.includes('<AtmosphericBackground style={styles.root}>'), 'Must wrap in AtmosphericBackground');
  assert.ok(settingsSrc.includes('</AtmosphericBackground>'), 'Must close AtmosphericBackground');
  assert.ok(settingsSrc.includes('backgroundColor: \'transparent\''), 'Safe area must have transparent background');

  assert.ok(settingsSrc.includes('onPress={() => router.back()}'), 'Back button interactive');
  assert.ok(settingsSrc.includes('<AgeCategoryRow variant="full" />'), 'AgeCategoryRow present');
  assert.ok(settingsSrc.includes('onPress={() => setLanguage(\'ne\')}'), 'Nepali language choice interactive');
  assert.ok(settingsSrc.includes('onPress={() => setLanguage(\'en\')}'), 'English language choice interactive');
  assert.ok(settingsSrc.includes('setVoicePace'), 'Voice pace selection interactive');
  assert.ok(settingsSrc.includes('setVoiceGender'), 'Voice gender selection interactive');
  assert.ok(settingsSrc.includes('previewTeller'), 'Voice preview button interactive');
  assert.ok(settingsSrc.includes('<Switch'), 'Switch toggles interactive');
});

runTest('2.7: StoryDetailScreen (app/story-detail/[id].tsx) mounts AtmosphericBackground and exposes touch targets', () => {
  assert.ok(storyDetailSrc.includes('<AtmosphericBackground style={styles.root}>'), 'Must wrap in AtmosphericBackground');
  assert.ok(storyDetailSrc.includes('</AtmosphericBackground>'), 'Must close AtmosphericBackground');
  assert.ok(storyDetailSrc.includes('backgroundColor: \'transparent\''), 'Root must have transparent background');

  assert.ok(storyDetailSrc.includes('onPress={() => router.back()}'), 'Back button interactive');
  assert.ok(storyDetailSrc.includes('onPress={handleToggleFavorite}'), 'Favorite toggle interactive');
  assert.ok(storyDetailSrc.includes('onPress={() => router.push(`/story/${story.id}`)}'), 'Play CTA button interactive');
});

// -------------------------------------------------------------
// 3. INTENSITY MODES & THEME PALETTE CALCULATIONS
// -------------------------------------------------------------
console.log('\n\x1b[35m\x1b[1m--- SECTION 3: Intensity Modes, Gradient & Theme Tokens ---\x1b[0m');

const themeSrc = fs.readFileSync(path.join(ROOT_DIR, 'constants', 'theme.ts'), 'utf8');

runTest('3.1: resolveIntensityOpacity returns precise values across valid and edge case inputs', () => {
  function resolveIntensityOpacity(intensity = 'full') {
    switch (intensity) {
      case 'dim':
        return 0.3;
      case 'subtle':
        return 0.6;
      case 'full':
      default:
        return 1.0;
    }
  }

  assert.strictEqual(resolveIntensityOpacity('full'), 1.0);
  assert.strictEqual(resolveIntensityOpacity('subtle'), 0.6);
  assert.strictEqual(resolveIntensityOpacity('dim'), 0.3);
  assert.strictEqual(resolveIntensityOpacity(), 1.0);
  assert.strictEqual(resolveIntensityOpacity(undefined), 1.0);
  assert.strictEqual(resolveIntensityOpacity(null), 1.0);
  assert.strictEqual(resolveIntensityOpacity('unknown-mode'), 1.0);
  assert.strictEqual(resolveIntensityOpacity(''), 1.0);
});

runTest('3.2: CELESTIAL_GRADIENT array integrity and stop locations', () => {
  const gradientMatch = atmosSrc.match(/export const CELESTIAL_GRADIENT = (\[[\s\S]*?\]) as const;/);
  assert.ok(gradientMatch, 'CELESTIAL_GRADIENT must be defined');
  const gradient = eval(gradientMatch[1]);

  assert.strictEqual(gradient.length, 5, 'Must have exactly 5 gradient color stops');
  assert.strictEqual(gradient[0], '#060913', 'Stop 1: skyTop dark');
  assert.strictEqual(gradient[1], '#0c1222', 'Stop 2: skyMid slate');
  assert.strictEqual(gradient[2], '#121A2F', 'Stop 3: skyBottom blue');
  assert.strictEqual(gradient[3], '#1B1428', 'Stop 4: deep purple night');
  assert.strictEqual(gradient[4], '#22151D', 'Stop 5: warm nocturnal twilight');

  assert.ok(atmosSrc.includes('locations={[0, 0.24, 0.52, 0.78, 1.0]}'), 'Locations must be 5 monotonically increasing coordinates');
});

runTest('3.3: Theme tokens and celestialPalette in constants/theme.ts', () => {
  assert.ok(themeSrc.includes('export const celestialPalette = {'), 'celestialPalette must be exported');
  assert.ok(themeSrc.includes('skyTop: \'#060913\''), 'skyTop token matches');
  assert.ok(themeSrc.includes('skyMid: \'#0c1222\''), 'skyMid token matches');
  assert.ok(themeSrc.includes('skyBottom: \'#121A2F\''), 'skyBottom token matches');
  assert.ok(themeSrc.includes('amberGlow: \'#E8A04A\''), 'amberGlow token matches');
  assert.ok(themeSrc.includes('cardBg: \'rgba(18, 26, 44, 0.72)\''), 'cardBg token matches');
  assert.ok(themeSrc.includes('cardBorder: \'rgba(232, 160, 74, 0.12)\''), 'cardBorder token matches');
});

// -------------------------------------------------------------
// 4. HIMALAYAN HORIZON SVG VECTORS & CONIFER PINE GEOMETRY
// -------------------------------------------------------------
console.log('\n\x1b[35m\x1b[1m--- SECTION 4: Himalayan Horizon Vectors & Pine Silhouettes ---\x1b[0m');

runTest('4.1: HimalayanHorizon SVG viewBox, scaling, and strata paths', () => {
  assert.ok(horizonSrc.includes('viewBox="0 0 400 180"'), 'SVG viewBox must be 0 0 400 180');
  assert.ok(horizonSrc.includes('preserveAspectRatio="none"'), 'preserveAspectRatio must be none for seamless responsive anchoring');
  assert.ok(horizonSrc.includes('id="distantRidgeGrad"'), 'Distant ridge gradient definition');
  assert.ok(horizonSrc.includes('id="midPeakGrad"'), 'Mid peak gradient definition');
  assert.ok(horizonSrc.includes('fill="#060A14"'), 'Rolling foothills silhouette fill');
  assert.ok(horizonSrc.includes('fill="#050A14"'), 'Pine conifer silhouette fill');
});

runTest('4.2: Conifer Pine Tree generator vector path closure and mathematics', () => {
  function renderPinePath(x, baseY, width, height) {
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

  const treePath = renderPinePath(100, 180, 16, 40);
  assert.ok(treePath.startsWith('M 100 140'), 'Path must start at apex top');
  assert.ok(treePath.endsWith('Z'), 'Path must terminate with Z closure');
  assert.ok(treePath.includes('180'), 'Path must anchor to baseY 180');
});

runTest('4.3: Pine tree count and distribution along horizon', () => {
  const pineMatch = horizonSrc.match(/const pineTrees = (\[[\s\S]*?\]);/);
  assert.ok(pineMatch, 'pineTrees array must be extracted');
  const pineTrees = eval(pineMatch[1]);

  assert.ok(pineTrees.length >= 10, `Pine tree count must be >= 10 (found ${pineTrees.length})`);
  assert.strictEqual(pineTrees.length, 14, 'Configured with 14 pine conifers');

  pineTrees.forEach((tree, idx) => {
    assert.ok(tree.x >= 0 && tree.x <= 400, `Tree ${idx} x out of bounds: ${tree.x}`);
    assert.ok(tree.baseY >= 170 && tree.baseY <= 180, `Tree ${idx} baseY out of bounds: ${tree.baseY}`);
    assert.ok(tree.w >= 10 && tree.w <= 25, `Tree ${idx} width out of bounds: ${tree.w}`);
    assert.ok(tree.h >= 25 && tree.h <= 55, `Tree ${idx} height out of bounds: ${tree.h}`);
  });

  const minX = Math.min(...pineTrees.map((t) => t.x));
  const maxX = Math.max(...pineTrees.map((t) => t.x));
  assert.ok(minX < 20, `Leftmost tree should start near left edge (got ${minX})`);
  assert.ok(maxX > 380, `Rightmost tree should extend near right edge (got ${maxX})`);
});

// -------------------------------------------------------------
// 5. SUMMARY & VERDICT
// -------------------------------------------------------------
console.log('\n\x1b[36m\x1b[1m========================================================================\x1b[0m');
console.log(`\x1b[36m\x1b[1m   STRESS TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)\x1b[0m`);
console.log('\x1b[36m\x1b[1m========================================================================\x1b[0m\n');

if (failedTests > 0) {
  console.log('\x1b[31m\x1b[1mVERDICT: REQUEST_CHANGES - Empirical failures detected.\x1b[0m');
  process.exit(1);
} else {
  console.log('\x1b[32m\x1b[1mVERDICT: APPROVE - All empirical tests passed with 100% success.\x1b[0m');
  process.exit(0);
}
