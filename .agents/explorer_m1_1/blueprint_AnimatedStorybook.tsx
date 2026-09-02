import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

export interface AnimatedStorybookProps {
  /**
   * Controls whether the storybook is open.
   * Defaults to true (auto-plays opening animation on mount).
   */
  isOpen?: boolean;

  /**
   * Callback invoked when the opening animation reaches settled state.
   */
  onOpened?: () => void;

  /**
   * Overall width of the book spread in dp. Defaults to 290.
   */
  width?: number;

  /**
   * Overall height of the book spread in dp. Defaults to 216.
   */
  height?: number;

  /**
   * Intensity multiplier for the golden inner glow radiance (0.0 - 2.0). Defaults to 1.0.
   */
  glowIntensity?: number;

  /**
   * Optional container styling.
   */
  style?: StyleProp<ViewStyle>;
}

// ---------------------------------------------------------------------------
// SVG Subcomponents & Decorative Filigrees
// ---------------------------------------------------------------------------

/**
 * Corner filigree ornament path generator (Paubha & Celtic inspired knotwork).
 */
function GoldenCornerFiligree({ x, y, rotate = 0 }: { x: number; y: number; rotate?: number }) {
  return (
    <G transform={`translate(${x}, ${y}) rotate(${rotate})`}>
      {/* Outer corner swirl */}
      <Path
        d="M 2 24 C 2 12, 12 2, 24 2 M 6 24 C 6 15, 15 6, 24 6"
        stroke="#D4AF37"
        strokeWidth={1.2}
        strokeLinecap="round"
        fill="none"
      />
      {/* Inner floral scroll */}
      <Path
        d="M 12 20 C 12 15, 15 12, 20 12 C 22 12, 23 13, 23 15 C 23 17, 21 18, 19 18 C 16 18, 14 16, 14 13"
        stroke="#E8A04A"
        strokeWidth={0.9}
        strokeLinecap="round"
        fill="none"
      />
      {/* Corner starlet dot */}
      <Circle cx={4} cy={4} r={1.5} fill="#FFD700" />
      <Circle cx={14} cy={4} r={0.8} fill="#E8A04A" />
      <Circle cx={4} cy={14} r={0.8} fill="#E8A04A" />
    </G>
  );
}

/**
 * Left Page Spread SVG (Antique parchment with subtle story lines & vintage watermark).
 */
function LeftParchmentPage({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 140 216">
      <Defs>
        <LinearGradient id="leftPageGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#E5D6B8" />
          <Stop offset="20%" stopColor="#F5ECE0" />
          <Stop offset="85%" stopColor="#FAF4E8" />
          <Stop offset="100%" stopColor="#D5C29E" />
        </LinearGradient>
      </Defs>

      {/* Page Base Parchment */}
      <Path
        d="M 10 12 C 50 8, 100 8, 138 12 L 138 204 C 100 200, 50 200, 10 204 Z"
        fill="url(#leftPageGrad)"
        stroke="#C4B59A"
        strokeWidth={0.75}
      />

      {/* Stacked Edge Lines (Pages underneath) */}
      <Path d="M 6 16 C 50 12, 100 12, 138 16" stroke="#B8A78A" strokeWidth={0.8} fill="none" />
      <Path d="M 4 20 C 50 16, 100 16, 138 20" stroke="#8E7D63" strokeWidth={0.8} fill="none" />
      <Path d="M 10 204 C 50 200, 100 200, 138 204" stroke="#B8A78A" strokeWidth={0.75} fill="none" />
      <Path d="M 8 206 C 50 202, 100 202, 138 206" stroke="#9E8C72" strokeWidth={0.75} fill="none" />

      {/* Golden Filigree Corners */}
      <GoldenCornerFiligree x={16} y={16} rotate={0} />
      <GoldenCornerFiligree x={16} y={198} rotate={-90} />

      {/* Vintage Fairy Tale Watermark (Crescent Moon & Mountain Pine Silhouette) */}
      <G opacity={0.18}>
        {/* Soft Moon */}
        <Circle cx={45} cy={60} r={18} fill="#C4783A" />
        <Circle cx={50} cy={56} r={16} fill="#F5ECE0" />
        {/* Mountain ridge watermark */}
        <Path
          d="M 22 105 L 42 78 L 58 92 L 78 68 L 105 105 Z"
          fill="#8B6914"
        />
        {/* Tiny starlight dots */}
        <Circle cx={85} cy={50} r={1.5} fill="#8B6914" />
        <Circle cx={98} cy={62} r={1.2} fill="#8B6914" />
        <Circle cx={32} cy={48} r={1.2} fill="#8B6914" />
      </G>

      {/* Mystical Story Lines (Devanagari/Script Runes) */}
      <G stroke="#A08C70" strokeWidth={0.85} strokeLinecap="round" opacity={0.4}>
        <Path d="M 26 122 Q 75 120 124 122" />
        <Path d="M 26 136 Q 75 134 124 136" />
        <Path d="M 26 150 Q 75 148 124 150" />
        <Path d="M 26 164 Q 70 162 108 164" />
        <Path d="M 26 178 Q 60 176 88 178" />
      </G>
    </Svg>
  );
}

/**
 * Right Page Spread SVG (Radiant parchment with golden bedtime mandala & radial glow).
 */
function RightParchmentPage({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 140 216">
      <Defs>
        <LinearGradient id="rightPageGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#D5C29E" />
          <Stop offset="15%" stopColor="#FAF4E8" />
          <Stop offset="80%" stopColor="#F5ECE0" />
          <Stop offset="100%" stopColor="#E5D6B8" />
        </LinearGradient>
      </Defs>

      {/* Page Base Parchment */}
      <Path
        d="M 2 12 C 40 8, 90 8, 130 12 L 130 204 C 90 200, 40 200, 2 204 Z"
        fill="url(#rightPageGrad)"
        stroke="#C4B59A"
        strokeWidth={0.75}
      />

      {/* Stacked Edge Lines */}
      <Path d="M 2 16 C 40 12, 90 12, 134 16" stroke="#B8A78A" strokeWidth={0.8} fill="none" />
      <Path d="M 2 20 C 40 16, 90 16, 136 20" stroke="#8E7D63" strokeWidth={0.8} fill="none" />
      <Path d="M 2 204 C 40 200, 90 200, 130 204" stroke="#B8A78A" strokeWidth={0.75} fill="none" />
      <Path d="M 2 206 C 40 202, 90 202, 132 206" stroke="#9E8C72" strokeWidth={0.75} fill="none" />

      {/* Golden Filigree Corners */}
      <GoldenCornerFiligree x={124} y={16} rotate={90} />
      <GoldenCornerFiligree x={124} y={198} rotate={180} />

      {/* Celestial Sun/Moon Bedtime Mandala Centerpiece */}
      <G transform="translate(68, 108)">
        {/* Concentric rings */}
        <Circle cx={0} cy={0} r={36} stroke="#E8A04A" strokeWidth={0.75} strokeDasharray="3, 3" fill="none" />
        <Circle cx={0} cy={0} r={28} stroke="#D4AF37" strokeWidth={1} fill="none" />
        <Circle cx={0} cy={0} r={20} stroke="#E8A04A" strokeWidth={0.75} fill="rgba(232, 160, 74, 0.08)" />

        {/* 8-pointed Starlight Emblem */}
        <Path
          d="M 0 -18 L 4 -6 L 16 -4 L 7 4 L 10 16 L 0 9 L -10 16 L -7 4 L -16 -4 L -4 -6 Z"
          fill="#FFD700"
          stroke="#C4783A"
          strokeWidth={0.5}
        />
        <Circle cx={0} cy={0} r={3.5} fill="#FFFFFF" />

        {/* Outer orbital starlight dots */}
        <Circle cx={0} cy={-32} r={1.5} fill="#E8A04A" />
        <Circle cx={32} cy={0} r={1.5} fill="#E8A04A" />
        <Circle cx={0} cy={32} r={1.5} fill="#E8A04A" />
        <Circle cx={-32} cy={0} r={1.5} fill="#E8A04A" />
      </G>
    </Svg>
  );
}

/**
 * Spine & Bookmark SVG (Rich mahogany leather with gold horizontal ribs & silk bookmark).
 */
function SpineAndBookmark({ height }: { height: number }) {
  return (
    <Svg width={24} height={height + 24} viewBox="0 0 24 240">
      <Defs>
        <LinearGradient id="spineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#140803" />
          <Stop offset="25%" stopColor="#2E160A" />
          <Stop offset="50%" stopColor="#3D1E0E" />
          <Stop offset="75%" stopColor="#2E160A" />
          <Stop offset="100%" stopColor="#140803" />
        </LinearGradient>
        <LinearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#A5581E" />
          <Stop offset="50%" stopColor="#E8A04A" />
          <Stop offset="100%" stopColor="#FFC875" />
        </LinearGradient>
      </Defs>

      {/* Leather Spine Strip */}
      <Rect x={4} y={8} width={16} height={204} rx={2} fill="url(#spineGrad)" />

      {/* Golden Ribbing Bands (Horizontal Raised Tooling) */}
      <G stroke="#D4AF37" strokeWidth={1.5} strokeLinecap="round">
        <Path d="M 5 36 L 19 36" />
        <Path d="M 5 39 L 19 39" strokeWidth={0.8} stroke="#E8A04A" />

        <Path d="M 5 82 L 19 82" />
        <Path d="M 5 85 L 19 85" strokeWidth={0.8} stroke="#E8A04A" />

        <Path d="M 5 134 L 19 134" />
        <Path d="M 5 137 L 19 137" strokeWidth={0.8} stroke="#E8A04A" />

        <Path d="M 5 184 L 19 184" />
        <Path d="M 5 187 L 19 187" strokeWidth={0.8} stroke="#E8A04A" />
      </G>

      {/* Golden Stitching Perforations */}
      <Path
        d="M 5 12 L 5 208 M 19 12 L 19 208"
        stroke="#8B6914"
        strokeWidth={0.75}
        strokeDasharray="2, 3"
        fill="none"
      />

      {/* Silk Ribbon Bookmark hanging down */}
      <Path
        d="M 10 10 C 14 60, 8 130, 13 190 C 15 210, 11 224, 14 236 L 11 230 L 8 236 C 9 224, 7 210, 8 190 C 6 130, 12 60, 10 10 Z"
        fill="url(#ribbonGrad)"
      />
    </Svg>
  );
}

/**
 * Front Cover SVG (Deep sapphire-obsidian leather with embossed gold filigree & Saanjh medallion).
 */
function FrontCoverView({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 140 216">
      <Defs>
        <LinearGradient id="frontCoverLeather" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#1E1628" />
          <Stop offset="50%" stopColor="#2A1B14" />
          <Stop offset="100%" stopColor="#140D18" />
        </LinearGradient>
        <RadialGradient id="medallionGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFD700" stopOpacity={0.35} />
          <Stop offset="70%" stopColor="#E8A04A" stopOpacity={0.12} />
          <Stop offset="100%" stopColor="#E8A04A" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* Cover Base Leather */}
      <Path
        d="M 0 6 L 126 6 C 132 6, 136 10, 136 16 L 136 200 C 136 206, 132 210, 126 210 L 0 210 Z"
        fill="url(#frontCoverLeather)"
        stroke="#8B6914"
        strokeWidth={1.5}
      />

      {/* Inset Gold Filigree Border (Double Line) */}
      <Path
        d="M 8 12 L 122 12 C 126 12, 128 14, 128 18 L 128 198 C 128 202, 126 204, 122 204 L 8 204 Z"
        stroke="#D4AF37"
        strokeWidth={1.4}
        fill="none"
      />
      <Path
        d="M 13 17 L 117 17 C 120 17, 122 19, 122 22 L 122 194 C 122 197, 120 199, 117 199 L 13 199 Z"
        stroke="#E8A04A"
        strokeWidth={0.75}
        strokeDasharray="4, 2"
        fill="none"
      />

      {/* 4 Golden Ornate Corner Filigrees on Cover */}
      <GoldenCornerFiligree x={16} y={16} rotate={0} />
      <GoldenCornerFiligree x={118} y={16} rotate={90} />
      <GoldenCornerFiligree x={16} y={196} rotate={-90} />
      <GoldenCornerFiligree x={118} y={196} rotate={180} />

      {/* Central Celestial Golden Medallion */}
      <Circle cx={68} cy={92} r={34} fill="url(#medallionGlow)" />
      <Circle cx={68} cy={92} r={30} stroke="#D4AF37" strokeWidth={1.2} strokeDasharray="3, 3" fill="none" />
      <Circle cx={68} cy={92} r={25} stroke="#E8A04A" strokeWidth={1} fill="none" />

      {/* Ornate Gilded Crescent Moon embracing star */}
      <Path
        d="M 68 73 C 78 73, 86 81, 86 92 C 86 103, 78 111, 68 111 C 74 105, 78 98, 78 92 C 78 86, 74 79, 68 73 Z"
        fill="#FFD700"
        stroke="#C4783A"
        strokeWidth={0.5}
      />

      {/* 8-pointed Center Starlet */}
      <Path
        d="M 62 84 L 64 89 L 69 91 L 64 93 L 62 98 L 60 93 L 55 91 L 60 89 Z"
        fill="#FFF5DE"
      />

      {/* Title Header: "✦ SAANJH ✦" in embossed gold style */}
      <G transform="translate(68, 148)">
        <Circle cx={-36} cy={-2} r={1.5} fill="#FFD700" />
        <Path d="M -30 -2 L -20 -2" stroke="#D4AF37" strokeWidth={1} />
        {/* Center decorative motif */}
        <Circle cx={0} cy={-2} r={2.5} fill="#FFD700" />
        <Path d="M 20 -2 L 30 -2" stroke="#D4AF37" strokeWidth={1} />
        <Circle cx={36} cy={-2} r={1.5} fill="#FFD700" />
      </G>
    </Svg>
  );
}

/**
 * Inside Cover Endpaper (Revealed when cover rotates past 90 degrees).
 */
function InsideCoverView({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 140 216">
      <Defs>
        <LinearGradient id="insideEndpaperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#1A1224" />
          <Stop offset="100%" stopColor="#261720" />
        </LinearGradient>
      </Defs>

      {/* Endpaper Base */}
      <Path
        d="M 136 6 L 10 6 C 4 6, 0 10, 0 16 L 0 200 C 0 206, 4 210, 10 210 L 136 210 Z"
        fill="url(#insideEndpaperGrad)"
        stroke="#8B6914"
        strokeWidth={1}
      />

      {/* Constellation lines on inside endpaper */}
      <G stroke="#E8A04A" strokeWidth={0.7} opacity={0.35} fill="none">
        <Path d="M 25 35 L 45 55 L 75 40 L 95 65 L 115 50" />
        <Path d="M 30 110 L 60 130 L 90 115 L 110 145" />
        <Path d="M 40 170 L 70 185 L 100 165" />
      </G>

      {/* Constellation star dots */}
      <G fill="#FFD700" opacity={0.6}>
        <Circle cx={25} cy={35} r={1.8} />
        <Circle cx={45} cy={55} r={2.2} />
        <Circle cx={75} cy={40} r={1.8} />
        <Circle cx={95} cy={65} r={2.2} />
        <Circle cx={115} cy={50} r={1.8} />
        <Circle cx={30} cy={110} r={2} />
        <Circle cx={60} cy={130} r={2.5} />
        <Circle cx={90} cy={115} r={2} />
        <Circle cx={110} cy={145} r={2.2} />
      </G>
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Main AnimatedStorybook Component
// ---------------------------------------------------------------------------

export function AnimatedStorybook({
  isOpen = true,
  onOpened,
  width = 290,
  height = 216,
  glowIntensity = 1.0,
  style,
}: AnimatedStorybookProps) {
  const halfWidth = width / 2;

  // Shared animation values
  const bookScale = useSharedValue(0.92);
  const bookOpacity = useSharedValue(0);
  const bookTranslateY = useSharedValue(12);

  // Cover & page turn rotations (in degrees)
  const coverRotation = useSharedValue(0); // 0deg -> -165deg
  const leaf1Rotation = useSharedValue(0); // 0deg -> -145deg
  const leaf2Rotation = useSharedValue(0); // 0deg -> -125deg

  // Radiance & light shaft
  const radianceScale = useSharedValue(0.4);
  const radianceOpacity = useSharedValue(0);
  const lightShaftScaleY = useSharedValue(0);
  const lightShaftOpacity = useSharedValue(0);

  // Background halo breathing
  const haloGlow = useSharedValue(0.3);

  useEffect(() => {
    if (isOpen) {
      // 1. Initial fade-in & float up (0ms -> 600ms)
      bookOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
      bookTranslateY.value = withTiming(0, { duration: 750, easing: Easing.out(Easing.cubic) });
      bookScale.value = withSequence(
        withTiming(1.05, { duration: 900, easing: Easing.out(Easing.quad) }),
        withTiming(1.0, { duration: 600, easing: Easing.inOut(Easing.quad) }),
      );

      // 2. Smooth 3D cover opening rotation with cubic bezier curve (300ms -> 1700ms)
      const openingEasing = Easing.bezier(0.25, 0.1, 0.25, 1);

      coverRotation.value = withDelay(
        350,
        withTiming(-165, { duration: 1400, easing: openingEasing }),
      );

      // 3. Staggered secondary page leaves
      leaf1Rotation.value = withDelay(
        550,
        withTiming(-145, { duration: 1250, easing: openingEasing }),
      );
      leaf2Rotation.value = withDelay(
        750,
        withTiming(-125, { duration: 1100, easing: openingEasing }),
      );

      // 4. Inner parchment radiance bloom (starts expanding as pages open)
      radianceOpacity.value = withDelay(
        700,
        withSequence(
          withTiming(1.0 * glowIntensity, { duration: 900, easing: Easing.out(Easing.quad) }),
          withRepeat(
            withSequence(
              withTiming(0.85 * glowIntensity, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
              withTiming(1.05 * glowIntensity, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
            true,
          ),
        ),
      );

      radianceScale.value = withDelay(
        700,
        withSequence(
          withTiming(1.15, { duration: 800, easing: Easing.out(Easing.back(1.2)) }),
          withTiming(1.0, { duration: 400 }),
          withRepeat(
            withSequence(
              withTiming(1.06, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
              withTiming(0.96, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
            true,
          ),
        ),
      );

      // 5. Vertical light shaft flare
      lightShaftScaleY.value = withDelay(
        800,
        withTiming(1.0, { duration: 1000, easing: Easing.out(Easing.cubic) }),
      );
      lightShaftOpacity.value = withDelay(
        800,
        withSequence(
          withTiming(0.85, { duration: 600 }),
          withRepeat(
            withSequence(
              withTiming(0.55, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
              withTiming(0.85, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
            true,
          ),
        ),
      );

      // 6. Background ambient halo pulse
      haloGlow.value = withDelay(
        400,
        withRepeat(
          withSequence(
            withTiming(0.6 * glowIntensity, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
            withTiming(0.3 * glowIntensity, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          true,
        ),
      );

      // Trigger completion callback after opening settles
      if (onOpened) {
        const timer = setTimeout(() => {
          onOpened();
        }, 1850);
        return () => clearTimeout(timer);
      }
    } else {
      // Re-closing animation
      coverRotation.value = withTiming(0, { duration: 800, easing: Easing.inOut(Easing.cubic) });
      leaf1Rotation.value = withTiming(0, { duration: 700 });
      leaf2Rotation.value = withTiming(0, { duration: 600 });
      radianceOpacity.value = withTiming(0, { duration: 500 });
      lightShaftOpacity.value = withTiming(0, { duration: 400 });
    }
  }, [
    isOpen,
    onOpened,
    glowIntensity,
    bookOpacity,
    bookScale,
    bookTranslateY,
    coverRotation,
    leaf1Rotation,
    leaf2Rotation,
    radianceOpacity,
    radianceScale,
    lightShaftScaleY,
    lightShaftOpacity,
    haloGlow,
  ]);

  // Animated styles
  const masterContainerStyle = useAnimatedStyle(() => ({
    opacity: bookOpacity.value,
    transform: [
      { translateY: bookTranslateY.value },
      { scale: bookScale.value },
    ],
  }));

  // Front cover 3D rotation transform anchored to the spine (left edge)
  const coverAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { translateX: -halfWidth / 2 },
      { rotateY: `${coverRotation.value}deg` },
      { translateX: halfWidth / 2 },
    ],
  }));

  // Front face vs inside face visibility interpolation
  const frontCoverFaceStyle = useAnimatedStyle(() => {
    const op = interpolate(coverRotation.value, [-180, -90.1, -89.9, 0], [0, 0, 1, 1]);
    return { opacity: op };
  });

  const insideCoverFaceStyle = useAnimatedStyle(() => {
    const op = interpolate(coverRotation.value, [-180, -90.1, -89.9, 0], [1, 1, 0, 0]);
    return {
      opacity: op,
      transform: [{ scaleX: -1 }], // Mirror inside cover to face correct orientation
    };
  });

  // Secondary turning page leaf 1
  const leaf1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { translateX: -halfWidth / 2 },
      { rotateY: `${leaf1Rotation.value}deg` },
      { translateX: halfWidth / 2 },
    ],
  }));

  // Secondary turning page leaf 2
  const leaf2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { translateX: -halfWidth / 2 },
      { rotateY: `${leaf2Rotation.value}deg` },
      { translateX: halfWidth / 2 },
    ],
  }));

  // Radiance styles
  const radianceStyle = useAnimatedStyle(() => ({
    opacity: radianceOpacity.value,
    transform: [{ scale: radianceScale.value }],
  }));

  // Light shaft styles
  const lightShaftStyle = useAnimatedStyle(() => ({
    opacity: lightShaftOpacity.value,
    transform: [
      { scaleY: lightShaftScaleY.value },
      { translateY: -height * 0.35 * (1 - lightShaftScaleY.value) },
    ],
  }));

  // Halo glow style
  const haloGlowStyle = useAnimatedStyle(() => ({
    opacity: haloGlow.value,
  }));

  return (
    <Animated.View style={[styles.root, { width, height }, style, masterContainerStyle]}>
      {/* 1. Underlying Radial Amber Aura */}
      <Animated.View style={[styles.haloContainer, haloGlowStyle]}>
        <Svg width={width + 120} height={height + 120} viewBox="0 0 400 320">
          <Defs>
            <RadialGradient id="storybookAura" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#E8A04A" stopOpacity={0.45} />
              <Stop offset="45%" stopColor="#C4783A" stopOpacity={0.2} />
              <Stop offset="80%" stopColor="#1A1020" stopOpacity={0.05} />
              <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={200} cy={160} r={150} fill="url(#storybookAura)" />
        </Svg>
      </Animated.View>

      {/* 2. Magical Vertical Light Shaft Flare (Rising from spine) */}
      <Animated.View style={[styles.lightShaftContainer, lightShaftStyle]}>
        <Svg width={180} height={height * 1.5} viewBox="0 0 180 320">
          <Defs>
            <LinearGradient id="spineLightShaft" x1="0%" y1="100%" x2="0%" y2="0%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
              <Stop offset="25%" stopColor="#FFF0C4" stopOpacity={0.7} />
              <Stop offset="65%" stopColor="#E8A04A" stopOpacity={0.3} />
              <Stop offset="100%" stopColor="#E8A04A" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Polygon points="80,320 100,320 170,0 10,0" fill="url(#spineLightShaft)" />
        </Svg>
      </Animated.View>

      {/* 3. Base Open Book Layer (Left Wing & Right Wing Parchment) */}
      <View style={styles.bookBed}>
        {/* Left Page Spread */}
        <View style={[styles.pageWing, { width: halfWidth, left: 0 }]}>
          <LeftParchmentPage width={halfWidth} height={height} />
        </View>

        {/* Right Page Spread */}
        <View style={[styles.pageWing, { width: halfWidth, left: halfWidth }]}>
          <RightParchmentPage width={halfWidth} height={height} />
        </View>

        {/* Inner Golden Radiance Overlay (Centered on Right Page & Gutter) */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.radianceWrapper,
            { left: halfWidth - 40, top: -20, width: halfWidth + 80, height: height + 40 },
            radianceStyle,
          ]}
        >
          <Svg width={halfWidth + 80} height={height + 40} viewBox="0 0 220 250">
            <Defs>
              <RadialGradient id="innerParchmentRadiance" cx="45%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.95} />
                <Stop offset="20%" stopColor="#FFF5D6" stopOpacity={0.85} />
                <Stop offset="50%" stopColor="#F5B342" stopOpacity={0.55} />
                <Stop offset="75%" stopColor="#E8A04A" stopOpacity={0.25} />
                <Stop offset="100%" stopColor="#E8A04A" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={100} cy={125} r={95} fill="url(#innerParchmentRadiance)" />
          </Svg>
        </Animated.View>

        {/* 4. Secondary Turning Parchment Leaf 2 */}
        <Animated.View
          pointerEvents="none"
          style={[styles.turningLeaf, { width: halfWidth, left: halfWidth }, leaf2AnimatedStyle]}
        >
          <Svg width={halfWidth} height={height} viewBox="0 0 140 216">
            <Path
              d="M 2 12 C 40 8, 90 8, 128 12 L 128 204 C 90 200, 40 200, 2 204 Z"
              fill="#F7EEDC"
              opacity={0.88}
              stroke="#D4AF37"
              strokeWidth={0.5}
            />
            {/* Faint script lines on turning leaf */}
            <Path d="M 20 50 L 100 50 M 20 70 L 90 70 M 20 90 L 95 90" stroke="#C4B59A" strokeWidth={0.7} opacity={0.3} />
          </Svg>
        </Animated.View>

        {/* 5. Secondary Turning Parchment Leaf 1 */}
        <Animated.View
          pointerEvents="none"
          style={[styles.turningLeaf, { width: halfWidth, left: halfWidth }, leaf1AnimatedStyle]}
        >
          <Svg width={halfWidth} height={height} viewBox="0 0 140 216">
            <Path
              d="M 2 12 C 40 8, 90 8, 128 12 L 128 204 C 90 200, 40 200, 2 204 Z"
              fill="#FAF3E6"
              opacity={0.92}
              stroke="#D4AF37"
              strokeWidth={0.6}
            />
            <GoldenCornerFiligree x={112} y={20} rotate={90} />
          </Svg>
        </Animated.View>

        {/* 6. 3D Rotating Front Cover Flap */}
        <Animated.View
          pointerEvents="none"
          style={[styles.coverContainer, { width: halfWidth, left: halfWidth }, coverAnimatedStyle]}
        >
          {/* Outside Face (Front Cover) */}
          <Animated.View style={[StyleSheet.absoluteFill, frontCoverFaceStyle]}>
            <FrontCoverView width={halfWidth} height={height} />
          </Animated.View>

          {/* Inside Face (Endpaper with constellation) */}
          <Animated.View style={[StyleSheet.absoluteFill, insideCoverFaceStyle]}>
            <InsideCoverView width={halfWidth} height={height} />
          </Animated.View>
        </Animated.View>

        {/* 7. Center Spine & Silk Bookmark (Renders on top of hinge axis) */}
        <View style={[styles.spineContainer, { left: halfWidth - 12, top: -12 }]}>
          <SpineAndBookmark height={height} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  lightShaftContainer: {
    position: 'absolute',
    top: -120,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    pointerEvents: 'none',
  },
  bookBed: {
    width: '100%',
    height: '100%',
    position: 'relative',
    zIndex: 3,
  },
  pageWing: {
    position: 'absolute',
    top: 0,
    height: '100%',
  },
  radianceWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  turningLeaf: {
    position: 'absolute',
    top: 0,
    height: '100%',
    zIndex: 5,
  },
  coverContainer: {
    position: 'absolute',
    top: 0,
    height: '100%',
    zIndex: 6,
  },
  spineContainer: {
    position: 'absolute',
    width: 24,
    zIndex: 7,
    pointerEvents: 'none',
  },
});
