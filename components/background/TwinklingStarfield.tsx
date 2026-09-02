import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

export interface StarConfig {
  id: number;
  xPct: number;
  yPct: number;
  baseSize: number;
  color: string;
  glow: boolean;
  minOpacity: number;
  maxOpacity: number;
  duration: number;
  delay: number;
}

// 32 Deterministic Star Seeds distributed across the celestial sky (y <= 70%)
export const STAR_SEEDS: StarConfig[] = [
  { id: 1, xPct: 8, yPct: 6, baseSize: 2.5, color: '#FFFFFF', glow: true, minOpacity: 0.3, maxOpacity: 0.95, duration: 2800, delay: 200 },
  { id: 2, xPct: 22, yPct: 12, baseSize: 1.8, color: '#F4E6C8', glow: false, minOpacity: 0.2, maxOpacity: 0.8, duration: 3200, delay: 600 },
  { id: 3, xPct: 38, yPct: 5, baseSize: 3.2, color: '#E8A04A', glow: true, minOpacity: 0.4, maxOpacity: 1.0, duration: 2400, delay: 100 },
  { id: 4, xPct: 55, yPct: 9, baseSize: 1.5, color: '#FFFFFF', glow: false, minOpacity: 0.25, maxOpacity: 0.75, duration: 3600, delay: 900 },
  { id: 5, xPct: 72, yPct: 4, baseSize: 2.8, color: '#F4E6C8', glow: true, minOpacity: 0.35, maxOpacity: 0.9, duration: 3000, delay: 400 },
  { id: 6, xPct: 88, yPct: 11, baseSize: 2.0, color: '#FFFFFF', glow: false, minOpacity: 0.2, maxOpacity: 0.85, duration: 2600, delay: 1200 },
  { id: 7, xPct: 15, yPct: 18, baseSize: 3.0, color: '#E8A04A', glow: true, minOpacity: 0.3, maxOpacity: 1.0, duration: 3400, delay: 300 },
  { id: 8, xPct: 30, yPct: 22, baseSize: 1.6, color: '#FFFFFF', glow: false, minOpacity: 0.2, maxOpacity: 0.7, duration: 4000, delay: 1500 },
  { id: 9, xPct: 48, yPct: 16, baseSize: 2.4, color: '#F4E6C8', glow: false, minOpacity: 0.3, maxOpacity: 0.85, duration: 2900, delay: 700 },
  { id: 10, xPct: 65, yPct: 20, baseSize: 3.5, color: '#FFFFFF', glow: true, minOpacity: 0.4, maxOpacity: 1.0, duration: 2700, delay: 50 },
  { id: 11, xPct: 82, yPct: 17, baseSize: 1.7, color: '#E8A04A', glow: false, minOpacity: 0.25, maxOpacity: 0.8, duration: 3800, delay: 1100 },
  { id: 12, xPct: 94, yPct: 24, baseSize: 2.2, color: '#F4E6C8', glow: false, minOpacity: 0.2, maxOpacity: 0.9, duration: 3100, delay: 800 },
  { id: 13, xPct: 5, yPct: 28, baseSize: 2.0, color: '#FFFFFF', glow: false, minOpacity: 0.25, maxOpacity: 0.8, duration: 3500, delay: 1300 },
  { id: 14, xPct: 20, yPct: 32, baseSize: 3.2, color: '#E8A04A', glow: true, minOpacity: 0.35, maxOpacity: 0.95, duration: 2500, delay: 250 },
  { id: 15, xPct: 36, yPct: 29, baseSize: 1.5, color: '#F4E6C8', glow: false, minOpacity: 0.2, maxOpacity: 0.75, duration: 4200, delay: 1700 },
  { id: 16, xPct: 52, yPct: 34, baseSize: 2.6, color: '#FFFFFF', glow: true, minOpacity: 0.3, maxOpacity: 0.9, duration: 3000, delay: 550 },
  { id: 17, xPct: 69, yPct: 30, baseSize: 1.8, color: '#F4E6C8', glow: false, minOpacity: 0.25, maxOpacity: 0.8, duration: 3300, delay: 950 },
  { id: 18, xPct: 85, yPct: 35, baseSize: 3.0, color: '#E8A04A', glow: true, minOpacity: 0.35, maxOpacity: 1.0, duration: 2800, delay: 150 },
  { id: 19, xPct: 12, yPct: 42, baseSize: 1.6, color: '#FFFFFF', glow: false, minOpacity: 0.2, maxOpacity: 0.7, duration: 3700, delay: 1400 },
  { id: 20, xPct: 28, yPct: 45, baseSize: 2.4, color: '#F4E6C8', glow: false, minOpacity: 0.3, maxOpacity: 0.85, duration: 2900, delay: 650 },
  { id: 21, xPct: 44, yPct: 40, baseSize: 3.4, color: '#FFFFFF', glow: true, minOpacity: 0.4, maxOpacity: 1.0, duration: 2600, delay: 350 },
  { id: 22, xPct: 60, yPct: 46, baseSize: 1.5, color: '#E8A04A', glow: false, minOpacity: 0.2, maxOpacity: 0.75, duration: 4100, delay: 1600 },
  { id: 23, xPct: 76, yPct: 43, baseSize: 2.5, color: '#F4E6C8', glow: true, minOpacity: 0.3, maxOpacity: 0.9, duration: 3200, delay: 750 },
  { id: 24, xPct: 92, yPct: 48, baseSize: 1.9, color: '#FFFFFF', glow: false, minOpacity: 0.25, maxOpacity: 0.85, duration: 3400, delay: 1050 },
  { id: 25, xPct: 7, yPct: 55, baseSize: 2.8, color: '#E8A04A', glow: true, minOpacity: 0.3, maxOpacity: 0.95, duration: 2700, delay: 450 },
  { id: 26, xPct: 24, yPct: 58, baseSize: 1.6, color: '#F4E6C8', glow: false, minOpacity: 0.2, maxOpacity: 0.75, duration: 3900, delay: 1250 },
  { id: 27, xPct: 40, yPct: 53, baseSize: 2.2, color: '#FFFFFF', glow: false, minOpacity: 0.25, maxOpacity: 0.85, duration: 3100, delay: 850 },
  { id: 28, xPct: 57, yPct: 59, baseSize: 3.1, color: '#E8A04A', glow: true, minOpacity: 0.35, maxOpacity: 1.0, duration: 2500, delay: 180 },
  { id: 29, xPct: 73, yPct: 56, baseSize: 1.7, color: '#FFFFFF', glow: false, minOpacity: 0.2, maxOpacity: 0.8, duration: 3600, delay: 1350 },
  { id: 30, xPct: 89, yPct: 62, baseSize: 2.5, color: '#F4E6C8', glow: true, minOpacity: 0.3, maxOpacity: 0.9, duration: 2900, delay: 500 },
  { id: 31, xPct: 18, yPct: 66, baseSize: 2.0, color: '#FFFFFF', glow: false, minOpacity: 0.2, maxOpacity: 0.8, duration: 3300, delay: 900 },
  { id: 32, xPct: 81, yPct: 68, baseSize: 2.3, color: '#E8A04A', glow: false, minOpacity: 0.25, maxOpacity: 0.85, duration: 3500, delay: 1150 },
];

function StarNode({ star }: { star: StarConfig }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      star.delay,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: star.duration / 2,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: star.duration / 2,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      )
    );
  }, [progress, star.delay, star.duration]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 1],
      [star.minOpacity, star.maxOpacity],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      progress.value,
      [0, 1],
      [0.85, 1.25],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const dimension = star.glow ? star.baseSize * 4 : star.baseSize * 2;
  const center = dimension / 2;
  const radius = star.baseSize / 2;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.starWrapper,
        {
          left: `${star.xPct}%`,
          top: `${star.yPct}%`,
          width: dimension,
          height: dimension,
          marginLeft: -center,
          marginTop: -center,
        },
        animatedStyle,
      ]}
    >
      <Svg width={dimension} height={dimension} viewBox={`0 0 ${dimension} ${dimension}`}>
        {star.glow && (
          <>
            <Circle cx={center} cy={center} r={radius * 2.8} fill={star.color} opacity={0.18} />
            <Circle cx={center} cy={center} r={radius * 1.8} fill={star.color} opacity={0.35} />
          </>
        )}
        <Circle cx={center} cy={center} r={radius} fill={star.color} opacity={1.0} />
      </Svg>
    </Animated.View>
  );
}

export interface TwinklingStarfieldProps {
  count?: number;
  style?: StyleProp<ViewStyle>;
}

export function TwinklingStarfield({ count = 32, style }: TwinklingStarfieldProps) {
  const stars = count >= STAR_SEEDS.length ? STAR_SEEDS : STAR_SEEDS.slice(0, count);

  return (
    <View pointerEvents="none" style={[styles.container, style]}>
      {stars.map((star) => (
        <StarNode key={star.id} star={star} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  starWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
