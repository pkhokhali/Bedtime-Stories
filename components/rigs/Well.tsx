import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { TigerRig } from '@/components/rigs/TigerRig';
import { Pose } from '@/types/story';

type Props = {
  tigerPose: Pose;
  splashing?: boolean;
};

export function Well({ tigerPose, splashing = false }: Props) {
  const ripple = useSharedValue(0.4);

  useEffect(() => {
    ripple.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
  }, [ripple]);

  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: 0.7 + ripple.value * 0.35 }],
    opacity: 0.55 - ripple.value * 0.4,
  }));

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Svg width={220} height={150} viewBox="0 0 220 150">
        <Ellipse cx="110" cy="118" rx="96" ry="22" fill="#3A322C" />
        <Path d="M20 70 Q 20 118 110 128 Q 200 118 200 70 Q 200 42 110 38 Q 20 42 20 70 Z" fill="#6B5E52" />
        <Path d="M38 68 Q 38 108 110 116 Q 182 108 182 68 Q 182 50 110 48 Q 38 50 38 68 Z" fill="#2A4A4A" />
        <Ellipse cx="110" cy="62" rx="64" ry="14" fill="#3E6A68" opacity={0.55} />
      </Svg>
      <View style={styles.waterClip}>
        <View style={styles.reflection}>
          <TigerRig pose={tigerPose === 'hidden' ? 'idle' : tigerPose} size={120} dimmed mirrored />
        </View>
      </View>
      <Animated.View style={[styles.ripple, ring]}>
        <Svg width={140} height={36} viewBox="0 0 140 36">
          <Ellipse cx="70" cy="18" rx="60" ry="12" stroke="#F4E6C8" strokeWidth="2" fill="none" opacity={0.5} />
        </Svg>
      </Animated.View>
      {splashing ? (
        <View style={styles.splash}>
          <Svg width={160} height={80} viewBox="0 0 160 80">
            <Circle cx="80" cy="50" r="8" fill="#C8E4E0" />
            <Circle cx="58" cy="28" r="6" fill="#A8D0CC" />
            <Circle cx="104" cy="24" r="7" fill="#C8E4E0" />
            <Circle cx="80" cy="16" r="5" fill="#E8F4F2" />
          </Svg>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 220, height: 150, alignItems: 'center' },
  waterClip: {
    position: 'absolute',
    top: 48,
    width: 140,
    height: 58,
    overflow: 'hidden',
    borderRadius: 70,
    alignItems: 'center',
  },
  reflection: {
    marginTop: -8,
    transform: [{ scaleY: -1 }],
  },
  ripple: {
    position: 'absolute',
    top: 58,
  },
  splash: {
    position: 'absolute',
    top: 8,
  },
});
