import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { SettingsButton } from '@/components/SettingsButton';
import { StoryCarousel } from '@/components/StoryCarousel';
import { StoryCardSkeleton } from '@/components/StoryCardSkeleton';
import { AtmosphericBackground } from '@/components/background/AtmosphericBackground';
import { SearchTriggerFAB, SearchDiscoveryModal } from '@/components/search';
import {
  NightLightModal,
  SleepTimerHeaderBadge,
  SoundscapesPlayer,
} from '@/components/sleep';
import { brand, colors, radii, spacing } from '@/constants/theme';
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNightLightOpen, setIsNightLightOpen] = useState(false);

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
    <AtmosphericBackground style={styles.root}>
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
            colors={['transparent', 'rgba(12, 18, 34, 0.85)', '#060913']}
            style={styles.heroGradient}
          />

          <SafeAreaView style={styles.headerSafe} edges={['top']}>
            <View style={styles.header}>
              <Text style={[styles.brand, isNe && styles.neBold]}>
                {isNe ? (brand.nameNe || 'साँझ') : brand.name}
              </Text>
              <View style={styles.headerActions}>
                <SleepTimerHeaderBadge />
                <Pressable
                  onPress={() => setIsSearchOpen(true)}
                  style={styles.headerIconBtn}
                  hitSlop={10}
                  accessibilityLabel={isNe ? 'खोज्नुहोस्' : 'Search'}
                >
                  <Ionicons name="search-outline" size={20} color={colors.cream} />
                </Pressable>
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
                  onPress={() => router.push(('/story/' + featuredStory.id) as any)}
                >
                  <Ionicons name="play" size={22} color="#000" />
                  <Text style={[styles.playButtonText, isNe && styles.neBold]}>
                    {t(ui.play, language)}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.detailsButton}
                  onPress={() => router.push(('/story-detail/' + featuredStory.id) as any)}
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

        {/* BEDTIME AMBIANCE & SOUNDSCAPES SECTION */}
        <View style={styles.ambianceSection}>
          <View style={styles.ambianceHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="moon" size={18} color={colors.amber} />
              <Text style={[styles.ambianceTitle, isNe && styles.neBold]}>
                {isNe ? 'सुत्ने वातावरण र आवाज' : 'Bedtime Ambiance & Soundscapes'}
              </Text>
            </View>
            <Pressable
              onPress={() => setIsNightLightOpen(true)}
              style={styles.nightLightQuickBtn}
              hitSlop={8}
            >
              <Ionicons name="bulb-outline" size={15} color={colors.amber} />
              <Text style={[styles.nightLightQuickText, isNe && styles.neBold]}>
                {isNe ? 'नाइट लाइट' : 'Night Light'}
              </Text>
            </Pressable>
          </View>
          <SoundscapesPlayer compact />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FLOATING SEARCH FAB & DISCOVERY MODAL */}
      <SearchTriggerFAB onPress={() => setIsSearchOpen(true)} />
      <SearchDiscoveryModal visible={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* BEDTIME NIGHT LIGHT MODAL */}
      <NightLightModal
        visible={isNightLightOpen}
        onClose={() => setIsNightLightOpen(false)}
      />
    </AtmosphericBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
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
    backgroundColor: 'rgba(18, 26, 44, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.15)',
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
    backgroundColor: colors.amber,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: radii.pill,
    gap: 8,
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonText: {
    color: '#1a1a1a',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 16,
  },
  detailsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radii.pill,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  detailsButtonText: {
    color: '#fff',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 16,
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
  ambianceSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  ambianceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ambianceTitle: {
    color: colors.amber,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  nightLightQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(232, 160, 74, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.25)',
  },
  nightLightQuickText: {
    color: colors.amber,
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
  },
});

