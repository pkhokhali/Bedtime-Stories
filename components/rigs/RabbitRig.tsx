import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { Pose } from '@/types/story';

type Props = {
  pose: Pose;
  size?: number;
};

export function RabbitRig({ pose, size = 118 }: Props) {
  const bob = useSharedValue(0);
  const blink = useSharedValue(1);

  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: pose === 'walk' ? 420 : 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: pose === 'walk' ? 420 : 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [bob, pose]);

  useEffect(() => {
    blink.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2800 }),
        withTiming(0.08, { duration: 80 }),
        withTiming(1, { duration: 80 }),
      ),
      -1,
      false,
    );
  }, [blink]);

  const wrap = useAnimatedStyle(() => ({
    transform: [
      { translateY: pose === 'walk' ? bob.value * 6 : bob.value * 2.5 },
      { rotate: pose === 'bow' ? '-18deg' : pose === 'sit' ? '6deg' : '0deg' },
      { scale: pose === 'hidden' ? 0 : 1 },
    ],
    opacity: pose === 'hidden' ? 0 : 1,
  }));

  const eye = useAnimatedStyle(() => ({
    transform: [{ scaleY: blink.value }],
  }));

  const earTilt = pose === 'bow' ? 18 : pose === 'sit' ? -8 : 0;
  const bodyY = pose === 'sit' ? 8 : 0;

  return (
    <Animated.View style={[styles.box, { width: size, height: size * 1.2 }, wrap]}>
      <Svg width={size} height={size * 1.2} viewBox="0 0 120 144">
        <Ellipse cx="86" cy={108 + bodyY} rx="10" ry="7" fill="#E8C9A8" />
        <Ellipse cx="60" cy={102 + bodyY} rx="30" ry="26" fill="#D4A574" />
        <Ellipse cx="62" cy={108 + bodyY} rx="18" ry="16" fill="#F0C9B0" />
        <Ellipse
          cx="42"
          cy="28"
          rx="10"
          ry="26"
          fill="#D4A574"
          transform={`rotate(${-12 + earTilt} 42 48)`}
        />
        <Ellipse
          cx="42"
          cy="28"
          rx="5"
          ry="18"
          fill="#F0C9B0"
          transform={`rotate(${-12 + earTilt} 42 48)`}
        />
        <Ellipse
          cx="72"
          cy="26"
          rx="10"
          ry="26"
          fill="#C48A58"
          transform={`rotate(${10 - earTilt} 72 48)`}
        />
        <Ellipse
          cx="72"
          cy="26"
          rx="5"
          ry="18"
          fill="#E8B496"
          transform={`rotate(${10 - earTilt} 72 48)`}
        />
        <Circle cx="60" cy="62" r="26" fill="#D4A574" />
        <Circle cx="48" cy="66" r="7" fill="#E8B496" opacity={0.7} />
        <Circle cx="74" cy="66" r="7" fill="#E8B496" opacity={0.7} />
        <Path d="M56 74 Q60 78 64 74" stroke="#8B5A32" strokeWidth="2" fill="none" strokeLinecap="round" />
        <Circle cx="60" cy="70" r="3.2" fill="#C47A5A" />
      </Svg>
      <Animated.View style={[styles.eyes, eye]}>
        <Svg width={size} height={size * 1.2} viewBox="0 0 120 144">
          <Circle cx="50" cy="60" r="4.2" fill="#2A1A10" />
          <Circle cx="70" cy="60" r="4.2" fill="#2A1A10" />
          <Circle cx="51.5" cy="58.5" r="1.4" fill="#F4E6C8" />
          <Circle cx="71.5" cy="58.5" r="1.4" fill="#F4E6C8" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'flex-end' },
  eyes: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
