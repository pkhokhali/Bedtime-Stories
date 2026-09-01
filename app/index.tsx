import React from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { SettingsButton } from '@/components/SettingsButton';
import { StoryCarousel } from '@/components/StoryCarousel';
import { StoryCardSkeleton } from '@/components/StoryCardSkeleton';
import { brand, colors, radii } from '@/constants/theme';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useDownloadsStore } from '@/store/useDownloadsStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { stories as allLocalStories } from '@/data/catalog';
import { t, ui } from '@/constants/ui';
import { fetchRemoteCatalog } from '@/lib/catalogFetcher';

export default function HomeScreen() {
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  const isNe = language === 'ne';

  const remoteStoriesAll = useDownloadsStore((s) => s.remoteStories);
  const isLoadingCatalog = useDownloadsStore((s) => s.isLoadingCatalog);
  const catalogError = useDownloadsStore((s) => s.catalogError);
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);

  // Merge all stories across all age bands for the global catalog
  const mergedStories = allLocalStories.map((ls) => {
    const rs = remoteStoriesAll.find((r) => r.id === ls.id);
    return rs ? { ...ls, ...rs } : ls;
  });
  const purelyRemote = remoteStoriesAll.filter((rs) => !allLocalStories.some((ls) => ls.id === rs.id));
  const fullCatalog = [...mergedStories, ...purelyRemote];

  // Filter into categories
  const featuredStory = fullCatalog[0];
  const favoriteStories = fullCatalog.filter((s) => favoriteIds.includes(s.id));
  const toddlers = fullCatalog.filter((s) => s.ageBand === '2-4' || s.ageBand === '4-6');
  const kids = fullCatalog.filter((s) => s.ageBand === '6-8' || s.ageBand === '9-12');
  const parents = fullCatalog.filter((s) => s.ageBand === 'parents' || s.ageBand === '25+');
  const teens = fullCatalog.filter((s) => s.ageBand === '13-17' || s.ageBand === '18-25');

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* HERO SECTION */}
        <View style={styles.heroContainer}>
          {featuredStory?.coverImage ? (
            <ImageBackground source={{ uri: featuredStory.coverImage }} style={styles.heroImage} />
          ) : (
            <View
              style={[
                styles.heroImage,
                {
                  backgroundColor: featuredStory?.accent || colors.forestFar,
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 40,
                },
              ]}
            >
              <Text
                style={[
                  styles.heroPlaceholderText,
                  isNe && styles.neBold,
                ]}
              >
                {featuredStory?.title[language] || featuredStory?.title.en}
              </Text>
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(15,23,42,0.8)', colors.background]}
            style={styles.heroGradient}
          />

          <SafeAreaView style={styles.headerSafe} edges={['top']}>
            <View style={styles.header}>
              <Text style={[styles.brand, isNe && styles.neBold]}>
                {isNe ? (brand.nameNe || 'साँझ') : brand.name}
              </Text>
              <View style={styles.headerActions}>
                <Pressable
                  onPress={() => router.push('/library')}
                  style={styles.headerIconBtn}
                  hitSlop={10}
                  accessibilityLabel={isNe ? 'पुस्तकालय' : 'Library'}
                >
                  <Ionicons name="albums-outline" size={22} color={colors.cream} />
                </Pressable>
                <SettingsButton />
              </View>
            </View>
          </SafeAreaView>

          {featuredStory && (
            <View style={styles.heroContent}>
              {/* Kicker: भर्खरै थपिएका / Recently Added */}
              <Text style={[styles.heroKicker, isNe && styles.neBold]}>
                {t(ui.recentlyAdded, language)}
              </Text>
              <Text style={[styles.heroTitle, isNe && styles.neTitle]}>
                {featuredStory.title[language] || featuredStory.title.en}
              </Text>

              <View style={styles.heroButtons}>
                <Pressable
                  style={styles.playButton}
                  onPress={() => router.push('/story/' + featuredStory.id)}
                >
                  <Ionicons name="play" size={22} color="#000" />
                  <Text style={[styles.playButtonText, isNe && styles.neBold]}>
                    {t(ui.play, language)}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.detailsButton}
                  onPress={() => router.push('/story-detail/' + featuredStory.id)}
                >
                  <Ionicons name="information-circle-outline" size={22} color="#fff" />
                  <Text style={[styles.detailsButtonText, isNe && styles.neBold]}>
                    {t(ui.details, language)}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* ERROR / OFFLINE RETRY BANNER */}
        {catalogError && (
          <View style={styles.errorBanner}>
            <Ionicons name="cloud-offline-outline" size={22} color={colors.amber} />
            <Text style={[styles.errorBannerText, isNe && styles.neRegular]}>
              {t(ui.offlineNotice, language)}
            </Text>
            <Pressable
              onPress={() => fetchRemoteCatalog()}
              style={styles.retryBtn}
              hitSlop={8}
            >
              <Text style={[styles.retryText, isNe && styles.neBold]}>
                {t(ui.retry, language)}
              </Text>
            </Pressable>
          </View>
        )}

        {/* CAROUSELS OR SKELETON LOADERS */}
        <View style={styles.carouselsContainer}>
          {isLoadingCatalog && fullCatalog.length === 0 ? (
            <>
              <StoryCardSkeleton count={4} />
              <StoryCardSkeleton count={4} />
              <StoryCardSkeleton count={4} />
            </>
          ) : (
            <>
              {favoriteStories.length > 0 && (
                <StoryCarousel
                  title={t(ui.myFavorites, language)}
                  stories={favoriteStories}
                />
              )}
              {/* For Little Ones / साना बाबुनानीका लागि */}
              <StoryCarousel
                title={t(ui.forLittleOnes, language)}
                stories={toddlers}
              />
              {/* Kids & Tweens / बालबालिकाका लागि */}
              <StoryCarousel
                title={t(ui.kidsAndTweens, language)}
                stories={kids}
              />
              {/* After Hours Parents / अभिभावकका लागि */}
              <StoryCarousel
                title={t(ui.afterHoursParents, language)}
                stories={parents}
              />
              {/* Young Adults / किशोरकिशोरीका लागि */}
              <StoryCarousel
                title={t(ui.youngAdults, language)}
                stories={teens}
              />
            </>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroContainer: {
    width: '100%',
    height: 550,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroPlaceholderText: {
    fontSize: 42,
    color: 'rgba(255,255,255,0.25)',
    fontFamily: 'Nunito_800ExtraBold',
    textAlign: 'center',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 320,
  },
  headerSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brand: {
    color: '#fff',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 24,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroContent: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroKicker: {
    color: colors.amber,
    fontFamily: 'Nunito_800ExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 12,
    marginBottom: 8,
  },
  heroTitle: {
    color: '#fff',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 36,
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  neTitle: {
    fontFamily: 'NotoSansDevanagari_700Bold',
    lineHeight: 46,
  },
  neBold: {
    fontFamily: 'NotoSansDevanagari_700Bold',
  },
  neRegular: {
    fontFamily: 'NotoSansDevanagari_400Regular',
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 14,
  },
  playButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: radii.pill,
    gap: 8,
    elevation: 3,
  },
  playButtonText: {
    color: '#000',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 15,
  },
  detailsButton: {
    backgroundColor: 'rgba(81, 84, 91, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radii.pill,
    gap: 8,
  },
  detailsButtonText: {
    color: '#fff',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 15,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.35)',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.card,
    gap: 10,
  },
  errorBannerText: {
    flex: 1,
    color: colors.cream,
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
  },
  retryBtn: {
    backgroundColor: colors.amber,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.chip,
  },
  retryText: {
    color: '#000',
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
  },
  carouselsContainer: {
    paddingTop: 16,
  },
});
