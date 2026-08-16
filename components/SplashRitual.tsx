import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { brand, colors } from '@/constants/theme';

type Props = {
  onDone: () => void;
};

export function SplashRitual({ onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.skyTop, colors.skyMid, colors.skyHorizon]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.moon} />
      <View style={styles.copy}>
        <Text style={styles.ne}>{brand.nameNe}</Text>
        <Text style={styles.en}>{brand.name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    zIndex: 50,
  },
  moon: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.cream,
  },
  copy: {
    position: 'absolute',
    bottom: 96,
    alignSelf: 'center',
    alignItems: 'center',
  },
  ne: {
    color: colors.amber,
    fontFamily: 'NotoSansDevanagari_700Bold',
    fontSize: 36,
  },
  en: {
    color: colors.creamMuted,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
