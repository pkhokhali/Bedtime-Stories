import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const DOTS = [
  { x: 0.12, y: 0.22, delay: 0, size: 4 },
  { x: 0.28, y: 0.38, delay: 400, size: 3 },
  { x: 0.46, y: 0.18, delay: 800, size: 5 },
  { x: 0.62, y: 0.42, delay: 200, size: 3 },
  { x: 0.78, y: 0.26, delay: 600, size: 4 },
  { x: 0.18, y: 0.58, delay: 1000, size: 3 },
  { x: 0.7, y: 0.62, delay: 300, size: 4 },
  { x: 0.88, y: 0.48, delay: 700, size: 3 },
];

function Firefly({
  x,
  y,
  delay,
  size,
}: {
  x: number;
  y: number;
  delay: number;
  size: number;
}) {
  const drift = useSharedValue(0);
  const glow = useSharedValue(0.4);

  useEffect(() => {
    drift.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    glow.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1, { duration: 1400 }), withTiming(0.25, { duration: 1400 })),
        -1,
        false,
      ),
    );
  }, [delay, drift, glow]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: drift.value * 18 },
      { translateY: drift.value * (1 - drift.value) * 48 },
    ],
    opacity: 0.35 + glow.value * 0.65,
  }));


  return (
    <Animated.View
      style={[
        styles.dot,
        {
          left: x * width,
          top: y * height * 0.55,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    />
  );
}

export function Fireflies() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {DOTS.map((d) => (
        <Firefly key={`${d.x}-${d.y}`} {...d} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    backgroundColor: '#F4E6C8',
    shadowColor: '#E8A04A',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
});
