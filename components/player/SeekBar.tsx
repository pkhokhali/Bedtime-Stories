import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { t, ui } from '@/constants/ui';
import { Language } from '@/types/story';

type Props = {
  index: number;
  count: number;
  language: Language;
  onSeek: (index: number) => void;
};

export function SeekBar({ index, count, language, onSeek }: Props) {
  const [width, setWidth] = useState(1);
  const max = Math.max(count - 1, 1);
  const ratio = count <= 1 ? 0 : index / max;

  const seekFromX = (x: number) => {
    const next = Math.round((x / width) * max);
    onSeek(Math.max(0, Math.min(count - 1, next)));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          onPress={() => onSeek(index - 1)}
          disabled={index <= 0}
          hitSlop={8}
          style={[styles.skip, index <= 0 && styles.dim]}
          accessibilityLabel="Previous part"
        >
          <Ionicons name="play-skip-back" size={20} color={colors.cream} />
        </Pressable>
        <View
          style={styles.trackHit}
          onLayout={(event) => setWidth(Math.max(1, event.nativeEvent.layout.width))}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(event) => seekFromX(event.nativeEvent.locationX)}
          onResponderMove={(event) => seekFromX(event.nativeEvent.locationX)}
        >
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
            <View style={[styles.thumb, { left: `${ratio * 100}%` }]} />
          </View>
        </View>
        <Pressable
          onPress={() => onSeek(index + 1)}
          disabled={index >= count - 1}
          hitSlop={8}
          style={[styles.skip, index >= count - 1 && styles.dim]}
          accessibilityLabel="Next part"
        >
          <Ionicons name="play-skip-forward" size={20} color={colors.cream} />
        </Pressable>
      </View>
      <Text style={[styles.meta, language === 'ne' && styles.ne]}>
        {t(ui.partOf, language)} {index + 1} / {count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  skip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 230, 200, 0.08)',
  },
  dim: { opacity: 0.35 },
  trackHit: { flex: 1, height: 28, justifyContent: 'center' },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(244, 230, 200, 0.18)',
    overflow: 'visible',
  },
  fill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.amber,
  },
  thumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    marginLeft: -8,
    borderRadius: 8,
    backgroundColor: colors.cream,
  },
  meta: {
    color: colors.creamMuted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  ne: { fontFamily: 'NotoSansDevanagari_600SemiBold' },
});
