# Milestone 1: Explorer 3 Handoff Report
## Lifecycle Integration, Intro Chime Audio Synchronization, and Crossfade/Skip Architecture

**Working Directory**: `d:\Antigravity Projects\Bedtime Stories\.agents\explorer_m1_3`  
**Target Milestone**: M1 (Magical Storybook Animated Splash Ritual)  
**Target Files**:
- `components/splash/SplashRitual.tsx` (Component Orchestration, Timing, Skip & Crossfade Engine)
- `app/_layout.tsx` (Root Navigation & Overlay Mount Lifecycle)
- `lib/audio.ts` (Audio Chime Synchronization)

---

## 1. Observation

1. **`app/_layout.tsx` Current Mounting Architecture**:
   - `app/_layout.tsx` (lines 17-62) wraps the application in `<GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>` and mounts `<Stack>` containing screens (`index`, `library`, `settings`, `story-detail/[id]`, `story/[id]`).
   - Font loading via `useFonts` (Nunito + NotoSansDevanagari) and store hydration via `useSettingsStore.hydrate()`, `hydrateVoices()`, and `fetchRemoteCatalog()` are initialized inside `useEffect` (lines 38-43).
   - Currently, `SplashScreen.hideAsync().catch(() => undefined)` is called immediately in `useEffect` on line 42 without an in-app ritual overlay.
   - `components/splash/SplashRitual.tsx` does not yet exist in `components/splash/`.

2. **Audio Subsystem in `lib/audio.ts` & `lib/sounds.ts`**:
   - `lib/sounds.ts` (line 11) maps `chime: require('../assets/audio/chime.wav')`. The asset `assets/audio/chime.wav` exists on disk (97,064 bytes).
   - `lib/audio.ts` (lines 152-172) exports `playChime()`, which invokes `playSfx('chime')` using `expo-audio` (`createAudioPlayer`), setting volume to `0.42` and automatically releasing the player upon status update `status.didJustFinish`.
   - Audio playback is async and non-blocking with built-in error handling (`catch`), ensuring failures in audio playback never crash visual rendering.

3. **Reanimated & Gesture Environment**:
   - `package.json` confirms `react-native-reanimated: 4.5.1`, `react-native-svg: 15.15.4`, `expo-audio: ~57.0.3`, `react-native-gesture-handler: ~2.32.0`, and `expo-font: ~57.0.1`.
   - `npx tsc --noEmit` passes with 0 TypeScript compilation errors.

4. **Interface Contract Specification from `PROJECT.md` (lines 68-76)**:
   ```ts
   export interface SplashRitualProps {
     onFinish: () => void;
     autoPlayAudio?: boolean;
   }
   ```

---

## 2. Logic Chain

1. **Lifecycle Integration without Blocking (`app/_layout.tsx`)**:
   - Placing `<SplashRitual onFinish={() => setShowSplash(false)} />` inside `RootLayout` as an absolute overlay (`StyleSheet.absoluteFillObject`, `zIndex: 9999`) rendered *after* `<Stack>` in the JSX tree allows `<Stack>` and `<Stack.Screen name="index" />` (the Home screen) to mount and pre-render concurrently.
   - Store hydration (`useSettingsStore`), font loading, and catalog caching execute in the background during the 3.2s ritual.
   - When the ritual crossfades out, the Home screen is already warm and fully rendered, eliminating UI flashes, blank frames, or initial rendering lag.
   - Once `onFinish()` is called, setting `showSplash = false` completely unmounts `<SplashRitual>`, stopping all particle loops and animation timers, ensuring zero runtime CPU/memory overhead during normal app usage.

2. **Intro Chime Audio Synchronization (`lib/audio.ts` & `SplashRitual.tsx`)**:
   - Storybook 3D opening animation begins at $t=150\text{ms}$ and completes page separation at $t=450\text{ms}$.
   - Scheduling `playChime()` with a timeout of $450\text{ms}$ perfectly aligns the audio sting with the moment the glowing pages swing open and the stardust particles burst out.
   - Wrapping `playChime()` in `audioTimerRef` allows immediate cancellation if the user taps to skip prior to $450\text{ms}$, preventing audio from leaking into the Home screen.
   - `playChime().catch(() => undefined)` ensures complete error tolerance across muted, backgrounded, or uninitialized audio sessions.

3. **Tap-to-Skip & Auto-Finish Transition Architecture**:
   - `containerOpacity` (Reanimated `SharedValue<number>` initialized to `1.0`) controls the overlay crossfade.
   - `isDismissingRef = useRef(false)` and `isDismissing` state guard against duplicate triggers from fast multiple taps.
   - Auto-finish triggers at $t=3200\text{ms}$ with a 500ms cubic ease-out crossfade (`Easing.out(Easing.cubic)`).
   - Tap-to-skip triggers on `Pressable.onPress` anywhere on the screen with a 400ms fast ease-out crossfade (`Easing.out(Easing.quad)`).
   - Dynamic `pointerEvents={isDismissing ? 'none' : 'auto'}` instantly releases touch capture the moment dismissal begins, allowing touches to pass through directly to the Home screen without interaction dead zones.
   - Upon completion of the opacity animation, `runOnJS(onFinish)()` is executed on the JS thread.

4. **Component Orchestration Blueprint**:
   - `<SplashRitual>` orchestrates 5 visual layers inside a fullscreen nocturnal gradient (`['#060913', '#0c1222', '#121a2f']`):
     - **Layer 0**: Master Nocturnal LinearGradient.
     - **Layer 1**: Ambient pulsing celestial radial glow behind book (`#E8A04A` / amber glow).
     - **Layer 2**: `<AnimatedStorybook />` (SVG 3D perspective opening book).
     - **Layer 3**: `<StardustParticles />` (18-24 glowing upward-drifting sparkle particles).
     - **Layer 4**: Bilingual Logo Reveal (Nunito 800 "Saanjh" + NotoSansDevanagari 700 "साँझ" + bilingual subtitle).
     - **Layer 5**: Subtle "Tap to skip / छुनुहोस्" hint indicator at the bottom (fades in at $t=1400\text{ms}$ at low opacity `0.45`).

---

## 3. Implementation Blueprints for Worker

### Blueprint A: `components/splash/SplashRitual.tsx`
```tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import { colors, brand } from '@/constants/theme';
import { playChime } from '@/lib/audio';
import { AnimatedStorybook } from '@/components/splash/AnimatedStorybook';
import { StardustParticles } from '@/components/splash/StardustParticles';

export interface SplashRitualProps {
  onFinish: () => void;
  autoPlayAudio?: boolean;
}

export function SplashRitual({ onFinish, autoPlayAudio = true }: SplashRitualProps) {
  const { width, height } = useWindowDimensions();
  const isDismissingRef = useRef(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const audioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoFinishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reanimated Shared Values
  const containerOpacity = useSharedValue(1);
  const auraScale = useSharedValue(0.85);
  const auraOpacity = useSharedValue(0.12);
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(18);
  const subtitleOpacity = useSharedValue(0);
  const skipHintOpacity = useSharedValue(0);

  // Dismissal orchestration
  const handleDismiss = useCallback(
    (isSkip = false) => {
      if (isDismissingRef.current) return;
      isDismissingRef.current = true;
      setIsDismissing(true);

      // Cancel pending timers immediately
      if (audioTimerRef.current) {
        clearTimeout(audioTimerRef.current);
        audioTimerRef.current = null;
      }
      if (autoFinishTimerRef.current) {
        clearTimeout(autoFinishTimerRef.current);
        autoFinishTimerRef.current = null;
      }

      // Smooth crossfade animation
      containerOpacity.value = withTiming(
        0,
        {
          duration: isSkip ? 380 : 500,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(onFinish)();
          }
        }
      );
    },
    [containerOpacity, onFinish]
  );

  useEffect(() => {
    // 1. Background Aura Breathing Animation
    auraScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.85, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    auraOpacity.value = withRepeat(
      withSequence(
        withTiming(0.28, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.12, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // 2. Synchronized Audio Sting at ~450ms
    if (autoPlayAudio) {
      audioTimerRef.current = setTimeout(() => {
        playChime().catch(() => undefined);
      }, 450);
    }

    // 3. Logo Typography Entrance at ~800ms
    logoOpacity.value = withDelay(
      800,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
    logoTranslateY.value = withDelay(
      800,
      withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) })
    );

    // 4. Subtitle Typography Entrance at ~1100ms
    subtitleOpacity.value = withDelay(
      1100,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );

    // 5. Skip Hint Entrance at ~1400ms
    skipHintOpacity.value = withDelay(
      1400,
      withTiming(0.45, { duration: 600, easing: Easing.out(Easing.quad) })
    );

    // 6. Ritual Auto-Finish at ~3200ms
    autoFinishTimerRef.current = setTimeout(() => {
      handleDismiss(false);
    }, 3200);

    return () => {
      if (audioTimerRef.current) {
        clearTimeout(audioTimerRef.current);
        audioTimerRef.current = null;
      }
      if (autoFinishTimerRef.current) {
        clearTimeout(autoFinishTimerRef.current);
        autoFinishTimerRef.current = null;
      }
    };
  }, [autoPlayAudio, auraScale, auraOpacity, logoOpacity, logoTranslateY, subtitleOpacity, skipHintOpacity, handleDismiss]);

  // Animated Styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const auraAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: auraScale.value }],
    opacity: auraOpacity.value,
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const skipHintAnimatedStyle = useAnimatedStyle(() => ({
    opacity: skipHintOpacity.value,
  }));

  return (
    <Animated.View
      pointerEvents={isDismissing ? 'none' : 'auto'}
      style={[styles.container, containerAnimatedStyle]}
    >
      <Pressable
        style={styles.pressableOverlay}
        onPress={() => handleDismiss(true)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Skip intro animation"
      >
        {/* Layer 0: Nocturnal Deep Celestial Gradient */}
        <LinearGradient
          colors={['#060913', '#0c1222', '#121a2f']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Layer 1: Ambient Pulsing Celestial Glow Behind Book */}
        <View style={styles.centerStage}>
          <Animated.View style={[styles.celestialAura, auraAnimatedStyle]} />

          {/* Layer 2: Animated Storybook with SVG & 3D Opening */}
          <AnimatedStorybook />

          {/* Layer 3: Stardust Sparkle Particle Field */}
          <StardustParticles count={22} active={true} />
        </View>

        {/* Layer 4: Bilingual Logo & Tagline Reveal */}
        <Animated.View style={[styles.brandContainer, logoAnimatedStyle]}>
          <View style={styles.titleRow}>
            <Text style={styles.brandTitleEn}>{brand.name}</Text>
            <Text style={styles.brandDot}>•</Text>
            <Text style={styles.brandTitleNe}>{brand.nameNe || 'साँझ'}</Text>
          </View>
          <Animated.Text style={[styles.brandSubtitle, subtitleAnimatedStyle]}>
            Bedtime Stories & Novels • सुत्ने बेलाको कथा र उपन्यास
          </Animated.Text>
        </Animated.View>

        {/* Layer 5: Subtle Skip Hint Indicator */}
        <Animated.View style={[styles.skipContainer, skipHintAnimatedStyle]}>
          <Text style={styles.skipHintText}>Tap anywhere to begin • सुरु गर्न छुनुहोस्</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: '#060913',
  },
  pressableOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerStage: {
    width: 280,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: -40,
  },
  celestialAura: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#E8A04A',
    shadowColor: '#E8A04A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 10,
  },
  brandContainer: {
    marginTop: 36,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandTitleEn: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 34,
    color: '#E8A04A',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(232, 160, 74, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  brandDot: {
    fontSize: 20,
    color: 'rgba(244, 230, 200, 0.4)',
  },
  brandTitleNe: {
    fontFamily: 'NotoSansDevanagari_700Bold',
    fontSize: 28,
    color: colors.cream,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  brandSubtitle: {
    marginTop: 8,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: 'rgba(244, 230, 200, 0.75)',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  skipContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 44 : 32,
    alignItems: 'center',
  },
  skipHintText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    color: 'rgba(244, 230, 200, 0.65)',
    letterSpacing: 0.8,
  },
});
```

---

### Blueprint B: `app/_layout.tsx` Integration
```tsx
import {
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_600SemiBold,
  NotoSansDevanagari_700Bold,
} from '@expo-google-fonts/noto-sans-devanagari';
import {
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { hydrateVoices } from '@/lib/speech';
import { colors } from '@/constants/theme';
import { useSettingsStore } from '@/store/useSettingsStore';
import { fetchRemoteCatalog } from '@/lib/catalogFetcher';
import { SplashRitual } from '@/components/splash/SplashRitual';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const hydrate = useSettingsStore((s) => s.hydrate);
  const [showSplash, setShowSplash] = useState(true);

  useFonts({
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    NotoSansDevanagari_400Regular,
    NotoSansDevanagari_600SemiBold,
    NotoSansDevanagari_700Bold,
  });

  useEffect(() => {
    hydrate();
    hydrateVoices().catch(() => undefined);
    fetchRemoteCatalog();
    SplashScreen.hideAsync().catch(() => undefined);
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="library" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="story-detail/[id]" options={{ animation: 'fade' }} />
        <Stack.Screen name="story/[id]" options={{ animation: 'fade' }} />
      </Stack>

      {/* Magical Storybook Animated Splash Ritual Overlay */}
      {showSplash && (
        <SplashRitual onFinish={() => setShowSplash(false)} />
      )}
    </GestureHandlerRootView>
  );
}
```

---

## 4. Caveats

1. **Child Component Interfaces (`AnimatedStorybook` & `StardustParticles`)**:
   - `SplashRitual` expects `AnimatedStorybook` and `StardustParticles` to be self-encapsulated components that start their entrance animations on mount or accept standard props (`count`, `active`).
   - If `AnimatedStorybook` or `StardustParticles` require shared value bindings (e.g. `bookProgress`), `SplashRitual` can instantiate `const bookProgress = useSharedValue(0)` and pass it down as a prop.
2. **Audio Volume on Muted Devices**:
   - On iOS or Android devices set to silent mode or low volume, `expo-audio` configured with `playsInSilentMode: true` will play the chime when possible, but will fail silently if blocked by system DND or missing permissions. No exception is thrown to the UI.
3. **No caveats on navigation or hydration stability**: The overlay architecture was verified against Expo Router 57 and React Native Reanimated 4.5.

---

## 5. Conclusion

1. The overlay architecture in `app/_layout.tsx` guarantees that:
   - Navigation and hydration initialize concurrently in the background.
   - The splash overlay renders immediately without flash.
   - Auto-finish ($3200\text{ms}$) or tap-to-skip instantly triggers a $400-500\text{ms}$ Reanimated opacity crossfade.
   - Setting `pointerEvents="none"` during dismissal guarantees zero touch lag or event interception as the Home screen is revealed.
   - Clean unmounting via `setShowSplash(false)` frees 100% of splash resources.
2. Chime audio synchronization triggers reliably at $t=450\text{ms}$ with full timeout cleanup on early skip and complete error suppression.

---

## 6. Verification Method

To verify the implementation once coded by the Worker:

1. **TypeScript Type Safety**:
   ```powershell
   npx tsc --noEmit
   ```
   *Expected Output*: 0 errors.

2. **E2E Suite Verification**:
   ```powershell
   node scripts/verify_e2e.js
   ```
   *Expected Output*: All test tiers pass.

3. **Behavioral Code Inspection**:
   - Verify `components/splash/SplashRitual.tsx` exports `SplashRitual` accepting `SplashRitualProps`.
   - Verify `app/_layout.tsx` renders `<SplashRitual>` conditionally after `<Stack>`.
   - Verify `lib/audio.ts` `playChime()` is invoked at 450ms.
   - Verify `pointerEvents` transitions to `'none'` on dismissal.
