import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors, radii, spacing } from '@/constants/theme';
import { useSettingsStore } from '@/store/useSettingsStore';
import { SOUNDSCAPES, SoundscapeId } from '@/lib/sounds';
import {
  getActiveSoundscape,
  isSoundscapePlaying,
  playContinuousSoundscape,
  setContinuousSoundscapeVolume,
  stopContinuousSoundscape,
} from '@/lib/audio';

interface SoundscapesPlayerProps {
  compact?: boolean;
}

export function SoundscapesPlayer({ compact = false }: SoundscapesPlayerProps) {
  const language = useSettingsStore((s) => s.language);
  const isNe = language === 'ne';

  const storedSoundscape = useSettingsStore((s) => s.activeSoundscape);
  const storedVolume = useSettingsStore((s) => s.soundscapeVolume);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  const [selectedId, setSelectedId] = useState<SoundscapeId>(storedSoundscape || 'rain');
  const [isPlaying, setIsPlaying] = useState(isSoundscapePlaying());
  const [volume, setVolumeState] = useState(storedVolume ?? 0.5);

  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isPlaying) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 800 }),
          withTiming(0.94, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      pulse.value = 1;
    }
  }, [isPlaying, pulse]);

  const animatedWaveStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handleSelect = (id: SoundscapeId) => {
    setSelectedId(id);
    updateSetting('activeSoundscape', id);
    if (isPlaying) {
      playContinuousSoundscape(id, volume).catch(() => undefined);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopContinuousSoundscape().catch(() => undefined);
      setIsPlaying(false);
    } else {
      playContinuousSoundscape(selectedId, volume).catch(() => undefined);
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1, Math.round(newVol * 10) / 10));
    setVolumeState(clamped);
    updateSetting('soundscapeVolume', clamped);
    setContinuousSoundscapeVolume(clamped);
  };

  const activeMeta = SOUNDSCAPES.find((s) => s.id === selectedId) || SOUNDSCAPES[0];

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Sound Selection Chips */}
      <View style={styles.chipsRow}>
        {SOUNDSCAPES.map((item) => {
          const isSelected = selectedId === item.id;
          const isItemActive = isSelected && isPlaying;
          return (
            <Pressable
              key={item.id}
              onPress={() => handleSelect(item.id)}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                isItemActive && styles.chipActivePlaying,
              ]}
              hitSlop={4}
            >
              <Ionicons
                name={item.icon as any}
                size={16}
                color={isSelected ? colors.amber : colors.creamMuted}
              />
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                  isNe && styles.neBold,
                ]}
                numberOfLines={1}
              >
                {item.title[language]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Main Control Strip */}
      <View style={styles.controlCard}>
        <View style={styles.soundInfo}>
          <Text style={[styles.soundTitle, isNe && styles.neBold]}>
            {activeMeta.title[language]}
          </Text>
          <Text style={[styles.soundSubtitle, isNe && styles.neRegular]}>
            {activeMeta.subtitle[language]}
          </Text>
        </View>

        {/* Play/Pause Button */}
        <Pressable
          onPress={handleTogglePlay}
          style={[styles.playBtn, isPlaying && styles.playBtnActive]}
          hitSlop={8}
          accessibilityLabel={
            isPlaying
              ? isNe
                ? 'आवाज रोक्नुहोस्'
                : 'Pause soundscape'
              : isNe
              ? 'आवाज बजाउनुहोस्'
              : 'Play soundscape'
          }
        >
          <Animated.View style={animatedWaveStyle}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={22}
              color={isPlaying ? colors.background : colors.cream}
            />
          </Animated.View>
        </Pressable>
      </View>

      {/* Volume Adjustment Row */}
      <View style={styles.volumeRow}>
        <Pressable
          onPress={() => handleVolumeChange(volume - 0.1)}
          hitSlop={8}
          disabled={volume <= 0}
          style={styles.volStepBtn}
        >
          <Ionicons
            name="volume-low-outline"
            size={18}
            color={volume <= 0 ? colors.textSubtle : colors.creamMuted}
          />
        </Pressable>

        {/* Volume Level Segments */}
        <View style={styles.volumeTrack}>
          {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((step) => {
            const isFilled = volume >= step - 0.05;
            return (
              <Pressable
                key={step}
                onPress={() => handleVolumeChange(step)}
                style={[
                  styles.volSegment,
                  isFilled && styles.volSegmentFilled,
                ]}
              />
            );
          })}
        </View>

        <Pressable
          onPress={() => handleVolumeChange(volume + 0.1)}
          hitSlop={8}
          disabled={volume >= 1}
          style={styles.volStepBtn}
        >
          <Ionicons
            name="volume-high-outline"
            size={18}
            color={volume >= 1 ? colors.textSubtle : colors.creamMuted}
          />
        </Pressable>

        <Text style={styles.volText}>{Math.round(volume * 100)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(18, 26, 44, 0.72)',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.15)',
    padding: spacing.lg,
    marginVertical: spacing.sm,
  },
  containerCompact: {
    padding: spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.1)',
  },
  chipSelected: {
    backgroundColor: 'rgba(232, 160, 74, 0.18)',
    borderColor: colors.amber,
  },
  chipActivePlaying: {
    borderColor: colors.amber,
    backgroundColor: 'rgba(232, 160, 74, 0.28)',
  },
  chipText: {
    color: colors.creamMuted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
  },
  chipTextSelected: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
  },
  controlCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(12, 18, 34, 0.6)',
    borderRadius: radii.chip,
    padding: 12,
    marginBottom: 12,
  },
  soundInfo: {
    flex: 1,
  },
  soundTitle: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
  },
  soundSubtitle: {
    color: colors.creamMuted,
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
    marginTop: 2,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(232, 160, 74, 0.2)',
    borderWidth: 1,
    borderColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtnActive: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  volStepBtn: {
    padding: 4,
  },
  volumeTrack: {
    flex: 1,
    flexDirection: 'row',
    height: 14,
    alignItems: 'center',
    gap: 4,
  },
  volSegment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  volSegmentFilled: {
    backgroundColor: colors.amber,
  },
  volText: {
    color: colors.creamMuted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    width: 38,
    textAlign: 'right',
  },
  neBold: {
    fontFamily: 'NotoSansDevanagari_700Bold',
  },
  neRegular: {
    fontFamily: 'NotoSansDevanagari_400Regular',
  },
});
