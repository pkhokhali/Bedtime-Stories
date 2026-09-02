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
  count?: number;
  active?: boolean;
  originX?: number;
  originY?: number;
  style?: StyleProp<ViewStyle>;
}

export function StardustParticles({
  count = 22,
  active = true,
  originX = SCREEN_WIDTH / 2,
  originY = SCREEN_HEIGHT * 0.44,
  style,
}: StardustParticlesProps) {
  const seeds = count >= PARTICLE_SEEDS.length ? PARTICLE_SEEDS : PARTICLE_SEEDS.slice(0, count);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        { left: originX, top: originY },
        style,
      ]}
    >
      {seeds.map((seed) => (
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
