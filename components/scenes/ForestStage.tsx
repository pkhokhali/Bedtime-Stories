import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AnimalSilhouettes } from '@/components/rigs/AnimalSilhouettes';
import { Fireflies } from '@/components/rigs/Fireflies';
import { RabbitRig } from '@/components/rigs/RabbitRig';
import { TigerRig } from '@/components/rigs/TigerRig';
import { TreeLine } from '@/components/rigs/TreeLine';
import { Well } from '@/components/rigs/Well';
import { colors } from '@/constants/theme';
import { SceneState } from '@/types/story';

const { width } = Dimensions.get('window');

const SKY: Record<SceneState['scene'], [string, string, string]> = {
  establishing: [colors.skyTop, colors.skyMid, colors.skyHorizon],
  meeting: [colors.skyTop, colors.skyMid, colors.skyHorizon],
  walk: [colors.skyTop, '#3A1C14', '#B86A32'],
  roar: [colors.skyTop, '#3A1C14', '#A85A28'],
  well: ['#120E18', '#2A1818', '#6A3A22'],
  leap: ['#120E18', '#2A1818', '#6A3A22'],
  peace: ['#241218', '#6A3A22', colors.skyPeace],
  moon: [colors.skyTop, '#241428', '#4A2C18'],
  river: ['#102018', '#1A3028', '#2A4A4A'],
  courtyard: ['#1A1020', '#4A2418', '#C4783A'],
  hills: ['#141018', '#2A2430', '#5A3A28'],
  lamp: ['#1A100C', '#3A2218', '#8A4A20'],
  stars: ['#0C0A14', '#1A1428', '#3A2848'],
};

export function ForestStage({ scene, rabbit, tiger }: SceneState) {
  const cam = useSharedValue(0);
  const rabbitX = useSharedValue(24);
  const tigerX = useSharedValue(width * 0.42);
  const tigerY = useSharedValue(0);

  useEffect(() => {
    cam.value = withTiming(scene === 'well' || scene === 'leap' ? 1 : 0, {
      duration: 900,
      easing: Easing.inOut(Easing.quad),
    });
  }, [cam, scene]);

  useEffect(() => {
    if (rabbit === 'walk') {
      rabbitX.value = withTiming(width * 0.38, { duration: 9000, easing: Easing.linear });
    } else if (rabbit === 'hidden') {
      rabbitX.value = 24;
    } else if (scene === 'well' || scene === 'leap') {
      rabbitX.value = withTiming(width * 0.08, { duration: 700 });
    } else if (scene === 'peace') {
      rabbitX.value = withTiming(width * 0.32, { duration: 800 });
    }
  }, [rabbit, rabbitX, scene]);

  useEffect(() => {
    if (scene === 'well' || scene === 'leap') {
      tigerX.value = withTiming(width * 0.28, { duration: 800 });
    } else {
      tigerX.value = withTiming(width * 0.42, { duration: 800 });
    }
    tigerY.value = withTiming(tiger === 'leap' ? 120 : 0, { duration: 650, easing: Easing.in(Easing.quad) });
  }, [scene, tiger, tigerX, tigerY]);

  const world = useAnimatedStyle(() => ({
    transform: [{ translateY: cam.value * -70 }],
  }));

  const rabbitStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rabbitX.value }],
  }));

  const tigerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tigerX.value }, { translateY: tigerY.value }],
    opacity: tiger === 'leap' && tigerY.value > 90 ? 0 : 1,
  }));

  const sky = SKY[scene];
  const showWell = scene === 'well' || scene === 'leap';
  const showMeeting = scene === 'meeting';
  const showPeaceWalkers = scene === 'peace';

  return (
    <View style={styles.root}>
      <LinearGradient colors={sky} style={StyleSheet.absoluteFill} />
      <View style={styles.moon} />
      <Fireflies />
      <Animated.View style={[styles.world, world]}>
        <View style={styles.farTrees}>
          <TreeLine variant="far" width={width + 40} height={180} />
        </View>
        <View style={styles.nearTrees}>
          <TreeLine variant="near" width={width + 80} height={210} />
        </View>
        {showMeeting || showPeaceWalkers ? (
          <View style={styles.silhouettes}>
            <AnimalSilhouettes />
          </View>
        ) : null}
        <View style={styles.ground} />
        {showWell ? (
          <View style={styles.well}>
            <Well tigerPose={tiger} splashing={scene === 'leap'} />
          </View>
        ) : null}
        <Animated.View style={[styles.tiger, tigerStyle]}>
          <TigerRig pose={tiger} />
        </Animated.View>
        <Animated.View style={[styles.rabbit, rabbitStyle]}>
          <RabbitRig pose={rabbit} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: colors.background },
  world: { flex: 1 },
  moon: {
    position: 'absolute',
    top: 54,
    right: 36,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F4E6C8',
    opacity: 0.92,
    shadowColor: '#F4E6C8',
    shadowOpacity: 0.55,
    shadowRadius: 18,
  },
  farTrees: { position: 'absolute', bottom: 150, left: -12 },
  nearTrees: { position: 'absolute', bottom: 88, left: -28 },
  silhouettes: { position: 'absolute', bottom: 108, alignSelf: 'center' },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: colors.ground,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  well: { position: 'absolute', bottom: 96, alignSelf: 'center' },
  tiger: { position: 'absolute', bottom: 78 },
  rabbit: { position: 'absolute', bottom: 86 },
});
