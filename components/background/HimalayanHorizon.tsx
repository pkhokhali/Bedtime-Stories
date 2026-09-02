import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

export interface HimalayanHorizonProps {
  height?: number;
  style?: StyleProp<ViewStyle>;
}

// Single conifer pine silhouette generator
function renderPineTree(x: number, baseY: number, width: number, height: number, color: string) {
  const hw = width / 2;
  const topY = baseY - height;
  const t1 = topY + height * 0.32;
  const t2 = topY + height * 0.62;
  const t3 = topY + height * 0.90;

  const d = [
    `M ${x} ${topY}`,
    `L ${x + hw * 0.45} ${t1}`,
    `L ${x + hw * 0.28} ${t1}`,
    `L ${x + hw * 0.75} ${t2}`,
    `L ${x + hw * 0.45} ${t2}`,
    `L ${x + hw} ${t3}`,
    `L ${x + hw * 0.2} ${t3}`,
    `L ${x + hw * 0.2} ${baseY}`,
    `L ${x - hw * 0.2} ${baseY}`,
    `L ${x - hw * 0.2} ${t3}`,
    `L ${x - hw} ${t3}`,
    `L ${x - hw * 0.45} ${t2}`,
    `L ${x - hw * 0.75} ${t2}`,
    `L ${x - hw * 0.28} ${t1}`,
    `L ${x - hw * 0.45} ${t1}`,
    'Z',
  ].join(' ');

  return <Path key={`pine-${x}-${baseY}`} d={d} fill={color} />;
}

export function HimalayanHorizon({ height = 180, style }: HimalayanHorizonProps) {
  // 14 Staggered pine trees along the foothills (density >= 10)
  const pineTrees = [
    { x: 12, baseY: 175, w: 14, h: 36 },
    { x: 34, baseY: 178, w: 16, h: 42 },
    { x: 60, baseY: 174, w: 12, h: 30 },
    { x: 92, baseY: 176, w: 18, h: 46 },
    { x: 124, baseY: 177, w: 14, h: 38 },
    { x: 152, baseY: 174, w: 13, h: 34 },
    { x: 185, baseY: 178, w: 17, h: 44 },
    { x: 215, baseY: 175, w: 15, h: 39 },
    { x: 245, baseY: 177, w: 13, h: 32 },
    { x: 278, baseY: 176, w: 19, h: 48 },
    { x: 308, baseY: 174, w: 14, h: 35 },
    { x: 338, baseY: 178, w: 16, h: 42 },
    { x: 366, baseY: 175, w: 13, h: 33 },
    { x: 390, baseY: 177, w: 15, h: 40 },
  ];

  return (
    <View pointerEvents="none" style={[styles.container, { height }, style]}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 400 180"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id="distantRidgeGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0D1526" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#080C16" stopOpacity="0.85" />
          </LinearGradient>
          <LinearGradient id="midPeakGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#090F1C" stopOpacity="0.85" />
            <Stop offset="1" stopColor="#050810" stopOpacity="0.95" />
          </LinearGradient>
        </Defs>

        {/* 1. Distant Mountain Ridge Layer */}
        <Path
          d="M 0 180 L 0 95 Q 40 75 85 90 Q 140 60 195 78 Q 250 50 300 70 Q 355 55 400 80 L 400 180 Z"
          fill="url(#distantRidgeGrad)"
        />

        {/* 2. Mid-range Himalayan Sharp Mountain Peaks Layer */}
        <Path
          d="M 0 180 L 0 115 L 28 88 L 62 65 L 88 85 L 115 102 L 165 35 L 205 82 L 235 98 L 275 45 L 315 92 L 345 105 L 372 70 L 400 100 L 400 180 Z"
          fill="url(#midPeakGrad)"
        />

        {/* 3. Rolling Foothill Silhouette Layer */}
        <Path
          d="M 0 180 L 0 148 Q 60 138 120 145 Q 180 135 240 142 Q 320 136 400 146 L 400 180 Z"
          fill="#060A14"
        />

        {/* 4. Himalayan Pine Tree / Conifer Silhouettes */}
        <G fill="#050A14">
          {pineTrees.map((tree) =>
            renderPineTree(tree.x, tree.baseY, tree.w, tree.h, '#050A14')
          )}
        </G>

        {/* Bottom Baseline Seal */}
        <Path d="M 0 174 L 400 174 L 400 180 L 0 180 Z" fill="#050A14" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    overflow: 'hidden',
  },
});
