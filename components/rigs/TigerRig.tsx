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
  mirrored?: boolean;
  dimmed?: boolean;
};

export function TigerRig({ pose, size = 168, mirrored = false, dimmed = false }: Props) {
  const breath = useSharedValue(0);
  const roar = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [breath]);

  useEffect(() => {
    if (pose === 'roar') {
      roar.value = withRepeat(
        withSequence(withTiming(1, { duration: 280 }), withTiming(0.4, { duration: 280 })),
        -1,
        false,
      );
    } else {
      roar.value = withTiming(0, { duration: 200 });
    }
  }, [pose, roar]);

  const wrap = useAnimatedStyle(() => ({
    transform: [
      { scaleX: mirrored ? -1 : 1 },
      { scaleY: dimmed ? -1 : 1 },
      { translateY: pose === 'leap' ? -18 : breath.value * 3 },
      { rotate: pose === 'lookDown' ? '12deg' : pose === 'leap' ? '-28deg' : `${(roar.value - 0.2) * 4}deg` },
      { scale: pose === 'hidden' ? 0 : pose === 'leap' ? 0.92 : 1 + breath.value * 0.015 },
    ],
    opacity: pose === 'hidden' ? 0 : dimmed ? 0.45 : 1,
  }));

  const mouthOpen = pose === 'roar' || pose === 'leap';
  const brow = pose === 'roar' || pose === 'leap' ? -8 : pose === 'lookDown' ? 6 : 0;

  return (
    <Animated.View style={[styles.box, { width: size, height: size * 0.82 }, wrap]}>
      <Svg width={size} height={size * 0.82} viewBox="0 0 200 164">
        <Ellipse cx="168" cy="108" rx="14" ry="8" fill="#E0893A" />
        <Path d="M168 108 C 186 86, 176 54, 164 48" stroke="#C46A22" strokeWidth="10" fill="none" strokeLinecap="round" />
        <Ellipse cx="96" cy="112" rx="58" ry="36" fill="#E0893A" />
        <Ellipse cx="100" cy="122" rx="28" ry="18" fill="#F3D7B0" />
        <Path d="M58 100 Q 70 88 78 104" stroke="#2A1A10" strokeWidth="5" fill="none" />
        <Path d="M88 92 Q 98 82 108 96" stroke="#2A1A10" strokeWidth="5" fill="none" />
        <Path d="M118 98 Q 130 88 138 106" stroke="#2A1A10" strokeWidth="5" fill="none" />
        <Circle cx="118" cy="62" r="38" fill="#E0893A" />
        <Ellipse cx="90" cy="42" rx="12" ry="10" fill="#E0893A" />
        <Ellipse cx="144" cy="42" rx="12" ry="10" fill="#E0893A" />
        <Ellipse cx="90" cy="42" rx="6" ry="5" fill="#F3D7B0" />
        <Ellipse cx="144" cy="42" rx="6" ry="5" fill="#F3D7B0" />
        <Path
          d="M92 38 Q 102 28 112 40"
          stroke="#2A1A10"
          strokeWidth="4"
          fill="none"
          transform={`rotate(${brow} 102 36)`}
        />
        <Path
          d="M126 38 Q 136 26 146 40"
          stroke="#2A1A10"
          strokeWidth="4"
          fill="none"
          transform={`rotate(${-brow} 136 34)`}
        />
        <Ellipse cx="118" cy="78" rx="22" ry="16" fill="#F3D7B0" />
        <Circle cx="104" cy="58" r="5" fill="#2A1A10" />
        <Circle cx="132" cy="58" r="5" fill="#2A1A10" />
        <Circle cx="106" cy="56" r="1.6" fill="#F4E6C8" />
        <Circle cx="134" cy="56" r="1.6" fill="#F4E6C8" />
        <Circle cx="118" cy="74" r="4" fill="#2A1A10" />
        {mouthOpen ? (
          <Ellipse cx="118" cy="90" rx="12" ry="10" fill="#2A1A10" />
        ) : (
          <Path d="M108 88 Q 118 94 128 88" stroke="#2A1A10" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
        <Path d="M108 54 L 102 66" stroke="#2A1A10" strokeWidth="3" />
        <Path d="M128 54 L 134 66" stroke="#2A1A10" strokeWidth="3" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'flex-end' },
});
