import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { t, ui } from '@/constants/ui';
import { colors } from '@/constants/theme';
import { Language } from '@/types/story';

type Props = {
  visible: boolean;
  language: Language;
  adult?: boolean;
  onPress: () => void;
};

export function SleepFade({ visible, language, adult, onPress }: Props) {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeIn.duration(1800)} exiting={FadeOut} style={styles.cover}>
      <Pressable style={styles.hit} onPress={onPress}>
        <Text style={styles.dreams}>
          {t(adult ? ui.sweetDreamsAdult : ui.sweetDreams, language)}
        </Text>
        <Text style={styles.hint}>{t(ui.tapToWake, language)}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#070504',
    zIndex: 20,
  },
  hit: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  dreams: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 22,
    textAlign: 'center',
  },
  hint: {
    color: colors.textSubtle,
    fontFamily: 'Nunito_500Medium',
    marginTop: 14,
    fontSize: 14,
  },
});
