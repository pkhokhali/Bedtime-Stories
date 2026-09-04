import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AgeCategoryRow } from '@/components/AgeCategoryRow';
import { SettingsButton } from '@/components/SettingsButton';
import { AdBanner } from '@/components/AdBanner';
import { AtmosphericBackground } from '@/components/background/AtmosphericBackground';
import { SearchTriggerFAB, SearchDiscoveryModal } from '@/components/search';
import { SleepTimerHeaderBadge } from '@/components/sleep';
import { t, ui } from '@/constants/ui';
import { colors, radii, spacing } from '@/constants/theme';
import { ageBands, categoryLabel, storiesForAge } from '@/data/catalog';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useDownloadsStore } from '@/store/useDownloadsStore';
import { downloadStoryMedia, deleteStoryMedia } from '@/lib/downloadManager';
import { Story } from '@/types/story';

export default function LibraryScreen() {
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  const ageBand = useSettingsStore((s) => s.ageBand);
  const band = ageBands.find((item) => item.id === ageBand) ?? ageBands[1];
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const localStories = storiesForAge(ageBand);
  const remoteStoriesAll = useDownloadsStore((s) => s.remoteStories);
  const downloads = useDownloadsStore((s) => s.downloads);
  
  // Remote stories override local metadata but keep local animation beats
  const mergedLocal = localStories.map(ls => {
    const rs = remoteStoriesAll.find(r => r.id === ls.id);
    return rs ? { ...ls, ...rs } : ls;
  });
  
  const remoteStories = remoteStoriesAll.filter((s) => s.ageBand === ageBand);
  const purelyRemote = remoteStories.filter(rs => !localStories.some(ls => ls.id === rs.id));
  const allStories: Story[] = [...mergedLocal, ...purelyRemote];

  const handleDownloadPress = (story: Story) => {
    const dl = downloads[story.id];
    if (dl?.status === 'completed') {
      deleteStoryMedia(story.id);
    } else if (dl?.status !== 'downloading' && story.mediaUrl) {
      downloadStoryMedia(story.id, story.mediaUrl);
    }
  };

  return (
    <AtmosphericBackground style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.side}>
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </Pressable>
        <Text style={[styles.title, language === 'ne' && styles.neBold]}>{t(ui.moreStories, language)}</Text>
        <View style={styles.headerActions}>
          <SleepTimerHeaderBadge />
          <Pressable
            onPress={() => setIsSearchOpen(true)}
            style={styles.headerIconBtn}
            hitSlop={10}
            accessibilityLabel={language === 'ne' ? 'खोज्नुहोस्' : 'Search'}
          >
            <Ionicons name="search-outline" size={20} color={colors.cream} />
          </Pressable>
          <SettingsButton />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        <Text style={[styles.who, language === 'ne' && styles.neBold]}>{t(ui.whoListening, language)}</Text>
        <AgeCategoryRow />
        <Text style={[styles.section, language === 'ne' && styles.neBold]}>
          {t(ui.storiesFor, language)} · {band.ages[language]}
        </Text>
        {allStories.map((story) => {
          const isRemote = !!story.mediaUrl;
          const dl = downloads[story.id];
          const isDownloaded = dl?.status === 'completed';
          const isDownloading = dl?.status === 'downloading';
          
          return (
            <Pressable
              key={story.id}
              style={styles.card}
              onPress={() => router.push(`/story-detail/${story.id}`)}
            >
              <View style={[styles.dot, { backgroundColor: story.accent }]} />
              <View style={styles.body}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[styles.kicker, language === 'ne' && styles.kickerNe]}>
                    {categoryLabel(story, language)}
                  </Text>
                  {(story.isPremium || story.locked) && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(217, 119, 6, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 4, marginBottom: 4 }}>
                      <Ionicons name="lock-closed" size={10} color={colors.amber} />
                      <Text style={{ color: colors.amber, fontSize: 10, fontFamily: 'Nunito_700Bold', textTransform: 'uppercase' }}>Premium</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.cardTitle, language === 'ne' && styles.cardTitleNe]}>
                  {story.title[language]}
                </Text>
                <Text style={[styles.sub, language === 'ne' && styles.subNe]}>
                  {story.subtitle?.[language] || ''}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>
                    {story.runtimeMinutes} {t(ui.minutes, language)}
                  </Text>
                  
                  {isRemote && (
                    <Pressable 
                      style={styles.dlBtn} 
                      onPress={() => handleDownloadPress(story)}
                      hitSlop={12}
                    >
                      {isDownloading ? (
                        <Text style={styles.dlText}>{Math.round(dl.progress * 100)}%</Text>
                      ) : (
                        <Ionicons 
                          name={isDownloaded ? 'checkmark-circle' : 'cloud-download-outline'} 
                          size={20} 
                          color={isDownloaded ? colors.amber : colors.textSubtle} 
                        />
                      )}
                    </Pressable>
                  )}
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      <AdBanner />
      </SafeAreaView>

      {/* FLOATING SEARCH FAB & DISCOVERY MODAL */}
      <SearchTriggerFAB onPress={() => setIsSearchOpen(true)} />
      <SearchDiscoveryModal visible={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </AtmosphericBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  side: { width: 44, alignItems: 'center' },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  title: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
  },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 48 },
  who: {
    color: colors.creamMuted,
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    marginBottom: 10,
    marginTop: 8,
  },
  section: {
    color: colors.amber,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 14,
    marginTop: 22,
    marginBottom: 12,
  },
  neBold: { fontFamily: 'NotoSansDevanagari_700Bold' },
  card: {
    backgroundColor: 'rgba(18, 26, 44, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.12)',
    borderRadius: radii.card,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: 10,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 8 },
  body: { flex: 1 },
  kicker: {
    color: colors.amber,
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  kickerNe: {
    fontFamily: 'NotoSansDevanagari_700Bold',
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: 13,
  },
  cardTitle: {
    color: colors.cream,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 20,
  },
  cardTitleNe: {
    fontFamily: 'NotoSansDevanagari_700Bold',
    lineHeight: 30,
  },
  sub: {
    color: colors.textMuted,
    fontFamily: 'Nunito_500Medium',
    marginTop: 6,
    lineHeight: 22,
  },
  subNe: {
    fontFamily: 'NotoSansDevanagari_400Regular',
    lineHeight: 26,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  meta: {
    color: colors.textSubtle,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
  },
  dlBtn: {
    padding: 4,
  },
  dlText: {
    color: colors.amber,
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
  },
});
