import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { TwinklingStarfield } from './TwinklingStarfield';
import { HimalayanHorizon } from './HimalayanHorizon';

export interface AtmosphericBackgroundProps {
  showStars?: boolean;
  showHorizon?: boolean;
  intensity?: 'full' | 'subtle' | 'dim';
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const CELESTIAL_GRADIENT = [
  '#060913',
  '#0c1222',
  '#121A2F',
  '#1B1428',
  '#22151D',
] as const;

export function resolveIntensityOpacity(intensity: 'full' | 'subtle' | 'dim' = 'full'): number {
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

export function AtmosphericBackground({
  showStars = true,
  showHorizon = true,
  intensity = 'full',
  style,
  children,
}: AtmosphericBackgroundProps) {
  const visualOpacity = resolveIntensityOpacity(intensity);

  return (
    <View style={[styles.container, style]}>
      {/* Background Visual Layer */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: visualOpacity }]}>
        <LinearGradient
          colors={CELESTIAL_GRADIENT}
          locations={[0, 0.24, 0.52, 0.78, 1.0]}
          style={StyleSheet.absoluteFill}
        />
        {showStars && <TwinklingStarfield />}
        {showHorizon && <HimalayanHorizon />}
      </View>

      {/* Screen Foreground Content */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060913',
    position: 'relative',
  },
});
