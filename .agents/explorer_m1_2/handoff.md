# Handoff Report: Stardust Particles, Bilingual Logo Reveal & Celestial Glow Architecture

**Milestone**: M1 (Magical Storybook Animated Splash Ritual)  
**Agent**: Explorer 2 (`explorer_m1_2`)  
**Target Files**: `components/splash/StardustParticles.tsx`, `components/splash/SplashRitual.tsx`  
**Dependencies Checked**: `react-native-reanimated` 4.5.1, `react-native-svg` 15.15.4, `@expo-google-fonts/nunito` 0.4.2, `@expo-google-fonts/noto-sans-devanagari` 0.4.1  

---

## 1. Observation

1. **Dependencies & Fonts**:
   - In `package.json` (lines 19-20, 45, 48): `@expo-google-fonts/noto-sans-devanagari: ^0.4.1`, `@expo-google-fonts/nunito: ^0.4.2`, `react-native-reanimated: 4.5.1`, `react-native-svg: 15.15.4`.
   - In `app/_layout.tsx` (lines 28-36): Font families loaded in `useFonts`:
     - `Nunito_500Medium`, `Nunito_600SemiBold`, `Nunito_700Bold`, `Nunito_800ExtraBold`
     - `NotoSansDevanagari_400Regular`, `NotoSansDevanagari_600SemiBold`, `NotoSansDevanagari_700Bold`
2. **Theme Colors & Typography Constants**:
   - In `constants/theme.ts` (lines 1-31):
     - `colors.amber`: `#E8A04A` (warm golden amber)
     - `colors.cream`: `#F4E6C8` (soft cream parchment)
     - `colors.creamMuted`: `#C4B59A`
     - `colors.skyTop`: `#1A1020`, `colors.surface`: `#261C16`, `colors.background`: `#1A1410`
   - In `constants/theme.ts` (lines 49-56):
     - `brand.name`: `'Saanjh'`
     - `brand.nameNe`: `'साँझ'`
     - `brand.pitch.en`: `'The last five minutes of every child’s day, made magical — and made in a voice that sounds like home.'`
     - `brand.pitch.ne`: `'हरेक नानीको दिनको अन्तिम पाँच मिनेट — जादुमय, र घरजस्तो आवाजमा।'`
3. **Audio Trigger & Timing Context**:
   - `assets/audio/chime.wav` is available and mapped in `lib/sounds.ts` (line 11) and `lib/audio.ts` (lines 170-172: `playChime()`).
   - Book opening animation (Explorer 1) spans ~400ms to 1200ms with 3D page turn; particle release and logo reveal must synchronize gracefully starting from ~300ms.

---

## 2. Logic Chain

### 2.1 Stardust Particle Physics Engine
1. **Mathematical Model**:
   - **Emitter Center**: Origin at book locus `(originX, originY)` near screen center `(width/2, height * 0.44)`.
   - **Vertical Upward Lift (`deltaY`)**: Particles launch upward with negative Y displacements ranging from `-180px` to `-340px`. Easing curve `Easing.bezier(0.25, 0.1, 0.25, 1)` provides initial acceleration bursting from the pages followed by soft buoyant float.
   - **Horizontal Dispersion (`deltaX`)**: Symmetrical fan-out from `-110px` (leftward over left book page) to `+110px` (rightward over right page).
   - **Sine-Wave Sway (`sineOffset`)**: As particles rise, a transverse oscillation is applied:  
     $$\text{translateX}(t) = \text{baseDriftX}(t) + \sin(t \cdot 2\pi \cdot f + \phi) \cdot A$$  
     where $f \in [1.2, 2.3]\text{ cycles}$, $A \in [6, 18]\text{ px}$, and $\phi \in [0, 2\pi]$.
   - **Twinkle Scale Envelope**:
     - $p = 0.00$: $\text{scale} = 0.0$ (dormant in book)
     - $p = 0.20$: $\text{scale} = 1.15 \times \text{size}$ (burst pop)
     - $p = 0.50$: $\text{scale} = 0.75 \times \text{size}$ (twinkle dip)
     - $p = 0.80$: $\text{scale} = 1.05 \times \text{size}$ (secondary twinkle)
     - $p = 1.00$: $\text{scale} = 0.10 \times \text{size}$ (fade dissolve)
   - **Opacity Envelope**: Quick fade-in from $0 \to 0.95$ over $[0, 0.18]$, sustained brilliance $0.95 \to 0.85$ through $[0.18, 0.70]$, dissolving to $0.0$ over $[0.70, 1.00]$.
   - **Rotation**: Concurrent spin of $\pm 60^\circ$ to $\pm 90^\circ$ for ✦ and ★ shapes.
2. **Deterministic Seed Table**:
   - 22 pre-computed seed particles with varied delays ($150\text{ms} - 1150\text{ms}$), durations ($2000\text{ms} - 2900\text{ms}$), sizes ($4\text{px} - 22\text{px}$), and shapes (`sparkle`, `star`, `dot`).
   - Using a fixed seed table prevents random recalculations across re-renders and guarantees 100% native UI-thread animation stability.

### 2.2 Bilingual Logo Reveal Choreography
1. **Typography Hierarchy**:
   - **Primary Title**: `"Saanjh"` rendered in `Nunito_800ExtraBold`, 40px, `#E8A04A` (warm amber gold), `letterSpacing: 2.5`, amber text glow shadow (`radius: 16`).
   - **Celestial Filigree Divider**: Ornate SVG horizontal line with center ✦ diamond sparkle tapering into transparent edges (`#E8A04A` with 60% opacity).
   - **Nepali Subtitle**: `"साँझ - Bedtime Stories & Novels"` or `"सुत्ने बेलाको कथा र उपन्यास"` rendered in `NotoSansDevanagari_700Bold`, 16px, `#F4E6C8` (soft cream), `letterSpacing: 0.5`.
   - **Tagline**: `"हरेक दिनको अन्तिम पाँच मिनेट"` (or `"The last five minutes of every child's day"`), `Nunito_600SemiBold`, 12px, `#C4B59A`.
2. **Staggered Entrance Timeline**:
   - $t = 500\text{ms}$: Title `"Saanjh"` slides upward ($\Delta y: 22 \to 0$) and scales ($0.92 \to 1.0$) with `opacity: 0 \to 1` via `Easing.bezier(0.16, 1, 0.3, 1)`.
   - $t = 800\text{ms}$ (+300ms): Gold divider & Devanagari subtitle fade and slide in ($\Delta y: 14 \to 0$, $\text{opacity}: 0 \to 1$).
   - $t = 1050\text{ms}$ (+250ms): Tagline fades in.
   - $t = 1600\text{ms}+$: Ambient glow breathing pulsation loop ($\text{opacity}: 0.7 \leftrightarrow 1.0$).

### 2.3 Ambient Background Celestial Glow
1. Multi-stop radial gradient centered behind the book:
   - $0\%$: `#FFD580` (80% opacity)
   - $25\%$: `#E8A04A` (50% opacity)
   - $55\%$: `#A85820` (25% opacity)
   - $80\%$: `#2A1830` (8% opacity)
   - $100\%$: `#060913` (0% opacity)
2. Animated scale breathing ($0.92 \leftrightarrow 1.12$) and opacity breathing ($0.5 \leftrightarrow 0.85$) on a smooth 3.5s sine cycle.

---

## 3. Caveats

1. **Native Thread Execution**: All particle transforms and opacity properties use standard Reanimated animated styles running directly on the UI thread (`react-native-worklets`), avoiding any JS bridge traffic.
2. **Font Hydration Safety**: If custom fonts are still mounting during the initial frame, fallback system typography renders without throwing errors, switching seamlessly to `Nunito_800ExtraBold` and `NotoSansDevanagari_700Bold`.
3. **Pointer Events**: All particle and glow containers must have `pointerEvents="none"` so that user taps on the splash overlay are immediately captured by the tap-to-skip gesture handler without interception.

---

## 4. Conclusion & Complete Implementation Blueprint

### Blueprint 1: `components/splash/StardustParticles.tsx`

```tsx
import React, { useEffect } from 'react';
import { Dimensions, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type ParticleShape = 'sparkle' | 'star' | 'dot';

export interface ParticleConfig {
  id: number;
  shape: ParticleShape;
  size: number;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  sineAmp: number;
  sineFreq: number;
  phase: number;
  delay: number;
  duration: number;
  color: string;
}

// 22 Pre-computed deterministic particle seeds
export const PARTICLE_SEEDS: ParticleConfig[] = [
  { id: 1, shape: 'sparkle', size: 18, startX: -15, startY: 0, deltaX: -65, deltaY: -210, sineAmp: 14, sineFreq: 1.5, phase: 0.0, delay: 250, duration: 2200, color: '#FFD580' },
  { id: 2, shape: 'star', size: 14, startX: 10, startY: -5, deltaX: 75, deltaY: -240, sineAmp: 18, sineFreq: 1.2, phase: 1.2, delay: 350, duration: 2400, color: '#E8A04A' },
  { id: 3, shape: 'dot', size: 7, startX: -5, startY: 5, deltaX: -25, deltaY: -280, sineAmp: 8, sineFreq: 2.0, phase: 2.4, delay: 150, duration: 2100, color: '#FFF8E7' },
  { id: 4, shape: 'sparkle', size: 22, startX: 0, startY: -10, deltaX: 15, deltaY: -320, sineAmp: 12, sineFreq: 1.8, phase: 0.8, delay: 450, duration: 2600, color: '#FFFFFF' },
  { id: 5, shape: 'dot', size: 5, startX: -25, startY: 2, deltaX: -85, deltaY: -180, sineAmp: 10, sineFreq: 1.6, phase: 3.1, delay: 300, duration: 2000, color: '#E8A04A' },
  { id: 6, shape: 'star', size: 16, startX: 20, startY: 0, deltaX: 95, deltaY: -260, sineAmp: 15, sineFreq: 1.4, phase: 4.2, delay: 500, duration: 2500, color: '#FFD580' },
  { id: 7, shape: 'dot', size: 8, startX: 5, startY: -8, deltaX: 35, deltaY: -290, sineAmp: 10, sineFreq: 2.2, phase: 1.5, delay: 200, duration: 2300, color: '#F4E6C8' },
  { id: 8, shape: 'sparkle', size: 16, startX: -30, startY: -4, deltaX: -105, deltaY: -230, sineAmp: 16, sineFreq: 1.3, phase: 5.0, delay: 600, duration: 2400, color: '#FFD580' },
  { id: 9, shape: 'dot', size: 6, startX: 15, startY: 4, deltaX: 50, deltaY: -200, sineAmp: 9, sineFreq: 1.9, phase: 2.0, delay: 400, duration: 2100, color: '#E8A04A' },
  { id: 10, shape: 'star', size: 12, startX: -10, startY: -2, deltaX: -40, deltaY: -310, sineAmp: 14, sineFreq: 1.7, phase: 0.5, delay: 700, duration: 2700, color: '#FFFFFF' },
  { id: 11, shape: 'sparkle', size: 20, startX: 25, startY: -6, deltaX: 60, deltaY: -270, sineAmp: 12, sineFreq: 1.5, phase: 3.8, delay: 550, duration: 2300, color: '#FFD580' },
  { id: 12, shape: 'dot', size: 9, startX: -20, startY: 8, deltaX: -70, deltaY: -250, sineAmp: 11, sineFreq: 2.1, phase: 1.8, delay: 380, duration: 2200, color: '#F4E6C8' },
  { id: 13, shape: 'dot', size: 5, startX: 0, startY: 0, deltaX: -10, deltaY: -330, sineAmp: 7, sineFreq: 1.4, phase: 4.6, delay: 800, duration: 2800, color: '#FFF8E7' },
  { id: 14, shape: 'star', size: 15, startX: -35, startY: -10, deltaX: -90, deltaY: -190, sineAmp: 16, sineFreq: 1.6, phase: 2.8, delay: 650, duration: 2200, color: '#E8A04A' },
  { id: 15, shape: 'sparkle', size: 14, startX: 30, startY: 2, deltaX: 110, deltaY: -220, sineAmp: 13, sineFreq: 1.3, phase: 0.9, delay: 750, duration: 2400, color: '#FFD580' },
  { id: 16, shape: 'dot', size: 6, startX: -8, startY: -3, deltaX: -30, deltaY: -260, sineAmp: 8, sineFreq: 2.3, phase: 3.5, delay: 480, duration: 2000, color: '#FFFFFF' },
  { id: 17, shape: 'dot', size: 8, startX: 18, startY: 6, deltaX: 45, deltaY: -300, sineAmp: 12, sineFreq: 1.7, phase: 5.5, delay: 850, duration: 2500, color: '#F4E6C8' },
  { id: 18, shape: 'star', size: 18, startX: -2, startY: -12, deltaX: 5, deltaY: -340, sineAmp: 10, sineFreq: 1.5, phase: 1.1, delay: 900, duration: 2900, color: '#FFD580' },
  { id: 19, shape: 'sparkle', size: 12, startX: -18, startY: 4, deltaX: -55, deltaY: -215, sineAmp: 15, sineFreq: 1.8, phase: 4.0, delay: 950, duration: 2100, color: '#E8A04A' },
  { id: 20, shape: 'dot', size: 4, startX: 12, startY: -6, deltaX: 80, deltaY: -275, sineAmp: 9, sineFreq: 2.0, phase: 2.2, delay: 1000, duration: 2300, color: '#FFFFFF' },
  { id: 21, shape: 'sparkle', size: 17, startX: -28, startY: -2, deltaX: -80, deltaY: -305, sineAmp: 14, sineFreq: 1.4, phase: 0.3, delay: 1100, duration: 2600, color: '#FFD580' },
  { id: 22, shape: 'star', size: 13, startX: 22, startY: 5, deltaX: 65, deltaY: -235, sineAmp: 11, sineFreq: 1.9, phase: 3.3, delay: 1150, duration: 2250, color: '#F4E6C8' },
];

function SparkleStar({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 0 C12 6.627 6.627 12 0 12 C6.627 12 12 17.373 12 24 C12 17.373 17.373 12 24 12 C17.373 12 12 6.627 12 0 Z"
        fill={color}
      />
      <Circle cx={12} cy={12} r={3} fill="#FFFFFF" opacity={0.85} />
    </Svg>
  );
}

function FivePointStar({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2 L14.9 8.26 L21.8 9.27 L16.8 14.14 L18 21.02 L12 17.77 L6 21.02 L7.2 14.14 L2.2 9.27 L9.1 8.26 Z"
        fill={color}
      />
      <Circle cx={12} cy={12} r={2.2} fill="#FFFFFF" opacity={0.75} />
    </Svg>
  );
}

function GlowDot({ size, color }: { size: number; color: string }) {
  const r = size / 2;
  return (
    <Svg width={size * 2} height={size * 2} viewBox={`0 0 ${size * 2} ${size * 2}`}>
      <Circle cx={size} cy={size} r={r * 1.8} fill={color} opacity={0.22} />
      <Circle cx={size} cy={size} r={r * 1.1} fill={color} opacity={0.55} />
      <Circle cx={size} cy={size} r={r * 0.65} fill="#FFFFFF" opacity={0.9} />
    </Svg>
  );
}

function ParticleItem({ config, active }: { config: ParticleConfig; active: boolean }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (active) {
      progress.value = withDelay(
        config.delay,
        withRepeat(
          withTiming(1, {
            duration: config.duration,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
          -1,
          false
        )
      );
    }
  }, [active, config.delay, config.duration, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const transY = interpolate(p, [0, 1], [0, config.deltaY], Extrapolation.CLAMP);
    const baseDriftX = interpolate(p, [0, 1], [0, config.deltaX], Extrapolation.CLAMP);
    const sineOffset = Math.sin(p * Math.PI * 2 * config.sineFreq + config.phase) * config.sineAmp;
    const transX = baseDriftX + sineOffset;

    const opacity = interpolate(
      p,
      [0, 0.18, 0.7, 1.0],
      [0, 0.95, 0.85, 0],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      p,
      [0, 0.2, 0.45, 0.75, 1.0],
      [0, 1.15, 0.75, 1.05, 0.1],
      Extrapolation.CLAMP
    );

    const rotDelta = config.deltaX >= 0 ? 70 : -70;
    const rotate = `${interpolate(p, [0, 1], [0, rotDelta])}deg`;

    return {
      transform: [
        { translateX: config.startX + transX },
        { translateY: config.startY + transY },
        { scale },
        { rotate },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.particleWrapper, animatedStyle]}
    >
      {config.shape === 'sparkle' && <SparkleStar size={config.size} color={config.color} />}
      {config.shape === 'star' && <FivePointStar size={config.size} color={config.color} />}
      {config.shape === 'dot' && <GlowDot size={config.size} color={config.color} />}
    </Animated.View>
  );
}

export interface StardustParticlesProps {
  active?: boolean;
  originX?: number;
  originY?: number;
  style?: StyleProp<ViewStyle>;
}

export function StardustParticles({
  active = true,
  originX = SCREEN_WIDTH / 2,
  originY = SCREEN_HEIGHT * 0.44,
  style,
}: StardustParticlesProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        { left: originX, top: originY },
        style,
      ]}
    >
      {PARTICLE_SEEDS.map((seed) => (
        <ParticleItem key={seed.id} config={seed} active={active} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

---

### Blueprint 2: `components/splash/BilingualLogoReveal.tsx`

```tsx
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors } from '@/constants/theme';

export interface BilingualLogoRevealProps {
  active?: boolean;
  startDelayMs?: number;
}

export function BilingualLogoReveal({ active = true, startDelayMs = 500 }: BilingualLogoRevealProps) {
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(22);
  const titleScale = useSharedValue(0.92);

  const dividerOpacity = useSharedValue(0);
  const dividerScaleX = useSharedValue(0.4);

  const subOpacity = useSharedValue(0);
  const subTranslateY = useSharedValue(14);

  const taglineOpacity = useSharedValue(0);
  const breathingGlow = useSharedValue(0.7);

  useEffect(() => {
    if (!active) return;

    // 1. Primary Title "Saanjh" Entrance
    titleOpacity.value = withDelay(
      startDelayMs,
      withTiming(1, { duration: 850, easing: Easing.bezier(0.16, 1, 0.3, 1) })
    );
    titleTranslateY.value = withDelay(
      startDelayMs,
      withTiming(0, { duration: 850, easing: Easing.bezier(0.16, 1, 0.3, 1) })
    );
    titleScale.value = withDelay(
      startDelayMs,
      withTiming(1, { duration: 850, easing: Easing.bezier(0.16, 1, 0.3, 1) })
    );

    // 2. Ornate Divider Expansion
    dividerOpacity.value = withDelay(
      startDelayMs + 250,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
    dividerScaleX.value = withDelay(
      startDelayMs + 250,
      withTiming(1, { duration: 800, easing: Easing.bezier(0.16, 1, 0.3, 1) })
    );

    // 3. Nepali Devanagari Subtitle
    subOpacity.value = withDelay(
      startDelayMs + 400,
      withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) })
    );
    subTranslateY.value = withDelay(
      startDelayMs + 400,
      withTiming(0, { duration: 750, easing: Easing.out(Easing.cubic) })
    );

    // 4. Tagline Entrance
    taglineOpacity.value = withDelay(
      startDelayMs + 650,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
    );

    // 5. Continuous Ambient Glow Breathing
    breathingGlow.value = withDelay(
      startDelayMs + 1200,
      withRepeat(
        withSequence(
          withTiming(1.0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.65, { duration: 1800, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, [
    active,
    startDelayMs,
    titleOpacity,
    titleTranslateY,
    titleScale,
    dividerOpacity,
    dividerScaleX,
    subOpacity,
    subTranslateY,
    taglineOpacity,
    breathingGlow,
  ]);

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [
      { translateY: titleTranslateY.value },
      { scale: titleScale.value },
    ],
  }));

  const dividerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dividerOpacity.value,
    transform: [{ scaleX: dividerScaleX.value }],
  }));

  const subAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subOpacity.value,
    transform: [{ translateY: subTranslateY.value }],
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value * breathingGlow.value,
  }));

  return (
    <View pointerEvents="none" style={styles.container}>
      {/* Primary English Brand Title */}
      <Animated.View style={titleAnimatedStyle}>
        <Text style={styles.brandTitle}>Saanjh</Text>
      </Animated.View>

      {/* Ornate Golden Filigree Divider */}
      <Animated.View style={[styles.dividerWrapper, dividerAnimatedStyle]}>
        <Svg width={200} height={14} viewBox="0 0 200 14" fill="none">
          <Defs>
            <LinearGradient id="divGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#E8A04A" stopOpacity="0" />
              <Stop offset="40%" stopColor="#E8A04A" stopOpacity="0.75" />
              <Stop offset="50%" stopColor="#FFD580" stopOpacity="1" />
              <Stop offset="60%" stopColor="#E8A04A" stopOpacity="0.75" />
              <Stop offset="100%" stopColor="#E8A04A" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          {/* Tapered Line */}
          <Path d="M10 7 L90 7 M110 7 L190 7" stroke="url(#divGrad)" strokeWidth={1.5} />
          {/* Center Diamond Sparkle */}
          <Path
            d="M100 2 C100 5.2 101.8 7 105 7 C101.8 7 100 8.8 100 12 C100 8.8 98.2 7 95 7 C98.2 7 100 5.2 100 2 Z"
            fill="#FFD580"
          />
        </Svg>
      </Animated.View>

      {/* Nepali Devanagari Primary Subtitle */}
      <Animated.View style={subAnimatedStyle}>
        <Text style={styles.nepaliSubtitle}>साँझ — Bedtime Stories & Novels</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={[styles.taglineWrapper, taglineAnimatedStyle]}>
        <Text style={styles.tagline}>हरेक नानीको दिनको अन्तिम पाँच मिनेट</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
  },
  brandTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 42,
    color: '#E8A04A',
    letterSpacing: 3,
    textShadowColor: 'rgba(232, 160, 74, 0.65)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  dividerWrapper: {
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nepaliSubtitle: {
    fontFamily: 'NotoSansDevanagari_700Bold',
    fontSize: 16,
    color: '#F4E6C8',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(244, 230, 200, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    textAlign: 'center',
  },
  taglineWrapper: {
    marginTop: 6,
  },
  tagline: {
    fontFamily: 'NotoSansDevanagari_400Regular',
    fontSize: 12.5,
    color: '#C4B59A',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
});
```

---

### Blueprint 3: `components/splash/CelestialGlow.tsx`

```tsx
import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

export interface CelestialGlowProps {
  size?: number;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function CelestialGlow({ size = 320, active = true, style }: CelestialGlowProps) {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    if (!active) return;

    // Smooth bloom on entrance
    scale.value = withTiming(1.05, { duration: 1200, easing: Easing.out(Easing.cubic) }, () => {
      // Gentle continuous breathing
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.96, { duration: 2200, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    });

    opacity.value = withTiming(0.85, { duration: 1000 }, () => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.6, { duration: 2200, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    });
  }, [active, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { width: size, height: size },
        animatedStyle,
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="celestialBackdrop" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor="#FFD580" stopOpacity="0.85" />
            <Stop offset="28%" stopColor="#E8A04A" stopOpacity="0.48" />
            <Stop offset="58%" stopColor="#A85820" stopOpacity="0.22" />
            <Stop offset="82%" stopColor="#1A1020" stopOpacity="0.08" />
            <Stop offset="100%" stopColor="#060913" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={size} height={size} fill="url(#celestialBackdrop)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

---

## 5. Verification Method

1. **TypeScript Typecheck**:
   ```bash
   npx tsc --noEmit
   ```
   Validates zero syntax, missing prop, or type discrepancies.
2. **Visual & Timing Inspection**:
   - Verify `PARTICLE_SEEDS` 22 particles radiate smoothly upwards from `originY = SCREEN_HEIGHT * 0.44`.
   - Verify `"Saanjh"` appears in `Nunito_800ExtraBold` with `#E8A04A` text shadow at $t=500\text{ms}$.
   - Verify Nepali subtitle `"साँझ — Bedtime Stories & Novels"` appears in `NotoSansDevanagari_700Bold` at $t=900\text{ms}$.
   - Verify continuous 60 FPS performance without frame drops or GC spikes.
3. **End-to-End Suite**:
   ```bash
   node scripts/verify_e2e.js
   ```
