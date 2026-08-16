import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t, ui } from '@/constants/ui';
import { colors } from '@/constants/theme';
import { Language } from '@/types/story';

type Props = {
  language: Language;
  playing: boolean;
  onBack: () => void;
  onTogglePlay: () => void;
};

export function PlayerChrome({ language, playing, onBack, onTogglePlay }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.row, { top: insets.top + 8 }]} pointerEvents="box-none">
      <Pressable onPress={onBack} style={styles.icon} accessibilityLabel="Close">
        <Ionicons name="chevron-back" size={22} color={colors.cream} />
      </Pressable>
      <Pressable onPress={onTogglePlay} style={styles.icon} accessibilityLabel={playing ? 'Pause' : 'Play'}>
        <Ionicons name={playing ? 'pause' : 'play'} size={18} color={colors.cream} />
        <Text style={styles.label}>{playing ? t(ui.pause, language) : t(ui.resume, language)}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(18, 12, 8, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 22,
  },
  label: {
    color: colors.cream,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
  },
});
