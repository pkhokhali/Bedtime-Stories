import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';

import { Fireflies } from '@/components/rigs/Fireflies';
import { RabbitRig } from '@/components/rigs/RabbitRig';
import { Well } from '@/components/rigs/Well';
import { colors } from '@/constants/theme';
import { Pose, SceneId, StageKind } from '@/types/story';

const SKY: Record<StageKind, [string, string, string]> = {
  forest: [colors.skyTop, colors.skyMid, colors.skyHorizon],
  moon: ['#120E1C', '#2A1830', '#6A3A28'],
  river: ['#0E1818', '#1A3028', '#3A5A52'],
  courtyard: ['#1A1020', '#4A2418', '#C4783A'],
  hills: ['#141018', '#2A2430', '#5A3A28'],
  lamp: ['#1A100C', '#3A2218', '#8A4A20'],
  stars: ['#0C0A14', '#1A1428', '#3A2848'],
};

type Props = {
  stage: StageKind;
  scene: SceneId;
  showRabbit?: boolean;
  rabbitPose?: Pose;
};

export function NightStage({ stage, scene, showRabbit, rabbitPose = 'sit' }: Props) {
  const sky = SKY[stage];
  const showWell = scene === 'well' || scene === 'leap';

  return (
    <View style={styles.root}>
      <LinearGradient colors={sky} style={StyleSheet.absoluteFill} />
      <View style={[styles.moon, (stage === 'moon' || stage === 'stars') && styles.moonBig]} />
      <Fireflies />
      {stage === 'hills' ? (
        <View style={styles.brick}>
          <Svg width="100%" height={140} viewBox="0 0 400 140">
            <Path d="M0 140 L0 88 L70 40 L140 92 L210 28 L300 86 L360 50 L400 78 L400 140 Z" fill="#1A241C" />
            <Path d="M0 140 L40 96 L110 120 L180 72 L260 110 L400 90 L400 140 Z" fill="#0F1A16" />
          </Svg>
        </View>
      ) : null}
      {stage === 'lamp' ? (
        <View style={styles.brick}>
          <Svg width="100%" height={140} viewBox="0 0 400 140">
            <Rect x="0" y="88" width="400" height="52" fill="#1C120C" />
            <Rect x="48" y="36" width="70" height="58" fill="#5A3820" />
            <Rect x="58" y="46" width="22" height="28" fill="#E8A04A" opacity="0.85" />
            <Rect x="88" y="46" width="22" height="28" fill="#C4783A" opacity="0.7" />
            <Rect x="280" y="24" width="86" height="70" fill="#2A1C14" />
            <Rect x="296" y="40" width="24" height="32" fill="#E8A04A" opacity="0.55" />
          </Svg>
        </View>
      ) : null}
      {stage === 'stars' ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={styles.starA} />
          <View style={styles.starB} />
          <View style={styles.starC} />
        </View>
      ) : null}
      {stage === 'river' ? (
        <View style={styles.water}>
          <Svg width="100%" height={90} viewBox="0 0 400 90">
            <Ellipse cx="200" cy="70" rx="220" ry="28" fill="#2A4A4A" />
            <Path d="M0 48 Q 80 36 160 48 T 320 48 T 480 48 L 480 90 L 0 90 Z" fill="#1E3A3A" />
          </Svg>
        </View>
      ) : null}
      {stage === 'courtyard' ? (
        <View style={styles.brick}>
          <Svg width="100%" height={120} viewBox="0 0 400 120">
            <Rect x="0" y="70" width="400" height="50" fill="#2A1C14" />
            <Rect x="40" y="28" width="90" height="50" fill="#6B4A32" />
            <Rect x="270" y="20" width="80" height="58" fill="#5A3A28" />
            <Rect x="160" y="8" width="18" height="70" fill="#3A2A20" />
          </Svg>
        </View>
      ) : null}
      {showWell ? (
        <View style={styles.well}>
          <Well tigerPose="hidden" />
        </View>
      ) : null}
      {showRabbit && rabbitPose !== 'hidden' ? (
        <View style={styles.rabbit}>
          <RabbitRig pose={rabbitPose} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: colors.background },
  moon: {
    position: 'absolute',
    top: 36,
    right: 28,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.cream,
    opacity: 0.92,
  },
  moonBig: { width: 88, height: 88, borderRadius: 44, top: 28, right: 24 },
  water: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  brick: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  well: { position: 'absolute', bottom: 24, alignSelf: 'center' },
  rabbit: { position: 'absolute', bottom: 18, left: 24 },
  starA: {
    position: 'absolute',
    top: 28,
    left: 36,
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.cream,
  },
  starB: {
    position: 'absolute',
    top: 64,
    left: 120,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.cream,
    opacity: 0.7,
  },
  starC: {
    position: 'absolute',
    top: 44,
    right: 120,
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.cream,
    opacity: 0.85,
  },
});
