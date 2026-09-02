import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, Pressable, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing } from '@/constants/theme';
import { t, ui } from '@/constants/ui';
import { getStory, ageBands } from '@/data/catalog';
import { AtmosphericBackground } from '@/components/background/AtmosphericBackground';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useDownloadsStore } from '@/store/useDownloadsStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  const isNe = language === 'ne';

  const localStory = getStory(id as string);
  const remoteStories = useDownloadsStore((s) => s.remoteStories);
  const remoteStory = remoteStories.find((s) => s.id === id);
  const story = localStory
    ? (remoteStory ? { ...localStory, ...remoteStory } : localStory)
    : remoteStory;

  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const favorited = story?.id ? isFavorite(story.id) : false;

  const heartScale = useRef(new Animated.Value(1)).current;

  const handleToggleFavorite = () => {
    if (!story?.id) return;
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    toggleFavorite(story.id);
  };

  if (!story || !story.id) {
    return (
      <AtmosphericBackground style={styles.root}>
        <SafeAreaView style={styles.errorSafe}>
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.amber} style={{ marginBottom: 16 }} />
            <Text style={[styles.errorText, isNe && styles.neBold]}>
              {t(ui.storyNotFound, language)}
            </Text>
            <Pressable onPress={() => router.back()} style={styles.backErrorBtn}>
              <Text style={[styles.backErrorBtnText, isNe && styles.neBold]}>
                {t(ui.goBack, language)}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </AtmosphericBackground>
    );
  }

  const band = ageBands.find((b) => b.id === story.ageBand);
  const secondaryLang = language === 'ne' ? 'en' : 'ne';
  const secondaryTitle = story.title?.[secondaryLang];

  return (
    <AtmosphericBackground style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Cover / Gradient Hero */}
        <View style={styles.heroWrapper}>
          {story.coverImage ? (
            <ImageBackground source={{ uri: story.coverImage }} style={styles.coverImage}>
              <LinearGradient
                colors={['rgba(6,9,19,0.3)', 'transparent', '#060913']}
                style={StyleSheet.absoluteFill}
              />
            </ImageBackground>
          ) : (
            <View style={[styles.gradientPlaceholder, { backgroundColor: story.accent || colors.surface }]}>
              <Ionicons name="moon-outline" size={64} color="rgba(255,255,255,0.25)" />
              <LinearGradient
                colors={['transparent', 'rgba(6,9,19,0.6)', '#060913']}
                style={StyleSheet.absoluteFill}
              />
            </View>
          )}

          {/* Top Bar with Back and Favorite Toggle */}
          <SafeAreaView edges={['top']} style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.circleBtn} hitSlop={12}>
              <Ionicons name="chevron-back" size={24} color={colors.cream} />
            </Pressable>
            <Pressable onPress={handleToggleFavorite} style={styles.circleBtn} hitSlop={12}>
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Ionicons
                  name={favorited ? 'heart' : 'heart-outline'}
                  size={24}
                  color={favorited ? '#E05353' : colors.cream}
                />
              </Animated.View>
            </Pressable>
          </SafeAreaView>
        </View>

        {/* Content Body */}
        <View style={styles.body}>
          {/* Category Tag */}
          <Text style={[styles.categoryTag, isNe && styles.neBold]}>
            {story.form === 'novel'
              ? (isNe ? 'उपन्यास' : 'NOVEL')
              : (isNe ? 'सुत्ने बेलाको कथा' : 'BEDTIME STORY')}
          </Text>

          {/* Primary Bilingual Title */}
          <Text style={[styles.title, isNe ? styles.neTitle : styles.enTitle]}>
            {story.title?.[language] || story.title?.en}
          </Text>

          {/* Secondary Subtitle Title */}
          {secondaryTitle && (
            <Text style={[styles.secondaryTitle, !isNe && styles.neSubTitle]}>
              {secondaryTitle}
            </Text>
          )}

          {/* Subtitle / Description */}
          {story.subtitle && (
            <Text style={[styles.subtitle, isNe ? styles.neRegular : styles.enRegular]}>
              {story.subtitle[language] || story.subtitle.en}
            </Text>
          )}

          {/* Metadata Badges */}
          <View style={styles.badgeRow}>
            {band && (
              <View style={styles.badge}>
                <Ionicons name={(band.icon as any) || 'sparkles'} size={14} color={colors.amber} />
                <Text style={[styles.badgeText, isNe && styles.neBold]}>
                  {isNe ? `उमेर ${band.ages.ne}` : `Ages ${band.ages.en}`}
                </Text>
              </View>
            )}
            {story.runtimeMinutes && (
              <View style={styles.badge}>
                <Ionicons name="time-outline" size={14} color={colors.amber} />
                <Text style={[styles.badgeText, isNe && styles.neBold]}>
                  {story.runtimeMinutes} {isNe ? 'मिनेट' : 'min'}
                </Text>
              </View>
            )}
            <View style={styles.badge}>
              <Ionicons name="language-outline" size={14} color={colors.amber} />
              <Text style={styles.badgeText}>EN / NE</Text>
            </View>
          </View>

          {/* Moral / Lesson Card */}
          {story.theme && (
            <View style={styles.moralCard}>
              <View style={styles.moralHeader}>
                <Ionicons name="bulb-outline" size={18} color={colors.amber} />
                <Text style={[styles.moralTitle, isNe && styles.neBold]}>
                  {t(ui.lessonAndMeaning, language)}
                </Text>
              </View>
              <Text style={[styles.moralText, isNe ? styles.neRegular : styles.enRegular]}>
                "{story.theme[language] || story.theme.en}"
              </Text>
            </View>
          )}

          {/* Action CTA Button */}
          <Pressable
            style={styles.playButton}
            onPress={() => router.push(`/story/${story.id}`)}
          >
            <Ionicons name="play" size={24} color="#000" />
            <Text style={[styles.playButtonText, isNe && styles.neBold]}>
              {story.form === 'novel'
                ? t(ui.listenToNovel, language)
                : t(ui.playStory, language)}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </AtmosphericBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  errorSafe: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  heroWrapper: {
    width: '100%',
    height: 380,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  gradientPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 20,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(18, 26, 44, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  categoryTag: {
    color: colors.amber,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: colors.cream,
    fontSize: 28,
    lineHeight: 36,
    marginBottom: 4,
  },
  enTitle: {
    fontFamily: 'Nunito_800ExtraBold',
  },
  neTitle: {
    fontFamily: 'NotoSansDevanagari_700Bold',
    lineHeight: 38,
  },
  secondaryTitle: {
    color: colors.textMuted,
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 12,
  },
  neSubTitle: {
    fontFamily: 'NotoSansDevanagari_600SemiBold',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 18,
  },
  enRegular: {
    fontFamily: 'Nunito_500Medium',
  },
  neRegular: {
    fontFamily: 'NotoSansDevanagari_400Regular',
    lineHeight: 26,
  },
  neBold: {
    fontFamily: 'NotoSansDevanagari_700Bold',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 26, 44, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.chip,
    gap: 6,
  },
  badgeText: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
  },
  moralCard: {
    backgroundColor: 'rgba(18, 26, 44, 0.72)',
    borderColor: 'rgba(232, 160, 74, 0.25)',
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: 24,
  },
  moralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  moralTitle: {
    color: colors.amber,
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
  },
  moralText: {
    color: colors.cream,
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  playButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radii.pill,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  playButtonText: {
    color: '#000',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 17,
  },
  errorBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  backErrorBtn: {
    backgroundColor: 'rgba(18, 26, 44, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.pill,
  },
  backErrorBtnText: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
  },
});
