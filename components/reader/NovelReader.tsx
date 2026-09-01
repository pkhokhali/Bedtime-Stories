import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SleepFade } from '@/components/player/SleepFade';
import { colors, radii, spacing } from '@/constants/theme';
import { t, ui } from '@/constants/ui';
import { isGrownListening } from '@/data/catalog';
import { useStoryPlayback } from '@/hooks/useStoryPlayback';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Story } from '@/types/story';

function KeepScreenAwake() {
  useKeepAwake();
  return null;
}

interface NovelReaderProps {
  story: Story;
}

export default function NovelReader({ story }: NovelReaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const language = useSettingsStore((s) => s.language);
  const keepAwake = useSettingsStore((s) => s.keepAwake);

  const [fontSize, setFontSize] = useState(18);

  const beats = story.beats || [];
  const playback = useStoryPlayback(beats, language, story.stage);

  const totalPages = Math.max(1, beats.length);
  const currentPage = Math.min(playback.index, totalPages - 1);
  const currentBeat = beats[currentPage];

  const handleDecreaseFont = () => {
    setFontSize((prev) => Math.max(14, prev - 2));
  };

  const handleIncreaseFont = () => {
    setFontSize((prev) => Math.min(28, prev + 2));
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      playback.seekTo(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      playback.seekTo(currentPage + 1);
    }
  };

  const isNepali = language === 'ne';
  const progressRatio = totalPages > 0 ? (currentPage + 1) / totalPages : 0;

  const currentText = currentBeat?.text?.[language] || '';
  const storyTitle = story.title[language] || story.title.en;
  const storySubtitle = story.subtitle?.[language] || story.subtitle?.en;

  const toNepaliNumber = (num: number): string => {
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return String(num)
      .split('')
      .map((d) => nepaliDigits[Number(d)] ?? d)
      .join('');
  };

  const pageLabel = isNepali
    ? `${toNepaliNumber(currentPage + 1)} ${t(ui.of, language)} ${toNepaliNumber(totalPages)} ${t(ui.pageOf, language)}`
    : `${t(ui.pageOf, language)} ${currentPage + 1} ${t(ui.of, language)} ${totalPages}`;

  return (
    <View style={styles.container}>
      {playback.status === 'playing' && keepAwake ? <KeepScreenAwake /> : null}

      {/* Top Header & Toolbar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable
          onPress={() => {
            playback.stop();
            router.back();
          }}
          hitSlop={12}
          style={styles.headerButton}
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text
            numberOfLines={1}
            style={[styles.headerTitle, isNepali && styles.neBold]}
          >
            {storyTitle}
          </Text>
        </View>

        {/* Font Scaling Controls [A-] [A+] */}
        <View style={styles.fontControls}>
          <Pressable
            onPress={handleDecreaseFont}
            disabled={fontSize <= 14}
            hitSlop={8}
            style={[styles.fontButton, fontSize <= 14 && styles.disabledButton]}
            accessibilityLabel={t(ui.decreaseFont, language)}
          >
            <Text style={styles.fontButtonText}>A-</Text>
          </Pressable>
          <Pressable
            onPress={handleIncreaseFont}
            disabled={fontSize >= 28}
            hitSlop={8}
            style={[styles.fontButton, fontSize >= 28 && styles.disabledButton]}
            accessibilityLabel={t(ui.increaseFont, language)}
          >
            <Text style={styles.fontButtonText}>A+</Text>
          </Pressable>
        </View>
      </View>

      {/* Novel Reading Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progressRatio * 100}%` }]} />
      </View>

      {/* Page Content View */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageCard}>
          {/* Chapter / Story Title header on first page */}
          {currentPage === 0 && (
            <View style={styles.novelHeroHeader}>
              <Text style={[styles.novelMainTitle, isNepali && styles.neBold]}>
                {storyTitle}
              </Text>
              {storySubtitle ? (
                <Text style={[styles.novelSubtitle, isNepali && styles.neRegular]}>
                  {storySubtitle}
                </Text>
              ) : null}
              <View style={styles.headerDivider} />
            </View>
          )}

          {/* Beat / Page Body Text */}
          <Text
            style={[
              styles.bodyText,
              {
                fontSize,
                lineHeight: Math.round(fontSize * 1.75),
              },
              isNepali ? styles.neRegular : styles.enFont,
            ]}
          >
            {currentText}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Floating Control Dock */}
      <View style={[styles.bottomDock, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={styles.dockRow}>
          {/* Previous Page Button */}
          <Pressable
            onPress={handlePrevPage}
            disabled={currentPage <= 0}
            style={[styles.pageNavButton, currentPage <= 0 && styles.disabledNavButton]}
            hitSlop={12}
            accessibilityLabel={t(ui.previousPage, language)}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={currentPage <= 0 ? colors.textSubtle : colors.cream}
            />
          </Pressable>

          {/* Prominent Read Aloud Button */}
          <Pressable
            onPress={playback.toggle}
            style={[
              styles.readAloudButton,
              playback.status === 'playing' && styles.readAloudActive,
            ]}
            accessibilityLabel={
              playback.status === 'playing'
                ? t(ui.pauseReading, language)
                : t(ui.readAloud, language)
            }
          >
            <Ionicons
              name={playback.status === 'playing' ? 'pause' : 'volume-high'}
              size={20}
              color={playback.status === 'playing' ? colors.background : colors.cream}
            />
            <Text
              style={[
                styles.readAloudText,
                playback.status === 'playing' && styles.readAloudTextActive,
                isNepali && styles.neBold,
              ]}
            >
              {playback.status === 'playing'
                ? t(ui.pauseReading, language)
                : t(ui.readAloud, language)}
            </Text>
          </Pressable>

          {/* Next Page Button */}
          <Pressable
            onPress={handleNextPage}
            disabled={currentPage >= totalPages - 1}
            style={[
              styles.pageNavButton,
              currentPage >= totalPages - 1 && styles.disabledNavButton,
            ]}
            hitSlop={12}
            accessibilityLabel={t(ui.nextPage, language)}
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={currentPage >= totalPages - 1 ? colors.textSubtle : colors.cream}
            />
          </Pressable>
        </View>

        {/* Page Indicator Footer */}
        <View style={styles.pageIndicatorRow}>
          <Text style={[styles.pageIndicatorText, isNepali && styles.neRegular]}>
            {pageLabel}
          </Text>
        </View>
      </View>

      {/* Sleep Fade Completion Overlay */}
      <SleepFade
        visible={playback.status === 'done'}
        language={language}
        adult={isGrownListening(story.ageBand)}
        onPress={() => {
          playback.stop();
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0E14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: '#0B0E14',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  headerTitle: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#161B26',
    borderRadius: radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(244, 230, 200, 0.1)',
  },
  fontButton: {
    width: 30,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  fontButtonText: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
  },
  disabledButton: {
    opacity: 0.35,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(244, 230, 200, 0.08)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.amber,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 130,
  },
  pageCard: {
    backgroundColor: '#161B26',
    borderRadius: 20,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(244, 230, 200, 0.08)',
    minHeight: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  novelHeroHeader: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  novelMainTitle: {
    color: colors.amber,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 6,
  },
  novelSubtitle: {
    color: colors.creamMuted,
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  headerDivider: {
    width: 48,
    height: 2,
    backgroundColor: 'rgba(232, 160, 74, 0.3)',
    borderRadius: radii.pill,
    marginTop: spacing.md,
  },
  bodyText: {
    color: '#F4E6C8',
    letterSpacing: 0.3,
  },
  enFont: {
    fontFamily: 'Nunito_500Medium',
  },
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(11, 14, 20, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(244, 230, 200, 0.1)',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  dockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  pageNavButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: 'rgba(244, 230, 200, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledNavButton: {
    opacity: 0.3,
    borderColor: 'transparent',
  },
  readAloudButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  readAloudActive: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  readAloudText: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
  },
  readAloudTextActive: {
    color: colors.background,
  },
  pageIndicatorRow: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  pageIndicatorText: {
    color: colors.textSubtle,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.4,
  },
  neBold: {
    fontFamily: 'NotoSansDevanagari_700Bold',
    textTransform: 'none',
    letterSpacing: 0,
  },
  neRegular: {
    fontFamily: 'NotoSansDevanagari_400Regular',
  },
});
