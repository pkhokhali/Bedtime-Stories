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

  // Book dimensions responsive to screen width
  const bookWidth = Math.min(290, width * 0.82);
  const bookHeight = (bookWidth / 290) * 216;

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
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Layer 1 & 2 & 3: Ambient Glow, Animated Storybook & Stardust Particles */}
        <View style={[styles.centerStage, { width: bookWidth, height: bookHeight }]}>
          <Animated.View style={[styles.celestialAura, auraAnimatedStyle]} />

          {/* Animated Storybook */}
          <AnimatedStorybook width={bookWidth} height={bookHeight} />

          {/* Stardust Sparkle Particle Field */}
          <StardustParticles
            count={22}
            active={true}
            originX={bookWidth / 2}
            originY={bookHeight * 0.5}
          />
        </View>

        {/* Layer 4: Bilingual Logo & Subtitle Reveal */}
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: '#060913',
  },
  pressableOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerStage: {
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
